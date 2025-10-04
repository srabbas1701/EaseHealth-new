import React from 'react';
import { Award, Upload, FileText, CreditCard, Calendar, Shield } from 'lucide-react';
import { DoctorFormData } from '../DoctorRegistrationForm';

interface ProfessionalVerificationStepProps {
  formData: DoctorFormData;
  updateFormData: (updates: Partial<DoctorFormData>) => void;
  errors: string[];
}

const ProfessionalVerificationStep: React.FC<ProfessionalVerificationStepProps> = ({
  formData,
  updateFormData,
  errors
}) => {
  const issuingCouncils = [
    'Andhra Pradesh Medical Council',
    'Arunachal Pradesh Medical Council',
    'Assam Medical Council',
    'Bihar Medical Council',
    'Chhattisgarh Medical Council',
    'Delhi Medical Council',
    'Goa Medical Council',
    'Gujarat Medical Council',
    'Haryana Medical Council',
    'Himachal Pradesh Medical Council',
    'Jharkhand Medical Council',
    'Karnataka Medical Council',
    'Kerala Medical Council',
    'Madhya Pradesh Medical Council',
    'Maharashtra Medical Council',
    'Manipur Medical Council',
    'Meghalaya Medical Council',
    'Mizoram Medical Council',
    'Nagaland Medical Council',
    'National Medical Commission (NMC)',
    'Odisha Medical Council',
    'Punjab Medical Council',
    'Rajasthan Medical Council',
    'Sikkim Medical Council',
    'Tamil Nadu Medical Council',
    'Telangana Medical Council',
    'Tripura Medical Council',
    'Uttar Pradesh Medical Council',
    'Uttarakhand Medical Council',
    'West Bengal Medical Council'
  ];

  const handleFileUpload = (field: keyof DoctorFormData, file: File | null) => {
    updateFormData({ [field]: file });
  };

  const handleAadhaarChange = (value: string) => {
    // Format Aadhaar number with spaces for better readability
    const formatted = value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
    updateFormData({ aadhaarNumber: formatted });
  };

  const handlePANChange = (value: string) => {
    // Format PAN number to uppercase
    const formatted = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    updateFormData({ panNumber: formatted });
  };

  return (
    <div className="space-y-8">
      {/* Medical Registration Section */}
      <div className="bg-gradient-to-br from-white dark:from-gray-800 to-[#F6F6F6] dark:to-gray-700 rounded-2xl p-8 shadow-lg border border-[#E8E8E8] dark:border-gray-600">
        <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-6 flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-xl flex items-center justify-center mr-3">
            <Award className="w-5 h-5 text-white" />
          </div>
          Medical Registration Details
        </h3>
        
        <div className="space-y-6">
          {/* Medical Registration Number */}
          <div>
            <label htmlFor="medicalRegistrationNumber" className="block text-sm font-semibold text-[#0A2647] dark:text-gray-100 mb-3">
              Medical Registration Number *
            </label>
            <input
              type="text"
              id="medicalRegistrationNumber"
              value={formData.medicalRegistrationNumber}
              onChange={(e) => updateFormData({ medicalRegistrationNumber: e.target.value })}
              className="w-full px-4 py-4 border-2 border-[#E8E8E8] dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-lg"
              placeholder="e.g., MCI-12345 or DMC-67890"
            />
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Please provide your registration number from the National Medical Commission (NMC) or your State Medical Council (SMC).
            </p>
          </div>

          {/* Issuing Council */}
          <div>
            <label htmlFor="issuingCouncil" className="block text-sm font-semibold text-[#0A2647] dark:text-gray-100 mb-3">
              Issuing Council *
            </label>
            <select
              id="issuingCouncil"
              value={formData.issuingCouncil}
              onChange={(e) => updateFormData({ issuingCouncil: e.target.value })}
              className="w-full px-4 py-4 border-2 border-[#E8E8E8] dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-lg"
            >
              <option value="">Select issuing council</option>
              {issuingCouncils.map(council => (
                <option key={council} value={council}>
                  {council}
                </option>
              ))}
            </select>
          </div>

          {/* Year of Registration */}
          <div>
            <label htmlFor="yearOfRegistration" className="block text-sm font-semibold text-[#0A2647] dark:text-gray-100 mb-3">
              Year of Registration *
            </label>
            <input
              type="number"
              id="yearOfRegistration"
              value={formData.yearOfRegistration}
              onChange={(e) => updateFormData({ yearOfRegistration: parseInt(e.target.value) || new Date().getFullYear() })}
              min="1950"
              max={new Date().getFullYear()}
              className="w-full px-4 py-4 border-2 border-[#E8E8E8] dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-lg"
            />
          </div>

          {/* Medical Registration Certificate Upload */}
          <div>
            <label className="block text-sm font-semibold text-[#0A2647] dark:text-gray-100 mb-3">
              Upload Medical Registration Certificate *
            </label>
            <div className="border-2 border-dashed border-[#E8E8E8] dark:border-gray-600 rounded-2xl p-8 text-center hover:border-[#0075A2] dark:hover:border-[#0EA5E9] hover:bg-[#F6F6F6] dark:hover:bg-gray-700 transition-all duration-200 group">
              <input
                type="file"
                id="medicalRegistrationCertificate"
                accept=".pdf,.jpg,.jpeg"
                onChange={(e) => handleFileUpload('medicalRegistrationCertificate', e.target.files?.[0] || null)}
                className="hidden"
              />
              <label htmlFor="medicalRegistrationCertificate" className="cursor-pointer">
                <div className="w-16 h-16 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <p className="text-lg font-medium text-[#0A2647] dark:text-gray-100 mb-2">
                  {formData.medicalRegistrationCertificate 
                    ? formData.medicalRegistrationCertificate.name 
                    : 'Click to upload PDF, JPG, or JPEG file'
                  }
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  PDF, JPG, JPEG format only
                </p>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Identity Verification Section */}
      <div className="bg-gradient-to-br from-white dark:from-gray-800 to-[#F6F6F6] dark:to-gray-700 rounded-2xl p-8 shadow-lg border border-[#E8E8E8] dark:border-gray-600">
        <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-6 flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-xl flex items-center justify-center mr-3">
            <Shield className="w-5 h-5 text-white" />
          </div>
          Identity Verification (KYC)
        </h3>
        
        <div className="space-y-6">
          {/* Aadhaar Card Number */}
          <div>
            <label htmlFor="aadhaarNumber" className="block text-sm font-semibold text-[#0A2647] dark:text-gray-100 mb-3">
              Aadhaar Card Number *
            </label>
            <input
              type="text"
              id="aadhaarNumber"
              value={formData.aadhaarNumber}
              onChange={(e) => handleAadhaarChange(e.target.value)}
              className="w-full px-4 py-4 border-2 border-[#E8E8E8] dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-lg"
              placeholder="1234 5678 9012"
              maxLength={14}
            />
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              For KYC verification only. Information will be stored securely and encrypted.
            </p>
          </div>

          {/* Aadhaar Card Uploads */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-[#0A2647] dark:text-gray-100 mb-3">
                Aadhaar Card Front *
              </label>
              <div className="border-2 border-dashed border-[#E8E8E8] dark:border-gray-600 rounded-2xl p-6 text-center hover:border-[#0075A2] dark:hover:border-[#0EA5E9] hover:bg-[#F6F6F6] dark:hover:bg-gray-700 transition-all duration-200 group">
                <input
                  type="file"
                  id="aadhaarFront"
                  accept=".jpg,.jpeg"
                  onChange={(e) => handleFileUpload('aadhaarFront', e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label htmlFor="aadhaarFront" className="cursor-pointer">
                  <div className="w-12 h-12 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-200">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm font-medium text-[#0A2647] dark:text-gray-100">
                    {formData.aadhaarFront ? formData.aadhaarFront.name : 'Upload Front'}
                  </p>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#0A2647] dark:text-gray-100 mb-3">
                Aadhaar Card Back *
              </label>
              <div className="border-2 border-dashed border-[#E8E8E8] dark:border-gray-600 rounded-2xl p-6 text-center hover:border-[#0075A2] dark:hover:border-[#0EA5E9] hover:bg-[#F6F6F6] dark:hover:bg-gray-700 transition-all duration-200 group">
                <input
                  type="file"
                  id="aadhaarBack"
                  accept=".jpg,.jpeg"
                  onChange={(e) => handleFileUpload('aadhaarBack', e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label htmlFor="aadhaarBack" className="cursor-pointer">
                  <div className="w-12 h-12 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-200">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm font-medium text-[#0A2647] dark:text-gray-100">
                    {formData.aadhaarBack ? formData.aadhaarBack.name : 'Upload Back'}
                  </p>
                </label>
              </div>
            </div>
          </div>

          {/* PAN Card Number */}
          <div>
            <label htmlFor="panNumber" className="block text-sm font-semibold text-[#0A2647] dark:text-gray-100 mb-3">
              PAN Card Number *
            </label>
            <input
              type="text"
              id="panNumber"
              value={formData.panNumber}
              onChange={(e) => handlePANChange(e.target.value)}
              className="w-full px-4 py-4 border-2 border-[#E8E8E8] dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-lg"
              placeholder="ABCDE1234F"
              maxLength={10}
            />
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Required for financial transactions and TDS deductions.
            </p>
          </div>

          {/* PAN Card Upload */}
          <div>
            <label className="block text-sm font-semibold text-[#0A2647] dark:text-gray-100 mb-3">
              Upload PAN Card *
            </label>
            <div className="border-2 border-dashed border-[#E8E8E8] dark:border-gray-600 rounded-2xl p-8 text-center hover:border-[#0075A2] dark:hover:border-[#0EA5E9] hover:bg-[#F6F6F6] dark:hover:bg-gray-700 transition-all duration-200 group">
              <input
                type="file"
                id="panCard"
                accept=".jpg,.jpeg"
                onChange={(e) => handleFileUpload('panCard', e.target.files?.[0] || null)}
                className="hidden"
              />
              <label htmlFor="panCard" className="cursor-pointer">
                <div className="w-16 h-16 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                  <CreditCard className="w-8 h-8 text-white" />
                </div>
                <p className="text-lg font-medium text-[#0A2647] dark:text-gray-100 mb-2">
                  {formData.panCard ? formData.panCard.name : 'Click to upload PAN card image'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  JPG, JPEG format only
                </p>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-gradient-to-r from-green-50 dark:from-green-900/20 to-blue-50 dark:to-blue-900/20 border-2 border-green-200 dark:border-green-800 rounded-2xl p-6 shadow-lg">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-[#0A2647] dark:text-gray-100 mb-2">Secure Storage</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              All uploaded documents are encrypted and stored securely. Your personal information is protected according to DPDP compliance standards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalVerificationStep;

