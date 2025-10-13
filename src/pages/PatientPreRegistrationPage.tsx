import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Shield, 
  MessageCircle, 
  Star, 
  Heart,
  Mail,
  Home,
  ChevronRight,
  X,
  Camera
} from 'lucide-react';
import Navigation from '../components/Navigation';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslations } from '../translations';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../utils/supabase';
import { AccessibilityAnnouncer } from '../components/AccessibilityAnnouncer';

interface FormData {
  // Personal Information
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  city: string;
  state: string;
  
  // Medical Information
  medicalHistory: string;
  allergies: string;
  currentMedications: string;
  bloodType: string;
  insuranceProvider: string;
  insuranceNumber: string;
  
  // Emergency Contacts
  emergencyContactName: string;
  emergencyContactPhone: string;
  
  // Documents
  idProofFiles: File[];
  labReportFiles: File[];
  profileImageFile: File | null;
  
  // Consent
  consent: boolean;
}

interface UploadedFiles {
  idProofUrls: string[];
  labReportUrls: string[];
  profileImageUrl: string | null;
}

const PatientPreRegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, session, profile, userState, isAuthenticated, handleLogout } = useAuth();
  
  // Get booking details and user data from location state
  const bookingDetails = location.state?.bookingDetails || null;
  const userData = location.state?.userData || null;
  const { language } = useLanguage();
  const { t } = useTranslations(language);
  const { isDarkMode } = useTheme();
  
  const [formData, setFormData] = useState<FormData>({
    fullName: userData?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || '',
    email: userData?.email || user?.email || '',
    phoneNumber: userData?.phone || user?.user_metadata?.phone || '',
    dateOfBirth: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    medicalHistory: '',
    allergies: '',
    currentMedications: '',
    bloodType: '',
    insuranceProvider: '',
    insuranceNumber: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    idProofFiles: [],
    labReportFiles: [],
    profileImageFile: null,
    consent: false
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFiles>({
    idProofUrls: [],
    labReportUrls: [],
    profileImageUrl: null
  });

  // Simple translation function
  const getText = (key: string) => {
    const result = t(key);
    if (result === key) {
      console.warn(`Missing translation for key: ${key}`);
    }
    return result;
  };

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

  const genderOptions = [
    { value: 'Male', label: getText('preRegistration.gender.male') },
    { value: 'Female', label: getText('preRegistration.gender.female') },
    { value: 'Other', label: getText('preRegistration.gender.other') },
    { value: 'Prefer not to say', label: getText('preRegistration.gender.preferNotToSay') }
  ];

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFileUpload = (field: 'idProofFiles' | 'labReportFiles' | 'profileImageFile', files: FileList | null) => {
    if (!files) return;

    if (field === 'profileImageFile') {
      const file = files[0];
      if (file && validateFile(file)) {
        setFormData(prev => ({ ...prev, [field]: file }));
      }
    } else {
      const validFiles = Array.from(files).filter(validateFile);
      setFormData(prev => ({ ...prev, [field]: validFiles }));
    }
  };

  const validateFile = (file: File): boolean => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg'];
    
    if (file.size > maxSize) {
      alert(`File ${file.name} is too large. Maximum size is 10MB.`);
      return false;
    }
    
    if (!allowedTypes.includes(file.type)) {
      alert(`File ${file.name} is not supported. Only PDF and JPEG files are allowed.`);
      return false;
    }
    
    return true;
  };

  const removeFile = (field: 'idProofFiles' | 'labReportFiles' | 'profileImageFile', index?: number) => {
    if (field === 'profileImageFile') {
      setFormData(prev => ({ ...prev, [field]: null }));
    } else if (index !== undefined) {
      setFormData(prev => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index)
      }));
    }
  };

  const uploadFiles = async (): Promise<UploadedFiles> => {
    const result: UploadedFiles = {
      idProofUrls: [],
      labReportUrls: [],
      profileImageUrl: null
    };

    try {
      // Upload ID Proof files
      for (const file of formData.idProofFiles) {
        const fileName = `${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
          .from('adhaar-document')
          .upload(fileName, file);
        
        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage
          .from('adhaar-document')
          .getPublicUrl(fileName);
        
        result.idProofUrls.push(publicUrl);
      }

      // Upload Lab Report files
      for (const file of formData.labReportFiles) {
        const fileName = `${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
          .from('lab-reports')
          .upload(fileName, file);
        
        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage
          .from('lab-reports')
          .getPublicUrl(fileName);
        
        result.labReportUrls.push(publicUrl);
      }

      // Upload Profile Image
      if (formData.profileImageFile) {
        const fileName = `${Date.now()}-${formData.profileImageFile.name}`;
        const { data, error } = await supabase.storage
          .from('profile_image')
          .upload(fileName, formData.profileImageFile);
        
        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage
          .from('profile_image')
          .getPublicUrl(fileName);
        
        result.profileImageUrl = publicUrl;
      }

      return result;
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    // Required fields
    if (!formData.fullName.trim()) newErrors.fullName = getText('preRegistration.validation.fullNameRequired');
    if (!formData.email.trim()) newErrors.email = getText('preRegistration.validation.emailRequired');
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = getText('preRegistration.validation.phoneRequired');
    if (!formData.dateOfBirth) newErrors.dateOfBirth = getText('preRegistration.validation.dateOfBirthRequired');
    if (!formData.gender) newErrors.gender = getText('preRegistration.validation.genderRequired');
    if (!formData.address.trim()) newErrors.address = getText('preRegistration.validation.addressRequired');
    if (!formData.emergencyContactName.trim()) newErrors.emergencyContactName = getText('preRegistration.validation.emergencyContactNameRequired');
    if (!formData.emergencyContactPhone.trim()) newErrors.emergencyContactPhone = getText('preRegistration.validation.emergencyContactPhoneRequired');
    if (!formData.consent) newErrors.consent = getText('preRegistration.validation.consentRequired');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setAnnouncement('Creating your profile...');

    try {
      // Upload files first
      const uploadedFiles = await uploadFiles();

      // Prepare patient data
      const patientData = {
        user_id: user?.id || null,
        full_name: formData.fullName,
        email: formData.email,
        phone_number: formData.phoneNumber,
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        emergency_contact_name: formData.emergencyContactName,
        emergency_contact_phone: formData.emergencyContactPhone,
        medical_history: formData.medicalHistory || null,
        allergies: formData.allergies || null,
        current_medications: formData.currentMedications || null,
        insurance_provider: formData.insuranceProvider || null,
        insurance_number: formData.insuranceNumber || null,
        blood_type: formData.bloodType || null,
        profile_image_url: uploadedFiles.profileImageUrl,
        id_proof_urls: uploadedFiles.idProofUrls,
        lab_report_urls: uploadedFiles.labReportUrls,
        is_active: true
      };

      // Insert into patients table
      const { data: patientResult, error: patientError } = await supabase
        .from('patients')
        .insert([patientData])
        .select()
        .single();

      if (patientError) throw patientError;

      // Insert into patient_pre_registrations table
      const { error: preRegError } = await supabase
        .from('patient_pre_registrations')
        .insert([patientData]);

      if (preRegError) throw preRegError;

      setSubmitSuccess(true);
      setAnnouncement('Profile created successfully!');
      
      // Redirect after 2 seconds - if booking details exist, redirect to appointment booking with auth success
      setTimeout(() => {
        if (bookingDetails) {
          navigate('/smart-appointment-booking', {
            state: {
              bookingDetails,
              authSuccess: true
            }
          });
        } else {
          navigate('/smart-appointment-booking');
        }
      }, 2000);

    } catch (error) {
      console.error('Error creating profile:', error);
      setAnnouncement('Failed to create profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
        <AccessibilityAnnouncer message={announcement} />
        <Navigation 
          user={user}
          session={session}
          profile={profile}
          userState={userState}
          isAuthenticated={isAuthenticated}
          handleLogout={handleLogout}
        />
        
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="text-center">
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {getText('preRegistration.success.title')}
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              {getText('preRegistration.success.subtitle')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/smart-appointment-booking"
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                {getText('preRegistration.success.bookAppointment')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
      <AccessibilityAnnouncer message={announcement} />
      <Navigation 
        user={user}
        session={session}
        profile={profile}
        userState={userState}
        isAuthenticated={isAuthenticated}
        handleLogout={handleLogout}
      />
      
      <div className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link 
            to="/" 
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors mb-8"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            {getText('preRegistration.navigation.backToHome')}
          </Link>

          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#0A2647] dark:text-gray-100 leading-tight mb-6">
              {getText('preRegistration.title')}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              {getText('preRegistration.subtitle')}
            </p>
            
            {/* Booking Summary */}
            {bookingDetails && (
              <div className="bg-gradient-to-r from-[#0075A2] to-[#0A2647] rounded-xl p-6 text-white mb-8 max-w-2xl mx-auto">
                <h3 className="text-lg font-semibold mb-3">Your Appointment Booking</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/80">Doctor:</span>
                    <span className="font-medium">{bookingDetails.selectedDoctor?.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80">Date:</span>
                    <span className="font-medium">{bookingDetails.selectedDate?.toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80">Time:</span>
                    <span className="font-medium">{bookingDetails.selectedTime}</span>
                  </div>
                </div>
                <p className="text-xs text-white/70 mt-3">
                  Complete your profile to confirm this appointment
                </p>
              </div>
            )}
            
            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-8 mb-8">
              <div className="flex items-center text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center mr-3">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{getText('preRegistration.stats.secure.value')}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{getText('preRegistration.stats.secure.label')}</p>
                </div>
              </div>
              <div className="flex items-center text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center mr-3">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{getText('preRegistration.stats.setup.value')}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{getText('preRegistration.stats.setup.label')}</p>
                </div>
              </div>
              <div className="flex items-center text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center mr-3">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{getText('preRegistration.stats.care.value')}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{getText('preRegistration.stats.care.label')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Form */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-12">
              
              {/* Personal Information Section */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                    <User className="w-6 h-6 mr-3 text-blue-600" />
                    {getText('preRegistration.sections.personalInfo.title')}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mt-2">
                    {getText('preRegistration.sections.personalInfo.subtitle')}
                  </p>
                  {user && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                      Auto populate the data based on login
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {getText('preRegistration.formLabels.fullName')}
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                        errors.fullName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder={getText('preRegistration.placeholders.fullName')}
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
                      {getText('preRegistration.formLabels.email')}
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                        errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder={getText('preRegistration.placeholders.email')}
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
                      {getText('preRegistration.formLabels.phone')}
                    </label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                        errors.phoneNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder={getText('preRegistration.placeholders.phone')}
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
                      {getText('preRegistration.formLabels.dateOfBirth')}
                    </label>
                    <input
                      type="date"
                      id="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
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

                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {getText('preRegistration.formLabels.gender')}
                    </label>
                    <select
                      id="gender"
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                        errors.gender ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <option value="">{getText('preRegistration.placeholders.gender')}</option>
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

                  <div className="md:col-span-2">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {getText('preRegistration.formLabels.address')}
                    </label>
                    <textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      rows={3}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                        errors.address ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder={getText('preRegistration.placeholders.address')}
                    />
                    {errors.address && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.address}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {getText('preRegistration.formLabels.city')}
                    </label>
                    <input
                      type="text"
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder={getText('preRegistration.placeholders.city')}
                    />
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {getText('preRegistration.formLabels.state')}
                    </label>
                    <input
                      type="text"
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder={getText('preRegistration.placeholders.state')}
                    />
                  </div>
                </div>
              </div>

              {/* Medical Information Section */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                    <Heart className="w-6 h-6 mr-3 text-blue-600" />
                    {getText('preRegistration.sections.medicalHistory.title')}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mt-2">
                    {getText('preRegistration.sections.medicalHistory.subtitle')}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label htmlFor="medicalHistory" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {getText('preRegistration.formLabels.medicalHistory')}
                    </label>
                    <textarea
                      id="medicalHistory"
                      value={formData.medicalHistory}
                      onChange={(e) => handleInputChange('medicalHistory', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder={getText('preRegistration.placeholders.medicalHistory')}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="allergies" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {getText('preRegistration.formLabels.allergies')}
                    </label>
                    <textarea
                      id="allergies"
                      value={formData.allergies}
                      onChange={(e) => handleInputChange('allergies', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder={getText('preRegistration.placeholders.allergies')}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="currentMedications" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {getText('preRegistration.formLabels.currentMedications')}
                    </label>
                    <textarea
                      id="currentMedications"
                      value={formData.currentMedications}
                      onChange={(e) => handleInputChange('currentMedications', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder={getText('preRegistration.placeholders.currentMedications')}
                    />
                  </div>

                  <div>
                    <label htmlFor="bloodType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {getText('preRegistration.formLabels.bloodType')}
                    </label>
                    <select
                      id="bloodType"
                      value={formData.bloodType}
                      onChange={(e) => handleInputChange('bloodType', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">{getText('preRegistration.placeholders.bloodType')}</option>
                      {bloodTypeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="insuranceProvider" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {getText('preRegistration.formLabels.insuranceProvider')}
                    </label>
                    <input
                      type="text"
                      id="insuranceProvider"
                      value={formData.insuranceProvider}
                      onChange={(e) => handleInputChange('insuranceProvider', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder={getText('preRegistration.placeholders.insuranceProvider')}
                    />
                  </div>

                  <div>
                    <label htmlFor="insuranceNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {getText('preRegistration.formLabels.insuranceNumber')}
                    </label>
                    <input
                      type="text"
                      id="insuranceNumber"
                      value={formData.insuranceNumber}
                      onChange={(e) => handleInputChange('insuranceNumber', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder={getText('preRegistration.placeholders.insuranceNumber')}
                    />
                  </div>
                </div>
              </div>

              {/* Document Upload Section */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                    <Upload className="w-6 h-6 mr-3 text-blue-600" />
                    {getText('preRegistration.sections.documents.title')}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    {getText('preRegistration.sections.documents.subtitle')}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* ID Proof Upload */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{getText('preRegistration.documents.idProof.title')}</h3>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        id="idProof"
                        multiple
                        accept=".pdf,.jpg,.jpeg"
                        onChange={(e) => handleFileUpload('idProofFiles', e.target.files)}
                        className="hidden"
                      />
                      <label htmlFor="idProof" className="cursor-pointer">
                        <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-300">{getText('preRegistration.documents.uploadText')}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{getText('preRegistration.documents.fileFormats')}</p>
                      </label>
                    </div>
                    {formData.idProofFiles.length > 0 && (
                      <div className="space-y-2">
                        {formData.idProofFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded">
                            <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{file.name}</span>
                            <button
                              type="button"
                              onClick={() => removeFile('idProofFiles', index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Lab Reports Upload */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{getText('preRegistration.documents.labReports.title')}</h3>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        id="labReports"
                        multiple
                        accept=".pdf,.jpg,.jpeg"
                        onChange={(e) => handleFileUpload('labReportFiles', e.target.files)}
                        className="hidden"
                      />
                      <label htmlFor="labReports" className="cursor-pointer">
                        <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-300">{getText('preRegistration.documents.uploadText')}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{getText('preRegistration.documents.fileFormats')}</p>
                      </label>
                    </div>
                    {formData.labReportFiles.length > 0 && (
                      <div className="space-y-2">
                        {formData.labReportFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded">
                            <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{file.name}</span>
                            <button
                              type="button"
                              onClick={() => removeFile('labReportFiles', index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Profile Image Upload */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{getText('preRegistration.documents.profileImage.title')}</h3>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        id="profileImage"
                        accept=".jpg,.jpeg"
                        onChange={(e) => handleFileUpload('profileImageFile', e.target.files)}
                        className="hidden"
                      />
                      <label htmlFor="profileImage" className="cursor-pointer">
                        <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-300">{getText('preRegistration.documents.uploadText')}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{getText('preRegistration.documents.imageFormats')}</p>
                      </label>
                    </div>
                    {formData.profileImageFile && (
                      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded">
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{formData.profileImageFile.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile('profileImageFile')}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Emergency Contacts Section */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                    <Phone className="w-6 h-6 mr-3 text-blue-600" />
                    {getText('preRegistration.sections.emergencyContacts.title')}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mt-2">
                    {getText('preRegistration.sections.emergencyContacts.subtitle')}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="emergencyContactName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {getText('preRegistration.formLabels.emergencyContactName')}
                    </label>
                    <input
                      type="text"
                      id="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                        errors.emergencyContactName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder={getText('preRegistration.placeholders.emergencyContactName')}
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
                      {getText('preRegistration.formLabels.emergencyContactPhone')}
                    </label>
                    <input
                      type="tel"
                      id="emergencyContactPhone"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                        errors.emergencyContactPhone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder={getText('preRegistration.placeholders.emergencyContactPhone')}
                    />
                    {errors.emergencyContactPhone && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.emergencyContactPhone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-4 mt-0.5">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                        {getText('preRegistration.emergencyInfo.title')}
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {getText('preRegistration.emergencyInfo.description')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Consent Section */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                    <CheckCircle className="w-6 h-6 mr-3 text-blue-600" />
                    {getText('preRegistration.sections.consent.title')}
                  </h2>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-4 mt-0.5">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                        {getText('preRegistration.consent.whyConsentTitle')}
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                        {getText('preRegistration.consent.whyConsentDescription')}
                      </p>
                      <div className="space-y-3 text-sm text-blue-700 dark:text-blue-300">
                        <p><strong>{getText('preRegistration.consent.securityTitle')}:</strong> {getText('preRegistration.consent.detailedText1')}</p>
                        <p><strong>{getText('preRegistration.consent.accessTitle')}:</strong> {getText('preRegistration.consent.detailedText2')}</p>
                        <p><strong>{getText('preRegistration.consent.protectionTitle')}:</strong> {getText('preRegistration.consent.detailedText3')}</p>
                        <p><strong>{getText('preRegistration.consent.rightsTitle')}:</strong> {getText('preRegistration.consent.detailedText4')}</p>
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
                      className={`mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 ${
                        errors.consent ? 'border-red-500' : ''
                      }`}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {getText('preRegistration.consent.agreementText')}
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

              {/* Submit Button */}
              <div className="flex justify-end pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex items-center px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 transform hover:scale-105 ${
                    isSubmitting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                      Creating Profile...
                    </>
                  ) : (
                    <>
                      Create Profile
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientPreRegistrationPage;