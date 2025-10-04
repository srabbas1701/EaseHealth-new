-- Check if appointments are being saved
-- This script helps verify that the booking system is working

-- 1. Check if appointments table exists and has data
SELECT 
  'Total Appointments' as metric,
  COUNT(*) as count 
FROM appointments;

-- 2. Show recent appointments (last 10)
SELECT 
  a.id,
  a.schedule_date,
  a.start_time,
  a.end_time,
  a.status,
  d.full_name as doctor_name,
  d.specialty,
  a.created_at
FROM appointments a
JOIN doctors d ON d.id = a.doctor_id
ORDER BY a.created_at DESC
LIMIT 10;

-- 3. Show appointments by status
SELECT 
  status,
  COUNT(*) as count
FROM appointments
GROUP BY status
ORDER BY count DESC;

-- 4. Show appointments by doctor
SELECT 
  d.full_name as doctor_name,
  d.specialty,
  COUNT(a.id) as appointment_count
FROM doctors d
LEFT JOIN appointments a ON a.doctor_id = d.id
GROUP BY d.id, d.full_name, d.specialty
ORDER BY appointment_count DESC;

-- 5. Show appointments by date (today and future)
SELECT 
  schedule_date,
  COUNT(*) as appointments_today
FROM appointments
WHERE schedule_date >= CURRENT_DATE
GROUP BY schedule_date
ORDER BY schedule_date
LIMIT 7;