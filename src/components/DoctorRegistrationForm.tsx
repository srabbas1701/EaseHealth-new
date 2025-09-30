import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, CheckCircle, AlertCircle } from 'lucide-react';
import AccountDetailsStep from './DoctorRegistrationSteps/AccountDetailsStep';
import ProfessionalCredentialsStep from './DoctorRegistrationSteps/ProfessionalCredentialsStep';
import PracticeInformationStep from './DoctorRegistrationSteps/PracticeInformationStep';
import ReviewSubmitStep from './DoctorRegistrationSteps/ReviewSubmitStep';
import { supabase } from '../utils/supabase';

interface DoctorRegistrationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId?: string;
}

export interface DoctorFormData {
  // Step 1: Account & Personal Details
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  
  // Step 2: Professional Credentials
  licenseNumber: string;
  issuingAuthority: string;
  issuingCountry: string;
  primaryQualification: string;
  specialties: string[];
  yearsOfExperience: number;
  boardCertifications: string[];
  
  // Step 3: Practice Information
  practiceAddress: string;
  hospitalAffiliations: string[];
  insuranceNetworks: string[];
  
  // Step 4: Terms & Consent
  termsAccepted: boolean;
}

const initialFormData: DoctorFormData = {
  fullName: '',
  email: '',
  phoneNumber: '',
  password: '',
  confirmPassword: '',
  licenseNumber: '',
  issuingAuthority: '',
  issuingCountry: 'India',
  primaryQualification: '',
  specialties: [],
  yearsOfExperience: 0,
  boardCertifications: [''],
  practiceAddress: '',
  hospitalAffiliations: [''],
  insuranceNetworks: [],
  termsAccepted: false
};

const DoctorRegistrationForm: React.FC<DoctorRegistrationFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userId
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<DoctorFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [stepErrors, setStepErrors] = useState<Record<number, string[]>>({});

  const totalSteps = 4;

  const stepTitles = {
    1: 'Create Your Doctor Account',
    2: 'Your Professional Qualifications',
    3: 'Your Practice Details',
    4: 'Review & Submit'
  };

  const stepDescriptions = {
    1: 'Start by setting up your secure EaseHealth AI account.',
    2: 'Tell us about your medical background and areas of expertise.',
    3: 'Provide details about where and how you practice.',
    4: 'Please review all your details carefully. You can go back to make changes if needed.'
  };

  // Update form data
  const updateFormData = (updates: Partial<DoctorFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    // Clear step errors when data is updated
    if (stepErrors[currentStep]) {
      setStepErrors(prev => ({ ...prev, [currentStep]: [] }));
    }
  };

  // Validate current step
  const validateCurrentStep = (): boolean => {
    const errors: string[] = [];

    switch (currentStep) {
      case 1:
        if (!formData.fullName.trim()) errors.push('Full name is required');
        if (!formData.email.trim()) errors.push('Email address is required');
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.push('Please enter a valid email address');
        if (!formData.phoneNumber.trim()) errors.push('Phone number is required');
        else if (!/^\d{10}$/.test(formData.phoneNumber.replace(/\D/g, ''))) errors.push('Please enter a valid 10-digit phone number');
        if (!formData.password) errors.push('Password is required');
        else if (formData.password.length < 8) errors.push('Password must be at least 8 characters');
        else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) errors.push('Password must contain uppercase, lowercase, and number');
        if (formData.password !== formData.confirmPassword) errors.push('Passwords do not match');
        break;

      case 2:
        if (!formData.licenseNumber.trim()) errors.push('Medical license number is required');
        if (!formData.issuingAuthority.trim()) errors.push('Issuing authority is required');
        if (!formData.primaryQualification) errors.push('Primary qualification is required');
        if (formData.specialties.length === 0) errors.push('At least one specialty must be selected');
        if (formData.yearsOfExperience < 0 || formData.yearsOfExperience > 70) errors.push('Years of experience must be between 0 and 70');
        break;

      case 3:
        if (!formData.practiceAddress.trim()) errors.push('Primary practice address is required');
        break;

      case 4:
        if (!formData.termsAccepted) errors.push('You must accept the terms and conditions');
        break;
    }

    if (errors.length > 0) {
      setStepErrors(prev => ({ ...prev, [currentStep]: errors }));
      return false;
    }

    setStepErrors(prev => ({ ...prev, [currentStep]: [] }));
    return true;
  };

  // Handle next step
  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  // Handle previous step
  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      // Ensure we attach doctor profile to the CURRENT logged-in user
      let finalUserId = userId;
      
      if (!finalUserId && supabase?.auth?.getUser) {
        const { data } = await supabase.auth.getUser();
        if (data?.user?.id) {
          finalUserId = data.user.id;
        }
      }

      // As a last resort (only if absolutely necessary), create an account
      if (!finalUserId) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Failed to create user account');
        
        finalUserId = authData.user.id;
      }

      // Create doctor profile
      const doctorData = {
        user_id: finalUserId,
        full_name: formData.fullName,
        email: formData.email,
        phone_number: formData.phoneNumber,
        specialty: formData.specialties[0], // Primary specialty
        license_number: formData.licenseNumber,
        experience_years: formData.yearsOfExperience,
        qualification: formData.primaryQualification,
        hospital_affiliation: formData.hospitalAffiliations.filter(h => h.trim()).join(', '),
        consultation_fee: 500, // Default fee
        is_verified: false, // Will be verified by admin
        is_active: true
      };

      const { error: doctorError } = await supabase
        .from('doctors')
        .insert([doctorData]);

      if (doctorError) throw doctorError;

      onSuccess();
    } catch (error) {
      console.error('Doctor registration error:', error);
      setSubmitError(error instanceof Error ? error.message : 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Render current step component
  const renderCurrentStep = () => {
    const commonProps = {
      formData,
      updateFormData,
      errors: stepErrors[currentStep] || []
    };

    switch (currentStep) {
      case 1:
        return <AccountDetailsStep {...commonProps} />;
      case 2:
        return <ProfessionalCredentialsStep {...commonProps} />;
      case 3:
        return <PracticeInformationStep {...commonProps} />;
      case 4:
        return <ReviewSubmitStep {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative p-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0075A2]"
            aria-label="Close registration form"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[#0A2647] dark:text-gray-100 mb-2">
              Doctor Registration
            </h2>
            <div className="flex items-center justify-center space-x-2 mb-4">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div key={i} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    i + 1 < currentStep 
                      ? 'bg-green-500 text-white' 
                      : i + 1 === currentStep 
                        ? 'bg-[#0075A2] dark:bg-[#0EA5E9] text-white' 
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                  }`}>
                    {i + 1 < currentStep ? <CheckCircle className="w-4 h-4" /> : i + 1}
                  </div>
                  {i < totalSteps - 1 && (
                    <div className={`w-8 h-0.5 mx-2 ${
                      i + 1 < currentStep ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Step {currentStep} of {totalSteps}: {stepTitles[currentStep as keyof typeof stepTitles]}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step Description */}
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-[#0A2647] dark:text-gray-100 mb-2">
              {stepTitles[currentStep as keyof typeof stepTitles]}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {stepDescriptions[currentStep as keyof typeof stepDescriptions]}
            </p>
          </div>

          {/* Step Errors */}
          {stepErrors[currentStep] && stepErrors[currentStep].length > 0 && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                    Please fix the following errors:
                  </h4>
                  <ul className="text-sm text-red-700 dark:text-red-300 list-disc list-inside">
                    {stepErrors[currentStep].map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Submit Error */}
          {submitError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                {submitError}
              </p>
            </div>
          )}

          {/* Current Step Content */}
          <div className="mb-8">
            {renderCurrentStep()}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="flex items-center px-6 py-3 text-gray-600 dark:text-gray-300 hover:text-[#0075A2] dark:hover:text-[#0EA5E9] disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-[#0075A2] rounded-lg"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </button>

            {currentStep < totalSteps ? (
              <button
                onClick={handleNext}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] text-white rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:ring-offset-2"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:transform-none disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Submit Registration
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorRegistrationForm;