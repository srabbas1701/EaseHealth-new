# 🚀 Quick Migration Guide - Email & Profiles Fix

## Issue Fixed
1. **Email not saved in profiles table** during user registration
2. **Redundant unused columns** (age, gender, city, state) in profiles table

---

## 📋 Apply These 3 Migrations (In Order)

### Open Supabase Dashboard → SQL Editor

Copy and paste each migration below, one at a time:

---

### ✅ Migration 1: Fix Profile Email Trigger

```sql
-- Fix profile creation trigger to include email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    phone_number,
    email,
    role,
    email_verified,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NEW.email,  -- Copy email from auth.users
    'patient',
    FALSE,
    NOW(),
    NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN RETURN NEW;
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

---

### ✅ Migration 2: Backfill Existing Profile Emails

```sql
-- Backfill email addresses for existing profiles
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
  AND p.email IS NULL;

COMMENT ON COLUMN public.profiles.email IS 'User email address, copied from auth.users during profile creation';
```

---

### ✅ Migration 3: Remove Unused Profile Columns

```sql
-- Remove unused columns from profiles table
-- These are redundant: patients table stores patient data, doctors table stores doctor data
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS age,
DROP COLUMN IF EXISTS gender,
DROP COLUMN IF EXISTS city,
DROP COLUMN IF EXISTS state;

COMMENT ON TABLE public.profiles IS 'Basic user authentication and profile information for ALL users. Role-specific detailed data is stored in patients or doctors tables based on user role.';
```

---

## Verification Query

After running all migrations, verify:

```sql
-- Check all profiles have emails
SELECT COUNT(*) as total_profiles, 
       COUNT(email) as profiles_with_email
FROM public.profiles;

-- Sample check
SELECT id, email, email_verified, role
FROM public.profiles
LIMIT 5;
```

---

## Summary

**What changed:**
- ✅ Email now saved in profiles during signup
- ✅ Existing profiles backfilled with emails  
- ✅ Removed unused columns (age, gender, city, state)

**Impact:** 
- ✅ No breaking changes
- ✅ All existing functionality continues to work
- ✅ Clean, maintainable database schema

See `EMAIL_AND_PROFILES_FIX.md` for full documentation.

