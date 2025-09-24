import React from 'react';
import { Award, Globe, GraduationCap, Stethoscope, Calendar, Plus, Trash2 } from 'lucide-react';
import { DoctorFormData } from '../DoctorRegistrationForm';

interface ProfessionalCredentialsStepProps {
  formData: DoctorFormData;
  updateFormData: (updates: Partial<DoctorFormData>) => void;
  errors: string[];
}

const ProfessionalCredentialsStep: React.FC<ProfessionalCredentialsStepProps> = ({
  formData,
  updateFormData,
  errors
}) => {
  const countries = [
    { value: 'India', label: 'India' },
    { value: 'USA', label: 'United States' },
    { value: 'UK', label: 'United Kingdom' },
    { value: 'Canada', label: 'Canada' },
    { value: 'Australia', label: 'Australia' },
    { value: 'Other', label: 'Other' }
  ];

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
    'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
    'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
    'Uttarakhand', 'West Bengal', 'Delhi'
  ];

  const qualifications = [
    'MBBS', 'MD', 'MS', 'DNB', 'DM', 'MCh', 'BAMS', 'BHMS', 'BUMS', 'BDS', 'MDS', 'BPT', 'MPT'
  ];

  const specialties = [
    'General Medicine', 'Cardiology', 'Dermatology', 'Pediatrics', 'Orthopedics', 'Gynecology',
    'Neurology', 'Psychiatry', 'Ophthalmology', 'ENT', 'Radiology', 'Anesthesiology',
    'Emergency Medicine', 'Family Medicine', 'Internal Medicine', 'Surgery', 'Oncology',
    'Endocrinology', 'Gastroenterology', 'Pulmonology', 'Nephrology', 'Rheumatology',
    'Infectious Disease', 'Pathology', 'Physical Medicine', 'Plastic Surgery'
  ];

  const handleSpecialtyChange = (specialty: string, checked: boolean) => {
    const updatedSpecialties = checked
      ? [...formData.specialties, specialty]
      : formData.specialties.filter(s => s !== specialty);
    updateFormData({ specialties: updatedSpecialties });
  };

  const addBoardCertification = () => {
    updateFormData({ boardCertifications: [...formData.boardCertifications, ''] });
  };

  const removeBoardCertification = (index: number) => {
    const updated = formData.boardCertifications.filter((_, i) => i !== index);
    updateFormData({ boardCertifications: updated });
  };

  const updateBoardCertification = (index: number, value: string) => {
    const updated = [...formData.boardCertifications];
    updated[index] = value;
    updateFormData({ boardCertifications: updated });
  };

  return (
    <div className="space-y-6">
      {/* Medical License Number */}
      <div>
        <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Medical License Number *
        </label>
        <div className="relative">
          <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            id="licenseNumber"
            value={formData.licenseNumber}
            onChange={(e) => updateFormData({ licenseNumber: e.target.value })}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder="e.g., MCI-12345 or DMC-67890"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Your unique medical registration number issued by the medical council.
        </p>
      </div>

      {/* Issuing Country */}
      <div>
        <label htmlFor="issuingCountry" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Issuing Country *
        </label>
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            id="issuingCountry"
            value={formData.issuingCountry}
            onChange={(e) => updateFormData({ issuingCountry: e.target.value, issuingAuthority: '' })}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            {countries.map(country => (
              <option key={country.value} value={country.value}>
                {country.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Issuing Authority */}
      <div>
        <label htmlFor="issuingAuthority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Issuing Authority/State *
        </label>
        {formData.issuingCountry === 'India' ? (
          <select
            id="issuingAuthority"
            value={formData.issuingAuthority}
            onChange={(e) => updateFormData({ issuingAuthority: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="">Select State/Medical Council</option>
            {indianStates.map(state => (
              <option key={state} value={`${state} Medical Council`}>
                {state} Medical Council
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            id="issuingAuthority"
            value={formData.issuingAuthority}
            onChange={(e) => updateFormData({ issuingAuthority: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder="Enter issuing authority"
          />
        )}
      </div>

      {/* Primary Qualification */}
      <div>
        <label htmlFor="primaryQualification" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Primary Qualification *
        </label>
        <div className="relative">
          <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            id="primaryQualification"
            value={formData.primaryQualification}
            onChange={(e) => updateFormData({ primaryQualification: e.target.value })}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="">Select your highest medical degree</option>
            {qualifications.map(qual => (
              <option key={qual} value={qual}>
                {qual}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Your highest medical degree.
        </p>
      </div>

      {/* Medical Specialties */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Medical Specialties *
        </label>
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 max-h-48 overflow-y-auto bg-white dark:bg-gray-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {specialties.map(specialty => (
              <label key={specialty} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 p-2 rounded">
                <input
                  type="checkbox"
                  checked={formData.specialties.includes(specialty)}
                  onChange={(e) => handleSpecialtyChange(specialty, e.target.checked)}
                  className="w-4 h-4 text-[#0075A2] border-gray-300 dark:border-gray-600 rounded focus:ring-[#0075A2] focus:ring-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{specialty}</span>
              </label>
            ))}
          </div>
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Select all medical specialties in which you are qualified and practice.
        </p>
      </div>

      {/* Years of Experience */}
      <div>
        <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Years of Experience *
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="number"
            id="yearsOfExperience"
            value={formData.yearsOfExperience}
            onChange={(e) => updateFormData({ yearsOfExperience: parseInt(e.target.value) || 0 })}
            min="0"
            max="70"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder="0"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Number of years in active medical practice since obtaining your primary qualification.
        </p>
      </div>

      {/* Board Certifications */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Board Certifications (Optional)
        </label>
        <div className="space-y-3">
          {formData.boardCertifications.map((cert, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={cert}
                  onChange={(e) => updateBoardCertification(index, e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="e.g., American Board of Internal Medicine"
                />
              </div>
              {formData.boardCertifications.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeBoardCertification(index)}
                  className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addBoardCertification}
            className="flex items-center text-sm text-[#0075A2] dark:text-[#0EA5E9] hover:text-[#0A2647] dark:hover:text-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0075A2] rounded p-2"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Certification
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          List any board certifications you hold.
        </p>
      </div>
    </div>
  );
};

export default ProfessionalCredentialsStep;