import React, { useState, useEffect, Suspense } from 'react';
import { supabase } from './utils/supabase';
import {
  Calendar,
  FileText,
  Clock,
  Bell,
  Shield,
  MessageCircle,
  ChevronDown,
  Play,
  Check,
  MessageSquare,
  MapPin,
  Phone,
  Mail,
  Brain,
  Zap,
  ArrowUp,
  ArrowRight,
  Linkedin,
  Youtube,
  User
} from 'lucide-react';
import Navigation from './components/Navigation';
import { useDarkMode } from './hooks/useDarkMode';
import { useLanguage } from './contexts/LanguageContext';
import { useTranslations } from './translations';
// Lazy-load heavy, below-the-fold components
const AccessibleTestimonials = React.lazy(() => import('./components/AccessibleTestimonials'));
import { FeatureDetection, OfflineIndicator, SkipLinks } from './components/ProgressiveEnhancement';
import { AccessibilityAnnouncer } from './components/AccessibilityAnnouncer';
import { SkipLinks as KeyboardSkipLinks, useKeyboardNavigation, FocusVisibleProvider } from './components/KeyboardNavigation';
import ProtectedRoute from './components/ProtectedRoute';

// Import routing components
import { Routes, Route } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
// Route-level code splitting (lazy loaded pages)
const SmartAppointmentBookingPage = React.lazy(() => import('./pages/SmartAppointmentBookingPage'));
const PatientPreRegistrationPage = React.lazy(() => import('./pages/PatientPreRegistrationPage'));
const PatientProfileUpdatePage = React.lazy(() => import('./pages/PatientProfileUpdatePage'));
const AdminDashboardPage = React.lazy(() => import('./pages/AdminDashboardPage'));
const PatientDashboardPage = React.lazy(() => import('./pages/PatientDashboardPage'));
const ChooseServicePage = React.lazy(() => import('./pages/ChooseServicePage'));
const DoctorDashboardPage = React.lazy(() => import('./pages/DoctorDashboardPage'));
const DoctorProfileUpdatePage = React.lazy(() => import('./pages/DoctorProfileUpdatePage'));
const ResetPasswordPage = React.lazy(() => import('./pages/ResetPasswordPage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const DoctorRegistrationPage = React.lazy(() => import('./pages/DoctorRegistrationPage'));

// Auth props interface
interface AuthProps {
  user: any;
  session: any;
  profile: any;
  isLoadingInitialAuth: boolean;
  isProfileLoading: boolean;
  userState: 'new' | 'returning' | 'authenticated';
  isAuthenticated: boolean;
  handleLogout: () => Promise<void>;
}

// Create a new component for your landing page content
function LandingPageContent({ user, session, profile, isLoadingInitialAuth, isProfileLoading, userState, isAuthenticated, handleLogout }: AuthProps) {
  const { isDarkMode } = useDarkMode();
  const { language } = useLanguage();
  const { t } = useTranslations(language);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [doctorProfile, setDoctorProfile] = useState<any>(null);

  // Load doctor profile if user is authenticated
  useEffect(() => {
    const loadDoctorProfile = async () => {
      if (isAuthenticated && user) {
        try {
          const { data } = await supabase
            .from('doctors')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (data) {
            setDoctorProfile(data);
          }
        } catch (error) {
          console.error('Error loading doctor profile:', error);
        }
      } else {
        setDoctorProfile(null);
      }
    };

    loadDoctorProfile();
  }, [isAuthenticated, user]);

  // Simple patient and doctor detection - add classes to body for CSS targeting
  useEffect(() => {
    if (isAuthenticated && user) {
      // Check if user is a patient
      const checkPatient = async () => {
        try {
          const { data } = await supabase
            .from('patients')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();

          if (data) {
            document.body.classList.add('user-is-patient');
          } else {
            document.body.classList.remove('user-is-patient');
          }
        } catch (error) {
          document.body.classList.remove('user-is-patient');
        }
      };

      // Check if user is a doctor
      const checkDoctor = async () => {
        try {
          const { data } = await supabase
            .from('doctors')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();

          if (data) {
            document.body.classList.add('user-is-doctor');
          } else {
            document.body.classList.remove('user-is-doctor');
          }
        } catch (error) {
          document.body.classList.remove('user-is-doctor');
        }
      };

      checkPatient();
      checkDoctor();
    } else {
      document.body.classList.remove('user-is-patient');
      document.body.classList.remove('user-is-doctor');
    }
  }, [isAuthenticated, user]);
  const [announcement, setAnnouncement] = useState('');

  // Initialize keyboard navigation
  useKeyboardNavigation();

  // Handle scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Focus the main content after scrolling
    setTimeout(() => {
      const mainContent = document.getElementById('main-content');
      mainContent?.focus();
    }, 500);
  };

  // Prevent flash of unstyled content
  useEffect(() => {
    document.documentElement.classList.add('preload');
    const timer = setTimeout(() => {
      document.documentElement.classList.remove('preload');
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle FAQ keyboard navigation
  const handleFaqKeyDown = (event: React.KeyboardEvent, index: number) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        const nextFaq = document.querySelector(`[data-faq="${index + 1}"]`) as HTMLElement;
        nextFaq?.focus();
        break;
      case 'ArrowUp':
        event.preventDefault();
        const prevFaq = document.querySelector(`[data-faq="${index - 1}"]`) as HTMLElement;
        prevFaq?.focus();
        break;
      case 'Home':
        event.preventDefault();
        const firstFaq = document.querySelector('[data-faq="0"]') as HTMLElement;
        firstFaq?.focus();
        break;
      case 'End':
        event.preventDefault();
        const lastFaq = document.querySelector(`[data-faq="${faqs.length - 1}"]`) as HTMLElement;
        lastFaq?.focus();
        break;
    }
  };
  const benefits = [
    {
      icon: Calendar,
      title: t('features.smartAppointmentBooking.title'),
      description: t('features.smartAppointmentBooking.description'),
      image: "smart appointment booking.png",
      to: "/smart-appointment-booking"
    },
    {
      icon: FileText,
      title: t('features.patientPreRegistration.title'),
      description: t('features.patientPreRegistration.description'),
      image: "digital pre-registration.2.png",
      to: "/patient-pre-registration"
    },
    {
      icon: FileText,
      title: t('features.adminDashboard.title'),
      description: t('features.adminDashboard.description'),
      image: "admin dashboard.png",
      to: "/admin-dashboard"
    },
    {
      icon: User,
      title: t('features.patientDashboard.title'),
      description: t('features.patientDashboard.description'),
      image: "patient dashboard.png",
      to: "/patient-dashboard"
    },
    {
      icon: MessageCircle,
      title: t('features.seamlessCommunication.title'),
      description: t('features.seamlessCommunication.description'),
      image: "Seamless Communication copy.png"
    },
    {
      icon: Clock,
      title: t('features.queueDashboard.title'),
      description: t('features.queueDashboard.description'),
      image: "queqe dashboard.png"
    }
  ];

  const steps = [
    {
      number: "01",
      title: t('howItWorks.step1.title'),
      description: t('howItWorks.step1.description'),
      image: "smart appointment booking.png"
    },
    {
      number: "02",
      title: t('howItWorks.step2.title'),
      description: t('howItWorks.step2.description'),
      image: "digital pre-registration.png"
    },
    {
      number: "03",
      title: t('howItWorks.step3.title'),
      description: t('howItWorks.step3.description'),
      image: "patient dashboard.png"
    }
  ];

  const testimonials = [
    {
      id: '1',
      text: t('testimonials.testimonial1'),
      author: "Priya S.",
      location: "Mumbai",
      rating: 5
    },
    {
      id: '2',
      text: t('testimonials.testimonial2'),
      author: "Rajesh K.",
      location: "Delhi",
      rating: 5
    },
    {
      id: '3',
      text: t('testimonials.testimonial3'),
      author: "Anjali M.",
      location: "Bangalore",
      rating: 5
    },
    {
      id: '4',
      text: t('testimonials.testimonial4'),
      author: "Vikram P.",
      location: "Chennai",
      rating: 4
    },
    {
      id: '5',
      text: t('testimonials.testimonial5'),
      author: "Meera K.",
      location: "Pune",
      rating: 5
    }
  ];

  const faqs = [
    {
      question: t('faqs.q1.question'),
      answer: t('faqs.q1.answer')
    },
    {
      question: t('faqs.q2.question'),
      answer: t('faqs.q2.answer')
    },
    {
      question: t('faqs.q3.question'),
      answer: t('faqs.q3.answer')
    },
    {
      question: t('faqs.q4.question'),
      answer: t('faqs.q4.answer')
    }
  ];

  return (
    <>
      <style>
        {`
          .user-is-patient .admin-dashboard-disabled {
            pointer-events: none;
            opacity: 0.6;
            position: relative;
          }
          .user-is-patient .admin-dashboard-disabled::after {
            content: "🔒";
            position: absolute;
            top: 12px;
            right: 12px;
            font-size: 16px;
            z-index: 10;
          }
          .user-is-patient .admin-dashboard-disabled:hover {
            transform: none !important;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
          }
          
          /* Doctor access control - disable first 4 tiles */
          .user-is-doctor .doctor-disabled-tile {
            pointer-events: none;
            opacity: 0.6;
            position: relative;
          }
          .user-is-doctor .doctor-disabled-tile::after {
            content: "🔒";
            position: absolute;
            top: 12px;
            right: 12px;
            font-size: 16px;
            z-index: 10;
          }
          .user-is-doctor .doctor-disabled-tile:hover {
            transform: none !important;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
          }
        `}
      </style>
      <div className="min-h-screen bg-[#F6F6F6] dark:bg-gray-900 text-[#0A2647] dark:text-gray-100 transition-colors duration-300">
        {/* Skip Links for keyboard navigation */}
        <KeyboardSkipLinks />

        {/* Offline indicator */}
        <OfflineIndicator />

        {/* Accessibility announcements */}
        <AccessibilityAnnouncer message={announcement} />


        {/* Enhanced Navigation */}
        <div id="navigation">
          <Navigation
            user={user}
            session={session}
            profile={profile}
            userState={userState}
            isAuthenticated={isAuthenticated}
            handleLogout={handleLogout}
            doctor={doctorProfile}
          />
        </div>

        {/* Hero Section */}
        <main id="main-content" tabIndex={-1} aria-label="Main content">
          <section
            id="home"
            className="relative bg-gradient-to-br from-white dark:from-gray-800 to-[#F6F6F6] dark:to-gray-900 py-16 lg:py-24"
            aria-label="How EaseHealth AI works - 3 simple steps"
            tabIndex={-1}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#0A2647] dark:text-gray-100 leading-tight mb-6">
                    {t('hero.title')}{' '}
                    <span className="bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] bg-clip-text text-transparent">
                      {t('hero.titleHighlight')}
                    </span>
                  </h1>
                  <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                    {t('hero.subtitle')}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                      to="/choose-service"
                      className="bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] text-white px-8 py-4 rounded-lg font-medium text-lg hover:shadow-xl transform hover:-translate-y-1 transition-all focus-ring"
                      aria-describedby="cta-description"
                    >
                      {t('hero.getStarted')}
                    </Link>
                    <button className="border-2 border-[#E8E8E8] dark:border-gray-600 text-[#0A2647] dark:text-gray-100 px-8 py-4 rounded-lg font-medium text-lg hover:border-[#0075A2] dark:hover:border-[#0EA5E9] hover:text-[#0075A2] dark:hover:text-[#0EA5E9] transition-colors focus-ring">
                      {t('hero.learnMore')}
                    </button>
                  </div>
                  <div id="cta-description" className="sr-only">
                    {t('hero.ctaDescription')}
                  </div>
                </div>
                <div className="relative">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                    <img
                      src="/digital pre-registration.png"
                      alt="Digital Pre-Registration Interface"
                      className="w-full h-auto rounded-lg"
                    />
                  </div>
                  <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-full opacity-10"></div>
                  <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-full opacity-10"></div>
                </div>
              </div>
            </div>
          </section>

          {/* Benefits Section */}
          <section
            id="features"
            className="py-16 lg:py-24"
            aria-label="Features and benefits of EaseHealth AI"
            tabIndex={-1}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0A2647] dark:text-gray-100 mb-4">
                  {t('benefits.title')}
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  {t('benefits.subtitle')}
                </p>
              </div>

              <div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                role="list"
                aria-label="EaseHealth AI features"
              >
                {benefits.map((benefit, index) => (
                  benefit.to ? (
                    <Link
                      key={index}
                      to={benefit.to}
                      className={`bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 border border-[#E8E8E8] dark:border-gray-700 group focus-ring block ${benefit.title === t('features.adminDashboard.title') ? 'admin-dashboard-disabled' : ''
                        } ${index < 4 ? 'doctor-disabled-tile' : ''
                        }`}
                      role="listitem"
                      aria-label={`Feature: ${benefit.title}. ${benefit.description}. Click to learn more.`}
                      title={
                        benefit.title === t('features.adminDashboard.title')
                          ? 'Access restricted to administrators'
                          : index < 4
                            ? 'Access restricted to patients and administrators'
                            : undefined
                      }
                    >
                      {benefit.image ? (
                        <div className="mb-6">
                          <img
                            src={`/${benefit.image}`}
                            alt={benefit.title}
                            className="w-full h-64 object-contain rounded-lg bg-white"
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                          <div className="relative">
                            <benefit.icon className="w-8 h-8 text-white" />
                            {(benefit.title.includes('Secure') || benefit.title.includes('Smart')) && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-[#00D4AA] dark:from-[#06D6A0] to-[#0075A2] dark:to-[#0EA5E9] rounded-full flex items-center justify-center">
                                <Zap className="w-2.5 h-2.5 text-white" />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-3 text-center">{benefit.title}</h3>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-center">{benefit.description}</p>
                    </Link>
                  ) : (
                    <div
                      key={index}
                      className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 border border-[#E8E8E8] dark:border-gray-700 group focus-ring"
                      role="listitem"
                      tabIndex={0}
                      aria-label={`Feature: ${benefit.title}. ${benefit.description}`}
                    >
                      {benefit.image ? (
                        <div className="mb-6">
                          <img
                            src={`/${benefit.image}`}
                            alt={benefit.title}
                            className="w-full h-64 object-contain rounded-lg bg-white"
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                          <div className="relative">
                            <benefit.icon className="w-8 h-8 text-white" />
                            {(benefit.title.includes('Secure') || benefit.title.includes('Smart')) && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-[#00D4AA] dark:from-[#06D6A0] to-[#0075A2] dark:to-[#0EA5E9] rounded-full flex items-center justify-center">
                                <Zap className="w-2.5 h-2.5 text-white" />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-3 text-center">{benefit.title}</h3>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-center">{benefit.description}</p>
                    </div>
                  )
                ))}
              </div>
            </div>
          </section>

          {/* Trust and Compliance Section */}
          <section
            id="trust"
            className="py-16 lg:py-24 bg-white dark:bg-gray-800"
            aria-label="Trust and compliance information"
            tabIndex={-1}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0A2647] dark:text-gray-100 mb-4">
                  {t('trust.title')}
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  {t('trust.subtitle')}
                </p>
              </div>

              <div
                className="grid grid-cols-1 md:grid-cols-3 gap-8"
                role="list"
                aria-label="Trust and compliance features"
              >
                <div className="bg-[#F6F6F6] dark:bg-gray-700 rounded-2xl p-8 shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 border border-[#E8E8E8] dark:border-gray-600 group text-center">
                  <div className="mb-6">
                    <img
                      src="/dpdp compliance.png"
                      alt="DPDP Compliance"
                      className="w-full h-64 object-contain rounded-lg bg-white"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-3 text-center">{t('trust.dpdpCompliance.title')}</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-center">{t('trust.dpdpCompliance.description')}</p>
                </div>

                <div className="bg-[#F6F6F6] dark:bg-gray-700 rounded-2xl p-8 shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 border border-[#E8E8E8] dark:border-gray-600 group text-center">
                  <div className="mb-6">
                    <img
                      src="/India Data Residency.png"
                      alt="India Data Residency"
                      className="w-full h-64 object-contain rounded-lg bg-white"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-3 text-center">{t('trust.indiaDataResidency.title')}</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-center">{t('trust.indiaDataResidency.description')}</p>
                </div>

                <div className="bg-[#F6F6F6] dark:bg-gray-700 rounded-2xl p-8 shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 border border-[#E8E8E8] dark:border-gray-600 group text-center">
                  <div className="mb-6">
                    <img
                      src="/Immutable Audit Logs.png"
                      alt="Immutable Audit Logs"
                      className="w-full h-64 object-contain rounded-lg bg-white"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-3 text-center">{t('trust.immutableAuditLogs.title')}</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-center">{t('trust.immutableAuditLogs.description')}</p>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section
            id="how-it-works"
            className="py-16 lg:py-24 bg-[#F6F6F6] dark:bg-gray-900"
            aria-label="How EaseHealth AI works - 3 simple steps"
            tabIndex={-1}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0A2647] dark:text-gray-100 mb-4">
                  {t('howItWorks.title')}
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  {t('howItWorks.subtitle')}
                </p>
              </div>

              <div
                className="relative"
                role="list"
                aria-label="Three steps to use EaseHealth AI"
              >
                {/* Desktop: Horizontal flow with arrows */}
                <div className="hidden lg:flex items-center justify-center space-x-8">
                  {steps.map((step, index) => (
                    <div key={index} className="flex items-center">
                      {/* Step Card */}
                      <div
                        className="bg-white dark:bg-gray-800 rounded-3xl p-8 text-center hover:shadow-2xl transition-all duration-500 border-2 border-transparent hover:border-[#0075A2] dark:hover:border-[#0EA5E9] focus-ring group relative overflow-hidden w-[320px] h-[400px] flex flex-col"
                        role="listitem"
                        tabIndex={0}
                        aria-label={`Step ${step.number}: ${step.title}. ${step.description}`}
                      >

                        {/* Step image with enhanced design */}
                        <div className="relative mb-6">
                          <div className="w-32 h-32 bg-white dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300 overflow-hidden">
                            <img
                              src={`/${step.image}`}
                              alt={step.title}
                              className="w-full h-full object-contain p-2 rounded-lg"
                              loading="lazy"
                              decoding="async"
                            />
                          </div>
                          {/* Glow effect */}
                          <div className="absolute inset-0 w-32 h-32 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-2xl mx-auto blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                        </div>

                        <h3 className="text-2xl font-bold text-[#0A2647] dark:text-gray-100 mb-4 group-hover:text-[#0075A2] dark:group-hover:text-[#0EA5E9] transition-colors duration-300 h-[60px] flex items-center justify-center">{step.title}</h3>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-center text-lg flex-grow flex items-center justify-center">{step.description}</p>
                      </div>

                      {/* Arrow between steps */}
                      {index < steps.length - 1 && (
                        <div className="flex flex-col items-center mx-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-full flex items-center justify-center shadow-lg">
                            <ArrowRight className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Mobile: Vertical flow with enhanced design */}
                <div className="lg:hidden space-y-8">
                  {steps.map((step, index) => (
                    <div key={index} className="relative">
                      <div
                        className="bg-white dark:bg-gray-800 rounded-3xl p-8 text-center hover:shadow-2xl transition-all duration-500 border-2 border-transparent hover:border-[#0075A2] dark:hover:border-[#0EA5E9] focus-ring group relative overflow-hidden w-full max-w-[400px] mx-auto h-[400px] flex flex-col"
                        role="listitem"
                        tabIndex={0}
                        aria-label={`Step ${step.number}: ${step.title}. ${step.description}`}
                      >

                        {/* Step image with enhanced design */}
                        <div className="relative mb-6">
                          <div className="w-32 h-32 bg-white dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300 overflow-hidden">
                            <img
                              src={`/${step.image}`}
                              alt={step.title}
                              className="w-full h-full object-contain p-2 rounded-lg"
                              loading="lazy"
                              decoding="async"
                            />
                          </div>
                          {/* Glow effect */}
                          <div className="absolute inset-0 w-32 h-32 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-2xl mx-auto blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                        </div>

                        <h3 className="text-2xl font-bold text-[#0A2647] dark:text-gray-100 mb-4 group-hover:text-[#0075A2] dark:group-hover:text-[#0EA5E9] transition-colors duration-300 h-[60px] flex items-center justify-center">{step.title}</h3>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-center text-lg flex-grow flex items-center justify-center">{step.description}</p>
                      </div>

                      {/* Arrow between steps for mobile */}
                      {index < steps.length - 1 && (
                        <div className="flex justify-center mt-6">
                          <div className="w-12 h-12 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-full flex items-center justify-center shadow-lg">
                            <ChevronDown className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Testimonials */}
          <section
            id="testimonials"
            className="py-16 lg:py-24 bg-[#F6F6F6] dark:bg-gray-900"
            aria-label="Patient testimonials and reviews"
            tabIndex={-1}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0A2647] dark:text-gray-100 mb-4">
                  {t('testimonials.title')}
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  {t('testimonials.subtitle')}
                </p>
              </div>

              <Suspense fallback={
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <Brain className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">Loading testimonials…</p>
                </div>
              }>
                <AccessibleTestimonials
                  testimonials={testimonials}
                  autoPlay={true}
                  showRatings={true}
                />
              </Suspense>
            </div>
          </section>

          {/* FAQs */}
          <section
            id="faqs"
            className="py-16 lg:py-24 bg-white dark:bg-gray-800"
            aria-label="Frequently asked questions"
            tabIndex={-1}
          >
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0A2647] dark:text-gray-100 mb-4">
                  {t('faqs.title')}
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  {t('faqs.subtitle')}
                </p>
              </div>

              <div
                className="space-y-4"
                role="list"
                aria-label="Frequently asked questions list"
              >
                {faqs.map((faq, index) => (
                  <div
                    key={index}
                    className="border border-[#E8E8E8] dark:border-gray-700 rounded-2xl overflow-hidden"
                    role="listitem"
                  >
                    <button
                      className="w-full p-6 text-left bg-[#F6F6F6] dark:bg-gray-700 hover:bg-white dark:hover:bg-gray-600 transition-colors flex items-center justify-between focus-ring"
                      onClick={() => setOpenFaq(openFaq === index ? null : index)}
                      onKeyDown={(e) => handleFaqKeyDown(e, index)}
                      aria-expanded={openFaq === index}
                      aria-controls={`faq-answer-${index}`}
                      data-faq={index}
                    >
                      <span className="font-bold text-[#0A2647] dark:text-gray-100">{faq.question}</span>
                      <ChevronDown className={`w-5 h-5 text-[#0075A2] dark:text-[#0EA5E9] transform transition-transform ${openFaq === index ? 'rotate-180' : ''}`} />
                    </button>
                    {openFaq === index && (
                      <div
                        id={`faq-answer-${index}`}
                        className="p-6 bg-white dark:bg-gray-800 border-t border-[#E8E8E8] dark:border-gray-700"
                        role="region"
                        aria-labelledby={`faq-question-${index}`}
                      >
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-center">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer id="contact" className="bg-[#E8E8E8] dark:bg-gray-900 border-t-4 border-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7]" role="contentinfo" aria-label="Footer with contact information and links">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Logo and Description */}
                <div className="md:col-span-2">
                  <div className="flex items-center space-x-3 mb-4">
                    <img
                      src="/Logo.png"
                      alt="EaseHealth AI Logo"
                      className="h-12 w-auto object-contain"
                      style={{ backgroundColor: 'transparent' }}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        // Fallback to other formats if PNG doesn't exist
                        const target = e.target as HTMLImageElement;
                        if (target.src.includes('Logo.png')) {
                          target.src = '/logo.png';
                        } else if (target.src.includes('logo.png')) {
                          target.src = '/logo.jpg';
                        } else if (target.src.includes('logo.jpg')) {
                          target.src = '/logo.webp';
                        } else if (target.src.includes('logo.webp')) {
                          target.src = '/logo.svg';
                        }
                      }}
                    />
                    <div>
                      <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100">EaseHealth AI</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('footer.tagline')}</p>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                    {t('footer.description')}
                  </p>
                  <div className="flex space-x-4">
                    <a href="#" className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform focus-ring" aria-label={t('footer.socialMedia.whatsapp')}>
                      <MessageCircle className="w-5 h-5" />
                    </a>
                    <a href="#" className="w-10 h-10 bg-[#0077B5] rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform focus-ring" aria-label={t('footer.socialMedia.linkedin')}>
                      <Linkedin className="w-5 h-5" />
                    </a>
                    <a href="#" className="w-10 h-10 bg-[#FF0000] rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform focus-ring" aria-label={t('footer.socialMedia.youtube')}>
                      <Youtube className="w-5 h-5" />
                    </a>
                  </div>
                </div>

                {/* Quick Links */}
                <div>
                  <h4 className="font-bold text-[#0A2647] dark:text-gray-100 mb-4">{t('footer.quickLinks')}</h4>
                  <div className="space-y-2">
                    <a href="#home" className="block text-gray-600 dark:text-gray-300 hover:text-[#0075A2] dark:hover:text-[#0EA5E9] transition-colors focus-ring">{t('nav.home')}</a>
                    <a href="#features" className="block text-gray-600 dark:text-gray-300 hover:text-[#0075A2] dark:hover:text-[#0EA5E9] transition-colors focus-ring">{t('nav.features')}</a>
                    <a href="#how-it-works" className="block text-gray-600 dark:text-gray-300 hover:text-[#0075A2] dark:hover:text-[#0EA5E9] transition-colors focus-ring">{t('nav.howItWorks')}</a>
                    <a href="#testimonials" className="block text-gray-600 dark:text-gray-300 hover:text-[#0075A2] dark:hover:text-[#0EA5E9] transition-colors focus-ring">{t('nav.testimonials')}</a>
                    <a href="#" className="block text-gray-600 dark:text-gray-300 hover:text-[#0075A2] dark:hover:text-[#0EA5E9] transition-colors focus-ring">{t('footer.privacyPolicy')}</a>
                    <a href="#contact" className="block text-gray-600 dark:text-gray-300 hover:text-[#0075A2] dark:hover:text-[#0EA5E9] transition-colors focus-ring">{t('nav.contact')}</a>
                  </div>
                </div>

                {/* Contact Info */}
                <div>
                  <h4 className="font-bold text-[#0A2647] dark:text-gray-100 mb-4">{t('footer.contactUs')}</h4>
                  <div className="space-y-3">
                    <div className="flex items-center text-gray-600 dark:text-gray-300">
                      <Phone className="w-4 h-4 mr-2" />
                      <span className="text-sm">+91 80-EASEHEALTH</span>
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-300">
                      <Mail className="w-4 h-4 mr-2" />
                      <span className="text-sm">hello@easehealth.in</span>
                    </div>
                    <div className="flex items-start text-gray-600 dark:text-gray-300">
                      <MapPin className="w-4 h-4 mr-2 mt-0.5" />
                      <span className="text-sm">Noida, UttarPradesh<br />India</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Bar */}
              <div className="border-t border-gray-300 dark:border-gray-700 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between">
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 md:mb-0">
                  {t('footer.copyright')}
                </p>
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>{t('footer.dpdpCompliant')}</span>
                  <span className="mx-2">•</span>
                  <Check className="w-4 h-4 text-green-600" />
                  <span>{t('footer.isoCertified')}</span>
                </div>
              </div>
            </div>
          </footer>
        </main>

        {/* Scroll to Top Button */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 w-12 h-12 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 z-40 focus-ring"
            aria-label={t('common.scrollToTop')}
          >
            <ArrowUp className="w-5 h-5 mx-auto" />
          </button>
        )}
      </div>
    </>
  );
}

// Main App component now handles routing
function App() {
  const authData = useAuth();
  const { user, session, profile, userState, isAuthenticated, handleLogout } = authData;
  const { language } = useLanguage();
  const { t } = useTranslations(language);

  // Do not block landing render on auth; protected pages can handle auth themselves

  console.log('✅ App loaded, auth state:', {
    isAuthenticated: authData.isAuthenticated,
    isLoadingInitialAuth: authData.isLoadingInitialAuth,
    userState: authData.userState,
    hasUser: !!authData.user,
    hasProfile: !!authData.profile
  })

  return (
    <FocusVisibleProvider>
      <FeatureDetection>
        <Suspense fallback={
          <div className="min-h-screen bg-[#F6F6F6] dark:bg-gray-900 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <p className="text-gray-600 dark:text-gray-300">{t('common.loading')}</p>
            </div>
          </div>
        }>
          <Routes>
            <Route path="/" element={<LandingPageContent {...authData} handleLogout={authData.handleLogout} />} />
            <Route path="/smart-appointment-booking" element={<SmartAppointmentBookingPage {...authData} />} />
            <Route path="/patient-pre-registration" element={<PatientPreRegistrationPage {...authData} />} />
            <Route
              path="/patient-profile-update"
              element={
                <ProtectedRoute
                  isAuthenticated={authData.isAuthenticated}
                  isLoading={authData.isLoadingInitialAuth}
                  user={authData.user}
                >
                  <PatientProfileUpdatePage {...authData} />
                </ProtectedRoute>
              }
            />
            <Route path="/admin-dashboard" element={<AdminDashboardPage {...authData} />} />
            <Route path="/patient-dashboard" element={<PatientDashboardPage {...authData} />} />
            <Route path="/choose-service" element={<ChooseServicePage {...authData} />} />
            <Route path="/doctor-dashboard" element={<DoctorDashboardPage {...authData} />} />
            <Route
              path="/doctor-profile-update"
              element={
                <ProtectedRoute
                  isAuthenticated={authData.isAuthenticated}
                  isLoading={authData.isLoadingInitialAuth}
                  user={authData.user}
                >
                  <DoctorProfileUpdatePage {...authData} />
                </ProtectedRoute>
              }
            />
            <Route path="/login-page" element={<LoginPage {...authData} />} />
            <Route path="/doctor-registration" element={<DoctorRegistrationPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            {/* Add more routes here as you create new pages */}
          </Routes>
        </Suspense>
      </FeatureDetection>
    </FocusVisibleProvider>
  );
}

export default App;