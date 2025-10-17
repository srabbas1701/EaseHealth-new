import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../utils/supabase';

export interface ScheduleDay {
  date: string;
  dayOfWeek: number;
  isAvailable: boolean;
  startTime: string;
  endTime: string;
  slotDuration: number;
  breakStartTime: string;
  breakEndTime: string;
  status: 'active' | 'inactive';
  scheduleId?: string;
  hasExistingSchedule: boolean;
}

interface UseScheduleDataResult {
  schedules: ScheduleDay[];
  isLoading: boolean;
  error: string | null;
  hasAnySchedules: boolean;
  refetch: () => Promise<void>;
}

const getNext4WeeksDateRange = () => {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  const endDate = new Date(startOfWeek);
  endDate.setDate(startOfWeek.getDate() + 27);

  return { startDate: startOfWeek, endDate };
};

const generateDateArray = (startDate: Date, endDate: Date): ScheduleDay[] => {
  const dates: ScheduleDay[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    dates.push({
      date: current.toISOString().split('T')[0],
      dayOfWeek: current.getDay(),
      isAvailable: false,
      startTime: '09:00',
      endTime: '17:00',
      slotDuration: 15,
      breakStartTime: '13:00',
      breakEndTime: '14:00',
      status: 'inactive',
      hasExistingSchedule: false,
    });
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

export function useScheduleData(doctorId: string | null): UseScheduleDataResult {
  const [schedules, setSchedules] = useState<ScheduleDay[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAnySchedules, setHasAnySchedules] = useState(false);

  const fetchSchedules = useCallback(async () => {
    if (!doctorId) {
      setSchedules([]);
      setHasAnySchedules(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { startDate, endDate } = getNext4WeeksDateRange();
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const { data: existingSchedules, error: fetchError } = await supabase
        .from('doctor_schedules')
        .select('*')
        .eq('doctor_id', doctorId)
        .gte('schedule_date', startDateStr)
        .lte('schedule_date', endDateStr)
        .order('schedule_date', { ascending: true });

      if (fetchError) throw fetchError;

      const dateArray = generateDateArray(startDate, endDate);

      const scheduleMap = new Map(
        (existingSchedules || []).map(schedule => [schedule.schedule_date, schedule])
      );

      const mergedSchedules = dateArray.map(dateItem => {
        const existingSchedule = scheduleMap.get(dateItem.date);

        if (existingSchedule) {
          return {
            ...dateItem,
            scheduleId: existingSchedule.id,
            isAvailable: existingSchedule.is_available || false,
            startTime: existingSchedule.start_time || '09:00',
            endTime: existingSchedule.end_time || '17:00',
            slotDuration: existingSchedule.slot_duration_minutes || 15,
            breakStartTime: existingSchedule.break_start_time || '13:00',
            breakEndTime: existingSchedule.break_end_time || '14:00',
            status: (existingSchedule.status as 'active' | 'inactive') || 'inactive',
            hasExistingSchedule: true,
          };
        }

        return dateItem;
      });

      setSchedules(mergedSchedules);
      setHasAnySchedules(existingSchedules && existingSchedules.length > 0);
    } catch (err) {
      console.error('Error fetching schedules:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch schedules');
      setSchedules([]);
      setHasAnySchedules(false);
    } finally {
      setIsLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  return {
    schedules,
    isLoading,
    error,
    hasAnySchedules,
    refetch: fetchSchedules,
  };
}
