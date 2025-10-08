-- Check table names and constraints more thoroughly
-- This will help us understand the exact issue

-- 1. List all tables in the public schema
SELECT 'All tables in public schema:' as info;
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name LIKE '%doctor%'
ORDER BY table_name;

-- 2. Check the exact foreign key constraint details
SELECT 'Detailed foreign key constraint info:' as info;
SELECT 
    tc.table_schema,
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'doctor_schedules'
    AND tc.table_schema = 'public';

-- 3. Check if there's a difference between 'doctors' and 'public.doctors'
SELECT 'Checking doctors table existence:' as info;
SELECT 
    table_schema,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'doctors'
ORDER BY table_schema;

-- 4. Check the exact structure of the doctors table
SELECT 'doctors table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'doctors' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Test if we can query the doctors table directly
SELECT 'Testing doctors table query:' as info;
SELECT COUNT(*) as doctor_count FROM public.doctors;
SELECT COUNT(*) as auth_user_count FROM auth.users;

-- 6. Check if the specific user ID exists in the doctors table
SELECT 'Specific user in doctors table:' as info;
SELECT 
    id,
    email,
    first_name,
    last_name,
    is_active
FROM public.doctors 
WHERE id = '21aaad9c-afde-4105-94b1-c2f10efc63c8';

-- 7. Check if there are any case sensitivity issues
SELECT 'Checking case sensitivity:' as info;
SELECT 
    id,
    email
FROM public.doctors 
WHERE id::text = '21aaad9c-afde-4105-94b1-c2f10efc63c8';

-- 8. Check the exact constraint name and definition
SELECT 'Exact constraint definition:' as info;
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.doctor_schedules'::regclass
    AND contype = 'f';
