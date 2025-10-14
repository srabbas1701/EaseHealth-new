# How to Run Migrations

## Quick Start

### Step 1: Create Storage Buckets (REQUIRED)

1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `supabase/migrations/20251014000002_create_patient_storage_buckets.sql`
4. Click "Run"
5. Verify success message appears

### Step 2: Refactor Tables (OPTIONAL - Only if you want clean schema)

1. In SQL Editor, copy and paste the contents of `supabase/migrations/20251014000001_refactor_patient_registration_safe.sql`
2. Click "Run"
3. Verify success message appears

## Verification Steps

### Verify Storage Buckets
1. Go to Storage in Supabase Dashboard
2. Check that these buckets exist:
   - `lab-reports` (private)
   - `aadhaar-documents` (private)
   - `profile_image` (public)

### Verify Table Structure
1. Go to Table Editor in Supabase Dashboard
2. Check `patients` table has these columns:
   - `id_proof_urls` (text[])
   - `lab_report_urls` (text[])
   - `age` (integer)

3. Check `patient_pre_registrations` table has these columns:
   - `user_id`
   - `patient_id`
   - `registration_time`
   - `status`
   - `consent_agreed`

## Testing After Migration

### Test File Upload
1. Go to http://localhost:5173/patient-pre-registration
2. Fill in the form
3. Upload files (profile image, ID proof, lab reports)
4. Submit the form
5. Check patients table - URLs should be populated
6. Check Storage - files should be visible

### Test Appointment Creation
1. Go to http://localhost:5173/smart-appointment-booking
2. Select a doctor
3. Select a date and time
4. Click "Confirm Appointment"
5. Login if needed
6. Check appointments table - appointment should be created
7. Check queue token is generated

## Troubleshooting

### Error: "bucket does not exist"
**Solution:** Run migration 20251014000002

### Error: "column does not exist"
**Solution:** Run migration 20251014000001

### Error: "permission denied"
**Solution:** Check RLS policies are correct (should be set by migrations)

### Files not uploading
**Solution:** 
1. Check storage buckets exist
2. Check RLS policies
3. Check browser console for errors
4. Check file size (max 10MB)

### Appointments not creating
**Solution:**
1. Check patient profile exists
2. Check appointments table has correct columns
3. Check browser console for errors
4. Check Supabase logs

## Need Help?

If you encounter any issues:
1. Check browser console
2. Check Supabase logs
3. Verify migrations completed successfully
4. Check storage bucket policies
5. Check RLS policies

## Migration Order

1. **First:** Run `20251014000002_create_patient_storage_buckets.sql` (REQUIRED)
2. **Then:** Run `20251014000001_refactor_patient_registration_safe.sql` (OPTIONAL)

**Note:** Migration 20251014000001 will fail if you haven't run 20251014000002 first!
