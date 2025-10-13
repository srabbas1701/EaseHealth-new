-- Add missing columns to patients table
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS id_proof_urls TEXT[],
ADD COLUMN IF NOT EXISTS lab_report_urls TEXT[];

-- Add missing columns to patient_pre_registrations table
ALTER TABLE patient_pre_registrations 
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS id_proof_urls TEXT[],
ADD COLUMN IF NOT EXISTS lab_report_urls TEXT[];

-- Update existing records to have empty arrays for the new URL fields
UPDATE patients 
SET id_proof_urls = '{}', lab_report_urls = '{}' 
WHERE id_proof_urls IS NULL OR lab_report_urls IS NULL;

UPDATE patient_pre_registrations 
SET id_proof_urls = '{}', lab_report_urls = '{}' 
WHERE id_proof_urls IS NULL OR lab_report_urls IS NULL;

