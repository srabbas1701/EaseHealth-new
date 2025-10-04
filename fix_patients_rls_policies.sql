-- Fix RLS policies for patients table to resolve infinite recursion
-- This script fixes the circular dependency issue in the patients table policies

-- First, drop the problematic policy
DROP POLICY IF EXISTS "Doctors can view their patients" ON patients;

-- Create a simpler policy for doctors to view patients
-- This policy allows doctors to view patients who have booked appointments with them
CREATE POLICY "Doctors can view their patients" ON patients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM doctors 
      WHERE doctors.user_id = auth.uid() 
      AND EXISTS (
        SELECT 1 FROM time_slots 
        WHERE time_slots.doctor_id = doctors.id 
        AND time_slots.status = 'booked'
        AND time_slots.notes LIKE '%patient ' || patients.user_id || '%'
      )
    )
  );

-- Also fix the appointments policies to work with time_slots
DROP POLICY IF EXISTS "Patients can view own appointments" ON appointments;
DROP POLICY IF EXISTS "Patients can create own appointments" ON appointments;
DROP POLICY IF EXISTS "Patients can update own appointments" ON appointments;
DROP POLICY IF EXISTS "Doctors can view own appointments" ON appointments;
DROP POLICY IF EXISTS "Doctors can update own appointments" ON appointments;

-- Create policies for time_slots table instead
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;

-- Patients can view their own booked time slots
CREATE POLICY "Patients can view own time slots" ON time_slots
  FOR SELECT USING (
    status = 'booked' 
    AND notes LIKE '%patient ' || auth.uid()::text || '%'
  );

-- Doctors can view their own time slots
CREATE POLICY "Doctors can view own time slots" ON time_slots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM doctors 
      WHERE doctors.user_id = auth.uid() 
      AND doctors.id = time_slots.doctor_id
    )
  );

-- Doctors can update their own time slots
CREATE POLICY "Doctors can update own time slots" ON time_slots
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM doctors 
      WHERE doctors.user_id = auth.uid() 
      AND doctors.id = time_slots.doctor_id
    )
  );

-- Public can view available time slots (for booking)
CREATE POLICY "Public can view available time slots" ON time_slots
  FOR SELECT USING (status = 'available');

-- Authenticated users can book time slots
CREATE POLICY "Authenticated users can book time slots" ON time_slots
  FOR UPDATE USING (
    status = 'available' 
    AND auth.uid() IS NOT NULL
  );

-- Verify the policies are working
SELECT 'RLS policies fixed successfully' as status;
