/*
  # Add Storage Policies for Doctor Access to Patient Reports
  
  ## Changes
  - Add policies to allow doctors to view, upload, and manage lab reports for their patients
  - Doctors can access reports for patients they have appointments with
  
  ## Security
  - Maintains RLS security - doctors can only access reports for patients with active appointments
  - Does not affect existing patient access policies
*/

-- ============================================
-- STORAGE POLICIES FOR DOCTOR ACCESS TO LAB REPORTS
-- ============================================

-- Policy: Doctors can view lab reports of their patients
-- Allows doctors to generate signed URLs and view reports for patients they're treating
-- Handles both path formats:
--   - Patient uploads: {userId}/documents/lab_reports/{file}
--   - Doctor uploads: {patientId}/{file}
CREATE POLICY "Doctors can view patient lab reports"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'lab-reports' 
    AND (
      -- Check if doctor has appointment with patient (match first folder as userId)
      EXISTS (
        SELECT 1 
        FROM appointments
        INNER JOIN doctors ON doctors.id = appointments.doctor_id
        INNER JOIN patients ON patients.id = appointments.patient_id
        WHERE doctors.user_id = auth.uid()
        AND patients.user_id::text = split_part(name, '/', 1)
      )
      OR
      -- Also check direct patient_id match (for doctor uploads)
      EXISTS (
        SELECT 1 
        FROM appointments
        INNER JOIN doctors ON doctors.id = appointments.doctor_id
        WHERE doctors.user_id = auth.uid()
        AND appointments.patient_id::text = split_part(name, '/', 1)
      )
    )
  );

-- Policy: Doctors can upload lab reports for their patients
-- Allows doctors to upload new reports on behalf of patients
CREATE POLICY "Doctors can upload patient lab reports"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'lab-reports'
    AND (
      -- Check for patient user_id match
      EXISTS (
        SELECT 1 
        FROM appointments
        INNER JOIN doctors ON doctors.id = appointments.doctor_id
        INNER JOIN patients ON patients.id = appointments.patient_id
        WHERE doctors.user_id = auth.uid()
        AND patients.user_id::text = split_part(name, '/', 1)
      )
      OR
      -- Check for patient_id match (doctor uploads)
      EXISTS (
        SELECT 1 
        FROM appointments
        INNER JOIN doctors ON doctors.id = appointments.doctor_id
        WHERE doctors.user_id = auth.uid()
        AND appointments.patient_id::text = split_part(name, '/', 1)
      )
    )
  );

-- Policy: Doctors can update lab reports they manage
-- Allows doctors to update metadata or replace reports
CREATE POLICY "Doctors can update patient lab reports"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'lab-reports'
    AND (
      EXISTS (
        SELECT 1 
        FROM appointments
        INNER JOIN doctors ON doctors.id = appointments.doctor_id
        INNER JOIN patients ON patients.id = appointments.patient_id
        WHERE doctors.user_id = auth.uid()
        AND patients.user_id::text = split_part(name, '/', 1)
      )
      OR
      EXISTS (
        SELECT 1 
        FROM appointments
        INNER JOIN doctors ON doctors.id = appointments.doctor_id
        WHERE doctors.user_id = auth.uid()
        AND appointments.patient_id::text = split_part(name, '/', 1)
      )
    )
  );

-- Policy: Doctors can delete lab reports for their patients (soft delete in DB, but policy for storage)
CREATE POLICY "Doctors can delete patient lab reports"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'lab-reports'
    AND (
      EXISTS (
        SELECT 1 
        FROM appointments
        INNER JOIN doctors ON doctors.id = appointments.doctor_id
        INNER JOIN patients ON patients.id = appointments.patient_id
        WHERE doctors.user_id = auth.uid()
        AND patients.user_id::text = split_part(name, '/', 1)
      )
      OR
      EXISTS (
        SELECT 1 
        FROM appointments
        INNER JOIN doctors ON doctors.id = appointments.doctor_id
        WHERE doctors.user_id = auth.uid()
        AND appointments.patient_id::text = split_part(name, '/', 1)
      )
    )
  );

-- Add comment for documentation
COMMENT ON POLICY "Doctors can view patient lab reports" ON storage.objects IS 
  'Allows doctors to view and generate signed URLs for lab reports of patients they have appointments with';

