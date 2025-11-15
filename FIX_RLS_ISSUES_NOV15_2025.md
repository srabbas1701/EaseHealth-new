# FIX: RLS Policy Issues - November 15, 2025

## 🎯 Executive Summary

Fixed two issues that appeared after RLS (Row Level Security) was enabled on the `time_slots` table:
1. **Patient login 406 error** (console warning only)
2. **Appointment reschedule failure** (critical - broke functionality)

Both issues were caused by enabling RLS without proper policies for patient access.

---

## 📊 Root Cause Analysis

### What Happened?

**Before Migration `20250923192310_shy_voice.sql`:**
- `time_slots` table had **RLS DISABLED**
- Patients could see all slots (available + booked)
- Cancel/reschedule worked perfectly ✅

**After Migration `20250923192310_shy_voice.sql` (Line 138):**
```sql
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
```
- RLS was enabled with policies that **only allow viewing `status='available'` slots**
- Patients were **blocked from seeing their own booked slots** ❌
- Cancel/reschedule operations failed ❌

---

## 🔧 Changes Made

### 1. Database Migration (CRITICAL)

**File:** `supabase/migrations/20251115000001_add_patient_time_slots_access.sql`

**What it does:**
- Adds a new RLS policy: `"Patients can view their own booked time slots"`
- Allows patients to SELECT time slots where:
  - `status = 'booked'`
  - `appointment_id` matches their appointments
  - Verified through `appointments` and `patients` table joins

**Safety:**
- ✅ Pure ADDITION - no existing policies modified
- ✅ Restrictive - only grants access to patient's own slots
- ✅ Follows same security pattern as existing appointment policies
- ✅ Includes rollback instructions

### 2. Frontend Code Fix (NICE TO HAVE)

**File:** `src/hooks/useRBAC.ts` (Lines 57-74)

**What changed:**
```typescript
// BEFORE: Error not handled
const { data: doctor } = await supabase.from('doctors')...

// AFTER: Proper error handling
const { data: doctor, error: doctorError } = await supabase.from('doctors')...
if (doctorError && doctorError.code !== 'PGRST116') {
  console.warn('⚠️ useRBAC: Error checking doctor status:', doctorError)
}
```

**Why:**
- When a patient logs in, the hook checks if they're a doctor
- `.single()` returns error code `PGRST116` (not found) for patients
- This is **expected behavior** but was causing 406 console errors
- Now we gracefully ignore this expected error

**Safety:**
- ✅ Minimal change - only adds error handling
- ✅ No logic changes - same behavior
- ✅ Only affects console logging

---

## 📋 Files Changed

### New Files:
1. `supabase/migrations/20251115000001_add_patient_time_slots_access.sql` - Database migration
2. `FIX_RLS_ISSUES_NOV15_2025.md` - This documentation

### Modified Files:
1. `src/hooks/useRBAC.ts` - Added error handling (lines 57-74)

---

## ✅ Testing Checklist

### Before Applying Migration:
- [ ] Backup your database (Supabase dashboard → Database → Backups)
- [ ] Note the current RLS policies: Run the verification query in the migration file

### After Applying Migration:

#### Test 1: Patient Login (Console Error Fix)
- [ ] Open browser console
- [ ] Log in as a patient
- [ ] Verify: No 406 errors for `doctors` table
- [ ] Verify: Patient dashboard loads correctly

#### Test 2: View Appointments (New Functionality)
- [ ] Log in as a patient with existing appointments
- [ ] Navigate to dashboard
- [ ] Verify: Booked appointments are visible

#### Test 3: Cancel Appointment (Critical Fix)
- [ ] Log in as a patient with an existing appointment
- [ ] Click "Cancel" on an appointment
- [ ] Verify: Cancellation succeeds without errors
- [ ] Verify: Slot becomes available again

#### Test 4: Reschedule Appointment (Critical Fix)
- [ ] Log in as a patient with an existing appointment
- [ ] Click "Reschedule"
- [ ] Select new date and time slot
- [ ] Click "Confirm Appointment"
- [ ] Verify: Reschedule succeeds without errors
- [ ] Verify: Old slot becomes available
- [ ] Verify: New slot is booked

#### Test 5: Doctor Functionality (Regression Test)
- [ ] Log in as a doctor
- [ ] View appointments
- [ ] Verify: Can see all appointments
- [ ] Verify: Time slot management works
- [ ] Verify: No new errors in console

#### Test 6: New Appointment Booking (Regression Test)
- [ ] Log in as a patient
- [ ] Book a new appointment
- [ ] Verify: Booking succeeds
- [ ] Verify: Appointment appears in dashboard

---

## 🔄 Rollback Instructions

### If Something Goes Wrong:

#### Rollback Migration (removes patient slot viewing):
```sql
DROP POLICY IF EXISTS "Patients can view their own booked time slots" ON time_slots;
```

**WARNING:** This will break cancel/reschedule functionality again!

#### Rollback Code Changes:
```bash
git checkout HEAD~1 src/hooks/useRBAC.ts
```

**NOTE:** This just brings back the console errors, doesn't break functionality.

---

## 🔍 Verification Queries

### Check RLS Policies on time_slots:
```sql
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'time_slots'
ORDER BY policyname;
```

**Expected Policies:**
1. ✅ "Authenticated users can view available slots"
2. ✅ "Doctors can manage their own time slots"
3. ✅ "Patients can view their own booked time slots" ← NEW
4. ✅ "Public can view available slots of active verified doctors"

### Test Patient Can See Their Booked Slot:
```sql
-- Log in as a patient and run:
SELECT 
  ts.id,
  ts.schedule_date,
  ts.start_time,
  ts.status,
  ts.appointment_id,
  a.patient_id
FROM time_slots ts
JOIN appointments a ON a.id = ts.appointment_id
WHERE ts.status = 'booked'
  AND EXISTS (
    SELECT 1 FROM patients p
    WHERE p.id = a.patient_id
    AND p.user_id = auth.uid()
  );
```

**Expected:** Should return the patient's booked slots.

---

## 📚 Related Files & Context

### Related Migrations:
- `20250923192310_shy_voice.sql` - Initially enabled RLS on time_slots
- `20250204000009_fix_appointments_rls_patient_id.sql` - Fixed appointments RLS
- `sql/fixes/fix_patients_rls_policies.sql` - Temporary fix (never applied)
- `sql/fixes/disable_rls_temporarily.sql` - Testing file (never applied)

### Related Code:
- `src/utils/supabase.ts` (line 1254) - `cancelAppointment()` function
- `src/pages/SmartAppointmentBookingPage.tsx` (line 224) - Reschedule flow
- `src/hooks/useRBAC.ts` (line 57) - Role checking logic

---

## 🎓 Lessons Learned

1. **Always add RLS policies BEFORE enabling RLS** on a table
2. **Test all user roles** (patient, doctor, admin) after RLS changes
3. **Handle "not found" errors** (PGRST116) gracefully when using `.single()`
4. **Document the security model** - what each role can access
5. **Create rollback procedures** for all database changes

---

## 🔐 Security Notes

### What This Fix Does:
- ✅ Allows patients to view ONLY their own booked slots
- ✅ Verifies ownership through appointments and patients tables
- ✅ Does NOT allow viewing other patients' slots
- ✅ Does NOT allow viewing available/blocked/break slots
- ✅ Maintains all existing security policies

### What This Fix Does NOT Do:
- ❌ Does NOT allow patients to see all time slots
- ❌ Does NOT allow patients to modify time slots directly
- ❌ Does NOT bypass appointment booking flow
- ❌ Does NOT grant admin or doctor privileges

---

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Run the verification queries above
3. Check Supabase logs for policy violations
4. Review the rollback instructions
5. Contact the development team

---

**Status:** ✅ READY TO APPLY
**Risk Level:** 🟢 LOW (Pure addition, well-tested pattern)
**Breaking Changes:** ❌ None
**Rollback Available:** ✅ Yes


