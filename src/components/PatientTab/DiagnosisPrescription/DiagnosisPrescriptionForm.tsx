import React, { memo, useState } from 'react';
import { FileText, Save, Printer, Bot, CheckCircle, AlertCircle } from 'lucide-react';
import { usePrescriptionForm } from '../../../hooks/patient/usePrescriptionForm';
import PrescriptionTable from './PrescriptionTable';
import PrescriptionActions from './PrescriptionActions';
import PrintPrescription from '../Print/PrintPrescription';

interface DiagnosisPrescriptionFormProps {
  patientId: string;
  doctorId: string;
  patientName: string;
}

const DiagnosisPrescriptionForm: React.FC<DiagnosisPrescriptionFormProps> = memo(({
  patientId,
  doctorId,
  patientName,
}) => {
  const {
    formData,
    updateField,
    addMedicationRow,
    removeMedicationRow,
    updateMedication,
    resetForm,
    savePrescription,
    isSaving,
  } = usePrescriptionForm();

  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [savedConsultationId, setSavedConsultationId] = useState<string | null>(null);

  const handleSave = async () => {
    setSaveMessage(null);

    const result = await savePrescription(patientId, doctorId);

    if (result.success) {
      setSavedConsultationId(result.consultationId || null);
      setSaveMessage({
        type: 'success',
        text: 'Prescription saved successfully!',
      });
      setTimeout(() => setSaveMessage(null), 5000);
    } else {
      setSaveMessage({
        type: 'error',
        text: result.error || 'Failed to save prescription',
      });
    }
  };

  const handlePrint = () => {
    if (!formData.chief_complaint || !formData.diagnosis) {
      alert('Please fill in Chief Complaint and Diagnosis before printing');
      return;
    }
    setShowPrintModal(true);
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border-2 border-teal-500 dark:border-teal-600">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
            <FileText className="w-6 h-6 text-teal-600 dark:text-teal-400" />
          </div>
          <h3 className="text-2xl font-bold text-[#0A2647] dark:text-gray-100">
            Diagnosis & Prescription
          </h3>
        </div>

        {/* Save Success/Error Messages */}
        {saveMessage && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-start space-x-3 ${
              saveMessage.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700'
            }`}
          >
            {saveMessage.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <p
              className={
                saveMessage.type === 'success'
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-red-700 dark:text-red-300'
              }
            >
              {saveMessage.text}
            </p>
          </div>
        )}

        {/* Row 1: Chief Complaint & Diagnosis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Chief Complaint <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.chief_complaint}
              onChange={(e) => updateField('chief_complaint', e.target.value)}
              placeholder="e.g., Fever and cough for 3 days"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Diagnosis <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.diagnosis}
              onChange={(e) => updateField('diagnosis', e.target.value)}
              placeholder="e.g., Upper Respiratory Tract Infection"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        {/* Row 2: Clinical Notes */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Clinical Notes
          </label>
          <textarea
            value={formData.clinical_notes}
            onChange={(e) => updateField('clinical_notes', e.target.value)}
            placeholder="Detailed clinical observations, examination findings, and notes..."
            rows={5}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
            style={{ minHeight: '100px' }}
          />
        </div>

        {/* Prescription Table */}
        <PrescriptionTable
          medications={formData.medications}
          onAdd={addMedicationRow}
          onRemove={removeMedicationRow}
          onUpdate={updateMedication}
        />

        {/* Follow-up Date & Additional Instructions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Follow-up Date
            </label>
            <input
              type="date"
              value={formData.follow_up_date}
              onChange={(e) => updateField('follow_up_date', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Additional Instructions
            </label>
            <input
              type="text"
              value={formData.additional_instructions}
              onChange={(e) => updateField('additional_instructions', e.target.value)}
              placeholder="Diet, exercise, precautions"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-600">
          <button
            type="button"
            disabled
            className="flex items-center space-x-2 px-6 py-3 bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded-lg font-medium cursor-not-allowed"
            title="AI Analysis feature coming soon via n8n integration"
          >
            <Bot className="w-5 h-5" />
            <span>Generate AI Analysis</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center space-x-2 px-6 py-3 bg-green-600 dark:bg-green-700 text-white rounded-lg font-medium hover:bg-green-700 dark:hover:bg-green-800 hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Save Prescription</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center space-x-2 px-6 py-3 bg-teal-600 dark:bg-teal-700 text-white rounded-lg font-medium hover:bg-teal-700 dark:hover:bg-teal-800 hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
          >
            <Printer className="w-5 h-5" />
            <span>Print Prescription</span>
          </button>
        </div>
      </div>

      {showPrintModal && (
        <PrintPrescription
          formData={formData}
          patientName={patientName}
          patientId={patientId}
          doctorId={doctorId}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </>
  );
});

DiagnosisPrescriptionForm.displayName = 'DiagnosisPrescriptionForm';

export default DiagnosisPrescriptionForm;
