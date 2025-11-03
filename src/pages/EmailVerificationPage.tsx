import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { CheckCircle, AlertCircle, RefreshCw, Mail } from 'lucide-react';
import Navigation from '../components/Navigation';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslations } from '../translations';
import { useTheme } from '../contexts/ThemeContext';
import { sendVerificationEmail } from '../utils/emailService';

interface EmailVerificationPageProps {
    user: any;
    session: any;
    profile: any;
    userState: 'new' | 'returning' | 'authenticated';
    isAuthenticated: boolean;
    handleLogout: () => Promise<void>;
}

const EmailVerificationPage: React.FC<EmailVerificationPageProps> = ({ handleLogout }) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { language } = useLanguage();
    const { t } = useTranslations(language);
    const { isDarkMode } = useTheme();

    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error' | 'expired'>('pending');
    const [error, setError] = useState('');
    const [userEmail, setUserEmail] = useState('');

    // Get token from URL
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    useEffect(() => {
        if (token && email) {
            verifyEmail(token, email);
        } else {
            setVerificationStatus('error');
            setError('Invalid verification link');
        }
    }, [token, email]);

    const verifyEmail = async (verificationToken: string, email: string) => {
        setIsVerifying(true);
        setError('');

        try {
            // Use Supabase's built-in email verification
            const { data, error } = await supabase.auth.verifyOtp({
                token: verificationToken,
                type: 'email'
            });

            if (error) {
                // Check if it's an expired or invalid token
                if (error.message.includes('expired') || error.message.includes('invalid')) {
                    setVerificationStatus('expired');
                    setError('Verification link has expired. Please sign up again.');
                    return;
                }
                throw error;
            }

            // Update profile to mark email as verified
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    email_verified: true
                })
                .eq('id', data.user.id);

            if (updateError) throw updateError;

            setVerificationStatus('success');
            setUserEmail(email);

            // Redirect to onboarding choice after 3 seconds
            setTimeout(() => {
                navigate('/onboarding-choice', { replace: true });
            }, 3000);

        } catch (error: any) {
            console.error('Email verification error:', error);
            setVerificationStatus('error');
            setError(error.message || 'Verification failed. Please try again.');
        } finally {
            setIsVerifying(false);
        }
    };

    const resendVerification = async () => {
        if (!email) return;

        try {
            // Use Supabase's built-in resend functionality
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email,
                options: {
                    emailRedirectTo: `${window.location.origin}/verify-email`
                }
            });

            if (error) throw error;

            setError('');
            setVerificationStatus('pending');
        } catch (error: any) {
            console.error('Resend verification error:', error);
            setError('Failed to resend verification email');
        }
    };

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
                <div className="w-full max-w-md text-center">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-[#0A2647] dark:text-gray-100 mb-2">
                            Email Verification
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300">
                            {verificationStatus === 'pending' && 'Verifying your email address...'}
                            {verificationStatus === 'success' && 'Email verified successfully!'}
                            {verificationStatus === 'error' && 'Verification failed'}
                            {verificationStatus === 'expired' && 'Verification link expired'}
                        </p>
                    </div>

                    {/* Status Icon */}
                    <div className="mb-8">
                        {verificationStatus === 'pending' && (
                            <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto">
                                <RefreshCw className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin" />
                            </div>
                        )}
                        {verificationStatus === 'success' && (
                            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
                            </div>
                        )}
                        {(verificationStatus === 'error' || verificationStatus === 'expired') && (
                            <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
                                <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
                            </div>
                        )}
                    </div>

                    {/* Status Messages */}
                    {verificationStatus === 'pending' && (
                        <div className="mb-6">
                            <p className="text-gray-600 dark:text-gray-300">
                                Please wait while we verify your email address...
                            </p>
                        </div>
                    )}

                    {verificationStatus === 'success' && (
                        <div className="mb-6">
                            <p className="text-gray-600 dark:text-gray-300 mb-4">
                                Your email <strong>{userEmail}</strong> has been verified successfully!
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Redirecting to onboarding...
                            </p>
                        </div>
                    )}

                    {verificationStatus === 'error' && (
                        <div className="mb-6">
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                <p className="text-red-800 dark:text-red-200">{error}</p>
                            </div>
                        </div>
                    )}

                    {verificationStatus === 'expired' && (
                        <div className="mb-6">
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                                    Verification Link Expired
                                </h3>
                                <p className="text-red-700 dark:text-red-300 mb-4">
                                    Your verification link has expired. For security reasons, verification links are only valid for 5 minutes.
                                </p>
                                <div className="space-y-3">
                                    <button
                                        onClick={() => navigate('/login-page')}
                                        className="w-full bg-[#0075A2] dark:bg-[#0EA5E9] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#005A7A] dark:hover:bg-[#0284C7] transition-colors duration-200"
                                    >
                                        Sign Up Again
                                    </button>
                                    <p className="text-sm text-red-600 dark:text-red-400 text-center">
                                        Don't worry, you can create a new account with the same email address.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-4">
                        {verificationStatus === 'success' && (
                            <button
                                onClick={() => navigate('/onboarding-choice')}
                                className="w-full bg-[#0075A2] dark:bg-[#0EA5E9] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#005A7A] dark:hover:bg-[#0284C7] transition-colors duration-200"
                            >
                                Continue to Onboarding
                            </button>
                        )}

                        {(verificationStatus === 'error' || verificationStatus === 'expired') && (
                            <div className="space-y-3">
                                <button
                                    onClick={resendVerification}
                                    className="w-full bg-[#0075A2] dark:bg-[#0EA5E9] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#005A7A] dark:hover:bg-[#0284C7] transition-colors duration-200"
                                >
                                    Resend Verification Email
                                </button>
                                <button
                                    onClick={() => navigate('/login-page')}
                                    className="w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
                                >
                                    Back to Login
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Help Text */}
                    <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
                        <p>
                            Didn't receive the email? Check your spam folder or{' '}
                            <button
                                onClick={resendVerification}
                                className="text-[#0075A2] dark:text-[#0EA5E9] hover:underline"
                            >
                                resend verification email
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailVerificationPage;
