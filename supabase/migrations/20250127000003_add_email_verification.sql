-- Add email verification system to EaseHealth
-- This migration adds email verification functionality for user signup

-- Add email verification columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_token TEXT,
ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMP WITH TIME ZONE;

-- Create index for verification token lookup
CREATE INDEX IF NOT EXISTS idx_profiles_verification_token ON public.profiles(verification_token);

-- Create index for email verification status
CREATE INDEX IF NOT EXISTS idx_profiles_email_verified ON public.profiles(email_verified);

-- Add comment to explain the verification system
COMMENT ON COLUMN public.profiles.email_verified IS 'Indicates if the user has verified their email address';
COMMENT ON COLUMN public.profiles.verification_token IS 'Token used for email verification, expires after 5 minutes';
COMMENT ON COLUMN public.profiles.verification_expires_at IS 'Timestamp when the verification token expires';

-- Create cleanup function for unverified users (5-minute window)
CREATE OR REPLACE FUNCTION cleanup_unverified_users()
RETURNS void AS $$
BEGIN
  -- Delete profiles of users who haven't verified email within 5 minutes
  DELETE FROM public.profiles 
  WHERE email_verified = FALSE 
  AND created_at < NOW() - INTERVAL '5 minutes';
  
  -- Note: auth.users will be automatically deleted due to CASCADE
END;
$$ LANGUAGE plpgsql;

-- Add comment for cleanup function
COMMENT ON FUNCTION cleanup_unverified_users() IS 'Deletes unverified user profiles after 5 minutes for security and database hygiene';
