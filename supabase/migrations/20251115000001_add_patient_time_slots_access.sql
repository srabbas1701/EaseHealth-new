-- ============================================
-- FIX: Allow Patients to View Their Booked Time Slots
-- ============================================
-- DATE: 2025-11-15
-- ISSUE: After enabling RLS on time_slots table in migration 20250923192310_shy_voice.sql,
--        patients cannot view their booked time slots, preventing cancellation and rescheduling.
--
-- ROOT CAUSE: The existing RLS policy "Authenticated users can view available slots"
--             only allows viewing slots where status = 'available'.
--             When appointments are booked, the slot status changes to 'booked',
--             making them invisible to patients who need to cancel/reschedule.
--
-- FIX: Add a SELECT policy that allows patients to view time slots 
--      that are associated with their own appointments.
--
-- SAFETY: This is a pure ADDITION of a new policy. No existing policies
--         or code are modified. The policy is restrictive and only grants
--         access to patients for their own booked slots.
-- ============================================

-- Add policy for patients to view their own booked time slots
-- This policy allows patients to see time slots that have been booked for their appointments
CREATE POLICY "Patients can view their own booked time slots" 
  ON time_slots
  FOR SELECT
  TO authenticated
  USING (
    -- Only allow viewing booked slots (not available/blocked/break)
    status = 'booked' 
    -- Ensure the slot has an associated appointment
    AND appointment_id IS NOT NULL 
    -- Verify the appointment belongs to this patient
    AND EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = time_slots.appointment_id
      AND EXISTS (
        SELECT 1 FROM patients
        WHERE patients.id = appointments.patient_id
        AND patients.user_id = auth.uid()
      )
    )
  );

-- Add comment for documentation
COMMENT ON POLICY "Patients can view their own booked time slots" ON time_slots IS
  'Allows patients to view time slots for their own appointments to enable cancellation and rescheduling. Added 2025-11-15 to fix reschedule functionality after RLS was enabled.';

-- ============================================
-- Verification Query
-- ============================================
-- This query can be run to verify the policy was created successfully
-- Expected result: Should show the new policy along with existing ones

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'time_slots'
ORDER BY policyname;

-- ============================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================
-- To remove this policy and revert to previous state, run:
-- DROP POLICY IF EXISTS "Patients can view their own booked time slots" ON time_slots;
--
-- WARNING: Removing this policy will break appointment cancellation 
-- and rescheduling functionality for patients.
-- ============================================


