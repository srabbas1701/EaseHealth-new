-- ============================================
-- FIX: Appointments RLS Policy for Patient ID
-- ============================================
-- ISSUE: The existing RLS policy checks patient_id = auth.uid()
-- but patient_id is actually patients.id (UUID from patients table)
-- not auth.users.id (UUID from auth table)
--
-- FIX: Update policy to check if auth.uid() matches the user_id
-- in the patients table for the given patient_id
-- ============================================

-- Drop existing policy
DROP POLICY IF EXISTS "Patients can create own appointments" ON public.appointments;

-- Create corrected policy that properly maps auth.uid() to patients.user_id
CREATE POLICY "Patients can create own appointments" ON public.appointments
    FOR INSERT WITH CHECK (
        -- Check if the patient_id being inserted corresponds to a patient 
        -- whose user_id matches the authenticated user
        EXISTS (
            SELECT 1 FROM public.patients 
            WHERE patients.id = patient_id 
            AND patients.user_id = (select auth.uid())
        ) OR
        -- Allow admins to create appointments for any patient
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE admins.user_id = (select auth.uid())
        )
    );

-- Also update the SELECT policy for consistency
DROP POLICY IF EXISTS "Patients can view own appointments" ON public.appointments;

CREATE POLICY "Patients can view own appointments" ON public.appointments
    FOR SELECT USING (
        -- Check if the patient_id in the appointment corresponds to a patient 
        -- whose user_id matches the authenticated user
        EXISTS (
            SELECT 1 FROM public.patients 
            WHERE patients.id = patient_id 
            AND patients.user_id = (select auth.uid())
        ) OR
        -- Allow admins to view all appointments
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE admins.user_id = (select auth.uid())
        )
    );

-- Also update the UPDATE policy for consistency
DROP POLICY IF EXISTS "Patients can update own appointments" ON public.appointments;

CREATE POLICY "Patients can update own appointments" ON public.appointments
    FOR UPDATE USING (
        -- Check if the patient_id in the appointment corresponds to a patient 
        -- whose user_id matches the authenticated user
        EXISTS (
            SELECT 1 FROM public.patients 
            WHERE patients.id = patient_id 
            AND patients.user_id = (select auth.uid())
        ) OR
        -- Allow admins to update all appointments
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE admins.user_id = (select auth.uid())
        )
    );

-- Add comment for documentation
COMMENT ON POLICY "Patients can create own appointments" ON public.appointments IS 
    'Fixed RLS policy: Properly maps auth.uid() to patients.user_id instead of comparing directly with patient_id';

-- ============================================
-- Verification Note
-- ============================================
-- This fix resolves the RLS policy violation that was preventing patients
-- from creating appointments. The patient_id field in appointments table
-- is a foreign key to patients.id, not auth.users.id, so we need to join
-- through the patients table to verify ownership.
-- ============================================

