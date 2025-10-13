-- Insert comprehensive medical specialties with explicit UUIDs
-- This script provides explicit UUID values to avoid the null constraint error

INSERT INTO specialties (id, name, description, sort_order) VALUES
-- Primary Care & General Medicine
('00000001-0000-4000-8000-000000000001', 'Family Medicine', 'Comprehensive healthcare for all ages and genders', 1),
('00000001-0000-4000-8000-000000000002', 'Internal Medicine', 'Adult general medicine and complex medical conditions', 2),
('00000001-0000-4000-8000-000000000003', 'General Practitioner', 'Primary healthcare provider for general medical needs', 3),
('00000001-0000-4000-8000-000000000004', 'Emergency Medicine', 'Emergency and urgent care specialist', 4),

-- Surgical Specialties
('00000001-0000-4000-8000-000000000005', 'General Surgery', 'General surgical procedures and operations', 5),
('00000001-0000-4000-8000-000000000006', 'Cardiothoracic Surgery', 'Heart and chest surgery specialist', 6),
('00000001-0000-4000-8000-000000000007', 'Neurosurgery', 'Brain and spinal cord surgery specialist', 7),
('00000001-0000-4000-8000-000000000008', 'Orthopedic Surgery', 'Bones, joints, and musculoskeletal surgery specialist', 8),
('00000001-0000-4000-8000-000000000009', 'Plastic Surgery', 'Cosmetic and reconstructive surgery specialist', 9),
('00000001-0000-4000-8000-000000000010', 'Urological Surgery', 'Urinary system and male reproductive surgery specialist', 10),
('00000001-0000-4000-8000-000000000011', 'Vascular Surgery', 'Blood vessel surgery specialist', 11),
('00000001-0000-4000-8000-000000000012', 'Pediatric Surgery', 'Surgery for infants and children', 12),
('00000001-0000-4000-8000-000000000013', 'Gynecological Surgery', 'Women''s reproductive system surgery specialist', 13),

-- Medical Specialties - Adult
('00000001-0000-4000-8000-000000000014', 'Cardiology', 'Heart and cardiovascular system specialist', 14),
('00000001-0000-4000-8000-000000000015', 'Neurology', 'Brain and nervous system specialist', 15),
('00000001-0000-4000-8000-000000000016', 'Dermatology', 'Skin, hair, and nail specialist', 16),
('00000001-0000-4000-8000-000000000017', 'Gastroenterology', 'Digestive system specialist', 17),
('00000001-0000-4000-8000-000000000018', 'Pulmonology', 'Lung and respiratory system specialist', 18),
('00000001-0000-4000-8000-000000000019', 'Endocrinology', 'Hormones and endocrine system specialist', 19),
('00000001-0000-4000-8000-000000000020', 'Rheumatology', 'Joint and autoimmune disease specialist', 20),
('00000001-0000-4000-8000-000000000021', 'Nephrology', 'Kidney disease specialist', 21),
('00000001-0000-4000-8000-000000000022', 'Hepatology', 'Liver disease specialist', 22),
('00000001-0000-4000-8000-000000000023', 'Oncology', 'Cancer treatment specialist', 23),
('00000001-0000-4000-8000-000000000024', 'Hematology', 'Blood and blood disorder specialist', 24),
('00000001-0000-4000-8000-000000000025', 'Infectious Disease', 'Infectious disease specialist', 25),
('00000001-0000-4000-8000-000000000026', 'Allergy & Immunology', 'Allergy and immune system specialist', 26),

-- Mental Health
('00000001-0000-4000-8000-000000000027', 'Psychiatry', 'Mental health and psychiatric specialist', 27),
('00000001-0000-4000-8000-000000000028', 'Psychology', 'Mental health counseling specialist', 28),
('00000001-0000-4000-8000-000000000029', 'Addiction Medicine', 'Substance abuse and addiction specialist', 29),

-- Women's Health
('00000001-0000-4000-8000-000000000030', 'Gynecology', 'Women''s health and reproductive system specialist', 30),
('00000001-0000-4000-8000-000000000031', 'Obstetrics', 'Pregnancy and childbirth specialist', 31),
('00000001-0000-4000-8000-000000000032', 'Obstetrics & Gynecology', 'Women''s health, pregnancy, and reproductive specialist', 32),
('00000001-0000-4000-8000-000000000033', 'Reproductive Endocrinology', 'Fertility and reproductive hormone specialist', 33),

-- Children's Health
('00000001-0000-4000-8000-000000000034', 'Pediatrics', 'Children''s health specialist (birth to 18 years)', 34),
('00000001-0000-4000-8000-000000000035', 'Neonatology', 'Newborn and premature baby specialist', 35),
('00000001-0000-4000-8000-000000000036', 'Pediatric Cardiology', 'Children''s heart specialist', 36),
('00000001-0000-4000-8000-000000000037', 'Pediatric Neurology', 'Children''s brain and nervous system specialist', 37),
('00000001-0000-4000-8000-000000000038', 'Pediatric Oncology', 'Children''s cancer specialist', 38),

-- Eye, Ear, Nose, Throat
('00000001-0000-4000-8000-000000000039', 'Ophthalmology', 'Eye and vision specialist', 39),
('00000001-0000-4000-8000-000000000040', 'Otolaryngology (ENT)', 'Ear, nose, and throat specialist', 40),
('00000001-0000-4000-8000-000000000041', 'Audiology', 'Hearing and balance specialist', 41),

-- Diagnostic & Imaging
('00000001-0000-4000-8000-000000000042', 'Radiology', 'Medical imaging and diagnostic specialist', 42),
('00000001-0000-4000-8000-000000000043', 'Pathology', 'Disease diagnosis through laboratory analysis', 43),
('00000001-0000-4000-8000-000000000044', 'Nuclear Medicine', 'Radioactive imaging and treatment specialist', 44),

-- Pain & Rehabilitation
('00000001-0000-4000-8000-000000000045', 'Anesthesiology', 'Pain management and anesthesia specialist', 45),
('00000001-0000-4000-8000-000000000046', 'Physical Medicine & Rehabilitation', 'Physical therapy and rehabilitation specialist', 46),
('00000001-0000-4000-8000-000000000047', 'Pain Management', 'Chronic pain treatment specialist', 47),

-- Sports & Physical Health
('00000001-0000-4000-8000-000000000048', 'Sports Medicine', 'Sports injury and athletic health specialist', 48),
('00000001-0000-4000-8000-000000000049', 'Physiotherapy', 'Physical therapy and movement specialist', 49),
('00000001-0000-4000-8000-000000000050', 'Occupational Therapy', 'Daily living skills and workplace health specialist', 50),

-- Dental & Oral Health
('00000001-0000-4000-8000-000000000051', 'Dentistry', 'Oral and dental health specialist', 51),
('00000001-0000-4000-8000-000000000052', 'Oral Surgery', 'Dental and oral surgery specialist', 52),
('00000001-0000-4000-8000-000000000053', 'Orthodontics', 'Teeth alignment and bite correction specialist', 53),
('00000001-0000-4000-8000-000000000054', 'Periodontics', 'Gum disease specialist', 54),
('00000001-0000-4000-8000-000000000055', 'Endodontics', 'Root canal specialist', 55),

-- Nutrition & Lifestyle
('00000001-0000-4000-8000-000000000056', 'Nutrition & Dietetics', 'Diet and nutrition specialist', 56),
('00000001-0000-4000-8000-000000000057', 'Bariatric Medicine', 'Weight management and obesity treatment specialist', 57),

-- Geriatric & Age-Related
('00000001-0000-4000-8000-000000000058', 'Geriatrics', 'Elderly health and aging specialist', 58),
('00000001-0000-4000-8000-000000000059', 'Palliative Care', 'End-of-life and comfort care specialist', 59),

-- Specialized Medicine
('00000001-0000-4000-8000-000000000060', 'Tropical Medicine', 'Tropical and travel-related disease specialist', 60),
('00000001-0000-4000-8000-000000000061', 'Aviation Medicine', 'Pilot and aviation health specialist', 61),
('00000001-0000-4000-8000-000000000062', 'Occupational Medicine', 'Workplace health and safety specialist', 62),
('00000001-0000-4000-8000-000000000063', 'Forensic Medicine', 'Medical legal and autopsy specialist', 63),

-- Alternative & Complementary
('00000001-0000-4000-8000-000000000064', 'Homeopathy', 'Homeopathic medicine specialist', 64),
('00000001-0000-4000-8000-000000000065', 'Ayurveda', 'Traditional Indian medicine specialist', 65),
('00000001-0000-4000-8000-000000000066', 'Naturopathy', 'Natural and alternative medicine specialist', 66),
('00000001-0000-4000-8000-000000000067', 'Acupuncture', 'Traditional Chinese medicine specialist', 67),

-- Advanced Subspecialties
('00000001-0000-4000-8000-000000000068', 'Interventional Cardiology', 'Heart procedure specialist', 68),
('00000001-0000-4000-8000-000000000069', 'Interventional Radiology', 'Image-guided procedure specialist', 69),
('00000001-0000-4000-8000-000000000070', 'Critical Care Medicine', 'Intensive care specialist', 70),
('00000001-0000-4000-8000-000000000071', 'Sleep Medicine', 'Sleep disorder specialist', 71),
('00000001-0000-4000-8000-000000000072', 'Travel Medicine', 'Travel health and vaccination specialist', 72),
('00000001-0000-4000-8000-000000000073', 'Adolescent Medicine', 'Teenage health specialist', 73),
('00000001-0000-4000-8000-000000000074', 'Developmental Pediatrics', 'Child development specialist', 74),
('00000001-0000-4000-8000-000000000075', 'Pediatric Emergency Medicine', 'Children''s emergency care specialist', 75),
('00000001-0000-4000-8000-000000000076', 'Pediatric Gastroenterology', 'Children''s digestive system specialist', 76),
('00000001-0000-4000-8000-000000000077', 'Pediatric Nephrology', 'Children''s kidney specialist', 77),
('00000001-0000-4000-8000-000000000078', 'Pediatric Pulmonology', 'Children''s lung specialist', 78),
('00000001-0000-4000-8000-000000000079', 'Pediatric Rheumatology', 'Children''s joint and autoimmune specialist', 79),
('00000001-0000-4000-8000-000000000080', 'Pediatric Endocrinology', 'Children''s hormone specialist', 80),
('00000001-0000-4000-8000-000000000081', 'Pediatric Hematology', 'Children''s blood disorder specialist', 81),
('00000001-0000-4000-8000-000000000082', 'Pediatric Infectious Disease', 'Children''s infectious disease specialist', 82),
('00000001-0000-4000-8000-000000000083', 'Pediatric Allergy & Immunology', 'Children''s allergy and immune specialist', 83),
('00000001-0000-4000-8000-000000000084', 'Pediatric Dermatology', 'Children''s skin specialist', 84),
('00000001-0000-4000-8000-000000000085', 'Pediatric Ophthalmology', 'Children''s eye specialist', 85),
('00000001-0000-4000-8000-000000000086', 'Pediatric Otolaryngology', 'Children''s ear, nose, throat specialist', 86),
('00000001-0000-4000-8000-000000000087', 'Pediatric Radiology', 'Children''s medical imaging specialist', 87),
('00000001-0000-4000-8000-000000000088', 'Pediatric Anesthesiology', 'Children''s anesthesia specialist', 88),
('00000001-0000-4000-8000-000000000089', 'Pediatric Pathology', 'Children''s disease diagnosis specialist', 89),
('00000001-0000-4000-8000-000000000090', 'Pediatric Rehabilitation', 'Children''s physical therapy specialist', 90),
('00000001-0000-4000-8000-000000000091', 'Pediatric Sports Medicine', 'Children''s sports injury specialist', 91),
('00000001-0000-4000-8000-000000000092', 'Pediatric Palliative Care', 'Children''s comfort care specialist', 92),
('00000001-0000-4000-8000-000000000093', 'Pediatric Sleep Medicine', 'Children''s sleep disorder specialist', 93),
('00000001-0000-4000-8000-000000000094', 'Pediatric Genetics', 'Children''s genetic disorder specialist', 94),
('00000001-0000-4000-8000-000000000095', 'Pediatric Urology', 'Children''s urinary system specialist', 95),
('00000001-0000-4000-8000-000000000096', 'Pediatric Orthopedics', 'Children''s bone and joint specialist', 96),
('00000001-0000-4000-8000-000000000097', 'Pediatric Plastic Surgery', 'Children''s reconstructive surgery specialist', 97),
('00000001-0000-4000-8000-000000000098', 'Pediatric Neurosurgery', 'Children''s brain surgery specialist', 98),
('00000001-0000-4000-8000-000000000099', 'Pediatric Cardiothoracic Surgery', 'Children''s heart surgery specialist', 99),
('00000001-0000-4000-8000-000000000100', 'Geriatric Medicine', 'Elderly health and aging specialist', 100)

ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- Verify the insert
SELECT COUNT(*) as total_specialties FROM specialties;
SELECT name, description, sort_order FROM specialties ORDER BY sort_order LIMIT 10;

