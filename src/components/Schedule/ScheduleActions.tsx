import React, { memo } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';

interface ScheduleActionsProps {
  hasAnySchedules: boolean;
  hasMissingDates: boolean;
  missingDatesCount: number;
  isProcessing: boolean;
  onGenerate: () => void;
  onGenerateMissing: () => void;
  onModify: () => void;
  onClear: () => void;
}

const ScheduleActions: React.FC<ScheduleActionsProps> = memo(({
  hasAnySchedules,
  hasMissingDates,
  missingDatesCount,
  isProcessing,
  onGenerate,
  onGenerateMissing,
  onModify,
  onClear,
}) => {
  return (
    <div className="flex items-center justify-end space-x-4">
      {!hasAnySchedules ? (
        <>
          {/* Generate New Schedule Button - Case B */}
          <button
            onClick={onGenerate}
            disabled={isProcessing}
            className="flex items-center space-x-2 px-6 py-3 bg-teal-600 dark:bg-teal-700 text-white rounded-lg font-medium hover:bg-teal-700 dark:hover:bg-teal-800 hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                <span>Generate New Schedule & Time Slots</span>
              </>
            )}
          </button>

          {/* Clear All Button - Case B */}
          <button
            onClick={onClear}
            disabled={isProcessing}
            className="flex items-center space-x-2 px-6 py-3 bg-gray-600 dark:bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-700 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-5 h-5" />
            <span>Clear All</span>
          </button>
        </>
      ) : (
        <>
          {/* Generate Missing Week Button - Show if there are missing dates */}
          {hasMissingDates && (
            <button
              onClick={onGenerateMissing}
              disabled={isProcessing}
              className="flex items-center space-x-2 px-6 py-3 bg-teal-600 dark:bg-teal-700 text-white rounded-lg font-medium hover:bg-teal-700 dark:hover:bg-teal-800 hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span>Generate New Week ({missingDatesCount} dates)</span>
                </>
              )}
            </button>
          )}

          {/* Modify Schedule Button - Case A */}
          <button
            onClick={onModify}
            disabled={isProcessing}
            className="flex items-center space-x-2 px-6 py-3 bg-green-600 dark:bg-green-700 text-white rounded-lg font-medium hover:bg-green-700 dark:hover:bg-green-800 hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Updating...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Modify Schedule</span>
              </>
            )}
          </button>

          {/* Clear All Button - Case A */}
          <button
            onClick={onClear}
            disabled={isProcessing}
            className="flex items-center space-x-2 px-6 py-3 bg-red-600 dark:bg-red-700 text-white rounded-lg font-medium hover:bg-red-700 dark:hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-5 h-5" />
            <span>Clear All</span>
          </button>
        </>
      )}
    </div>
  );
});

ScheduleActions.displayName = 'ScheduleActions';

export default ScheduleActions;
