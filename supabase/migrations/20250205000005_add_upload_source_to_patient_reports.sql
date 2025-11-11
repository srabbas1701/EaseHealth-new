/*
  # Add upload_source Column to patient_reports Table
  
  ## Changes
  - Add upload_source column to track whether report was uploaded by patient or doctor
  - Add check constraint for valid upload sources
  - Add index for better query performance
  
  ## Upload Sources
  - 'patient_registration': Uploaded during patient registration
  - 'patient_profile_update': Uploaded when patient updates profile
  - 'doctor_upload': Uploaded by doctor from patient detail page
*/

-- Add upload_source column with default value
ALTER TABLE patient_reports 
ADD COLUMN IF NOT EXISTS upload_source text DEFAULT 'doctor_upload';

-- Add constraint to ensure only valid upload sources
ALTER TABLE patient_reports 
ADD CONSTRAINT valid_upload_source 
CHECK (upload_source IN ('patient_registration', 'patient_profile_update', 'doctor_upload'));

-- Add index for better query performance when filtering by source
CREATE INDEX IF NOT EXISTS idx_patient_reports_upload_source 
ON patient_reports(upload_source);

-- Add index for combined patient_id and upload_source queries
CREATE INDEX IF NOT EXISTS idx_patient_reports_patient_source 
ON patient_reports(patient_id, upload_source);

-- Add comment for documentation
COMMENT ON COLUMN patient_reports.upload_source IS 
  'Tracks the source of the report upload: patient_registration, patient_profile_update, or doctor_upload';

-- Update existing records to have doctor_upload as source (they were uploaded by doctors)
UPDATE patient_reports 
SET upload_source = 'doctor_upload' 
WHERE upload_source IS NULL;














