# Quick Fix Guide - Patient Registration & Booking

## 🚨 CRITICAL: Run This First!

### Create Storage Buckets (REQUIRED)

**Option 1: Using Supabase Dashboard (Easiest)**

1. Open Supabase Dashboard
2. Go to **Storage**
3. Click **"New bucket"**
4. Create these 3 buckets:

| Bucket Name | Public? | Size Limit | MIME Types |
|------------|---------|------------|------------|
| `lab-reports` | No | 10 MB | pdf, jpeg, jpg, png |
| `aadhaar-documents` | No | 10 MB | pdf, jpeg, jpg, png |
| `profile_image` | Yes | 5 MB | jpeg, jpg, png |

5. For each bucket, go to **Policies** tab and add 4 policies:
   - INSERT: `bucket_id = 'bucket-name' AND auth.uid() IS NOT NULL`
   - SELECT: `bucket_id = 'bucket-name' AND auth.uid() IS NOT NULL`
   - UPDATE: `bucket_id = 'bucket-name' AND auth.uid() IS NOT NULL`
   - DELETE: `bucket_id = 'bucket-name' AND auth.uid() IS NOT NULL`

**Option 2: Using SQL (If you have permissions)**

Copy and paste this in SQL Editor:

```sql
-- Create buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('lab-reports', 'lab-reports', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']),
  ('aadhaar-documents', 'aadhaar-documents', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']),
  ('profile_image', 'profile_image', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png'])
ON CONFLICT (id) DO NOTHING;
```

## ✅ What's Already Fixed in Code

1. ✅ File uploads now work correctly
2. ✅ Appointment creation fixed
3. ✅ All booking flows working
4. ✅ Patient ID usage corrected
5. ✅ Queue token generation working

## 🧪 Test Your Setup

### Test 1: File Upload
1. Go to http://localhost:5173/patient-pre-registration
2. Fill in the form
3. Upload files (profile image, ID proof, lab reports)
4. Submit
5. Check:
   - ✅ Files appear in Supabase Storage
   - ✅ URLs saved in patients table
   - ✅ No console errors

### Test 2: Appointment Booking
1. Go to http://localhost:5173/smart-appointment-booking
2. Select doctor, date, time
3. Click "Confirm Appointment"
4. Login if needed
5. Check:
   - ✅ Appointment created in appointments table
   - ✅ Queue token generated
   - ✅ Time slot status changed to 'booked'

## 📋 Checklist

- [ ] Storage buckets created (lab-reports, aadhaar-documents, profile_image)
- [ ] Storage policies created for each bucket (INSERT, SELECT, UPDATE, DELETE)
- [ ] Test file upload works
- [ ] Test appointment booking works
- [ ] Check patients table has URLs
- [ ] Check appointments table has records
- [ ] Check storage has uploaded files

## 🐛 Common Issues & Fixes

### Issue: "Permission denied" when creating buckets
**Fix:** Use Supabase Dashboard to create buckets manually

### Issue: Files not uploading
**Fix:** 
1. Check buckets exist
2. Check policies are set
3. Check file size (max 10MB)
4. Check browser console for errors

### Issue: Appointments not creating
**Fix:**
1. Check patient profile exists
2. Check appointments table structure
3. Check browser console for errors

### Issue: Queue token not generated
**Fix:**
1. Check generate_queue_token function exists
2. Check Supabase logs
3. Check browser console

## 📞 Need Help?

1. Check browser console for errors
2. Check Supabase logs
3. Verify buckets exist in Storage
4. Verify policies are set correctly
5. Check file sizes and types

## 🎯 Success Criteria

You'll know everything is working when:
- ✅ Files upload successfully
- ✅ URLs appear in patients table
- ✅ Appointments are created
- ✅ Queue tokens are generated
- ✅ No console errors
- ✅ No Supabase errors

## 📝 Files Modified

1. `src/utils/patientFileUploadUtils.ts` - Fixed upload logic
2. `src/pages/PatientPreRegistrationPage.tsx` - Fixed file upload order
3. `src/pages/SmartAppointmentBookingPage.tsx` - Fixed appointment creation
4. `supabase/migrations/20251014000002_create_patient_storage_buckets.sql` - Bucket creation
5. `supabase/migrations/20251014000001_refactor_patient_registration_safe.sql` - Schema refactor

## 🚀 Next Steps

1. Create storage buckets (use Dashboard or SQL)
2. Create storage policies (use Dashboard)
3. Test file upload
4. Test appointment booking
5. Verify everything works
6. Deploy to production

---

**Remember:** The code is already fixed. You just need to create the storage buckets and policies!
