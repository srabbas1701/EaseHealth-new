# Manual Storage Setup Guide

Since we're getting permission errors with SQL migrations, here's how to set up storage buckets manually:

## Step 1: Create Storage Buckets

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"** button
4. Create the following buckets:

#### Bucket 1: lab-reports
- **Name:** `lab-reports`
- **Public:** No (Private)
- **File size limit:** 10 MB
- **Allowed MIME types:** `application/pdf, image/jpeg, image/jpg, image/png`

#### Bucket 2: aadhaar-documents
- **Name:** `aadhaar-documents`
- **Public:** No (Private)
- **File size limit:** 10 MB
- **Allowed MIME types:** `application/pdf, image/jpeg, image/jpg, image/png`

#### Bucket 3: profile_image
- **Name:** `profile_image`
- **Public:** Yes (Public)
- **File size limit:** 5 MB
- **Allowed MIME types:** `image/jpeg, image/jpg, image/png`

### Option B: Using SQL (If you have proper permissions)

Run this SQL in Supabase SQL Editor:

```sql
-- Create lab-reports bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lab-reports',
  'lab-reports',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- Create aadhaar-documents bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'aadhaar-documents',
  'aadhaar-documents',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- Create profile_image bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile_image',
  'profile_image',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;
```

## Step 2: Create Storage Policies

### For each bucket (lab-reports, aadhaar-documents, profile_image):

1. Go to **Storage** in Supabase Dashboard
2. Click on the bucket name
3. Go to **Policies** tab
4. Click **"New Policy"** for each operation:

#### Policy 1: INSERT (Upload)
- **Policy name:** `Allow authenticated uploads`
- **Allowed operation:** INSERT
- **Target roles:** authenticated
- **Policy definition:**
  ```sql
  bucket_id = 'lab-reports' AND auth.uid() IS NOT NULL
  ```
- **Check expression:** (leave empty or use same as policy definition)

#### Policy 2: SELECT (Read)
- **Policy name:** `Allow authenticated read`
- **Allowed operation:** SELECT
- **Target roles:** authenticated
- **Policy definition:**
  ```sql
  bucket_id = 'lab-reports' AND auth.uid() IS NOT NULL
  ```

#### Policy 3: UPDATE (Update)
- **Policy name:** `Allow authenticated update`
- **Allowed operation:** UPDATE
- **Target roles:** authenticated
- **Policy definition:**
  ```sql
  bucket_id = 'lab-reports' AND auth.uid() IS NOT NULL
  ```

#### Policy 4: DELETE (Delete)
- **Policy name:** `Allow authenticated delete`
- **Allowed operation:** DELETE
- **Target roles:** authenticated
- **Policy definition:**
  ```sql
  bucket_id = 'lab-reports' AND auth.uid() IS NOT NULL
  ```

**Repeat these 4 policies for each bucket:**
- lab-reports
- aadhaar-documents
- profile_image

## Step 3: Verify Setup

1. Go to **Storage** in Supabase Dashboard
2. Verify all 3 buckets exist
3. Click on each bucket and verify policies are set
4. Test by uploading a test file

## Alternative: Use Supabase CLI

If you have Supabase CLI installed:

```bash
# Create buckets
supabase storage create lab-reports --public false
supabase storage create aadhaar-documents --public false
supabase storage create profile_image --public true

# Set policies (you'll need to create policy files)
```

## Quick Setup Script

If you want to try the SQL approach again with elevated permissions:

```sql
-- Run this as a superuser or with proper permissions
-- This will create buckets and policies in one go

-- Create buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('lab-reports', 'lab-reports', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']),
  ('aadhaar-documents', 'aadhaar-documents', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']),
  ('profile_image', 'profile_image', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png'])
ON CONFLICT (id) DO NOTHING;

-- Create policies for lab-reports
CREATE POLICY "Allow authenticated uploads lab-reports" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'lab-reports' AND auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated read lab-reports" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'lab-reports' AND auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated update lab-reports" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'lab-reports' AND auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated delete lab-reports" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'lab-reports' AND auth.uid() IS NOT NULL);

-- Create policies for aadhaar-documents
CREATE POLICY "Allow authenticated uploads aadhaar" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'aadhaar-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated read aadhaar" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'aadhaar-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated update aadhaar" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'aadhaar-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated delete aadhaar" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'aadhaar-documents' AND auth.uid() IS NOT NULL);

-- Create policies for profile_image
CREATE POLICY "Allow authenticated uploads profile" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'profile_image' AND auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated read profile" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'profile_image' AND auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated update profile" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'profile_image' AND auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated delete profile" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'profile_image' AND auth.uid() IS NOT NULL);
```

## Testing After Setup

1. Go to http://localhost:5173/patient-pre-registration
2. Fill in the form
3. Upload a test image
4. Submit the form
5. Check:
   - Browser console for errors
   - Supabase Storage for the uploaded file
   - patients table for the URLorking 

## Troubleshooting

### Error: "Permission denied"
**Solution:** Use Supabase Dashboard to create buckets and policies manually

### Error: "Bucket does not exist"
**Solution:** Create the bucket first using Dashboard or SQL

### Error: "Policy violation"
**Solution:** Check that policies are correctly set for all operations

### Files not uploading
**Solution:** 
1. Check bucket exists
2. Check policies are set
3. Check file size (max 10MB)
4. Check file type (PDF, JPEG, PNG only)
