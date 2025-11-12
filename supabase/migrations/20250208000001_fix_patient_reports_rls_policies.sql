/*
  # Fix Patient Reports RLS Policies
  
  ## Problem
  The current RLS policies for patient_reports table are too restrictive:
  - Doctors cannot upload reports for patients (policy doesn't check appointment relationship)
  - Patients cannot upload their own reports (no INSERT policy for patients)
  - Doctors cannot update/delete patient-uploaded reports (policy only checks uploaded_by)
  - Patients cannot update/delete their own reports (no UPDATE policy for patients)
  
  ## Solution
  1. Fix doctor INSERT policy to verify appointment relationship
  2. Add patient INSERT policy allowing uploads for their own records
  3. Fix doctor UPDATE policy to allow updating ANY report for their patients
  4. Add patient UPDATE policy for their own reports
  
  ## Note
  This maintains security while allowing the intended workflow:
  - Patients can upload and manage their own reports
  - Doctors can upload and manage reports for patients they have appointments with
*/

-- ============================================
-- DROP OLD RESTRICTIVE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Doctors can upload reports for their patients" ON public.patient_reports;
DROP POLICY IF EXISTS "Doctors can update reports they uploaded" ON public.patient_reports;

-- ============================================
-- CREATE NEW COMPREHENSIVE POLICIES
-- ============================================

-- Policy 1: Doctors can INSERT reports for patients they have appointments with
CREATE POLICY "Doctors can upload reports for their patients"
  ON patient_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Verify the uploader is a doctor
    uploaded_by IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    AND
    -- Verify the doctor has an appointment with this patient
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.patient_id = patient_reports.patient_id
      AND appointments.doctor_id = uploaded_by
    )
  );

-- Policy 2: Patients can INSERT their own reports (uploaded_by = NULL)
CREATE POLICY "Patients can upload their own reports"
  ON patient_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Verify uploaded_by is NULL (patient upload)
    uploaded_by IS NULL
    AND
    -- Verify the patient_id matches the authenticated user's patient record
    patient_id IN (
      SELECT id FROM patients WHERE user_id = auth.uid()
    )
  );

-- Policy 3: Doctors can UPDATE any report for patients they have appointments with
-- This allows doctors to soft-delete (update is_deleted) or mark as reviewed
CREATE POLICY "Doctors can update reports for their patients"
  ON patient_reports FOR UPDATE
  TO authenticated
  USING (
    -- Verify the user is a doctor AND has an appointment with this patient
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.patient_id = patient_reports.patient_id
      AND appointments.doctor_id IN (
        SELECT id FROM doctors WHERE user_id = auth.uid()
      )
    )
  );

-- Policy 4: Patients can UPDATE their own reports
-- This allows patients to soft-delete their own reports
CREATE POLICY "Patients can update their own reports"
  ON patient_reports FOR UPDATE
  TO authenticated
  USING (
    -- Verify the patient_id matches the authenticated user's patient record
    patient_id IN (
      SELECT id FROM patients WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- VERIFICATION
-- ============================================

-- To verify these policies work, you can test:
-- 1. Patient uploads: uploaded_by = NULL, patient_id = their patient record
-- 2. Doctor uploads: uploaded_by = doctor_id, must have appointment with patient
-- 3. Patient soft-delete: UPDATE is_deleted = true for their own reports
-- 4. Doctor soft-delete: UPDATE is_deleted = true for any patient's reports (if they have appointment)

COMMENT ON TABLE patient_reports IS 
  'Patient medical reports with RLS policies allowing both patient and doctor uploads/updates';






