import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { FileText, Calendar, CheckCircle, ArrowRight } from 'lucide-react';
import Navigation from '../components/Navigation';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslations } from '../translations';
import { useTheme } from '../contexts/ThemeContext';
import { useRBAC } from '../hooks/useRBAC';

interface OnboardingChoicePageProps {
    user: any;
    session: any;
    profile: any;
    userState: 'new' | 'returning' | 'authenticated';
    isAuthenticated: boolean;
    handleLogout: () => Promise<void>;
}

const OnboardingChoicePage: React.FC<OnboardingChoicePageProps> = ({ isAuthenticated, handleLogout }) => {
    const navigate = useNavigate();
    const { language } = useLanguage();
    const { t } = useTranslations(language);
    const { isDarkMode } = useTheme();
    const { userRole, isLoading: roleLoading } = useRBAC();

    const [isLoading, setIsLoading] = useState(false);

    // Redirect if not authenticated or not a patient
    useEffect(() => {
        if (isAuthenticated && userRole && !roleLoading) {
            if (userRole !== 'patient') {
                // Redirect to appropriate dashboard
                const dashboardPath = userRole === 'doctor' ? '/doctor-dashboard' : '/admin-dashboard';
                navigate(dashboardPath, { replace: true });
            }
        }
    }, [isAuthenticated, userRole, roleLoading, navigate]);

    // Show loading while determining authentication
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

    // Redirect if not authenticated
    if (!isAuthenticated) {
        navigate('/login-page', { replace: true });
        return null;
    }

    const handleChoice = (choice: 'pre-register' | 'book-appointment') => {
        setIsLoading(true);
        // Navigate to the chosen page
        const path = choice === 'pre-register' ? '/patient-pre-registration' : '/smart-appointment-booking';
        navigate(path);
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
                <div className="w-full max-w-2xl">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className="w-24 h-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
                        </div>
                        <h1 className="text-4xl font-bold text-[#0A2647] dark:text-gray-100 mb-4">
                            Welcome to EaseHealth!
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300">
                            Your email has been verified successfully. What would you like to do first?
                        </p>
                    </div>

                    {/* Choice Cards */}
                    <div className="grid md:grid-cols-2 gap-8 mb-8">
                        {/* Pre-registration Option */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-[#0A2647] dark:text-gray-100 mb-4">
                                    Pre-register
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                                    Complete your medical information and documents in advance. This helps us prepare for your visit and reduces waiting time.
                                </p>
                                <ul className="text-left text-sm text-gray-600 dark:text-gray-300 mb-8 space-y-2">
                                    <li className="flex items-center">
                                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                                        Upload medical documents
                                    </li>
                                    <li className="flex items-center">
                                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                                        Complete health questionnaire
                                    </li>
                                    <li className="flex items-center">
                                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                                        Get priority in queue
                                    </li>
                                    <li className="flex items-center">
                                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                                        Faster check-in process
                                    </li>
                                </ul>
                                <button
                                    onClick={() => handleChoice('pre-register')}
                                    disabled={isLoading}
                                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    {isLoading ? (
                                        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                                    ) : (
                                        <>
                                            Start Pre-registration
                                            <ArrowRight className="w-5 h-5 ml-2" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Smart Booking Option */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Calendar className="w-8 h-8 text-green-600 dark:text-green-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-[#0A2647] dark:text-gray-100 mb-4">
                                    Book Appointment
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                                    Book an appointment with our doctors right away. Choose your preferred doctor, date, and time slot.
                                </p>
                                <ul className="text-left text-sm text-gray-600 dark:text-gray-300 mb-8 space-y-2">
                                    <li className="flex items-center">
                                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                                        Choose your doctor
                                    </li>
                                    <li className="flex items-center">
                                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                                        Select date and time
                                    </li>
                                    <li className="flex items-center">
                                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                                        Instant confirmation
                                    </li>
                                    <li className="flex items-center">
                                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                                        Get appointment details
                                    </li>
                                </ul>
                                <button
                                    onClick={() => handleChoice('book-appointment')}
                                    disabled={isLoading}
                                    className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 px-6 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    {isLoading ? (
                                        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                                    ) : (
                                        <>
                                            Book Appointment
                                            <ArrowRight className="w-5 h-5 ml-2" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div className="text-center">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            Don't worry! You can always access your dashboard and complete the other option later.
                        </p>
                        <div className="mt-4">
                            <Link
                                to="/patient-dashboard"
                                className="text-[#0075A2] dark:text-[#0EA5E9] hover:underline text-sm font-medium"
                            >
                                Skip and go to Dashboard →
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OnboardingChoicePage;
