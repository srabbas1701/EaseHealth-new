import React, { memo } from 'react';
import { Plus } from 'lucide-react';
import type { MedicationRow } from '../../../types/patient';
import PrescriptionRow from './PrescriptionRow';

interface PrescriptionTableProps {
  medications: MedicationRow[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, field: keyof MedicationRow, value: string) => void;
}

const PrescriptionTable: React.FC<PrescriptionTableProps> = memo(({
  medications,
  onAdd,
  onRemove,
  onUpdate,
}) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-bold text-[#0A2647] dark:text-gray-100">
          Prescription
        </h4>
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center space-x-2 px-4 py-2 bg-teal-600 dark:bg-teal-700 text-white rounded-lg font-medium hover:bg-teal-700 dark:hover:bg-teal-800 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Medication</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Medicine Name <span className="text-red-500">*</span>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Dosage <span className="text-red-500">*</span>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Frequency <span className="text-red-500">*</span>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Duration <span className="text-red-500">*</span>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Instructions
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-20">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
            {medications.map((medication) => (
              <PrescriptionRow
                key={medication.id}
                medication={medication}
                onUpdate={onUpdate}
                onRemove={onRemove}
              />
            ))}
          </tbody>
        </table>
      </div>

      {medications.length === 0 && (
        <div className="text-center py-8 text-gray-400 dark:text-gray-500">
          No medications added. Click "Add Medication" to add prescriptions.
        </div>
      )}
    </div>
  );
});

PrescriptionTable.displayName = 'PrescriptionTable';

export default PrescriptionTable;
