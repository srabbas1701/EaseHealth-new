import React, { memo, useState } from 'react';
import { AlertCircle } from 'lucide-react';

interface AllergyIndicatorProps {
  hasAllergies: boolean;
  allergies?: string;
}

const AllergyIndicator: React.FC<AllergyIndicatorProps> = memo(({ hasAllergies, allergies }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!hasAllergies) {
    return (
      <div className="relative">
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          <AlertCircle className="w-5 h-5 text-gray-400 dark:text-gray-600" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center border-2 border-red-500 dark:border-red-700 cursor-help">
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
      </div>

      {showTooltip && (
        <div className="absolute left-0 top-10 z-50 w-72 bg-white dark:bg-gray-800 border border-red-300 dark:border-red-700 rounded-lg shadow-xl p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700 dark:text-red-300 mb-1">
                Allergies:
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {allergies}
              </p>
            </div>
          </div>
          <div className="absolute -top-2 left-3 w-4 h-4 bg-white dark:bg-gray-800 border-t border-l border-red-300 dark:border-red-700 transform rotate-45"></div>
        </div>
      )}
    </div>
  );
});

AllergyIndicator.displayName = 'AllergyIndicator';

export default AllergyIndicator;
