import { useState, useCallback } from 'react';
import { supabase } from '../../utils/supabase';
import type { ScheduleDay } from './useScheduleData';

interface UseScheduleActionsResult {
  generateSchedules: (doctorId: string, schedules: ScheduleDay[]) => Promise<{ success: boolean; error?: string }>;
  generateMissingWeek: (doctorId: string, schedules: ScheduleDay[]) => Promise<{ success: boolean; error?: string }>;
  modifySchedules: (doctorId: string, schedules: ScheduleDay[]) => Promise<{ success: boolean; error?: string }>;
  clearAllSchedules: (doctorId: string) => Promise<{ success: boolean; error?: string }>;
  isProcessing: boolean;
}

const generateTimeSlots = (
  doctorId: string,
  scheduleDate: string,
  startTime: string,
  endTime: string,
  slotDuration: number,
  breakStart: string,
  breakEnd: string
) => {
  const slots = [];
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const hasBreak = breakStart && breakEnd && breakStart.trim() !== '' && breakEnd.trim() !== '';
  const breakStartMinutes = hasBreak ? breakStart.split(':').map(Number).reduce((h, m) => h * 60 + m) : -1;
  const breakEndMinutes = hasBreak ? breakEnd.split(':').map(Number).reduce((h, m) => h * 60 + m) : -1;

  let currentMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  while (currentMinutes + slotDuration <= endMinutes) {
    const slotStart = `${String(Math.floor(currentMinutes / 60)).padStart(2, '0')}:${String(currentMinutes % 60).padStart(2, '0')}`;
    const slotEndMinutes = currentMinutes + slotDuration;
    const slotEnd = `${String(Math.floor(slotEndMinutes / 60)).padStart(2, '0')}:${String(slotEndMinutes % 60).padStart(2, '0')}`;

    const isBreakTime = hasBreak && currentMinutes >= breakStartMinutes && currentMinutes < breakEndMinutes;

    slots.push({
      doctor_id: doctorId,
      schedule_date: scheduleDate,
      start_time: slotStart,
      end_time: slotEnd,
      duration_minutes: slotDuration,
      status: isBreakTime ? 'break' : 'available',
    });

    currentMinutes += slotDuration;
  }

  return slots;
};

export function useScheduleActions(): UseScheduleActionsResult {
  const [isProcessing, setIsProcessing] = useState(false);

  const generateSchedules = useCallback(async (
    doctorId: string,
    schedules: ScheduleDay[]
  ): Promise<{ success: boolean; error?: string }> => {
    setIsProcessing(true);

    try {
      const scheduleRecords = schedules.map(schedule => ({
        doctor_id: doctorId,
        day_of_week: schedule.dayOfWeek,
        schedule_date: schedule.date,
        start_time: schedule.startTime,
        end_time: schedule.endTime,
        slot_duration_minutes: schedule.slotDuration,
        break_start_time: schedule.breakStartTime && schedule.breakStartTime.trim() !== '' ? schedule.breakStartTime : null,
        break_end_time: schedule.breakEndTime && schedule.breakEndTime.trim() !== '' ? schedule.breakEndTime : null,
        is_available: schedule.isAvailable,
        status: schedule.isAvailable ? 'active' : 'blocked',
      }));

      const { error: scheduleError } = await supabase
        .from('doctor_schedules')
        .insert(scheduleRecords);

      if (scheduleError) throw scheduleError;

      const allTimeSlots = schedules.flatMap(schedule => {
        const slots = generateTimeSlots(
          doctorId,
          schedule.date,
          schedule.startTime,
          schedule.endTime,
          schedule.slotDuration,
          schedule.breakStartTime,
          schedule.breakEndTime
        );

        if (!schedule.isAvailable) {
          return slots.map(slot => ({ ...slot, status: 'blocked' }));
        }

        return slots;
      });

      if (allTimeSlots.length > 0) {
        const { error: slotsError } = await supabase
          .from('time_slots')
          .insert(allTimeSlots);

        if (slotsError) throw slotsError;
      }

      return { success: true };
    } catch (err) {
      console.error('Error generating schedules:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to generate schedules',
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const modifySchedules = useCallback(async (
    doctorId: string,
    schedules: ScheduleDay[]
  ): Promise<{ success: boolean; error?: string }> => {
    setIsProcessing(true);

    try {
      for (const schedule of schedules) {
        if (!schedule.hasExistingSchedule || !schedule.scheduleId) {
          console.warn(`Schedule for ${schedule.date} has no existing record. This should not happen with the new system.`);
          continue;
        }

        const { error: updateError } = await supabase
          .from('doctor_schedules')
          .update({
            start_time: schedule.startTime,
            end_time: schedule.endTime,
            slot_duration_minutes: schedule.slotDuration,
            break_start_time: schedule.breakStartTime && schedule.breakStartTime.trim() !== '' ? schedule.breakStartTime : null,
            break_end_time: schedule.breakEndTime && schedule.breakEndTime.trim() !== '' ? schedule.breakEndTime : null,
            is_available: schedule.isAvailable,
            status: schedule.isAvailable ? 'active' : 'blocked',
          })
          .eq('id', schedule.scheduleId);

        if (updateError) {
          console.error(`Update error for ${schedule.date}:`, updateError);
          throw updateError;
        }

        const { error: deleteError } = await supabase
          .from('time_slots')
          .delete()
          .eq('doctor_id', doctorId)
          .eq('schedule_date', schedule.date);

        if (deleteError) throw deleteError;

        const newSlots = generateTimeSlots(
          doctorId,
          schedule.date,
          schedule.startTime,
          schedule.endTime,
          schedule.slotDuration,
          schedule.breakStartTime,
          schedule.breakEndTime
        );

        const slotsToInsert = schedule.isAvailable
          ? newSlots
          : newSlots.map(slot => ({ ...slot, status: 'blocked' }));

        if (slotsToInsert.length > 0) {
          const { error: insertError } = await supabase
            .from('time_slots')
            .insert(slotsToInsert);

          if (insertError) throw insertError;
        }
      }

      return { success: true };
    } catch (err) {
      console.error('Error modifying schedules:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to modify schedules',
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const clearAllSchedules = useCallback(async (
    doctorId: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsProcessing(true);

    try {
      const { startDate, endDate } = getNext4WeeksDateRange();
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const { error: deleteSchedulesError } = await supabase
        .from('doctor_schedules')
        .delete()
        .eq('doctor_id', doctorId)
        .gte('schedule_date', startDateStr)
        .lte('schedule_date', endDateStr);

      if (deleteSchedulesError) throw deleteSchedulesError;

      const { error: deleteSlotsError } = await supabase
        .from('time_slots')
        .delete()
        .eq('doctor_id', doctorId)
        .gte('schedule_date', startDateStr)
        .lte('schedule_date', endDateStr);

      if (deleteSlotsError) throw deleteSlotsError;

      return { success: true };
    } catch (err) {
      console.error('Error clearing schedules:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to clear schedules',
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const generateMissingWeek = useCallback(async (
    doctorId: string,
    schedules: ScheduleDay[]
  ): Promise<{ success: boolean; error?: string }> => {
    setIsProcessing(true);

    try {
      const missingSchedules = schedules.filter(s => !s.hasExistingSchedule);

      if (missingSchedules.length === 0) {
        return { success: false, error: 'No missing schedules to generate' };
      }

      const scheduleRecords = missingSchedules.map(schedule => ({
        doctor_id: doctorId,
        day_of_week: schedule.dayOfWeek,
        schedule_date: schedule.date,
        start_time: schedule.startTime,
        end_time: schedule.endTime,
        slot_duration_minutes: schedule.slotDuration,
        break_start_time: schedule.breakStartTime && schedule.breakStartTime.trim() !== '' ? schedule.breakStartTime : null,
        break_end_time: schedule.breakEndTime && schedule.breakEndTime.trim() !== '' ? schedule.breakEndTime : null,
        is_available: schedule.isAvailable,
        status: schedule.isAvailable ? 'active' : 'blocked',
      }));

      const { error: scheduleError } = await supabase
        .from('doctor_schedules')
        .insert(scheduleRecords);

      if (scheduleError) throw scheduleError;

      const allTimeSlots = missingSchedules.flatMap(schedule => {
        const slots = generateTimeSlots(
          doctorId,
          schedule.date,
          schedule.startTime,
          schedule.endTime,
          schedule.slotDuration,
          schedule.breakStartTime,
          schedule.breakEndTime
        );

        if (!schedule.isAvailable) {
          return slots.map(slot => ({ ...slot, status: 'blocked' }));
        }

        return slots;
      });

      if (allTimeSlots.length > 0) {
        const { error: slotsError } = await supabase
          .from('time_slots')
          .insert(allTimeSlots);

        if (slotsError) throw slotsError;
      }

      return { success: true };
    } catch (err) {
      console.error('Error generating missing week:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to generate missing week',
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    generateSchedules,
    generateMissingWeek,
    modifySchedules,
    clearAllSchedules,
    isProcessing,
  };
}

const getNext4WeeksDateRange = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(today);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 27);

  return { startDate, endDate };
};
