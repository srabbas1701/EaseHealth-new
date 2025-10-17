import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../utils/supabase';
import type { Patient } from '../../types/patient';

interface UsePatientDetailsResult {
  patient: Patient | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePatientDetails(patientId: string | null): UsePatientDetailsResult {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPatient = useCallback(async () => {
    if (!patientId) {
      setPatient(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
        if (data.profile_image_url && !data.profile_image_url.startsWith('http')) {
          try {
            const cleanPath = data.profile_image_url.replace('patient-profile-images/', '');
            const { data: signedUrlData } = await supabase.storage
              .from('patient-profile-images')
              .createSignedUrl(cleanPath, 3600);

            if (signedUrlData?.signedUrl) {
              data.profile_image_url = signedUrlData.signedUrl;
            }
          } catch (err) {
            console.error('Error generating signed URL for patient profile image:', err);
          }
        }

        setPatient(data as Patient);
      } else {
        setPatient(null);
      }
    } catch (err) {
      console.error('Error fetching patient details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch patient details');
      setPatient(null);
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchPatient();
  }, [fetchPatient]);

  return {
    patient,
    isLoading,
    error,
    refetch: fetchPatient,
  };
}
