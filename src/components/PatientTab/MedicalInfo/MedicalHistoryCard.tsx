import React, { memo } from 'react';
import { Clipboard } from 'lucide-react';

interface MedicalHistoryCardProps {
  medicalHistory?: string;
}

const MedicalHistoryCard: React.FC<MedicalHistoryCardProps> = memo(({ medicalHistory }) => {
  const hasHistory = medicalHistory && medicalHistory.trim() !== '' && medicalHistory.toLowerCase() !== 'none';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-[#E8E8E8] dark:border-gray-600 h-full flex flex-col">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <Clipboard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-lg font-bold text-[#0A2647] dark:text-gray-100">
          Medical History
        </h3>
      </div>

      <div className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-lg p-4 overflow-y-auto max-h-64">
        {hasHistory ? (
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {medicalHistory}
          </p>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic">
            No medical history recorded
          </p>
        )}
      </div>
    </div>
  );
});

MedicalHistoryCard.displayName = 'MedicalHistoryCard';

export default MedicalHistoryCard;
