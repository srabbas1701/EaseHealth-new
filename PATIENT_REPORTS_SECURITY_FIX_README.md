# Patient Reports Security Policy Fix

## 🔴 URGENT ISSUE IDENTIFIED

The Row-Level Security (RLS) policies for the `patient_reports` table were too restrictive, causing **ALL uploads to fail** for both patients and doctors.

## Problem Summary

### Current Broken Policies

1. **INSERT Policy (Doctors)** - Line 238-244 in `20250204000008_optimize_rls_policies_performance.sql`
   ```sql
   WITH CHECK (
       uploaded_by IN (SELECT id FROM doctors WHERE user_id = auth.uid())
   );
   ```
   **Problem:** This doesn't verify the doctor has permission for THIS specific patient. It also fails when `uploaded_by` is NULL (patient uploads).

2. **UPDATE Policy (Doctors)** - Line 246-250
   ```sql
   USING (uploaded_by IN (SELECT id FROM doctors WHERE user_id = auth.uid()));
   ```
   **Problem:** Doctors can only update reports THEY uploaded. They cannot soft-delete patient-uploaded reports.

3. **No Patient INSERT Policy** - Patients cannot upload their own reports at all!

4. **No Patient UPDATE Policy** - Patients cannot update/delete their own reports!

## Why It Was Working Before

The issue suggests these policies were either:
- Recently tightened during a performance optimization migration
- Temporarily disabled for testing
- Not properly tested with both patient and doctor uploads

## The Fix

### Solution Overview

Created comprehensive RLS policies that:
1. ✅ Allow doctors to upload reports for patients they have appointments with
2. ✅ Allow patients to upload their own reports (uploaded_by = NULL)
3. ✅ Allow doctors to update/delete ANY report for their patients
4. ✅ Allow patients to update/delete their own reports

### New Policies

```sql
-- Policy 1: Doctor INSERT
-- Verifies: User is doctor AND has appointment with patient
CREATE POLICY "Doctors can upload reports for their patients"
  WITH CHECK (
    uploaded_by IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.patient_id = patient_reports.patient_id
      AND appointments.doctor_id = uploaded_by
    )
  );

-- Policy 2: Patient INSERT
-- Verifies: uploaded_by is NULL AND patient_id matches user
CREATE POLICY "Patients can upload their own reports"
  WITH CHECK (
    uploaded_by IS NULL
    AND patient_id IN (
      SELECT id FROM patients WHERE user_id = auth.uid()
    )
  );

-- Policy 3: Doctor UPDATE
-- Verifies: User is doctor with appointment for this patient
CREATE POLICY "Doctors can update reports for their patients"
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.patient_id = patient_reports.patient_id
      AND appointments.doctor_id IN (
        SELECT id FROM doctors WHERE user_id = auth.uid()
      )
    )
  );

-- Policy 4: Patient UPDATE
-- Verifies: patient_id matches user's patient record
CREATE POLICY "Patients can update their own reports"
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE user_id = auth.uid()
    )
  );
```

## How to Apply the Fix

### Option 1: SQL Editor (RECOMMENDED - FASTEST)

1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Open the file: `FIX_PATIENT_REPORTS_RLS_URGENT.sql`
4. Copy the entire content and paste it
5. Click **Run**
6. Verify the policies were created by running the verification query at the end

### Option 2: Migration (For Production Deployment)

The migration file is ready at:
```
supabase/migrations/20250208000001_fix_patient_reports_rls_policies.sql
```

To apply:
```bash
npx supabase db push --include-all
```

Note: If you get conflicts, you may need to sync your local migration history first.

## Testing After Fix

### Test 1: Patient Upload
1. Log in as a patient
2. Go to Profile Update page
3. Try uploading a lab report
4. ✅ Should succeed

### Test 2: Doctor Upload
1. Log in as a doctor
2. Go to a patient's detail page (must have appointment with this patient)
3. Try uploading a lab report
4. ✅ Should succeed

### Test 3: Patient Delete Own Report
1. Log in as a patient
2. Try deleting your own report
3. ✅ Should succeed (soft delete: is_deleted = true)

### Test 4: Doctor Delete Patient Report
1. Log in as a doctor
2. Try deleting a patient's report (must have appointment)
3. ✅ Should succeed

## Files Created

1. `supabase/migrations/20250208000001_fix_patient_reports_rls_policies.sql` - Migration file
2. `FIX_PATIENT_REPORTS_RLS_URGENT.sql` - Standalone SQL script for immediate fix
3. `PATIENT_REPORTS_SECURITY_FIX_README.md` - This documentation

## Security Considerations

### What's Still Protected ✅

- Patients can only upload to their own patient_id
- Patients can only update/delete their own reports
- Doctors can only upload for patients they have appointments with
- Doctors can only update/delete reports for patients they have appointments with
- No one can access reports without proper authentication

### What Changed ✅

- Patients can now upload (previously blocked)
- Doctors can now upload (previously partially broken)
- Doctors can manage all reports for their patients (not just ones they uploaded)
- Patients can manage their own reports

## Questions?

If uploads still fail after applying the fix:
1. Check browser console for exact error message
2. Verify RLS policies were created: Run the verification query
3. Check if the user has a valid patient/doctor record in the database
4. Verify appointments exist between doctor and patient

---

**Status:** ✅ Fix Ready  
**Priority:** 🔴 URGENT  
**Impact:** All patient report uploads (both patient and doctor)  
**Action Required:** Apply SQL script via Supabase Dashboard immediately



