import React, { useState } from 'react';
import { ArrowLeft, Upload, FileText, User, Phone, MapPin, Calendar, CheckCircle, AlertCircle, Clock, Shield, MessageCircle, Star, Zap, Heart, Mail, Home, UserCheck, ChevronRight, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { useDarkMode } from '../hooks/useDarkMode';
import AuthModal from '../components/AuthModal';
import { AccessibilityAnnouncer } from '../components/AccessibilityAnnouncer';
import { createPatientProfile, getPatientProfile } from '../utils/supabase';
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
  consent: boolean;
}

function PatientPreRegistrationPage({ user, session, profile, userState, isAuthenticated, handleLogout }: AuthProps) {
  const { language } = useLanguage();
  const { t } = useTranslations(language);
  const { isDarkMode } = useDarkMode();
  
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  
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
    consent: false
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const steps = [
    { number: 1, title: 'Personal Information', icon: User, description: 'Basic details about you' },
    { number: 2, title: 'Medical Information', icon: Heart, description: 'Your health history' },
    { number: 3, title: 'Emergency Contacts', icon: Phone, description: 'Who to contact in emergencies' },
    { number: 4, title: 'Review & Consent', icon: CheckCircle, description: 'Final review and consent' }
  ];

  const genderOptions = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other', label: 'Other' },
    { value: 'Prefer not to say', label: 'Prefer not to say' }
  ];

  const bloodTypeOptions = [
    { value: 'A+', label: 'A+' },
    { value: 'A-', label: 'A-' },
    { value: 'B+', label: 'B+' },
    { value: 'B-', label: 'B-' },
    { value: 'AB+', label: 'AB+' },
    { value: 'AB-', label: 'AB-' },
    { value: 'O+', label: 'O+' },
    { value: 'O-', label: 'O-' },
    { value: 'Unknown', label: 'Unknown' }
  ];

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<FormData> = {};

    switch (step) {
      case 1:
        if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
        if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
        if (!formData.gender) newErrors.gender = 'Gender is required';
        break;
      case 2:
        if (!formData.address.trim()) newErrors.address = 'Address is required';
        break;
      case 3:
        if (!formData.emergencyContactName.trim()) newErrors.emergencyContactName = 'Emergency contact name is required';
        if (!formData.emergencyContactPhone.trim()) newErrors.emergencyContactPhone = 'Emergency contact phone is required';
        break;
      case 4:
        if (!formData.consent) newErrors.consent = 'You must agree to the terms and conditions';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) {
      return;
    }

    if (currentStep < totalSteps) {
      handleNext();
      return;
    }

    setIsSubmitting(true);
    try {
      if (!user) {
        setShowAuthModal(true);
        return;
      }

      // Check if user already has a patient profile
      const existingProfile = await getPatientProfile(user.id);
      
      if (existingProfile) {
        setAnnouncement('You already have a patient profile.');
        return;
      }

      // Create patient profile
      await createPatientProfile(user.id, {
        full_name: formData.fullName,
        email: formData.email,
        phone_number: formData.phoneNumber,
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender,
        address: formData.address,
        emergency_contact_name: formData.emergencyContactName,
        emergency_contact_phone: formData.emergencyContactPhone,
        medical_history: formData.medicalHistory || null,
        allergies: formData.allergies || null,
        current_medications: formData.currentMedications || null,
        insurance_provider: formData.insuranceProvider || null,
        insurance_number: formData.insuranceNumber || null,
        blood_type: formData.bloodType || null,
        is_active: true
      });

      setSubmitSuccess(true);
      setAnnouncement('Patient profile created successfully!');
    } catch (error) {
      console.error('Error creating patient profile:', error);
      setAnnouncement('Failed to create patient profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const authContext = {
    title: 'Complete Your Patient Profile',
    description: 'To create your patient profile, please sign in to your account or create a new one.',
    actionText: 'Sign In & Create Profile',
    showSignupOption: true
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    errors.fullName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder={t('preRegistration.placeholders.fullName')}
                />
                {errors.fullName && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.fullName}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder={t('preRegistration.placeholders.email')}
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    errors.phoneNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder={t('preRegistration.placeholders.phone')}
                />
                {errors.phoneNumber && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.phoneNumber}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  id="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    errors.dateOfBirth ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.dateOfBirth && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.dateOfBirth}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Gender *
                </label>
                <select
                  id="gender"
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    errors.gender ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <option value="">Select gender</option>
                  {genderOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.gender && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.gender}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Address *
              </label>
              <textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={3}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                  errors.address ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder={t('preRegistration.placeholders.address')}
              />
              {errors.address && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.address}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="medicalHistory" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Medical History
                </label>
                <textarea
                  id="medicalHistory"
                  value={formData.medicalHistory}
                  onChange={(e) => handleInputChange('medicalHistory', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Any previous medical conditions, surgeries, etc."
                />
              </div>

              <div>
                <label htmlFor="allergies" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Allergies
                </label>
                <textarea
                  id="allergies"
                  value={formData.allergies}
                  onChange={(e) => handleInputChange('allergies', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Any known allergies"
                />
              </div>

              <div>
                <label htmlFor="currentMedications" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Medications
                </label>
                <textarea
                  id="currentMedications"
                  value={formData.currentMedications}
                  onChange={(e) => handleInputChange('currentMedications', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Current medications you are taking"
                />
              </div>

              <div>
                <label htmlFor="bloodType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Blood Type
                </label>
                <select
                  id="bloodType"
                  value={formData.bloodType}
                  onChange={(e) => handleInputChange('bloodType', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Select blood type</option>
                  {bloodTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="insuranceProvider" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Insurance Provider
                </label>
                <input
                  type="text"
                  id="insuranceProvider"
                  value={formData.insuranceProvider}
                  onChange={(e) => handleInputChange('insuranceProvider', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Your insurance provider"
                />
              </div>

              <div>
                <label htmlFor="insuranceNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Insurance Number
                </label>
                <input
                  type="text"
                  id="insuranceNumber"
                  value={formData.insuranceNumber}
                  onChange={(e) => handleInputChange('insuranceNumber', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Your insurance policy number"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="emergencyContactName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Emergency Contact Name *
                </label>
                <input
                  type="text"
                  id="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    errors.emergencyContactName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Emergency contact full name"
                />
                {errors.emergencyContactName && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.emergencyContactName}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="emergencyContactPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Emergency Contact Phone *
                </label>
                <input
                  type="tel"
                  id="emergencyContactPhone"
                  value={formData.emergencyContactPhone}
                  onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    errors.emergencyContactPhone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Emergency contact phone number"
                />
                {errors.emergencyContactPhone && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.emergencyContactPhone}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-4 mt-0.5">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">Why do we need emergency contact information?</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    In case of medical emergencies, we may need to contact someone on your behalf. This information helps us provide better care and ensures your safety.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Review Your Information</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</p>
                    <p className="text-gray-900 dark:text-gray-100">{formData.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
                    <p className="text-gray-900 dark:text-gray-100">{formData.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</p>
                    <p className="text-gray-900 dark:text-gray-100">{formData.phoneNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Date of Birth</p>
                    <p className="text-gray-900 dark:text-gray-100">{formData.dateOfBirth}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Gender</p>
                    <p className="text-gray-900 dark:text-gray-100">{formData.gender}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Blood Type</p>
                    <p className="text-gray-900 dark:text-gray-100">{formData.bloodType || 'Not specified'}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</p>
                  <p className="text-gray-900 dark:text-gray-100">{formData.address}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Emergency Contact</p>
                    <p className="text-gray-900 dark:text-gray-100">{formData.emergencyContactName}</p>
                    <p className="text-gray-900 dark:text-gray-100">{formData.emergencyContactPhone}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Insurance</p>
                    <p className="text-gray-900 dark:text-gray-100">{formData.insuranceProvider || 'Not specified'}</p>
                    {formData.insuranceNumber && (
                      <p className="text-gray-900 dark:text-gray-100">{formData.insuranceNumber}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={formData.consent}
                  onChange={(e) => handleInputChange('consent', e.target.checked)}
                  className={`mt-1 w-5 h-5 text-[#0075A2] border-gray-300 rounded focus:ring-[#0075A2] focus:ring-2 ${
                    errors.consent ? 'border-red-500' : ''
                  }`}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  I agree to the{' '}
                  <Link to="/terms" className="text-[#0075A2] hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-[#0075A2] hover:underline">
                    Privacy Policy
                  </Link>
                  . I consent to the collection and use of my medical information for providing healthcare services.
                </span>
              </label>
              {errors.consent && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.consent}
                </p>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-[#F6F6F6] dark:bg-gray-900 text-[#0A2647] dark:text-gray-100 transition-colors duration-300">
        <AccessibilityAnnouncer message={announcement} />
        <Navigation 
          user={user}
          session={session}
          profile={profile}
          userState={userState}
          isAuthenticated={isAuthenticated}
          handleLogout={handleLogout}
        />
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Profile Created Successfully!
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Your patient profile has been created. You can now book appointments and access our healthcare services.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/smart-appointment-booking"
                className="bg-gradient-to-r from-[#0075A2] to-[#0A2647] text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                Book an Appointment
              </Link>
              <Link
                to="/patient-dashboard"
                className="bg-white dark:bg-gray-800 text-[#0075A2] border-2 border-[#0075A2] px-8 py-4 rounded-xl font-semibold hover:bg-[#0075A2] hover:text-white transition-all duration-200"
              >
                View Dashboard
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F6F6] dark:bg-gray-900 text-[#0A2647] dark:text-gray-100 transition-colors duration-300">
      <AccessibilityAnnouncer message={announcement} />
      <Navigation 
        user={user}
        session={session}
        profile={profile}
        userState={userState}
        isAuthenticated={isAuthenticated}
        handleLogout={handleLogout}
      />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link 
          to="/" 
          className="inline-flex items-center text-[#0075A2] dark:text-[#0EA5E9] hover:text-[#0A2647] dark:hover:text-gray-100 transition-colors mb-8 focus-ring"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </Link>

        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            Pre-Registration
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Help us provide you with the best possible care by completing your medical profile. This information will help our doctors serve you better.
          </p>
          
          {/* Quick Stats */}
          <div className="flex flex-wrap justify-center gap-8 mb-12">
            <div className="flex items-center text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-full flex items-center justify-center mr-3">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">100%</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Secure & Private</p>
              </div>
            </div>
            <div className="flex items-center text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-full flex items-center justify-center mr-3">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">5 Min</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Quick Setup</p>
              </div>
            </div>
            <div className="flex items-center text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-full flex items-center justify-center mr-3">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">Better</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Care Experience</p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-10">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-4">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = currentStep > step.number;
                const isCurrent = currentStep === step.number;
                
                return (
                  <React.Fragment key={step.number}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                      isCompleted 
                        ? 'bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] text-white shadow-lg scale-110' 
                        : isCurrent
                          ? 'bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] text-white shadow-lg scale-110'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                    }`}>
                      {isCompleted ? <CheckCircle className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-20 h-1 rounded-full transition-all duration-300 ${
                        isCompleted ? 'bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7]' : 'bg-gray-200 dark:bg-gray-600'
                      }`}></div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Step {currentStep} of {totalSteps}: {steps[currentStep - 1]?.title}
            </p>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 lg:p-10 border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSubmit}>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {steps[currentStep - 1]?.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                {steps[currentStep - 1]?.description}
              </p>
            </div>

            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-10">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className={`flex items-center px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  currentStep === 1
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                }`}
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Previous
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex items-center px-8 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 ${
                  isSubmitting
                    ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#0075A2] to-[#0A2647] hover:from-[#005a7a] hover:to-[#081f3a] text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {currentStep === totalSteps ? 'Creating Profile...' : 'Validating...'}
                  </>
                ) : (
                  <>
                    {currentStep === totalSteps ? 'Create Profile' : 'Next'}
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Help Section */}
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
            Why We Need This Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Better Care</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Your medical history helps doctors make informed decisions about your treatment.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Safety First</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Emergency contacts and medical information ensure your safety in urgent situations.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Faster Service</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Pre-filled information speeds up your appointments and reduces waiting time.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            handleSubmit(new Event('submit') as any);
          }}
          context={authContext}
        />
      )}
    </div>
  );
}

export default PatientPreRegistrationPage;
