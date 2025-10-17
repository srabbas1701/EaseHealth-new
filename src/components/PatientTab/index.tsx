import React, { memo } from 'react';
import { ArrowLeft } from 'lucide-react';
import PatientHeader from './PatientHeader/PatientHeader';
import MedicalInfoSection from './MedicalInfo/MedicalInfoSection';
import DiagnosisPrescriptionForm from './DiagnosisPrescription/DiagnosisPrescriptionForm';
import { usePatientDetails } from '../../hooks/patient/usePatientDetails';
import { usePatientVitals } from '../../hooks/patient/usePatientVitals';
import { usePatientReports } from '../../hooks/patient/usePatientReports';

interface PatientTabContentProps {
  patientId: string | null;
  doctorId: string;
  onBack: () => void;
}

const PatientTabContent: React.FC<PatientTabContentProps> = memo(({ patientId, doctorId, onBack }) => {
  const { patient, isLoading: isLoadingPatient, error: patientError } = usePatientDetails(patientId);
  const { vitals, isLoading: isLoadingVitals } = usePatientVitals(patientId);
  const { reports, isLoading: isLoadingReports, uploadReport, deleteReport } = usePatientReports(patientId);

  if (!patientId) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 border border-[#E8E8E8] dark:border-gray-600 text-center">
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          Select a patient from the appointments list to view their details
        </p>
      </div>
    );
  }

  if (isLoadingPatient) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl h-48"></div>
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl h-64"></div>
            <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl h-64"></div>
            <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl h-64"></div>
          </div>
          <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl h-96"></div>
        </div>
      </div>
    );
  }

  if (patientError || !patient) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 border border-red-300 dark:border-red-700 text-center">
        <p className="text-red-600 dark:text-red-400 text-lg mb-4">
          {patientError || 'Patient not found'}
        </p>
        <button
          onClick={onBack}
          className="inline-flex items-center px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Appointments
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center text-[#0075A2] dark:text-[#0EA5E9] hover:text-[#0A2647] dark:hover:text-gray-100 transition-colors font-medium"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back to Appointments
      </button>

      {/* Patient Header with Vitals */}
      <PatientHeader
        patient={patient}
        vitals={vitals}
        isLoadingVitals={isLoadingVitals}
      />

      {/* Medical Information Cards */}
      <MedicalInfoSection
        patient={patient}
        reports={reports}
        isLoadingReports={isLoadingReports}
        onUploadReport={uploadReport}
        onDeleteReport={deleteReport}
        doctorId={doctorId}
      />

      {/* Diagnosis & Prescription Form */}
      <DiagnosisPrescriptionForm
        patientId={patient.id}
        doctorId={doctorId}
        patientName={patient.full_name}
      />
    </div>
  );
});

PatientTabContent.displayName = 'PatientTabContent';

export default PatientTabContent;
