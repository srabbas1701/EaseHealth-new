# Email and Profiles Table Fix - Complete Documentation

## Issue Summary

### Problem 1: Email Not Saved in Profiles Table
**Symptom:** After user registration and email verification, the `email` column in the `profiles` table remained NULL.

**Root Cause:** The `handle_new_user()` trigger function that creates profiles when users sign up was not including the `email` field in the INSERT statement.

### Problem 2: Unused Redundant Columns
**Symptom:** The `profiles` table had `age`, `gender`, `city`, and `state` columns that were never populated during registration.

**Root Cause:** 
- These fields were defined in the `profiles` table schema but not used
- Patient registration stores this data in the `patients` table instead
- The application fetches patient data from `patients` table, not `profiles`
- Result: Orphaned columns that confuse the database schema

---

## Database Architecture

### Three-Table Design

The system uses a **three-table architecture** to separate concerns:

#### 1. `profiles` Table (Basic Auth & Profile - ALL USERS)
**Purpose:** Store basic user authentication and profile information linked to `auth.users` for ALL user types (patients, doctors, admins)

**Current Schema (After Fix):**
- `id` (uuid) - References auth.users
- `full_name` (text)
- `phone_number` (text)
- **`email` (text)** - ✅ NOW POPULATED
- `role` (text) - 'patient', 'doctor', 'admin'
- `email_verified` (boolean)
- `verification_token` (text)
- `verification_expires_at` (timestamp)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Removed Columns:**
- ~~`age`~~ - Redundant, stored in `patients` table
- ~~`gender`~~ - Redundant, stored in `patients` table
- ~~`city`~~ - Redundant, stored in `patients` table
- ~~`state`~~ - Redundant, stored in `patients` table

#### 2. `patients` Table (Detailed Patient Data)
**Purpose:** Store comprehensive patient-specific information for users with role='patient'

**Schema:**
- `id` (uuid)
- `user_id` (uuid) - References auth.users
- `full_name` (text)
- `email` (text)
- `phone_number` (text)
- `date_of_birth` (date)
- `age` (integer) - Calculated from DOB
- `gender` (text)
- `address` (text)
- `city` (text)
- `state` (text)
- `emergency_contact_name` (text)
- `emergency_contact_phone` (text)
- `medical_history` (text)
- `allergies` (text)
- `current_medications` (text)
- `insurance_provider` (text)
- `insurance_number` (text)
- `blood_type` (text)
- `profile_image_url` (text)
- `id_proof_urls` (text array)
- `lab_report_urls` (text array)
- `is_active` (boolean)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### 3. `doctors` Table (Detailed Doctor Data)
**Purpose:** Store comprehensive doctor-specific information for users with role='doctor'

**Schema:**
- `id` (uuid) - Primary key
- `user_id` (uuid) - References auth.users
- `full_name` (text)
- `email` (text) - Doctor's email
- `phone_number` (text)
- `specialty` (text) - e.g., Cardiologist, Neurologist
- `license_number` (text) - Medical license number
- `experience_years` (integer)
- `qualification` (text) - e.g., MBBS, MD
- `hospital_affiliation` (text)
- `consultation_fee` (decimal)
- `profile_image_url` (text)
- `bio` (text)
- `is_verified` (boolean)
- `is_active` (boolean)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Plus additional fields:** super_specialization, professional_bio, languages_spoken, consultation_types, services_offered, bank details, document URLs, etc.

### Table Relationship Summary

```
auth.users (Supabase Auth)
    ↓
    ├─→ profiles (ALL users - basic info)
    │     ↓
    │     ├─→ patients (role='patient' - detailed patient data)
    │     └─→ doctors (role='doctor' - detailed doctor data)
```

---

## User Registration Flow

### Step 1: Sign Up (NewLoginPage.tsx)
```
User enters: email, password, full_name, phone
    ↓
supabase.auth.signUp() creates user in auth.users
    ↓
Trigger: on_auth_user_created fires
    ↓
Function: handle_new_user() creates profile
    ↓
profiles table: id, full_name, phone_number, EMAIL ✅, role='patient', email_verified=FALSE
```

### Step 2: Email Verification
```
User clicks verification link
    ↓
Email verified in auth.users
    ↓
email_verified updated to TRUE in profiles
```

### Step 3: Role-Specific Registration

#### For Patients (PatientPreRegistrationPage.tsx)
```
User enters: age, gender, city, state, address, medical info, etc.
    ↓
Data saved to patients table ONLY
    ↓
profiles table: remains unchanged (basic info already there)
```

#### For Doctors (UnifiedDoctorRegistrationForm.tsx)
```
User enters: specialty, license, qualification, experience, etc.
    ↓
Data saved to doctors table ONLY
    ↓
profiles table: remains unchanged (basic info already there)
```

---

## Migrations Applied

### Migration 1: `20250205000001_fix_profile_email_trigger.sql`
**Purpose:** Fix the trigger to include email when creating profiles

**What it does:**
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    phone_number,
    email,          -- ✅ ADDED
    role,
    email_verified,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NEW.email,      -- ✅ ADDED - Copy from auth.users
    'patient',
    FALSE,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

### Migration 2: `20250205000002_backfill_profile_emails.sql`
**Purpose:** Backfill existing profiles with email from auth.users

**What it does:**
```sql
-- Update existing profiles that have NULL email
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
  AND p.email IS NULL;
```

### Migration 3: `20250205000003_remove_unused_profile_columns.sql`
**Purpose:** Remove redundant columns that are never used

**What it does:**
```sql
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS age,
DROP COLUMN IF EXISTS gender,
DROP COLUMN IF EXISTS city,
DROP COLUMN IF EXISTS state;
```

---

## Code Changes

### Updated TypeScript Interface
**File:** `src/utils/supabase.ts`

**Before:**
```typescript
export interface Profile {
  id: string
  full_name: string
  phone_number: string
  age?: number              // ❌ Unused
  gender?: string           // ❌ Unused
  city?: string             // ❌ Unused
  state?: string            // ❌ Unused
  role?: string
  email_verified?: boolean
  verification_token?: string
  verification_expires_at?: string
  created_at?: string
  updated_at?: string
}
```

**After:**
```typescript
export interface Profile {
  id: string
  full_name: string
  phone_number: string
  email?: string            // ✅ Added
  role?: string
  email_verified?: boolean
  verification_token?: string
  verification_expires_at?: string
  created_at?: string
  updated_at?: string
}
```

---

## How to Apply the Fix

### Option 1: Via Supabase Dashboard (RECOMMENDED)

1. **Go to Supabase Dashboard** → SQL Editor

2. **Run Migration 1** (Fix Trigger):
   - Copy contents of `supabase/migrations/20250205000001_fix_profile_email_trigger.sql`
   - Paste and execute

3. **Run Migration 2** (Backfill Emails):
   - Copy contents of `supabase/migrations/20250205000002_backfill_profile_emails.sql`
   - Paste and execute

4. **Run Migration 3** (Remove Unused Columns):
   - Copy contents of `supabase/migrations/20250205000003_remove_unused_profile_columns.sql`
   - Paste and execute

5. **Verify:**
   ```sql
   -- Check trigger function
   SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user';
   
   -- Check profiles table has email column
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'profiles';
   
   -- Verify existing profiles have emails
   SELECT id, email, email_verified 
   FROM public.profiles 
   LIMIT 10;
   ```

### Option 2: Via Supabase CLI

```bash
# If using Supabase CLI
supabase migration list
supabase migration up
```

---

## Testing

### Test 1: New User Registration
1. Sign up with a new email
2. Check `profiles` table → email should be populated
3. Verify email
4. Complete patient registration
5. Check `patients` table → age, gender, city, state should be populated
6. Check `profiles` table → should only have basic info with email

### Test 2: Existing Users
1. Check existing profiles → emails should be backfilled
2. Verify no NULL emails remain

### Test 3: Patient Dashboard
1. Login as patient
2. Navigate to dashboard
3. Profile information should display correctly (from `patients` table)

---

## Benefits of This Fix

✅ **Email Now Saved:** User emails are properly stored in profiles table
✅ **Cleaner Schema:** Removed redundant columns that caused confusion
✅ **Single Source of Truth:** Role-specific data in respective tables (patients/doctors)
✅ **No Data Loss:** All patient registration data still captured correctly
✅ **Improved Maintainability:** Clear separation between auth profiles and patient records
✅ **No Breaking Changes:** Application continues to work normally

---

## Impact Assessment

### What Changed:
- ✅ Profiles table now gets email populated during signup
- ✅ Existing profiles backfilled with emails
- ✅ Removed unused columns (age, gender, city, state) from profiles
- ✅ TypeScript interface updated
- ✅ Clarified three-table architecture (profiles → patients/doctors)

### What Didn't Change:
- ✅ Patient registration flow unchanged
- ✅ Doctor registration flow unchanged
- ✅ Patient data still stored in `patients` table
- ✅ Doctor data still stored in `doctors` table
- ✅ Application UI/UX unchanged
- ✅ No impact on existing working features

### Files Modified:
1. `supabase/migrations/20250205000001_fix_profile_email_trigger.sql` (NEW)
2. `supabase/migrations/20250205000002_backfill_profile_emails.sql` (NEW)
3. `supabase/migrations/20250205000003_remove_unused_profile_columns.sql` (NEW)
4. `src/utils/supabase.ts` (MODIFIED - TypeScript interface)

---

## Rollback Plan

If issues occur, you can rollback:

```sql
-- Rollback Migration 3 (restore columns)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS age integer,
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text;

-- Rollback Migration 1 (restore old trigger - but not recommended)
-- Just re-run the old migration file

-- Note: Migration 2 (backfill) doesn't need rollback as it only updates data
```

---

## Conclusion

This fix addresses the core issue of email not being saved during registration and cleans up the database schema by removing unused columns. The profiles table now serves its intended purpose as a lightweight authentication and basic profile table, while the patients table holds all detailed patient-specific information.

**Status:** ✅ Ready to Deploy
**Risk Level:** Low - Non-breaking changes
**Testing Required:** Basic user registration and patient dashboard verification

