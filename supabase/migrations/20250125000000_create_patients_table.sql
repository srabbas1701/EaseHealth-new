-- Create patients table (separate from doctors)
CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone_number text NOT NULL,
  date_of_birth date,
  gender text CHECK (gender IN ('Male', 'Female', 'Other', 'Prefer not to say')),
  address text,
  emergency_contact_name text,
  emergency_contact_phone text,
  medical_history text,
  allergies text,
  current_medications text,
  insurance_provider text,
  insurance_number text,
  blood_type text,
  profile_image_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create appointments table to link patients with doctors
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  appointment_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  duration_minutes integer NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  notes text,
  consultation_fee decimal(10,2),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(doctor_id, appointment_date, start_time)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Create triggers for updated_at
CREATE TRIGGER set_updated_at_patients
  BEFORE UPDATE ON patients
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_appointments
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Row Level Security (RLS) policies
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Patients can view and update their own profile
CREATE POLICY "Patients can view own profile" ON patients
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Patients can update own profile" ON patients
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Patients can insert own profile" ON patients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Doctors can view their patients' basic info
CREATE POLICY "Doctors can view their patients" ON patients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM doctors 
      WHERE doctors.user_id = auth.uid() 
      AND EXISTS (
        SELECT 1 FROM appointments 
        WHERE appointments.doctor_id = doctors.id 
        AND appointments.patient_id = patients.id
      )
    )
  );

-- Patients can view their own appointments
CREATE POLICY "Patients can view own appointments" ON appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM patients 
      WHERE patients.user_id = auth.uid() 
      AND patients.id = appointments.patient_id
    )
  );

-- Patients can create their own appointments
CREATE POLICY "Patients can create own appointments" ON appointments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM patients 
      WHERE patients.user_id = auth.uid() 
      AND patients.id = appointments.patient_id
    )
  );

-- Patients can update their own appointments (for cancellation)
CREATE POLICY "Patients can update own appointments" ON appointments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM patients 
      WHERE patients.user_id = auth.uid() 
      AND patients.id = appointments.patient_id
    )
  );

-- Doctors can view their own appointments
CREATE POLICY "Doctors can view own appointments" ON appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM doctors 
      WHERE doctors.user_id = auth.uid() 
      AND doctors.id = appointments.doctor_id
    )
  );

-- Doctors can update their own appointments
CREATE POLICY "Doctors can update own appointments" ON appointments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM doctors 
      WHERE doctors.user_id = auth.uid() 
      AND doctors.id = appointments.doctor_id
    )
  );
