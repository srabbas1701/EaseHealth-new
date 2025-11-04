import React, { useState, useCallback, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, AlertCircle, Phone, CheckCircle, X, RefreshCw } from 'lucide-react';
import Navigation from '../components/Navigation';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslations } from '../translations';
import { useTheme } from '../contexts/ThemeContext';
import { createAppointment, generateQueueToken, getPatientProfile, createPatientProfile } from '../utils/supabase';
import QueueTokenModal from '../components/QueueTokenModal';
import {
  generateOTP,
  storeOTP,
  getStoredOTP,
  verifyOTP,
  clearStoredOTP,
  sendOTPViaEmail,
  sendOTPViaSMS,
  updateUserPassword,
  updateUserPasswordByPhone,
  formatPhoneNumber,
  isValidEmail,
  isValidPhoneNumber
} from '../utils/otpUtils';

interface LoginPageProps {
  user: any;
  session: any;
  profile: any;
  userState: 'new' | 'returning' | 'authenticated';
  isAuthenticated: boolean;
  handleLogout: () => Promise<void>;
}

const LoginPage: React.FC<LoginPageProps> = ({ isAuthenticated }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const { t } = useTranslations(language);
  const { isDarkMode } = useTheme();

  // Get booking details and redirect info from location state
  const bookingDetails = location.state?.bookingDetails || null;
  const dashboardType = location.state?.dashboardType || 'patient';

  // Check for redirect parameter in URL
  const searchParams = new URLSearchParams(location.search);
  const urlRedirect = searchParams.get('redirect');

  const redirectTo = urlRedirect || location.state?.redirectTo;
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showQueueTokenModal, setShowQueueTokenModal] = useState(false);
  const [queueToken, setQueueToken] = useState<string>('');
  const [appointmentDetails, setAppointmentDetails] = useState<any>(null);
  const [isProcessingBooking, setIsProcessingBooking] = useState(false);

  // OTP Reset states
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetStep, setResetStep] = useState<'method' | 'send' | 'verify' | 'password'>('method');
  const [resetMethod, setResetMethod] = useState<'email' | 'phone'>('email');
  const [resetEmail, setResetEmail] = useState('');
  const [resetPhone, setResetPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  // Handle redirect after successful login - NO useEffect for redirects

  // Handle form input changes
  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    // Clear auth error when user starts typing
    if (authError) {
      setAuthError('');
    }
  }, [errors, authError]);

  // Form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = t('validation.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('validation.emailInvalid');
    }

    if (!formData.password) {
      newErrors.password = t('validation.passwordRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setAuthError('');

    try {
      console.log('🔄 Attempting login...', { email: formData.email });

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        console.error('❌ Login error:', authError);
        throw authError;
      }

      console.log('✅ Login successful');

      // If coming from appointment booking, create appointment immediately
      if (bookingDetails && authData.user) {
        setIsProcessingBooking(true);
        try {
          console.log('📋 Creating appointment for user after login...');

          // Ensure user has a patient profile
          let patientProfile = await getPatientProfile(authData.user.id);

          if (!patientProfile) {
            console.log('📝 Creating patient profile for user');
            patientProfile = await createPatientProfile(authData.user.id, {
              full_name: authData.user.user_metadata?.full_name || authData.user.email?.split('@')[0] || 'Patient',
              email: authData.user.email || '',
              phone_number: authData.user.user_metadata?.phone || '000-000-0000',
              is_active: true
            });
            console.log('✅ Patient profile created:', patientProfile);
          }

          // Convert time to proper format (IST timezone)
          const timeParts = bookingDetails.selectedTime.split(':');
          const hour = parseInt(timeParts[0]);
          const minute = parseInt(timeParts[1].split(' ')[0]);
          const isPM = bookingDetails.selectedTime.includes('PM');

          let hour24 = hour;
          if (isPM && hour !== 12) hour24 += 12;
          if (!isPM && hour === 12) hour24 = 0;

          const timeString = `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
          // Use IST timezone for date string
          const dateString = `${bookingDetails.selectedDate.getFullYear()}-${String(bookingDetails.selectedDate.getMonth() + 1).padStart(2, '0')}-${String(bookingDetails.selectedDate.getDate()).padStart(2, '0')}`;

          console.log('🔍 Booking appointment with:', {
            doctorId: bookingDetails.selectedDoctor.id,
            patientId: patientProfile.id,
            date: dateString,
            time: timeString
          });

          // Use the proper createAppointment function
          const appointment = await createAppointment(
            bookingDetails.selectedDoctor.id,
            patientProfile.id,  // CORRECT: Use patient profile id (patients.id) not user_id (auth.users.id)
            dateString,
            timeString,
            30, // Default duration
            'Appointment booked through EaseHealth platform'
          );

          if (!appointment || !appointment.id) {
            throw new Error('Failed to create appointment');
          }

          console.log('✅ Appointment created successfully:', appointment);

          // Set queue token and appointment details for modal
          setQueueToken(appointment.queue_token || 'QT-2024-0001');
          setAppointmentDetails({
            doctorName: bookingDetails.selectedDoctor.full_name,
            date: bookingDetails.selectedDate.toLocaleDateString(),
            time: bookingDetails.selectedTime,
            specialty: bookingDetails.selectedSpecialty?.name
          });

          // Show queue token modal
          setShowQueueTokenModal(true);

        } catch (error) {
          console.error('❌ Error creating appointment:', error);
          setIsProcessingBooking(false);
          // Still redirect to patient dashboard but with error message
          navigate('/patient-dashboard', {
            state: {
              appointmentError: true,
              errorMessage: error.message || 'Failed to create appointment'
            }
          });
        }
      } else {
        // Handle redirect directly after successful login
        if (!isProcessingBooking) {
          console.log('🔄 Login successful, checking for redirect');
          const searchParams = new URLSearchParams(location.search);
          const urlRedirect = searchParams.get('redirect');

          if (urlRedirect) {
            console.log('🔄 Redirecting to:', urlRedirect);
            // Add a longer delay to ensure role is loaded before redirect
            setTimeout(() => {
              console.log('🔄 Executing redirect to:', urlRedirect);
              navigate(urlRedirect, { replace: true });
            }, 500);
          } else {
            console.log('🔄 No redirect parameter found');
          }
        }
      }

    } catch (error) {
      console.error('Authentication error:', error);

      // Handle specific Supabase auth errors
      if (error instanceof Error) {
        switch (error.message) {
          case 'Invalid login credentials':
            setAuthError(t('auth.invalidCredentials'));
            break;
          case 'Email not confirmed':
            setAuthError(t('auth.emailNotConfirmed'));
            break;
          case 'Too many requests':
            setAuthError(t('auth.tooManyRequests'));
            break;
          default:
            setAuthError(t('auth.generalError'));
        }
      } else {
        setAuthError(t('auth.unexpectedError'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [formData, navigate, t]);

  // OTP Reset Functions
  const handleForgotPasswordClick = useCallback(() => {
    setShowResetModal(true);
    setResetStep('method');
    setResetMethod('email');
    setResetEmail('');
    setResetPhone('');
    setOtpCode('');
    setNewPassword('');
    setConfirmPassword('');
    setAuthError('');
    setErrors({});
  }, []);

  const handleResetMethodSelect = useCallback((method: 'email' | 'phone') => {
    setResetMethod(method);
    setResetStep('send');
    setAuthError('');
    setErrors({});
  }, []);

  const handleSendOTP = useCallback(async () => {
    setIsResetting(true);
    setAuthError('');

    try {
      let contactValue = '';

      if (resetMethod === 'email') {
        if (!resetEmail || !isValidEmail(resetEmail)) {
          setErrors({ resetContact: 'Please enter a valid email address' });
          return;
        }
        contactValue = resetEmail;
      } else {
        if (!resetPhone || !isValidPhoneNumber(resetPhone)) {
          setErrors({ resetContact: 'Please enter a valid 10-digit phone number' });
          return;
        }
        contactValue = resetPhone;
      }

      const otp = generateOTP();
      storeOTP(resetMethod === 'email' ? contactValue : null, resetMethod === 'phone' ? contactValue : null, otp);

      let result;
      if (resetMethod === 'email') {
        result = await sendOTPViaEmail(contactValue, otp);
      } else {
        result = await sendOTPViaSMS(contactValue, otp);
      }

      if (result.success) {
        setResetStep('verify');
        setAuthError('');
      } else {
        setAuthError(result.error || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      setAuthError('Failed to send OTP. Please try again.');
    } finally {
      setIsResetting(false);
    }
  }, [resetMethod, resetEmail, resetPhone]);

  const handleVerifyOTP = useCallback(async () => {
    setIsResetting(true);
    setAuthError('');

    try {
      if (!otpCode || otpCode.length !== 6) {
        setErrors({ otpCode: 'Please enter a valid 6-digit OTP' });
        return;
      }

      const result = verifyOTP(otpCode);

      if (result.isValid) {
        setResetStep('password');
        setAuthError('');
        setErrors({});
      } else {
        setAuthError(result.error || 'Invalid OTP');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setAuthError('Failed to verify OTP. Please try again.');
    } finally {
      setIsResetting(false);
    }
  }, [otpCode]);

  const handleResetPassword = useCallback(async () => {
    setIsResetting(true);
    setAuthError('');

    try {
      if (!newPassword || newPassword.length < 6) {
        setErrors({ newPassword: 'Password must be at least 6 characters long' });
        return;
      }

      if (newPassword !== confirmPassword) {
        setErrors({ confirmPassword: 'Passwords do not match' });
        return;
      }

      let result;
      if (resetMethod === 'email') {
        result = await updateUserPassword(resetEmail, newPassword);
      } else {
        result = await updateUserPasswordByPhone(resetPhone, newPassword);
      }

      if (result.success) {
        setResetSuccess(true);
        clearStoredOTP();
        setTimeout(() => {
          setShowResetModal(false);
          setResetSuccess(false);
          setResetStep('method');
          setNewPassword('');
          setConfirmPassword('');
        }, 2000);
      } else {
        setAuthError(result.error || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      setAuthError('Failed to reset password. Please try again.');
    } finally {
      setIsResetting(false);
    }
  }, [newPassword, confirmPassword, resetMethod, resetEmail, resetPhone]);

  const handleResendOTP = useCallback(async () => {
    setIsResetting(true);
    setAuthError('');

    try {
      const storedOTP = getStoredOTP();
      if (!storedOTP) {
        setAuthError('No OTP found. Please start over.');
        return;
      }

      const newOTP = generateOTP();
      storeOTP(storedOTP.email, storedOTP.phone, newOTP);

      let result;
      if (resetMethod === 'email' && storedOTP.email) {
        result = await sendOTPViaEmail(storedOTP.email, newOTP);
      } else if (resetMethod === 'phone' && storedOTP.phone) {
        result = await sendOTPViaSMS(storedOTP.phone, newOTP);
      } else {
        setAuthError('Invalid reset method');
        return;
      }

      if (result.success) {
        setAuthError('');
        setOtpCode('');
      } else {
        setAuthError(result.error || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
      setAuthError('Failed to resend OTP. Please try again.');
    } finally {
      setIsResetting(false);
    }
  }, [resetMethod]);

  const handleCloseResetModal = useCallback(() => {
    setShowResetModal(false);
    setResetStep('method');
    setResetMethod('email');
    setResetEmail('');
    setResetPhone('');
    setOtpCode('');
    setNewPassword('');
    setConfirmPassword('');
    setAuthError('');
    setErrors({});
    setResetSuccess(false);
    clearStoredOTP();
  }, []);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
      <Navigation />

      <div className="flex items-center justify-center min-h-screen px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-6xl">
          <div className="flex gap-4 rounded-2xl shadow-2xl overflow-hidden">
            {/* Left Panel - Login Form */}
            <div className="flex-1 p-8 sm:p-12 rounded-l-2xl bg-white dark:bg-gray-800">
              <div className="max-w-md mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="text-center mb-4">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                      {dashboardType === 'admin' ? 'Admin Login' :
                        dashboardType === 'doctor' ? 'Doctor Login' :
                          'Patient Login'}
                    </h1>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    {dashboardType === 'admin' ? 'Access Admin Dashboard' :
                      dashboardType === 'doctor' ? 'Access Doctor Dashboard' :
                        'Access Patient Dashboard'}
                  </p>
                </div>

                {/* Booking Summary - Show when coming from appointment booking */}
                {bookingDetails && (
                  <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
                      Complete Your Appointment Booking
                    </h3>
                    <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                      <p><strong>Doctor:</strong> {bookingDetails.selectedDoctor?.full_name}</p>
                      <p><strong>Date:</strong> {bookingDetails.selectedDate?.toLocaleDateString()}</p>
                      <p><strong>Time:</strong> {bookingDetails.selectedTime}</p>
                      {bookingDetails.selectedSpecialty && (
                        <p><strong>Specialty:</strong> {bookingDetails.selectedSpecialty.name}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Error Message */}
                  {authError && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
                        <p className="text-red-700 dark:text-red-300 text-sm">{authError}</p>
                      </div>
                    </div>
                  )}

                  {/* Email Field */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('login.emailAddress')}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${errors.email ? 'border-red-500 dark:border-red-800' : 'border-gray-300 dark:border-gray-600'
                          }`}
                        placeholder={t('login.enterEmail')}
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('login.password')}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${errors.password ? 'border-red-500 dark:border-red-800' : 'border-gray-300 dark:border-gray-600'
                          }`}
                        placeholder={t('login.enterPassword')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.password}
                      </p>
                    )}
                  </div>

                  {/* Login Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        <span>{t('login.loggingIn')}</span>
                      </div>
                    ) : (
                      t('login.loginButton')
                    )}
                  </button>
                </form>

                {/* Links */}
                <div className="mt-6 space-y-4 text-center">
                  <p className="text-gray-600 dark:text-gray-300">
                    {t('login.noAccount')}{' '}
                    {bookingDetails ? (
                      <Link
                        to="/patient-pre-registration"
                        state={{ bookingDetails, userData: { email: formData.email } }}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                      >
                        {t('login.signUpLink')}
                      </Link>
                    ) : dashboardType === 'admin' ? (
                      <span className="text-gray-500 dark:text-gray-400">
                        Contact administrator for access
                      </span>
                    ) : dashboardType === 'doctor' ? (
                      <Link to="/doctor-registration" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                        {t('login.signUpLink')}
                      </Link>
                    ) : (
                      <Link to="/patient-pre-registration" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                        {t('login.signUpLink')}
                      </Link>
                    )}
                  </p>

                  <button
                    onClick={handleForgotPasswordClick}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium underline"
                  >
                    {t('login.forgotPassword')}
                  </button>

                  <div>
                    <Link
                      to="/"
                      className="text-gray-600 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200 font-medium underline inline-flex items-center"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      {t('common.backToHome')}
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel - Login Image */}
            <div className="hidden lg:flex lg:flex-1 relative">
              <div className="w-full h-full rounded-r-2xl relative overflow-hidden bg-gray-200">
                {/* Login Image */}
                <img
                  src="/login Image.png"
                  alt="Login"
                  className="w-full h-full object-cover"
                  style={{ objectPosition: 'top center' }}
                  onLoad={() => console.log('Login image loaded successfully')}
                  onError={(e) => {
                    console.error('Failed to load login image:', e);
                    e.currentTarget.style.display = 'none';
                  }}
                />
                {/* Debug: Check if there's any text overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* This div will help us see if there's any text overlay */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Queue Token Modal */}
      {showQueueTokenModal && queueToken && appointmentDetails && (
        <QueueTokenModal
          isOpen={showQueueTokenModal}
          onClose={() => {
            setShowQueueTokenModal(false);
            setIsProcessingBooking(false);
          }}
          onRedirect={() => {
            setShowQueueTokenModal(false);
            setIsProcessingBooking(false);
            navigate('/patient-dashboard');
          }}
          queueToken={queueToken}
          appointmentDetails={appointmentDetails}
        />
      )}

      {/* OTP Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 max-w-md w-full mx-4 border border-[#E8E8E8] dark:border-gray-600">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-[#0A2647] dark:text-gray-100">
                {t('login.resetPassword')}
              </h3>
              <button
                onClick={handleCloseResetModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Success Message */}
            {resetSuccess && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                  <p className="text-green-700 dark:text-green-300 text-sm">
                    {t('login.passwordResetSuccess')}
                  </p>
                </div>
              </div>
            )}

            {/* Demo Mode Notice */}
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                <div>
                  <p className="text-yellow-700 dark:text-yellow-300 text-sm font-medium">
                    Demo Mode Active
                  </p>
                  <p className="text-yellow-600 dark:text-yellow-400 text-xs mt-1">
                    OTPs are shown in browser console (F12). Check console for the 6-digit code.
                  </p>
                  <p className="text-yellow-600 dark:text-yellow-400 text-xs mt-1">
                    🔒 Security: Only registered users can reset passwords.
                  </p>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {authError && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
                  <p className="text-red-700 dark:text-red-300 text-sm">{authError}</p>
                </div>
              </div>
            )}

            {/* Step 1: Select Method */}
            {resetStep === 'method' && (
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {t('login.selectResetMethod')}
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => handleResetMethodSelect('email')}
                    className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors flex items-center"
                  >
                    <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3" />
                    <div className="text-left">
                      <p className="font-medium text-[#0A2647] dark:text-gray-100">
                        {t('login.emailReset')}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t('login.emailAddress')}
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => handleResetMethodSelect('phone')}
                    className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors flex items-center"
                  >
                    <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3" />
                    <div className="text-left">
                      <p className="font-medium text-[#0A2647] dark:text-gray-100">
                        {t('login.phoneReset')}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t('login.phoneNumber')}
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Enter Contact Info */}
            {resetStep === 'send' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {resetMethod === 'email' ? t('login.emailAddress') : t('login.phoneNumber')}
                  </label>
                  <div className="relative">
                    {resetMethod === 'email' ? (
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    ) : (
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    )}
                    <input
                      type={resetMethod === 'email' ? 'email' : 'tel'}
                      value={resetMethod === 'email' ? resetEmail : resetPhone}
                      onChange={(e) => {
                        if (resetMethod === 'email') {
                          setResetEmail(e.target.value);
                        } else {
                          setResetPhone(e.target.value);
                        }
                        if (errors.resetContact) {
                          setErrors(prev => ({ ...prev, resetContact: undefined }));
                        }
                      }}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${errors.resetContact ? 'border-red-500 dark:border-red-800' : 'border-gray-300 dark:border-gray-600'
                        }`}
                      placeholder={resetMethod === 'email' ? t('login.enterEmail') : t('login.enterPhoneNumber')}
                    />
                  </div>
                  {errors.resetContact && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.resetContact}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleSendOTP}
                  disabled={isResetting}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResetting ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>{t('login.sendingOTP')}</span>
                    </div>
                  ) : (
                    t('login.sendOTP')
                  )}
                </button>
              </div>
            )}

            {/* Step 3: Verify OTP */}
            {resetStep === 'verify' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('login.enterOTP')}
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {t('login.enterOTPSentTo')} {resetMethod === 'email' ? resetEmail : formatPhoneNumber(resetPhone)}
                  </p>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtpCode(value);
                      if (errors.otpCode) {
                        setErrors(prev => ({ ...prev, otpCode: undefined }));
                      }
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center text-lg tracking-widest ${errors.otpCode ? 'border-red-500 dark:border-red-800' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    placeholder="000000"
                    maxLength={6}
                  />
                  {errors.otpCode && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.otpCode}
                    </p>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleResendOTP}
                    disabled={isResetting}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 mx-auto ${isResetting ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={handleVerifyOTP}
                    disabled={isResetting || otpCode.length !== 6}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isResetting ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>{t('login.verifyingOTP')}</span>
                      </div>
                    ) : (
                      t('login.verifyOTP')
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Set New Password */}
            {resetStep === 'password' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('login.newPassword')}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (errors.newPassword) {
                          setErrors(prev => ({ ...prev, newPassword: undefined }));
                        }
                      }}
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${errors.newPassword ? 'border-red-500 dark:border-red-800' : 'border-gray-300 dark:border-gray-600'
                        }`}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.newPassword}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('login.confirmPassword')}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirmPassword) {
                          setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                        }
                      }}
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${errors.confirmPassword ? 'border-red-500 dark:border-red-800' : 'border-gray-300 dark:border-gray-600'
                        }`}
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleResetPassword}
                  disabled={isResetting || !newPassword || !confirmPassword}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResetting ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>{t('login.resettingPassword')}</span>
                    </div>
                  ) : (
                    t('login.resetPassword')
                  )}
                </button>
              </div>
            )}

            {/* Back to Login Button */}
            {resetStep !== 'method' && !resetSuccess && (
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleCloseResetModal}
                  className="w-full text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium underline"
                >
                  {t('login.backToLogin')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;