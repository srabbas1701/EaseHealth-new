import React, { memo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import PatientHeader from './PatientHeader/PatientHeader';
import MedicalInfoSection from './MedicalInfo/MedicalInfoSection';
import DiagnosisPrescriptionForm from './DiagnosisPrescription/DiagnosisPrescriptionForm';
import { usePatientDetails } from '../../hooks/patient/usePatientDetails';
import { usePatientVitals } from '../../hooks/patient/usePatientVitals';
import { usePatientReports } from '../../hooks/patient/usePatientReports';
import { supabase } from '../../utils/supabase';

interface PatientTabContentProps {
  patientId: string | null;
  doctorId: string;
  onBack: () => void;
}

const PatientTabContent: React.FC<PatientTabContentProps> = memo(({ patientId, doctorId, onBack }) => {
  const { patient, isLoading: isLoadingPatient, error: patientError } = usePatientDetails(patientId);
  const { vitals, isLoading: isLoadingVitals } = usePatientVitals(patientId);
  const { reports, isLoading: isLoadingReports, uploadReport, deleteReport, markReviewed, lockReports, refetch: refetchReports } = usePatientReports(patientId);
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

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
        onDeleteReport={(reportId: string, reason: string) => deleteReport(reportId, reason, 'doctor')}
        onMarkReviewed={(ids: string[]) => markReviewed(ids)}
        onLockReports={(ids: string[]) => lockReports(ids)}
        onRefresh={async () => {
          try {
            await refetchReports();
          } catch (e) {
            console.error('Manual refresh failed', e);
          }
        }}
        doctorId={doctorId}
        onSelectionChange={(ids: string[]) => setSelectedReportIds(ids)}
      />

      {/* Diagnosis & Prescription Form */}
      <DiagnosisPrescriptionForm
        patientId={patient.id}
        doctorId={doctorId}
        patientName={patient.full_name}
        onAfterSave={(consultationId) => {
          if (selectedReportIds.length > 0 && consultationId) {
            lockReports(selectedReportIds, consultationId);
            setSelectedReportIds([]);
          }
        }}
        selectedReportIds={selectedReportIds}
        onGenerateAI={async (reportIds: string[]) => {
          setIsGeneratingAI(true);
          setAiError(null);
          try {
            // Fetch report metadata
            const { data: reportData, error: fetchError } = await supabase
              .from('patient_reports')
              .select('id, report_name, file_url, report_type, upload_date, file_size, file_type')
              .in('id', reportIds);

            if (fetchError) throw fetchError;
            if (!reportData || reportData.length === 0) throw new Error('Reports not found');

            // Create signed URLs
            const reportsWithSignedUrls = await Promise.all(
              reportData.map(async (report) => {
                try {
                  const { data: signedUrlData, error: urlError } = await supabase.storage
                    .from('lab-reports')
                    .createSignedUrl(report.file_url, 3600);
                  if (urlError) throw urlError;
                  return {
                    id: report.id,
                    name: report.report_name,
                    type: report.report_type,
                    file_url: signedUrlData?.signedUrl || '',
                    upload_date: report.upload_date,
                    file_size: report.file_size,
                    file_type: report.file_type,
                  };
                } catch (e) {
                  console.error('Signed URL error:', e);
                  return null;
                }
              })
            );

            const validReports = reportsWithSignedUrls.filter((r): r is {
              id: string; name: string; type: string; file_url: string; upload_date: string; file_size?: number; file_type?: string;
            } => !!r && !!r.file_url);

            if (validReports.length === 0) {
              throw new Error('Unable to access report files');
            }

            // Use env var if set, otherwise fallback to vite proxy path (works in dev)
            // In production, VITE_N8N_AI_SUMMARY_WEBHOOK should be set to the actual n8n webhook URL
            const webhookUrl = (import.meta as any).env?.VITE_N8N_AI_SUMMARY_WEBHOOK || '/api/n8n/ai-summary';
            const payload = {
              reports: validReports,
              patient_id: patientId,
              doctor_id: doctorId,
              timestamp: new Date().toISOString(),
              // Request HTML output and indicate we support chunked per-report summarization.
              options: {
                output_format: 'html',
                chunked: true,
              },
            };

            const resp = await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
            if (!resp.ok) {
              const t = await resp.text();
              throw new Error(`n8n error: ${resp.status} ${t}`);
            }
            // Some n8n setups may return empty body or non-JSON on success.
            const ct = resp.headers.get('content-type') || '';
            if (!ct.includes('application/json')) {
              const t = await resp.text();
              throw new Error(`n8n non-JSON response: ${t?.slice(0,500)}`);
            }
            let result = await resp.json();
            
            // Handle array response from n8n (when workflow returns array)
            if (Array.isArray(result) && result.length > 0) {
              result = result[0];
            }
            
            // Accept both 'summary' (OpenAI) and 'output' (Anthropic) field names
            const responseContent = result?.summary || result?.output;
            
            // Extract the extracted_text field for chat functionality
            const extractedText = result?.extracted_text || '';
            
            if (!responseContent) {
              throw new Error('Invalid AI response');
            }
            
            // Log for verification
            if (extractedText) {
              console.log('📄 Extracted text length:', extractedText.length);
            }
            
            // Return both summary and extractedText as an object
            return { summary: responseContent as string, extractedText };
          } catch (err) {
            const message = err instanceof Error ? err.message : 'AI generation failed';
            setAiError(message);
            throw err;
          } finally {
            setIsGeneratingAI(false);
          }
        }}
        isGeneratingAI={isGeneratingAI}
        aiError={aiError}
      />
    </div>
  );
});

PatientTabContent.displayName = 'PatientTabContent';

export default PatientTabContent;
