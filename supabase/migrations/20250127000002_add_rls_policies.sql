-- Update RLS policies for existing tables to support RBAC
-- This migration updates existing tables to work with the new RBAC system

-- Drop existing policies for appointments table
DROP POLICY IF EXISTS "Users can view their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can insert their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can update their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can delete their own appointments" ON public.appointments;

-- Create new RBAC-aware policies for appointments table
CREATE POLICY "Patients can view their own appointments" ON public.appointments
    FOR SELECT USING (
        auth.uid() = patient_id OR 
        EXISTS (
            SELECT 1 FROM public.doctors 
            WHERE doctors.user_id = auth.uid() AND doctors.id = appointments.doctor_id
        ) OR
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE admins.user_id = auth.uid()
        )
    );

CREATE POLICY "Patients can insert their own appointments" ON public.appointments
    FOR INSERT WITH CHECK (
        auth.uid() = patient_id OR
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE admins.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own appointments" ON public.appointments
    FOR UPDATE USING (
        auth.uid() = patient_id OR 
        EXISTS (
            SELECT 1 FROM public.doctors 
            WHERE doctors.user_id = auth.uid() AND doctors.id = appointments.doctor_id
        ) OR
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE admins.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own appointments" ON public.appointments
    FOR DELETE USING (
        auth.uid() = patient_id OR 
        EXISTS (
            SELECT 1 FROM public.doctors 
            WHERE doctors.user_id = auth.uid() AND doctors.id = appointments.doctor_id
        ) OR
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE admins.user_id = auth.uid()
        )
    );

-- Drop existing policies for patients table
DROP POLICY IF EXISTS "Users can view their own patient profile" ON public.patients;
DROP POLICY IF EXISTS "Users can insert their own patient profile" ON public.patients;
DROP POLICY IF EXISTS "Users can update their own patient profile" ON public.patients;
DROP POLICY IF EXISTS "Users can delete their own patient profile" ON public.patients;

-- Create new RBAC-aware policies for patients table
CREATE POLICY "Patients can view their own profile" ON public.patients
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE admins.user_id = auth.uid()
        )
    );

CREATE POLICY "Patients can insert their own profile" ON public.patients
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE admins.user_id = auth.uid()
        )
    );

CREATE POLICY "Patients can update their own profile" ON public.patients
    FOR UPDATE USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE admins.user_id = auth.uid()
        )
    );

CREATE POLICY "Patients can delete their own profile" ON public.patients
    FOR DELETE USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE admins.user_id = auth.uid()
        )
    );

-- Drop existing policies for doctors table
DROP POLICY IF EXISTS "Doctors can view their own profile" ON public.doctors;
DROP POLICY IF EXISTS "Doctors can insert their own profile" ON public.doctors;
DROP POLICY IF EXISTS "Doctors can update their own profile" ON public.doctors;
DROP POLICY IF EXISTS "Doctors can delete their own profile" ON public.doctors;

-- Create new RBAC-aware policies for doctors table
CREATE POLICY "Doctors can view their own profile" ON public.doctors
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE admins.user_id = auth.uid()
        )
    );

CREATE POLICY "Doctors can insert their own profile" ON public.doctors
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE admins.user_id = auth.uid()
        )
    );

CREATE POLICY "Doctors can update their own profile" ON public.doctors
    FOR UPDATE USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE admins.user_id = auth.uid()
        )
    );

CREATE POLICY "Doctors can delete their own profile" ON public.doctors
    FOR DELETE USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE admins.user_id = auth.uid()
        )
    );

-- Drop existing policies for profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;

-- Create new RBAC-aware policies for profiles table
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (
        auth.uid() = id OR
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE admins.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (
        auth.uid() = id OR
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE admins.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (
        auth.uid() = id OR
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE admins.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own profile" ON public.profiles
    FOR DELETE USING (
        auth.uid() = id OR
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE admins.user_id = auth.uid()
        )
    );

