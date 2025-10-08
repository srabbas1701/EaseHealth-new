-- Add schedule_date field to doctor_schedules table for 4-week scheduling
-- This allows doctors to create schedules for specific date ranges

-- Add the new column
ALTER TABLE doctor_schedules 
ADD COLUMN IF NOT EXISTS schedule_date DATE;

-- Add a comment to explain the new field
COMMENT ON COLUMN doctor_schedules.schedule_date IS 'The specific date this schedule applies to. If NULL, it applies to all matching days of the week.';

-- Update the unique constraint to include schedule_date
-- First, drop the existing unique constraint
ALTER TABLE doctor_schedules 
DROP CONSTRAINT IF EXISTS doctor_schedules_doctor_id_day_of_week_key;

-- Add new unique constraint that includes schedule_date
ALTER TABLE doctor_schedules 
ADD CONSTRAINT doctor_schedules_doctor_id_day_of_week_schedule_date_key 
UNIQUE (doctor_id, day_of_week, schedule_date);

-- Create an index for better performance on date-based queries
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_doctor_date 
ON doctor_schedules(doctor_id, schedule_date);

-- Create an index for day of week queries with date
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_day_date 
ON doctor_schedules(day_of_week, schedule_date);
