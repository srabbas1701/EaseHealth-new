/*
  # Doctor Scheduling System Database Schema

  1. New Tables
    - `doctors`
      - `id` (uuid, primary key, references auth.users)
      - `user_id` (uuid, references auth.users for linking)
      - `full_name` (text, required)
      - `email` (text, unique, required)
      - `phone_number` (text, required)
      - `specialty` (text, required)
      - `license_number` (text, unique, required)
      - `experience_years` (integer, required)
      - `qualification` (text, required)
      - `hospital_affiliation` (text, optional)
      - `consultation_fee` (decimal, optional)
      - `profile_image_url` (text, optional)
      - `bio` (text, optional)
      - `is_verified` (boolean, default false)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `doctor_schedules`
      - `id` (uuid, primary key)
      - `doctor_id` (uuid, references doctors.id)
      - `day_of_week` (integer, 0-6 where 0=Sunday)
      - `start_time` (time, required)
      - `end_time` (time, required)
      - `slot_duration_minutes` (integer, default 15)
      - `break_start_time` (time, optional)
      - `break_end_time` (time, optional)
      - `is_available` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `time_slots`
      - `id` (uuid, primary key)
      - `doctor_id` (uuid, references doctors.id)
      - `schedule_date` (date, required)
      - `start_time` (time, required)
      - `end_time` (time, required)
      - `duration_minutes` (integer, required)
      - `status` (text, enum: available/booked/blocked/break)
      - `appointment_id` (uuid, optional for future appointments table)
      - `notes` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Doctors can manage their own profiles and schedules
    - Authenticated users can view active/verified doctors and available slots
    - Public users can view basic doctor information

  3. Constraints & Indexes
    - Unique constraints for email, license_number
    - Unique constraint for doctor schedule per day
    - Unique constraint for time slots per doctor/date/time
    - Indexes for performance optimization

  4. Triggers
    - Auto-update timestamps on all tables
*/

-- Create doctors table
CREATE TABLE IF NOT EXISTS doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone_number text NOT NULL,
  specialty text NOT NULL,
  license_number text UNIQUE NOT NULL,
  experience_years integer NOT NULL CHECK (experience_years >= 0),
  qualification text NOT NULL,
  hospital_affiliation text,
  consultation_fee decimal(10,2) CHECK (consultation_fee >= 0),
  profile_image_url text,
  bio text,
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create doctor_schedules table
CREATE TABLE IF NOT EXISTS doctor_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  slot_duration_minutes integer DEFAULT 15 CHECK (slot_duration_minutes > 0),
  break_start_time time,
  break_end_time time,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(doctor_id, day_of_week),
  CHECK (end_time > start_time),
  CHECK (
    (break_start_time IS NULL AND break_end_time IS NULL) OR
    (break_start_time IS NOT NULL AND break_end_time IS NOT NULL AND break_end_time > break_start_time)
  )
);

-- Create time_slots table
CREATE TABLE IF NOT EXISTS time_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  schedule_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'booked', 'blocked', 'break')),
  appointment_id uuid, -- For future appointments table
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(doctor_id, schedule_date, start_time),
  CHECK (end_time > start_time)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON doctors(user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_specialty ON doctors(specialty);
CREATE INDEX IF NOT EXISTS idx_doctors_active_verified ON doctors(is_active, is_verified);
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_doctor_id ON doctor_schedules(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_day ON doctor_schedules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_time_slots_doctor_date ON time_slots(doctor_id, schedule_date);
CREATE INDEX IF NOT EXISTS idx_time_slots_status ON time_slots(status);
CREATE INDEX IF NOT EXISTS idx_time_slots_available ON time_slots(doctor_id, schedule_date, status) WHERE status = 'available';

-- Enable Row Level Security
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for doctors table
CREATE POLICY "Public can view active verified doctors"
  ON doctors
  FOR SELECT
  TO public
  USING (is_active = true AND is_verified = true);

CREATE POLICY "Authenticated users can view all active doctors"
  ON doctors
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Doctors can view their own profile"
  ON doctors
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Doctors can update their own profile"
  ON doctors
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated users can create doctor profiles"
  ON doctors
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for doctor_schedules table
CREATE POLICY "Public can view schedules of active verified doctors"
  ON doctor_schedules
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM doctors 
      WHERE doctors.id = doctor_schedules.doctor_id 
      AND doctors.is_active = true 
      AND doctors.is_verified = true
    )
  );

CREATE POLICY "Authenticated users can view all schedules"
  ON doctor_schedules
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM doctors 
      WHERE doctors.id = doctor_schedules.doctor_id 
      AND doctors.is_active = true
    )
  );

CREATE POLICY "Doctors can manage their own schedules"
  ON doctor_schedules
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM doctors 
      WHERE doctors.id = doctor_schedules.doctor_id 
      AND doctors.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM doctors 
      WHERE doctors.id = doctor_schedules.doctor_id 
      AND doctors.user_id = auth.uid()
    )
  );

-- RLS Policies for time_slots table
CREATE POLICY "Public can view available slots of active verified doctors"
  ON time_slots
  FOR SELECT
  TO public
  USING (
    status = 'available' AND
    EXISTS (
      SELECT 1 FROM doctors 
      WHERE doctors.id = time_slots.doctor_id 
      AND doctors.is_active = true 
      AND doctors.is_verified = true
    )
  );

CREATE POLICY "Authenticated users can view available slots"
  ON time_slots
  FOR SELECT
  TO authenticated
  USING (
    status = 'available' AND
    EXISTS (
      SELECT 1 FROM doctors 
      WHERE doctors.id = time_slots.doctor_id 
      AND doctors.is_active = true
    )
  );

CREATE POLICY "Doctors can manage their own time slots"
  ON time_slots
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM doctors 
      WHERE doctors.id = time_slots.doctor_id 
      AND doctors.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM doctors 
      WHERE doctors.id = time_slots.doctor_id 
      AND doctors.user_id = auth.uid()
    )
  );

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER set_updated_at_doctors
  BEFORE UPDATE ON doctors
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_doctor_schedules
  BEFORE UPDATE ON doctor_schedules
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_time_slots
  BEFORE UPDATE ON time_slots
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Insert sample doctor data for testing (optional)
INSERT INTO doctors (
  user_id,
  full_name,
  email,
  phone_number,
  specialty,
  license_number,
  experience_years,
  qualification,
  hospital_affiliation,
  consultation_fee,
  bio,
  is_verified,
  is_active
) VALUES 
(
  NULL, -- Will need to be updated with actual user_id after doctor signs up
  'Dr. Anjali Sharma',
  'anjali.sharma@easehealth.in',
  '+91-9876543210',
  'Cardiologist',
  'MCI-12345-2020',
  8,
  'MBBS, MD (Cardiology)',
  'Apollo Hospital, Mumbai',
  1500.00,
  'Experienced cardiologist specializing in preventive cardiology and heart disease management.',
  true,
  true
),
(
  NULL,
  'Dr. Rajesh Kumar',
  'rajesh.kumar@easehealth.in',
  '+91-9876543211',
  'Neurologist',
  'MCI-12346-2018',
  10,
  'MBBS, MD (Neurology), DM (Neurology)',
  'Fortis Hospital, Delhi',
  2000.00,
  'Specialist in neurological disorders, stroke management, and epilepsy treatment.',
  true,
  true
),
(
  NULL,
  'Dr. Priya Singh',
  'priya.singh@easehealth.in',
  '+91-9876543212',
  'Dermatologist',
  'MCI-12347-2019',
  6,
  'MBBS, MD (Dermatology)',
  'Max Hospital, Bangalore',
  1200.00,
  'Expert in skin care, cosmetic dermatology, and dermatological surgeries.',
  true,
  true
);

-- Insert sample schedules for the doctors
INSERT INTO doctor_schedules (
  doctor_id,
  day_of_week,
  start_time,
  end_time,
  slot_duration_minutes,
  break_start_time,
  break_end_time,
  is_available
) 
SELECT 
  d.id,
  generate_series(1, 5) as day_of_week, -- Monday to Friday
  '09:00:00'::time,
  '17:00:00'::time,
  30,
  '13:00:00'::time,
  '14:00:00'::time,
  true
FROM doctors d
WHERE d.email IN ('anjali.sharma@easehealth.in', 'rajesh.kumar@easehealth.in', 'priya.singh@easehealth.in');

-- Insert Saturday schedules (shorter hours)
INSERT INTO doctor_schedules (
  doctor_id,
  day_of_week,
  start_time,
  end_time,
  slot_duration_minutes,
  is_available
) 
SELECT 
  d.id,
  6 as day_of_week, -- Saturday
  '09:00:00'::time,
  '13:00:00'::time,
  30,
  true
FROM doctors d
WHERE d.email IN ('anjali.sharma@easehealth.in', 'rajesh.kumar@easehealth.in', 'priya.singh@easehealth.in');