import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../utils/supabase';
import { toISTDateString, getStartOfWeekIST, addDaysIST, getTodayIST } from '../../utils/timezoneUtils';

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
  hasMissingDates: boolean;
  missingDatesCount: number;
  refetch: () => Promise<void>;
}

const getNext4WeeksDateRange = () => {
  const startOfWeek = getStartOfWeekIST();
  const endDate = addDaysIST(startOfWeek, 27);

  return { startDate: startOfWeek, endDate };
};

const generateDateArray = (startDate: Date, endDate: Date): ScheduleDay[] => {
  const dates: ScheduleDay[] = [];
  const current = new Date(startDate);
  const today = getTodayIST();

  while (current <= endDate) {
    const dateStr = toISTDateString(current);
    const currentDateOnly = new Date(current);
    currentDateOnly.setHours(0, 0, 0, 0);
    const todayDateOnly = new Date(today);
    todayDateOnly.setHours(0, 0, 0, 0);

    dates.push({
      date: dateStr,
      dayOfWeek: current.getDay(),
      isAvailable: false,
      startTime: '09:00',
      endTime: '17:00',
      slotDuration: 15,
      breakStartTime: '',
      breakEndTime: '',
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
  const [hasMissingDates, setHasMissingDates] = useState(false);
  const [missingDatesCount, setMissingDatesCount] = useState(0);

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
      const startDateStr = toISTDateString(startDate);
      const endDateStr = toISTDateString(endDate);

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
          console.log(`Found existing schedule for ${dateItem.date}:`, {
            id: existingSchedule.id,
            isAvailable: existingSchedule.is_available,
            schedule_date: existingSchedule.schedule_date
          });
          return {
            ...dateItem,
            date: existingSchedule.schedule_date,
            scheduleId: existingSchedule.id,
            isAvailable: existingSchedule.is_available || false,
            startTime: existingSchedule.start_time || '09:00',
            endTime: existingSchedule.end_time || '17:00',
            slotDuration: existingSchedule.slot_duration_minutes || 15,
            breakStartTime: existingSchedule.break_start_time || '',
            breakEndTime: existingSchedule.break_end_time || '',
            status: (existingSchedule.status as 'active' | 'inactive') || 'inactive',
            hasExistingSchedule: true,
          };
        }

        return dateItem;
      });

      const missingCount = mergedSchedules.filter(s => !s.hasExistingSchedule).length;

      console.log(`Loaded ${existingSchedules?.length || 0} existing schedules from database`);
      console.log(`Merged into ${mergedSchedules.length} total dates (4 weeks)`);
      console.log(`Missing dates: ${missingCount}`);

      setSchedules(mergedSchedules);
      setHasAnySchedules(existingSchedules && existingSchedules.length > 0);
      setHasMissingDates(missingCount > 0 && existingSchedules && existingSchedules.length > 0);
      setMissingDatesCount(missingCount);
    } catch (err) {
      console.error('Error fetching schedules:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch schedules');
      setSchedules([]);
      setHasAnySchedules(false);
      setHasMissingDates(false);
      setMissingDatesCount(0);
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
    hasMissingDates,
    missingDatesCount,
    refetch: fetchSchedules,
  };
}
