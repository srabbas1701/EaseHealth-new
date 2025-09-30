# Supabase Storage Setup Guide for Patient Pre-Registration

This guide provides step-by-step instructions for setting up Supabase Storage for your Patient Pre-Registration system.

## Overview

You'll be setting up two storage buckets:
- **lab-reports**: For storing patient lab reports (PDF/JPEG format)
- **aadhaar-documents**: For storing patient Aadhaar documents (PDF/JPEG format)

## Prerequisites

1. Access to your Supabase project dashboard
2. Database admin privileges
3. SQL Editor access in Supabase

## Step-by-Step Setup

### Step 1: Access Supabase Dashboard

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your EaseHealth project
4. Navigate to the **SQL Editor** from the left sidebar

### Step 2: Create the Database Table

1. In the SQL Editor, create a new query
2. Copy and paste the contents of `create_patient_pre_registrations_table.sql`
3. Click **Run** to execute the script
4. Verify the table was created by checking the **Table Editor** section

### Step 3: Create Storage Buckets

1. In the SQL Editor, create a new query
2. Copy and paste the contents of `create_storage_buckets.sql`
3. Click **Run** to execute the script
4. Verify buckets were created:
   - Go to **Storage** in the left sidebar
   - You should see two new buckets: `lab-reports` and `aadhaar-documents`

### Step 4: Set Up Storage Security Policies

1. In the SQL Editor, create a new query
2. Copy and paste the contents of `create_storage_policies.sql`
3. Click **Run** to execute the script
4. Verify policies were created:
   - Go to **Storage** → **Policies**
   - You should see multiple policies for both buckets

### Step 5: Configure Bucket Settings (Optional)

#### Access Storage Settings:
1. Go to **Storage** in the left sidebar
2. Click on **lab-reports** bucket
3. Configure settings as needed:
   - **Public**: Keep as **False** (private)
   - **File size limit**: 10MB (already set)
   - **Allowed MIME types**: PDF, JPEG (already set)

4. Repeat for **aadhaar-documents** bucket

### Step 6: Test the Setup

#### Test File Upload (Optional):
1. Go to **Storage** → **lab-reports**
2. Try uploading a test PDF or JPEG file
3. Verify the file appears in the bucket
4. Repeat for **aadhaar-documents**

## File Organization Structure

Your storage will be organized as follows:

```
lab-reports/
├── {user-id-1}/
│   ├── {user-id-1}_lab_reports_2024-01-23_14-30-15.pdf
│   └── {user-id-1}_lab_reports_2024-01-23_15-45-22.jpg
├── {user-id-2}/
│   └── {user-id-2}_lab_reports_2024-01-24_09-15-30.pdf

aadhaar-documents/
├── {user-id-1}/
│   ├── {user-id-1}_aadhaar_2024-01-23_14-30-15.pdf
│   └── {user-id-1}_aadhaar_2024-01-23_15-45-22.jpg
├── {user-id-2}/
│   └── {user-id-2}_aadhaar_2024-01-24_09-15-30.pdf
```

## Security Features

### Row Level Security (RLS)
- Users can only access their own documents
- Admins can access all documents
- Doctors can access patient documents (when properly authenticated)

### File Validation
- Only PDF and JPEG files are allowed
- Maximum file size: 10MB per file
- Unique filenames prevent conflicts

### Folder Structure
- Each user has their own folder (identified by user ID)
- Files are organized by document type and timestamp

## Integration with Your React App

### File Upload Function
```typescript
const uploadDocument = async (file: File, userId: string, documentType: 'lab_reports' | 'aadhaar') => {
  const fileName = `${userId}_${documentType}_${Date.now()}.${file.name.split('.').pop()}`;
  const filePath = `${userId}/${fileName}`;
  
  const { data, error } = await supabase.storage
    .from(documentType === 'lab_reports' ? 'lab-reports' : 'aadhaar-documents')
    .upload(filePath, file);
    
  if (error) throw error;
  return data;
};
```

### File Download Function
```typescript
const downloadDocument = async (filePath: string, documentType: 'lab_reports' | 'aadhaar') => {
  const { data, error } = await supabase.storage
    .from(documentType === 'lab_reports' ? 'lab-reports' : 'aadhaar-documents')
    .download(filePath);
    
  if (error) throw error;
  return data;
};
```

## Troubleshooting

### Common Issues:

1. **"Bucket not found" error**
   - Verify buckets were created successfully
   - Check bucket names match exactly: `lab-reports` and `aadhaar-documents`

2. **"Access denied" error**
   - Verify RLS policies were created
   - Check user authentication status
   - Ensure user has proper permissions

3. **"File too large" error**
   - Check file size (must be under 10MB)
   - Verify file type (must be PDF or JPEG)

4. **"Invalid MIME type" error**
   - Ensure file extension matches MIME type
   - Only PDF and JPEG files are allowed

### Verification Queries:

Run these in the SQL Editor to verify your setup:

```sql
-- Check if buckets exist
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id IN ('lab-reports', 'aadhaar-documents');

-- Check if policies exist
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
ORDER BY policyname;

-- Check if table exists
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'patient_pre_registrations';
```

## Next Steps

1. **Update your React app** to use the new storage functions
2. **Test file uploads** with real users
3. **Monitor storage usage** in the Supabase dashboard
4. **Set up backup policies** if needed
5. **Configure CDN** for faster file access (optional)

## Support

If you encounter any issues:
1. Check the Supabase logs in the dashboard
2. Verify all SQL scripts executed successfully
3. Test with a simple file upload first
4. Contact Supabase support if needed

---

**Note**: Remember to keep your storage buckets private for security. Only authenticated users should be able to access their documents.

