-- Backfill email addresses for existing profiles
-- This migration updates existing profiles that have NULL email by copying from auth.users

-- Update existing profiles to include email from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
  AND p.email IS NULL;

-- Add comment
COMMENT ON COLUMN public.profiles.email IS 'User email address, copied from auth.users during profile creation';


