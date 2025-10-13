-- ============================================
-- FIX DATABASE SCHEMA FOR PATIENT REGISTRATION
-- ============================================
-- Run this SQL in Supabase SQL Editor
-- ============================================

-- 1. Add missing columns to patient_pre_registrations table
ALTER TABLE patient_pre_registrations 
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS date_of_birth date,
ADD COLUMN IF NOT EXISTS emergency_contact_name text,
ADD COLUMN IF NOT EXISTS emergency_contact_phone text,
ADD COLUMN IF NOT EXISTS medical_history text,
ADD COLUMN IF NOT EXISTS allergies text,
ADD COLUMN IF NOT EXISTS current_medications text,
ADD COLUMN IF NOT EXISTS insurance_provider text,
ADD COLUMN IF NOT EXISTS insurance_number text,
ADD COLUMN IF NOT EXISTS blood_type text,
ADD COLUMN IF NOT EXISTS profile_image_url text,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- 2. Add unique constraint on email (separately to avoid conflict with existing data)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'patient_pre_registrations_email_key'
  ) THEN
    ALTER TABLE patient_pre_registrations 
    ADD CONSTRAINT patient_pre_registrations_email_key UNIQUE (email);
  END IF;
END $$;

-- 3. Add queue_token to appointments table if it doesn't exist
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS queue_token text;

-- 4. Add unique constraint on queue_token
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'appointments_queue_token_key'
  ) THEN
    ALTER TABLE appointments 
    ADD CONSTRAINT appointments_queue_token_key UNIQUE (queue_token);
  END IF;
END $$;

-- 5. Create index on queue_token for performance
CREATE INDEX IF NOT EXISTS idx_appointments_queue_token ON appointments(queue_token);

-- 6. Add missing columns to patients table
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS id_proof_urls text[],
ADD COLUMN IF NOT EXISTS lab_report_urls text[];

-- 7. Create or replace the generate_queue_token function
CREATE OR REPLACE FUNCTION generate_queue_token()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  new_token text;
  token_exists boolean;
BEGIN
  LOOP
    -- Generate token in format QT-YYYY-XXXXXXXX (8 random alphanumeric characters)
    new_token := 'QT-' || EXTRACT(YEAR FROM CURRENT_DATE)::text || '-' || 
                 upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    
    -- Check if token already exists
    SELECT EXISTS(SELECT 1 FROM appointments WHERE queue_token = new_token) INTO token_exists;
    
    -- If token doesn't exist, we can use it
    EXIT WHEN NOT token_exists;
  END LOOP;
  
  RETURN new_token;
END;
$$;

-- 8. Verify the changes
SELECT 'patient_pre_registrations columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'patient_pre_registrations' 
ORDER BY column_name;

SELECT 'appointments queue_token column:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'appointments' AND column_name = 'queue_token';

SELECT 'patients new columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'patients' 
AND column_name IN ('city', 'state', 'id_proof_urls', 'lab_report_urls');

SELECT 'Test queue token generation:' as info;
SELECT generate_queue_token() as sample_token;

