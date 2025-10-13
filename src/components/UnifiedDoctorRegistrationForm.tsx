import React, { useState } from 'react';
import { X, Upload, CheckCircle, Building, Video, PhoneIcon } from 'lucide-react';
import { supabase, createProfile } from '../utils/supabase';
import { 
  uploadDoctorDocument, 
  DoctorDocumentType, 
  DoctorUploadResponse 
} from '../utils/doctorFileUploadUtils';
import { DoctorFormData } from '../types/DoctorFormData';
import BasicAccountSection from './UnifiedDoctorRegistrationForm/BasicAccountSection';
import ProfessionalVerificationSection from './UnifiedDoctorRegistrationForm/ProfessionalVerificationSection';
import ClinicalProfileSection from './UnifiedDoctorRegistrationForm/ClinicalProfileSection';
import PracticeSettingsSection from './UnifiedDoctorRegistrationForm/PracticeSettingsSection';
import LegalConsentsSection from './UnifiedDoctorRegistrationForm/LegalConsentsSection';

interface UnifiedDoctorRegistrationFormProps {
  isOpen?: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId?: string;
  prefillData?: {
    fullName?: string;
    email?: string;
    mobileNumber?: string;
  };
  isStandalone?: boolean;
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

const UnifiedDoctorRegistrationForm: React.FC<UnifiedDoctorRegistrationFormProps> = ({
  isOpen = true,
  onClose,
  onSuccess,
  userId,
  prefillData,
  isStandalone = false
}) => {
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
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const [uploadedFiles, setUploadedFiles] = useState<Set<string>>(new Set());
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Data arrays
  const issuingCouncils = [
    'Andhra Pradesh Medical Council', 'Arunachal Pradesh Medical Council', 'Assam Medical Council',
    'Bihar Medical Council', 'Chhattisgarh Medical Council', 'Delhi Medical Council',
    'Goa Medical Council', 'Gujarat Medical Council', 'Haryana Medical Council',
    'Himachal Pradesh Medical Council', 'Jharkhand Medical Council', 'Karnataka Medical Council',
    'Kerala Medical Council', 'Madhya Pradesh Medical Council', 'Maharashtra Medical Council',
    'Manipur Medical Council', 'Meghalaya Medical Council', 'Mizoram Medical Council',
    'Nagaland Medical Council', 'National Medical Commission (NMC)', 'Odisha Medical Council',
    'Punjab Medical Council', 'Rajasthan Medical Council', 'Sikkim Medical Council',
    'Tamil Nadu Medical Council', 'Telangana Medical Council', 'Tripura Medical Council',
    'Uttar Pradesh Medical Council', 'Uttarakhand Medical Council', 'West Bengal Medical Council'
  ];

  const specializations = [
    'Cardiology', 'Dermatology', 'General Physician', 'Gynaecology', 'Orthopaedics', 
    'Paediatrics', 'Neurology', 'Psychiatry', 'Ophthalmology', 'ENT', 'Radiology', 
    'Anesthesiology', 'Emergency Medicine', 'Family Medicine', 'Internal Medicine', 
    'Surgery', 'Oncology', 'Endocrinology', 'Gastroenterology', 'Pulmonology', 
    'Nephrology', 'Rheumatology', 'Infectious Disease', 'Pathology', 'Physical Medicine', 
    'Plastic Surgery', 'Urology'
  ];

  const languages = [
    'English', 'Hindi', 'Marathi', 'Tamil', 'Bengali', 'Telugu', 'Gujarati', 
    'Kannada', 'Malayalam', 'Punjabi', 'Urdu', 'Odia', 'Assamese', 'Nepali', 
    'Sanskrit', 'French', 'German', 'Spanish', 'Arabic', 'Chinese'
  ];

  const degrees = [
    'MBBS', 'MD', 'MS', 'DM', 'DNB', 'MCh', 'BAMS', 'BHMS', 'BUMS', 'BDS', 
    'MDS', 'BPT', 'MPT', 'BSc Nursing', 'MSc Nursing', 'BPharm', 'MPharm', 
    'BSc Medical Technology', 'MSc Medical Technology'
  ];

  const consultationTypes = [
    { id: 'In-Clinic', label: 'In-Clinic Consultation', icon: Building },
    { id: 'Video', label: 'Video Teleconsultation', icon: Video },
    { id: 'Audio', label: 'Audio Teleconsultation', icon: PhoneIcon }
  ];

  // Update form data
  const updateFormData = (updates: Partial<DoctorFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    // Clear errors when data is updated
    setErrors({});
  };

  // File upload handlers
  const handleFileUpload = (field: keyof DoctorFormData, file: File | null) => {
    updateFormData({ [field]: file });
  };

  const handleMultipleFileUpload = (field: 'degreeCertificates', files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files);
      updateFormData({ [field]: [...formData.degreeCertificates, ...newFiles] });
    }
  };

  // Upload file to storage
  const uploadFile = async (file: File, documentType: DoctorDocumentType, fieldName: string, doctorId: string): Promise<string> => {
    const fileId = `${fieldName}_${Date.now()}`;
    
    try {
      setUploadingFiles(prev => new Set(prev).add(fileId));
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

      // Simulate progress
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

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string[]> = {};

    // Basic Account Validation
    if (!formData.fullName.trim()) newErrors.fullName = ['Full name is required'];
    if (!formData.email.trim()) newErrors.email = ['Email address is required'];
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = ['Please enter a valid email address'];
    if (!formData.mobileNumber.trim()) newErrors.mobileNumber = ['Mobile number is required'];
    else if (!/^\d{10}$/.test(formData.mobileNumber.replace(/\D/g, ''))) newErrors.mobileNumber = ['Please enter a valid 10-digit mobile number'];
    if (!formData.password) newErrors.password = ['Password is required'];
    else if (formData.password.length < 8) newErrors.password = ['Password must be at least 8 characters'];
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) newErrors.password = ['Password must contain uppercase, lowercase, and number'];
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = ['Passwords do not match'];

    // Professional Verification Validation
    if (!formData.medicalRegistrationNumber.trim()) newErrors.medicalRegistrationNumber = ['Medical registration number is required'];
    if (!formData.issuingCouncil.trim()) newErrors.issuingCouncil = ['Issuing council is required'];
    if (!formData.medicalRegistrationCertificate) newErrors.medicalRegistrationCertificate = ['Medical registration certificate is required'];
    if (!formData.aadhaarNumber.trim()) newErrors.aadhaarNumber = ['Aadhaar number is required'];
    else if (!/^\d{12}$/.test(formData.aadhaarNumber.replace(/\D/g, ''))) newErrors.aadhaarNumber = ['Please enter a valid 12-digit Aadhaar number'];
    if (!formData.aadhaarFront) newErrors.aadhaarFront = ['Aadhaar card front image is required'];
    if (!formData.aadhaarBack) newErrors.aadhaarBack = ['Aadhaar card back image is required'];
    if (!formData.panNumber.trim()) newErrors.panNumber = ['PAN number is required'];
    else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber)) newErrors.panNumber = ['Please enter a valid PAN number'];
    if (!formData.panCard) newErrors.panCard = ['PAN card image is required'];

    // Clinical Profile Validation
    if (!formData.profilePicture) newErrors.profilePicture = ['Profile picture is required'];
    if (formData.specialization.length === 0) newErrors.specialization = ['At least one specialization must be selected'];
    if (formData.qualifications.length === 0) newErrors.qualifications = ['At least one qualification must be added'];
    if (formData.qualifications.some(q => !q.degree.trim() || !q.medicalCollege.trim() || !q.yearOfCompletion)) {
      newErrors.qualifications = ['All qualification fields must be completed'];
    }
    if (formData.totalYearsOfExperience < 0 || formData.totalYearsOfExperience > 70) {
      newErrors.totalYearsOfExperience = ['Years of experience must be between 0 and 70'];
    }
    if (!formData.professionalBio.trim()) newErrors.professionalBio = ['Professional bio is required'];
    if (formData.languagesSpoken.length === 0) newErrors.languagesSpoken = ['At least one language must be selected'];

    // Practice Settings Validation
    if (formData.practiceLocations.length === 0) newErrors.practiceLocations = ['At least one practice location is required'];
    if (formData.practiceLocations.some(loc => !loc.clinicName.trim() || !loc.fullAddress.trim() || !loc.city.trim() || !loc.pincode.trim())) {
      newErrors.practiceLocations = ['All practice location fields must be completed'];
    }
    if (formData.consultationTypes.length === 0) newErrors.consultationTypes = ['At least one consultation type must be selected'];
    if (formData.consultationTypes.includes('In-Clinic') && formData.consultationFees.inClinic <= 0) {
      newErrors.consultationFees = ['In-clinic consultation fee must be greater than 0'];
    }
    if (formData.consultationTypes.includes('Video') && formData.consultationFees.video <= 0) {
      newErrors.consultationFees = ['Video consultation fee must be greater than 0'];
    }
    if (formData.consultationTypes.includes('Audio') && formData.consultationFees.audio <= 0) {
      newErrors.consultationFees = ['Audio consultation fee must be greater than 0'];
    }

    // Legal Consents Validation
    if (!formData.termsAccepted) newErrors.termsAccepted = ['You must accept the terms and conditions'];
    if (!formData.privacyPolicyAccepted) newErrors.privacyPolicyAccepted = ['You must accept the privacy policy'];
    if (formData.consultationTypes.includes('Video') || formData.consultationTypes.includes('Audio')) {
      if (!formData.telemedicineConsent) newErrors.telemedicineConsent = ['You must accept the telemedicine consent for video/audio consultations'];
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    console.log('Starting form submission...');
    if (!validateForm()) return;

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
      if (formData.medicalRegistrationCertificate && !uploadedFiles.has('medicalRegistrationCertificate')) {
        uploadPromises.push(
          uploadDoctorDocument(formData.medicalRegistrationCertificate, finalUserId, 'medical_certificate')
            .then(result => {
              setUploadedFiles(prev => new Set(prev).add('medicalRegistrationCertificate'));
              updateFormData({ medicalRegistrationCertificateUrl: result.publicUrl || result.signedUrl });
              return result.publicUrl || result.signedUrl;
            })
        );
      }

      // Upload Aadhaar documents
      if (formData.aadhaarFront && !uploadedFiles.has('aadhaarFront')) {
        uploadPromises.push(
          uploadDoctorDocument(formData.aadhaarFront, finalUserId, 'aadhaar_front')
            .then(result => {
              setUploadedFiles(prev => new Set(prev).add('aadhaarFront'));
              updateFormData({ aadhaarFrontUrl: result.publicUrl || result.signedUrl });
              return result.publicUrl || result.signedUrl;
            })
        );
      }

      if (formData.aadhaarBack && !uploadedFiles.has('aadhaarBack')) {
        uploadPromises.push(
          uploadDoctorDocument(formData.aadhaarBack, finalUserId, 'aadhaar_back')
            .then(result => {
              setUploadedFiles(prev => new Set(prev).add('aadhaarBack'));
              updateFormData({ aadhaarBackUrl: result.publicUrl || result.signedUrl });
              return result.publicUrl || result.signedUrl;
            })
        );
      }

      // Upload PAN card
      if (formData.panCard && !uploadedFiles.has('panCard')) {
        uploadPromises.push(
          uploadDoctorDocument(formData.panCard, finalUserId, 'pan_card')
            .then(result => {
              setUploadedFiles(prev => new Set(prev).add('panCard'));
              updateFormData({ panCardUrl: result.publicUrl || result.signedUrl });
              return result.publicUrl || result.signedUrl;
            })
        );
      }

      // Upload profile picture
      if (formData.profilePicture && !uploadedFiles.has('profilePicture')) {
        uploadPromises.push(
          uploadDoctorDocument(formData.profilePicture, finalUserId, 'profile_image')
            .then(result => {
              setUploadedFiles(prev => new Set(prev).add('profilePicture'));
              updateFormData({ profilePictureUrl: result.publicUrl || result.signedUrl });
              return result.publicUrl || result.signedUrl;
            })
        );
      }

      // Upload degree certificates
      if (formData.degreeCertificates.length > 0) {
        const degreeUploadPromises = formData.degreeCertificates.map((file, index) => {
          const fileKey = `degreeCertificate_${index}`;
          if (!uploadedFiles.has(fileKey)) {
            return uploadDoctorDocument(file, finalUserId, 'degree_certificate')
              .then(result => {
                setUploadedFiles(prev => new Set(prev).add(fileKey));
                return result.publicUrl || result.signedUrl;
              });
          }
          return Promise.resolve(formData.degreeCertificateUrls?.[index] || '');
        });
        uploadPromises.push(
          Promise.all(degreeUploadPromises)
            .then(urls => updateFormData({ degreeCertificateUrls: urls }))
        );
      }

      // Upload cancelled cheque
      if (formData.cancelledCheque && !uploadedFiles.has('cancelledCheque')) {
        uploadPromises.push(
          uploadDoctorDocument(formData.cancelledCheque, finalUserId, 'cancelled_cheque')
            .then(result => {
              setUploadedFiles(prev => new Set(prev).add('cancelledCheque'));
              updateFormData({ cancelledChequeUrl: result.publicUrl || result.signedUrl });
              return result.publicUrl || result.signedUrl;
            })
        );
      }

      // Wait for all uploads to complete
      await Promise.all(uploadPromises);

      console.log('All file uploads completed, creating doctor profile...');
      
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
        is_active: true,
        // Additional fields from registration form (using correct database field names)
        medical_registration_number: formData.medicalRegistrationNumber,
        issuing_council: formData.issuingCouncil,
        year_of_registration: formData.yearOfRegistration,
        aadhaar_number: formData.aadhaarNumber,
        pan_number: formData.panNumber,
        super_specialization: formData.superSpecialization,
        qualifications: formData.qualifications,
        total_years_of_experience: formData.totalYearsOfExperience,
        professional_bio: formData.professionalBio,
        languages_spoken: formData.languagesSpoken,
        practice_locations: formData.practiceLocations,
        consultation_types: formData.consultationTypes,
        consultation_fees: formData.consultationFees,
        services_offered: formData.servicesOffered,
        // Financial fields - commented out for this phase to avoid constraint violations
        // bank_account_holder_name: formData.bankAccountHolderName,
        // bank_account_number: formData.bankAccountNumber,
        // ifsc_code: formData.ifscCode,
        // bank_name: formData.bankName,
        // bank_branch: formData.bankBranch,
        terms_accepted: formData.termsAccepted,
        privacy_policy_accepted: formData.privacyPolicyAccepted,
        telemedicine_consent: formData.telemedicineConsent
      };

      console.log('Attempting to insert doctor data:', doctorData);
      
      console.log('Attempting to insert doctor data:', doctorData);
      
      const { data: insertedData, error: doctorError } = await supabase
        .from('doctors')
        .insert([doctorData])
        .select();
        
      console.log('Insert response:', { data: insertedData, error: doctorError });

      if (doctorError) {
        console.error('Doctor insertion error:', doctorError);
        throw new Error(`Failed to create doctor profile: ${doctorError.message}`);
      }

      console.log('Doctor data inserted successfully:', insertedData);

      // Create or update user profile
      try {
        await createProfile(finalUserId, {
          full_name: formData.fullName,
          phone_number: formData.mobileNumber,
        });
        console.log('Profile created/updated successfully');
      } catch (profileError) {
        console.warn('Profile creation failed, but doctor registration succeeded:', profileError);
        // Don't fail the registration if profile creation fails
      }

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

  // Debug logging
  console.log('UnifiedDoctorRegistrationForm rendering:', {
    isOpen,
    userId,
    prefillData,
    formDataKeys: Object.keys(formData).length
  });

  if (!isStandalone && !isOpen) {
    console.log('Form is not open and not standalone, returning null');
    return null;
  }

  console.log('About to render form JSX');

  const renderFormContent = () => (
    <div className="space-y-8">
      {/* Upload Progress */}
      {uploadingFiles.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center mb-4">
            <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" />
            <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
              Uploading files... ({uploadingFiles.size} remaining)
            </h4>
          </div>
          <div className="space-y-3">
            {Array.from(uploadingFiles).map(fileId => (
              <div key={fileId} className="flex items-center space-x-4">
                <div className="flex-1 bg-blue-200 dark:bg-blue-800 rounded-full h-3">
                  <div 
                    className="bg-blue-600 dark:bg-blue-400 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress[fileId] || 0}%` }}
                  />
                </div>
                <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                  {uploadProgress[fileId] || 0}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit Error */}
      {submitError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 shadow-lg">
          <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
            <X className="w-5 h-5 mr-2" />
            {submitError}
          </p>
        </div>
      )}

      {/* Form Sections */}
      <BasicAccountSection
        formData={formData}
        updateFormData={updateFormData}
        errors={errors}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        showConfirmPassword={showConfirmPassword}
        setShowConfirmPassword={setShowConfirmPassword}
        isPrefilled={!!prefillData}
      />

      <ProfessionalVerificationSection
        formData={formData}
        updateFormData={updateFormData}
        errors={errors}
        issuingCouncils={issuingCouncils}
      />

      <ClinicalProfileSection
        formData={formData}
        updateFormData={updateFormData}
        errors={errors}
        specializations={specializations}
        languages={languages}
        degrees={degrees}
      />

      <PracticeSettingsSection
        formData={formData}
        updateFormData={updateFormData}
        errors={errors}
        consultationTypes={consultationTypes}
      />

      <LegalConsentsSection
        formData={formData}
        updateFormData={updateFormData}
        errors={errors}
      />

      {/* Submit Button */}
      <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 -mx-6 -mb-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>All fields marked with * are required</p>
            <p>Your information will be verified before activation</p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || uploadingFiles.size > 0}
            className="flex items-center px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-2xl font-semibold text-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-4 focus:ring-green-500 focus:ring-offset-2 disabled:transform-none disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                {uploadingFiles.size > 0 ? 'Uploading files...' : 'Submitting...'}
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-3" />
                Submit Registration
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  if (!isStandalone && !isOpen) {
    console.log('Form is not open and not standalone, returning null');
    return null;
  }

  if (isStandalone) {
    return (
      <div className="space-y-8">
        {/* Upload Progress */}
        {uploadingFiles.size > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center mb-4">
              <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" />
              <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                Uploading files... ({uploadingFiles.size} remaining)
              </h4>
            </div>
            <div className="space-y-3">
              {Array.from(uploadingFiles).map(fileId => (
                <div key={fileId} className="flex items-center space-x-4">
                  <div className="flex-1 bg-blue-200 dark:bg-blue-800 rounded-full h-3">
                    <div 
                      className="bg-blue-600 dark:bg-blue-400 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress[fileId] || 0}%` }}
                    />
                  </div>
                  <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                    {uploadProgress[fileId] || 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Error */}
        {submitError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 shadow-lg">
            <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
              <X className="w-5 h-5 mr-2" />
              {submitError}
            </p>
          </div>
        )}

        {/* Basic Account Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <BasicAccountSection
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            showConfirmPassword={showConfirmPassword}
            setShowConfirmPassword={setShowConfirmPassword}
            isPrefilled={!!prefillData}
          />
        </div>

        {/* Professional Verification Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <ProfessionalVerificationSection
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
            issuingCouncils={issuingCouncils}
          />
        </div>

        {/* Clinical Profile Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <ClinicalProfileSection
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
            specializations={specializations}
            languages={languages}
            degrees={degrees}
          />
        </div>

        {/* Practice Settings Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <PracticeSettingsSection
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
            consultationTypes={consultationTypes}
          />
        </div>

        {/* Legal Consents Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <LegalConsentsSection
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        </div>

        {/* Submit Button */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>All fields marked with * are required</p>
              <p>Your information will be verified before activation</p>
            </div>
            <button
              onClick={(e) => {
                console.log('Submit button clicked');
                handleSubmit(e);
              }}
              disabled={isSubmitting || uploadingFiles.size > 0}
              className="flex items-center px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-2xl font-semibold text-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-4 focus:ring-green-500 focus:ring-offset-2 disabled:transform-none disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  {uploadingFiles.size > 0 ? 'Uploading files...' : 'Submitting...'}
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-3" />
                  Submit Registration
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      style={{ zIndex: 9999 }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-y-auto" style={{ zIndex: 10000 }}>
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#0A2647] dark:text-gray-100">
                Doctor Registration
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Complete your professional profile to start practicing with EaseHealth AI
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0075A2]"
              aria-label="Close registration form"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Upload Progress */}
          {uploadingFiles.size > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" />
                <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                  Uploading files... ({uploadingFiles.size} remaining)
                </h4>
              </div>
              <div className="space-y-3">
                {Array.from(uploadingFiles).map(fileId => (
                  <div key={fileId} className="flex items-center space-x-4">
                    <div className="flex-1 bg-blue-200 dark:bg-blue-800 rounded-full h-3">
                      <div 
                        className="bg-blue-600 dark:bg-blue-400 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress[fileId] || 0}%` }}
                      />
                    </div>
                    <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                      {uploadProgress[fileId] || 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Error */}
          {submitError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 shadow-lg">
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
                <X className="w-5 h-5 mr-2" />
                {submitError}
              </p>
            </div>
          )}

          {/* Form Sections */}
          <BasicAccountSection
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            showConfirmPassword={showConfirmPassword}
            setShowConfirmPassword={setShowConfirmPassword}
            isPrefilled={!!prefillData}
          />

          <ProfessionalVerificationSection
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
            issuingCouncils={issuingCouncils}
          />

          <ClinicalProfileSection
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
            specializations={specializations}
            languages={languages}
            degrees={degrees}
          />

          <PracticeSettingsSection
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
            consultationTypes={consultationTypes}
          />

          <LegalConsentsSection
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />

          {/* Submit Button */}
          <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 -mx-6 -mb-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>All fields marked with * are required</p>
                <p>Your information will be verified before activation</p>
              </div>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || uploadingFiles.size > 0}
                className="flex items-center px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-2xl font-semibold text-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-4 focus:ring-green-500 focus:ring-offset-2 disabled:transform-none disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    {uploadingFiles.size > 0 ? 'Uploading files...' : 'Submitting...'}
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-3" />
                    Submit Registration
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedDoctorRegistrationForm;
