# Quick Fix Reference Guide

## 🚀 Quick Start - Fix All Issues in 3 Steps

### Step 1: Run Storage Migration (5 minutes)
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy contents of `supabase/migrations/20251014000003_create_patient_storage_buckets_fixed.sql`
4. Paste and click "Run"
5. Verify: You should see "Success" message

### Step 2: Verify Buckets Created (2 minutes)
1. Go to Storage section in Supabase
2. Check for 3 buckets: `lab-reports`, `aadhaar-documents`, `profile_image`
3. Verify each bucket has policies (click on bucket → Policies tab)

### Step 3: Test the Fixes (10 minutes)
1. **Test Document Upload**: Go to Pre-Registration → Upload files → Check Storage
2. **Test New User Booking**: Book appointment → Sign up → Verify appointment created
3. **Test Existing User Booking**: Login → Book New Appointment → Verify appointment created

## ✅ What's Fixed

| Issue | Status | Details |
|-------|--------|---------|
| Documents not uploading | ✅ Fixed | Storage buckets and policies created |
| URLs blank in database | ✅ Fixed | Upload function working correctly |
| Appointments not created (new users) | ✅ Fixed | handleAuthSuccess fixed |
| Appointments not created (existing users) | ✅ Fixed | Patient profile creation added |
| Book New Appointment button | ✅ Fixed | Already working, flow fixed |

## 🔍 Verification Queries

### Check Buckets
```sql
SELECT id, name, public, file_size_limit FROM storage.buckets 
WHERE id IN ('lab-reports', 'aadhaar-documents', 'profile_image');
```

### Check Policies
```sql
SELECT policyname, cmd, qual FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects';
```

### Check Uploaded Files
```sql
SELECT name, bucket_id, created_at FROM storage.objects 
WHERE bucket_id IN ('lab-reports', 'aadhaar-documents', 'profile_image')
ORDER BY created_at DESC LIMIT 10;
```

### Check Patient Documents
```sql
SELECT id, full_name, 
  profile_image_url IS NOT NULL as has_profile,
  id_proof_urls IS NOT NULL as has_id_proof,
  lab_report_urls IS NOT NULL as has_lab_reports
FROM patients
ORDER BY created_at DESC LIMIT 10;
```

### Check Appointments
```sql
SELECT id, doctor_id, patient_id, appointment_date, start_time, 
  queue_token, status, created_at
FROM appointments
ORDER BY created_at DESC LIMIT 10;
```

## 🐛 Troubleshooting

### Problem: "Permission denied for table storage.buckets"
**Fix**: Make sure you're using SQL Editor with admin privileges

### Problem: "Bucket does not exist"
**Fix**: Run the migration file

### Problem: "Failed to upload document"
**Fix**: 
1. Check file size < 10MB
2. Check file type (PDF/JPEG)
3. Check user is authenticated
4. Check bucket exists

### Problem: "Appointment not created"
**Fix**:
1. Check patient profile exists
2. Check doctor exists
3. Check time slot is available
4. Check all required fields filled

## 📝 Testing Checklist

- [ ] Storage buckets created
- [ ] Storage policies created
- [ ] Document upload works
- [ ] URLs populated in database
- [ ] New user booking works
- [ ] Existing user booking works
- [ ] Queue tokens generated
- [ ] Queue token modal shows
- [ ] Pre-registration works
- [ ] Patient dashboard works

## 📞 Need Help?

1. Check browser console for errors
2. Check Supabase logs
3. Verify all migrations applied
4. Check authentication status
5. Verify database schema

## 🎯 Success Criteria

✅ Documents upload successfully
✅ URLs are populated in patients table
✅ Appointments are created in appointments table
✅ Queue tokens are generated
✅ Queue token modal shows after booking
✅ All flows work (new user, existing user, pre-registration)


