-- Fix status column default value
-- The status column is defaulting to 'inactive' instead of 'active'

-- Fix the default value
ALTER TABLE doctor_schedules 
ALTER COLUMN status SET DEFAULT 'active';

-- Update any existing 'inactive' records to 'active' if they should be active
UPDATE doctor_schedules 
SET status = 'active' 
WHERE status = 'inactive';

-- Verify the fix
SELECT 'Status column fixed - checking current values:' as info;
SELECT status, COUNT(*) as count
FROM doctor_schedules
GROUP BY status;

SELECT 'Status default value fixed successfully!' as result;


