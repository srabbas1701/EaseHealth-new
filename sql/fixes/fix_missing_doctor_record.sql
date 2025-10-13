ts -- Fix missing doctor record for authenticated user
-- This script will create a doctor record for the authenticated user

-- First, let's check what users exist in auth.users but not in doctors
SELECT 'Users in auth.users but not in doctors:' as info;
SELECT 
    au.id as user_id,
    au.email,
    au.created_at as auth_created_at,
    CASE 
        WHEN d.id IS NULL THEN 'MISSING FROM DOCTORS'
        ELSE 'EXISTS IN DOCTORS'
    END as doctor_status
FROM auth.users au
LEFT JOIN public.doctors d ON au.id = d.id
ORDER BY au.created_at DESC;

-- Check if the specific user ID exists in auth.users
SELECT 'Checking specific user:' as info;
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    last_sign_in_at
FROM auth.users 
WHERE id = '21aaad9c-afde-4105-94b1-c2f10efc63c8';

-- Check if this user exists in doctors table
SELECT 'Checking if user exists in doctors table:' as info;
SELECT 
    id,
    email,
    first_name,
    last_name,
    created_at
FROM public.doctors 
WHERE id = '21aaad9c-afde-4105-94b1-c2f10efc63c8';

-- Create the missing doctor record
INSERT INTO public.doctors (
    id,
    email,
    first_name,
    last_name,
    phone_number,
    specialization_id,
    license_number,
    years_of_experience,
    consultation_fee,
    bio,
    is_verified,
    is_active,
    created_at,
    updated_at
)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'first_name', 'Doctor') as first_name,
    COALESCE(au.raw_user_meta_data->>'last_name', 'User') as last_name,
    COALESCE(au.raw_user_meta_data->>'phone', '') as phone_number,
    (SELECT id FROM specialties LIMIT 1) as specialization_id, -- Use first available specialty
    'TEMP-LICENSE-' || substring(au.id::text, 1, 8) as license_number,
    5 as years_of_experience,
    500 as consultation_fee,
    'Doctor profile created automatically' as bio,
    false as is_verified,
    true as is_active,
    now() as created_at,
    now() as updated_at
FROM auth.users au
WHERE au.id = '21aaad9c-afde-4105-94b1-c2f10efc63c8'
AND NOT EXISTS (
    SELECT 1 FROM public.doctors d WHERE d.id = au.id
);

-- Verify the doctor record was created
SELECT 'Verifying doctor record creation:' as info;
SELECT 
    id,
    email,
    first_name,
    last_name,
    specialization_id,
    is_active,
    created_at
FROM public.doctors 
WHERE id = '21aaad9c-afde-4105-94b1-c2f10efc63c8';

SELECT 'Doctor record created successfully!' as result;
