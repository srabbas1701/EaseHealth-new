/*
  # Pre-Registration and Doctor Schedule System

  1. New Tables
    - `pre_registrations` - Store patient pre-registration data
    - `doctors` - Store doctor information and credentials
    - `doctor_schedules` - Store doctor availability schedules
    - `time_slots` - Store individual time slot configurations

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for data access
    - Secure doctor authentication

  3. Features
    - Pre-registration form data storage
    - Dynamic doctor schedule management
    - Integration with appointment booking
*/

-- Pre-registrations table
CREATE TABLE IF NOT EXISTS pre_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  age integer NOT NULL CHECK (age > 0 AND age <= 120),
  gender text NOT NULL CHECK (gender IN ('male', 'female', 'other', 'prefer-not-to-say')),
  phone_number text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  symptoms text NOT NULL,
  lab_reports_url text,
  aadhaar_url text,
  consent_agreed boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  queue_token text,
  registration_time timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Doctors table
CREATE TABLE IF NOT EXISTS doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone_number text NOT NULL,
  specialty text NOT NULL,
  license_number text UNIQUE NOT NULL,
  experience_years integer NOT NULL DEFAULT 0,
  qualification text NOT NULL,
  hospital_affiliation text,
  consultation_fee decimal(10,2) DEFAULT 0,
  profile_image_url text,
  bio text,
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Doctor schedules table
CREATE TABLE IF NOT EXISTS doctor_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid REFERENCES doctors(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  start_time time NOT NULL,
  end_time time NOT NULL,
  slot_duration_minutes integer NOT NULL DEFAULT 15,
  break_start_time time,
  break_end_time time,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(doctor_id, day_of_week)
);

-- Time slots table for detailed slot management
CREATE TABLE IF NOT EXISTS time_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid REFERENCES doctors(id) ON DELETE CASCADE,
  schedule_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 15,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'booked', 'blocked', 'break')),
  appointment_id uuid, -- Reference to appointments table (to be created later)
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(doctor_id, schedule_date, start_time)
);

-- Enable RLS
ALTER TABLE pre_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;

-- Pre-registrations policies
CREATE POLICY "Users can create their own pre-registration"
  ON pre_registrations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own pre-registration"
  ON pre_registrations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own pre-registration"
  ON pre_registrations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Doctors policies
CREATE POLICY "Doctors can view their own profile"
  ON doctors
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Doctors can update their own profile"
  ON doctors
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active verified doctors"
  ON doctors
  FOR SELECT
  TO authenticated
  USING (is_active = true AND is_verified = true);

-- Doctor schedules policies
CREATE POLICY "Doctors can manage their own schedules"
  ON doctor_schedules
  FOR ALL
  TO authenticated
  USING (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can view active doctor schedules"
  ON doctor_schedules
  FOR SELECT
  TO authenticated
  USING (doctor_id IN (SELECT id FROM doctors WHERE is_active = true AND is_verified = true));

-- Time slots policies
CREATE POLICY "Doctors can manage their own time slots"
  ON time_slots
  FOR ALL
  TO authenticated
  USING (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can view available time slots"
  ON time_slots
  FOR SELECT
  TO authenticated
  USING (doctor_id IN (SELECT id FROM doctors WHERE is_active = true AND is_verified = true));

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_pre_registrations
  BEFORE UPDATE ON pre_registrations
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_doctors
  BEFORE UPDATE ON doctors
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_doctor_schedules
  BEFORE UPDATE ON doctor_schedules
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_time_slots
  BEFORE UPDATE ON time_slots
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Insert sample doctors for testing
INSERT INTO doctors (user_id, full_name, email, phone_number, specialty, license_number, qualification, experience_years, consultation_fee, is_verified, is_active) VALUES
  (gen_random_uuid(), 'Dr. Anjali Sharma', 'anjali.sharma@easehealth.in', '+91-9876543210', 'Cardiologist', 'MED-CARD-2020-001', 'MD Cardiology, AIIMS Delhi', 8, 800.00, true, true),
  (gen_random_uuid(), 'Dr. Rajesh Kumar', 'rajesh.kumar@easehealth.in', '+91-9876543211', 'Neurologist', 'MED-NEURO-2019-002', 'DM Neurology, PGI Chandigarh', 12, 1000.00, true, true),
  (gen_random_uuid(), 'Dr. Priya Patel', 'priya.patel@easehealth.in', '+91-9876543212', 'Dermatologist', 'MED-DERM-2021-003', 'MD Dermatology, KEM Mumbai', 5, 600.00, true, true),
  (gen_random_uuid(), 'Dr. Amit Singh', 'amit.singh@easehealth.in', '+91-9876543213', 'Orthopedic', 'MED-ORTHO-2018-004', 'MS Orthopedics, JIPMER', 10, 900.00, true, true),
  (gen_random_uuid(), 'Dr. Meera Gupta', 'meera.gupta@easehealth.in', '+91-9876543214', 'Pediatrician', 'MED-PEDI-2020-005', 'MD Pediatrics, SGPGI Lucknow', 7, 700.00, true, true);

-- Insert sample schedules for doctors
DO $$
DECLARE
  doctor_record RECORD;
BEGIN
  FOR doctor_record IN SELECT id FROM doctors LOOP
    -- Monday to Friday schedule (9 AM to 5 PM with 1 hour lunch break)
    FOR day_num IN 1..5 LOOP
      INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, break_start_time, break_end_time)
      VALUES (doctor_record.id, day_num, '09:00:00', '17:00:00', 15, '13:00:00', '14:00:00');
    END LOOP;
    
    -- Saturday half day (9 AM to 1 PM)
    INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes)
    VALUES (doctor_record.id, 6, '09:00:00', '13:00:00', 15);
  END LOOP;
END $$;