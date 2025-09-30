-- Simplified specialties - just the essential ones for better UX
-- Clear existing specialties and add a focused list

-- Clear existing data
DELETE FROM specialties;

-- Insert only essential specialties (20 most common ones)
INSERT INTO specialties (id, name, description, sort_order) VALUES
-- Primary Care
('00000001-0000-4000-8000-000000000001', 'General Medicine', 'General health and primary care', 1),
('00000001-0000-4000-8000-000000000002', 'Family Medicine', 'Healthcare for all family members', 2),
('00000001-0000-4000-8000-000000000003', 'Internal Medicine', 'Adult general medicine', 3),

-- Common Specialties
('00000001-0000-4000-8000-000000000004', 'Cardiology', 'Heart and cardiovascular specialist', 4),
('00000001-0000-4000-8000-000000000005', 'Neurology', 'Brain and nervous system specialist', 5),
('00000001-0000-4000-8000-000000000006', 'Dermatology', 'Skin, hair, and nail specialist', 6),
('00000001-0000-4000-8000-000000000007', 'Orthopedics', 'Bones, joints, and musculoskeletal specialist', 7),
('00000001-0000-4000-8000-000000000008', 'Pediatrics', 'Children health specialist', 8),
('00000001-0000-4000-8000-000000000009', 'Gynecology', 'Women health specialist', 9),
('00000001-0000-4000-8000-000000000010', 'Psychiatry', 'Mental health specialist', 10),

-- Surgery
('00000001-0000-4000-8000-000000000011', 'General Surgery', 'General surgical procedures', 11),
('00000001-0000-4000-8000-000000000012', 'Orthopedic Surgery', 'Bone and joint surgery', 12),

-- Eye & ENT
('00000001-0000-4000-8000-000000000013', 'Ophthalmology', 'Eye and vision specialist', 13),
('00000001-0000-4000-8000-000000000014', 'ENT', 'Ear, nose, and throat specialist', 14),

-- Other Common
('00000001-0000-4000-8000-000000000015', 'Urology', 'Urinary system specialist', 15),
('00000001-0000-4000-8000-000000000016', 'Gastroenterology', 'Digestive system specialist', 16),
('00000001-0000-4000-8000-000000000017', 'Pulmonology', 'Lung specialist', 17),
('00000001-0000-4000-8000-000000000018', 'Endocrinology', 'Hormone specialist', 18),
('00000001-0000-4000-8000-000000000019', 'Oncology', 'Cancer specialist', 19),
('00000001-0000-4000-8000-000000000020', 'Emergency Medicine', 'Emergency care specialist', 20);

-- Verify
SELECT COUNT(*) as total_specialties FROM specialties;
SELECT name FROM specialties ORDER BY sort_order;

