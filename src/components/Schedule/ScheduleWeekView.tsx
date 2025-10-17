import React, { memo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ScheduleDay } from '../../hooks/schedule/useScheduleData';
import ScheduleDayCard from './ScheduleDayCard';

interface ScheduleWeekViewProps {
  schedules: ScheduleDay[];
  currentWeekIndex: number;
  onWeekChange: (direction: 'prev' | 'next') => void;
  onToggleDay: (date: string) => void;
  onTimeChange: (date: string, field: keyof ScheduleDay, value: string | number) => void;
  isEditable: boolean;
}

const ScheduleWeekView: React.FC<ScheduleWeekViewProps> = memo(({
  schedules,
  currentWeekIndex,
  onWeekChange,
  onToggleDay,
  onTimeChange,
  isEditable,
}) => {
  const currentWeekSchedules = schedules.slice(currentWeekIndex * 7, (currentWeekIndex + 1) * 7);

  const getWeekDateRange = () => {
    if (currentWeekSchedules.length === 0) return '';
    const firstDate = new Date(currentWeekSchedules[0].date);
    const lastDate = new Date(currentWeekSchedules[currentWeekSchedules.length - 1].date);

    return `${firstDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${lastDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  return (
    <div className="space-y-4">
      {/* Week Navigation */}
      <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
        <button
          onClick={() => onWeekChange('prev')}
          disabled={currentWeekIndex === 0}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>

        <div className="text-center">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Week {currentWeekIndex + 1} of 4
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {getWeekDateRange()}
          </p>
        </div>

        <button
          onClick={() => onWeekChange('next')}
          disabled={currentWeekIndex === 3}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {currentWeekSchedules.map((schedule) => (
          <ScheduleDayCard
            key={schedule.date}
            schedule={schedule}
            onToggle={onToggleDay}
            onTimeChange={onTimeChange}
            isEditable={isEditable}
          />
        ))}
      </div>
    </div>
  );
});

ScheduleWeekView.displayName = 'ScheduleWeekView';

export default ScheduleWeekView;
