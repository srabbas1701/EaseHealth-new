/*
  # Weekly Doctor Schedules with Specific Dates
  
  This migration adds support for weekly schedules with specific dates,
  allowing doctors to have different availability week by week.
  
  New Tables:
    - `doctor_weekly_schedules` - Weekly schedules with specific dates
    - `doctor_weekly_time_slots` - Time slots for specific dates
  
  Migration Strategy:
    - Keep existing `doctor_schedules` for template schedules
    - Add new tables for specific date schedules
    - Migrate existing data to new structure
*/

-- Create doctor_weekly_schedules table
CREATE TABLE IF NOT EXISTS doctor_weekly_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  schedule_date date NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  slot_duration_minutes integer DEFAULT 15 CHECK (slot_duration_minutes > 0),
  break_start_time time,
  break_end_time time,
  is_available boolean DEFAULT true,
  is_template boolean DEFAULT false, -- true for template schedules, false for specific dates
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(doctor_id, schedule_date, day_of_week),
  CHECK (end_time > start_time),
  CHECK (
    (break_start_time IS NULL AND break_end_time IS NULL) OR
    (break_start_time IS NOT NULL AND break_end_time IS NOT NULL AND break_end_time > break_start_time)
  )
);

-- Create doctor_weekly_time_slots table (replaces time_slots for weekly system)
CREATE TABLE IF NOT EXISTS doctor_weekly_time_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  schedule_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'booked', 'blocked', 'break')),
  appointment_id uuid,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(doctor_id, schedule_date, start_time),
  CHECK (end_time > start_time)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_doctor_weekly_schedules_doctor_date ON doctor_weekly_schedules(doctor_id, schedule_date);
CREATE INDEX IF NOT EXISTS idx_doctor_weekly_schedules_doctor_day ON doctor_weekly_schedules(doctor_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_doctor_weekly_schedules_template ON doctor_weekly_schedules(doctor_id, is_template);
CREATE INDEX IF NOT EXISTS idx_doctor_weekly_time_slots_doctor_date ON doctor_weekly_time_slots(doctor_id, schedule_date);
CREATE INDEX IF NOT EXISTS idx_doctor_weekly_time_slots_status ON doctor_weekly_time_slots(doctor_id, schedule_date, status);

-- Migrate existing doctor_schedules to template schedules
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
)
SELECT 
  doctor_id,
  '1900-01-01'::date as schedule_date, -- Use a far past date for templates
  day_of_week,
  start_time,
  end_time,
  slot_duration_minutes,
  break_start_time,
  break_end_time,
  is_available,
  true as is_template
FROM doctor_schedules
WHERE NOT EXISTS (
  SELECT 1 FROM doctor_weekly_schedules 
  WHERE doctor_weekly_schedules.doctor_id = doctor_schedules.doctor_id 
  AND doctor_weekly_schedules.day_of_week = doctor_schedules.day_of_week
  AND doctor_weekly_schedules.is_template = true
);

-- Migrate existing time_slots to new structure
INSERT INTO doctor_weekly_time_slots (
  doctor_id,
  schedule_date,
  start_time,
  end_time,
  duration_minutes,
  status,
  appointment_id,
  notes
)
SELECT 
  doctor_id,
  schedule_date,
  start_time,
  end_time,
  duration_minutes,
  status,
  appointment_id,
  notes
FROM time_slots
WHERE NOT EXISTS (
  SELECT 1 FROM doctor_weekly_time_slots 
  WHERE doctor_weekly_time_slots.doctor_id = time_slots.doctor_id 
  AND doctor_weekly_time_slots.schedule_date = time_slots.schedule_date
  AND doctor_weekly_time_slots.start_time = time_slots.start_time
);

-- Add RLS policies for new tables
ALTER TABLE doctor_weekly_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_weekly_time_slots ENABLE ROW LEVEL SECURITY;

-- Policies for doctor_weekly_schedules
CREATE POLICY "Doctors can manage their own weekly schedules" ON doctor_weekly_schedules
  FOR ALL USING (auth.uid() = doctor_id);

CREATE POLICY "Anyone can view available weekly schedules" ON doctor_weekly_schedules
  FOR SELECT USING (is_available = true);

-- Policies for doctor_weekly_time_slots
CREATE POLICY "Doctors can manage their own weekly time slots" ON doctor_weekly_time_slots
  FOR ALL USING (auth.uid() = doctor_id);

CREATE POLICY "Anyone can view available weekly time slots" ON doctor_weekly_time_slots
  FOR SELECT USING (status = 'available');

-- Add comments
COMMENT ON TABLE doctor_weekly_schedules IS 'Weekly doctor schedules with specific dates or templates';
COMMENT ON TABLE doctor_weekly_time_slots IS 'Time slots for specific dates in weekly schedule system';
COMMENT ON COLUMN doctor_weekly_schedules.is_template IS 'true for template schedules, false for specific dates';
COMMENT ON COLUMN doctor_weekly_schedules.schedule_date IS 'Specific date for schedule, or 1900-01-01 for templates';

