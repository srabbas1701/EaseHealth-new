-- Verify the specialty system is working correctly

-- 1. Check specialties count
SELECT 'Specialties Count' as check_type, COUNT(*) as count FROM specialties WHERE is_active = true;

-- 2. Check doctors count
SELECT 'Doctors Count' as check_type, COUNT(*) as count FROM doctors WHERE is_active = true;

-- 3. Check doctors with specialty references
SELECT 'Doctors with Specialty ID' as check_type, COUNT(*) as count 
FROM doctors d 
WHERE d.is_active = true AND d.specialty_id IS NOT NULL;

-- 4. Show sample specialties with doctor counts
SELECT 
  s.name as specialty_name,
  s.description,
  COUNT(d.id) as doctor_count
FROM specialties s
LEFT JOIN doctors d ON d.specialty_id = s.id AND d.is_active = true
GROUP BY s.id, s.name, s.description
HAVING COUNT(d.id) > 0
ORDER BY doctor_count DESC, s.name
LIMIT 10;

-- 5. Show all specialties (first 10)
SELECT 
  s.name,
  s.description,
  s.sort_order
FROM specialties s
WHERE s.is_active = true
ORDER BY s.sort_order
LIMIT 10;

