-- ============================================
-- QUICK FIX: Patient Appointment Booking RLS Error
-- ============================================
-- ERROR: "new row violates row-level security policy for table appointments"
-- CAUSE: RLS policy incorrectly checks patient_id = auth.uid() 
--        but patient_id is patients.id, not auth.users.id
-- FIX: Update policies to check through patients table join
-- ============================================

-- 1. Fix INSERT policy (Book Appointment)
DROP POLICY IF EXISTS "Patients can create own appointments" ON public.appointments;

CREATE POLICY "Patients can create own appointments" ON public.appointments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.patients 
            WHERE patients.id = patient_id 
            AND patients.user_id = (select auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE admins.user_id = (select auth.uid())
        )
    );

-- 2. Fix SELECT policy (View Appointments)
DROP POLICY IF EXISTS "Patients can view own appointments" ON public.appointments;

CREATE POLICY "Patients can view own appointments" ON public.appointments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.patients 
            WHERE patients.id = patient_id 
            AND patients.user_id = (select auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE admins.user_id = (select auth.uid())
        )
    );

-- 3. Fix UPDATE policy (Cancel/Reschedule Appointment)
DROP POLICY IF EXISTS "Patients can update own appointments" ON public.appointments;

CREATE POLICY "Patients can update own appointments" ON public.appointments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.patients 
            WHERE patients.id = patient_id 
            AND patients.user_id = (select auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE admins.user_id = (select auth.uid())
        )
    );

-- ============================================
-- HOW TO APPLY:
-- 1. Copy this entire file
-- 2. Go to Supabase Dashboard → SQL Editor
-- 3. Paste and click "Run"
-- 4. Test booking an appointment - should work now!
-- ============================================

