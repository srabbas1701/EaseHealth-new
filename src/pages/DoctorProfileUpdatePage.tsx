import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, Upload, X, CheckCircle, AlertCircle, User, Building,
  Video, PhoneIcon, Lock, FileText, CreditCard, Shield
} from 'lucide-react';
import Navigation from '../components/Navigation';
import { AccessibilityAnnouncer } from '../components/AccessibilityAnnouncer';
import { supabase, getDoctorIdByUserId } from '../utils/supabase';
import {
  uploadDoctorDocument,
  DoctorDocumentType,
  getDoctorSignedUrl
} from '../utils/doctorFileUploadUtils';

// Auth props interface
interface AuthProps {
  user: any;
  session: any;
  profile: any;
  userState: 'new' | 'returning' | 'authenticated';
  isAuthenticated: boolean;
  isLoadingInitialAuth: boolean;
  isProfileLoading: boolean;
  handleLogout: () => Promise<void>;
}

// Doctor profile data interface
interface DoctorProfileData {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone_number: string;
  specialty: string;
  license_number: string;
  experience_years: number;
  qualification: string;
  hospital_affiliation?: string;
  consultation_fee?: number;
  profile_image_url?: string;
  bio?: string;
  medical_registration_number?: string;
  issuing_council?: string;
  year_of_registration?: number;
  aadhaar_number?: string;
  pan_number?: string;
  super_specialization?: string;
  qualifications?: any;
  total_years_of_experience?: number;
  professional_bio?: string;
  languages_spoken?: string[];
  practice_locations?: any;
  consultation_types?: string[];
  consultation_fees?: any;
  services_offered?: string[];
  bank_account_holder_name?: string;
  bank_account_number?: string;
  ifsc_code?: string;
  bank_name?: string;
  bank_branch?: string;
}

function DoctorProfileUpdatePage({ user, session, profile, userState, isAuthenticated, isLoadingInitialAuth, isProfileLoading, handleLogout }: AuthProps) {
  const navigate = useNavigate();
  const [announcement, setAnnouncement] = useState('');
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);

  // Form state - editable fields only
  const [formData, setFormData] = useState({
    phone_number: '',
    hospital_affiliation: '',
    consultation_fee: 0,
    bio: '',
    super_specialization: '',
    professional_bio: '',
    languages_spoken: [] as string[],
    consultation_types: [] as string[],
    services_offered: [] as string[],
    bank_account_holder_name: '',
    bank_name: '',
    bank_branch: ''
  });

  // File upload states
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>('');

  // Available options
  const languages = [
    'English', 'Hindi', 'Marathi', 'Tamil', 'Bengali', 'Telugu', 'Gujarati',
    'Kannada', 'Malayalam', 'Punjabi', 'Urdu', 'Odia', 'Assamese'
  ];

  const consultationTypes = [
    { id: 'In-Clinic', label: 'In-Clinic Consultation', icon: Building },
    { id: 'Video', label: 'Video Teleconsultation', icon: Video },
    { id: 'Audio', label: 'Audio Teleconsultation', icon: PhoneIcon }
  ];

  const servicesOptions = [
    'General Consultation', 'Follow-up Consultation', 'Health Checkup',
    'Prescription Refill', 'Medical Certificate', 'Second Opinion',
    'Emergency Consultation', 'Home Visit', 'Corporate Health Services'
  ];

  // Load doctor profile
  const loadDoctorProfile = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    setIsLoading(true);
    try {
      const doctorId = await getDoctorIdByUserId(user.id);

      if (doctorId) {
        const { data: doctorData, error: doctorError } = await supabase
          .from('doctors')
          .select('*')
          .eq('id', doctorId)
          .single();

        if (!doctorError && doctorData) {
          setDoctorProfile(doctorData);

          // Set editable form fields
          setFormData({
            phone_number: doctorData.phone_number || '',
            hospital_affiliation: doctorData.hospital_affiliation || '',
            consultation_fee: doctorData.consultation_fee || 0,
            bio: doctorData.bio || '',
            super_specialization: doctorData.super_specialization || '',
            professional_bio: doctorData.professional_bio || '',
            languages_spoken: doctorData.languages_spoken || [],
            consultation_types: doctorData.consultation_types || [],
            services_offered: doctorData.services_offered || [],
            bank_account_holder_name: doctorData.bank_account_holder_name || '',
            bank_name: doctorData.bank_name || '',
            bank_branch: doctorData.bank_branch || ''
          });

          // Load profile image if exists
          if (doctorData.profile_image_url) {
            try {
              const imageUrl = await getDoctorSignedUrl(
                doctorData.profile_image_url,
                'profile_image'
              );
              if (imageUrl) {
                setProfileImagePreview(imageUrl);
              }
            } catch (error) {
              console.error('Error loading profile image:', error);
              // Continue without profile image
            }
          }
        } else if (doctorError) {
          console.error('Database error:', doctorError);
          setSaveError(`Failed to load doctor profile: ${doctorError.message}`);
        } else {
          setSaveError('Doctor profile not found. Please complete registration first.');
        }
      } else {
        setSaveError('Doctor ID not found. Please complete registration first.');
      }
    } catch (error) {
      console.error('Error loading doctor profile:', error);
      setSaveError('Failed to load doctor profile');
      setAnnouncement('Failed to load doctor profile');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  // Load data on mount
  useEffect(() => {
    loadDoctorProfile();
  }, [loadDoctorProfile]);

  // Handle form field changes
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setSaveError('');
  };

  // Handle array field toggle
  const handleArrayToggle = (field: 'languages_spoken' | 'consultation_types' | 'services_offered', value: string) => {
    setFormData(prev => {
      const currentArray = prev[field];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      return {
        ...prev,
        [field]: newArray
      };
    });
  };

  // Handle profile image upload
  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setSaveError('Profile image must be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setSaveError('Please select a valid image file');
        return;
      }

      setProfileImage(file);
      setProfileImagePreview(URL.createObjectURL(file));
      setSaveError('');
    }
  };

  // Save profile updates
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!doctorProfile) return;

    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    try {
      // Upload profile image if changed
      let profileImageUrl = doctorProfile.profile_image_url;

      if (profileImage) {
        setUploadingFile('profile_image');
        try {
          const uploadResult = await uploadDoctorDocument(
            profileImage,
            doctorProfile.id,
            'profile_image'
          );

          if (uploadResult.publicUrl) {
            profileImageUrl = uploadResult.publicUrl;
          } else if (uploadResult.path) {
            profileImageUrl = uploadResult.path;
          } else {
            throw new Error('Failed to upload profile image');
          }
        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error(uploadError instanceof Error ? uploadError.message : 'Failed to upload profile image');
        } finally {
          setUploadingFile(null);
        }
      }

      // Update doctor profile
      const { error: updateError } = await supabase
        .from('doctors')
        .update({
          phone_number: formData.phone_number,
          hospital_affiliation: formData.hospital_affiliation || null,
          consultation_fee: formData.consultation_fee || null,
          bio: formData.bio || null,
          super_specialization: formData.super_specialization || null,
          professional_bio: formData.professional_bio || null,
          languages_spoken: formData.languages_spoken.length > 0 ? formData.languages_spoken : null,
          consultation_types: formData.consultation_types.length > 0 ? formData.consultation_types : null,
          services_offered: formData.services_offered.length > 0 ? formData.services_offered : null,
          bank_account_holder_name: formData.bank_account_holder_name || null,
          bank_name: formData.bank_name || null,
          bank_branch: formData.bank_branch || null,
          profile_image_url: profileImageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', doctorProfile.id);

      if (updateError) throw updateError;

      setSaveSuccess(true);
      setAnnouncement('Profile updated successfully');

      // Reload profile data
      await loadDoctorProfile();

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);

    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save profile');
      setAnnouncement('Failed to save profile');
    } finally {
      setIsSaving(false);
      setUploadingFile(null);
    }
  };

  // Show loading state
  if (isLoadingInitialAuth || isLoading) {
    return (
      <div className="min-h-screen bg-[#F6F6F6] dark:bg-gray-900 text-[#0A2647] dark:text-gray-100 transition-colors duration-300">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#0075A2] border-t-transparent mx-auto mb-4"></div>
            <p className="text-lg text-gray-600 dark:text-gray-300">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  // Authentication check
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F6F6F6] dark:bg-gray-900 text-[#0A2647] dark:text-gray-100 transition-colors duration-300">
        <Navigation
          user={user}
          session={session}
          profile={profile}
          userState={userState}
          isAuthenticated={isAuthenticated}
          handleLogout={handleLogout}
        />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-[#0A2647] dark:text-gray-100 mb-4">Login Required</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8">Please log in to update your profile.</p>
            <Link
              to="/login-page"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#0075A2] to-[#0A2647] text-white rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-1 transition-all"
            >
              Go to Login
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!doctorProfile) {
    return (
      <div className="min-h-screen bg-[#F6F6F6] dark:bg-gray-900 text-[#0A2647] dark:text-gray-100 transition-colors duration-300">
        <Navigation
          user={user}
          session={session}
          profile={profile}
          userState={userState}
          isAuthenticated={isAuthenticated}
          handleLogout={handleLogout}
        />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-[#0A2647] dark:text-gray-100 mb-4">Profile Not Found</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Please complete your doctor registration first.
            </p>
            <Link
              to="/doctor-registration"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#0075A2] to-[#0A2647] text-white rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-1 transition-all"
            >
              Complete Registration
            </Link>
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

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          to="/doctor-dashboard"
          className="inline-flex items-center text-[#0075A2] dark:text-[#0EA5E9] hover:text-[#0A2647] dark:hover:text-gray-100 transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </Link>

        {/* Page Header - Matching Dashboard Design */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-[#E8E8E8] dark:border-gray-600 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-2xl flex items-center justify-center text-white font-bold text-3xl overflow-hidden">
                {profileImagePreview ? (
                  <img
                    src={profileImagePreview}
                    alt="Profile"
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  <User className="w-12 h-12" />
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#0A2647] dark:text-gray-100 mb-1">
                  Dr. {doctorProfile.full_name}
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  {doctorProfile.specialty}{doctorProfile.super_specialization ? ` - ${doctorProfile.super_specialization}` : ''}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Update your professional information and practice details
                </p>
              </div>
            </div>
            <Link
              to="/doctor-dashboard"
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-sm font-medium"
            >
              View Dashboard
            </Link>
          </div>
        </div>

        {/* Success/Error Messages */}
        {saveSuccess && (
          <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 shadow-sm">
            <div className="flex items-start">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-1">
                  Profile Updated Successfully!
                </h3>
                <p className="text-sm text-green-800 dark:text-green-200">
                  Your profile information has been saved.
                </p>
              </div>
            </div>
          </div>
        )}

        {saveError && (
          <div className="mb-6 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 shadow-sm">
            <div className="flex items-start">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-red-900 dark:text-red-100 mb-1">
                  Error Saving Profile
                </h3>
                <p className="text-sm text-red-800 dark:text-red-200">{saveError}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-8">
          {/* Non-Editable Information Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-[#E8E8E8] dark:border-gray-600">
            <div className="flex items-center mb-6">
              <Lock className="w-5 h-5 text-gray-400 mr-2" />
              <h2 className="text-xl font-bold text-[#0A2647] dark:text-gray-100">
                Registration Details (Non-Editable)
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <div className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300">
                  {doctorProfile.full_name}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <div className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300">
                  {doctorProfile.email}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Medical Registration Number
                </label>
                <div className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300">
                  {doctorProfile.medical_registration_number || doctorProfile.license_number}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Primary Specialty
                </label>
                <div className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300">
                  {doctorProfile.specialty}
                </div>
              </div>

              {doctorProfile.issuing_council && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Issuing Council
                  </label>
                  <div className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300">
                    {doctorProfile.issuing_council}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Profile Image Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-[#E8E8E8] dark:border-gray-600">
            <h2 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-6">Profile Picture</h2>

            <div className="flex items-center space-x-6">
              <div className="w-32 h-32 bg-gradient-to-r from-[#0075A2] to-[#0A2647] rounded-2xl flex items-center justify-center text-white font-bold text-4xl overflow-hidden">
                {profileImagePreview ? (
                  <img src={profileImagePreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-16 h-16" />
                )}
              </div>

              <div className="flex-1">
                <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-[#0075A2] text-white rounded-lg hover:bg-[#0A2647] transition-colors">
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadingFile === 'profile_image' ? 'Uploading...' : 'Change Picture'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageChange}
                    className="hidden"
                    disabled={uploadingFile === 'profile_image'}
                  />
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Max file size: 5MB. Supported formats: JPG, PNG, GIF
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-[#E8E8E8] dark:border-gray-600">
            <h2 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-6">Contact Information</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => handleInputChange('phone_number', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0075A2] dark:focus:ring-[#0EA5E9] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hospital/Clinic Affiliation
                </label>
                <input
                  type="text"
                  value={formData.hospital_affiliation}
                  onChange={(e) => handleInputChange('hospital_affiliation', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0075A2] dark:focus:ring-[#0EA5E9] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Enter hospital or clinic name"
                />
              </div>
            </div>
          </div>

          {/* Professional Details */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-[#E8E8E8] dark:border-gray-600">
            <h2 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-6">Professional Details</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Super Specialization
                </label>
                <input
                  type="text"
                  value={formData.super_specialization}
                  onChange={(e) => handleInputChange('super_specialization', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0075A2] dark:focus:ring-[#0EA5E9] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="e.g., Interventional Cardiology"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Professional Bio
                </label>
                <textarea
                  value={formData.professional_bio}
                  onChange={(e) => handleInputChange('professional_bio', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0075A2] dark:focus:ring-[#0EA5E9] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Write a brief professional biography..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Short Bio (For Patients)
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0075A2] dark:focus:ring-[#0EA5E9] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="A short description visible to patients..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Languages Spoken
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {languages.map((lang) => (
                    <label key={lang} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.languages_spoken.includes(lang)}
                        onChange={() => handleArrayToggle('languages_spoken', lang)}
                        className="w-4 h-4 text-[#0075A2] dark:text-[#0EA5E9] rounded focus:ring-2 focus:ring-[#0075A2]"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{lang}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Consultation Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-[#E8E8E8] dark:border-gray-600">
            <h2 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-6">Consultation Settings</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Consultation Types Offered
                </label>
                <div className="space-y-3">
                  {consultationTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <label
                        key={type.id}
                        className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={formData.consultation_types.includes(type.id)}
                          onChange={() => handleArrayToggle('consultation_types', type.id)}
                          className="w-5 h-5 text-[#0075A2] dark:text-[#0EA5E9] rounded focus:ring-2 focus:ring-[#0075A2]"
                        />
                        <Icon className="w-5 h-5 text-[#0075A2] dark:text-[#0EA5E9]" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{type.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Consultation Fee (₹)
                </label>
                <input
                  type="number"
                  value={formData.consultation_fee}
                  onChange={(e) => handleInputChange('consultation_fee', parseInt(e.target.value) || 0)}
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0075A2] dark:focus:ring-[#0EA5E9] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Enter consultation fee"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Services Offered
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {servicesOptions.map((service) => (
                    <label key={service} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.services_offered.includes(service)}
                        onChange={() => handleArrayToggle('services_offered', service)}
                        className="w-4 h-4 text-[#0075A2] dark:text-[#0EA5E9] rounded focus:ring-2 focus:ring-[#0075A2]"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{service}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-[#E8E8E8] dark:border-gray-600">
            <div className="flex items-center mb-6">
              <CreditCard className="w-5 h-5 text-[#0075A2] dark:text-[#0EA5E9] mr-2" />
              <h2 className="text-xl font-bold text-[#0A2647] dark:text-gray-100">Bank Details</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  value={formData.bank_account_holder_name}
                  onChange={(e) => handleInputChange('bank_account_holder_name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0075A2] dark:focus:ring-[#0EA5E9] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Enter account holder name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={formData.bank_name}
                    onChange={(e) => handleInputChange('bank_name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0075A2] dark:focus:ring-[#0EA5E9] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Enter bank name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Branch Name
                  </label>
                  <input
                    type="text"
                    value={formData.bank_branch}
                    onChange={(e) => handleInputChange('bank_branch', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0075A2] dark:focus:ring-[#0EA5E9] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Enter branch name"
                  />
                </div>
              </div>

              {doctorProfile.bank_account_number && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Account Number (Non-Editable)
                  </label>
                  <div className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300">
                    {doctorProfile.bank_account_number.replace(/.(?=.{4})/g, '*')}
                  </div>
                </div>
              )}

              {doctorProfile.ifsc_code && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    IFSC Code (Non-Editable)
                  </label>
                  <div className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300">
                    {doctorProfile.ifsc_code}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4">
            <Link
              to="/doctor-dashboard"
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#0075A2] to-[#0A2647] text-white rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default DoctorProfileUpdatePage;
