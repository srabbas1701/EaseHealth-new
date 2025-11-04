import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, AlertCircle, CheckCircle, User, Phone } from 'lucide-react';
import Navigation from '../components/Navigation';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslations } from '../translations';
import { useTheme } from '../contexts/ThemeContext';
import { useRBAC } from '../hooks/useRBAC';
import { runManualCleanup } from '../utils/manualCleanup';
import { Clock } from 'lucide-react';

interface NewLoginPageProps {
    user: any;
    session: any;
    profile: any;
    userState: 'new' | 'returning' | 'authenticated';
    isAuthenticated: boolean;
    handleLogout: () => Promise<void>;
}

const NewLoginPage: React.FC<NewLoginPageProps> = ({ isAuthenticated, handleLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { language } = useLanguage();
    const { t } = useTranslations(language);
    const { isDarkMode } = useTheme();
    const { userRole, isLoading: roleLoading, getDefaultDashboard } = useRBAC();

    // Get entry point and redirect info from URL
    const searchParams = new URLSearchParams(location.search);
    const redirectUrl = searchParams.get('redirect') || '/';
    // Derive required role from redirect target (doctor/patient/admin dashboards)
    const requiredRole = useMemo(() => {
        if (!redirectUrl) return null;
        if (redirectUrl.includes('/doctor-dashboard')) return 'doctor';
        if (redirectUrl.includes('/patient-dashboard')) return 'patient';
        if (redirectUrl.includes('/admin-dashboard')) return 'admin';
        return null;
    }, [redirectUrl]);

    // Track previous redirect to detect when user clicks a different link
    const prevRedirectRef = React.useRef<string>(redirectUrl);

    // Clear error only when user navigates to a DIFFERENT login link (not on every render)
    useEffect(() => {
        // Only clear if the redirect URL actually changed to a different target
        if (prevRedirectRef.current !== redirectUrl && prevRedirectRef.current !== '/') {
            setError('');
            setShowRecoveryOptions(false);
            setIsLoading(false);
        }
        prevRedirectRef.current = redirectUrl;
    }, [redirectUrl]);

    const fromDashboard = searchParams.get('from') === 'dashboard';
    const fromTopBar = searchParams.get('from') === 'topbar';

    // Form state
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        phone: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [countdown, setCountdown] = useState(0);
    const [showRecoveryOptions, setShowRecoveryOptions] = useState(false);

    // Auto-redirect if already authenticated and role is loaded
    useEffect(() => {
        // Don't redirect if there's an active error message (user needs to see it)
        if (error && requiredRole) return;

        if (isAuthenticated && userRole && !roleLoading) {
            const targetUrl = redirectUrl !== '/' ? redirectUrl : getDefaultDashboard(userRole);
            // Enforce role if this login entry point was for a specific dashboard
            if (requiredRole && userRole !== requiredRole) {
                const pretty = requiredRole.charAt(0).toUpperCase() + requiredRole.slice(1);
                const prettyMe = userRole.charAt(0).toUpperCase() + userRole.slice(1);
                let errorKey = '';
                if (requiredRole === 'doctor') {
                    errorKey = t('login.thisLinkForDoctors');
                } else if (requiredRole === 'patient') {
                    errorKey = t('login.thisLinkForPatients');
                } else if (requiredRole === 'admin') {
                    errorKey = t('login.thisLinkForAdmin');
                }
                setError(errorKey.replace('{userRole}', prettyMe));
                return; // do not navigate automatically
            }
            console.log('🔄 User already authenticated, redirecting to:', targetUrl);
            navigate(targetUrl, { replace: true });
        }
    }, [isAuthenticated, userRole, roleLoading, redirectUrl, navigate, getDefaultDashboard, requiredRole, error]);

    // Note: Error state persists intentionally until user navigates to a different link

    // Countdown timer for verification
    useEffect(() => {
        if (countdown > 0) {
            const timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [countdown]);

    // Handle form input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear errors when user starts typing
        if (error) setError('');
    };

    // Handle login
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            });

            if (error) {
                // Check if user exists but is unverified
                if (error.message.includes('Email not confirmed')) {
                    setError(t('auth.emailNotConfirmed'));
                    setShowRecoveryOptions(true);
                    return;
                }
                throw error;
            }

            if (data.user) {
                // If this login entry point expects a specific role, validate immediately
                if (requiredRole) {
                    try {
                        let resolvedRole: 'patient' | 'doctor' | 'admin' = 'patient';
                        // Check doctor mapping first
                        const { data: doctor } = await supabase
                            .from('doctors')
                            .select('id')
                            .eq('user_id', data.user.id)
                            .single();

                        if (doctor) {
                            resolvedRole = 'doctor';
                        } else {
                            const { data: profile } = await supabase
                                .from('profiles')
                                .select('role')
                                .eq('id', data.user.id)
                                .single();
                            resolvedRole = (profile?.role as any) || 'patient';
                        }

                        if (resolvedRole !== requiredRole) {
                            // Immediately sign out to avoid establishing a session for the wrong role
                            await supabase.auth.signOut();
                            const pretty = requiredRole.charAt(0).toUpperCase() + requiredRole.slice(1);
                            const prettyMe = resolvedRole.charAt(0).toUpperCase() + resolvedRole.slice(1);
                            let errorKey = '';
                            if (requiredRole === 'doctor') {
                                errorKey = t('login.thisLinkForDoctors');
                            } else if (requiredRole === 'patient') {
                                errorKey = t('login.thisLinkForPatients');
                            } else if (requiredRole === 'admin') {
                                errorKey = t('login.thisLinkForAdmin');
                            }
                            setError(errorKey.replace('{userRole}', prettyMe));
                            return;
                        }
                    } catch (roleErr) {
                        console.error('Role validation error after login:', roleErr);
                        await supabase.auth.signOut();
                        setError(t('login.unableToValidateRole'));
                        return;
                    }
                }

                console.log('🔄 Login successful, user will be redirected automatically');
                // The useEffect above will handle the redirect
            }
        } catch (error: any) {
            console.error('Login error:', error);
            setError(error.message || t('auth.generalError'));
        } finally {
            setIsLoading(false);
        }
    };

    // Handle signup
    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError(t('login.passwordsDoNotMatch'));
            setIsLoading(false);
            return;
        }

        try {
            console.log('🔐 Starting signup process for:', formData.email);
            
            // Use Supabase's built-in signup with email verification
            const { data, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                        phone: formData.phone
                    },
                    emailRedirectTo: `${window.location.origin}/verify-email`
                }
            });

            console.log('📊 Signup response:', { 
                hasUser: !!data?.user, 
                hasSession: !!data?.session,
                userId: data?.user?.id,
                error: error 
            });

            // Check for explicit error from Supabase auth
            if (error) {
                console.error('❌ Supabase signup error:', error);
                setError(error.message || t('login.signupFailed'));
                setIsLoading(false);
                return;
            }

            if (data.user) {
                console.log('✅ Signup successful - verification email sent');
                console.log('✅ Profile will be auto-created by database trigger');
                setSuccess(t('login.accountCreatedSuccess'));
                setCountdown(300); // 5 minutes countdown
            }
        } catch (error: any) {
            console.error('❌ Signup error:', error);
            setError(error.message || t('login.signupFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    // Handle password reset
    const handlePasswordReset = async () => {
        if (!formData.email) {
            setError(t('login.enterEmailFirst'));
            return;
        }

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
                redirectTo: `${window.location.origin}/reset-password`
            });

            if (error) throw error;

            setSuccess(t('login.passwordResetEmailSent'));
        } catch (error: any) {
            console.error('Password reset error:', error);
            setError(error.message || t('login.failedToSendResetEmail'));
        }
    };

    // Handle quick resend verification
    const handleQuickResend = async () => {
        if (!formData.email) {
            setError(t('login.enterEmailFirst'));
            return;
        }

        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: formData.email,
                options: {
                    emailRedirectTo: `${window.location.origin}/verify-email`
                }
            });

            if (error) throw error;

            setSuccess(t('login.newVerificationEmailSent'));
            setCountdown(300); // Reset countdown
            setShowRecoveryOptions(false);
        } catch (error: any) {
            console.error('Resend verification error:', error);
            setError(t('login.failedToResendVerification'));
        }
    };

    // Show loading state while determining authentication
    if (isAuthenticated && roleLoading) {
        return (
            <div className="min-h-screen bg-[#F6F6F6] dark:bg-gray-900 text-[#0A2647] dark:text-gray-100 transition-colors duration-300">
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#0075A2] border-t-transparent mx-auto mb-4"></div>
                        <p className="text-lg text-gray-600 dark:text-gray-300">{t('login.loading')}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F6F6F6] dark:bg-gray-900 text-[#0A2647] dark:text-gray-100 transition-colors duration-300">
            <Navigation
                user={null}
                session={null}
                profile={null}
                userState="new"
                isAuthenticated={false}
                handleLogout={handleLogout}
            />

            <div className="flex items-center justify-center min-h-screen px-4 py-12">
                <div className="w-full max-w-md">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-[#0A2647] dark:text-gray-100 mb-2">
                            {isLoginMode ? t('login.welcomeBack') : t('login.createAccount')}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300">
                            {isLoginMode
                                ? t('login.signInToAccount')
                                : t('login.joinToGetStarted')
                            }
                        </p>
                    </div>

                    {/* Entry Point Indicator */}
                    {(fromDashboard || fromTopBar) && (
                        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center">
                                <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                                <span className="text-sm text-blue-800 dark:text-blue-200">
                                    {fromDashboard
                                        ? t('login.completeAccountToAccess')
                                        : t('login.signInToContinue')
                                    }
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Error/Success Messages */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                            <div className="flex items-center">
                                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
                                <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
                            </div>
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="flex items-center">
                                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                                <span className="text-sm text-green-800 dark:text-green-200">{success}</span>
                            </div>
                        </div>
                    )}

                    {/* Countdown Timer */}
                    {countdown > 0 && (
                        <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                            <div className="flex items-center">
                                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                                <span className="text-yellow-800 dark:text-yellow-200">
                                    {t('login.verificationExpiresIn')} {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Email Delivery Tips */}
                    {success && countdown > 0 && (
                        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                                {t('login.quickVerificationTips')}
                            </h4>
                            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                                <li>• {t('login.checkSpamFolder')}</li>
                                <li>• {t('login.lookForEmails')}</li>
                                <li>• {t('login.clickVerificationLink')}</li>
                                <li>• {t('login.have5MinutesToVerify')}</li>
                            </ul>
                            <button
                                onClick={handleQuickResend}
                                className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                {t('login.didntReceiveEmail')}
                            </button>
                        </div>
                    )}

                    {/* Recovery Options */}
                    {showRecoveryOptions && (
                        <div className="mb-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                            <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">
                                {t('login.accountRecoveryOptions')}
                            </h4>
                            <div className="space-y-2">
                                <button
                                    onClick={handleQuickResend}
                                    className="w-full bg-orange-100 dark:bg-orange-800 text-orange-800 dark:text-orange-200 py-2 px-4 rounded-lg text-sm hover:bg-orange-200 dark:hover:bg-orange-700 transition-colors"
                                >
                                    {t('login.resendVerificationEmail')}
                                </button>
                                <p className="text-xs text-orange-600 dark:text-orange-400">
                                    {t('login.accountDeletedNote')}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={isLoginMode ? handleLogin : handleSignUp} className="space-y-6">
                        {/* Full Name (Signup only) */}
                        {!isLoginMode && (
                            <div>
                                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {t('login.fullName')}
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        id="fullName"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                        required={!isLoginMode}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0075A2] focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                        placeholder={t('login.enterFullName')}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Phone (Signup only) */}
                        {!isLoginMode && (
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {t('login.phoneNumber')}
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        required={!isLoginMode}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0075A2] focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                        placeholder={t('login.enterPhoneNumber')}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('login.emailAddress')}
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0075A2] focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                    placeholder={t('login.enterEmail')}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('login.password')}
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0075A2] focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
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
                        </div>

                        {/* Confirm Password (Signup only) */}
                        {!isLoginMode && (
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {t('login.confirmPasswordLabel')}
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        required={!isLoginMode}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0075A2] focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                        placeholder={t('login.confirmPasswordPlaceholder')}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading || (requiredRole && userRole && userRole !== requiredRole)}
                            className="w-full bg-[#0075A2] dark:bg-[#0EA5E9] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#005A7A] dark:hover:bg-[#0284C7] focus:ring-2 focus:ring-[#0075A2] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                            {isLoading ? t('login.pleaseWait') : (isLoginMode ? t('login.signIn') : t('login.createAccount'))}
                        </button>
                    </form>

                    {/* Role mismatch helper */}
                    {error && requiredRole && userRole && userRole !== requiredRole && (
                        <div className="mt-6 p-4 rounded-lg border border-red-200 bg-red-50 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
                            <p className="mb-3">{error}</p>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    onClick={() => navigate(getDefaultDashboard(userRole), { replace: true })}
                                    className="px-4 py-2 rounded-md bg-[#0075A2] dark:bg-[#0EA5E9] text-white hover:opacity-90"
                                >
                                    {t('login.goToMyDashboard')}
                                </button>
                                <button
                                    type="button"
                                    onClick={async () => { await handleLogout(); }}
                                    className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                                >
                                    {t('login.signOutToSwitchAccount')}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Password Reset */}
                    <div className="mt-6 text-center">
                        <button
                            onClick={handlePasswordReset}
                            className="text-[#0075A2] dark:text-[#0EA5E9] hover:underline text-sm"
                        >
                            {t('login.forgotPasswordQuestion')}
                        </button>
                    </div>

                    {/* Toggle between Login/Signup */}
                    <div className="mt-6 text-center">
                        {isLoginMode ? (
                            <p className="text-gray-600 dark:text-gray-300">
                                {t('login.dontHaveAccount')}{' '}
                                <button
                                    onClick={() => setIsLoginMode(false)}
                                    className="text-[#0075A2] dark:text-[#0EA5E9] hover:underline font-semibold"
                                >
                                    {t('login.signUp')}
                                </button>
                            </p>
                        ) : (
                            <p className="text-gray-600 dark:text-gray-300">
                                {t('login.alreadyHaveAccount')}{' '}
                                <button
                                    onClick={() => setIsLoginMode(true)}
                                    className="text-[#0075A2] dark:text-[#0EA5E9] hover:underline font-semibold"
                                >
                                    {t('login.signIn')}
                                </button>
                            </p>
                        )}
                    </div>

                    {/* Back to Home */}
                    <div className="mt-6 text-center">
                        <Link
                            to="/"
                            className="inline-flex items-center text-gray-600 dark:text-gray-300 hover:text-[#0075A2] dark:hover:text-[#0EA5E9] text-sm"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            {t('login.backToHome')}
                        </Link>
                    </div>

                    {/* Development Cleanup Button - Remove in production */}
                    {process.env.NODE_ENV === 'development' && (
                        <div className="mt-4 text-center">
                            <button
                                onClick={async () => {
                                    const result = await runManualCleanup();
                                    alert(result.message);
                                }}
                                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
                            >
                                🧹 Cleanup Unverified Users (Dev Only)
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NewLoginPage;
