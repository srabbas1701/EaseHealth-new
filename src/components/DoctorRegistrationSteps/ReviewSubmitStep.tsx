import React from 'react';
import { CheckCircle, Edit, User, Award, MapPin, Shield } from 'lucide-react';
import { DoctorFormData } from '../DoctorRegistrationForm';

interface ReviewSubmitStepProps {
  formData: DoctorFormData;
  updateFormData: (updates: Partial<DoctorFormData>) => void;
  errors: string[];
}

const ReviewSubmitStep: React.FC<ReviewSubmitStepProps> = ({
  formData,
  updateFormData,
  errors
}) => {
  return (
    <div className="space-y-6">
      {/* Account Details Review */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#0A2647] dark:text-gray-100 flex items-center">
            <User className="w-5 h-5 mr-2 text-[#0075A2] dark:text-[#0EA5E9]" />
            Account Details
          </h3>
          <button className="text-sm text-[#0075A2] dark:text-[#0EA5E9] hover:text-[#0A2647] dark:hover:text-gray-100 flex items-center">
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-600 dark:text-gray-400">Full Name:</span>
            <p className="text-gray-900 dark:text-gray-100">{formData.fullName}</p>
          </div>
          <div>
            <span className="font-medium text-gray-600 dark:text-gray-400">Email:</span>
            <p className="text-gray-900 dark:text-gray-100">{formData.email}</p>
          </div>
          <div>
            <span className="font-medium text-gray-600 dark:text-gray-400">Phone:</span>
            <p className="text-gray-900 dark:text-gray-100">{formData.phoneNumber}</p>
          </div>
        </div>
      </div>

      {/* Professional Credentials Review */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#0A2647] dark:text-gray-100 flex items-center">
            <Award className="w-5 h-5 mr-2 text-[#0075A2] dark:text-[#0EA5E9]" />
            Professional Credentials
          </h3>
          <button className="text-sm text-[#0075A2] dark:text-[#0EA5E9] hover:text-[#0A2647] dark:hover:text-gray-100 flex items-center">
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-600 dark:text-gray-400">License Number:</span>
            <p className="text-gray-900 dark:text-gray-100">{formData.licenseNumber}</p>
          </div>
          <div>
            <span className="font-medium text-gray-600 dark:text-gray-400">Issuing Authority:</span>
            <p className="text-gray-900 dark:text-gray-100">{formData.issuingAuthority}</p>
          </div>
          <div>
            <span className="font-medium text-gray-600 dark:text-gray-400">Primary Qualification:</span>
            <p className="text-gray-900 dark:text-gray-100">{formData.primaryQualification}</p>
          </div>
          <div>
            <span className="font-medium text-gray-600 dark:text-gray-400">Years of Experience:</span>
            <p className="text-gray-900 dark:text-gray-100">{formData.yearsOfExperience} years</p>
          </div>
          <div className="md:col-span-2">
            <span className="font-medium text-gray-600 dark:text-gray-400">Specialties:</span>
            <p className="text-gray-900 dark:text-gray-100">{formData.specialties.join(', ')}</p>
          </div>
          {formData.boardCertifications.filter(cert => cert.trim()).length > 0 && (
            <div className="md:col-span-2">
              <span className="font-medium text-gray-600 dark:text-gray-400">Board Certifications:</span>
              <ul className="text-gray-900 dark:text-gray-100 list-disc list-inside">
                {formData.boardCertifications.filter(cert => cert.trim()).map((cert, index) => (
                  <li key={index}>{cert}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Practice Information Review */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#0A2647] dark:text-gray-100 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-[#0075A2] dark:text-[#0EA5E9]" />
            Practice Information
          </h3>
          <button className="text-sm text-[#0075A2] dark:text-[#0EA5E9] hover:text-[#0A2647] dark:hover:text-gray-100 flex items-center">
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </button>
        </div>
        <div className="space-y-4 text-sm">
          <div>
            <span className="font-medium text-gray-600 dark:text-gray-400">Primary Practice Address:</span>
            <p className="text-gray-900 dark:text-gray-100 whitespace-pre-line">{formData.practiceAddress}</p>
          </div>
          {formData.hospitalAffiliations.filter(aff => aff.trim()).length > 0 && (
            <div>
              <span className="font-medium text-gray-600 dark:text-gray-400">Hospital Affiliations:</span>
              <ul className="text-gray-900 dark:text-gray-100 list-disc list-inside">
                {formData.hospitalAffiliations.filter(aff => aff.trim()).map((aff, index) => (
                  <li key={index}>{aff}</li>
                ))}
              </ul>
            </div>
          )}
          {formData.insuranceNetworks.length > 0 && (
            <div>
              <span className="font-medium text-gray-600 dark:text-gray-400">Insurance Networks:</span>
              <p className="text-gray-900 dark:text-gray-100">{formData.insuranceNetworks.join(', ')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-[#0A2647] dark:text-gray-100 flex items-center mb-4">
          <Shield className="w-5 h-5 mr-2 text-[#0075A2] dark:text-[#0EA5E9]" />
          Terms & Conditions
        </h3>
        <div className="space-y-4">
          <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            <p className="mb-3">
              By submitting this registration, you agree to:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Provide accurate and up-to-date professional information</li>
              <li>Maintain valid medical licenses and certifications</li>
              <li>Comply with EaseHealth AI's professional standards and guidelines</li>
              <li>Protect patient privacy and maintain confidentiality</li>
              <li>Use the platform responsibly for patient care coordination</li>
            </ul>
          </div>
          
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="termsAccepted"
              checked={formData.termsAccepted}
              onChange={(e) => updateFormData({ termsAccepted: e.target.checked })}
              className="mt-1 w-4 h-4 text-[#0075A2] border-gray-300 dark:border-gray-600 rounded focus:ring-[#0075A2] focus:ring-2"
            />
            <label htmlFor="termsAccepted" className="text-sm text-gray-700 dark:text-gray-300">
              I have read, understood, and agree to the{' '}
              <a href="#" className="text-[#0075A2] dark:text-[#0EA5E9] hover:underline">
                EaseHealth AI Doctor Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-[#0075A2] dark:text-[#0EA5E9] hover:underline">
                Privacy Policy
              </a>
              . *
            </label>
          </div>
        </div>
      </div>

      {/* Verification Notice */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-start">
          <CheckCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
              Account Verification Required
            </h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              After submission, your account will be reviewed by our medical verification team. 
              You'll receive an email notification once your account is approved and activated. 
              This process typically takes 1-2 business days.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewSubmitStep;