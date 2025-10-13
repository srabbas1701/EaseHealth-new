-- Fix database constraints for EaseHealth
-- This script will ensure the constraints match what the code expects

-- ==============================================
-- 1. Check current table structure
-- ==============================================

-- First, let's see what columns exist in doctor_schedules
SELECT 'Current doctor_schedules columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'doctor_schedules' 
ORDER BY ordinal_position;

-- Check current constraints on doctor_schedules
SELECT 'Current doctor_schedules constraints:' as info;
SELECT tc.constraint_name, tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_name = 'doctor_schedules';

-- ==============================================
-- 2. Fix doctor_schedules constraints
-- ==============================================

-- Drop existing unique constraints that might conflict
ALTER TABLE doctor_schedules 
DROP CONSTRAINT IF EXISTS doctor_schedules_doctor_id_day_of_week_key;

ALTER TABLE doctor_schedules 
DROP CONSTRAINT IF EXISTS doctor_schedules_doctor_id_day_of_week_schedule_date_key;

-- Add the correct unique constraint: (doctor_id, schedule_date)
-- This ensures each doctor can only have ONE schedule per specific date
ALTER TABLE doctor_schedules 
ADD CONSTRAINT doctor_schedules_doctor_id_schedule_date_key 
UNIQUE (doctor_id, schedule_date);

-- Log the constraint addition
DO $$
BEGIN
    RAISE NOTICE 'Added constraint: (doctor_id, schedule_date) - each doctor can have one schedule per date';
END $$;

-- ==============================================
-- 3. Fix time_slots constraints
-- ==============================================

-- Check time_slots structure
SELECT 'Current time_slots columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'time_slots' 
ORDER BY ordinal_position;

-- Drop existing unique constraints that might conflict
ALTER TABLE time_slots 
DROP CONSTRAINT IF EXISTS time_slots_doctor_id_schedule_date_start_time_key;

-- Add the correct unique constraint for time_slots
ALTER TABLE time_slots 
ADD CONSTRAINT time_slots_doctor_id_schedule_date_start_time_key 
UNIQUE (doctor_id, schedule_date, start_time);

-- ==============================================
-- 4. Verify the fixes
-- ==============================================

-- Check final constraints
SELECT 'Final doctor_schedules constraints:' as info;
SELECT tc.constraint_name, tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_name = 'doctor_schedules';

SELECT 'Final time_slots constraints:' as info;
SELECT tc.constraint_name, tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_name = 'time_slots';

-- ==============================================
-- 5. Test the constraints work (only if doctors exist)
-- ==============================================

-- Check if there are any doctors in the database
DO $$
DECLARE
    doctor_count INTEGER;
    test_doctor_id UUID;
BEGIN
    -- Count doctors
    SELECT COUNT(*) INTO doctor_count FROM doctors;
    
    IF doctor_count > 0 THEN
        -- Get the first doctor ID for testing
        SELECT id INTO test_doctor_id FROM doctors LIMIT 1;
        
        RAISE NOTICE 'Testing constraints with doctor ID: %', test_doctor_id;
        
        -- Test inserting a doctor schedule (this should work)
        INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, is_available, schedule_date)
        VALUES (test_doctor_id, 1, '09:00:00', '17:00:00', 30, true, '2025-01-07')
        ON CONFLICT (doctor_id, schedule_date) 
        DO UPDATE SET 
          start_time = EXCLUDED.start_time,
          end_time = EXCLUDED.end_time,
          slot_duration_minutes = EXCLUDED.slot_duration_minutes,
          is_available = EXCLUDED.is_available,
          updated_at = now();

        -- Test inserting a time slot (this should work)
        INSERT INTO time_slots (doctor_id, schedule_date, start_time, end_time, duration_minutes, status)
        VALUES (test_doctor_id, '2025-01-07', '09:00:00', '09:30:00', 30, 'available')
        ON CONFLICT (doctor_id, schedule_date, start_time)
        DO UPDATE SET 
          end_time = EXCLUDED.end_time,
          duration_minutes = EXCLUDED.duration_minutes,
          status = EXCLUDED.status,
          updated_at = now();

        -- Clean up test data
        DELETE FROM time_slots WHERE doctor_id = test_doctor_id AND schedule_date = '2025-01-07';
        DELETE FROM doctor_schedules WHERE doctor_id = test_doctor_id AND schedule_date = '2025-01-07';
        
        RAISE NOTICE 'Constraint tests completed successfully!';
    ELSE
        RAISE NOTICE 'No doctors found in database. Skipping constraint tests.';
    END IF;
END $$;

SELECT 'Database constraints fixed successfully!' as result;
