import { useState, useCallback } from 'react';
import { supabase } from '../../utils/supabase';
import type { ScheduleDay } from './useScheduleData';

interface UseScheduleActionsResult {
  generateSchedules: (doctorId: string, schedules: ScheduleDay[]) => Promise<{ success: boolean; error?: string }>;
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
  const [breakStartHour, breakStartMin] = breakStart.split(':').map(Number);
  const [breakEndHour, breakEndMin] = breakEnd.split(':').map(Number);

  let currentMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  const breakStartMinutes = breakStartHour * 60 + breakStartMin;
  const breakEndMinutes = breakEndHour * 60 + breakEndMin;

  while (currentMinutes + slotDuration <= endMinutes) {
    const slotStart = `${String(Math.floor(currentMinutes / 60)).padStart(2, '0')}:${String(currentMinutes % 60).padStart(2, '0')}`;
    const slotEndMinutes = currentMinutes + slotDuration;
    const slotEnd = `${String(Math.floor(slotEndMinutes / 60)).padStart(2, '0')}:${String(slotEndMinutes % 60).padStart(2, '0')}`;

    const isBreakTime = currentMinutes >= breakStartMinutes && currentMinutes < breakEndMinutes;

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
      const activeSchedules = schedules.filter(s => s.isAvailable);

      if (activeSchedules.length === 0) {
        return { success: false, error: 'Please select at least one day to generate schedules' };
      }

      const scheduleRecords = activeSchedules.map(schedule => ({
        doctor_id: doctorId,
        day_of_week: schedule.dayOfWeek,
        schedule_date: schedule.date,
        start_time: schedule.startTime,
        end_time: schedule.endTime,
        slot_duration_minutes: schedule.slotDuration,
        break_start_time: schedule.breakStartTime,
        break_end_time: schedule.breakEndTime,
        is_available: true,
        status: 'active',
      }));

      const { error: scheduleError } = await supabase
        .from('doctor_schedules')
        .insert(scheduleRecords);

      if (scheduleError) throw scheduleError;

      const allTimeSlots = activeSchedules.flatMap(schedule =>
        generateTimeSlots(
          doctorId,
          schedule.date,
          schedule.startTime,
          schedule.endTime,
          schedule.slotDuration,
          schedule.breakStartTime,
          schedule.breakEndTime
        )
      );

      const { error: slotsError } = await supabase
        .from('time_slots')
        .insert(allTimeSlots);

      if (slotsError) throw slotsError;

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
        console.log(`Processing schedule for ${schedule.date}:`, {
          hasExisting: schedule.hasExistingSchedule,
          scheduleId: schedule.scheduleId,
          isAvailable: schedule.isAvailable
        });

        if (schedule.hasExistingSchedule && schedule.scheduleId) {
          console.log(`Updating existing schedule for ${schedule.date}`);
          const { error: updateError } = await supabase
            .from('doctor_schedules')
            .update({
              start_time: schedule.startTime,
              end_time: schedule.endTime,
              slot_duration_minutes: schedule.slotDuration,
              break_start_time: schedule.breakStartTime,
              break_end_time: schedule.breakEndTime,
              is_available: schedule.isAvailable,
              status: schedule.isAvailable ? 'active' : 'inactive',
            })
            .eq('id', schedule.scheduleId);

          if (updateError) {
            console.error(`Update error for ${schedule.date}:`, updateError);
            throw updateError;
          }

          if (!schedule.isAvailable) {
            const { error: slotsError } = await supabase
              .from('time_slots')
              .update({ status: 'blocked' })
              .eq('doctor_id', doctorId)
              .eq('schedule_date', schedule.date);

            if (slotsError) throw slotsError;
          } else {
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

            const { error: insertError } = await supabase
              .from('time_slots')
              .insert(newSlots);

            if (insertError) throw insertError;
          }
        } else if (schedule.isAvailable) {
          console.log(`Creating new schedule for ${schedule.date}`);
          const { data: newSchedule, error: insertScheduleError } = await supabase
            .from('doctor_schedules')
            .insert({
              doctor_id: doctorId,
              day_of_week: schedule.dayOfWeek,
              schedule_date: schedule.date,
              start_time: schedule.startTime,
              end_time: schedule.endTime,
              slot_duration_minutes: schedule.slotDuration,
              break_start_time: schedule.breakStartTime,
              break_end_time: schedule.breakEndTime,
              is_available: true,
              status: 'active',
            })
            .select()
            .single();

          if (insertScheduleError) {
            console.error(`Insert schedule error for ${schedule.date}:`, insertScheduleError);
            throw insertScheduleError;
          }

          console.log(`Generating time slots for ${schedule.date}`);
          const newSlots = generateTimeSlots(
            doctorId,
            schedule.date,
            schedule.startTime,
            schedule.endTime,
            schedule.slotDuration,
            schedule.breakStartTime,
            schedule.breakEndTime
          );

          console.log(`Inserting ${newSlots.length} time slots for ${schedule.date}`);
          const { error: insertSlotsError } = await supabase
            .from('time_slots')
            .insert(newSlots);

          if (insertSlotsError) {
            console.error(`Insert slots error for ${schedule.date}:`, insertSlotsError);
            throw insertSlotsError;
          }
        } else {
          console.log(`Skipping ${schedule.date} - not available and no existing schedule`);
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

  return {
    generateSchedules,
    modifySchedules,
    clearAllSchedules,
    isProcessing,
  };
}

const getNext4WeeksDateRange = () => {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  const endDate = new Date(startOfWeek);
  endDate.setDate(startOfWeek.getDate() + 27);

  return { startDate: startOfWeek, endDate };
};
