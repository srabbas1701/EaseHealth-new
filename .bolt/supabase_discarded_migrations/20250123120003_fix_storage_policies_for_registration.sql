-- Fix storage policies to allow doctor registration uploads
-- This script adds policies that allow authenticated users to upload files during registration
-- even if they don't have a doctor profile yet

-- Add a policy for temporary uploads during registration
-- This allows authenticated users to upload files with any path structure
CREATE POLICY "Allow temporary uploads during registration"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id IN ('doctor-documents', 'doctor-profile-images', 'doctor-certificates') AND
    auth.uid() IS NOT NULL
  );

-- Add a policy for temporary file access during registration
CREATE POLICY "Allow temporary file access during registration"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id IN ('doctor-documents', 'doctor-profile-images', 'doctor-certificates') AND
    auth.uid() IS NOT NULL
  );

-- Add a policy for temporary file updates during registration
CREATE POLICY "Allow temporary file updates during registration"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id IN ('doctor-documents', 'doctor-profile-images', 'doctor-certificates') AND
    auth.uid() IS NOT NULL
  );

-- Add a policy for temporary file deletion during registration
CREATE POLICY "Allow temporary file deletion during registration"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id IN ('doctor-documents', 'doctor-profile-images', 'doctor-certificates') AND
    auth.uid() IS NOT NULL
  );

