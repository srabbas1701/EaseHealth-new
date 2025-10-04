-- Update doctors table to include all fields from registration form
-- This script adds missing columns to the existing doctors table

-- Add new columns to doctors table
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS medical_registration_number text,
ADD COLUMN IF NOT EXISTS issuing_council text,
ADD COLUMN IF NOT EXISTS year_of_registration integer,
ADD COLUMN IF NOT EXISTS aadhaar_number text,
ADD COLUMN IF NOT EXISTS pan_number text,
ADD COLUMN IF NOT EXISTS super_specialization text,
ADD COLUMN IF NOT EXISTS qualifications jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS total_years_of_experience integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS professional_bio text,
ADD COLUMN IF NOT EXISTS languages_spoken text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS practice_locations jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS consultation_types text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS consultation_fees jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS services_offered text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS bank_account_holder_name text,
ADD COLUMN IF NOT EXISTS bank_account_number text,
ADD COLUMN IF NOT EXISTS ifsc_code text,
ADD COLUMN IF NOT EXISTS bank_name text,
ADD COLUMN IF NOT EXISTS bank_branch text,
ADD COLUMN IF NOT EXISTS terms_accepted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS privacy_policy_accepted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS telemedicine_consent boolean DEFAULT false;

-- Add constraints for new fields
ALTER TABLE doctors 
ADD CONSTRAINT check_year_of_registration CHECK (year_of_registration >= 1950 AND year_of_registration <= EXTRACT(YEAR FROM CURRENT_DATE)),
ADD CONSTRAINT check_aadhaar_number CHECK (aadhaar_number IS NULL OR LENGTH(REGEXP_REPLACE(aadhaar_number, '\D', '', 'g')) = 12),
ADD CONSTRAINT check_pan_number CHECK (pan_number IS NULL OR pan_number ~ '^[A-Z]{5}[0-9]{4}[A-Z]{1}$'),
ADD CONSTRAINT check_ifsc_code CHECK (ifsc_code IS NULL OR ifsc_code ~ '^[A-Z]{4}0[A-Z0-9]{6}$'),
ADD CONSTRAINT check_total_years_of_experience CHECK (total_years_of_experience >= 0 AND total_years_of_experience <= 70);

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_doctors_medical_registration ON doctors(medical_registration_number);
CREATE INDEX IF NOT EXISTS idx_doctors_issuing_council ON doctors(issuing_council);
CREATE INDEX IF NOT EXISTS idx_doctors_aadhaar ON doctors(aadhaar_number);
CREATE INDEX IF NOT EXISTS idx_doctors_pan ON doctors(pan_number);
CREATE INDEX IF NOT EXISTS idx_doctors_super_specialization ON doctors(super_specialization);
CREATE INDEX IF NOT EXISTS idx_doctors_languages ON doctors USING GIN(languages_spoken);
CREATE INDEX IF NOT EXISTS idx_doctors_consultation_types ON doctors USING GIN(consultation_types);
CREATE INDEX IF NOT EXISTS idx_doctors_services ON doctors USING GIN(services_offered);

-- Update existing columns to match registration form
ALTER TABLE doctors 
ALTER COLUMN specialty TYPE text,
ALTER COLUMN qualification TYPE text,
ALTER COLUMN bio TYPE text;

-- Add comments for documentation
COMMENT ON COLUMN doctors.medical_registration_number IS 'Medical registration number from issuing council';
COMMENT ON COLUMN doctors.issuing_council IS 'Medical council that issued the registration';
COMMENT ON COLUMN doctors.year_of_registration IS 'Year when medical registration was obtained';
COMMENT ON COLUMN doctors.aadhaar_number IS '12-digit Aadhaar number for identity verification';
COMMENT ON COLUMN doctors.pan_number IS 'PAN number for tax purposes';
COMMENT ON COLUMN doctors.super_specialization IS 'Super specialization or sub-specialty';
COMMENT ON COLUMN doctors.qualifications IS 'JSON array of qualifications with degree, college, and year';
COMMENT ON COLUMN doctors.total_years_of_experience IS 'Total years of medical practice experience';
COMMENT ON COLUMN doctors.professional_bio IS 'Professional biography and experience summary';
COMMENT ON COLUMN doctors.languages_spoken IS 'Array of languages the doctor can communicate in';
COMMENT ON COLUMN doctors.practice_locations IS 'JSON array of practice locations with clinic name, address, city, pincode';
COMMENT ON COLUMN doctors.consultation_types IS 'Array of consultation types offered (In-Clinic, Video, Audio)';
COMMENT ON COLUMN doctors.consultation_fees IS 'JSON object with fees for different consultation types';
COMMENT ON COLUMN doctors.services_offered IS 'Array of medical services and treatments offered';
COMMENT ON COLUMN doctors.bank_account_holder_name IS 'Name on bank account for payments';
COMMENT ON COLUMN doctors.bank_account_number IS 'Bank account number for receiving payments';
COMMENT ON COLUMN doctors.ifsc_code IS 'IFSC code of the bank branch';
COMMENT ON COLUMN doctors.bank_name IS 'Name of the bank';
COMMENT ON COLUMN doctors.bank_branch IS 'Branch name of the bank';
COMMENT ON COLUMN doctors.terms_accepted IS 'Whether terms and conditions were accepted';
COMMENT ON COLUMN doctors.privacy_policy_accepted IS 'Whether privacy policy was accepted';
COMMENT ON COLUMN doctors.telemedicine_consent IS 'Whether telemedicine consent was given';

-- Create a view for public doctor information (without sensitive data)
CREATE OR REPLACE VIEW public_doctors AS
SELECT 
  id,
  full_name,
  email,
  phone_number,
  specialty,
  super_specialization,
  experience_years,
  qualification,
  qualifications,
  professional_bio,
  languages_spoken,
  practice_locations,
  consultation_types,
  consultation_fees,
  services_offered,
  profile_image_url,
  is_verified,
  is_active,
  created_at
FROM doctors
WHERE is_active = true;

-- Grant permissions for the view
GRANT SELECT ON public_doctors TO public;
GRANT SELECT ON public_doctors TO authenticated;

-- Create a function to update doctor profile
CREATE OR REPLACE FUNCTION update_doctor_profile(
  doctor_id uuid,
  profile_data jsonb
) RETURNS boolean AS $$
BEGIN
  UPDATE doctors 
  SET 
    full_name = COALESCE(profile_data->>'full_name', full_name),
    email = COALESCE(profile_data->>'email', email),
    phone_number = COALESCE(profile_data->>'phone_number', phone_number),
    specialty = COALESCE(profile_data->>'specialty', specialty),
    super_specialization = COALESCE(profile_data->>'super_specialization', super_specialization),
    medical_registration_number = COALESCE(profile_data->>'medical_registration_number', medical_registration_number),
    issuing_council = COALESCE(profile_data->>'issuing_council', issuing_council),
    year_of_registration = COALESCE((profile_data->>'year_of_registration')::integer, year_of_registration),
    aadhaar_number = COALESCE(profile_data->>'aadhaar_number', aadhaar_number),
    pan_number = COALESCE(profile_data->>'pan_number', pan_number),
    qualifications = COALESCE(profile_data->'qualifications', qualifications),
    total_years_of_experience = COALESCE((profile_data->>'total_years_of_experience')::integer, total_years_of_experience),
    professional_bio = COALESCE(profile_data->>'professional_bio', professional_bio),
    languages_spoken = COALESCE(ARRAY(SELECT jsonb_array_elements_text(profile_data->'languages_spoken')), languages_spoken),
    practice_locations = COALESCE(profile_data->'practice_locations', practice_locations),
    consultation_types = COALESCE(ARRAY(SELECT jsonb_array_elements_text(profile_data->'consultation_types')), consultation_types),
    consultation_fees = COALESCE(profile_data->'consultation_fees', consultation_fees),
    services_offered = COALESCE(ARRAY(SELECT jsonb_array_elements_text(profile_data->'services_offered')), services_offered),
    updated_at = now()
  WHERE id = doctor_id AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_doctor_profile(uuid, jsonb) TO authenticated;

