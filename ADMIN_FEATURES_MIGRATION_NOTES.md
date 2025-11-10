# Admin Features Migration Notes

## ⚠️ IMPORTANT: Read This Before Implementing Admin Features

This document tracks the RLS policy changes made to fix infinite recursion issues, and what needs to be considered when implementing admin functionality.

---

## 🔧 What Was Changed (November 4, 2025)

### Problem Fixed
- **Issue**: Infinite recursion in RLS policies when admins table queried itself
- **Error**: `42P17 infinite recursion detected in policy for relation "admins"`
- **Impact**: Doctor login broken, profile fetch failed

### Policies Removed
The following admin access checks were **REMOVED** from RLS policies:

#### 1. Profiles Table
```sql
-- REMOVED FROM ALL POLICIES:
OR EXISTS (
    SELECT 1 FROM public.admins 
    WHERE admins.user_id = (select auth.uid())
)
```

**Affected Policies:**
- "Users can view their own profile"
- "Users can create their own profile"  
- "Users can update their own profile"

#### 2. Patients Table
```sql
-- REMOVED FROM POLICIES:
OR EXISTS (
    SELECT 1 FROM public.admins 
    WHERE admins.user_id = (select auth.uid())
)
```

**Affected Policies:**
- "Patients can view own profile"
- "Patients can insert own profile"
- "Patients can update own profile"

#### 3. Appointments Table
```sql
-- REMOVED FROM POLICIES:
OR EXISTS (
    SELECT 1 FROM public.admins 
    WHERE admins.user_id = (select auth.uid())
)
```

**Affected Policies:**
- "Patients can view own appointments"
- "Patients can create own appointments"
- "Patients can update own appointments"

---

## 🚨 CONSEQUENCES FOR ADMIN FEATURES

### ❌ What Admins CANNOT Do Now (via RLS)
1. **Cannot query profiles table** directly through RLS policies
2. **Cannot query patients table** directly through RLS policies
3. **Cannot query appointments table** directly through RLS policies
4. **Cannot manage user data** through standard authenticated queries

### ✅ What Admins CAN Still Do
1. **Can access their own admin record** in admins table
2. **Can view audit_logs** (policy still intact)
3. **Can use Service Role Key** (bypasses RLS entirely)

---

## 💡 RECOMMENDED APPROACH FOR ADMIN FEATURES

When you start implementing admin functionality, use **ONE** of these approaches:

### Option 1: Service Role Key (RECOMMENDED)
**Use Supabase service role key for admin operations**

```typescript
// Example: Admin service
import { createClient } from '@supabase/supabase-js'

// Service role client (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // SECRET - backend only!
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Admin can query any table
export async function adminGetAllProfiles() {
  // Verify admin role first in your backend
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
  
  return data
}
```

**Pros:**
- ✅ Bypasses RLS completely
- ✅ No recursion issues
- ✅ Full database access
- ✅ Clean separation of concerns

**Cons:**
- ⚠️ Must be used in backend/API routes only (NEVER in frontend)
- ⚠️ Requires additional auth checks in your code

---

### Option 2: Separate Admin Policies (COMPLEX)
**Create dedicated admin-only policies with careful design**

```sql
-- Example: Separate policy for admins to view all profiles
-- WARNING: Complex, easy to create recursion

CREATE POLICY "Admins can view all profiles via function" ON public.profiles
    FOR SELECT USING (
        -- Use a custom function that doesn't query admins table
        public.is_admin_user(auth.uid())
    );

-- Create the function (stored in database)
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Option A: Check metadata
    RETURN (
        SELECT (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean
    );
    
    -- Option B: Use a flag in profiles table instead
    -- RETURN (
    --     SELECT is_admin FROM profiles WHERE id = user_id
    -- );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Pros:**
- ✅ Uses RLS (follows PostgreSQL patterns)
- ✅ Centralized access control

**Cons:**
- ❌ Complex to implement correctly
- ❌ Easy to create recursion bugs again
- ❌ Performance overhead
- ❌ Harder to debug

---

### Option 3: Admin Flag in Profiles Table (SIMPLE)
**Add admin flag directly to profiles table**

```sql
-- Add admin flag to profiles
ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;

-- Update policies to check profiles table only
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        id = (select auth.uid()) OR
        (SELECT is_admin FROM profiles WHERE id = (select auth.uid()))
    );
```

**Pros:**
- ✅ Simple to implement
- ✅ No recursion (profiles checks itself, not admins table)
- ✅ Works with RLS

**Cons:**
- ⚠️ Mixes admin role with user profiles
- ⚠️ Less granular permissions
- ⚠️ Admins table becomes redundant

---

## 🎯 MY RECOMMENDATION

**Use Option 1: Service Role Key**

### Implementation Plan

1. **Backend Admin API Routes** (Next.js API routes, Supabase Edge Functions, or your backend)
   ```typescript
   // pages/api/admin/users.ts
   export default async function handler(req, res) {
     // 1. Verify user is admin
     const { data: { user } } = await supabase.auth.getUser(req.headers.authorization)
     
     // 2. Check admin status
     const { data: admin } = await supabase
       .from('admins')
       .select('role')
       .eq('user_id', user.id)
       .single()
     
     if (!admin) {
       return res.status(403).json({ error: 'Forbidden' })
     }
     
     // 3. Use service role for admin operations
     const { data: profiles } = await supabaseAdmin
       .from('profiles')
       .select('*')
     
     return res.json(profiles)
   }
   ```

2. **Frontend Admin Components**
   ```typescript
   // Call your admin API
   const response = await fetch('/api/admin/users', {
     headers: {
       'Authorization': `Bearer ${session.access_token}`
     }
   })
   ```

3. **Security Checklist**
   - [ ] Service role key stored in environment variables only
   - [ ] Never expose service role key to frontend
   - [ ] All admin routes verify admin role in backend
   - [ ] Rate limiting on admin endpoints
   - [ ] Audit logging for admin actions

---

## 📋 BEFORE YOU START ADMIN FEATURES

### Step 1: Enable Admin System
The admin check is currently disabled in `src/hooks/useRBAC.ts` (lines 29-54).

**Re-enable it:**
```typescript
// Uncomment the admin check section
const { data: admin, error: adminError } = await supabase
  .from('admins')
  .select('role, permissions')
  .eq('user_id', currentUser.id)
  .single()

if (admin) {
  console.log('🔍 useRBAC: User is admin')
  setUserRole('admin')
  setPermissions(admin.permissions || [])
  setIsLoading(false)
  return
}
```

### Step 2: Test Admin Table Access
Verify the admins table policies work:
```sql
-- Insert a test admin
INSERT INTO admins (user_id, role, permissions)
VALUES ('your-user-id-here', 'admin', ARRAY['read', 'write', 'delete']);

-- Verify policy works
SELECT * FROM admins WHERE user_id = auth.uid();
```

### Step 3: Create Admin Backend Routes
Set up your admin API infrastructure before building frontend features.

### Step 4: Update This Document
Document any new approaches or issues you encounter.

---

## 🔗 Related Files

- **RLS Migration**: `supabase/migrations/20250204000008_optimize_rls_policies_performance.sql`
- **Fix Applied**: SQL provided on November 4, 2025
- **useRBAC Hook**: `src/hooks/useRBAC.ts` (admin check disabled)
- **Admins Table**: Created in `supabase/migrations/20250127000001_add_rbac_system.sql`

---

## 📞 Questions to Ask Yourself

1. **Do I need admins to query via RLS, or can I use service role?**
   - If service role is acceptable → Use Option 1 (recommended)
   - If you must use RLS → Use Option 3 (simple) or Option 2 (complex)

2. **What data do admins need to access?**
   - User profiles
   - Patient records
   - Doctor records
   - Appointments
   - Audit logs
   - System settings

3. **How will admin operations be logged?**
   - Use the existing `audit_logs` table
   - Ensure all admin actions are recorded

4. **What permissions do different admin levels need?**
   - `admin`: Read-only access
   - `super_admin`: Full CRUD access
   - Custom roles?

---

## ✅ Testing Checklist (When Implementing)

- [ ] Admin can log in
- [ ] Admin role detected correctly by useRBAC
- [ ] Admin can access admin dashboard
- [ ] Admin API routes verify admin role
- [ ] Service role key is secure (backend only)
- [ ] Admin actions are logged to audit_logs
- [ ] Non-admins cannot access admin routes
- [ ] No infinite recursion errors in policies
- [ ] Performance is acceptable
- [ ] All admin features work as expected

---

## 📝 Additional Notes

### Why This Happened
The performance optimization migration (`20250204000008_optimize_rls_policies_performance.sql`) added admin checks to many policies to give admins access to all data. However, one of these policies was added to the `admins` table itself, creating a circular dependency:

```sql
-- This policy on admins table checks admins table = INFINITE RECURSION
CREATE POLICY "Super admins can view all admin profiles" ON public.admins
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admins a
            WHERE a.user_id = (select auth.uid()) AND a.role = 'super_admin'
        )
    );
```

The fix removes these recursive checks and simplifies the policies to only check the user's own data.

---

**Document Created**: November 4, 2025  
**Last Updated**: November 4, 2025  
**Status**: Active - Reference before implementing admin features  
**Author**: AI Assistant (Claude Sonnet 4.5)














