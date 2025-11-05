# Fix for Uploaded Reports & Documents Display Issue

## Problem Identified
The uploaded reports weren't showing in the Patient detail section because:
1. ✅ **FIXED**: Code was using wrong bucket name (`'patient-reports'` instead of `'lab-reports'`)
2. ✅ **FIXED**: Hook was only fetching from `patient_reports` table (doctor uploads) but NOT from `patients.lab_report_urls` (patient uploads during registration)
3. ⚠️ **NEEDS MIGRATION**: Storage policies don't allow doctors to access patient lab reports with different path structures

## Root Cause
- **Patient uploads** (during registration): Stored in `patients` table → `lab_report_urls` column with path: `{userId}/documents/lab_reports/{file}`
- **Doctor uploads**: Stored in `patient_reports` table with path: `{patientId}/{file}`
- The hook was only querying `patient_reports` table, missing all patient-uploaded reports!

## Changes Made to Code

### File: `src/hooks/patient/usePatientReports.ts`
1. Changed bucket name from `'patient-reports'` to `'lab-reports'` (2 locations)
2. **Added logic to fetch BOTH sources:**
   - Fetch from `patient_reports` table (doctor uploads)
   - Fetch from `patients.lab_report_urls` array (patient uploads)
   - Combine both into single list
   - Sort by upload date
3. Generate signed URLs for all reports regardless of source

## Migration Required

You need to run the migration to add storage access policies for doctors.

### Option 1: Using Supabase Dashboard (RECOMMENDED)

1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Click **"New Query"**
4. Copy and paste the contents of this file: `supabase/migrations/20250205000004_add_doctor_storage_access_policies.sql`
5. Click **"Run"** to execute
6. Verify: Go to **Storage** → **lab-reports** → **Policies** - you should see 4 new doctor policies

### Option 2: Using Supabase CLI

```bash
# First, link your project (if not already linked)
npx supabase link --project-ref your-project-ref

# Then push the migration
npx supabase db push
```

## What the Migration Does

Adds 4 new storage policies for the `lab-reports` bucket:

1. **Doctors can view patient lab reports**
   - Allows doctors to generate signed URLs for patient reports
   - Only for patients with active appointments

2. **Doctors can upload patient lab reports**
   - Allows doctors to upload new reports for their patients
   - Files will be stored in patient's folder (patientId/filename.ext)

3. **Doctors can update patient lab reports**
   - Allows doctors to update or replace reports

4. **Doctors can delete patient lab reports**
   - Allows doctors to manage reports (soft delete in DB)

## Security

✅ The policies maintain security:
- Doctors can ONLY access reports for patients they have appointments with
- Uses RLS to check the appointments table
- Patient's own access is not affected (existing policies remain)

## Testing After Migration

1. Log in as a doctor
2. Navigate to Patient detail section
3. You should now see all uploaded lab reports
4. Click on any report to view it (signed URL will be generated)
5. Upload a new report using the "+ Upload New" button
6. Verify the uploaded report appears in the list

## File Structure in Storage

Reports are stored as:
```
lab-reports/
  └── {patient_id}/
      ├── {timestamp}_{random}.pdf
      ├── {timestamp}_{random}.jpg
      └── ...
```

## Troubleshooting

### If reports still don't show:

1. **Check browser console** for errors
2. **Verify migration ran successfully**:
   - Go to Supabase Dashboard → SQL Editor
   - Run: `SELECT * FROM storage.policies WHERE bucket_id = 'lab-reports';`
   - Should show 8 policies (4 for patients + 4 for doctors)

3. **Check if reports exist in database**:
   ```sql
   SELECT * FROM patient_reports WHERE patient_id = 'your-patient-id' AND is_deleted = false;
   ```

4. **Verify files exist in storage**:
   - Go to Storage → lab-reports bucket
   - Check if patient folder exists with files

5. **Test signed URL generation manually**:
   ```sql
   SELECT storage.create_signed_url('lab-reports', 'patient-id/file-name.pdf', 3600);
   ```

### If upload fails:

1. **Check file size** (max 10MB for lab-reports bucket)
2. **Check file type** (allowed: PDF, JPG, JPEG, PNG)
3. **Verify doctor is authenticated** and has appointments with the patient
4. **Check browser console** for detailed error messages

## Summary

✅ **Code Fix Complete**: Changed bucket name in hook  
⚠️ **Migration Required**: Run the SQL migration to enable doctor access  
📝 **Impact**: Minimal - only adds new policies, doesn't modify existing ones  
🔒 **Security**: Maintained - doctors can only access their patients' reports

