/*
  # Migrate Existing Lab Report URLs to patient_reports Table
  
  ## Changes
  - Move all existing lab report URLs from patients.lab_report_urls array to patient_reports table
  - Each URL in the array becomes a separate record
  - Preserves patient ownership and upload dates
  - Marks source as 'patient_registration'
  
  ## Process
  1. Loop through all patients with lab_report_urls
  2. For each URL in the array, create a patient_reports record
  3. Extract filename from URL path for report_name
  4. Maintain proper timestamps and relationships
*/

DO $$
DECLARE
  patient_record RECORD;
  report_url TEXT;
  url_index INTEGER;
  extracted_path TEXT;
  file_name TEXT;
  migrated_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Starting migration of lab_report_urls to patient_reports table...';
  
  -- Loop through all patients with lab_report_urls
  FOR patient_record IN 
    SELECT id, user_id, lab_report_urls, created_at
    FROM patients 
    WHERE lab_report_urls IS NOT NULL 
    AND array_length(lab_report_urls, 1) > 0
  LOOP
    url_index := 1;
    
    -- Loop through each URL in the array
    FOREACH report_url IN ARRAY patient_record.lab_report_urls
    LOOP
      -- Skip empty or null URLs
      IF report_url IS NULL OR report_url = '' THEN
        CONTINUE;
      END IF;
      
      -- Extract file path from URL
      -- URLs can be:
      -- 1. Full signed URL: https://...supabase.co/storage/v1/object/sign/lab-reports/path?token=...
      -- 2. Storage path: userId/documents/lab_reports/filename.pdf
      
      IF report_url LIKE '%/storage/v1/object/%' THEN
        -- Extract path from signed URL
        extracted_path := substring(report_url from '/lab-reports/([^?]+)');
        IF extracted_path IS NULL THEN
          -- Try alternative pattern
          extracted_path := report_url;
        END IF;
      ELSE
        -- Already a path
        extracted_path := report_url;
      END IF;
      
      -- Extract filename from path (last part after /)
      file_name := reverse(split_part(reverse(extracted_path), '/', 1));
      IF file_name IS NULL OR file_name = '' THEN
        file_name := 'Lab Report ' || url_index;
      END IF;
      
      -- Insert into patient_reports table
      BEGIN
        INSERT INTO patient_reports (
          patient_id,
          report_name,
          report_type,
          file_url,
          uploaded_by,
          upload_source,
          upload_date,
          created_at,
          updated_at,
          is_deleted
        ) VALUES (
          patient_record.id,
          file_name,
          'lab_report',
          extracted_path,
          patient_record.user_id,
          'patient_registration',
          COALESCE(patient_record.created_at, NOW()),
          COALESCE(patient_record.created_at, NOW()),
          NOW(),
          false
        );
        
        migrated_count := migrated_count + 1;
        
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Failed to migrate URL % for patient %: %', 
                      report_url, patient_record.id, SQLERRM;
      END;
      
      url_index := url_index + 1;
    END LOOP;
    
    RAISE NOTICE 'Migrated % reports for patient % (total URLs: %)', 
                  url_index - 1,
                  patient_record.id, 
                  array_length(patient_record.lab_report_urls, 1);
  END LOOP;
  
  RAISE NOTICE 'Migration complete! Total reports migrated: %', migrated_count;
  
  -- Optional: Archive the old data by setting to empty array (don't delete yet for safety)
  -- UPDATE patients SET lab_report_urls = ARRAY[]::text[] WHERE lab_report_urls IS NOT NULL;
  
END $$;

-- Verify migration results
SELECT 
  COUNT(*) as total_migrated_reports,
  COUNT(DISTINCT patient_id) as patients_affected
FROM patient_reports 
WHERE upload_source = 'patient_registration';

-- Show sample of migrated data
SELECT 
  pr.patient_id,
  p.full_name,
  pr.report_name,
  pr.upload_source,
  pr.upload_date
FROM patient_reports pr
JOIN patients p ON p.id = pr.patient_id
WHERE pr.upload_source = 'patient_registration'
LIMIT 10;






















