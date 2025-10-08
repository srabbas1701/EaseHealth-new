-- Fix the constraint issue that's preventing time slot generation
-- The constraint was changed from (doctor_id, day_of_week, schedule_date) to (doctor_id, schedule_date)
-- This might be causing issues with schedule creation

-- Drop the current constraint
ALTER TABLE doctor_schedules 
DROP CONSTRAINT IF EXISTS doctor_schedules_doctor_id_schedule_date_key;

-- Restore the original working constraint
ALTER TABLE doctor_schedules 
ADD CONSTRAINT doctor_schedules_doctor_id_day_of_week_schedule_date_key 
UNIQUE (doctor_id, day_of_week, schedule_date);

-- Verify the constraint is working
SELECT 'Constraint fixed - checking current constraints:' as info;
SELECT tc.constraint_name, tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_name = 'doctor_schedules';

SELECT 'Constraint fix completed successfully!' as result;
