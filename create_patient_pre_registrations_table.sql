-- Create patient_pre_registrations table for storing pre-registration form data
-- This table stores all the information collected from the Patient Pre-Registration Form

CREATE TABLE IF NOT EXISTS public.patient_pre_registrations (
    -- Primary key
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- User reference (foreign key to auth.users)
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Demographics Section
    full_name VARCHAR(255) NOT NULL,
    age INTEGER NOT NULL CHECK (age >= 1 AND age <= 120),
    gender VARCHAR(50) NOT NULL CHECK (gender IN ('male', 'female', 'other', 'prefer-not-to-say')),
    phone_number VARCHAR(20) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    
    -- Medical Information
    symptoms TEXT NOT NULL,
    
    -- Document URLs (will store paths to files in Supabase Storage)
    lab_reports_url TEXT,
    aadhaar_url TEXT,
    
    -- Consent and Status
    consent_agreed BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'completed')),
    
    -- Queue and Token Management
    queue_token VARCHAR(50) UNIQUE,
    registration_time TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_phone_number CHECK (phone_number ~ '^[0-9]{10}$'),
    CONSTRAINT consent_required CHECK (consent_agreed = TRUE)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_patient_pre_registrations_user_id ON public.patient_pre_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_pre_registrations_status ON public.patient_pre_registrations(status);
CREATE INDEX IF NOT EXISTS idx_patient_pre_registrations_queue_token ON public.patient_pre_registrations(queue_token);
CREATE INDEX IF NOT EXISTS idx_patient_pre_registrations_created_at ON public.patient_pre_registrations(created_at);
CREATE INDEX IF NOT EXISTS idx_patient_pre_registrations_phone_number ON public.patient_pre_registrations(phone_number);

-- Enable Row Level Security (RLS)
ALTER TABLE public.patient_pre_registrations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for secure access
-- Policy: Users can only see their own pre-registrations
CREATE POLICY "Users can view own pre-registrations" ON public.patient_pre_registrations
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own pre-registrations
CREATE POLICY "Users can create own pre-registrations" ON public.patient_pre_registrations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own pre-registrations (only if status is pending)
CREATE POLICY "Users can update own pending pre-registrations" ON public.patient_pre_registrations
    FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- Note: Admin policies commented out as profiles table doesn't have role column
-- Uncomment and modify these policies after adding role column to profiles table if needed

-- -- Policy: Admin users can view all pre-registrations
-- CREATE POLICY "Admin can view all pre-registrations" ON public.patient_pre_registrations
--     FOR SELECT USING (
--         EXISTS (
--             SELECT 1 FROM public.profiles 
--             WHERE profiles.id = auth.uid() 
--             AND profiles.role = 'admin'
--         )
--     );

-- -- Policy: Admin users can update pre-registrations
-- CREATE POLICY "Admin can update all pre-registrations" ON public.patient_pre_registrations
--     FOR UPDATE USING (
--         EXISTS (
--             SELECT 1 FROM public.profiles 
--             WHERE profiles.id = auth.uid() 
--             AND profiles.role = 'admin'
--         )
--     );

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at column
CREATE TRIGGER update_patient_pre_registrations_updated_at
    BEFORE UPDATE ON public.patient_pre_registrations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create a function to generate unique queue tokens
CREATE OR REPLACE FUNCTION public.generate_queue_token()
RETURNS TEXT AS $$
DECLARE
    token TEXT;
    exists_check INTEGER;
BEGIN
    LOOP
        -- Generate a 6-digit alphanumeric token
        token := upper(substring(md5(random()::text) from 1 for 6));
        
        -- Check if token already exists
        SELECT COUNT(*) INTO exists_check 
        FROM public.patient_pre_registrations 
        WHERE queue_token = token;
        
        -- If token doesn't exist, return it
        IF exists_check = 0 THEN
            RETURN token;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE public.patient_pre_registrations IS 'Stores patient pre-registration form data including demographics, medical info, and document uploads';
COMMENT ON COLUMN public.patient_pre_registrations.user_id IS 'Reference to the authenticated user who submitted the pre-registration';
COMMENT ON COLUMN public.patient_pre_registrations.lab_reports_url IS 'URL/path to uploaded lab reports document in Supabase Storage';
COMMENT ON COLUMN public.patient_pre_registrations.aadhaar_url IS 'URL/path to uploaded Aadhaar document in Supabase Storage';
COMMENT ON COLUMN public.patient_pre_registrations.queue_token IS 'Unique token for queue management system';
COMMENT ON COLUMN public.patient_pre_registrations.status IS 'Current status of the pre-registration: pending, verified, rejected, completed';

-- Insert some sample data for testing (optional - remove in production)
-- INSERT INTO public.patient_pre_registrations (
--     user_id,
--     full_name,
--     age,
--     gender,
--     phone_number,
--     city,
--     state,
--     symptoms,
--     consent_agreed,
--     status
-- ) VALUES (
--     '00000000-0000-0000-0000-000000000000', -- Replace with actual user ID
--     'John Doe',
--     30,
--     'male',
--     '9876543210',
--     'Mumbai',
--     'maharashtra',
--     'Fever and cough for 3 days',
--     TRUE,
--     'pending'
-- );
