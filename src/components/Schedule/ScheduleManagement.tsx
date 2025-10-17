import React, { memo, useState, useCallback, useEffect } from 'react';
import { Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { useScheduleData } from '../../hooks/schedule/useScheduleData';
import { useScheduleActions } from '../../hooks/schedule/useScheduleActions';
import type { ScheduleDay } from '../../hooks/schedule/useScheduleData';
import ScheduleWeekView from './ScheduleWeekView';
import ScheduleActions from './ScheduleActions';

interface ScheduleManagementProps {
  doctorId: string;
}

const ScheduleManagement: React.FC<ScheduleManagementProps> = memo(({ doctorId }) => {
  const { schedules, isLoading, error, hasAnySchedules, hasMissingDates, missingDatesCount, refetch } = useScheduleData(doctorId);
  const { generateSchedules, generateMissingWeek, modifySchedules, clearAllSchedules, isProcessing } = useScheduleActions();

  const [localSchedules, setLocalSchedules] = useState<ScheduleDay[]>([]);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setLocalSchedules(schedules);
  }, [schedules]);

  const handleToggleDay = useCallback((date: string) => {
    setLocalSchedules(prev =>
      prev.map(schedule =>
        schedule.date === date
          ? { ...schedule, isAvailable: !schedule.isAvailable }
          : schedule
      )
    );
  }, []);

  const handleTimeChange = useCallback((
    date: string,
    field: keyof ScheduleDay,
    value: string | number
  ) => {
    setLocalSchedules(prev =>
      prev.map(schedule =>
        schedule.date === date
          ? { ...schedule, [field]: value }
          : schedule
      )
    );
  }, []);

  const handleWeekChange = useCallback((direction: 'prev' | 'next') => {
    setCurrentWeekIndex(prev => {
      if (direction === 'prev') return Math.max(0, prev - 1);
      return Math.min(3, prev + 1);
    });
  }, []);

  const handleGenerate = useCallback(async () => {
    setMessage(null);
    const result = await generateSchedules(doctorId, localSchedules);

    if (result.success) {
      setMessage({ type: 'success', text: 'All 4-week schedules and time slots generated successfully!' });
      await refetch();
      setTimeout(() => setMessage(null), 5000);
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to generate schedules' });
    }
  }, [doctorId, localSchedules, generateSchedules, refetch]);

  const handleGenerateMissing = useCallback(async () => {
    setMessage(null);
    const result = await generateMissingWeek(doctorId, localSchedules);

    if (result.success) {
      setMessage({ type: 'success', text: `New week generated successfully! (${missingDatesCount} dates added)` });
      await refetch();
      setTimeout(() => setMessage(null), 5000);
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to generate missing week' });
    }
  }, [doctorId, localSchedules, generateMissingWeek, missingDatesCount, refetch]);

  const handleModify = useCallback(async () => {
    setMessage(null);
    const result = await modifySchedules(doctorId, localSchedules);

    if (result.success) {
      setMessage({ type: 'success', text: 'Schedules updated successfully!' });
      await refetch();
      setTimeout(() => setMessage(null), 5000);
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to update schedules' });
    }
  }, [doctorId, localSchedules, modifySchedules, refetch]);

  const handleClear = useCallback(async () => {
    if (hasAnySchedules) {
      const confirmed = window.confirm(
        'Are you sure you want to clear all schedules? This will delete all schedule and time slot records for the next 4 weeks.'
      );

      if (!confirmed) return;

      setMessage(null);
      const result = await clearAllSchedules(doctorId);

      if (result.success) {
        setMessage({ type: 'success', text: 'All schedules cleared successfully!' });
        await refetch();
        setTimeout(() => setMessage(null), 5000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to clear schedules' });
      }
    } else {
      setLocalSchedules(prev =>
        prev.map(schedule => ({
          ...schedule,
          isAvailable: false,
        }))
      );
    }
  }, [hasAnySchedules, doctorId, clearAllSchedules, refetch]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-16"></div>
          <div className="grid grid-cols-7 gap-4">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-xl h-48"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg p-6">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-700 dark:text-red-300 font-semibold mb-1">Error loading schedules</p>
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-start space-x-3 ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          )}
          <p
            className={
              message.type === 'success'
                ? 'text-green-700 dark:text-green-300'
                : 'text-red-700 dark:text-red-300'
            }
          >
            {message.text}
          </p>
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg p-4">
        <div className="flex items-start">
          <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-blue-700 dark:text-blue-300 font-semibold mb-1">
              {hasAnySchedules ? 'Modify Your Schedule' : 'Create Your Schedule'}
            </p>
            <p className="text-blue-600 dark:text-blue-400 text-sm">
              {hasAnySchedules
                ? hasMissingDates
                  ? `You have ${missingDatesCount} missing date(s) in your 4-week schedule (likely new week). Check/uncheck these dates and click "Generate New Week" to add them, or modify existing schedules.`
                  : 'Check/uncheck dates to enable or disable availability. Update times as needed and click "Modify Schedule" to save changes.'
                : 'Select the dates you want to be available for the next 4 weeks. All dates will be created - checked ones as available, unchecked ones as inactive. Past dates in current week will be created as unchecked/inactive. Click "Generate New Schedule & Time Slots" when ready.'}
            </p>
          </div>
        </div>
      </div>

      {/* Week View */}
      <ScheduleWeekView
        schedules={localSchedules}
        currentWeekIndex={currentWeekIndex}
        onWeekChange={handleWeekChange}
        onToggleDay={handleToggleDay}
        onTimeChange={handleTimeChange}
        isEditable={true}
      />

      {/* Action Buttons */}
      <ScheduleActions
        hasAnySchedules={hasAnySchedules}
        hasMissingDates={hasMissingDates}
        missingDatesCount={missingDatesCount}
        isProcessing={isProcessing}
        onGenerate={handleGenerate}
        onGenerateMissing={handleGenerateMissing}
        onModify={handleModify}
        onClear={handleClear}
      />
    </div>
  );
});

ScheduleManagement.displayName = 'ScheduleManagement';

export default ScheduleManagement;
