-- Clean up schedules and time slots with timezone mismatch
-- This script removes records where schedule_date doesn't match the actual day_of_week

-- Delete time slots first (they reference schedules)
DELETE FROM time_slots
WHERE doctor_id = '0a6194eb-111b-4feb-aa4b-3a5515b86d69';

-- Delete doctor schedules
DELETE FROM doctor_schedules  
WHERE doctor_id = '0a6194eb-111b-4feb-aa4b-3a5515b86d69';

-- Verify cleanup
SELECT 'Remaining schedules:' as message, COUNT(*) as count
FROM doctor_schedules
WHERE doctor_id = '0a6194eb-111b-4feb-aa4b-3a5515b86d69'
UNION ALL
SELECT 'Remaining time slots:' as message, COUNT(*) as count
FROM time_slots
WHERE doctor_id = '0a6194eb-111b-4feb-aa4b-3a5515b86d69';

