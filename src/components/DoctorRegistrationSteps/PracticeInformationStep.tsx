import React from 'react';
import { MapPin, Building, Shield, Plus, Trash2 } from 'lucide-react';
import { DoctorFormData } from '../DoctorRegistrationForm';

interface PracticeInformationStepProps {
  formData: DoctorFormData;
  updateFormData: (updates: Partial<DoctorFormData>) => void;
  errors: string[];
}

const PracticeInformationStep: React.FC<PracticeInformationStepProps> = ({
  formData,
  updateFormData,
  errors
}) => {
  const insuranceNetworks = [
    'Star Health Insurance', 'HDFC ERGO', 'ICICI Lombard', 'Bajaj Allianz', 'New India Assurance',
    'Oriental Insurance', 'United India Insurance', 'National Insurance', 'IFFCO Tokio',
    'Cholamandalam MS', 'Future Generali', 'Reliance General', 'SBI General', 'Tata AIG',
    'Max Bupa', 'Apollo Munich', 'Religare Health', 'Care Health Insurance', 'Niva Bupa',
    'Aditya Birla Health', 'Digit Insurance', 'Go Digit', 'Acko Insurance', 'Zuno General'
  ];

  const handleInsuranceNetworkChange = (network: string, checked: boolean) => {
    const updatedNetworks = checked
      ? [...formData.insuranceNetworks, network]
      : formData.insuranceNetworks.filter(n => n !== network);
    updateFormData({ insuranceNetworks: updatedNetworks });
  };

  const addHospitalAffiliation = () => {
    updateFormData({ hospitalAffiliations: [...formData.hospitalAffiliations, ''] });
  };

  const removeHospitalAffiliation = (index: number) => {
    const updated = formData.hospitalAffiliations.filter((_, i) => i !== index);
    updateFormData({ hospitalAffiliations: updated });
  };

  const updateHospitalAffiliation = (index: number, value: string) => {
    const updated = [...formData.hospitalAffiliations];
    updated[index] = value;
    updateFormData({ hospitalAffiliations: updated });
  };

  return (
    <div className="space-y-6">
      {/* Primary Practice Address */}
      <div>
        <label htmlFor="practiceAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Primary Practice Address *
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <textarea
            id="practiceAddress"
            value={formData.practiceAddress}
            onChange={(e) => updateFormData({ practiceAddress: e.target.value })}
            rows={3}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-vertical"
            placeholder="Enter the full address of your main clinic or hospital where you primarily practice"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          The full address of your main clinic or hospital where you primarily practice.
        </p>
      </div>

      {/* Hospital Affiliations */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Hospital Affiliations (Optional)
        </label>
        <div className="space-y-3">
          {formData.hospitalAffiliations.map((affiliation, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={affiliation}
                  onChange={(e) => updateHospitalAffiliation(index, e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="e.g., Apollo Hospital, Max Healthcare, Fortis Hospital"
                />
              </div>
              {formData.hospitalAffiliations.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeHospitalAffiliation(index)}
                  className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addHospitalAffiliation}
            className="flex items-center text-sm text-[#0075A2] dark:text-[#0EA5E9] hover:text-[#0A2647] dark:hover:text-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0075A2] rounded p-2"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Hospital Affiliation
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          List all hospitals or medical institutions where you are affiliated or have admitting privileges.
        </p>
      </div>

      {/* Insurance Networks */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Insurance Networks Accepted (Optional)
        </label>
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 max-h-64 overflow-y-auto bg-white dark:bg-gray-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {insuranceNetworks.map(network => (
              <label key={network} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 p-2 rounded">
                <input
                  type="checkbox"
                  checked={formData.insuranceNetworks.includes(network)}
                  onChange={(e) => handleInsuranceNetworkChange(network, e.target.checked)}
                  className="w-4 h-4 text-[#0075A2] border-gray-300 dark:border-gray-600 rounded focus:ring-[#0075A2] focus:ring-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{network}</span>
              </label>
            ))}
          </div>
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Select all health insurance networks you accept for patient billing.
        </p>
      </div>

      {/* Additional Information */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
              Data Security & Privacy
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              All information provided will be securely stored and used only for patient care coordination 
              and appointment scheduling. Your data is protected under India's DPDP Act and stored within 
              Indian data centers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticeInformationStep;