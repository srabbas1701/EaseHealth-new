-- ============================================
-- URGENT FIX: Patient Reports RLS Policies
-- ============================================
-- 
-- INSTRUCTIONS:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Paste this entire script
-- 3. Click "Run" to apply the fix
--
-- This fixes the security policies that are preventing:
-- - Patients from uploading their own reports
-- - Doctors from uploading reports for patients
-- - Anyone from deleting/updating reports
-- ============================================

BEGIN;

-- ============================================
-- DROP ALL EXISTING POLICIES (OLD AND NEW)
-- ============================================

-- Drop old restrictive policies
DROP POLICY IF EXISTS "Doctors can upload reports for their patients" ON public.patient_reports;
DROP POLICY IF EXISTS "Doctors can update reports they uploaded" ON public.patient_reports;

-- Drop new policies if they exist (for re-running this script)
DROP POLICY IF EXISTS "Patients can upload their own reports" ON public.patient_reports;
DROP POLICY IF EXISTS "Doctors can update reports for their patients" ON public.patient_reports;
DROP POLICY IF EXISTS "Patients can update their own reports" ON public.patient_reports;

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

COMMIT;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Run these to verify the policies were created:
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'patient_reports'
ORDER BY policyname;

