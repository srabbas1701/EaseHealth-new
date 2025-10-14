-- Migration: Refactor patient registration tables
-- Description: Streamline patient and pre-registration tables, remove redundancy
-- Author: AI Assistant
-- Date: 2025-10-14

-- Step 1: Create backup tables
CREATE TABLE IF NOT EXISTS patients_backup AS SELECT * FROM patients;
CREATE TABLE IF NOT EXISTS patient_pre_registrations_backup AS SELECT * FROM patient_pre_registrations;

-- Step 2: Create migration tracking
CREATE TABLE IF NOT EXISTS schema_migrations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    started_at timestamptz DEFAULT now(),
    completed_at timestamptz,
    status text DEFAULT 'in_progress',
    error_message text
);

-- Insert migration record
INSERT INTO schema_migrations (name) VALUES ('20251014000000_refactor_patient_registration');

-- Step 3: Add new columns to patients table if they don't exist
DO $$ 
BEGIN
    -- Add id_proof_urls if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'patients' AND column_name = 'id_proof_urls') THEN
        ALTER TABLE patients ADD COLUMN id_proof_urls text[];
    END IF;

    -- Add lab_report_urls if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'patients' AND column_name = 'lab_report_urls') THEN
        ALTER TABLE patients ADD COLUMN lab_report_urls text[];
    END IF;

    -- Add age if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'patients' AND column_name = 'age') THEN
        ALTER TABLE patients ADD COLUMN age integer;
    END IF;
END $$;

-- Step 4: Create new patient_pre_registrations table structure
CREATE TABLE IF NOT EXISTS patient_pre_registrations_new (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
    registration_time timestamptz DEFAULT now(),
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    consent_agreed boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Step 5: Migrate data from old to new structure
DO $$ 
DECLARE
    migration_error text;
    error_context text;
BEGIN
    -- Migrate data to new pre-registrations table
    INSERT INTO patient_pre_registrations_new (
        user_id,
        patient_id,
        registration_time,
        status,
        consent_agreed,
        created_at,
        updated_at
    )
    SELECT 
        pr.user_id,
        p.id as patient_id,
        COALESCE(pr.registration_time, pr.created_at) as registration_time,
        'pending' as status,
        COALESCE(pr.consent_agreed, false) as consent_agreed,
        pr.created_at,
        pr.updated_at
    FROM patient_pre_registrations pr
    JOIN patients p ON pr.user_id = p.user_id
    ON CONFLICT DO NOTHING;

    -- Update patients table with any missing data from pre-registrations
    -- Only if the columns exist in the old table
    IF EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'patient_pre_registrations' AND column_name = 'lab_reports_url') THEN
        UPDATE patients p
        SET 
            lab_report_urls = COALESCE(pr.lab_reports_url, p.lab_report_urls),
            id_proof_urls = COALESCE(pr.aadhaar_url, p.id_proof_urls)
        FROM patient_pre_registrations pr
        WHERE p.user_id = pr.user_id;
    END IF;

    -- Mark migration as completed
    UPDATE schema_migrations 
    SET status = 'completed', completed_at = now() 
    WHERE name = '20251014000000_refactor_patient_registration';

EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS 
        migration_error = PG_EXCEPTION_DETAIL,
        error_context = PG_EXCEPTION_CONTEXT;
    
    UPDATE schema_migrations 
    SET status = 'failed', 
        error_message = migration_error || ' | Context: ' || error_context,
        completed_at = now()
    WHERE name = '20251014000000_refactor_patient_registration';
    
    RAISE EXCEPTION 'Migration failed: %', migration_error || ' | Context: ' || error_context;
END $$;

-- Step 6: Rename tables
ALTER TABLE patient_pre_registrations RENAME TO patient_pre_registrations_old;
ALTER TABLE patient_pre_registrations_new RENAME TO patient_pre_registrations;

-- Step 7: Create indexes
CREATE INDEX IF NOT EXISTS idx_patient_pre_reg_user_id ON patient_pre_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_pre_reg_patient_id ON patient_pre_registrations(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_pre_reg_status ON patient_pre_registrations(status);

-- Step 8: Add RLS policies
ALTER TABLE patient_pre_registrations ENABLE ROW LEVEL SECURITY;

-- Users can view their own pre-registration
CREATE POLICY "Users can view own pre-registration" ON patient_pre_registrations
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own pre-registration
CREATE POLICY "Users can insert own pre-registration" ON patient_pre_registrations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own pre-registration
CREATE POLICY "Users can update own pre-registration" ON patient_pre_registrations
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Step 9: Create trigger for updated_at
CREATE TRIGGER set_updated_at_patient_pre_registrations
    BEFORE UPDATE ON patient_pre_registrations
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- Note: Keep old tables for 30 days before dropping them
-- TODO: Create a cleanup migration after 30 days to drop _old and _backup tables
