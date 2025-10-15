-- Verify appointments table structure and constraints
-- Run this script to check the current state

-- Check current appointments table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'appointments' 
ORDER BY ordinal_position;

-- Check status field constraints
SELECT conname, consrc 
FROM pg_constraint 
WHERE conrelid = 'appointments'::regclass 
AND conname LIKE '%status%';

-- Check if there are any CHECK constraints on status field
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'appointments' 
    AND tc.constraint_type = 'CHECK';

-- Test appointment creation with different status values to see what's allowed
-- (This will show constraint errors if any status values are not allowed)
