import React, { useState } from 'react';
import { ArrowLeft, Upload, FileText, User, Phone, MapPin, Calendar, CheckCircle, AlertCircle, Clock, Shield, MessageCircle, Star, Zap, Heart, Mail, Home, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { useDarkMode } from '../hooks/useDarkMode';
import AccessibleDropdown from '../components/AccessibleDropdown';
import AuthModal from '../components/AuthModal';
import { AccessibilityAnnouncer } from '../components/AccessibilityAnnouncer';
import { createPreRegistration, PreRegistration, createPatientProfile, getPatientProfile } from '../utils/supabase';
import { uploadDocument, validateFile, formatFileSize, DocumentType } from '../utils/fileUploadUtils';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslations } from '../translations';

// Auth props interface
interface AuthProps {
  user: any;
  session: any;
  profile: any;
  userState: 'new' | 'returning' | 'authenticated';
  isAuthenticated: boolean;
  handleLogout: () => Promise<void>;
}

interface FormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  medicalHistory: string;
  allergies: string;
  currentMedications: string;
  insuranceProvider: string;
  insuranceNumber: string;
  bloodType: string;
  labReports: File | null;
  aadhaar: File | null;
  consent: boolean;
}

function PatientPreRegistrationPage({ user, session, profile, userState, isAuthenticated, handleLogout }: AuthProps) {
  const { language } = useLanguage();
  const { t } = useTranslations(language);
  const { isDarkMode } = useDarkMode();
  const [formData, setFormData] = useState<FormData>({
    fullName: user?.user_metadata?.full_name || user?.email?.split('@')[0] || '',
    email: user?.email || '',
    phoneNumber: user?.user_metadata?.phone || '',
    dateOfBirth: '',
    gender: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    medicalHistory: '',
    allergies: '',
    currentMedications: '',
    insuranceProvider: '',
    insuranceNumber: '',
    bloodType: '',
    labReports: null,
    aadhaar: null,
    consent: false
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authError, setAuthError] = useState<string>('');
  const [announcement, setAnnouncement] = useState('');
  const [uploadProgress, setUploadProgress] = useState<{ labReports: number; aadhaar: number }>({ labReports: 0, aadhaar: 0 });

  const genderOptions = [
    { id: 'male', label: language === 'hi' ? 'पुरुष' : 'Male', value: 'male' },
    { id: 'female', label: language === 'hi' ? 'महिला' : 'Female', value: 'female' },
    { id: 'other', label: language === 'hi' ? 'अन्य' : 'Other', value: 'other' },
    { id: 'prefer-not-to-say', label: language === 'hi' ? 'कहना नहीं चाहते' : 'Prefer not to say', value: 'prefer-not-to-say' }
  ];

  const stateOptions = [
    { id: 'andhra-pradesh', label: 'Andhra Pradesh', value: 'andhra-pradesh' },
    { id: 'arunachal-pradesh', label: 'Arunachal Pradesh', value: 'arunachal-pradesh' },
    { id: 'assam', label: 'Assam', value: 'assam' },
    { id: 'bihar', label: 'Bihar', value: 'bihar' },
    { id: 'chhattisgarh', label: 'Chhattisgarh', value: 'chhattisgarh' },
    { id: 'goa', label: 'Goa', value: 'goa' },
    { id: 'gujarat', label: 'Gujarat', value: 'gujarat' },
    { id: 'haryana', label: 'Haryana', value: 'haryana' },
    { id: 'himachal-pradesh', label: 'Himachal Pradesh', value: 'himachal-pradesh' },
    { id: 'jharkhand', label: 'Jharkhand', value: 'jharkhand' },
    { id: 'karnataka', label: 'Karnataka', value: 'karnataka' },
    { id: 'kerala', label: 'Kerala', value: 'kerala' },
    { id: 'madhya-pradesh', label: 'Madhya Pradesh', value: 'madhya-pradesh' },
    { id: 'maharashtra', label: 'Maharashtra', value: 'maharashtra' },
    { id: 'manipur', label: 'Manipur', value: 'manipur' },
    { id: 'meghalaya', label: 'Meghalaya', value: 'meghalaya' },
    { id: 'mizoram', label: 'Mizoram', value: 'mizoram' },
    { id: 'nagaland', label: 'Nagaland', value: 'nagaland' },
    { id: 'odisha', label: 'Odisha', value: 'odisha' },
    { id: 'punjab', label: 'Punjab', value: 'punjab' },
    { id: 'rajasthan', label: 'Rajasthan', value: 'rajasthan' },
    { id: 'sikkim', label: 'Sikkim', value: 'sikkim' },
    { id: 'tamil-nadu', label: 'Tamil Nadu', value: 'tamil-nadu' },
    { id: 'telangana', label: 'Telangana', value: 'telangana' },
    { id: 'tripura', label: 'Tripura', value: 'tripura' },
    { id: 'uttar-pradesh', label: 'Uttar Pradesh', value: 'uttar-pradesh' },
    { id: 'uttarakhand', label: 'Uttarakhand', value: 'uttarakhand' },
    { id: 'west-bengal', label: 'West Bengal', value: 'west-bengal' },
    { id: 'delhi', label: 'Delhi', value: 'delhi' }
  ];

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFileUpload = (field: 'labReports' | 'aadhaar', file: File | null) => {
    if (file) {
      // Validate file before setting it
      const validation = validateFile(file);
      if (!validation.isValid) {
        setErrors(prev => ({ ...prev, [field]: validation.error }));
        return;
      }
    }
    
    setFormData(prev => ({ ...prev, [field]: file }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.fullName.trim()) newErrors.fullName = t('preRegistration.validation.fullNameRequired');
    if (!formData.age.trim()) newErrors.age = t('preRegistration.validation.ageRequired');
    if (!formData.gender) newErrors.gender = t('preRegistration.validation.genderRequired');
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = t('preRegistration.validation.phoneRequired');
    if (!formData.city.trim()) newErrors.city = t('preRegistration.validation.cityRequired');
    if (!formData.state) newErrors.state = t('preRegistration.validation.stateRequired');
    if (!formData.symptoms.trim()) newErrors.symptoms = t('preRegistration.validation.symptomsRequired');
    if (!formData.consent) newErrors.consent = t('preRegistration.validation.consentRequired');

    // Validate phone number format
    if (formData.phoneNumber && !/^\d{10}$/.test(formData.phoneNumber.replace(/\D/g, ''))) {
      newErrors.phoneNumber = t('preRegistration.validation.phoneInvalid');
    }

    // Validate age
    if (formData.age && (isNaN(Number(formData.age)) || Number(formData.age) < 1 || Number(formData.age) > 120)) {
      newErrors.age = t('preRegistration.validation.ageInvalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setShowAuthModal(true);
  };

  const handleAuthSuccess = async () => {
    setShowAuthModal(false);
    setIsSubmitting(true);
    setAuthError('');
    setUploadProgress({ labReports: 0, aadhaar: 0 });
    
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      let labReportsUrl: string | undefined;
      let aadhaarUrl: string | undefined;

      // Upload lab reports if provided
      if (formData.labReports) {
        try {
          setUploadProgress(prev => ({ ...prev, labReports: 50 }));
          const uploadResult = await uploadDocument(formData.labReports, user.id, 'lab_reports');
          labReportsUrl = uploadResult.path;
          setUploadProgress(prev => ({ ...prev, labReports: 100 }));
        } catch (error) {
          console.error('Lab reports upload error:', error);
          throw new Error('Failed to upload lab reports. Please try again.');
        }
      }

      // Upload Aadhaar document if provided
      if (formData.aadhaar) {
        try {
          setUploadProgress(prev => ({ ...prev, aadhaar: 50 }));
          const uploadResult = await uploadDocument(formData.aadhaar, user.id, 'aadhaar');
          aadhaarUrl = uploadResult.path;
          setUploadProgress(prev => ({ ...prev, aadhaar: 100 }));
        } catch (error) {
          console.error('Aadhaar upload error:', error);
          throw new Error('Failed to upload Aadhaar document. Please try again.');
        }
      }

      // Create pre-registration record with actual file URLs
      const preRegistrationData: Omit<PreRegistration, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
        full_name: formData.fullName,
        age: parseInt(formData.age),
        gender: formData.gender,
        phone_number: formData.phoneNumber,
        city: formData.city,
        state: formData.state,
        symptoms: formData.symptoms,
        consent_agreed: formData.consent,
        lab_reports_url: labReportsUrl,
        aadhaar_url: aadhaarUrl
      };

      await createPreRegistration(user.id, preRegistrationData);
      setSubmitSuccess(true);
      setAnnouncement('Pre-registration submitted successfully! You will receive a confirmation SMS shortly.');
    } catch (error) {
      console.error('Pre-registration submission error:', error);
      setAuthError(error instanceof Error ? error.message : 'Failed to submit pre-registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const authContext = {
    title: t('preRegistration.auth.title'),
    description: t('preRegistration.auth.description'),
    actionText: t('preRegistration.auth.actionText')
  };

  const benefits = [
    {
      icon: Calendar,
      title: "Skip the Queue",
      description: "Pre-register and get your digital token to avoid waiting in long lines.",
      details: [
        "Get SMS with queue number",
        "Track your position in real-time",
        "Estimated wait time updates"
      ]
    },
    {
      icon: FileText,
      title: "Secure Document Upload",
      description: "Upload your documents safely with end-to-end encryption and DPDP compliance.",
      details: [
        "Aadhaar & lab reports in one place",
        "Automatic document verification",
        "Reduces clinic paperwork by 80%"
      ]
    },
    {
      icon: CheckCircle,
      title: "Instant Confirmation",
      description: "Get immediate confirmation and SMS updates about your registration status.",
      details: [
        "Real-time SMS notifications",
        "Email confirmation with details",
        "Appointment reminders included"
      ]
    }
  ];

  if (submitSuccess) {
    return (
      <>
        <div className="min-h-screen bg-[#F6F6F6] dark:bg-gray-900 text-[#0A2647] dark:text-gray-100 transition-colors duration-300">
          <Navigation 
            user={user}
            session={session}
            profile={profile}
            userState={userState}
            isAuthenticated={isAuthenticated}
            handleLogout={handleLogout}
          />
          
          <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-[#0A2647] dark:text-gray-100 mb-4">{t('preRegistration.successTitle')}</h1>
              <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
                {t('preRegistration.successMessage')}
              </p>
              <div className="space-y-4">
                <Link 
                  to="/smart-appointment-booking" 
                  className="inline-block bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] text-white px-8 py-3 rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-1 transition-all focus-ring"
                >
                  {t('preRegistration.buttons.bookAnother')}
                </Link>
                <div>
                  <Link 
                    to="/" 
                    className="text-[#0075A2] dark:text-[#0EA5E9] hover:text-[#0A2647] dark:hover:text-gray-100 transition-colors focus-ring"
                  >
                    {t('preRegistration.buttons.returnHome')}
                  </Link>
                </div>
              </div>
            </div>
          </main>
        </div>

        {/* Auth Modal */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
          mode="signup"
          context={authContext}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F6F6] dark:bg-gray-900 text-[#0A2647] dark:text-gray-100 transition-colors duration-300">
      {/* Accessibility Announcer */}
      <AccessibilityAnnouncer message={announcement} />
      
      {/* Accessibility Announcer */}
      <AccessibilityAnnouncer message={announcement} />
      
      <Navigation 
        user={user}
        session={session}
        profile={profile}
        userState={userState}
        isAuthenticated={isAuthenticated}
        handleLogout={handleLogout}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link 
          to="/" 
          className="inline-flex items-center text-[#0075A2] dark:text-[#0EA5E9] hover:text-[#0A2647] dark:hover:text-gray-100 transition-colors mb-8 focus-ring"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          {t('common.backToHome')}
        </Link>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form (2/3 width) */}
          <div className="lg:col-span-2">
            {/* Page Header */}
            <div className="text-center mb-6">
              <h1 className="text-3xl sm:text-4xl font-bold text-[#0A2647] dark:text-gray-100 mb-4">{t('preRegistration.title')}</h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">{t('preRegistration.subtitle')}</p>
            </div>

            {/* Form */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
              {/* Auth Error Display */}
              {authError && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                    {authError}
                  </p>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Demographics Section */}
                <div>
                  <h2 className="text-xl font-semibold text-[#0A2647] dark:text-gray-100 mb-6 flex items-center">
                    <User className="w-5 h-5 mr-2 text-[#0075A2] dark:text-[#0EA5E9]" />
                    {t('preRegistration.form.demographics')}
                  </h2>
                  
                  <div className="space-y-6">
                    {/* Full Name */}
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('preRegistration.form.fullNameLabel')}</label>
                      <input
                        type="text"
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                          errors.fullName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder={t('preRegistration.form.fullNamePlaceholder')}
                        aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                      />
                      {errors.fullName && (
                        <p id="fullName-error" className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.fullName}
                        </p>
                      )}
                    </div>

                    {/* Age and Gender */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="age" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('preRegistration.form.ageLabel')}</label>
                        <input
                          type="number"
                          id="age"
                          value={formData.age}
                          onChange={(e) => handleInputChange('age', e.target.value)}
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                            errors.age ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                          }`}
                          placeholder={t('preRegistration.form.agePlaceholder')}
                          min="1"
                          max="120"
                          aria-describedby={errors.age ? 'age-error' : undefined}
                        />
                        {errors.age && (
                          <p id="age-error" className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {errors.age}
                          </p>
                        )}
                      </div>

                      <div>
                        <AccessibleDropdown
                          label={t('preRegistration.form.genderLabel')}
                          options={genderOptions}
                          value={formData.gender}
                          onChange={(value) => handleInputChange('gender', value as string)}
                          placeholder={t('preRegistration.form.genderPlaceholder')}
                          error={errors.gender}
                        />
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('preRegistration.form.phoneLabel')}</label>
                      <input
                        type="tel"
                        id="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                          errors.phoneNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder={t('preRegistration.form.phonePlaceholder')}
                        aria-describedby={errors.phoneNumber ? 'phoneNumber-error' : undefined}
                      />
                      {errors.phoneNumber && (
                        <p id="phoneNumber-error" className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.phoneNumber}
                        </p>
                      )}
                    </div>

                    {/* City and State */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="city" className="block text स्म font-medium text-gray-700 dark:text-gray-300 mb-2">{t('preRegistration.form.cityLabel')}</label>
                        <input
                          type="text"
                          id="city"
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                            errors.city ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                          }`}
                          placeholder={t('preRegistration.form.cityPlaceholder')}
                          aria-describedby={errors.city ? 'city-error' : undefined}
                        />
                        {errors.city && (
                          <p id="city-error" className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {errors.city}
                          </p>
                        )}
                      </div>

                      <div>
                        <AccessibleDropdown
                          label={t('preRegistration.form.stateLabel')}
                          options={stateOptions}
                          value={formData.state}
                          onChange={(value) => handleInputChange('state', value as string)}
                          placeholder={t('preRegistration.form.statePlaceholder')}
                          searchable={true}
                          error={errors.state}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Symptoms Section */}
                <div>
                  <h2 className="text-xl font-semibold text-[#0A2647] dark:text-gray-100 mb-6 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-[#0075A2] dark:text-[#0EA5E9]" />
                    {t('preRegistration.form.symptomsSectionTitle')}
                  </h2>
                  
                  <div>
                    <label htmlFor="symptoms" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('preRegistration.form.symptomsLabel')}</label>
                    <textarea
                      id="symptoms"
                      value={formData.symptoms}
                      onChange={(e) => handleInputChange('symptoms', e.target.value)}
                      rows={4}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-vertical ${
                        errors.symptoms ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder={t('preRegistration.form.symptomsPlaceholder')}
                      aria-describedby={errors.symptoms ? 'symptoms-error' : undefined}
                    />
                    {errors.symptoms && (
                      <p id="symptoms-error" className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.symptoms}
                      </p>
                    )}
                  </div>
                </div>

                {/* Upload Documents Section */}
                <div>
                  <h2 className="text-xl font-semibold text-[#0A2647] dark:text-gray-100 mb-6 flex items-center">
                    <Upload className="w-5 h-5 mr-2 text-[#0075A2] dark:text-[#0EA5E9]" />
                    {t('preRegistration.form.uploadSectionTitle')}
                  </h2>
                  
                  <div className="space-y-6">
                    {/* Lab Reports */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('preRegistration.form.labReportsLabel')}</label>
                      <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-[#0075A2] dark:hover:border-[#0EA5E9] transition-colors">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                          <span className="text-[#0075A2] dark:text-[#0EA5E9] font-medium cursor-pointer hover:underline">{t('preRegistration.form.uploadFile')}</span>{' '}
                          {t('preRegistration.form.orDrag')}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('preRegistration.form.pdfJpgUpTo')}</p>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg"
                          onChange={(e) => handleFileUpload('labReports', e.target.files?.[0] || null)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          id="labReports"
                        />
                      </div>
                      {formData.labReports && (
                        <div className="mt-2">
                          <p className="text-sm text-green-600 dark:text-green-400 flex items-center">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            {formData.labReports.name} ({formatFileSize(formData.labReports.size)})
                          </p>
                          {isSubmitting && uploadProgress.labReports > 0 && (
                            <div className="mt-2">
                              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                                <span>Uploading...</span>
                                <span>{uploadProgress.labReports}%</span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                  className="bg-[#0075A2] dark:bg-[#0EA5E9] h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${uploadProgress.labReports}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Aadhaar */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('preRegistration.form.aadhaarLabel')}</label>
                      <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-[#0075A2] dark:hover:border-[#0EA5E9] transition-colors">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                          <span className="text-[#0075A2] dark:text-[#0EA5E9] font-medium cursor-pointer hover:underline">{t('preRegistration.form.uploadFile')}</span>{' '}
                          {t('preRegistration.form.orDrag')}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('preRegistration.form.pdfJpgUpTo')}</p>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg"
                          onChange={(e) => handleFileUpload('aadhaar', e.target.files?.[0] || null)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          id="aadhaar"
                        />
                      </div>
                      {formData.aadhaar && (
                        <div className="mt-2">
                          <p className="text-sm text-green-600 dark:text-green-400 flex items-center">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            {formData.aadhaar.name} ({formatFileSize(formData.aadhaar.size)})
                          </p>
                          {isSubmitting && uploadProgress.aadhaar > 0 && (
                            <div className="mt-2">
                              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                                <span>Uploading...</span>
                                <span>{uploadProgress.aadhaar}%</span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                  className="bg-[#0075A2] dark:bg-[#0EA5E9] h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${uploadProgress.aadhaar}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Digital Consent Section */}
                <div>
                  <h2 className="text-xl font-semibold text-[#0A2647] dark:text-gray-100 mb-6 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-[#0075A2] dark:text-[#0EA5E9]" />
                    {t('preRegistration.form.digitalConsentTitle')}
                  </h2>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <div className="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                      <p className="mb-3">
                        I hereby consent to the collection, processing, and storage of my personal and health information by 
                        EaseHealth for the purpose of providing healthcare services. I understand that my data will be kept 
                        confidential and used in accordance with applicable data privacy laws.
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        मैं एतद्द्वारा स्वास्थ्य सेवाएं प्रदान करने के उद्देश्य से EaseHealth द्वारा मेरी व्यक्तिगत और स्वास्थ्य जानकारी के संग्रह, प्रसंस्करण और भंडारण के लिए 
                        अपनी सहमति देता/देती हूँ। मैं समझता/समझती हूँ कि मेरा डेटा गोपनीय रखा जाएगा और लागू डेटा गोपनीयता कानूनों के अनुसार उसका उपयोग किया जाएगा।
                      </p>
                    </div>
                    
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        id="consent"
                        checked={formData.consent}
                        onChange={(e) => handleInputChange('consent', e.target.checked)}
                        className={`mt-1 w-4 h-4 text-[#0075A2] border-gray-300 dark:border-gray-600 rounded focus:ring-[#0075A2] focus:ring-2 ${
                          errors.consent ? 'border-red-500' : ''
                        }`}
                      />
                      <label htmlFor="consent" className="ml-3 text-sm text-gray-700 dark:text-gray-300">{t('preRegistration.form.consentCheckbox')}</label>
                    </div>
                    {errors.consent && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.consent as string}
                      </p>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] hover:from-[#005a7a] hover:to-[#081f3a] disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:ring-offset-2 disabled:transform-none disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        {t('preRegistration.form.submitting')}
                      </div>
                    ) : (
                      t('preRegistration.form.submit')
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column - Benefits (1/3 width) */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700 sticky top-24">
              <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-6 text-center">
                Benefits of Pre-Registration
              </h3>
              
              <div className="space-y-8">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-xl flex items-center justify-center text-white shadow-md">
                        <benefit.icon className="w-6 h-6" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-[#0A2647] dark:text-gray-100 text-base mb-3">{benefit.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-2">{benefit.description}</p>
                      {benefit.details && (
                        <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                          {benefit.details.map((detail, idx) => (
                            <li key={idx} className="flex items-start">
                              <span className="w-1 h-1 bg-[#00D4AA] rounded-full mt-2 mr-2 flex-shrink-0"></span>
                              {detail}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Process Timeline */}
              <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-bold text-[#0A2647] dark:text-gray-100 text-base mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-[#0075A2] dark:text-[#0EA5E9]" />
                  Pre-Registration Process
                </h4>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-[#0075A2] dark:bg-[#0EA5E9] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                    <div>
                      <p className="text-sm font-medium text-[#0A2647] dark:text-gray-100">Fill Form Online</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Complete registration from home</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-[#0075A2] dark:bg-[#0EA5E9] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                    <div>
                      <p className="text-sm font-medium text-[#0A2647] dark:text-gray-100">Get Queue Token</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Receive SMS with your number</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-[#00D4AA] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
                    <div>
                      <p className="text-sm font-medium text-[#0A2647] dark:text-gray-100">Walk-in & Consult</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Skip registration desk entirely</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Tips */}
              <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-bold text-[#0A2647] dark:text-gray-100 text-base mb-4 flex items-center">
                  💡 Preparation Tips
                </h4>
                <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-[#00D4AA] mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <span className="font-medium">Documents Ready:</span> Keep Aadhaar and recent lab reports in PDF/JPG format
                    </div>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-[#00D4AA] mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <span className="font-medium">Accurate Details:</span> Double-check phone number and address for SMS updates
                    </div>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-[#00D4AA] mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <span className="font-medium">Symptom Details:</span> Describe symptoms clearly to help doctors prepare
                    </div>
                  </li>
                </ul>
              </div>

              {/* Security & Privacy */}
              <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-bold text-[#0A2647] dark:text-gray-100 text-base mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-[#0075A2] dark:text-[#0EA5E9]" />
                  Security & Privacy
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <span>DPDP Act Compliant</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <span>End-to-End Encryption</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <span>Data Stored in India</span>
                  </div>
                </div>
              </div>

              {/* Support Contact */}
              <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-bold text-[#0A2647] dark:text-gray-100 text-base mb-4 flex items-center">
                  <Phone className="w-5 h-5 mr-2 text-[#0075A2] dark:text-[#0EA5E9]" />
                  Need Help?
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <Phone className="w-4 h-4 mr-3 text-[#0075A2] dark:text-[#0EA5E9]" />
                    <span>+91 80-EASEHEALTH</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <MessageCircle className="w-4 h-4 mr-3 text-[#25D366]" />
                    <span>WhatsApp Support</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Available 24/7 for technical assistance
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        mode="signup"
        context={authContext}
      />
    </div>
  );
}

export default PatientPreRegistrationPage;