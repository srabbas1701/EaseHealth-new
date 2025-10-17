import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../utils/supabase';
import type { PatientReport } from '../../types/patient';

interface UsePatientReportsResult {
  reports: PatientReport[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  uploadReport: (file: File, reportName: string, reportType: string, doctorId: string) => Promise<PatientReport | null>;
  deleteReport: (reportId: string) => Promise<boolean>;
}

export function usePatientReports(patientId: string | null): UsePatientReportsResult {
  const [reports, setReports] = useState<PatientReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    if (!patientId) {
      setReports([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('patient_reports')
        .select('*')
        .eq('patient_id', patientId)
        .eq('is_deleted', false)
        .order('upload_date', { ascending: false });

      if (fetchError) throw fetchError;

      const reportsWithSignedUrls = await Promise.all(
        (data || []).map(async (report) => {
          if (report.file_url && !report.file_url.startsWith('http')) {
            try {
              const { data: signedUrlData } = await supabase.storage
                .from('patient-reports')
                .createSignedUrl(report.file_url, 3600);

              if (signedUrlData?.signedUrl) {
                return { ...report, file_url: signedUrlData.signedUrl };
              }
            } catch (err) {
              console.error('Error generating signed URL:', err);
            }
          }
          return report;
        })
      );

      setReports(reportsWithSignedUrls as PatientReport[]);
    } catch (err) {
      console.error('Error fetching patient reports:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch patient reports');
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  const uploadReport = useCallback(async (
    file: File,
    reportName: string,
    reportType: string,
    doctorId: string
  ): Promise<PatientReport | null> => {
    if (!patientId) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${patientId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('patient-reports')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: reportData, error: insertError } = await supabase
        .from('patient_reports')
        .insert({
          patient_id: patientId,
          report_name: reportName,
          report_type: reportType,
          file_url: uploadData.path,
          file_size: file.size,
          file_type: file.type,
          uploaded_by: doctorId,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      await fetchReports();

      return reportData as PatientReport;
    } catch (err) {
      console.error('Error uploading report:', err);
      throw err;
    }
  }, [patientId, fetchReports]);

  const deleteReport = useCallback(async (reportId: string): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('patient_reports')
        .update({ is_deleted: true })
        .eq('id', reportId);

      if (updateError) throw updateError;

      await fetchReports();
      return true;
    } catch (err) {
      console.error('Error deleting report:', err);
      return false;
    }
  }, [fetchReports]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return {
    reports,
    isLoading,
    error,
    refetch: fetchReports,
    uploadReport,
    deleteReport,
  };
}
