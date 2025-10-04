import React from 'react';
import { FileText, Shield, CheckCircle, ExternalLink } from 'lucide-react';
import { DoctorFormData } from '../../types/DoctorFormData';

interface LegalConsentsSectionProps {
  formData: DoctorFormData;
  updateFormData: (updates: Partial<DoctorFormData>) => void;
  errors: Record<string, string[]>;
}

const LegalConsentsSection: React.FC<LegalConsentsSectionProps> = ({
  formData,
  updateFormData,
  errors
}) => {
  return (
    <div className="space-y-8">
      {/* Terms and Conditions */}
      <div className="bg-gradient-to-br from-white dark:from-gray-800 to-[#F6F6F6] dark:to-gray-700 rounded-2xl p-8 shadow-lg border border-[#E8E8E8] dark:border-gray-600">
        <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-6 flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-xl flex items-center justify-center mr-3">
            <FileText className="w-5 h-5 text-white" />
          </div>
          Legal Agreements
        </h3>
        
        <div className="space-y-6">
          {/* Terms and Conditions */}
          <div className="flex items-start space-x-4">
            <input
              type="checkbox"
              id="termsAccepted"
              checked={formData.termsAccepted}
              onChange={(e) => updateFormData({ termsAccepted: e.target.checked })}
              className={`w-6 h-6 text-[#0075A2] border-2 rounded-lg focus:ring-[#0075A2] focus:ring-2 mt-1 ${
                errors.termsAccepted ? 'border-red-500' : 'border-[#E8E8E8] dark:border-gray-600'
              }`}
            />
            <div className="flex-1">
              <label htmlFor="termsAccepted" className="text-lg font-semibold text-[#0A2647] dark:text-gray-100 cursor-pointer">
                I agree to the Terms and Conditions of EaseHealth AI *
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                By checking this box, you acknowledge that you have read, understood, and agree to be bound by our Terms and Conditions.
              </p>
              <a
                href="#"
                className="inline-flex items-center text-sm text-[#0075A2] dark:text-[#0EA5E9] hover:underline mt-2"
              >
                Read Terms and Conditions
                <ExternalLink className="w-4 h-4 ml-1" />
              </a>
              {errors.termsAccepted && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.termsAccepted[0]}</p>
              )}
            </div>
          </div>

          {/* Privacy Policy */}
          <div className="flex items-start space-x-4">
            <input
              type="checkbox"
              id="privacyPolicyAccepted"
              checked={formData.privacyPolicyAccepted}
              onChange={(e) => updateFormData({ privacyPolicyAccepted: e.target.checked })}
              className={`w-6 h-6 text-[#0075A2] border-2 rounded-lg focus:ring-[#0075A2] focus:ring-2 mt-1 ${
                errors.privacyPolicyAccepted ? 'border-red-500' : 'border-[#E8E8E8] dark:border-gray-600'
              }`}
            />
            <div className="flex-1">
              <label htmlFor="privacyPolicyAccepted" className="text-lg font-semibold text-[#0A2647] dark:text-gray-100 cursor-pointer">
                I have read and understood the Privacy Policy *
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                You acknowledge that you have read and understood how we collect, use, and protect your personal information.
              </p>
              <a
                href="#"
                className="inline-flex items-center text-sm text-[#0075A2] dark:text-[#0EA5E9] hover:underline mt-2"
              >
                Read Privacy Policy
                <ExternalLink className="w-4 h-4 ml-1" />
              </a>
              {errors.privacyPolicyAccepted && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.privacyPolicyAccepted[0]}</p>
              )}
            </div>
          </div>

          {/* Telemedicine Consent */}
          {(formData.consultationTypes.includes('Video') || formData.consultationTypes.includes('Audio')) && (
            <div className="flex items-start space-x-4">
              <input
                type="checkbox"
                id="telemedicineConsent"
                checked={formData.telemedicineConsent}
                onChange={(e) => updateFormData({ telemedicineConsent: e.target.checked })}
                className={`w-6 h-6 text-[#0075A2] border-2 rounded-lg focus:ring-[#0075A2] focus:ring-2 mt-1 ${
                  errors.telemedicineConsent ? 'border-red-500' : 'border-[#E8E8E8] dark:border-gray-600'
                }`}
              />
              <div className="flex-1">
                <label htmlFor="telemedicineConsent" className="text-lg font-semibold text-[#0A2647] dark:text-gray-100 cursor-pointer">
                  I agree to abide by the Telemedicine Practice Guidelines *
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  You agree to follow the Telemedicine Practice Guidelines issued by the NMC & MoHFW, India for video and audio consultations.
                </p>
                <a
                  href="#"
                  className="inline-flex items-center text-sm text-[#0075A2] dark:text-[#0EA5E9] hover:underline mt-2"
                >
                  Read Telemedicine Guidelines
                  <ExternalLink className="w-4 h-4 ml-1" />
                </a>
                {errors.telemedicineConsent && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.telemedicineConsent[0]}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Data Protection Notice */}
      <div className="bg-gradient-to-r from-blue-50 dark:from-blue-900/20 to-indigo-50 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-6 shadow-lg">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-[#0A2647] dark:text-gray-100 mb-2">
              Data Protection & Privacy
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              EaseHealth AI is fully compliant with the Digital Personal Data Protection Act (DPDP) 2023. 
              All your personal and professional data is encrypted, stored securely, and used only for the purposes 
              you have consented to. We never share your data with third parties without your explicit consent.
            </p>
          </div>
        </div>
      </div>

      {/* Verification Process Notice */}
      <div className="bg-gradient-to-r from-yellow-50 dark:from-yellow-900/20 to-orange-50 dark:to-orange-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-2xl p-6 shadow-lg">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-[#0A2647] dark:text-gray-100 mb-2">
              Verification Process
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              After submission, your profile will be reviewed by our verification team. This process typically takes 24-48 hours. 
              You will receive an email notification once your profile is approved and activated. During this time, 
              you can save your progress and return to complete any missing information.
            </p>
          </div>
        </div>
      </div>

      {/* Professional Responsibility */}
      <div className="bg-gradient-to-br from-white dark:from-gray-800 to-[#F6F6F6] dark:to-gray-700 rounded-2xl p-8 shadow-lg border border-[#E8E8E8] dark:border-gray-600">
        <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-6">
          Professional Responsibilities
        </h3>
        
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <p>I understand that I am responsible for maintaining the accuracy of all information provided.</p>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <p>I will promptly update any changes to my professional credentials or practice information.</p>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <p>I will maintain professional standards and ethical practices in all patient interactions.</p>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <p>I understand that providing false information may result in account suspension or termination.</p>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <p>I will comply with all applicable medical laws and regulations in my jurisdiction.</p>
          </div>
        </div>
      </div>

      {/* Final Confirmation */}
      <div className="bg-gradient-to-r from-green-50 dark:from-green-900/20 to-emerald-50 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 rounded-2xl p-6 shadow-lg">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-[#0A2647] dark:text-gray-100 mb-2">
              Ready to Submit
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              By submitting this registration form, you confirm that all information provided is accurate and complete. 
              You understand that EaseHealth AI will verify your credentials and may contact you for additional information if needed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalConsentsSection;
