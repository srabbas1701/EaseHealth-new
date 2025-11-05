/*
  # Patient Access Policies for Reports

  ## Changes
  - Allow patients to SELECT their own rows in patient_reports
  - Update storage policy for lab-reports so patients can view files stored under
    either their user_id-based path or patient_id-based path

  ## Rationale
  - Frontend now reads solely from patient_reports; patients must be able to read their own records
  - Files can exist in two path formats:
      1) {userId}/documents/lab_reports/{file}
      2) {patientId}/{file}
    Patients should be able to generate signed URLs for both
*/

-- ============================================
-- patient_reports: Patient can view their own reports
-- ============================================
DO $$
BEGIN
  -- Drop if exists to avoid duplicates during iterative development
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'patient_reports' 
      AND policyname = 'Patients can view their own reports'
  ) THEN
    EXECUTE 'DROP POLICY "Patients can view their own reports" ON public.patient_reports';
  END IF;

  EXECUTE $$
    CREATE POLICY "Patients can view their own reports"
      ON public.patient_reports FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.patients p
          WHERE p.id = patient_reports.patient_id
            AND p.user_id = auth.uid()
        )
      )
    $$;
END $$;

-- ============================================
-- storage.objects (lab-reports): Patient can view by user_id or patient_id path
-- ============================================
DO $$
BEGIN
  -- Replace existing patient view policy on lab-reports bucket to handle both path formats
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Patients can view their own lab reports'
  ) THEN
    EXECUTE 'DROP POLICY "Patients can view their own lab reports" ON storage.objects';
  END IF;

  EXECUTE $$
    CREATE POLICY "Patients can view their own lab reports"
      ON storage.objects
      FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'lab-reports' AND (
          -- Patient uploads path: {userId}/...
          auth.uid()::text = split_part(name, '/', 1)
          OR
          -- Doctor uploads path: {patientId}/...
          EXISTS (
            SELECT 1 FROM public.patients p
            WHERE p.user_id = auth.uid()
              AND p.id::text = split_part(name, '/', 1)
          )
        )
      )
    $$;
END $$;



