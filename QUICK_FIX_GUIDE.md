# 🚀 Quick Fix Application Guide

## What This Fixes:
1. ✅ **Patient login 406 console error** (doctors table query)
2. ✅ **Appointment reschedule failure** (critical functionality restored)

---

## 📋 Step-by-Step Instructions

### Step 1: Apply Database Migration

#### Option A: Using Supabase CLI (Recommended)
```bash
# Navigate to your project root
cd "D:\3. AIGF Fellowship\Capstone Project\Cursor\EaseHealth-new"

# Apply the migration
npx supabase db push
```

#### Option B: Using Supabase Dashboard
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of: `supabase/migrations/20251115000001_add_patient_time_slots_access.sql`
4. Paste into SQL Editor
5. Click **Run**
6. Verify: You should see the policy list at the bottom

#### Option C: Manual SQL (If CLI not available)
Copy and run this SQL in Supabase SQL Editor:

```sql
-- Add policy for patients to view their own booked time slots
CREATE POLICY "Patients can view their own booked time slots" 
  ON time_slots
  FOR SELECT
  TO authenticated
  USING (
    status = 'booked' 
    AND appointment_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = time_slots.appointment_id
      AND EXISTS (
        SELECT 1 FROM patients
        WHERE patients.id = appointments.patient_id
        AND patients.user_id = auth.uid()
      )
    )
  );

-- Verify policy was created
SELECT policyname FROM pg_policies WHERE tablename = 'time_slots';
```

---

### Step 2: Verify Migration Applied Successfully

Run this in Supabase SQL Editor:
```sql
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'time_slots'
ORDER BY policyname;
```

**Expected Output:** You should see 4 policies including the new one:
- ✅ Authenticated users can view available slots
- ✅ Doctors can manage their own time slots
- ✅ **Patients can view their own booked time slots** ← NEW!
- ✅ Public can view available slots of active verified doctors

---

### Step 3: Restart Your Development Server

The code changes in `src/hooks/useRBAC.ts` are already applied. Just restart:

```bash
# Stop your dev server (Ctrl+C)
# Then restart
npm run dev
```

---

### Step 4: Test the Fixes

#### Test 1: Login Console Error (Should be GONE)
1. Open browser console (F12)
2. Log out (if logged in)
3. Log in as a patient
4. **Verify:** No 406 errors in console
5. **Verify:** Dashboard loads normally

#### Test 2: Reschedule Appointment (Critical - Should WORK)
1. Log in as a patient with an existing appointment
2. Navigate to your appointments
3. Click **"Reschedule"** on any appointment
4. Select a new date and time
5. Click **"Confirm Appointment"**
6. **Verify:** No errors in console
7. **Verify:** Success message appears
8. **Verify:** Appointment is updated

#### Test 3: Cancel Appointment (Should WORK)
1. Log in as a patient with an existing appointment
2. Click **"Cancel"** on any appointment
3. **Verify:** Cancellation succeeds
4. **Verify:** Appointment is removed from list

---

## ⚠️ If Something Goes Wrong

### Rollback Database Change:
```sql
DROP POLICY IF EXISTS "Patients can view their own booked time slots" ON time_slots;
```

### Rollback Code Change:
```bash
git checkout HEAD~1 src/hooks/useRBAC.ts
```

Then restart your dev server.

---

## ✅ Success Checklist

- [ ] Migration applied successfully (verify with Step 2 query)
- [ ] Dev server restarted
- [ ] Patient login: No 406 errors in console
- [ ] Reschedule: Works without errors
- [ ] Cancel: Works without errors
- [ ] Doctor login: Still works (regression test)
- [ ] New bookings: Still work (regression test)

---

## 📊 Summary of Changes

| File | Type | Change | Risk |
|------|------|--------|------|
| `supabase/migrations/20251115000001_add_patient_time_slots_access.sql` | New | Adds RLS policy | 🟢 Low |
| `src/hooks/useRBAC.ts` | Modified | Adds error handling | 🟢 Low |

**Total Lines Changed:** ~8 lines of actual code
**Breaking Changes:** None
**Rollback Available:** Yes

---

## 🎯 What You Should See After Fix

### Before:
```
❌ Console: GET .../time_slots?appointment_id=xxx 406 (Not Acceptable)
❌ Reschedule: "Failed to cancel previous appointment"
❌ Console: Error finding time slot for appointment: PGRST116
```

### After:
```
✅ Console: Clean (no 406 errors)
✅ Reschedule: "Appointment rescheduled successfully"
✅ Console: No PGRST116 errors visible
```

---

## 📞 Need Help?

1. Check `FIX_RLS_ISSUES_NOV15_2025.md` for detailed explanation
2. Review the migration file comments
3. Check browser console for specific errors
4. Verify RLS policies in Supabase dashboard

---

**Ready to Apply?** Follow Steps 1-4 above! 🚀

