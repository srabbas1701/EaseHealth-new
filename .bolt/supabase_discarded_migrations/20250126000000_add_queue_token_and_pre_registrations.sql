-- Add queue_token column to appointments table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='appointments' AND column_name='queue_token') THEN
    ALTER TABLE appointments ADD COLUMN queue_token text UNIQUE;
  END IF;
END $$;

-- Create patient_pre_registrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS patient_pre_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone_number text NOT NULL,
  date_of_birth date,
  gender text CHECK (gender IN ('Male', 'Female', 'Other', 'Prefer not to say')),
  address text,
  city text,
  state text,
  emergency_contact_name text,
  emergency_contact_phone text,
  medical_history text,
  allergies text,
  current_medications text,
  insurance_provider text,
  insurance_number text,
  blood_type text,
  profile_image_url text,
  id_proof_urls text[],
  lab_report_urls text[],
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_patient_pre_registrations_user_id ON patient_pre_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_pre_registrations_email ON patient_pre_registrations(email);
CREATE INDEX IF NOT EXISTS idx_appointments_queue_token ON appointments(queue_token);

-- Create trigger for updated_at on patient_pre_registrations
CREATE TRIGGER set_updated_at_patient_pre_registrations
  BEFORE UPDATE ON patient_pre_registrations
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Row Level Security (RLS) policies for patient_pre_registrations
ALTER TABLE patient_pre_registrations ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own pre-registration
CREATE POLICY "Users can insert own pre-registration" ON patient_pre_registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own pre-registration
CREATE POLICY "Users can view own pre-registration" ON patient_pre_registrations
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to update their own pre-registration
CREATE POLICY "Users can update own pre-registration" ON patient_pre_registrations
  FOR UPDATE USING (auth.uid() = user_id);

-- Create or replace the generate_queue_token function
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

-- Add missing columns to patients table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='patients' AND column_name='city') THEN
    ALTER TABLE patients ADD COLUMN city text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='patients' AND column_name='state') THEN
    ALTER TABLE patients ADD COLUMN state text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='patients' AND column_name='id_proof_urls') THEN
    ALTER TABLE patients ADD COLUMN id_proof_urls text[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='patients' AND column_name='lab_report_urls') THEN
    ALTER TABLE patients ADD COLUMN lab_report_urls text[];
  END IF;
END $$;


