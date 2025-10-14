-- Create storage buckets for patient documents
-- This migration creates the necessary storage buckets and policies for patient file uploads
-- Note: This must be run with proper permissions or through Supabase Dashboard

-- Create lab-reports bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lab-reports',
  'lab-reports',
  false, -- Private bucket
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- Create aadhaar-documents bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'aadhaar-documents',
  'aadhaar-documents',
  false, -- Private bucket
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- Create profile_image bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile_image',
  'profile_image',
  true, -- Public bucket for profile images
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- Note: RLS policies for storage.objects need to be created through Supabase Dashboard
-- Go to Storage > Policies and create the following policies:

-- Policy 1: Allow patient uploads during registration
-- Name: "Allow patient uploads during registration"
-- Target roles: authenticated
-- Operation: INSERT
-- Policy definition: bucket_id IN ('lab-reports', 'aadhaar-documents', 'profile_image') AND auth.uid() IS NOT NULL

-- Policy 2: Allow patient file access
-- Name: "Allow patient file access"
-- Target roles: authenticated
-- Operation: SELECT
-- Policy definition: bucket_id IN ('lab-reports', 'aadhaar-documents', 'profile_image') AND auth.uid() IS NOT NULL

-- Policy 3: Allow patient file updates
-- Name: "Allow patient file updates"
-- Target roles: authenticated
-- Operation: UPDATE
-- Policy definition: bucket_id IN ('lab-reports', 'aadhaar-documents', 'profile_image') AND auth.uid() IS NOT NULL

-- Policy 4: Allow patient file deletion
-- Name: "Allow patient file deletion"
-- Target roles: authenticated
-- Operation: DELETE
-- Policy definition: bucket_id IN ('lab-reports', 'aadhaar-documents', 'profile_image') AND auth.uid() IS NOT NULL

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE 'Patient storage buckets created successfully!';
    RAISE NOTICE 'IMPORTANT: You need to create RLS policies manually through Supabase Dashboard:';
    RAISE NOTICE 'Go to Storage > Policies and create policies for INSERT, SELECT, UPDATE, DELETE';
END $$;
