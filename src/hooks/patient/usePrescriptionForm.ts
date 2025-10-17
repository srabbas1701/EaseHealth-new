import { useState, useCallback } from 'react';
import { supabase } from '../../utils/supabase';
import type { PrescriptionFormData, MedicationRow, Consultation, Prescription } from '../../types/patient';

const generateId = () => `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`;

const initialMedicationRow = (): MedicationRow => ({
  id: generateId(),
  medicine_name: '',
  dosage: '',
  frequency: '',
  duration: '',
  instructions: '',
});

interface UsePrescriptionFormResult {
  formData: PrescriptionFormData;
  setFormData: React.Dispatch<React.SetStateAction<PrescriptionFormData>>;
  updateField: (field: keyof Omit<PrescriptionFormData, 'medications'>, value: string) => void;
  addMedicationRow: () => void;
  removeMedicationRow: (id: string) => void;
  updateMedication: (id: string, field: keyof MedicationRow, value: string) => void;
  resetForm: () => void;
  savePrescription: (patientId: string, doctorId: string, appointmentId?: string) => Promise<{ success: boolean; consultationId?: string; error?: string }>;
  isSaving: boolean;
}

const initialFormData: PrescriptionFormData = {
  chief_complaint: '',
  diagnosis: '',
  clinical_notes: '',
  follow_up_date: '',
  additional_instructions: '',
  medications: [initialMedicationRow(), initialMedicationRow(), initialMedicationRow()],
};

export function usePrescriptionForm(): UsePrescriptionFormResult {
  const [formData, setFormData] = useState<PrescriptionFormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);

  const updateField = useCallback((field: keyof Omit<PrescriptionFormData, 'medications'>, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const addMedicationRow = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      medications: [...prev.medications, initialMedicationRow()],
    }));
  }, []);

  const removeMedicationRow = useCallback((id: string) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.filter(med => med.id !== id),
    }));
  }, []);

  const updateMedication = useCallback((id: string, field: keyof MedicationRow, value: string) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.map(med =>
        med.id === id ? { ...med, [field]: value } : med
      ),
    }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
  }, []);

  const savePrescription = useCallback(async (
    patientId: string,
    doctorId: string,
    appointmentId?: string
  ): Promise<{ success: boolean; consultationId?: string; error?: string }> => {
    setIsSaving(true);

    try {
      if (!formData.chief_complaint.trim()) {
        throw new Error('Chief complaint is required');
      }
      if (!formData.diagnosis.trim()) {
        throw new Error('Diagnosis is required');
      }

      const validMedications = formData.medications.filter(
        med => med.medicine_name.trim() && med.dosage.trim() && med.frequency.trim() && med.duration.trim()
      );

      if (validMedications.length === 0) {
        throw new Error('At least one valid medication is required');
      }

      const { data: consultation, error: consultationError } = await supabase
        .from('consultations')
        .insert({
          patient_id: patientId,
          doctor_id: doctorId,
          appointment_id: appointmentId,
          chief_complaint: formData.chief_complaint,
          diagnosis: formData.diagnosis,
          clinical_notes: formData.clinical_notes || null,
          follow_up_date: formData.follow_up_date || null,
          additional_instructions: formData.additional_instructions || null,
          status: 'completed',
          consultation_type: 'in_person',
        })
        .select()
        .single();

      if (consultationError) throw consultationError;

      const consultationData = consultation as Consultation;

      const { data: prescription, error: prescriptionError } = await supabase
        .from('prescriptions')
        .insert({
          consultation_id: consultationData.id,
          patient_id: patientId,
          doctor_id: doctorId,
          status: 'active',
        })
        .select()
        .single();

      if (prescriptionError) throw prescriptionError;

      const prescriptionData = prescription as Prescription;

      const prescriptionItems = validMedications.map((med, index) => ({
        prescription_id: prescriptionData.id,
        medicine_name: med.medicine_name,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
        instructions: med.instructions || null,
        route: 'oral',
        item_order: index,
      }));

      const { error: itemsError } = await supabase
        .from('prescription_items')
        .insert(prescriptionItems);

      if (itemsError) throw itemsError;

      if (formData.follow_up_date) {
        const followUpDate = new Date(formData.follow_up_date);
        const followUpTime = '10:00:00';

        await supabase.from('appointments').insert({
          patient_id: patientId,
          doctor_id: doctorId,
          schedule_date: formData.follow_up_date,
          start_time: followUpTime,
          end_time: '10:30:00',
          duration_minutes: 30,
          status: 'booked',
          notes: 'Follow-up appointment',
        });
      }

      await supabase
        .from('patients')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', patientId);

      return { success: true, consultationId: consultationData.id };
    } catch (err) {
      console.error('Error saving prescription:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to save prescription',
      };
    } finally {
      setIsSaving(false);
    }
  }, [formData]);

  return {
    formData,
    setFormData,
    updateField,
    addMedicationRow,
    removeMedicationRow,
    updateMedication,
    resetForm,
    savePrescription,
    isSaving,
  };
}
