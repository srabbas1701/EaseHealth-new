-- CRITICAL FIX: Correct the appointments table foreign key constraint
-- This fixes the error: "appointments_patient_id_fkey" violation

-- IMPORTANT: Backup your database before running this script!

-- Step 1: Check current foreign key constraints on appointments table
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='appointments'
    AND kcu.column_name = 'patient_id';

-- Step 2: Drop the incorrect foreign key constraint
-- Replace 'appointments_patient_id_fkey' with the actual constraint name from Step 1
ALTER TABLE appointments 
DROP CONSTRAINT IF EXISTS appointments_patient_id_fkey;

-- Step 3: Add the correct foreign key constraint
-- This links appointments.patient_id to patients.id (NOT users.id)
ALTER TABLE appointments 
ADD CONSTRAINT appointments_patient_id_fkey 
FOREIGN KEY (patient_id) 
REFERENCES patients(id) 
ON DELETE CASCADE;

-- Step 4: Verify the new constraint is correct
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='appointments'
    AND kcu.column_name = 'patient_id';

-- Expected result after fix:
-- appointments_patient_id_fkey | appointments | patient_id | patients | id

