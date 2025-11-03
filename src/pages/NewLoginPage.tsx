import React, { useState, useEffect } from 'react';
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
        if (isAuthenticated && userRole && !roleLoading) {
            const targetUrl = redirectUrl !== '/' ? redirectUrl : getDefaultDashboard(userRole);
            console.log('🔄 User already authenticated, redirecting to:', targetUrl);
            navigate(targetUrl, { replace: true });
        }
    }, [isAuthenticated, userRole, roleLoading, redirectUrl, navigate, getDefaultDashboard]);

    // Countdown timer for verification
    useEffect(() => {
        if (success && success.includes('verify within 5 minutes')) {
            setCountdown(300); // 5 minutes in seconds
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
    }, [success]);

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
                    setError('Please verify your email before signing in. Check your inbox or resend verification email.');
                    setShowRecoveryOptions(true);
                    return;
                }
                throw error;
            }

            if (data.user) {
                console.log('🔄 Login successful, user will be redirected automatically');
                // The useEffect above will handle the redirect
            }
        } catch (error: any) {
            console.error('Login error:', error);
            setError(error.message || 'Login failed. Please try again.');
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
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        try {
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

            if (error) throw error;

            if (data.user) {
                // Create profile (no custom verification needed)
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert({
                        id: data.user.id,
                        full_name: formData.fullName,
                        phone_number: formData.phone,
                        role: 'patient',
                        email_verified: false // Will be true after Supabase verification
                    });

                if (profileError) throw profileError;

                setSuccess('Account created! Please check your email and verify within 5 minutes. Check your spam folder if you don\'t see the email.');
                setIsLoginMode(true);
            }
        } catch (error: any) {
            console.error('Signup error:', error);
            setError(error.message || 'Signup failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle password reset
    const handlePasswordReset = async () => {
        if (!formData.email) {
            setError('Please enter your email address first');
            return;
        }

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
                redirectTo: `${window.location.origin}/reset-password`
            });

            if (error) throw error;

            setSuccess('Password reset email sent! Check your inbox.');
        } catch (error: any) {
            console.error('Password reset error:', error);
            setError(error.message || 'Failed to send password reset email');
        }
    };

    // Handle quick resend verification
    const handleQuickResend = async () => {
        if (!formData.email) {
            setError('Please enter your email address first');
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

            setSuccess('New verification email sent! Please check your inbox.');
            setCountdown(300); // Reset countdown
            setShowRecoveryOptions(false);
        } catch (error: any) {
            console.error('Resend verification error:', error);
            setError('Failed to resend verification email. Please try again.');
        }
    };

    // Show loading state while determining authentication
    if (isAuthenticated && roleLoading) {
        return (
            <div className="min-h-screen bg-[#F6F6F6] dark:bg-gray-900 text-[#0A2647] dark:text-gray-100 transition-colors duration-300">
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#0075A2] border-t-transparent mx-auto mb-4"></div>
                        <p className="text-lg text-gray-600 dark:text-gray-300">Loading...</p>
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
                            {isLoginMode ? 'Welcome Back' : 'Create Account'}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300">
                            {isLoginMode
                                ? 'Sign in to your EaseHealth account'
                                : 'Join EaseHealth to get started'
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
                                        ? 'Complete your account to access the dashboard'
                                        : 'Sign in to continue'
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
                                    Verification expires in: {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Email Delivery Tips */}
                    {success && success.includes('verify within 5 minutes') && (
                        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                                Quick Verification Tips:
                            </h4>
                            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                                <li>• Check your spam/junk folder</li>
                                <li>• Look for emails from EaseHealth</li>
                                <li>• Click the verification link immediately</li>
                                <li>• You have 5 minutes to verify</li>
                            </ul>
                            <button
                                onClick={handleQuickResend}
                                className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                Didn't receive email? Resend now
                            </button>
                        </div>
                    )}

                    {/* Recovery Options */}
                    {showRecoveryOptions && (
                        <div className="mb-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                            <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">
                                Account Recovery Options:
                            </h4>
                            <div className="space-y-2">
                                <button
                                    onClick={handleQuickResend}
                                    className="w-full bg-orange-100 dark:bg-orange-800 text-orange-800 dark:text-orange-200 py-2 px-4 rounded-lg text-sm hover:bg-orange-200 dark:hover:bg-orange-700 transition-colors"
                                >
                                    Resend Verification Email
                                </button>
                                <p className="text-xs text-orange-600 dark:text-orange-400">
                                    If you don't receive the email within 5 minutes, your account will be automatically deleted and you can sign up again.
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
                                    Full Name
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
                                        placeholder="Enter your full name"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Phone (Signup only) */}
                        {!isLoginMode && (
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Phone Number
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
                                        placeholder="Enter your phone number"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Email Address
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
                                    placeholder="Enter your email address"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Password
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
                                    placeholder="Enter your password"
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
                                    Confirm Password
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
                                        placeholder="Confirm your password"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-[#0075A2] dark:bg-[#0EA5E9] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#005A7A] dark:hover:bg-[#0284C7] focus:ring-2 focus:ring-[#0075A2] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                            {isLoading ? 'Please wait...' : (isLoginMode ? 'Sign In' : 'Create Account')}
                        </button>
                    </form>

                    {/* Password Reset */}
                    <div className="mt-6 text-center">
                        <button
                            onClick={handlePasswordReset}
                            className="text-[#0075A2] dark:text-[#0EA5E9] hover:underline text-sm"
                        >
                            Forgot your password?
                        </button>
                    </div>

                    {/* Toggle between Login/Signup */}
                    <div className="mt-6 text-center">
                        {isLoginMode ? (
                            <p className="text-gray-600 dark:text-gray-300">
                                Don't have an account?{' '}
                                <button
                                    onClick={() => setIsLoginMode(false)}
                                    className="text-[#0075A2] dark:text-[#0EA5E9] hover:underline font-semibold"
                                >
                                    Sign up
                                </button>
                            </p>
                        ) : (
                            <p className="text-gray-600 dark:text-gray-300">
                                Already have an account?{' '}
                                <button
                                    onClick={() => setIsLoginMode(true)}
                                    className="text-[#0075A2] dark:text-[#0EA5E9] hover:underline font-semibold"
                                >
                                    Sign in
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
                            Back to Home
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
