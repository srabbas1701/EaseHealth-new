-- Setup storage policies for patient document uploads
-- Run this as postgres role

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Patients can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Patients can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Patients can update their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Patients can delete their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Patients can upload their own lab reports" ON storage.objects;
DROP POLICY IF EXISTS "Patients can view their own lab reports" ON storage.objects;
DROP POLICY IF EXISTS "Patients can update their own lab reports" ON storage.objects;
DROP POLICY IF EXISTS "Patients can delete their own lab reports" ON storage.objects;
DROP POLICY IF EXISTS "Patients can upload their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view patient profile images" ON storage.objects;
DROP POLICY IF EXISTS "Patients can update their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Patients can delete their own profile images" ON storage.objects;

-- Create RLS policies for aadhaar documents bucket
CREATE POLICY "Patients can upload their own documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'aadhaar-documents' AND
    auth.uid()::text = split_part(name, '/', 1)
  );

CREATE POLICY "Patients can view their own documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'aadhaar-documents' AND
    auth.uid()::text = split_part(name, '/', 1)
  );

CREATE POLICY "Patients can update their own documents"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'aadhaar-documents' AND
    auth.uid()::text = split_part(name, '/', 1)
  );

CREATE POLICY "Patients can delete their own documents"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'aadhaar-documents' AND
    auth.uid()::text = split_part(name, '/', 1)
  );

-- Create RLS policies for lab reports bucket
CREATE POLICY "Patients can upload their own lab reports"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'lab-reports' AND
    auth.uid()::text = split_part(name, '/', 1)
  );

CREATE POLICY "Patients can view their own lab reports"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'lab-reports' AND
    auth.uid()::text = split_part(name, '/', 1)
  );

CREATE POLICY "Patients can update their own lab reports"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'lab-reports' AND
    auth.uid()::text = split_part(name, '/', 1)
  );

CREATE POLICY "Patients can delete their own lab reports"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'lab-reports' AND
    auth.uid()::text = split_part(name, '/', 1)
  );

-- Create RLS policies for patient profile images bucket
CREATE POLICY "Patients can upload their own profile images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile_image' AND
    auth.uid()::text = split_part(name, '/', 1)
  );

CREATE POLICY "Anyone can view patient profile images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'profile_image');

CREATE POLICY "Patients can update their own profile images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile_image' AND
    auth.uid()::text = split_part(name, '/', 1)
  );

CREATE POLICY "Patients can delete their own profile images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile_image' AND
    auth.uid()::text = split_part(name, '/', 1)
  );
