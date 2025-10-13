-- Temporarily disable RLS to test if that's causing the transaction issues
-- This is for testing purposes only - re-enable RLS in production

-- Disable RLS on patients table temporarily
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;

-- Disable RLS on time_slots table temporarily  
ALTER TABLE time_slots DISABLE ROW LEVEL SECURITY;

-- Disable RLS on appointments table temporarily (if it exists)
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;

SELECT 'RLS disabled temporarily for testing' as status;
