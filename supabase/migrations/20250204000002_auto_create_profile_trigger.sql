-- Auto-create profile when user signs up
-- This trigger automatically creates a profile in the profiles table
-- whenever a new user is created in auth.users

-- Step 1: Create the function that will be called by the trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a new profile for the user
  -- Extract data from user_metadata (raw_user_meta_data in Supabase)
  INSERT INTO public.profiles (
    id,
    full_name,
    phone_number,
    role,
    email_verified,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
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

-- Step 2: Add comment for function
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a profile when a new user signs up. Extracts data from user_metadata.';

-- Step 3: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, anon, authenticated, service_role;

-- Step 4: Create the trigger on auth.users
-- Note: If you get a permission error, create this trigger via the Supabase Dashboard UI:
-- Go to: Database → Triggers → Create Trigger
-- Settings:
--   - Name: on_auth_user_created
--   - Schema: auth
--   - Table: users
--   - Events: Insert
--   - Type: After
--   - Orientation: Row
--   - Function: public.handle_new_user()

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

