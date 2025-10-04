-- Step 1: Create storage buckets (run this first)
-- This can be run with postgres role
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('doctor-documents', 'doctor-documents', false, 10485760, ARRAY['image/jpeg', 'image/jpg', 'application/pdf']),
  ('doctor-profile-images', 'doctor-profile-images', true, 5242880, ARRAY['image/jpeg', 'image/jpg']),
  ('doctor-certificates', 'doctor-certificates', false, 10485760, ARRAY['image/jpeg', 'image/jpg', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;
