/*
  # Data Migration Strategy for Weekly Schedules
  
  This migration provides a strategy for handling old data and transitioning
  from the current system to the new weekly schedule system.
  
  Migration Phases:
    1. Keep existing data intact
    2. Create new weekly tables
    3. Migrate templates
    4. Migrate time slots
    5. Provide backward compatibility
    6. Clean up old data (optional)
*/

-- Phase 1: Create backup of existing data
CREATE TABLE IF NOT EXISTS doctor_schedules_backup AS 
SELECT * FROM doctor_schedules;

CREATE TABLE IF NOT EXISTS time_slots_backup AS 
SELECT * FROM time_slots;

-- Phase 2: Create migration status table
CREATE TABLE IF NOT EXISTS migration_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_name text UNIQUE NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  records_processed integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Phase 3: Migration functions
CREATE OR REPLACE FUNCTION migrate_doctor_schedules_to_weekly()
RETURNS void AS $$
DECLARE
  schedule_record RECORD;
  migration_id uuid;
BEGIN
  -- Create migration record
  INSERT INTO migration_status (migration_name, status, started_at)
  VALUES ('doctor_schedules_to_weekly', 'in_progress', now())
  RETURNING id INTO migration_id;
  
  -- Migrate each doctor schedule to template
  FOR schedule_record IN 
    SELECT * FROM doctor_schedules 
    WHERE NOT EXISTS (
      SELECT 1 FROM doctor_weekly_schedules 
      WHERE doctor_weekly_schedules.doctor_id = doctor_schedules.doctor_id 
      AND doctor_weekly_schedules.day_of_week = doctor_schedules.day_of_week
      AND doctor_weekly_schedules.is_template = true
    )
  LOOP
    INSERT INTO doctor_weekly_schedules (
      doctor_id, 
      schedule_date, 
      day_of_week, 
      start_time, 
      end_time, 
      slot_duration_minutes, 
      break_start_time, 
      break_end_time, 
      is_available, 
      is_template
    ) VALUES (
      schedule_record.doctor_id,
      '1900-01-01'::date, -- Template date
      schedule_record.day_of_week,
      schedule_record.start_time,
      schedule_record.end_time,
      schedule_record.slot_duration_minutes,
      schedule_record.break_start_time,
      schedule_record.break_end_time,
      schedule_record.is_available,
      true -- Template
    );
    
    -- Update migration progress
    UPDATE migration_status 
    SET records_processed = records_processed + 1
    WHERE id = migration_id;
  END LOOP;
  
  -- Mark migration as completed
  UPDATE migration_status 
  SET status = 'completed', completed_at = now()
  WHERE id = migration_id;
  
EXCEPTION WHEN OTHERS THEN
  -- Mark migration as failed
  UPDATE migration_status 
  SET status = 'failed', error_message = SQLERRM
  WHERE id = migration_id;
  RAISE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION migrate_time_slots_to_weekly()
RETURNS void AS $$
DECLARE
  slot_record RECORD;
  migration_id uuid;
BEGIN
  -- Create migration record
  INSERT INTO migration_status (migration_name, status, started_at)
  VALUES ('time_slots_to_weekly', 'in_progress', now())
  RETURNING id INTO migration_id;
  
  -- Migrate each time slot
  FOR slot_record IN 
    SELECT * FROM time_slots 
    WHERE NOT EXISTS (
      SELECT 1 FROM doctor_weekly_time_slots 
      WHERE doctor_weekly_time_slots.doctor_id = time_slots.doctor_id 
      AND doctor_weekly_time_slots.schedule_date = time_slots.schedule_date
      AND doctor_weekly_time_slots.start_time = time_slots.start_time
    )
  LOOP
    INSERT INTO doctor_weekly_time_slots (
      doctor_id,
      schedule_date,
      start_time,
      end_time,
      duration_minutes,
      status,
      appointment_id,
      notes
    ) VALUES (
      slot_record.doctor_id,
      slot_record.schedule_date,
      slot_record.start_time,
      slot_record.end_time,
      slot_record.duration_minutes,
      slot_record.status,
      slot_record.appointment_id,
      slot_record.notes
    );
    
    -- Update migration progress
    UPDATE migration_status 
    SET records_processed = records_processed + 1
    WHERE id = migration_id;
  END LOOP;
  
  -- Mark migration as completed
  UPDATE migration_status 
  SET status = 'completed', completed_at = now()
  WHERE id = migration_id;
  
EXCEPTION WHEN OTHERS THEN
  -- Mark migration as failed
  UPDATE migration_status 
  SET status = 'failed', error_message = SQLERRM
  WHERE id = migration_id;
  RAISE;
END;
$$ LANGUAGE plpgsql;

-- Phase 4: Backward compatibility views
CREATE OR REPLACE VIEW doctor_schedules_compat AS
SELECT 
  id,
  doctor_id,
  day_of_week,
  start_time,
  end_time,
  slot_duration_minutes,
  break_start_time,
  break_end_time,
  is_available,
  created_at,
  updated_at
FROM doctor_weekly_schedules 
WHERE is_template = true;

CREATE OR REPLACE VIEW time_slots_compat AS
SELECT 
  id,
  doctor_id,
  schedule_date,
  start_time,
  end_time,
  duration_minutes,
  status,
  appointment_id,
  notes,
  created_at,
  updated_at
FROM doctor_weekly_time_slots;

-- Phase 5: Data cleanup functions (run after migration is verified)
CREATE OR REPLACE FUNCTION cleanup_old_schedule_data()
RETURNS void AS $$
DECLARE
  migration_status_record RECORD;
BEGIN
  -- Check if both migrations are completed
  SELECT * INTO migration_status_record
  FROM migration_status 
  WHERE migration_name IN ('doctor_schedules_to_weekly', 'time_slots_to_weekly')
  AND status = 'completed';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Migration not completed. Cannot cleanup old data.';
  END IF;
  
  -- Archive old tables (don't delete, just rename)
  ALTER TABLE doctor_schedules RENAME TO doctor_schedules_old;
  ALTER TABLE time_slots RENAME TO time_slots_old;
  
  -- Create new tables with old names for backward compatibility
  CREATE TABLE doctor_schedules AS SELECT * FROM doctor_weekly_schedules WHERE is_template = true;
  CREATE TABLE time_slots AS SELECT * FROM doctor_weekly_time_slots;
  
  -- Add constraints and indexes
  ALTER TABLE doctor_schedules ADD PRIMARY KEY (id);
  ALTER TABLE time_slots ADD PRIMARY KEY (id);
  
  -- Add foreign key constraints
  ALTER TABLE doctor_schedules ADD CONSTRAINT fk_doctor_schedules_doctor_id 
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE;
  
  ALTER TABLE time_slots ADD CONSTRAINT fk_time_slots_doctor_id 
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE;
  
  -- Add unique constraints
  ALTER TABLE doctor_schedules ADD CONSTRAINT uk_doctor_schedules_doctor_day 
    UNIQUE (doctor_id, day_of_week);
  
  ALTER TABLE time_slots ADD CONSTRAINT uk_time_slots_doctor_date_time 
    UNIQUE (doctor_id, schedule_date, start_time);
  
  -- Add check constraints
  ALTER TABLE doctor_schedules ADD CONSTRAINT chk_doctor_schedules_end_after_start 
    CHECK (end_time > start_time);
  
  ALTER TABLE time_slots ADD CONSTRAINT chk_time_slots_end_after_start 
    CHECK (end_time > start_time);
  
  ALTER TABLE time_slots ADD CONSTRAINT chk_time_slots_status 
    CHECK (status IN ('available', 'booked', 'blocked', 'break'));
  
  -- Create indexes
  CREATE INDEX idx_doctor_schedules_doctor_id ON doctor_schedules(doctor_id);
  CREATE INDEX idx_time_slots_doctor_date ON time_slots(doctor_id, schedule_date);
  CREATE INDEX idx_time_slots_status ON time_slots(doctor_id, schedule_date, status);
  
  -- Enable RLS
  ALTER TABLE doctor_schedules ENABLE ROW LEVEL SECURITY;
  ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
  
  -- Add RLS policies
  CREATE POLICY "Doctors can manage their own schedules" ON doctor_schedules
    FOR ALL USING (auth.uid() = doctor_id);
  
  CREATE POLICY "Anyone can view available schedules" ON doctor_schedules
    FOR SELECT USING (is_available = true);
  
  CREATE POLICY "Doctors can manage their own time slots" ON time_slots
    FOR ALL USING (auth.uid() = doctor_id);
  
  CREATE POLICY "Anyone can view available time slots" ON time_slots
    FOR SELECT USING (status = 'available');
  
  -- Update migration status
  INSERT INTO migration_status (migration_name, status, completed_at)
  VALUES ('cleanup_old_data', 'completed', now());
  
END;
$$ LANGUAGE plpgsql;

-- Phase 6: Verification functions
CREATE OR REPLACE FUNCTION verify_migration()
RETURNS TABLE (
  table_name text,
  old_count bigint,
  new_count bigint,
  status text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'doctor_schedules'::text,
    (SELECT COUNT(*) FROM doctor_schedules_backup),
    (SELECT COUNT(*) FROM doctor_weekly_schedules WHERE is_template = true),
    CASE 
      WHEN (SELECT COUNT(*) FROM doctor_schedules_backup) = 
           (SELECT COUNT(*) FROM doctor_weekly_schedules WHERE is_template = true)
      THEN 'OK'::text
      ELSE 'MISMATCH'::text
    END
  UNION ALL
  SELECT 
    'time_slots'::text,
    (SELECT COUNT(*) FROM time_slots_backup),
    (SELECT COUNT(*) FROM doctor_weekly_time_slots),
    CASE 
      WHEN (SELECT COUNT(*) FROM time_slots_backup) = 
           (SELECT COUNT(*) FROM doctor_weekly_time_slots)
      THEN 'OK'::text
      ELSE 'MISMATCH'::text
    END;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON FUNCTION migrate_doctor_schedules_to_weekly() IS 'Migrates doctor_schedules to doctor_weekly_schedules as templates';
COMMENT ON FUNCTION migrate_time_slots_to_weekly() IS 'Migrates time_slots to doctor_weekly_time_slots';
COMMENT ON FUNCTION cleanup_old_schedule_data() IS 'Cleans up old data after successful migration';
COMMENT ON FUNCTION verify_migration() IS 'Verifies that migration was successful';

