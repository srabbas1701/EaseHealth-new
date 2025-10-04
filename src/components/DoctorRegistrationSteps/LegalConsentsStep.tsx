import React from 'react';
import { FileText, Shield, CheckCircle, ExternalLink } from 'lucide-react';
import { DoctorFormData } from '../DoctorRegistrationForm';

interface LegalConsentsStepProps {
  formData: DoctorFormData;
  updateFormData: (updates: Partial<DoctorFormData>) => void;
  errors: string[];
}

const LegalConsentsStep: React.FC<LegalConsentsStepProps> = ({
  formData,
  updateFormData,
  errors
}) => {
  return (
    <div className="space-y-6">
      {/* Terms and Conditions */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2 text-[#0075A2]" />
          Legal Agreements
        </h3>
        
        <div className="space-y-4">
          {/* Terms and Conditions */}
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="termsAccepted"
              checked={formData.termsAccepted}
              onChange={(e) => updateFormData({ termsAccepted: e.target.checked })}
              className="w-5 h-5 text-[#0075A2] border-gray-300 dark:border-gray-600 rounded focus:ring-[#0075A2] focus:ring-2 mt-0.5"
            />
            <div className="flex-1">
              <label htmlFor="termsAccepted" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                I agree to the Terms and Conditions of EaseHealth AI *
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                By checking this box, you acknowledge that you have read, understood, and agree to be bound by our Terms and Conditions.
              </p>
              <a
                href="#"
                className="inline-flex items-center text-xs text-[#0075A2] dark:text-[#0EA5E9] hover:underline mt-1"
              >
                Read Terms and Conditions
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>
          </div>

          {/* Privacy Policy */}
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="privacyPolicyAccepted"
              checked={formData.privacyPolicyAccepted}
              onChange={(e) => updateFormData({ privacyPolicyAccepted: e.target.checked })}
              className="w-5 h-5 text-[#0075A2] border-gray-300 dark:border-gray-600 rounded focus:ring-[#0075A2] focus:ring-2 mt-0.5"
            />
            <div className="flex-1">
              <label htmlFor="privacyPolicyAccepted" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                I have read and understood the Privacy Policy *
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                You acknowledge that you have read and understood how we collect, use, and protect your personal information.
              </p>
              <a
                href="#"
                className="inline-flex items-center text-xs text-[#0075A2] dark:text-[#0EA5E9] hover:underline mt-1"
              >
                Read Privacy Policy
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>
          </div>

          {/* Telemedicine Consent */}
          {(formData.consultationTypes.includes('Video') || formData.consultationTypes.includes('Audio')) && (
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="telemedicineConsent"
                checked={formData.telemedicineConsent}
                onChange={(e) => updateFormData({ telemedicineConsent: e.target.checked })}
                className="w-5 h-5 text-[#0075A2] border-gray-300 dark:border-gray-600 rounded focus:ring-[#0075A2] focus:ring-2 mt-0.5"
              />
              <div className="flex-1">
                <label htmlFor="telemedicineConsent" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                  I agree to abide by the Telemedicine Practice Guidelines *
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  You agree to follow the Telemedicine Practice Guidelines issued by the NMC & MoHFW, India for video and audio consultations.
                </p>
                <a
                  href="#"
                  className="inline-flex items-center text-xs text-[#0075A2] dark:text-[#0EA5E9] hover:underline mt-1"
                >
                  Read Telemedicine Guidelines
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Data Protection Notice */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
              Data Protection & Privacy
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              EaseHealth AI is fully compliant with the Digital Personal Data Protection Act (DPDP) 2023. 
              All your personal and professional data is encrypted, stored securely, and used only for the purposes 
              you have consented to. We never share your data with third parties without your explicit consent.
            </p>
          </div>
        </div>
      </div>

      {/* Verification Process Notice */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-start">
          <CheckCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
              Verification Process
            </h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              After submission, your profile will be reviewed by our verification team. This process typically takes 24-48 hours. 
              You will receive an email notification once your profile is approved and activated. During this time, 
              you can save your progress and return to complete any missing information.
            </p>
          </div>
        </div>
      </div>

      {/* Professional Responsibility */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Professional Responsibilities
        </h3>
        
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <p>I understand that I am responsible for maintaining the accuracy of all information provided.</p>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <p>I will promptly update any changes to my professional credentials or practice information.</p>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <p>I will maintain professional standards and ethical practices in all patient interactions.</p>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <p>I understand that providing false information may result in account suspension or termination.</p>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <p>I will comply with all applicable medical laws and regulations in my jurisdiction.</p>
          </div>
        </div>
      </div>

      {/* Final Confirmation */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-start">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
              Ready to Submit
            </h4>
            <p className="text-sm text-green-700 dark:text-green-300">
              By submitting this registration form, you confirm that all information provided is accurate and complete. 
              You understand that EaseHealth AI will verify your credentials and may contact you for additional information if needed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalConsentsStep;

