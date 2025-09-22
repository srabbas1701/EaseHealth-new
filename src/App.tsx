import React, { useState, useEffect } from 'react';
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
  User
} from 'lucide-react';
import Navigation from './components/Navigation';
import { useDarkMode } from './hooks/useDarkMode';
import AccessibleTestimonials from './components/AccessibleTestimonials';
import { FeatureDetection, OfflineIndicator, SkipLinks } from './components/ProgressiveEnhancement';
import { AccessibilityAnnouncer } from './components/AccessibilityAnnouncer';
import { SkipLinks as KeyboardSkipLinks, useKeyboardNavigation, FocusVisibleProvider } from './components/KeyboardNavigation';

// Import routing components
import { Routes, Route } from 'react-router-dom';
import { Link } from 'react-router-dom';
// Import your new page component
import SmartAppointmentBookingPage from './pages/SmartAppointmentBookingPage';
import PatientPreRegistrationPage from './pages/PatientPreRegistrationPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import PatientDashboardPage from './pages/PatientDashboardPage'; // Import the new page
import ChooseServicePage from './pages/ChooseServicePage';

// Create a new component for your landing page content
function LandingPageContent() {
  const { isDarkMode } = useDarkMode();
  const [userState] = useState<'new' | 'returning' | 'authenticated'>('new');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
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
      title: "Smart Appointment Booking",
      description: "Optimized slots, instant confirmation, and SMS/WhatsApp reminders.",
      image: "smart appointment booking.png",
      to: "/smart-appointment-booking" // Changed to 'to' for Link
    },
    {
      icon: FileText,
      title: "Patient Pre-Registration",
      description: "Aadhaar-based check-in and secure document upload — skip waiting lines.",
      image: "digital pre-registration.png",
      to: "/patient-pre-registration"
    },
    {
      icon: FileText,
      title: "Admin Dashboard",
      description: "Comprehensive analytics, patient management, and real-time system monitoring for healthcare providers.",
      image: "admin dashboard.png",
      to: "/admin-dashboard"
    },
    // Removed "Medication & Follow-up Reminders" as per requirements
    {
      icon: User, // Placeholder icon
      title: "Patient Dashboard",
      description: "Your personalized health overview and quick access to services.",
      image: "patient dashboard.png",
      to: "/patient-dashboard"
    },
    {
      icon: MessageCircle,
      title: "Seamless Communication",
      description: "Stay connected with your healthcare providers through integrated messaging and 24/7 support.",
      image: "Seamless Communication copy.png"
    },
    {
      icon: Clock,
      title: "Queue Dashboard",
      description: "Real-time queue management and patient flow optimization for healthcare facilities.",
      image: "queqe dashboard.png"
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Book Appointment",
      description: "Choose doctor & slot with instant confirmation."
    },
    {
      number: "02", 
      title: "Pre-Register",
      description: "Upload Aadhaar & documents, get your digital queue token."
    },
    {
      number: "03",
      title: "Visit & Care", 
      description: "Walk in, consult, and receive reminders & digital prescriptions."
    }
  ];

  const testimonials = [
    {
      id: '1',
      text: "Booking was quick and I got SMS reminders before my visit.",
      author: "Priya S.",
      location: "Mumbai",
      rating: 5
    },
    {
      id: '2',
      text: "Pre-registration saved me 30 minutes at the clinic.",
      author: "Rajesh K.", 
      location: "Delhi",
      rating: 5
    },
    {
      id: '3',
      text: "I could track my turn on the app — no more waiting blindly.",
      author: "Anjali M.",
      location: "Bangalore",
      rating: 5
    },
    {
      id: '4',
      text: "The digital pre-registration made my visit so smooth and efficient.",
      author: "Vikram P.",
      location: "Chennai",
      rating: 4
    },
    {
      id: '5',
      text: "Finally, a healthcare app that actually works! Love the reminders.",
      author: "Meera K.",
      location: "Pune",
      rating: 5
    }
  ];

  const faqs = [
    {
      question: "Is my data secure?",
      answer: "Yes. EaseHealth complies with India's DPDP Act with encryption & audit logs."
    },
    {
      question: "Do I need Aadhaar?",
      answer: "Aadhaar makes pre-registration seamless, but you can also sign up with mobile number."
    },
    {
      question: "Which doctors can I book with?",
      answer: "Only partnered doctors & clinics listed on EaseHealth."
    },
    {
      question: "Does the app send reminders?",
      answer: "Yes, you'll get SMS/WhatsApp alerts for appointments and follow-ups."
    }
  ];

  return (
    <div className="min-h-screen bg-[#F6F6F6] dark:bg-gray-900 text-[#0A2647] dark:text-gray-100 transition-colors duration-300">
      {/* Skip Links for keyboard navigation */}
      <KeyboardSkipLinks />
      
      {/* Offline indicator */}
      <OfflineIndicator />
      
      {/* Accessibility announcements */}
      <AccessibilityAnnouncer message={announcement} />

      {/* Enhanced Navigation */}
      <div id="navigation">
        <Navigation userState={userState} />
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
                Your Health.{' '}
                <span className="bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] bg-clip-text text-transparent">
                  Simplified.
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                From booking your appointment to reminders and real-time queue updates — EaseHealth AI makes doctor visits effortless with intelligent automation.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/choose-service"
                  className="bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] text-white px-8 py-4 rounded-lg font-medium text-lg hover:shadow-xl transform hover:-translate-y-1 transition-all focus-ring"
                  aria-describedby="cta-description"
                >
                  Get Started
                </Link>
                <button className="border-2 border-[#E8E8E8] dark:border-gray-600 text-[#0A2647] dark:text-gray-100 px-8 py-4 rounded-lg font-medium text-lg hover:border-[#0075A2] dark:hover:border-[#0EA5E9] hover:text-[#0075A2] dark:hover:text-[#0EA5E9] transition-colors focus-ring">
                  Learn More
                </button>
              </div>
              <div id="cta-description" className="sr-only">
                Start your healthcare journey with EaseHealth AI. Choose your service or learn more about our features.
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
              Why Choose EaseHealth AI?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Experience healthcare the modern way with AI-powered features designed for Indian patients
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
                  className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 border border-[#E8E8E8] dark:border-gray-700 group focus-ring block"
                  role="listitem"
                  aria-label={`Feature: ${benefit.title}. ${benefit.description}. Click to learn more.`}
                >
                  {benefit.image ? (
                    <div className="mb-6">
                      <img 
                        src={`/${benefit.image}`} 
                        alt={benefit.title}
                        className={benefit.image === "Seamless Communication copy.png" ? "w-full h-48 object-contain rounded-lg" : "w-full h-48 object-cover rounded-lg"}
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
                  <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-3">{benefit.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{benefit.description}</p>
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
                        className={benefit.image === "Seamless Communication copy.png" ? "w-full h-48 object-contain rounded-lg" : "w-full h-48 object-cover rounded-lg"}
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
                  <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-3">{benefit.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{benefit.description}</p>
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
              Trust and Compliance
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Your data security and privacy are our top priorities, backed by industry-leading compliance standards
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
                  className="w-full h-48 object-contain rounded-lg"
                />
              </div>
              <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-3">DPDP Compliance</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">Full compliance with India's Digital Personal Data Protection Act, ensuring your health data is handled with the highest security standards.</p>
            </div>
            
            <div className="bg-[#F6F6F6] dark:bg-gray-700 rounded-2xl p-8 shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 border border-[#E8E8E8] dark:border-gray-600 group text-center">
              <div className="mb-6">
                <img 
                  src="/India Data Residency.png" 
                  alt="India Data Residency"
                  className="w-full h-48 object-contain rounded-lg"
                />
              </div>
              <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-3">India Data Residency</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">Your data stays within India's borders, complying with local regulations and ensuring complete privacy and sovereignty.</p>
            </div>
            
            <div className="bg-[#F6F6F6] dark:bg-gray-700 rounded-2xl p-8 shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 border border-[#E8E8E8] dark:border-gray-600 group text-center">
              <div className="mb-6">
                <img 
                  src="/Immutable Audit Logs.png" 
                  alt="Immutable Audit Logs"
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
              <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-3">Immutable Audit Logs</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">Complete transparency with tamper-proof logging of all healthcare interactions, ensuring accountability and trust.</p>
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
              Healthcare in 3 Simple Steps
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              From booking to care, we've simplified the entire process
            </p>
          </div>

          <div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            role="list"
            aria-label="Three steps to use EaseHealth AI"
          >
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div 
                  className="bg-[#F6F6F6] dark:bg-gray-800 rounded-2xl p-8 text-center hover:bg-white dark:hover:bg-gray-700 hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-[#0075A2] dark:hover:border-[#0EA5E9] focus-ring"
                  role="listitem"
                  tabIndex={0}
                  aria-label={`Step ${step.number}: ${step.title}. ${step.description}`}
                >
                  <div className="w-16 h-16 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-6">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-4">{step.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <div className="w-8 h-0.5 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7]"></div>
                  </div>
                )}
              </div>
            ))}
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
              What Patients Say
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Real experiences from patients across India
            </p>
          </div>

          <AccessibleTestimonials 
            testimonials={testimonials}
            autoPlay={true}
            showRatings={true}
          />
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
              Got Questions?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Find answers to common questions about EaseHealth AI
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
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{faq.answer}</p>
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
                <div className="w-12 h-12 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-lg flex items-center justify-center relative overflow-hidden">
                  <Brain className="w-7 h-7 text-white" />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-[#00D4AA] dark:from-[#06D6A0] to-[#0075A2] dark:to-[#0EA5E9] rounded-full flex items-center justify-center">
                    <Zap className="w-3 h-3 text-white" />
                  </div>
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-transparent via-transparent to-white/10 pointer-events-none"></div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100">EaseHealth AI</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Your Health. Simplified.</p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                Making healthcare accessible and convenient for every Indian patient with cutting-edge AI technology and compassionate care.
              </p>
              <div className="flex space-x-4">
                <button className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform focus-ring" aria-label="Contact us on WhatsApp">
                  <MessageSquare className="w-5 h-5" />
                </button>
                <button className="w-10 h-10 bg-[#0077B5] rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform focus-ring" aria-label="Follow us on LinkedIn">
                  <div className="w-5 h-5 bg-white rounded-sm"></div>
                </button>
                <button className="w-10 h-10 bg-[#FF0000] rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform focus-ring" aria-label="Watch our videos on YouTube">
                  <Play className="w-5 h-5 ml-0.5" />
                </button>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold text-[#0A2647] dark:text-gray-100 mb-4">Quick Links</h4>
              <div className="space-y-2">
                <a href="#home" className="block text-gray-600 dark:text-gray-300 hover:text-[#0075A2] dark:hover:text-[#0EA5E9] transition-colors focus-ring">Home</a>
                <a href="#features" className="block text-gray-600 dark:text-gray-300 hover:text-[#0075A2] dark:hover:text-[#0EA5E9] transition-colors focus-ring">Features</a>
                <a href="#how-it-works" className="block text-gray-600 dark:text-gray-300 hover:text-[#0075A2] dark:hover:text-[#0EA5E9] transition-colors focus-ring">How It Works</a>
                <a href="#testimonials" className="block text-gray-600 dark:text-gray-300 hover:text-[#0075A2] dark:hover:text-[#0EA5E9] transition-colors focus-ring">Testimonials</a>
                <a href="#" className="block text-gray-600 dark:text-gray-300 hover:text-[#0075A2] dark:hover:text-[#0EA5E9] transition-colors focus-ring">Privacy Policy</a>
                <a href="#contact" className="block text-gray-600 dark:text-gray-300 hover:text-[#0075A2] dark:hover:text-[#0EA5E9] transition-colors focus-ring">Contact</a>
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="font-bold text-[#0A2647] dark:text-gray-100 mb-4">Contact Us</h4>
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
              © 2025 EaseHealth AI. Built with AI-powered care for Indian patients.
            </p>
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
              <Check className="w-4 h-4 text-green-600" />
              <span>DPDP Compliant</span>
              <span className="mx-2">•</span>
              <Check className="w-4 h-4 text-green-600" />
              <span>ISO 27001 Certified</span>
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
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5 mx-auto" />
        </button>
      )}
    </div>
  );
}

// Main App component now handles routing
function App() {
  return (
    <FocusVisibleProvider>
      <FeatureDetection>
        <Routes>
          <Route path="/" element={<LandingPageContent />} />
          <Route path="/smart-appointment-booking" element={<SmartAppointmentBookingPage />} />
          <Route path="/patient-pre-registration" element={<PatientPreRegistrationPage />} />
          <Route path="/admin-dashboard" element={<AdminDashboardPage />} />
          <Route path="/patient-dashboard" element={<PatientDashboardPage />} /> {/* New Patient Dashboard Route */}
          <Route path="/choose-service" element={<ChooseServicePage />} />
          {/* Add more routes here as you create new pages */}
        </Routes>
      </FeatureDetection>
    </FocusVisibleProvider>
  );
}

export default App;