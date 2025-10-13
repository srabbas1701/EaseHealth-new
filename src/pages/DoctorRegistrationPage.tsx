import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { User, Mail, Lock, Eye, EyeOff, ArrowLeft, AlertCircle } from 'lucide-react';
import Navigation from '../components/Navigation';
import UnifiedDoctorRegistrationForm from '../components/UnifiedDoctorRegistrationForm';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslations } from '../translations';
import { useTheme } from '../contexts/ThemeContext';

// Initial registration step component
const CreateAccountStep: React.FC<{
  onSuccess: (userId: string, email: string) => void;
}> = ({ onSuccess }) => {
  const { language } = useLanguage();
  const { t } = useTranslations(language);
  const { isDarkMode } = useTheme();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, session, profile, userState, isAuthenticated, handleLogout } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError(t('registration.errors.allFieldsRequired'));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t('registration.errors.passwordsNotMatch'));
      return;
    }

    if (formData.password.length < 8) {
      setError(t('registration.errors.passwordTooShort'));
      return;
    }

    setIsLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;
      if (!data.user) throw new Error('No user data returned');

      onSuccess(data.user.id, formData.email);
    } catch (error) {
      console.error('Error during signup:', error);
      setError(error.message || t('registration.errors.generalError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
      <Navigation 
        user={user}
        session={session}
        profile={profile}
        userState={userState}
        isAuthenticated={isAuthenticated}
        handleLogout={handleLogout}
      />
      
      <div className="flex items-center justify-center min-h-screen px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-6xl">
          <div className="flex bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
            {/* Left Panel - Sign-up Form */}
            <div className="flex-1 p-8 sm:p-12">
              <div className="max-w-md mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center mb-4">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('registration.createAccount')}</h1>
                    <div className="ml-4 flex items-center">
                      <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                        <span className="text-white font-bold text-sm">E</span>
                      </div>
                      <span className="ml-2 text-sm font-medium text-gray-600 dark:text-gray-300">EaseHealth.AI</span>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">{t('registration.joinNetwork')}</p>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
                      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('registration.emailAddress')}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder={t('registration.enterEmail')}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('registration.createPassword')}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder={t('registration.enterPassword')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('registration.passwordRequirements')}</p>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('registration.confirmPassword')}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder={t('registration.confirmPassword')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        <span>{t('registration.creatingAccount')}</span>
                      </div>
                    ) : (
                      t('registration.createAccountButton')
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <Link
                    to="/login-page"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium inline-flex items-center"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    {t('registration.backToLogin')}
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Panel - Promotional Image */}
            <div className="hidden lg:flex lg:flex-1 relative">
              <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-r-2xl relative overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0 bg-cover bg-center" style={{
                  backgroundImage: 'url(/Doctor Login Image.png)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}></div>
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-40"></div>
                
                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between h-full p-8">
                  <div className="text-right">
                    <h2 className="text-white text-2xl font-bold">EaseHealth AI</h2>
                  </div>
                  
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full mb-4">
                      <span className="text-white text-2xl">⚕️</span>
                    </div>
                    <h3 className="text-white text-xl font-semibold mb-2">{t('registration.portalTitle')}</h3>
                    <p className="text-gray-300 text-sm">{t('registration.portalDescription')}</p>
                  </div>
                  
                  <div className="text-right">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-white bg-opacity-20 rounded-full">
                      <span className="text-white text-sm">✨</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main registration page component
const DoctorRegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'create-account' | 'registration'>('create-account');
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const { user, session, profile, userState, isAuthenticated, handleLogout } = useAuth();
  const { language } = useLanguage();
  const { t } = useTranslations(language);
  const { isDarkMode } = useTheme();

  const handleAccountCreated = (newUserId: string, email: string) => {
    setUserId(newUserId);
    setUserEmail(email);
    setStep('registration');
  };

  if (step === 'create-account') {
    return <CreateAccountStep onSuccess={handleAccountCreated} />;
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
      <Navigation 
        user={user}
        session={session}
        profile={profile}
        userState={userState}
        isAuthenticated={isAuthenticated}
        handleLogout={handleLogout}
      />
      
      <div className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('registration.completeProfile')}</h1>
                <div className="ml-4 flex items-center">
                  <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                    <span className="text-white font-bold text-sm">E</span>
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-600 dark:text-gray-300">EaseHealth.AI</span>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300">{t('registration.provideInfo')}</p>
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
              <UnifiedDoctorRegistrationForm
                isStandalone={true}
                userId={userId!}
                prefillData={{
                  email: userEmail
                }}
                onSuccess={() => {
                  return <Navigate to="/login-page" replace />;
                }}
                onClose={() => {
                  return <Navigate to="/login-page" replace />;
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorRegistrationPage;