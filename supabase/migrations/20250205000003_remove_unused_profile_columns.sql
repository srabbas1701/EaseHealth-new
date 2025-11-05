-- Remove unused columns from profiles table
-- These columns (age, gender, city, state) are redundant and stored in role-specific tables
-- Patient-specific data → patients table
-- Doctor-specific data → doctors table

-- Remove columns that are never populated or used
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS age,
DROP COLUMN IF EXISTS gender,
DROP COLUMN IF EXISTS city,
DROP COLUMN IF EXISTS state;

-- Add comment explaining the profiles table purpose
COMMENT ON TABLE public.profiles IS 'Basic user authentication and profile information for ALL users. Role-specific detailed data is stored in patients or doctors tables based on user role.';

