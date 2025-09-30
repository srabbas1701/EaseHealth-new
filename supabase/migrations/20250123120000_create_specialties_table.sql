-- Create specialties table
CREATE TABLE IF NOT EXISTS specialties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50), -- For future UI enhancements
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_specialties_name ON specialties(name);
CREATE INDEX IF NOT EXISTS idx_specialties_active ON specialties(is_active);

-- Insert common medical specialties
INSERT INTO specialties (name, description, sort_order) VALUES
('Cardiologist', 'Heart and cardiovascular system specialist', 1),
('Neurologist', 'Brain and nervous system specialist', 2),
('Dermatologist', 'Skin, hair, and nail specialist', 3),
('Orthopedic Surgeon', 'Bones, joints, and musculoskeletal specialist', 4),
('Pediatrician', 'Children''s health specialist', 5),
('Gynecologist', 'Women''s health and reproductive system specialist', 6),
('Internal Medicine', 'Adult general medicine specialist', 7),
('Psychiatrist', 'Mental health and psychiatric specialist', 8),
('Ophthalmologist', 'Eye and vision specialist', 9),
('ENT Specialist', 'Ear, nose, and throat specialist', 10),
('Urologist', 'Urinary system and male reproductive health specialist', 11),
('Gastroenterologist', 'Digestive system specialist', 12),
('Pulmonologist', 'Lung and respiratory system specialist', 13),
('Endocrinologist', 'Hormones and endocrine system specialist', 14),
('Oncologist', 'Cancer treatment specialist', 15),
('Radiologist', 'Medical imaging and diagnostic specialist', 16),
('Anesthesiologist', 'Pain management and anesthesia specialist', 17),
('Emergency Medicine', 'Emergency and urgent care specialist', 18),
('Family Medicine', 'Comprehensive family healthcare specialist', 19),
('General Surgeon', 'General surgical procedures specialist', 20),
('Dentist', 'Oral and dental health specialist', 21),
('Physiotherapist', 'Physical therapy and rehabilitation specialist', 22),
('Nutritionist', 'Diet and nutrition specialist', 23),
('Psychologist', 'Mental health counseling specialist', 24),
('Pathologist', 'Disease diagnosis through laboratory analysis', 25)
ON CONFLICT (name) DO NOTHING;

-- Update doctors table to reference specialties
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS specialty_id UUID REFERENCES specialties(id);

-- Create index for doctors specialty lookup
CREATE INDEX IF NOT EXISTS idx_doctors_specialty_id ON doctors(specialty_id);

-- Update existing doctors to link with specialties (if any exist)
-- This will match doctors by specialty name and link them to the specialty table
UPDATE doctors 
SET specialty_id = s.id 
FROM specialties s 
WHERE doctors.specialty = s.name 
AND doctors.specialty_id IS NULL;

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for specialties table
DROP TRIGGER IF EXISTS update_specialties_updated_at ON specialties;
CREATE TRIGGER update_specialties_updated_at 
    BEFORE UPDATE ON specialties 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for doctors table (if not exists)
DROP TRIGGER IF EXISTS update_doctors_updated_at ON doctors;
CREATE TRIGGER update_doctors_updated_at 
    BEFORE UPDATE ON doctors 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

