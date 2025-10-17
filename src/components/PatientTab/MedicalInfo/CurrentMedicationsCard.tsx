import React, { memo } from 'react';
import { Pill } from 'lucide-react';

interface CurrentMedicationsCardProps {
  currentMedications?: string;
}

const CurrentMedicationsCard: React.FC<CurrentMedicationsCardProps> = memo(({ currentMedications }) => {
  const hasMedications = currentMedications && currentMedications.trim() !== '' && currentMedications.toLowerCase() !== 'none';

  const parseMedications = (medications: string): string[] => {
    return medications
      .split(/[,\n;]/)
      .map(med => med.trim())
      .filter(med => med.length > 0);
  };

  const medicationList = hasMedications ? parseMedications(currentMedications) : [];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-[#E8E8E8] dark:border-gray-600 h-full flex flex-col">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <Pill className="w-5 h-5 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-lg font-bold text-[#0A2647] dark:text-gray-100">
          Current Medications
        </h3>
      </div>

      <div className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-lg p-4 overflow-y-auto max-h-64">
        {medicationList.length > 0 ? (
          <ul className="space-y-2">
            {medicationList.map((medication, index) => (
              <li
                key={index}
                className="flex items-start space-x-2 text-sm text-gray-700 dark:text-gray-300"
              >
                <span className="w-2 h-2 rounded-full bg-green-500 dark:bg-green-400 mt-1.5 flex-shrink-0"></span>
                <span>{medication}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic">
            No current medications recorded
          </p>
        )}
      </div>
    </div>
  );
});

CurrentMedicationsCard.displayName = 'CurrentMedicationsCard';

export default CurrentMedicationsCard;
