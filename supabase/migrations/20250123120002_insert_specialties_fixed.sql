-- Insert comprehensive list of medical specialties (Fixed Version)
-- This script uses gen_random_uuid() function properly

-- First, let's make sure the specialties table exists and has the right structure
CREATE TABLE IF NOT EXISTS specialties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert specialties using gen_random_uuid() properly
INSERT INTO specialties (name, description, sort_order) VALUES
-- Primary Care & General Medicine
('Family Medicine', 'Comprehensive healthcare for all ages and genders', 1),
('Internal Medicine', 'Adult general medicine and complex medical conditions', 2),
('General Practitioner', 'Primary healthcare provider for general medical needs', 3),
('Emergency Medicine', 'Emergency and urgent care specialist', 4),

-- Surgical Specialties
('General Surgery', 'General surgical procedures and operations', 5),
('Cardiothoracic Surgery', 'Heart and chest surgery specialist', 6),
('Neurosurgery', 'Brain and spinal cord surgery specialist', 7),
('Orthopedic Surgery', 'Bones, joints, and musculoskeletal surgery specialist', 8),
('Plastic Surgery', 'Cosmetic and reconstructive surgery specialist', 9),
('Urological Surgery', 'Urinary system and male reproductive surgery specialist', 10),
('Vascular Surgery', 'Blood vessel surgery specialist', 11),
('Pediatric Surgery', 'Surgery for infants and children', 12),
('Gynecological Surgery', 'Women''s reproductive system surgery specialist', 13),

-- Medical Specialties - Adult
('Cardiology', 'Heart and cardiovascular system specialist', 14),
('Neurology', 'Brain and nervous system specialist', 15),
('Dermatology', 'Skin, hair, and nail specialist', 16),
('Gastroenterology', 'Digestive system specialist', 17),
('Pulmonology', 'Lung and respiratory system specialist', 18),
('Endocrinology', 'Hormones and endocrine system specialist', 19),
('Rheumatology', 'Joint and autoimmune disease specialist', 20),
('Nephrology', 'Kidney disease specialist', 21),
('Hepatology', 'Liver disease specialist', 22),
('Oncology', 'Cancer treatment specialist', 23),
('Hematology', 'Blood and blood disorder specialist', 24),
('Infectious Disease', 'Infectious disease specialist', 25),
('Allergy & Immunology', 'Allergy and immune system specialist', 26),

-- Mental Health
('Psychiatry', 'Mental health and psychiatric specialist', 27),
('Psychology', 'Mental health counseling specialist', 28),
('Addiction Medicine', 'Substance abuse and addiction specialist', 29),

-- Women's Health
('Gynecology', 'Women''s health and reproductive system specialist', 30),
('Obstetrics', 'Pregnancy and childbirth specialist', 31),
('Obstetrics & Gynecology', 'Women''s health, pregnancy, and reproductive specialist', 32),
('Reproductive Endocrinology', 'Fertility and reproductive hormone specialist', 33),

-- Children's Health
('Pediatrics', 'Children''s health specialist (birth to 18 years)', 34),
('Neonatology', 'Newborn and premature baby specialist', 35),
('Pediatric Cardiology', 'Children''s heart specialist', 36),
('Pediatric Neurology', 'Children''s brain and nervous system specialist', 37),
('Pediatric Oncology', 'Children''s cancer specialist', 38),

-- Eye, Ear, Nose, Throat
('Ophthalmology', 'Eye and vision specialist', 39),
('Otolaryngology (ENT)', 'Ear, nose, and throat specialist', 40),
('Audiology', 'Hearing and balance specialist', 41),

-- Diagnostic & Imaging
('Radiology', 'Medical imaging and diagnostic specialist', 42),
('Pathology', 'Disease diagnosis through laboratory analysis', 43),
('Nuclear Medicine', 'Radioactive imaging and treatment specialist', 44),

-- Pain & Rehabilitation
('Anesthesiology', 'Pain management and anesthesia specialist', 45),
('Physical Medicine & Rehabilitation', 'Physical therapy and rehabilitation specialist', 46),
('Pain Management', 'Chronic pain treatment specialist', 47),

-- Sports & Physical Health
('Sports Medicine', 'Sports injury and athletic health specialist', 48),
('Physiotherapy', 'Physical therapy and movement specialist', 49),
('Occupational Therapy', 'Daily living skills and workplace health specialist', 50),

-- Dental & Oral Health
('Dentistry', 'Oral and dental health specialist', 51),
('Oral Surgery', 'Dental and oral surgery specialist', 52),
('Orthodontics', 'Teeth alignment and bite correction specialist', 53),
('Periodontics', 'Gum disease specialist', 54),
('Endodontics', 'Root canal specialist', 55),

-- Nutrition & Lifestyle
('Nutrition & Dietetics', 'Diet and nutrition specialist', 56),
('Bariatric Medicine', 'Weight management and obesity treatment specialist', 57),

-- Geriatric & Age-Related
('Geriatrics', 'Elderly health and aging specialist', 58),
('Palliative Care', 'End-of-life and comfort care specialist', 59),

-- Specialized Medicine
('Tropical Medicine', 'Tropical and travel-related disease specialist', 60),
('Aviation Medicine', 'Pilot and aviation health specialist', 61),
('Occupational Medicine', 'Workplace health and safety specialist', 62),
('Forensic Medicine', 'Medical legal and autopsy specialist', 63),

-- Alternative & Complementary
('Homeopathy', 'Homeopathic medicine specialist', 64),
('Ayurveda', 'Traditional Indian medicine specialist', 65),
('Naturopathy', 'Natural and alternative medicine specialist', 66),
('Acupuncture', 'Traditional Chinese medicine specialist', 67),

-- Advanced Subspecialties
('Interventional Cardiology', 'Heart procedure specialist', 68),
('Interventional Radiology', 'Image-guided procedure specialist', 69),
('Critical Care Medicine', 'Intensive care specialist', 70),
('Sleep Medicine', 'Sleep disorder specialist', 71),
('Travel Medicine', 'Travel health and vaccination specialist', 72),
('Adolescent Medicine', 'Teenage health specialist', 73),
('Developmental Pediatrics', 'Child development specialist', 74),
('Pediatric Emergency Medicine', 'Children''s emergency care specialist', 75),
('Pediatric Gastroenterology', 'Children''s digestive system specialist', 76),
('Pediatric Nephrology', 'Children''s kidney specialist', 77),
('Pediatric Pulmonology', 'Children''s lung specialist', 78),
('Pediatric Rheumatology', 'Children''s joint and autoimmune specialist', 79),
('Pediatric Endocrinology', 'Children''s hormone specialist', 80),
('Pediatric Hematology', 'Children''s blood disorder specialist', 81),
('Pediatric Infectious Disease', 'Children''s infectious disease specialist', 82),
('Pediatric Allergy & Immunology', 'Children''s allergy and immune specialist', 83),
('Pediatric Dermatology', 'Children''s skin specialist', 84),
('Pediatric Ophthalmology', 'Children''s eye specialist', 85),
('Pediatric Otolaryngology', 'Children''s ear, nose, throat specialist', 86),
('Pediatric Radiology', 'Children''s medical imaging specialist', 87),
('Pediatric Anesthesiology', 'Children''s anesthesia specialist', 88),
('Pediatric Pathology', 'Children''s disease diagnosis specialist', 89),
('Pediatric Rehabilitation', 'Children''s physical therapy specialist', 90),
('Pediatric Sports Medicine', 'Children''s sports injury specialist', 91),
('Pediatric Palliative Care', 'Children''s comfort care specialist', 92),
('Pediatric Sleep Medicine', 'Children''s sleep disorder specialist', 93),
('Pediatric Genetics', 'Children''s genetic disorder specialist', 94),
('Pediatric Urology', 'Children''s urinary system specialist', 95),
('Pediatric Orthopedics', 'Children''s bone and joint specialist', 96),
('Pediatric Plastic Surgery', 'Children''s reconstructive surgery specialist', 97),
('Pediatric Neurosurgery', 'Children''s brain surgery specialist', 98),
('Pediatric Cardiothoracic Surgery', 'Children''s heart surgery specialist', 99),
('Geriatric Medicine', 'Elderly health and aging specialist', 100)

ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- Create a view for easy specialty management
CREATE OR REPLACE VIEW specialties_with_doctor_count AS
SELECT 
  s.*,
  COUNT(d.id) as doctor_count
FROM specialties s
LEFT JOIN doctors d ON d.specialty_id = s.id AND d.is_active = true
GROUP BY s.id, s.name, s.description, s.icon, s.is_active, s.sort_order, s.created_at, s.updated_at
ORDER BY s.sort_order, s.name;

-- Add some useful indexes for performance
CREATE INDEX IF NOT EXISTS idx_specialties_sort_order ON specialties(sort_order);
CREATE INDEX IF NOT EXISTS idx_specialties_active_sort ON specialties(is_active, sort_order);
