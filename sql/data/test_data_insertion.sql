-- Test script to verify patients and appointments table functionality
-- This script helps verify that the data saving fixes are working

-- 1. Check if tables exist
SELECT 
  'Tables Check' as test_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'patients') 
    THEN 'patients table exists' 
    ELSE 'patients table missing' 
  END as patients_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'appointments') 
    THEN 'appointments table exists' 
    ELSE 'appointments table missing' 
  END as appointments_status;

-- 2. Check table structures
SELECT 
  'Table Structure' as test_type,
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('patients', 'time_slots', 'appointments')
ORDER BY table_name, ordinal_position;

-- 3. Check current data counts
SELECT 
  'Data Counts' as test_type,
  (SELECT COUNT(*) FROM patients) as patients_count,
  (SELECT COUNT(*) FROM time_slots WHERE status = 'booked') as booked_appointments_count,
  (SELECT COUNT(*) FROM time_slots WHERE status = 'available') as available_slots_count;

-- 4. Show recent patients (if any)
SELECT 
  'Recent Patients' as test_type,
  id,
  user_id,
  full_name,
  email,
  created_at
FROM patients 
ORDER BY created_at DESC 
LIMIT 5;

-- 5. Show recent appointments (if any) - using time_slots table
SELECT 
  'Recent Appointments' as test_type,
  ts.id,
  ts.doctor_id,
  ts.schedule_date,
  ts.start_time,
  ts.end_time,
  ts.status,
  ts.appointment_id,
  ts.notes,
  d.full_name as doctor_name,
  ts.created_at,
  ts.updated_at
FROM time_slots ts
LEFT JOIN doctors d ON d.id = ts.doctor_id
WHERE ts.status = 'booked'
ORDER BY ts.updated_at DESC 
LIMIT 5;

-- 6. Show patient-appointment relationships
SELECT 
  'Patient-Appointment Relationships' as test_type,
  p.full_name as patient_name,
  p.email as patient_email,
  d.full_name as doctor_name,
  ts.schedule_date,
  ts.start_time,
  ts.end_time,
  ts.status,
  ts.appointment_id,
  ts.notes,
  ts.updated_at
FROM time_slots ts
LEFT JOIN doctors d ON d.id = ts.doctor_id
LEFT JOIN patients p ON ts.notes LIKE '%patient ' || p.user_id || '%'
WHERE ts.status = 'booked'
ORDER BY ts.updated_at DESC 
LIMIT 5;

-- 7. Test data insertion (commented out - uncomment to test)
/*
-- Test patient insertion
INSERT INTO patients (
  user_id,
  full_name,
  email,
  phone_number,
  date_of_birth,
  gender,
  address,
  is_active
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Test Patient',
  'test@example.com',
  '9876543210',
  '1990-01-01',
  'Male',
  'Test Address',
  true
);

-- Test time slot booking (requires existing doctor and available time slot)
UPDATE time_slots 
SET 
  status = 'booked',
  appointment_id = gen_random_uuid(),
  notes = 'Test appointment booking'
WHERE 
  doctor_id = (SELECT id FROM doctors LIMIT 1)
  AND schedule_date = '2024-02-01'
  AND start_time = '10:00:00'
  AND status = 'available'
LIMIT 1;
*/
