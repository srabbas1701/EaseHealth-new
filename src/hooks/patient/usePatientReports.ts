import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../utils/supabase';
import type { PatientReport } from '../../types/patient';

interface UsePatientReportsResult {
  reports: PatientReport[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  uploadReport: (file: File, reportName: string, reportType: string, doctorId: string) => Promise<PatientReport | null>;
  deleteReport: (reportId: string, reason: string, deletedByRole: 'doctor' | 'patient') => Promise<boolean>;
  markReviewed: (reportIds: string[]) => Promise<boolean>;
  lockReports: (reportIds: string[], consultationId?: string) => Promise<boolean>;
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
      // Fetch all reports from patient_reports table (single source of truth)
      // This includes:
      // - Patient uploads during registration (upload_source: 'patient_registration')
      // - Patient uploads during profile update (upload_source: 'patient_profile_update')
      // - Doctor uploads from dashboard (upload_source: 'doctor_upload')
      const { data, error: fetchError } = await supabase
        .from('patient_reports')
        .select('*')
        .eq('patient_id', patientId)
        .eq('is_deleted', false)
        .is('locked', false)
        .order('upload_date', { ascending: false });

      if (fetchError) throw fetchError;

      // Generate signed URLs and filter by reviewed/aged rules
      const reportsWithSignedUrls = await Promise.all(
        (data || []).map(async (report) => {
          if (report.file_url && !report.file_url.startsWith('http')) {
            try {
              const { data: signedUrlData } = await supabase.storage
                .from('lab-reports')
                .createSignedUrl(report.file_url, 3600);

              if (signedUrlData?.signedUrl) {
                return { ...report, file_url: signedUrlData.signedUrl };
              }
            } catch (err) {
              console.error('Error generating signed URL for report:', report.report_name, err);
            }
          }
          return report;
        })
      );

      // Apply frontend filter: exclude reviewed and aged by type
      const now = Date.now();
      const isWithinDays = (dateIso: string, days: number) => {
        const t = new Date(dateIso).getTime();
        return isFinite(t) && now - t <= days * 24 * 60 * 60 * 1000;
      };

      const filtered = (reportsWithSignedUrls as PatientReport[]).filter((r) => {
        if (r.reviewed_at) return false;
        if (r.report_type === 'lab_report') return isWithinDays(r.upload_date, 180);
        if (r.report_type === 'imaging') return isWithinDays(r.upload_date, 365);
        return true;
      });

      setReports(filtered);
      console.log(`✅ Fetched ${reportsWithSignedUrls.length} reports for patient ${patientId}`);
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
        .from('lab-reports')
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

  const deleteReport = useCallback(async (
    reportId: string,
    reason: string,
    deletedByRole: 'doctor' | 'patient'
  ): Promise<boolean> => {
    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const deleterId = userData?.user?.id ?? null;

      const { error: updateError } = await supabase
        .from('patient_reports')
        .update({
          is_deleted: true,
          deleted_reason: reason,
          deleted_by: deleterId,
          deleted_by_role: deletedByRole,
          deleted_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      if (updateError) throw updateError;

      await fetchReports();
      return true;
    } catch (err) {
      console.error('Error deleting report:', err);
      return false;
    }
  }, [fetchReports]);

  const markReviewed = useCallback(async (reportIds: string[]): Promise<boolean> => {
    if (!reportIds || reportIds.length === 0) return true;
    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const reviewerId = userData?.user?.id ?? null;

      const { error } = await supabase
        .from('patient_reports')
        .update({ reviewed_by: reviewerId, reviewed_at: new Date().toISOString() })
        .in('id', reportIds);
      if (error) throw error;
      await fetchReports();
      return true;
    } catch (err) {
      console.error('Error marking reviewed:', err);
      return false;
    }
  }, [fetchReports]);

  const lockReports = useCallback(async (reportIds: string[], consultationId?: string): Promise<boolean> => {
    if (!reportIds || reportIds.length === 0) return true;
    try {
      const payload: any = { locked: true };
      if (consultationId) payload.linked_consultation_id = consultationId;
      const { error } = await supabase
        .from('patient_reports')
        .update(payload)
        .in('id', reportIds);
      if (error) throw error;
      await fetchReports();
      return true;
    } catch (err) {
      console.error('Error locking reports:', err);
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
    markReviewed,
    lockReports,
  };
}
