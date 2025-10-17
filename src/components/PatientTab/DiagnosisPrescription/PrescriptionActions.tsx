import React, { memo } from 'react';
import { Bot, Save, Printer } from 'lucide-react';

interface PrescriptionActionsProps {
  onSave: () => void;
  onPrint: () => void;
  onAIAnalysis?: () => void;
  isSaving: boolean;
}

const PrescriptionActions: React.FC<PrescriptionActionsProps> = memo(({
  onSave,
  onPrint,
  onAIAnalysis,
  isSaving,
}) => {
  return (
    <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-600">
      <button
        type="button"
        onClick={onAIAnalysis}
        disabled={!onAIAnalysis}
        className="flex items-center space-x-2 px-6 py-3 bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded-lg font-medium cursor-not-allowed"
        title="AI Analysis feature coming soon via n8n integration"
      >
        <Bot className="w-5 h-5" />
        <span>Generate AI Analysis</span>
      </button>

      <button
        type="button"
        onClick={onSave}
        disabled={isSaving}
        className="flex items-center space-x-2 px-6 py-3 bg-green-600 dark:bg-green-700 text-white rounded-lg font-medium hover:bg-green-700 dark:hover:bg-green-800 hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        {isSaving ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Saving...</span>
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            <span>Save Prescription</span>
          </>
        )}
      </button>

      <button
        type="button"
        onClick={onPrint}
        className="flex items-center space-x-2 px-6 py-3 bg-teal-600 dark:bg-teal-700 text-white rounded-lg font-medium hover:bg-teal-700 dark:hover:bg-teal-800 hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
      >
        <Printer className="w-5 h-5" />
        <span>Print Prescription</span>
      </button>
    </div>
  );
});

PrescriptionActions.displayName = 'PrescriptionActions';

export default PrescriptionActions;
