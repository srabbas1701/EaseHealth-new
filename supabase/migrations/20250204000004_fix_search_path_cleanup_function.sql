-- Fix search_path security issue for cleanup_unverified_users function
-- This adds SET search_path = public to prevent search path injection attacks

CREATE OR REPLACE FUNCTION cleanup_unverified_users()
RETURNS void AS $$
BEGIN
  -- Delete profiles of users who haven't verified email within 30 minutes
  -- Changed from 5 minutes to 30 minutes to give users more time
  DELETE FROM public.profiles 
  WHERE email_verified = FALSE 
  AND created_at < NOW() - INTERVAL '30 minutes';
  
  -- Note: auth.users will be automatically deleted due to ON DELETE CASCADE
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update comment
COMMENT ON FUNCTION cleanup_unverified_users() IS 'Deletes unverified user profiles after 30 minutes for security and database hygiene. Protected against search path injection.';




