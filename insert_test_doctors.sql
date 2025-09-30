-- Insert test doctors with proper specialty references
-- This script adds mock doctors that reference the specialties we just created

-- First, let's insert some test doctors with specialty_id references
INSERT INTO doctors (
  id, 
  full_name, 
  email, 
  phone_number, 
  specialty, 
  specialty_id,
  license_number, 
  experience_years, 
  qualification, 
  consultation_fee,
  is_verified, 
  is_active
) VALUES
-- Cardiologists
('00000002-0000-4000-8000-000000000001', 'Dr. Anjali Sharma', 'anjali.sharma@example.com', '+91-98765-43210', 'Cardiology', '00000001-0000-4000-8000-000000000014', 'CARD001', 15, 'MD Cardiology, MBBS', 800, true, true),
('00000002-0000-4000-8000-000000000002', 'Dr. Rajesh Kumar', 'rajesh.kumar@example.com', '+91-98765-43211', 'Cardiology', '00000001-0000-4000-8000-000000000014', 'CARD002', 12, 'MD Cardiology, MBBS', 750, true, true),

-- Neurologists  
('00000002-0000-4000-8000-000000000003', 'Dr. Priya Singh', 'priya.singh@example.com', '+91-98765-43212', 'Neurology', '00000001-0000-4000-8000-000000000015', 'NEURO001', 10, 'MD Neurology, MBBS', 900, true, true),
('00000002-0000-4000-8000-000000000004', 'Dr. Amit Patel', 'amit.patel@example.com', '+91-98765-43213', 'Neurology', '00000001-0000-4000-8000-000000000015', 'NEURO002', 8, 'MD Neurology, MBBS', 850, true, true),

-- Dermatologists
('00000002-0000-4000-8000-000000000005', 'Dr. Sunita Reddy', 'sunita.reddy@example.com', '+91-98765-43214', 'Dermatology', '00000001-0000-4000-8000-000000000016', 'DERM001', 6, 'MD Dermatology, MBBS', 600, true, true),

-- Pediatricians
('00000002-0000-4000-8000-000000000006', 'Dr. Vikram Malhotra', 'vikram.malhotra@example.com', '+91-98765-43215', 'Pediatrics', '00000001-0000-4000-8000-000000000034', 'PED001', 14, 'MD Pediatrics, MBBS', 700, true, true),
('00000002-0000-4000-8000-000000000007', 'Dr. Sneha Gupta', 'sneha.gupta@example.com', '+91-98765-43216', 'Pediatrics', '00000001-0000-4000-8000-000000000034', 'PED002', 11, 'MD Pediatrics, MBBS', 650, true, true),

-- Gynecologists
('00000002-0000-4000-8000-000000000008', 'Dr. Meera Joshi', 'meera.joshi@example.com', '+91-98765-43217', 'Gynecology', '00000001-0000-4000-8000-000000000030', 'GYN001', 9, 'MD Gynecology, MBBS', 800, true, true),

-- Orthopedic Surgeons
('00000002-0000-4000-8000-000000000009', 'Dr. Arjun Singh', 'arjun.singh@example.com', '+91-98765-43218', 'Orthopedic Surgery', '00000001-0000-4000-8000-000000000008', 'ORTHO001', 16, 'MS Orthopedics, MBBS', 1200, true, true),

-- Psychiatrists
('00000002-0000-4000-8000-000000000010', 'Dr. Kavita Sharma', 'kavita.sharma@example.com', '+91-98765-43219', 'Psychiatry', '00000001-0000-4000-8000-000000000027', 'PSYCH001', 7, 'MD Psychiatry, MBBS', 1000, true, true)

ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  specialty_id = EXCLUDED.specialty_id,
  consultation_fee = EXCLUDED.consultation_fee,
  updated_at = NOW();

-- Verify the doctors were inserted
SELECT 
  d.full_name,
  d.specialty,
  s.name as specialty_name,
  d.consultation_fee
FROM doctors d
LEFT JOIN specialties s ON d.specialty_id = s.id
WHERE d.is_active = true
ORDER BY d.full_name;

