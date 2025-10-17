import React, { memo } from 'react';
import { X } from 'lucide-react';
import type { MedicationRow } from '../../../types/patient';

interface PrescriptionRowProps {
  medication: MedicationRow;
  onUpdate: (id: string, field: keyof MedicationRow, value: string) => void;
  onRemove: (id: string) => void;
}

const PrescriptionRow: React.FC<PrescriptionRowProps> = memo(({
  medication,
  onUpdate,
  onRemove,
}) => {
  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      <td className="px-4 py-3">
        <input
          type="text"
          value={medication.medicine_name}
          onChange={(e) => onUpdate(medication.id, 'medicine_name', e.target.value)}
          placeholder="e.g., Paracetamol"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
        />
      </td>
      <td className="px-4 py-3">
        <input
          type="text"
          value={medication.dosage}
          onChange={(e) => onUpdate(medication.id, 'dosage', e.target.value)}
          placeholder="e.g., 500mg"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
        />
      </td>
      <td className="px-4 py-3">
        <input
          type="text"
          value={medication.frequency}
          onChange={(e) => onUpdate(medication.id, 'frequency', e.target.value)}
          placeholder="e.g., 3 times daily"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
        />
      </td>
      <td className="px-4 py-3">
        <input
          type="text"
          value={medication.duration}
          onChange={(e) => onUpdate(medication.id, 'duration', e.target.value)}
          placeholder="e.g., 5 days"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
        />
      </td>
      <td className="px-4 py-3">
        <input
          type="text"
          value={medication.instructions}
          onChange={(e) => onUpdate(medication.id, 'instructions', e.target.value)}
          placeholder="e.g., After meals"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
        />
      </td>
      <td className="px-4 py-3 text-center">
        <button
          type="button"
          onClick={() => onRemove(medication.id)}
          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md transition-colors"
          title="Remove medication"
        >
          <X className="w-4 h-4 text-red-600 dark:text-red-400" />
        </button>
      </td>
    </tr>
  );
});

PrescriptionRow.displayName = 'PrescriptionRow';

export default PrescriptionRow;
