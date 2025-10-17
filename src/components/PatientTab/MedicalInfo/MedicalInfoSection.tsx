import React, { memo } from 'react';
import type { Patient, PatientReport } from '../../../types/patient';
import MedicalHistoryCard from './MedicalHistoryCard';
import CurrentMedicationsCard from './CurrentMedicationsCard';
import UploadedReportsCard from './UploadedReportsCard';

interface MedicalInfoSectionProps {
  patient: Patient;
  reports: PatientReport[];
  isLoadingReports: boolean;
  onUploadReport: (file: File, reportName: string, reportType: string, doctorId: string) => Promise<PatientReport | null>;
  onDeleteReport: (reportId: string) => Promise<boolean>;
  doctorId: string;
}

const MedicalInfoSection: React.FC<MedicalInfoSectionProps> = memo(({
  patient,
  reports,
  isLoadingReports,
  onUploadReport,
  onDeleteReport,
  doctorId,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <MedicalHistoryCard medicalHistory={patient.medical_history} />
      <CurrentMedicationsCard currentMedications={patient.current_medications} />
      <UploadedReportsCard
        reports={reports}
        isLoading={isLoadingReports}
        onUpload={onUploadReport}
        onDelete={onDeleteReport}
        doctorId={doctorId}
        patientId={patient.id}
      />
    </div>
  );
});

MedicalInfoSection.displayName = 'MedicalInfoSection';

export default MedicalInfoSection;
