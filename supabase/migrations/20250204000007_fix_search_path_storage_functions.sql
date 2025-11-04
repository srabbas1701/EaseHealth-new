-- Fix search_path security issue for storage-related functions
-- This adds SET search_path = public to prevent search path injection attacks
-- Note: These functions will only be updated if they exist in your database

-- Fix get_doctor_document_url function
CREATE OR REPLACE FUNCTION get_doctor_document_url(
  doctor_id uuid,
  document_type text,
  file_name text
) RETURNS text AS $$
DECLARE
  bucket_name text;
  file_path text;
BEGIN
  -- Determine bucket based on document type
  CASE document_type
    WHEN 'profile_image' THEN bucket_name := 'doctor-profile-images';
    WHEN 'medical_certificate', 'aadhaar_front', 'aadhaar_back', 'pan_card', 'cancelled_cheque' THEN bucket_name := 'doctor-documents';
    WHEN 'degree_certificate' THEN bucket_name := 'doctor-certificates';
    ELSE RETURN NULL;
  END CASE;
  
  -- Construct file path
  file_path := doctor_id::text || '/' || document_type || '/' || file_name;
  
  -- Return public URL
  RETURN 'https://your-supabase-url.supabase.co/storage/v1/object/public/' || bucket_name || '/' || file_path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix upload_doctor_document function
CREATE OR REPLACE FUNCTION upload_doctor_document(
  doctor_id uuid,
  document_type text,
  file_name text,
  file_data bytea,
  content_type text
) RETURNS text AS $$
DECLARE
  bucket_name text;
  file_path text;
  file_url text;
BEGIN
  -- Determine bucket based on document type
  CASE document_type
    WHEN 'profile_image' THEN bucket_name := 'doctor-profile-images';
    WHEN 'medical_certificate', 'aadhaar_front', 'aadhaar_back', 'pan_card', 'cancelled_cheque' THEN bucket_name := 'doctor-documents';
    WHEN 'degree_certificate' THEN bucket_name := 'doctor-certificates';
    ELSE RETURN NULL;
  END CASE;
  
  -- Construct file path
  file_path := doctor_id::text || '/' || document_type || '/' || file_name;
  
  -- Upload file to storage
  INSERT INTO storage.objects (bucket_id, name, owner, data, content_type)
  VALUES (bucket_name, file_path, auth.uid(), file_data, content_type);
  
  -- Return public URL for profile images, signed URL for others
  IF document_type = 'profile_image' THEN
    file_url := 'https://your-supabase-url.supabase.co/storage/v1/object/public/' || bucket_name || '/' || file_path;
  ELSE
    file_url := storage.create_signed_url(bucket_name, file_path, 3600);
  END IF;
  
  RETURN file_url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix get_lab_reports_folder_path function
CREATE OR REPLACE FUNCTION public.get_lab_reports_folder_path(user_id UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN user_id::text || '/';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix get_aadhaar_folder_path function
CREATE OR REPLACE FUNCTION public.get_aadhaar_folder_path(user_id UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN user_id::text || '/';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix generate_document_filename function
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update comments for documentation
COMMENT ON FUNCTION get_doctor_document_url(uuid, text, text) IS 'Returns the URL for a doctor document. Protected against search path injection.';
COMMENT ON FUNCTION upload_doctor_document(uuid, text, text, bytea, text) IS 'Uploads a doctor document to storage. Protected against search path injection.';
COMMENT ON FUNCTION public.get_lab_reports_folder_path(UUID) IS 'Returns the folder path for a user''s lab reports in the storage bucket. Protected against search path injection.';
COMMENT ON FUNCTION public.get_aadhaar_folder_path(UUID) IS 'Returns the folder path for a user''s Aadhaar documents in the storage bucket. Protected against search path injection.';
COMMENT ON FUNCTION public.generate_document_filename(UUID, TEXT, TEXT) IS 'Generates a unique filename with user ID, document type, and timestamp. Protected against search path injection.';

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_doctor_document_url(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION upload_doctor_document(uuid, text, text, bytea, text) TO authenticated;

