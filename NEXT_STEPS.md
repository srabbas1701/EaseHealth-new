# 🎯 Next Steps to Fix Email Verification

## Problem

Email verification link showing error:
- "Email link is invalid or has expired"
- `error_code=otp_expired`

## Root Cause

1. ❌ Code was reading wrong URL format (query params instead of hash)
2. ❌ Cleanup window too short (5 minutes) - link might expire before user clicks

## ✅ Fixes Applied

### **1. Updated Code**
- ✅ `src/pages/EmailVerificationPage.tsx` - Now reads from URL hash correctly

### **2. Created SQL Migration**
- ✅ `supabase/migrations/20250204000003_increase_cleanup_window.sql` - Increases cleanup from 5min to 30min

---

## 🚀 What You Need to Do

### **STEP 1: Run SQL Migration**

Go to **Supabase Dashboard → SQL Editor → New Query**

Copy and paste the contents of:
```
supabase/migrations/20250204000003_increase_cleanup_window.sql
```

Click **"Run"** ✅

---

### **STEP 2: Delete Test User**

Go to **Supabase Dashboard → Authentication → Users**

Find and delete the test user: `srabbas1701@gmail.com`

---

### **STEP 3: Test Again**

1. **Sign up** with the same or a new email
2. **Check email** immediately (inbox or spam)
3. **Click verification link** right away (don't wait!)
4. Should work now! ✅

---

## 📋 Quick Verification

After signup, run this in SQL Editor to verify trigger worked:

```sql
-- Check if profile was created
SELECT 
    u.email,
    p.full_name,
    p.phone_number,
    p.email_verified
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 1;
```

Expected:
- ✅ Email matches
- ✅ Full name and phone populated
- ✅ `email_verified = FALSE` (until link clicked)

---

## 🎉 Expected Flow

```
1. Sign up → ✅ Success message
2. Check database → ✅ User + Profile created
3. Check email → ✅ Verification email received
4. Click link → ✅ "Email verified successfully!"
5. Auto-redirect → ✅ Onboarding page
6. Check database → ✅ email_verified = TRUE
```

---

## 🆘 If Still Not Working

1. Check browser console (F12) for errors
2. Check Supabase logs (Dashboard → Logs)
3. Share the error message
4. Verify trigger exists:
   ```sql
   SELECT trigger_name FROM information_schema.triggers 
   WHERE trigger_name = 'on_auth_user_created';
   ```

---

## 📁 Files Changed

1. ✅ `src/pages/EmailVerificationPage.tsx` - Fixed URL hash reading
2. ✅ `supabase/migrations/20250204000003_increase_cleanup_window.sql` - 30min cleanup window
3. ✅ `EMAIL_VERIFICATION_FIX.md` - Detailed explanation

**Ready to test!** 🚀

