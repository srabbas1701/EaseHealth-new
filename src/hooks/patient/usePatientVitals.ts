import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../utils/supabase';
import type { PatientVitals } from '../../types/patient';

interface UsePatientVitalsResult {
  vitals: PatientVitals | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePatientVitals(patientId: string | null): UsePatientVitalsResult {
  const [vitals, setVitals] = useState<PatientVitals | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVitals = useCallback(async () => {
    if (!patientId) {
      setVitals(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('patient_vitals')
        .select('*')
        .eq('patient_id', patientId)
        .order('recorded_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;

      setVitals(data as PatientVitals | null);
    } catch (err) {
      console.error('Error fetching patient vitals:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch patient vitals');
      setVitals(null);
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchVitals();
  }, [fetchVitals]);

  return {
    vitals,
    isLoading,
    error,
    refetch: fetchVitals,
  };
}
