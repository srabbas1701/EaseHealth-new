-- Create storage buckets for patient documents
-- This migration creates the necessary storage buckets and policies for patient document uploads

-- Create lab-reports bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lab-reports',
  'lab-reports',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Create aadhaar-documents bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'aadhaar-documents',
  'aadhaar-documents',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Create profile_image bucket (public for profile images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile_image',
  'profile_image',
  true, -- Public for profile images
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for lab-reports bucket
-- Allow authenticated users to upload their own documents
CREATE POLICY "Allow authenticated users to upload lab reports"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'lab-reports' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to view their own documents
CREATE POLICY "Allow authenticated users to view their own lab reports"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'lab-reports' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own documents
CREATE POLICY "Allow authenticated users to update their own lab reports"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'lab-reports' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own documents
CREATE POLICY "Allow authenticated users to delete their own lab reports"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'lab-reports' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for aadhaar-documents bucket
-- Allow authenticated users to upload their own documents
CREATE POLICY "Allow authenticated users to upload aadhaar documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'aadhaar-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to view their own documents
CREATE POLICY "Allow authenticated users to view their own aadhaar documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'aadhaar-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own documents
CREATE POLICY "Allow authenticated users to update their own aadhaar documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'aadhaar-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own documents
CREATE POLICY "Allow authenticated users to delete their own aadhaar documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'aadhaar-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for profile_image bucket (public)
-- Allow authenticated users to upload their own profile images
CREATE POLICY "Allow authenticated users to upload profile images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile_image' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to view their own profile images
CREATE POLICY "Allow authenticated users to view their own profile images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'profile_image' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own profile images
CREATE POLICY "Allow authenticated users to update their own profile images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile_image' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own profile images
CREATE POLICY "Allow authenticated users to delete their own profile images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile_image' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public to view profile images (since bucket is public)
CREATE POLICY "Allow public to view profile images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile_image');

-- Add a more permissive policy for registration time uploads
-- This allows users to upload during registration even before patient record is created
CREATE POLICY "Allow temporary uploads during patient registration"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('lab-reports', 'aadhaar-documents', 'profile_image') AND
  auth.uid() IS NOT NULL
);

-- Allow temporary file access during registration
CREATE POLICY "Allow temporary file access during patient registration"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id IN ('lab-reports', 'aadhaar-documents', 'profile_image') AND
  auth.uid() IS NOT NULL
);

-- Allow temporary file updates during registration
CREATE POLICY "Allow temporary file updates during patient registration"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id IN ('lab-reports', 'aadhaar-documents', 'profile_image') AND
  auth.uid() IS NOT NULL
);

-- Allow temporary file deletion during registration
CREATE POLICY "Allow temporary file deletion during patient registration"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id IN ('lab-reports', 'aadhaar-documents', 'profile_image') AND
  auth.uid() IS NOT NULL
);


