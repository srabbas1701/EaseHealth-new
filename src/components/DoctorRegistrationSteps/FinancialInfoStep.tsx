import React from 'react';
import { CreditCard, Building, Upload, DollarSign, Shield } from 'lucide-react';
import { DoctorFormData } from '../DoctorRegistrationForm';

interface FinancialInfoStepProps {
  formData: DoctorFormData;
  updateFormData: (updates: Partial<DoctorFormData>) => void;
  errors: string[];
}

const FinancialInfoStep: React.FC<FinancialInfoStepProps> = ({
  formData,
  updateFormData,
  errors
}) => {
  const handleFileUpload = (field: keyof DoctorFormData, file: File | null) => {
    updateFormData({ [field]: file });
  };

  const handleBankAccountChange = (value: string) => {
    // Remove non-numeric characters and limit to reasonable length
    const cleaned = value.replace(/\D/g, '').slice(0, 20);
    updateFormData({ bankAccountNumber: cleaned });
  };

  const handleConfirmBankAccountChange = (value: string) => {
    // Remove non-numeric characters and limit to reasonable length
    const cleaned = value.replace(/\D/g, '').slice(0, 20);
    updateFormData({ confirmBankAccountNumber: cleaned });
  };

  const handleIFSCChange = (value: string) => {
    // Format IFSC code to uppercase
    const formatted = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    updateFormData({ ifscCode: formatted });
  };

  return (
    <div className="space-y-6">
      {/* Security Notice */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-start">
          <Shield className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
              Secure Financial Information
            </h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              This section is required if you are processing payments on behalf of the doctor. All financial information is encrypted and stored securely.
            </p>
          </div>
        </div>
      </div>

      {/* Bank Account Details */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <CreditCard className="w-5 h-5 mr-2 text-[#0075A2]" />
          Bank Account Information
        </h3>
        
        <div className="space-y-4">
          {/* Bank Account Holder Name */}
          <div>
            <label htmlFor="bankAccountHolderName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bank Account Holder's Name *
            </label>
            <input
              type="text"
              id="bankAccountHolderName"
              value={formData.bankAccountHolderName}
              onChange={(e) => updateFormData({ bankAccountHolderName: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Enter account holder name (must match your full name)"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Must match your full name as per official records.
            </p>
          </div>

          {/* Bank Account Number */}
          <div>
            <label htmlFor="bankAccountNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bank Account Number *
            </label>
            <input
              type="text"
              id="bankAccountNumber"
              value={formData.bankAccountNumber}
              onChange={(e) => handleBankAccountChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Enter bank account number"
            />
          </div>

          {/* Re-enter Bank Account Number */}
          <div>
            <label htmlFor="confirmBankAccountNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Re-enter Bank Account Number *
            </label>
            <input
              type="text"
              id="confirmBankAccountNumber"
              value={formData.confirmBankAccountNumber}
              onChange={(e) => handleConfirmBankAccountChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Re-enter bank account number for confirmation"
            />
            {formData.bankAccountNumber && formData.confirmBankAccountNumber && 
             formData.bankAccountNumber !== formData.confirmBankAccountNumber && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                Bank account numbers do not match.
              </p>
            )}
          </div>

          {/* IFSC Code */}
          <div>
            <label htmlFor="ifscCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              IFSC Code *
            </label>
            <input
              type="text"
              id="ifscCode"
              value={formData.ifscCode}
              onChange={(e) => handleIFSCChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="e.g., SBIN0001234"
              maxLength={11}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Format: 4 letters + 0 + 6 characters (e.g., SBIN0001234)
            </p>
          </div>

          {/* Bank Name & Branch */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bank Name *
              </label>
              <input
                type="text"
                id="bankName"
                value={formData.bankName}
                onChange={(e) => updateFormData({ bankName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="Enter bank name"
              />
            </div>
            
            <div>
              <label htmlFor="bankBranch" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bank Branch *
              </label>
              <input
                type="text"
                id="bankBranch"
                value={formData.bankBranch}
                onChange={(e) => updateFormData({ bankBranch: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="Enter branch name"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Cancelled Cheque Upload */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <Upload className="w-5 h-5 mr-2 text-[#0075A2]" />
          Bank Verification Document
        </h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Upload Scanned Copy of Cancelled Cheque *
          </label>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-[#0075A2] dark:hover:border-[#0EA5E9] transition-colors">
            <input
              type="file"
              id="cancelledCheque"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => handleFileUpload('cancelledCheque', e.target.files?.[0] || null)}
              className="hidden"
            />
            <label htmlFor="cancelledCheque" className="cursor-pointer">
              <Building className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {formData.cancelledCheque ? formData.cancelledCheque.name : 'Click to upload cancelled cheque'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                This is a standard verification practice in India. PDF, JPG, PNG format.
              </p>
            </label>
          </div>
        </div>
      </div>

      {/* Payment Information */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start">
          <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
              Payment Processing
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Your bank account will be used for receiving payments from patients. All transactions are processed securely through our payment gateway partners.
            </p>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-start">
          <Shield className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
              Data Security
            </h4>
            <p className="text-sm text-green-700 dark:text-green-300">
              All financial information is encrypted using industry-standard encryption and stored securely. We comply with all financial data protection regulations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialInfoStep;

