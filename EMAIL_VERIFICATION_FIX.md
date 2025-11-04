# 🔧 Email Verification Fix

## Problem Found

The email verification link was showing error: 
```
Email link is invalid or has expired
error_code=otp_expired
```

## Root Cause

Your `EmailVerificationPage` was expecting URL parameters like `?token=...&email=...`, but **Supabase uses URL hash format** like:
```
https://yoursite.com/verify-email#access_token=...&type=signup
```

## Solution Implemented

✅ **Updated `EmailVerificationPage.tsx`** to:
1. Read from URL **hash** instead of query parameters
2. Check for errors in the hash (like `#error=access_denied`)
3. Use `supabase.auth.getSession()` to check if verification succeeded
4. Update the profile's `email_verified` field

---

## 🧪 Testing Steps

### **Test 1: Delete Previous Test User**

1. Go to **Supabase Dashboard → Authentication → Users**
2. Find the test user email (`srabbas1701@gmail.com`)
3. **Delete it** completely
4. This removes both `auth.users` and `profiles` records

---

### **Test 2: Fresh Signup**

1. Go to your app's signup page
2. Use a **NEW email** or the same email (since we deleted it)
3. Fill in all fields
4. Click **"Create Account"**
5. You should see: ✅ "Account created! Please check your email..."

---

### **Test 3: Check Database**

Run this in **Supabase SQL Editor**:

```sql
-- Check if user was created
SELECT id, email, email_confirmed_at, created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 1;

-- Check if profile was created by trigger
SELECT id, full_name, phone_number, role, email_verified, created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 1;
```

**Expected:**
- ✅ User exists in `auth.users` with `email_confirmed_at = NULL`
- ✅ Profile exists in `profiles` with `email_verified = FALSE`
- ✅ Profile created **immediately** (same timestamp as user)

---

### **Test 4: Email Verification**

1. **Check your email inbox** (and spam folder)
2. **Click the verification link** in the email
3. You should be redirected to: `/verify-email`

**Two possible outcomes:**

#### **A) Success ✅**
- Page shows: "Email verified successfully!"
- Redirects to onboarding after 2 seconds
- Check database:
  ```sql
  SELECT email_verified FROM profiles WHERE id = '<user-id>';
  -- Should show: email_verified = TRUE
  ```

#### **B) Error - Link Expired ❌**
- Page shows: "Verification link has expired"
- This happens if the link is older than Supabase's expiry time

---

## 🔍 Why Link Might Expire

### **Supabase Email Token Expiry Settings**

Supabase has different expiry times for different environments:

1. **Default:** 60 minutes (1 hour)
2. **Your cleanup function:** 5 minutes (for unverified users)

**The issue:** If you clicked the link AFTER 5 minutes, the cleanup function may have deleted the user!

---

## 💡 Solution Options

### **Option A: Increase Cleanup Window (Recommended)**

Change cleanup from 5 minutes to 30 minutes:

```sql
-- Update cleanup function to 30 minutes instead of 5
CREATE OR REPLACE FUNCTION cleanup_unverified_users()
RETURNS void AS $$
BEGIN
  -- Delete profiles of users who haven't verified email within 30 minutes
  DELETE FROM public.profiles 
  WHERE email_verified = FALSE 
  AND created_at < NOW() - INTERVAL '30 minutes';
END;
$$ LANGUAGE plpgsql;
```

**Pros:**
- ✅ Gives users more time to verify
- ✅ Still cleans up unverified users
- ✅ Matches industry standards (15-30 min is common)

**Run this in Supabase SQL Editor!**

---

### **Option B: Check Supabase Email Settings**

1. Go to **Supabase Dashboard → Authentication → Email Templates**
2. Check **"Confirm signup"** template
3. Look for token expiry settings
4. Ensure it's set to at least 30 minutes

---

### **Option C: Test Immediately (For Testing Only)**

When testing, click the verification link **immediately** (within 1 minute of receiving the email). This ensures it's not expired.

---

## ✅ Updated Code Summary

### **What Changed:**

**File: `src/pages/EmailVerificationPage.tsx`**

**Before:**
```typescript
// ❌ Was looking for query params
const token = searchParams.get('token');
const email = searchParams.get('email');

// ❌ Was using verifyOtp with token
await supabase.auth.verifyOtp({
    token: verificationToken,
    type: 'email'
});
```

**After:**
```typescript
// ✅ Now reads from URL hash
const hashParams = new URLSearchParams(window.location.hash.substring(1));
const errorParam = hashParams.get('error');

// ✅ Uses getSession() to check if verified
const { data: { session } } = await supabase.auth.getSession();

if (session && session.user) {
    // Update profile
    await supabase.from('profiles')
        .update({ email_verified: true })
        .eq('id', session.user.id);
}
```

---

## 🎯 Final Testing Checklist

- [ ] Deleted previous test user from Supabase Dashboard
- [ ] Signed up with fresh email
- [ ] Saw success message on signup
- [ ] Checked database - user and profile both created
- [ ] Received verification email
- [ ] Clicked link **immediately** (within 1 minute)
- [ ] Verification succeeded
- [ ] Profile marked as `email_verified = TRUE`
- [ ] Redirected to onboarding

---

## 🆘 If Still Failing

### **Check Browser Console**

Open Developer Tools (F12) and look for:
- ✅ "Email verified successfully"
- ❌ Error messages

### **Check Supabase Logs**

Go to: **Supabase Dashboard → Logs → API Logs**

Look for:
- Authentication requests
- Error messages
- Token validation failures

### **Verify Trigger Works**

```sql
-- Check if trigger exists
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Should return 1 row
```

### **Manual Profile Check**

```sql
-- List all users and profiles
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    p.full_name,
    p.email_verified
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 5;
```

---

## 📞 Next Steps

1. **Run the cleanup function update** (Option A above) - Change 5 min to 30 min
2. **Delete the test user** from Supabase Dashboard
3. **Sign up again** with the same or different email
4. **Click verification link immediately** (within 1 minute)
5. **Should work!** ✅

---

## 🎉 Expected Result

When everything works:

1. ✅ Signup creates user + profile (via trigger)
2. ✅ Email sent with verification link
3. ✅ Click link → Email verified
4. ✅ Profile updated to `email_verified = TRUE`
5. ✅ Redirect to onboarding
6. ✅ User can now use the app!

**Let's test again!** 🚀

