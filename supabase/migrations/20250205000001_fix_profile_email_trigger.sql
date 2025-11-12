-- Fix profile creation trigger to include email
-- This migration updates the handle_new_user() function to copy email from auth.users to profiles

-- Update the trigger function to include email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a new profile for the user
  -- Extract data from user_metadata (raw_user_meta_data in Supabase)
  INSERT INTO public.profiles (
    id,
    full_name,
    phone_number,
    email,
    role,
    email_verified,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NEW.email,  -- Copy email from auth.users
    'patient', -- Default role
    FALSE, -- Will be set to true after email verification
    NOW(),
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, ignore
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add comment
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a profile when a new user signs up. Extracts data from user_metadata and copies email from auth.users.';
















