# Database Migration Instructions

## Overview
The patient pre-registration flow requires several database changes:
1. Add `queue_token` column to `appointments` table
2. Create `patient_pre_registrations` table
3. Add missing columns to `patients` table (`city`, `state`, `id_proof_urls`, `lab_report_urls`)
4. Create `generate_queue_token()` function

## Migration File
The migration file has been created at:
`supabase/migrations/20250126000000_add_queue_token_and_pre_registrations.sql`

## How to Apply the Migration

### Option 1: Using Supabase CLI (Recommended)
```bash
# If you have Supabase CLI installed
npx supabase db push
```

### Option 2: Manual Application via Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the migration file: `supabase/migrations/20250126000000_add_queue_token_and_pre_registrations.sql`
4. Copy the entire SQL content
5. Paste it into the SQL Editor
6. Click **Run** to execute the migration

### Option 3: Using psql (if you have direct database access)
```bash
psql -h <your-db-host> -U <your-db-user> -d <your-db-name> -f supabase/migrations/20250126000000_add_queue_token_and_pre_registrations.sql
```

## Verification
After applying the migration, verify the changes:

### 1. Check appointments table has queue_token column:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'appointments' AND column_name = 'queue_token';
```

### 2. Check patient_pre_registrations table exists:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'patient_pre_registrations';
```

### 3. Test the generate_queue_token function:
```sql
SELECT generate_queue_token();
```

### 4. Check patients table has new columns:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'patients' 
AND column_name IN ('city', 'state', 'id_proof_urls', 'lab_report_urls');
```

## Important Notes
- The migration is **idempotent** - it's safe to run multiple times
- It uses `IF NOT EXISTS` checks to avoid errors if columns/tables already exist
- All RLS policies are properly configured for security
- The `generate_queue_token()` function ensures unique tokens

## After Migration
Once the migration is applied successfully, the patient pre-registration flow should work as follows:

1. ✅ User fills out the pre-registration form with password
2. ✅ System creates auth account in `auth.users` table
3. ✅ System creates patient record in `patients` table
4. ✅ System creates pre-registration record in `patient_pre_registrations` table
5. ✅ If booking details exist, system creates appointment with queue token
6. ✅ Queue token modal displays the generated token
7. ✅ Time slot is marked as booked

## Troubleshooting
If you encounter errors:

1. **Permission denied**: Ensure you're using a database user with sufficient privileges
2. **Function already exists**: The migration handles this with `CREATE OR REPLACE`
3. **RLS policy errors**: The migration properly sets up all required policies

## Next Steps
After applying the migration:
1. Test the patient registration flow
2. Verify all data is being inserted correctly
3. Check that queue tokens are being generated uniquely
4. Ensure RLS policies allow proper data access

