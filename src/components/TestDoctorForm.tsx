import React from 'react';

interface TestDoctorFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const TestDoctorForm: React.FC<TestDoctorFormProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#0A2647] dark:text-gray-100">
              Test Doctor Registration Form
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-6">
            <div className="bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                ✅ Form is Working!
              </h3>
              <p className="text-green-700 dark:text-green-300">
                This is a test form to verify that the modal system is working correctly.
              </p>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
                Next Steps
              </h3>
              <p className="text-blue-700 dark:text-blue-300">
                If you can see this, the modal system is working. The issue might be with the complex form components.
              </p>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-[#0075A2] text-white rounded-lg hover:bg-[#0A2647] transition-colors"
              >
                Close Test Form
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestDoctorForm;

