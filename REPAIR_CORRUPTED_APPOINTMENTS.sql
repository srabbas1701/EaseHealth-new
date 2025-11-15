-- ============================================
-- REPAIR SCRIPT: Fix Corrupted Appointment Links
-- ============================================
-- PURPOSE: Repair the 8 appointments that have broken time_slot links
-- RUN THIS: After applying migration 20251115000002_fix_time_slots_update_policy.sql
-- ============================================

-- STEP 1: PREVIEW - See what will be fixed
-- Run this first to review the corrupted records
SELECT 
  a.id as appointment_id,
  a.patient_id,
  a.doctor_id,
  a.schedule_date,
  a.start_time,
  a.status as appointment_status,
  ts.id as time_slot_id,
  ts.status as time_slot_status,
  ts.appointment_id as time_slot_current_link,
  CASE 
    WHEN ts.id IS NULL THEN '❌ NO MATCHING TIME SLOT FOUND'
    WHEN ts.appointment_id IS NULL THEN '⚠️ TIME SLOT NOT LINKED'
    WHEN ts.appointment_id != a.id THEN '⚠️ TIME SLOT LINKED TO DIFFERENT APPOINTMENT'
    ELSE '✅ OK'
  END as issue_type
FROM appointments a
LEFT JOIN time_slots ts ON 
  ts.doctor_id = a.doctor_id 
  AND ts.schedule_date = a.schedule_date 
  AND ts.start_time = a.start_time
WHERE a.status IN ('booked', 'confirmed')
  AND (
    ts.id IS NULL 
    OR ts.appointment_id IS NULL 
    OR ts.appointment_id != a.id
  )
ORDER BY a.created_at DESC;

-- ============================================
-- STEP 2: FIX - Repair the links
-- ============================================
-- Review the preview above, then uncomment and run this:

/*
-- Begin transaction for safety
BEGIN;

-- Fix: Link time_slots to their appointments
UPDATE time_slots ts
SET 
  appointment_id = a.id,
  status = 'booked',
  notes = COALESCE(ts.notes, '') || ' [REPAIRED: Linked to appointment on ' || CURRENT_DATE || ']',
  updated_at = NOW()
FROM appointments a
WHERE ts.doctor_id = a.doctor_id 
  AND ts.schedule_date = a.schedule_date 
  AND ts.start_time = a.start_time
  AND a.status IN ('booked', 'confirmed')
  AND (ts.appointment_id IS NULL OR ts.appointment_id != a.id);

-- Verify the fix
SELECT 
  COUNT(*) as fixed_count,
  'Time slots linked to appointments' as description
FROM time_slots
WHERE notes LIKE '%REPAIRED: Linked to appointment%';

-- If everything looks good, commit:
COMMIT;

-- If something looks wrong, rollback instead:
-- ROLLBACK;
*/

-- ============================================
-- STEP 3: VERIFY - Check if all fixed
-- ============================================
-- After running the fix, run this to confirm no more corrupted records:

SELECT 
  COUNT(*) as remaining_corrupted_appointments
FROM appointments a
LEFT JOIN time_slots ts ON ts.appointment_id = a.id
WHERE a.status IN ('booked', 'confirmed')
  AND ts.id IS NULL;

-- Expected result: 0

-- ============================================
-- STEP 4: CLEANUP - Handle appointments with no matching slots
-- ============================================
-- If some appointments have NO matching time_slot at all,
-- you may want to cancel them:

/*
-- Preview appointments that have no matching time_slot
SELECT 
  a.id as appointment_id,
  a.patient_id,
  a.doctor_id,
  a.schedule_date,
  a.start_time,
  a.created_at,
  'No matching time slot found' as issue
FROM appointments a
WHERE a.status IN ('booked', 'confirmed')
  AND NOT EXISTS (
    SELECT 1 FROM time_slots ts
    WHERE ts.doctor_id = a.doctor_id 
      AND ts.schedule_date = a.schedule_date 
      AND ts.start_time = a.start_time
  );

-- To cancel these orphaned appointments:
-- UPDATE appointments
-- SET 
--   status = 'cancelled',
--   notes = COALESCE(notes, '') || ' [AUTO-CANCELLED: No matching time slot found on ' || CURRENT_DATE || ']'
-- WHERE id IN (
--   SELECT a.id
--   FROM appointments a
--   WHERE a.status IN ('booked', 'confirmed')
--     AND NOT EXISTS (
--       SELECT 1 FROM time_slots ts
--       WHERE ts.doctor_id = a.doctor_id 
--         AND ts.schedule_date = a.schedule_date 
--         AND ts.start_time = a.start_time
--     )
-- );
*/

-- ============================================
-- MONITORING QUERY
-- ============================================
-- Save this query to check data health regularly:

SELECT 
  'Total Appointments' as metric,
  COUNT(*) as count
FROM appointments
WHERE status IN ('booked', 'confirmed')

UNION ALL

SELECT 
  'Properly Linked Appointments' as metric,
  COUNT(*) as count
FROM appointments a
JOIN time_slots ts ON ts.appointment_id = a.id
WHERE a.status IN ('booked', 'confirmed')

UNION ALL

SELECT 
  'Corrupted Appointments (SHOULD BE 0)' as metric,
  COUNT(*) as count
FROM appointments a
LEFT JOIN time_slots ts ON ts.appointment_id = a.id
WHERE a.status IN ('booked', 'confirmed')
  AND ts.id IS NULL;

-- ============================================
-- END OF REPAIR SCRIPT
-- ============================================


