# 🎯 Database Trigger Setup Guide

## Overview
This guide helps you set up an automatic profile creation trigger that runs whenever a new user signs up.

---

## 🚀 Setup Steps

### **STEP 1: Create the Function (SQL Editor)**

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **"New Query"**
3. Copy and paste the entire content from:
   ```
   supabase/migrations/20250204000002_auto_create_profile_trigger.sql
   ```
4. Click **"Run"**

**Expected result:** ✅ "Success. No rows returned"

---

### **STEP 2A: Try Creating Trigger via SQL (Automatic)**

If the SQL file ran successfully and you see **no permission errors**, the trigger should already be created! Skip to STEP 3.

---

### **STEP 2B: Create Trigger via Dashboard UI (If SQL Failed)**

If you got error: `ERROR: 42501: must be owner of relation users`

1. Go to **Database → Triggers** in Supabase Dashboard
2. Click **"Create a new trigger"** or **"Enable Trigger"**
3. Fill in these details:

   **Trigger Settings:**
   - **Name:** `on_auth_user_created`
   - **Schema:** `auth` ⚠️ (Important! Not `public`)
   - **Table:** `users` ⚠️ (This is the auth.users table)
   - **Events:** `Insert` ✅ (check only Insert)
   - **Type:** `After` (not Before)
   - **Orientation:** `Row` (for each row)
   - **Function to trigger:** `public.handle_new_user()`

4. Click **"Create Trigger"** or **"Save"**

---

### **STEP 3: Verify Trigger Exists**

Run this query in SQL Editor to check:

```sql
SELECT 
  trigger_name,
  event_object_schema,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

**Expected result:** Should show 1 row with your trigger details

---

### **STEP 4: Test the Trigger**

1. **Sign up with a NEW test email** in your app
2. **Check the `profiles` table:**
   ```sql
   SELECT id, full_name, phone_number, role, email_verified, created_at
   FROM public.profiles
   ORDER BY created_at DESC
   LIMIT 5;
   ```
3. **You should see the profile** created automatically! ✅

---

## 🔍 Troubleshooting

### **Permission Error when creating trigger:**
**Error:** `ERROR: 42501: must be owner of relation users`

**Solution:** Use STEP 2B above (Dashboard UI method)

---

### **Trigger not firing:**

1. **Check if trigger exists:**
   ```sql
   SELECT * FROM information_schema.triggers 
   WHERE trigger_name = 'on_auth_user_created';
   ```

2. **Check if function exists:**
   ```sql
   SELECT proname, prosrc 
   FROM pg_proc 
   WHERE proname = 'handle_new_user';
   ```

3. **Test function manually:**
   ```sql
   -- This should NOT error out
   SELECT public.handle_new_user();
   ```

---

### **Profile not being created:**

1. Check Supabase logs: **Database → Logs**
2. Look for warnings like: `Failed to create profile for user`
3. Check if `profiles` table has correct columns:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns
   WHERE table_name = 'profiles';
   ```

---

## ✅ Success Checklist

- [ ] Function `handle_new_user()` created
- [ ] Trigger `on_auth_user_created` created on `auth.users`
- [ ] Trigger verification query shows trigger exists
- [ ] Test signup creates profile automatically
- [ ] Profile has correct data from signup form

---

## 🎉 Benefits

Once set up, this trigger:
- ✅ Automatically creates profiles (no frontend code needed)
- ✅ Works atomically (can't fail partially)
- ✅ Bypasses RLS safely
- ✅ Works with cleanup function
- ✅ Industry-standard approach

