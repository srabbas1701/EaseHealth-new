-- Alternative approach for storage setup
-- Try running these commands one by one if supabase_admin is not available

-- First, check if you can create buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('doctor-documents', 'doctor-documents', false, 10485760, ARRAY['image/jpeg', 'image/jpg', 'application/pdf']),
  ('doctor-profile-images', 'doctor-profile-images', true, 5242880, ARRAY['image/jpeg', 'image/jpg']),
  ('doctor-certificates', 'doctor-certificates', false, 10485760, ARRAY['image/jpeg', 'image/jpg', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Check if RLS is already enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- If RLS is not enabled, try this (might require admin privileges):
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

