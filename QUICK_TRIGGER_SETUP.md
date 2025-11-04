# ⚡ Quick Trigger Setup

## 1️⃣ Run SQL
```sql
-- Create function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone_number, role, email_verified, created_at, updated_at)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), COALESCE(NEW.raw_user_meta_data->>'phone', ''), 'patient', FALSE, NOW(), NOW());
  RETURN NEW;
EXCEPTION WHEN unique_violation THEN RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, anon, authenticated, service_role;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 2️⃣ If Permission Error
Go to **Database → Triggers** UI and create manually:
- **Name:** `on_auth_user_created`
- **Schema:** `auth`
- **Table:** `users`
- **Event:** `Insert` (After)
- **Function:** `public.handle_new_user()`

## 3️⃣ Verify Trigger
```sql
SELECT trigger_name, event_object_schema, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

## 4️⃣ Test
Sign up with new email → Check profiles table → Should see profile! ✅

