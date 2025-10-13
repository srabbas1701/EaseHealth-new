import React, { useState, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, AlertCircle } from 'lucide-react';
import Navigation from '../components/Navigation';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslations } from '../translations';
import { useTheme } from '../contexts/ThemeContext';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const { t } = useTranslations(language);
  const { isDarkMode } = useTheme();
  
  // Get booking details and redirect info from location state
  const bookingDetails = location.state?.bookingDetails || null;
  const redirectTo = location.state?.redirectTo || '/doctor-dashboard';
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

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

      console.log('✅ Login successful, redirecting to:', redirectTo);
      
      // Redirect based on the intended destination
      if (bookingDetails) {
        // If coming from appointment booking, redirect back with auth success
        navigate(redirectTo, {
          state: {
            bookingDetails,
            authSuccess: true
          }
        });
      } else {
        // Default redirect to doctor dashboard
        navigate(redirectTo);
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
                      {bookingDetails ? 'Patient Login' : 'Doctor Login'}
                    </h1>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">{t('login.accessPortal')}</p>
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
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                          errors.email ? 'border-red-500 dark:border-red-800' : 'border-gray-300 dark:border-gray-600'
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
                        className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                          errors.password ? 'border-red-500 dark:border-red-800' : 'border-gray-300 dark:border-gray-600'
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
                        {t('login.signUp')}
                      </Link>
                    ) : (
                      <Link to="/doctor-registration" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                        {t('login.signUp')}
                      </Link>
                    )}
                  </p>
                  
                  <button 
                    onClick={async () => {
                      if (!formData.email) {
                        setAuthError(t('login.emailRequiredForReset'));
                        return;
                      }
                      setIsLoading(true);
                      try {
                        const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
                          redirectTo: window.location.origin + '/reset-password'
                        });
                        if (error) throw error;
                        alert(t('login.resetLinkSent'));
                      } catch (error) {
                        setAuthError(error.message || t('login.failedToSendResetLink'));
                      } finally {
                        setIsLoading(false);
                      }
                    }}
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
                  src="/login Image.png?v=3" 
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
    </div>
  );
};

export default LoginPage;