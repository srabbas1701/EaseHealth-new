-- ============================================
-- ROLLBACK: Restore Original Working Policies
-- ============================================
-- This restores the EXACT policies that were working before
-- ============================================

BEGIN;

-- First, let's check current RLS status
DO $$
BEGIN
  RAISE NOTICE 'Current RLS status for patient_reports:';
END $$;

-- ============================================
-- OPTION 1: DISABLE RLS (If it was disabled before)
-- ============================================
-- Uncomment the line below ONLY if RLS was disabled before:
-- ALTER TABLE patient_reports DISABLE ROW LEVEL SECURITY;

-- ============================================
-- OPTION 2: Restore Original Simple Policies
-- ============================================

-- Drop ALL current policies
DROP POLICY IF EXISTS "Doctors can upload reports for their patients" ON public.patient_reports;
DROP POLICY IF EXISTS "Doctors can update reports they uploaded" ON public.patient_reports;
DROP POLICY IF EXISTS "Doctors can update reports for their patients" ON public.patient_reports;
DROP POLICY IF EXISTS "Doctors can update reports of their patients" ON public.patient_reports;
DROP POLICY IF EXISTS "Patients can upload their own reports" ON public.patient_reports;
DROP POLICY IF EXISTS "Patients can update their own reports" ON public.patient_reports;
DROP POLICY IF EXISTS "Doctors can view reports of their patients" ON public.patient_reports;
DROP POLICY IF EXISTS "Patients can view their own reports" ON public.patient_reports;

-- Recreate the ORIGINAL simple policies from the initial migration
-- (These were the ones that were working)

-- SELECT policies
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

CREATE POLICY "Patients can view their own reports"
  ON patient_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = patient_reports.patient_id
        AND p.user_id = auth.uid()
    )
  );

-- INSERT policy (ORIGINAL - less restrictive)
CREATE POLICY "Allow authenticated users to insert reports"
  ON patient_reports FOR INSERT
  TO authenticated
  WITH CHECK (true);  -- Most permissive - let application logic handle validation

-- UPDATE policy (ORIGINAL - less restrictive)  
CREATE POLICY "Allow authenticated users to update reports"
  ON patient_reports FOR UPDATE
  TO authenticated
  USING (true);  -- Most permissive - let application logic handle validation

COMMIT;

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'patient_reports'
ORDER BY policyname;



