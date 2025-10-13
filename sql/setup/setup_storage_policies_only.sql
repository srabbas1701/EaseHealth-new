-- Setup storage policies for doctor document uploads
-- Since RLS is already enabled, we only need to create the policies
-- Run this as postgres role

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Doctors can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Doctors can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Doctors can update their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Doctors can delete their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Doctors can upload their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view profile images" ON storage.objects;
DROP POLICY IF EXISTS "Doctors can update their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Doctors can delete their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Doctors can upload their own certificates" ON storage.objects;
DROP POLICY IF EXISTS "Doctors can view their own certificates" ON storage.objects;
DROP POLICY IF EXISTS "Doctors can update their own certificates" ON storage.objects;
DROP POLICY IF EXISTS "Doctors can delete their own certificates" ON storage.objects;

-- Create RLS policies for doctor documents bucket
CREATE POLICY "Doctors can upload their own documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'doctor-documents' AND
    auth.uid()::text = split_part(name, '/', 1)
  );

CREATE POLICY "Doctors can view their own documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'doctor-documents' AND
    auth.uid()::text = split_part(name, '/', 1)
  );

CREATE POLICY "Doctors can update their own documents"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'doctor-documents' AND
    auth.uid()::text = split_part(name, '/', 1)
  );

CREATE POLICY "Doctors can delete their own documents"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'doctor-documents' AND
    auth.uid()::text = split_part(name, '/', 1)
  );

-- Create RLS policies for doctor profile images bucket
CREATE POLICY "Doctors can upload their own profile images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'doctor-profile-images' AND
    auth.uid()::text = split_part(name, '/', 1)
  );

CREATE POLICY "Anyone can view profile images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'doctor-profile-images');

CREATE POLICY "Doctors can update their own profile images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'doctor-profile-images' AND
    auth.uid()::text = split_part(name, '/', 1)
  );

CREATE POLICY "Doctors can delete their own profile images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'doctor-profile-images' AND
    auth.uid()::text = split_part(name, '/', 1)
  );

-- Create RLS policies for doctor certificates bucket
CREATE POLICY "Doctors can upload their own certificates"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'doctor-certificates' AND
    auth.uid()::text = split_part(name, '/', 1)
  );

CREATE POLICY "Doctors can view their own certificates"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'doctor-certificates' AND
    auth.uid()::text = split_part(name, '/', 1)
  );

CREATE POLICY "Doctors can update their own certificates"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'doctor-certificates' AND
    auth.uid()::text = split_part(name, '/', 1)
  );

CREATE POLICY "Doctors can delete their own certificates"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'doctor-certificates' AND
    auth.uid()::text = split_part(name, '/', 1)
  );