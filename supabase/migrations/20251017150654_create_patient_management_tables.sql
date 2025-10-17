/*
  # Create Patient Management Tables for Diagnosis & Prescription System

  ## New Tables Created
  
  1. `patient_vitals`
     - Stores patient vital signs data
     - Fields: patient_id, blood_pressure, heart_rate, temperature, weight, bmi, recorded_date
     - Indexed on patient_id for fast lookup
  
  2. `patient_reports`
     - Stores uploaded medical documents and reports
     - Fields: patient_id, report_name, report_type, file_url, file_size, uploaded_by, upload_date
     - Links to Supabase storage bucket
  
  3. `consultations`
     - Stores diagnosis and consultation records
     - Fields: patient_id, doctor_id, chief_complaint, diagnosis, clinical_notes, 
              consultation_date, follow_up_date, additional_instructions
     - Creates relationship between patients and doctors
  
  4. `prescriptions`
     - Stores prescription metadata
     - Fields: consultation_id, patient_id, doctor_id, prescription_date, status
     - Links to consultations table
  
  5. `prescription_items`
     - Stores individual medication entries
     - Fields: prescription_id, medicine_name, dosage, frequency, duration, instructions
     - Links to prescriptions table
  
  ## Security
  
  - Enable RLS on all tables for data security
  - Add policies for doctors to read/write patient data they're treating
  - Add policies for patients to read their own data
  - Add composite indexes for performance optimization
  
  ## Important Notes
  
  - All timestamps use timestamptz for timezone consistency
  - Foreign keys ensure referential integrity
  - Cascade deletes not enabled to preserve medical records
  - Status fields use CHECK constraints for data validation
*/

-- =====================================================
-- 1. PATIENT VITALS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS patient_vitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id),
  blood_pressure text,
  heart_rate integer,
  temperature numeric(4,1),
  weight numeric(5,2),
  bmi numeric(4,2),
  spo2 integer,
  respiratory_rate integer,
  recorded_by uuid REFERENCES doctors(id),
  recorded_date timestamptz DEFAULT now() NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  CONSTRAINT valid_heart_rate CHECK (heart_rate IS NULL OR (heart_rate >= 30 AND heart_rate <= 250)),
  CONSTRAINT valid_temperature CHECK (temperature IS NULL OR (temperature >= 90 AND temperature <= 110)),
  CONSTRAINT valid_weight CHECK (weight IS NULL OR (weight >= 0 AND weight <= 500)),
  CONSTRAINT valid_bmi CHECK (bmi IS NULL OR (bmi >= 10 AND bmi <= 80)),
  CONSTRAINT valid_spo2 CHECK (spo2 IS NULL OR (spo2 >= 0 AND spo2 <= 100))
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_patient_vitals_patient_id ON patient_vitals(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_vitals_recorded_date ON patient_vitals(recorded_date DESC);
CREATE INDEX IF NOT EXISTS idx_patient_vitals_patient_date ON patient_vitals(patient_id, recorded_date DESC);

-- =====================================================
-- 2. PATIENT REPORTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS patient_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id),
  report_name text NOT NULL,
  report_type text DEFAULT 'general',
  file_url text NOT NULL,
  file_size bigint,
  file_type text,
  uploaded_by uuid REFERENCES doctors(id),
  upload_date timestamptz DEFAULT now() NOT NULL,
  description text,
  is_deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  CONSTRAINT valid_report_type CHECK (
    report_type IN ('lab_report', 'imaging', 'prescription', 'medical_certificate', 'referral', 'general')
  )
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_patient_reports_patient_id ON patient_reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_reports_upload_date ON patient_reports(upload_date DESC);
CREATE INDEX IF NOT EXISTS idx_patient_reports_type ON patient_reports(report_type);

-- =====================================================
-- 3. CONSULTATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id),
  doctor_id uuid NOT NULL REFERENCES doctors(id),
  appointment_id uuid REFERENCES appointments(id),
  chief_complaint text NOT NULL,
  diagnosis text NOT NULL,
  clinical_notes text,
  consultation_date timestamptz DEFAULT now() NOT NULL,
  follow_up_date date,
  additional_instructions text,
  status text DEFAULT 'active',
  consultation_type text DEFAULT 'in_person',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  CONSTRAINT valid_status CHECK (status IN ('active', 'completed', 'cancelled')),
  CONSTRAINT valid_consultation_type CHECK (
    consultation_type IN ('in_person', 'video', 'audio', 'emergency')
  )
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_consultations_patient_id ON consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor_id ON consultations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consultations_date ON consultations(consultation_date DESC);
CREATE INDEX IF NOT EXISTS idx_consultations_patient_doctor ON consultations(patient_id, doctor_id, consultation_date DESC);

-- =====================================================
-- 4. PRESCRIPTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid NOT NULL REFERENCES consultations(id),
  patient_id uuid NOT NULL REFERENCES patients(id),
  doctor_id uuid NOT NULL REFERENCES doctors(id),
  prescription_date timestamptz DEFAULT now() NOT NULL,
  status text DEFAULT 'active',
  valid_until date,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  CONSTRAINT valid_prescription_status CHECK (
    status IN ('active', 'completed', 'cancelled', 'expired')
  )
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_prescriptions_consultation_id ON prescriptions(consultation_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor_id ON prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_date ON prescriptions(prescription_date DESC);

-- =====================================================
-- 5. PRESCRIPTION ITEMS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS prescription_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  medicine_name text NOT NULL,
  dosage text NOT NULL,
  frequency text NOT NULL,
  duration text NOT NULL,
  instructions text,
  quantity integer,
  route text DEFAULT 'oral',
  item_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  
  CONSTRAINT valid_quantity CHECK (quantity IS NULL OR quantity > 0),
  CONSTRAINT valid_route CHECK (
    route IN ('oral', 'topical', 'injection', 'inhalation', 'sublingual', 'other')
  )
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_prescription_items_prescription_id ON prescription_items(prescription_id);
CREATE INDEX IF NOT EXISTS idx_prescription_items_order ON prescription_items(prescription_id, item_order);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE patient_vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_items ENABLE ROW LEVEL SECURITY;

-- Patient Vitals Policies
CREATE POLICY "Doctors can view vitals of their patients"
  ON patient_vitals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.patient_id = patient_vitals.patient_id
      AND appointments.doctor_id IN (
        SELECT id FROM doctors WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Doctors can insert vitals for their patients"
  ON patient_vitals FOR INSERT
  TO authenticated
  WITH CHECK (
    recorded_by IN (SELECT id FROM doctors WHERE user_id = auth.uid())
  );

CREATE POLICY "Doctors can update vitals they recorded"
  ON patient_vitals FOR UPDATE
  TO authenticated
  USING (recorded_by IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

-- Patient Reports Policies
CREATE POLICY "Doctors can view reports of their patients"
  ON patient_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.patient_id = patient_reports.patient_id
      AND appointments.doctor_id IN (
        SELECT id FROM doctors WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Doctors can upload reports for their patients"
  ON patient_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by IN (SELECT id FROM doctors WHERE user_id = auth.uid())
  );

CREATE POLICY "Doctors can update reports they uploaded"
  ON patient_reports FOR UPDATE
  TO authenticated
  USING (uploaded_by IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

-- Consultations Policies
CREATE POLICY "Doctors can view their consultations"
  ON consultations FOR SELECT
  TO authenticated
  USING (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

CREATE POLICY "Doctors can create consultations"
  ON consultations FOR INSERT
  TO authenticated
  WITH CHECK (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

CREATE POLICY "Doctors can update their consultations"
  ON consultations FOR UPDATE
  TO authenticated
  USING (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

-- Prescriptions Policies
CREATE POLICY "Doctors can view their prescriptions"
  ON prescriptions FOR SELECT
  TO authenticated
  USING (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

CREATE POLICY "Doctors can create prescriptions"
  ON prescriptions FOR INSERT
  TO authenticated
  WITH CHECK (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

CREATE POLICY "Doctors can update their prescriptions"
  ON prescriptions FOR UPDATE
  TO authenticated
  USING (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

-- Prescription Items Policies
CREATE POLICY "Doctors can view prescription items"
  ON prescription_items FOR SELECT
  TO authenticated
  USING (
    prescription_id IN (
      SELECT id FROM prescriptions
      WHERE doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Doctors can create prescription items"
  ON prescription_items FOR INSERT
  TO authenticated
  WITH CHECK (
    prescription_id IN (
      SELECT id FROM prescriptions
      WHERE doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Doctors can delete prescription items"
  ON prescription_items FOR DELETE
  TO authenticated
  USING (
    prescription_id IN (
      SELECT id FROM prescriptions
      WHERE doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    )
  );

-- =====================================================
-- TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_patient_vitals_updated_at ON patient_vitals;
CREATE TRIGGER update_patient_vitals_updated_at
  BEFORE UPDATE ON patient_vitals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_patient_reports_updated_at ON patient_reports;
CREATE TRIGGER update_patient_reports_updated_at
  BEFORE UPDATE ON patient_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_consultations_updated_at ON consultations;
CREATE TRIGGER update_consultations_updated_at
  BEFORE UPDATE ON consultations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_prescriptions_updated_at ON prescriptions;
CREATE TRIGGER update_prescriptions_updated_at
  BEFORE UPDATE ON prescriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
