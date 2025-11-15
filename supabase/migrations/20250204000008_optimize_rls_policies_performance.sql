-- ============================================
-- PERFORMANCE OPTIMIZATION: Fix Auth RLS InitPlan Issues
-- ============================================
-- This migration optimizes RLS policies by wrapping auth.uid() calls with (select ...)
-- This prevents PostgreSQL from re-evaluating auth functions for each row, 
-- significantly improving query performance at scale.
--
-- NO CODE IMPACT: This is a database-level optimization only.
-- Application code will work exactly the same way.
--
-- Fixes: 45 RLS policy performance warnings
-- ============================================

-- ============================================
-- PROFILES TABLE (3 policies)
-- ============================================

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (
        id = (select auth.uid()) OR
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE admins.user_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
CREATE POLICY "Users can create their own profile" ON public.profiles
    FOR INSERT WITH CHECK (
        id = (select auth.uid()) OR
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE admins.user_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (
        id = (select auth.uid()) OR
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE admins.user_id = (select auth.uid())
        )
    );

-- ============================================
-- PATIENTS TABLE (4 policies)
-- ============================================

DROP POLICY IF EXISTS "Patients can view own profile" ON public.patients;
CREATE POLICY "Patients can view own profile" ON public.patients
    FOR SELECT USING (
        user_id = (select auth.uid()) OR
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE admins.user_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS "Patients can insert own profile" ON public.patients;
CREATE POLICY "Patients can insert own profile" ON public.patients
    FOR INSERT WITH CHECK (
        user_id = (select auth.uid()) OR
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE admins.user_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS "Patients can update own profile" ON public.patients;
CREATE POLICY "Patients can update own profile" ON public.patients
    FOR UPDATE USING (
        user_id = (select auth.uid()) OR
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE admins.user_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS "Doctors can view their patients" ON public.patients;
CREATE POLICY "Doctors can view their patients" ON public.patients
    FOR SELECT USING (
        user_id = (select auth.uid()) OR
        EXISTS (
            SELECT 1 FROM public.doctors 
            WHERE doctors.user_id = (select auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE admins.user_id = (select auth.uid())
        )
    );

-- ============================================
-- PATIENT_PRE_REGISTRATIONS TABLE (3 policies)
-- ============================================

DROP POLICY IF EXISTS "Users can view own pre-registration" ON public.patient_pre_registrations;
CREATE POLICY "Users can view own pre-registration" ON public.patient_pre_registrations
    FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own pre-registration" ON public.patient_pre_registrations;
CREATE POLICY "Users can insert own pre-registration" ON public.patient_pre_registrations
    FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own pre-registration" ON public.patient_pre_registrations;
CREATE POLICY "Users can update own pre-registration" ON public.patient_pre_registrations
    FOR UPDATE USING (user_id = (select auth.uid()));

-- ============================================
-- APPOINTMENTS TABLE (16 policies - handling duplicates)
-- ============================================

-- Drop all existing appointment policies (including duplicates)
DROP POLICY IF EXISTS "Patients can view their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Patients can view own appointments" ON public.appointments;
DROP POLICY IF EXISTS "patients_can_view_own_appointments" ON public.appointments;
DROP POLICY IF EXISTS "Doctors can view their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Doctors can view own appointments" ON public.appointments;
DROP POLICY IF EXISTS "doctors_can_view_their_appointments" ON public.appointments;

DROP POLICY IF EXISTS "Patients can insert their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Patients can create own appointments" ON public.appointments;
DROP POLICY IF EXISTS "patients_can_insert_own_appointments" ON public.appointments;

DROP POLICY IF EXISTS "Patients can update own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can update their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Doctors can update their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Doctors can update own appointments" ON public.appointments;
DROP POLICY IF EXISTS "doctors_can_update_their_appointments" ON public.appointments;

-- Create optimized policies (one per role/action combination)
CREATE POLICY "Patients can view own appointments" ON public.appointments
    FOR SELECT USING (
        patient_id = (select auth.uid()) OR
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE admins.user_id = (select auth.uid())
        )
    );

CREATE POLICY "Doctors can view own appointments" ON public.appointments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.doctors 
            WHERE doctors.user_id = (select auth.uid()) 
            AND doctors.id = appointments.doctor_id
        ) OR
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE admins.user_id = (select auth.uid())
        )
    );

CREATE POLICY "Patients can create own appointments" ON public.appointments
    FOR INSERT WITH CHECK (
        patient_id = (select auth.uid()) OR
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE admins.user_id = (select auth.uid())
        )
    );

CREATE POLICY "Patients can update own appointments" ON public.appointments
    FOR UPDATE USING (
        patient_id = (select auth.uid()) OR
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE admins.user_id = (select auth.uid())
        )
    );

CREATE POLICY "Doctors can update own appointments" ON public.appointments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.doctors 
            WHERE doctors.user_id = (select auth.uid()) 
            AND doctors.id = appointments.doctor_id
        ) OR
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE admins.user_id = (select auth.uid())
        )
    );

-- ============================================
-- PATIENT_VITALS TABLE (3 policies)
-- ============================================

DROP POLICY IF EXISTS "Doctors can view vitals of their patients" ON public.patient_vitals;
CREATE POLICY "Doctors can view vitals of their patients"
  ON patient_vitals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.patient_id = patient_vitals.patient_id
      AND appointments.doctor_id IN (
        SELECT id FROM doctors WHERE user_id = (select auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Doctors can insert vitals for their patients" ON public.patient_vitals;
CREATE POLICY "Doctors can insert vitals for their patients"
  ON patient_vitals FOR INSERT
  TO authenticated
  WITH CHECK (
    recorded_by IN (SELECT id FROM doctors WHERE user_id = (select auth.uid()))
  );

DROP POLICY IF EXISTS "Doctors can update vitals they recorded" ON public.patient_vitals;
CREATE POLICY "Doctors can update vitals they recorded"
  ON patient_vitals FOR UPDATE
  TO authenticated
  USING (recorded_by IN (SELECT id FROM doctors WHERE user_id = (select auth.uid())));

-- ============================================
-- PATIENT_REPORTS TABLE (4 policies)
-- ============================================

DROP POLICY IF EXISTS "Doctors can view reports of their patients" ON public.patient_reports;
CREATE POLICY "Doctors can view reports of their patients"
  ON patient_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.patient_id = patient_reports.patient_id
      AND appointments.doctor_id IN (
        SELECT id FROM doctors WHERE user_id = (select auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Doctors can upload reports for their patients" ON public.patient_reports;
CREATE POLICY "Doctors can upload reports for their patients"
  ON patient_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by IN (SELECT id FROM doctors WHERE user_id = (select auth.uid()))
  );

DROP POLICY IF EXISTS "Doctors can update reports they uploaded" ON public.patient_reports;
CREATE POLICY "Doctors can update reports they uploaded"
  ON patient_reports FOR UPDATE
  TO authenticated
  USING (uploaded_by IN (SELECT id FROM doctors WHERE user_id = (select auth.uid())));

-- ============================================
-- CONSULTATIONS TABLE (3 policies)
-- ============================================

DROP POLICY IF EXISTS "Doctors can view their consultations" ON public.consultations;
CREATE POLICY "Doctors can view their consultations"
  ON consultations FOR SELECT
  TO authenticated
  USING (doctor_id IN (SELECT id FROM doctors WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Doctors can create consultations" ON public.consultations;
CREATE POLICY "Doctors can create consultations"
  ON consultations FOR INSERT
  TO authenticated
  WITH CHECK (doctor_id IN (SELECT id FROM doctors WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Doctors can update their consultations" ON public.consultations;
CREATE POLICY "Doctors can update their consultations"
  ON consultations FOR UPDATE
  TO authenticated
  USING (doctor_id IN (SELECT id FROM doctors WHERE user_id = (select auth.uid())));

-- ============================================
-- PRESCRIPTIONS TABLE (3 policies)
-- ============================================

DROP POLICY IF EXISTS "Doctors can view their prescriptions" ON public.prescriptions;
CREATE POLICY "Doctors can view their prescriptions"
  ON prescriptions FOR SELECT
  TO authenticated
  USING (doctor_id IN (SELECT id FROM doctors WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Doctors can create prescriptions" ON public.prescriptions;
CREATE POLICY "Doctors can create prescriptions"
  ON prescriptions FOR INSERT
  TO authenticated
  WITH CHECK (doctor_id IN (SELECT id FROM doctors WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Doctors can update their prescriptions" ON public.prescriptions;
CREATE POLICY "Doctors can update their prescriptions"
  ON prescriptions FOR UPDATE
  TO authenticated
  USING (doctor_id IN (SELECT id FROM doctors WHERE user_id = (select auth.uid())));

-- ============================================
-- PRESCRIPTION_ITEMS TABLE (3 policies)
-- ============================================

DROP POLICY IF EXISTS "Doctors can view prescription items" ON public.prescription_items;
CREATE POLICY "Doctors can view prescription items"
  ON prescription_items FOR SELECT
  TO authenticated
  USING (
    prescription_id IN (
      SELECT id FROM prescriptions
      WHERE doctor_id IN (SELECT id FROM doctors WHERE user_id = (select auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Doctors can create prescription items" ON public.prescription_items;
CREATE POLICY "Doctors can create prescription items"
  ON prescription_items FOR INSERT
  TO authenticated
  WITH CHECK (
    prescription_id IN (
      SELECT id FROM prescriptions
      WHERE doctor_id IN (SELECT id FROM doctors WHERE user_id = (select auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Doctors can delete prescription items" ON public.prescription_items;
CREATE POLICY "Doctors can delete prescription items"
  ON prescription_items FOR DELETE
  TO authenticated
  USING (
    prescription_id IN (
      SELECT id FROM prescriptions
      WHERE doctor_id IN (SELECT id FROM doctors WHERE user_id = (select auth.uid()))
    )
  );

-- ============================================
-- ADMINS TABLE (2 policies)
-- ============================================

DROP POLICY IF EXISTS "Admins can view their own profile" ON public.admins;
CREATE POLICY "Admins can view their own profile" ON public.admins
    FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Super admins can view all admin profiles" ON public.admins;
CREATE POLICY "Super admins can view all admin profiles" ON public.admins
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admins a
            WHERE a.user_id = (select auth.uid()) AND a.role = 'super_admin'
        )
    );

-- ============================================
-- AUDIT_LOGS TABLE (2 policies)
-- ============================================

DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.audit_logs;
CREATE POLICY "Users can view their own audit logs" ON public.audit_logs
    FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE admins.user_id = (select auth.uid())
        )
    );

-- ============================================
-- Add comments for documentation
-- ============================================

COMMENT ON POLICY "Users can view their own profile" ON public.profiles IS 
    'Optimized RLS policy: auth.uid() wrapped with (select ...) for performance';
COMMENT ON POLICY "Patients can view own appointments" ON public.appointments IS 
    'Optimized RLS policy: auth.uid() wrapped with (select ...) for performance';
COMMENT ON POLICY "Doctors can view vitals of their patients" ON public.patient_vitals IS 
    'Optimized RLS policy: auth.uid() wrapped with (select ...) for performance';

-- ============================================
-- Performance Verification Query
-- ============================================
-- Run this query after migration to verify optimization:
-- 
-- SELECT 
--     schemaname,
--     tablename,
--     policyname,
--     qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- AND tablename IN ('profiles', 'patients', 'patient_pre_registrations', 
--                   'appointments', 'patient_vitals', 'patient_reports',
--                   'consultations', 'prescriptions', 'prescription_items',
--                   'admins', 'audit_logs')
-- ORDER BY tablename, policyname;
-- 
-- All policies should now contain "(select auth.uid())" instead of "auth.uid()"
-- ============================================
























