import React, { memo } from 'react';
import { Clock, Coffee } from 'lucide-react';
import type { ScheduleDay } from '../../hooks/schedule/useScheduleData';
import { isPastDateIST } from '../../utils/timezoneUtils';

interface ScheduleDayCardProps {
  schedule: ScheduleDay;
  onToggle: (date: string) => void;
  onTimeChange: (date: string, field: keyof ScheduleDay, value: string | number) => void;
  isEditable: boolean;
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const ScheduleDayCard: React.FC<ScheduleDayCardProps> = memo(({
  schedule,
  onToggle,
  onTimeChange,
  isEditable,
}) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isPastDate = isPastDateIST(schedule.date);

  return (
    <div
      className={`relative rounded-xl border-2 transition-all ${
        schedule.isAvailable
          ? 'border-teal-500 dark:border-teal-600 bg-teal-50 dark:bg-teal-900/20'
          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
      } ${isPastDate ? 'opacity-50' : ''} p-4`}
    >
      {/* Header with Checkbox */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={schedule.isAvailable}
            onChange={() => !isPastDate && onToggle(schedule.date)}
            disabled={!isEditable || isPastDate}
            className="w-5 h-5 text-teal-600 rounded focus:ring-2 focus:ring-teal-500 cursor-pointer disabled:cursor-not-allowed"
          />
          <div>
            <p className="text-base font-bold text-gray-900 dark:text-gray-100">
              {dayNames[schedule.dayOfWeek]}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {formatDate(schedule.date)}
            </p>
          </div>
        </div>
        {schedule.hasExistingSchedule && (
          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">
            Saved
          </span>
        )}
      </div>

      {/* Time Inputs - Stacked Vertically */}
      {schedule.isAvailable && (
        <div className="space-y-4">
          {/* Start Time */}
          <div>
            <div className="flex items-center space-x-2 mb-1.5">
              <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Start Time
              </label>
            </div>
            <input
              type="time"
              value={schedule.startTime}
              onChange={(e) => isEditable && onTimeChange(schedule.date, 'startTime', e.target.value)}
              disabled={!isEditable || isPastDate}
              className="w-full px-3 py-2 text-base font-medium border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
            />
          </div>

          {/* End Time */}
          <div>
            <div className="flex items-center space-x-2 mb-1.5">
              <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                End Time
              </label>
            </div>
            <input
              type="time"
              value={schedule.endTime}
              onChange={(e) => isEditable && onTimeChange(schedule.date, 'endTime', e.target.value)}
              disabled={!isEditable || isPastDate}
              className="w-full px-3 py-2 text-base font-medium border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
            />
          </div>

          {/* Break Start Time */}
          <div>
            <div className="flex items-center space-x-2 mb-1.5">
              <Coffee className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Break Start
              </label>
            </div>
            <input
              type="time"
              value={schedule.breakStartTime}
              onChange={(e) => isEditable && onTimeChange(schedule.date, 'breakStartTime', e.target.value)}
              disabled={!isEditable || isPastDate}
              className="w-full px-3 py-2 text-base font-medium border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
            />
          </div>

          {/* Break End Time */}
          <div>
            <div className="flex items-center space-x-2 mb-1.5">
              <Coffee className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Break End
              </label>
            </div>
            <input
              type="time"
              value={schedule.breakEndTime}
              onChange={(e) => isEditable && onTimeChange(schedule.date, 'breakEndTime', e.target.value)}
              disabled={!isEditable || isPastDate}
              className="w-full px-3 py-2 text-base font-medium border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
            />
          </div>

          {/* Slot Duration */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Slot Duration
            </label>
            <select
              value={schedule.slotDuration}
              onChange={(e) => isEditable && onTimeChange(schedule.date, 'slotDuration', parseInt(e.target.value))}
              disabled={!isEditable || isPastDate}
              className="w-full px-3 py-2 text-base font-medium border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
            >
              <option value={15}>15 min</option>
              <option value={20}>20 min</option>
              <option value={30}>30 min</option>
              <option value={45}>45 min</option>
              <option value={60}>60 min</option>
            </select>
          </div>
        </div>
      )}

      {/* Unavailable Message */}
      {!schedule.isAvailable && (
        <div className="mt-2 text-center py-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            {isPastDate ? 'Past date' : 'Not available'}
          </p>
        </div>
      )}
    </div>
  );
});

ScheduleDayCard.displayName = 'ScheduleDayCard';

export default ScheduleDayCard;
