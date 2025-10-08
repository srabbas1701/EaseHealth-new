-- Add status column to doctor_schedules table for better update handling
-- This allows us to mark schedules as inactive instead of deleting them

-- Add status column to doctor_schedules
ALTER TABLE doctor_schedules 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'inactive'));

-- Add comment to explain the status field
COMMENT ON COLUMN doctor_schedules.status IS 'Schedule status: active (available for booking) or inactive (not available)';

-- Update existing records to have 'active' status
UPDATE doctor_schedules 
SET status = 'active' 
WHERE status IS NULL;

-- Create index for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_status 
ON doctor_schedules(doctor_id, status);

-- Verify the changes
SELECT 'doctor_schedules table structure after adding status column:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'doctor_schedules' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check existing status values
SELECT 'Current status distribution in doctor_schedules:' as info;
SELECT status, COUNT(*) as count
FROM doctor_schedules
GROUP BY status;

SELECT 'Status columns added successfully!' as result;
