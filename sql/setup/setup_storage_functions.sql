-- Setup helper functions for doctor document management
-- Run this after the policies are created

-- Create a function to get doctor document URLs
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
  
  -- Return signed URL (valid for 1 hour)
  RETURN storage.create_signed_url(bucket_name, file_path, 3600);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_doctor_document_url(uuid, text, text) TO authenticated;

-- Create a function to upload doctor document
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION upload_doctor_document(uuid, text, text, bytea, text) TO authenticated;

