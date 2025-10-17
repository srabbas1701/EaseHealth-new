export interface Patient {
  id: string;
  user_id?: string;
  full_name: string;
  email: string;
  phone_number: string;
  date_of_birth?: string;
  age?: number;
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  address?: string;
  city?: string;
  state?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_history?: string;
  allergies?: string;
  current_medications?: string;
  insurance_provider?: string;
  insurance_number?: string;
  blood_type?: string;
  profile_image_url?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PatientVitals {
  id: string;
  patient_id: string;
  blood_pressure?: string;
  heart_rate?: number;
  temperature?: number;
  weight?: number;
  bmi?: number;
  spo2?: number;
  respiratory_rate?: number;
  recorded_by?: string;
  recorded_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PatientReport {
  id: string;
  patient_id: string;
  report_name: string;
  report_type: 'lab_report' | 'imaging' | 'prescription' | 'medical_certificate' | 'referral' | 'general';
  file_url: string;
  file_size?: number;
  file_type?: string;
  uploaded_by?: string;
  upload_date: string;
  description?: string;
  is_deleted?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Consultation {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_id?: string;
  chief_complaint: string;
  diagnosis: string;
  clinical_notes?: string;
  consultation_date: string;
  follow_up_date?: string;
  additional_instructions?: string;
  status: 'active' | 'completed' | 'cancelled';
  consultation_type: 'in_person' | 'video' | 'audio' | 'emergency';
  created_at: string;
  updated_at: string;
}

export interface Prescription {
  id: string;
  consultation_id: string;
  patient_id: string;
  doctor_id: string;
  prescription_date: string;
  status: 'active' | 'completed' | 'cancelled' | 'expired';
  valid_until?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PrescriptionItem {
  id: string;
  prescription_id: string;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  quantity?: number;
  route: 'oral' | 'topical' | 'injection' | 'inhalation' | 'sublingual' | 'other';
  item_order: number;
  created_at: string;
}

export interface PrescriptionFormData {
  chief_complaint: string;
  diagnosis: string;
  clinical_notes: string;
  follow_up_date: string;
  additional_instructions: string;
  medications: MedicationRow[];
}

export interface MedicationRow {
  id: string;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface PatientDetailData {
  patient: Patient;
  vitals: PatientVitals | null;
  reports: PatientReport[];
  consultationHistory: Consultation[];
  activeMedications: string[];
}
