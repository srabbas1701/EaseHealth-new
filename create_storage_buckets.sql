-- Create Supabase Storage Buckets for Patient Pre-Registration Documents
-- This script sets up two storage buckets: one for lab reports and one for Aadhaar documents

-- Create storage bucket for lab reports
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'lab-reports',
    'lab-reports',
    false, -- Private bucket for security
    10485760, -- 10MB file size limit (10 * 1024 * 1024)
    ARRAY['application/pdf', 'image/jpeg', 'image/jpg']
) ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create storage bucket for Aadhaar documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'aadhaar-documents',
    'aadhaar-documents',
    false, -- Private bucket for security
    10485760, -- 10MB file size limit (10 * 1024 * 1024)
    ARRAY['application/pdf', 'image/jpeg', 'image/jpg']
) ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Add comments for documentation
COMMENT ON TABLE storage.buckets IS 'Storage buckets for patient pre-registration documents: lab-reports and aadhaar-documents';

-- Verify buckets were created
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id IN ('lab-reports', 'aadhaar-documents');

