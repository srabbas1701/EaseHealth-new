import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, CheckCircle, AlertCircle, Upload } from 'lucide-react';
import BasicAccountStep from './DoctorRegistrationSteps/BasicAccountStep';
import ProfessionalVerificationStep from './DoctorRegistrationSteps/ProfessionalVerificationStep';
import ClinicalProfileStep from './DoctorRegistrationSteps/ClinicalProfileStep';
import PracticeSettingsStep from './DoctorRegistrationSteps/PracticeSettingsStep';
import FinancialInfoStep from './DoctorRegistrationSteps/FinancialInfoStep';
import LegalConsentsStep from './DoctorRegistrationSteps/LegalConsentsStep';
import { supabase } from '../utils/supabase';
import { 
  uploadDoctorDocument, 
  DoctorDocumentType, 
  DoctorUploadResponse 
} from '../utils/doctorFileUploadUtils';

interface DoctorRegistrationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId?: string;
  prefillData?: {
    fullName?: string;
    email?: string;
    mobileNumber?: string;
  };
}

export interface DoctorFormData {
  // Section 1: Basic Account Creation
  fullName: string;
  email: string;
  mobileNumber: string;
  password: string;
  confirmPassword: string;
  
  // Section 2: Professional & Identity Verification
  medicalRegistrationNumber: string;
  issuingCouncil: string;
  yearOfRegistration: number;
  medicalRegistrationCertificate: File | null;
  medicalRegistrationCertificateUrl?: string;
  aadhaarNumber: string;
  aadhaarFront: File | null;
  aadhaarFrontUrl?: string;
  aadhaarBack: File | null;
  aadhaarBackUrl?: string;
  panNumber: string;
  panCard: File | null;
  panCardUrl?: string;
  
  // Section 3: Clinical & Public Profile Details
  profilePicture: File | null;
  profilePictureUrl?: string;
  specialization: string[];
  superSpecialization: string;
  qualifications: Array<{
    degree: string;
    medicalCollege: string;
    yearOfCompletion: number;
  }>;
  degreeCertificates: File[];
  degreeCertificateUrls?: string[];
  totalYearsOfExperience: number;
  professionalBio: string;
  languagesSpoken: string[];
  
  // Section 4: Practice & Consultation Settings
  practiceLocations: Array<{
    clinicName: string;
    fullAddress: string;
    city: string;
    pincode: string;
  }>;
  consultationTypes: string[];
  consultationFees: {
    inClinic: number;
    video: number;
    audio: number;
  };
  servicesOffered: string[];
  
  // Section 5: Financial Information
  bankAccountHolderName: string;
  bankAccountNumber: string;
  confirmBankAccountNumber: string;
  ifscCode: string;
  bankName: string;
  bankBranch: string;
  cancelledCheque: File | null;
  cancelledChequeUrl?: string;
  
  // Section 6: Legal & Consents
  termsAccepted: boolean;
  privacyPolicyAccepted: boolean;
  telemedicineConsent: boolean;
}

const initialFormData: DoctorFormData = {
  // Section 1: Basic Account Creation
  fullName: '',
  email: '',
  mobileNumber: '',
  password: '',
  confirmPassword: '',
  
  // Section 2: Professional & Identity Verification
  medicalRegistrationNumber: '',
  issuingCouncil: '',
  yearOfRegistration: new Date().getFullYear(),
  medicalRegistrationCertificate: null,
  aadhaarNumber: '',
  aadhaarFront: null,
  aadhaarBack: null,
  panNumber: '',
  panCard: null,
  
  // Section 3: Clinical & Public Profile Details
  profilePicture: null,
  specialization: [],
  superSpecialization: '',
  qualifications: [{ degree: '', medicalCollege: '', yearOfCompletion: new Date().getFullYear() }],
  degreeCertificates: [],
  totalYearsOfExperience: 0,
  professionalBio: '',
  languagesSpoken: [],
  
  // Section 4: Practice & Consultation Settings
  practiceLocations: [{ clinicName: '', fullAddress: '', city: '', pincode: '' }],
  consultationTypes: [],
  consultationFees: { inClinic: 0, video: 0, audio: 0 },
  servicesOffered: [],
  
  // Section 5: Financial Information
  bankAccountHolderName: '',
  bankAccountNumber: '',
  confirmBankAccountNumber: '',
  ifscCode: '',
  bankName: '',
  bankBranch: '',
  cancelledCheque: null,
  
  // Section 6: Legal & Consents
  termsAccepted: false,
  privacyPolicyAccepted: false,
  telemedicineConsent: false
};

const DoctorRegistrationForm: React.FC<DoctorRegistrationFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userId,
  prefillData
}) => {
  // Skip step 1 if prefill data is available
  const [currentStep, setCurrentStep] = useState(prefillData ? 2 : 1);
  const [formData, setFormData] = useState<DoctorFormData>(() => ({
    ...initialFormData,
    ...(prefillData && {
      fullName: prefillData.fullName || initialFormData.fullName,
      email: prefillData.email || initialFormData.email,
      mobileNumber: prefillData.mobileNumber || initialFormData.mobileNumber,
    })
  }));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [stepErrors, setStepErrors] = useState<Record<number, string[]>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());

  const totalSteps = 5; // Reduced from 6 to 5 (skipping Financial Information step)

  const stepTitles = {
    1: 'Basic Account Creation',
    2: 'Professional & Identity Verification',
    3: 'Clinical & Public Profile Details',
    4: 'Practice & Consultation Settings',
    5: 'Legal & Consents'
  };

  const stepDescriptions = {
    1: 'Create your secure EaseHealth AI account with basic information.',
    2: 'Verify your professional credentials and identity documents.',
    3: 'Set up your clinical profile and public information.',
    4: 'Configure your practice locations and consultation settings.',
    5: 'Review and accept terms, conditions, and legal consents.'
  };

  // Update form data
  const updateFormData = (updates: Partial<DoctorFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    // Clear step errors when data is updated
    if (stepErrors[currentStep]) {
      setStepErrors(prev => ({ ...prev, [currentStep]: [] }));
    }
  };

  // Upload file to storage
  const uploadFile = async (file: File, documentType: DoctorDocumentType, fieldName: string, doctorId: string): Promise<string> => {
    const fileId = `${fieldName}_${Date.now()}`;
    
    try {
      setUploadingFiles(prev => new Set(prev).add(fileId));
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

      // Simulate progress (in real implementation, you'd track actual upload progress)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const current = prev[fileId] || 0;
          if (current < 90) {
            return { ...prev, [fileId]: current + 10 };
          }
          return prev;
        });
      }, 200);

      const result = await uploadDoctorDocument(file, doctorId, documentType);
      
      clearInterval(progressInterval);
      setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));
      
      // Clean up progress tracking
      setTimeout(() => {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[fileId];
          return newProgress;
        });
        setUploadingFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(fileId);
          return newSet;
        });
      }, 1000);

      return result.publicUrl || result.signedUrl || '';
    } catch (error) {
      setUploadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[fileId];
        return newProgress;
      });
      throw error;
    }
  };

  // Validate current step
  const validateCurrentStep = (): boolean => {
    const errors: string[] = [];

    switch (currentStep) {
      case 1: // Basic Account Creation
        if (!formData.fullName.trim()) errors.push('Full name is required');
        if (!formData.email.trim()) errors.push('Email address is required');
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.push('Please enter a valid email address');
        if (!formData.mobileNumber.trim()) errors.push('Mobile number is required');
        else if (!/^\d{10}$/.test(formData.mobileNumber.replace(/\D/g, ''))) errors.push('Please enter a valid 10-digit mobile number');
        if (!formData.password) errors.push('Password is required');
        else if (formData.password.length < 8) errors.push('Password must be at least 8 characters');
        else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) errors.push('Password must contain uppercase, lowercase, and number');
        if (formData.password !== formData.confirmPassword) errors.push('Passwords do not match');
        break;

      case 2: // Professional & Identity Verification
        if (!formData.medicalRegistrationNumber.trim()) errors.push('Medical registration number is required');
        if (!formData.issuingCouncil.trim()) errors.push('Issuing council is required');
        if (!formData.yearOfRegistration || formData.yearOfRegistration < 1950 || formData.yearOfRegistration > new Date().getFullYear()) {
          errors.push('Please enter a valid year of registration');
        }
        if (!formData.medicalRegistrationCertificate) errors.push('Medical registration certificate is required');
        if (!formData.aadhaarNumber.trim()) errors.push('Aadhaar number is required');
        else if (!/^\d{12}$/.test(formData.aadhaarNumber.replace(/\D/g, ''))) errors.push('Please enter a valid 12-digit Aadhaar number');
        if (!formData.aadhaarFront) errors.push('Aadhaar card front image is required');
        if (!formData.aadhaarBack) errors.push('Aadhaar card back image is required');
        if (!formData.panNumber.trim()) errors.push('PAN number is required');
        else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber)) errors.push('Please enter a valid PAN number');
        if (!formData.panCard) errors.push('PAN card image is required');
        break;

      case 3: // Clinical & Public Profile Details
        if (!formData.profilePicture) errors.push('Profile picture is required');
        if (formData.specialization.length === 0) errors.push('At least one specialization must be selected');
        if (formData.qualifications.length === 0) errors.push('At least one qualification must be added');
        if (formData.qualifications.some(q => !q.degree.trim() || !q.medicalCollege.trim() || !q.yearOfCompletion)) {
          errors.push('All qualification fields must be completed');
        }
        if (formData.totalYearsOfExperience < 0 || formData.totalYearsOfExperience > 70) {
          errors.push('Years of experience must be between 0 and 70');
        }
        if (!formData.professionalBio.trim()) errors.push('Professional bio is required');
        if (formData.languagesSpoken.length === 0) errors.push('At least one language must be selected');
        break;

      case 4: // Practice & Consultation Settings
        if (formData.practiceLocations.length === 0) errors.push('At least one practice location is required');
        if (formData.practiceLocations.some(loc => !loc.clinicName.trim() || !loc.fullAddress.trim() || !loc.city.trim() || !loc.pincode.trim())) {
          errors.push('All practice location fields must be completed');
        }
        if (formData.consultationTypes.length === 0) errors.push('At least one consultation type must be selected');
        if (formData.consultationTypes.includes('In-Clinic') && formData.consultationFees.inClinic <= 0) {
          errors.push('In-clinic consultation fee must be greater than 0');
        }
        if (formData.consultationTypes.includes('Video') && formData.consultationFees.video <= 0) {
          errors.push('Video consultation fee must be greater than 0');
        }
        if (formData.consultationTypes.includes('Audio') && formData.consultationFees.audio <= 0) {
          errors.push('Audio consultation fee must be greater than 0');
        }
        break;

      case 5: // Legal & Consents
        if (!formData.termsAccepted) errors.push('You must accept the terms and conditions');
        if (!formData.privacyPolicyAccepted) errors.push('You must accept the privacy policy');
        if (formData.consultationTypes.includes('Video') || formData.consultationTypes.includes('Audio')) {
          if (!formData.telemedicineConsent) errors.push('You must accept the telemedicine consent for video/audio consultations');
        }
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
      setCurrentStep(prev => {
        const nextStep = prev + 1;
        // Skip step 1 if we have prefill data and are going to step 2
        if (prefillData && nextStep === 2) {
          return 2;
        }
        return Math.min(nextStep, totalSteps);
      });
    }
  };

  // Handle previous step
  const handleBack = () => {
    setCurrentStep(prev => {
      const prevStep = prev - 1;
      // Skip step 1 if we have prefill data and are going back from step 2
      if (prefillData && prevStep === 1) {
        return 1; // Stay at step 2, don't go to step 1
      }
      return Math.max(prevStep, prefillData ? 2 : 1);
    });
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

      // Upload all files first using the authenticated user ID
      const uploadPromises: Promise<void>[] = [];
      
      // Upload medical registration certificate
      if (formData.medicalRegistrationCertificate) {
        uploadPromises.push(
          uploadFile(formData.medicalRegistrationCertificate, 'medical_certificate', 'medicalRegistrationCertificate', finalUserId)
            .then(url => updateFormData({ medicalRegistrationCertificateUrl: url }))
        );
      }

      // Upload Aadhaar documents
      if (formData.aadhaarFront) {
        uploadPromises.push(
          uploadFile(formData.aadhaarFront, 'aadhaar_front', 'aadhaarFront', finalUserId)
            .then(url => updateFormData({ aadhaarFrontUrl: url }))
        );
      }

      if (formData.aadhaarBack) {
        uploadPromises.push(
          uploadFile(formData.aadhaarBack, 'aadhaar_back', 'aadhaarBack', finalUserId)
            .then(url => updateFormData({ aadhaarBackUrl: url }))
        );
      }

      // Upload PAN card
      if (formData.panCard) {
        uploadPromises.push(
          uploadFile(formData.panCard, 'pan_card', 'panCard', finalUserId)
            .then(url => updateFormData({ panCardUrl: url }))
        );
      }

      // Upload profile picture
      if (formData.profilePicture) {
        uploadPromises.push(
          uploadFile(formData.profilePicture, 'profile_image', 'profilePicture', finalUserId)
            .then(url => updateFormData({ profilePictureUrl: url }))
        );
      }

      // Upload degree certificates
      if (formData.degreeCertificates.length > 0) {
        const degreeUploadPromises = formData.degreeCertificates.map((file, index) =>
          uploadFile(file, 'degree_certificate', `degreeCertificate_${index}`, finalUserId)
        );
        uploadPromises.push(
          Promise.all(degreeUploadPromises)
            .then(urls => updateFormData({ degreeCertificateUrls: urls }))
        );
      }

      // Upload cancelled cheque
      if (formData.cancelledCheque) {
        uploadPromises.push(
          uploadFile(formData.cancelledCheque, 'cancelled_cheque', 'cancelledCheque', finalUserId)
            .then(url => updateFormData({ cancelledChequeUrl: url }))
        );
      }

      // Wait for all uploads to complete
      await Promise.all(uploadPromises);

      // Create doctor profile with file URLs
      const doctorData = {
        user_id: finalUserId,
        full_name: formData.fullName,
        email: formData.email,
        phone_number: formData.mobileNumber,
        specialty: formData.specialization[0], // Primary specialty
        license_number: formData.medicalRegistrationNumber,
        experience_years: formData.totalYearsOfExperience,
        qualification: formData.qualifications[0]?.degree || '',
        hospital_affiliation: formData.practiceLocations.map(loc => loc.clinicName).join(', '),
        consultation_fee: formData.consultationFees.inClinic || 500, // Default fee
        profile_image_url: formData.profilePictureUrl,
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
        return <BasicAccountStep {...commonProps} />;
      case 2:
        return <ProfessionalVerificationStep {...commonProps} />;
      case 3:
        return <ClinicalProfileStep {...commonProps} />;
      case 4:
        return <PracticeSettingsStep {...commonProps} />;
      case 5:
        return <LegalConsentsStep {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
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
            <div className="flex items-center justify-center space-x-1 mb-4">
              {Array.from({ length: totalSteps }, (_, i) => {
                const stepNumber = i + 1;
                const isSkipped = prefillData && stepNumber === 1;
                const isCompleted = stepNumber < currentStep || (isSkipped && currentStep > 1);
                const isCurrent = stepNumber === currentStep;
                
                return (
                  <div key={i} className="flex items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      isCompleted
                        ? 'bg-green-500 text-white' 
                        : isCurrent 
                          ? 'bg-[#0075A2] dark:bg-[#0EA5E9] text-white' 
                          : isSkipped
                            ? 'bg-gray-300 dark:bg-gray-500 text-gray-500 dark:text-gray-400'
                            : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                    }`}>
                      {isCompleted ? <CheckCircle className="w-3 h-3" /> : stepNumber}
                    </div>
                    {i < totalSteps - 1 && (
                      <div className={`w-4 h-0.5 mx-1 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {prefillData ? `Step ${currentStep - 1} of ${totalSteps - 1}` : `Step ${currentStep} of ${totalSteps}`}: {stepTitles[currentStep as keyof typeof stepTitles]}
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

          {/* Upload Progress */}
          {uploadingFiles.size > 0 && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center mb-3">
                <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Uploading files... ({uploadingFiles.size} remaining)
                </h4>
              </div>
              <div className="space-y-2">
                {Array.from(uploadingFiles).map(fileId => (
                  <div key={fileId} className="flex items-center space-x-3">
                    <div className="flex-1 bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                      <div 
                        className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress[fileId] || 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                      {uploadProgress[fileId] || 0}%
                    </span>
                  </div>
                ))}
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
              disabled={prefillData ? currentStep === 2 : currentStep === 1}
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
                disabled={isSubmitting || uploadingFiles.size > 0}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:transform-none disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {uploadingFiles.size > 0 ? 'Uploading files...' : 'Submitting...'}
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