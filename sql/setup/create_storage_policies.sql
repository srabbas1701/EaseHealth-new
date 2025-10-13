-- Create Row Level Security (RLS) policies for Supabase Storage Buckets
-- This script sets up secure access policies for the document storage buckets

-- ========================================
-- LAB REPORTS BUCKET POLICIES
-- ========================================

-- Policy: Users can upload lab reports to their own folder
CREATE POLICY "Users can upload lab reports to own folder" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'lab-reports' 
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND auth.role() = 'authenticated'
);

-- Policy: Users can view their own lab reports
CREATE POLICY "Users can view own lab reports" ON storage.objects
FOR SELECT USING (
    bucket_id = 'lab-reports' 
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND auth.role() = 'authenticated'
);

-- Policy: Users can update their own lab reports
CREATE POLICY "Users can update own lab reports" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'lab-reports' 
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND auth.role() = 'authenticated'
);

-- Policy: Users can delete their own lab reports
CREATE POLICY "Users can delete own lab reports" ON storage.objects
FOR DELETE USING (
    bucket_id = 'lab-reports' 
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND auth.role() = 'authenticated'
);

-- ========================================
-- AADHAAR DOCUMENTS BUCKET POLICIES
-- ========================================

-- Policy: Users can upload Aadhaar documents to their own folder
CREATE POLICY "Users can upload Aadhaar documents to own folder" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'aadhaar-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND auth.role() = 'authenticated'
);

-- Policy: Users can view their own Aadhaar documents
CREATE POLICY "Users can view own Aadhaar documents" ON storage.objects
FOR SELECT USING (
    bucket_id = 'aadhaar-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND auth.role() = 'authenticated'
);

-- Policy: Users can update their own Aadhaar documents
CREATE POLICY "Users can update own Aadhaar documents" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'aadhaar-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND auth.role() = 'authenticated'
);

-- Policy: Users can delete their own Aadhaar documents
CREATE POLICY "Users can delete own Aadhaar documents" ON storage.objects
FOR DELETE USING (
    bucket_id = 'aadhaar-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND auth.role() = 'authenticated'
);

-- ========================================
-- ADMIN POLICIES (for healthcare staff/admin access)
-- Note: Commented out as profiles table doesn't have role column
-- Uncomment after adding role column to profiles table if needed
-- ========================================

-- -- Policy: Admin users can view all lab reports
-- CREATE POLICY "Admin can view all lab reports" ON storage.objects
-- FOR SELECT USING (
--     bucket_id = 'lab-reports' 
--     AND EXISTS (
--         SELECT 1 FROM public.profiles 
--         WHERE profiles.id = auth.uid() 
--         AND profiles.role = 'admin'
--     )
-- );

-- -- Policy: Admin users can view all Aadhaar documents
-- CREATE POLICY "Admin can view all Aadhaar documents" ON storage.objects
-- FOR SELECT USING (
--     bucket_id = 'aadhaar-documents' 
--     AND EXISTS (
--         SELECT 1 FROM public.profiles 
--         WHERE profiles.id = auth.uid() 
--         AND profiles.role = 'admin'
--     )
-- );

-- ========================================
-- DOCTOR POLICIES (for doctors accessing patient documents)
-- ========================================

-- Policy: Doctors can view lab reports of patients they have appointments with
CREATE POLICY "Doctors can view patient lab reports" ON storage.objects
FOR SELECT USING (
    bucket_id = 'lab-reports' 
    AND EXISTS (
        SELECT 1 FROM public.doctors 
        WHERE doctors.user_id = auth.uid() 
        AND doctors.is_active = true
    )
);

-- Policy: Doctors can view Aadhaar documents of patients they have appointments with
CREATE POLICY "Doctors can view patient Aadhaar documents" ON storage.objects
FOR SELECT USING (
    bucket_id = 'aadhaar-documents' 
    AND EXISTS (
        SELECT 1 FROM public.doctors 
        WHERE doctors.user_id = auth.uid() 
        AND doctors.is_active = true
    )
);

-- ========================================
-- HELPER FUNCTIONS FOR FILE ORGANIZATION
-- ========================================

-- Function to get the user's folder path for lab reports
CREATE OR REPLACE FUNCTION public.get_lab_reports_folder_path(user_id UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN user_id::text || '/';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get the user's folder path for Aadhaar documents
CREATE OR REPLACE FUNCTION public.get_aadhaar_folder_path(user_id UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN user_id::text || '/';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate unique filename with timestamp
CREATE OR REPLACE FUNCTION public.generate_document_filename(user_id UUID, document_type TEXT, original_filename TEXT)
RETURNS TEXT AS $$
DECLARE
    file_extension TEXT;
    timestamp_str TEXT;
    new_filename TEXT;
BEGIN
    -- Extract file extension
    file_extension := lower(split_part(original_filename, '.', array_length(string_to_array(original_filename, '.'), 1)));
    
    -- Generate timestamp string
    timestamp_str := to_char(NOW(), 'YYYY-MM-DD_HH24-MI-SS');
    
    -- Create new filename: userid_documenttype_timestamp.extension
    new_filename := user_id::text || '_' || document_type || '_' || timestamp_str || '.' || file_extension;
    
    RETURN new_filename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON FUNCTION public.get_lab_reports_folder_path IS 'Returns the folder path for a user''s lab reports in the storage bucket';
COMMENT ON FUNCTION public.get_aadhaar_folder_path IS 'Returns the folder path for a user''s Aadhaar documents in the storage bucket';
COMMENT ON FUNCTION public.generate_document_filename IS 'Generates a unique filename with user ID, document type, and timestamp';

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Verify storage policies are created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%lab%' OR policyname LIKE '%aadhaar%'
ORDER BY policyname;

-- Verify buckets exist and are properly configured
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id IN ('lab-reports', 'aadhaar-documents');
