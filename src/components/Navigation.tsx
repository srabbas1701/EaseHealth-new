import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  Menu,
  X,
  Calendar,
  FileText,
  ArrowRight,
  Phone,
  Search,
  User,
  LogOut,
  LogIn
} from 'lucide-react';
import DarkModeToggle from './DarkModeToggle';
import LanguageToggle from './LanguageToggle';
import { useFocusManagement } from './KeyboardNavigation';
import { Link, useNavigate } from 'react-router-dom'; // Import Link and useNavigate
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslations } from '../translations';
import { getDoctorByUserId, isMockSupabase, supabase } from '../utils/supabase';

// Helper function to get first name from full name (skip "Dr" prefix)
const getFirstName = (fullName: string): string => {
  if (!fullName) return '';
  const words = fullName.trim().split(/\s+/);
  // Skip "Dr" if it's the first word, otherwise return first word
  return words[0].toLowerCase() === 'dr' ? (words[1] || words[0]) : words[0];
};

interface AuthProps {
  user: any;
  session: any;
  profile: any;
  userState: 'new' | 'returning' | 'authenticated';
  isAuthenticated: boolean;
  handleLogout: () => Promise<void>;
  doctor?: any;
}

interface NavigationProps extends AuthProps {
  onMenuToggle?: (isOpen: boolean) => void;
}

const Navigation: React.FC<NavigationProps> = ({
  user,
  session,
  profile,
  userState,
  isAuthenticated,
  handleLogout,
  onMenuToggle,
  doctor
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const { trapFocus, getFocusableElements } = useFocusManagement();
  const { language } = useLanguage();
  const { t } = useTranslations(language);
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDoctor, setIsDoctor] = useState<boolean>(() => localStorage.getItem('isDoctor') === 'true');
  const [doctorChecked, setDoctorChecked] = useState<boolean>(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Determine if the authenticated user is a doctor (has a doctor profile)
  useEffect(() => {
    let isMounted = true;
    const checkDoctor = async () => {
      if (!isAuthenticated || !user) {
        if (isMounted) {
          setIsDoctor(false);
          setDoctorChecked(false);
        }
        return;
      }
      try {
        // In mock mode, check localStorage first, then check user data for role indicators
        if (isMockSupabase) {
          const storedRole = localStorage.getItem('userRole');
          console.log('🔍 Mock mode - stored role:', storedRole);
          if (storedRole === 'doctor') {
            if (isMounted) {
              setIsDoctor(true);
              setDoctorChecked(true);
            }
            return;
          }

          // Check if user email or name suggests they are a doctor
          const userEmail = user.email?.toLowerCase() || '';
          const userName = (profile?.full_name || user?.user_metadata?.full_name || '').toLowerCase();
          const isDoctorByPattern = userEmail.includes('doctor') || userEmail.includes('dr.') || userEmail.includes('drnishit') ||
            userName.includes('doctor') || userName.includes('dr.') ||
            userEmail.includes('admin') || userName.includes('admin');

          console.log('🔍 Mock mode - user check:', { userEmail, userName, isDoctorByPattern });

          if (isMounted) {
            setIsDoctor(isDoctorByPattern);
            setDoctorChecked(true);
            console.log('🔍 Set isDoctor to:', isDoctorByPattern);
          }
          return;
        }
        const doctor = await getDoctorByUserId(user.id);
        if (isMounted) {
          const value = !!doctor;
          setIsDoctor(value);
          try { localStorage.setItem('isDoctor', value ? 'true' : 'false'); } catch { }
          setDoctorChecked(true);
        }
      } catch {
        if (isMounted) {
          setIsDoctor(false);
          try { localStorage.setItem('isDoctor', 'false'); } catch { }
          setDoctorChecked(true);
        }
      }
    };
    checkDoctor();
    return () => { isMounted = false; };
  }, [isAuthenticated, user]);

  // Trap focus in mobile menu when open
  useEffect(() => {
    if (isMenuOpen) {
      const mobileMenu = document.querySelector('[data-mobile-menu]') as HTMLElement;
      if (mobileMenu) {
        const cleanup = trapFocus(mobileMenu);
        return cleanup;
      }
    }
  }, [isMenuOpen, trapFocus]);

  // Handle keyboard navigation for dropdown
  const handleDropdownKeyDown = (event: React.KeyboardEvent) => {
    if (!dropdownRef.current) return;

    const focusableElements = getFocusableElements(dropdownRef.current);
    const currentIndex = focusableElements.findIndex(el => el === document.activeElement);

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        const nextIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0;
        focusableElements[nextIndex]?.focus();
        break;
      case 'ArrowUp':
        event.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1;
        focusableElements[prevIndex]?.focus();
        break;
      case 'Escape':
        event.preventDefault();
        setActiveDropdown(null);
        (document.querySelector('[aria-controls="features-dropdown"]') as HTMLElement)?.focus();
        break;
      case 'Home':
        event.preventDefault();
        focusableElements[0]?.focus();
        break;
      case 'End':
        event.preventDefault();
        focusableElements[focusableElements.length - 1]?.focus();
        break;
    }
  };
  // Handle menu toggle
  const handleMenuToggle = () => {
    const newState = !isMenuOpen;
    setIsMenuOpen(newState);
    onMenuToggle?.(newState);

    // Focus management for mobile menu
    if (newState) {
      setTimeout(() => {
        const firstMenuItem = document.querySelector('[data-mobile-menu] a, [data-mobile-menu] button') as HTMLElement;
        firstMenuItem?.focus();
      }, 100);
    }
  };

  // handleKeyDown is generally not needed for Link components as they handle navigation on Enter/Space by default.
  // Keeping it for buttons or other interactive elements that are not Links.
  const handleKeyDown = (event: React.KeyboardEvent, action: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  };

  const handleLogoutClick = async () => {
    try {
      console.log('🔄 Starting logout process...');

      // Close any open dropdowns/menus first
      setActiveDropdown(null);
      setIsMenuOpen(false);

      // Call the logout function
      await handleLogout();
      console.log('✅ Logout completed successfully');

      // Navigate to home page after logout
      navigate('/');
    } catch (error) {
      console.error('❌ Error signing out:', error);

      // Try to force logout by clearing local state and redirecting
      try {
        console.log('🔄 Attempting force logout...');

        // Try direct Supabase logout as fallback
        try {
          await supabase.auth.signOut();
          console.log('✅ Direct Supabase logout successful');
        } catch (supabaseError) {
          console.warn('⚠️ Direct Supabase logout failed:', supabaseError);
        }

        // Clear localStorage
        localStorage.removeItem('isDoctor');
        localStorage.removeItem('userRole');
        localStorage.clear();

        // Clear session storage
        sessionStorage.clear();

        // Force redirect to home page
        window.location.href = '/';
      } catch (forceLogoutError) {
        console.error('❌ Force logout also failed:', forceLogoutError);
        alert('Logout failed. Please refresh the page and try again.');
      }
    }
  };
  const toggleSearch = () => {
    setIsSearchOpen(prev => !prev);
    setTimeout(() => {
      const input = document.getElementById('global-search-input') as HTMLInputElement | null;
      input?.focus();
    }, 0);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setIsSearchOpen(false);
      return;
    }
    // Section jumps
    if (['feature', 'features'].some(k => q.includes(k))) {
      window.location.hash = '#features';
      setIsSearchOpen(false);
      return;
    }
    if (['how', 'works', 'how it works'].some(k => q.includes(k))) {
      window.location.hash = '#how-it-works';
      setIsSearchOpen(false);
      return;
    }
    if (['trust', 'security', 'privacy'].some(k => q.includes(k))) {
      window.location.hash = '#trust';
      setIsSearchOpen(false);
      return;
    }
    if (['contact', 'support'].some(k => q.includes(k))) {
      window.location.hash = '#contact';
      setIsSearchOpen(false);
      return;
    }
    // Route shortcuts
    if (q.includes('appointment')) {
      navigate('/smart-appointment-booking'); setIsSearchOpen(false); return;
    }
    if (q.includes('pre') || q.includes('registration')) {
      navigate('/patient-pre-registration'); setIsSearchOpen(false); return;
    }
    if (q.includes('admin')) {
      navigate('/admin-dashboard'); setIsSearchOpen(false); return;
    }
    if (q.includes('patient')) {
      navigate('/patient-dashboard'); setIsSearchOpen(false); return;
    }
    if ((q.includes('doctor') || q.includes('schedule')) && isDoctor) {
      navigate('/doctor-dashboard'); setIsSearchOpen(false); return;
    }
    // Default: go to choose-service
    navigate('/choose-service');
    setIsSearchOpen(false);
  };

  const getDynamicCTA = () => {
    switch (userState) {
      case 'returning':
        return (
          <button
            className="bg-white text-[#0075A2] px-6 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200 border border-[#E8E8E8] hover:border-[#0075A2] hover:shadow-md"
            aria-label="Log in to your account"
          >
            {t('nav.logIn')}
          </button>
        );
      case 'authenticated':
        // Determine dashboard link based on user role
        const dashboardLink = isDoctor ? '/doctor-dashboard' : '/patient-dashboard';
        // Get display name from doctor profile, patient profile, or user data
        const displayName = doctor?.full_name || profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || t('common.user');

        return (
          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-2 text-sm text-[#0A2647] dark:text-white">
              <User className="w-4 h-4 text-[#0A2647] dark:text-white" />
              <span className="text-[#0A2647] dark:text-white">{t('common.hi')}, <span className="font-bold text-[#0A2647] dark:text-white">{getFirstName(displayName)}</span></span>
            </div>
            <Link
              to={dashboardLink}
              className="bg-gradient-to-r from-[#0075A2] to-[#0A2647] text-white px-4 py-2.5 rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 text-sm"
              aria-label="Go to Dashboard"
            >
              {t('nav.dashboard')}
            </Link>
            <button
              onClick={handleLogoutClick}
              className="flex items-center px-4 py-2.5 text-red-600 dark:text-red-400 hover:text-white dark:hover:text-white hover:bg-red-600 dark:hover:bg-red-600 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 border border-red-200 dark:border-red-800 hover:border-red-600 dark:hover:border-red-600 font-medium whitespace-nowrap"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        );
      default:
        return (
          <Link
            to="/choose-service"
            className="bg-gradient-to-r from-[#0075A2] to-[#0A2647] text-white px-6 py-2.5 rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 inline-block text-center"
            aria-label="Get started with EaseHealth AI"
          >
            {t('nav.getStarted')}
          </Link>
        );
    }
  };

  const allFeaturesMenuItems = [
    {
      icon: Calendar,
      title: t('features.smartAppointmentBooking.title'),
      description: t('features.smartAppointmentBooking.description'),
      to: "/smart-appointment-booking",
      forPatients: true
    },
    {
      icon: FileText,
      title: t('features.patientPreRegistration.title'),
      description: t('features.patientPreRegistration.description'),
      to: "/patient-pre-registration",
      forPatients: true
    },
    {
      icon: FileText,
      title: t('features.adminDashboard.title'),
      description: t('features.adminDashboard.description'),
      to: "/login-page?redirect=/admin-dashboard&from=dashboard",
      forPatients: false,
      dashboardType: "admin"
    },
    {
      icon: User,
      title: t('features.patientDashboard.title'),
      description: t('features.patientDashboard.description'),
      to: "/login-page?redirect=/patient-dashboard&from=dashboard",
      forPatients: true,
      dashboardType: "patient"
    },
    {
      icon: Calendar,
      title: t('features.doctorDashboard.title'),
      description: t('features.doctorDashboard.description'),
      to: "/login-page?redirect=/doctor-dashboard&from=dashboard",
      forPatients: false,
      dashboardType: "doctor"
    }
  ];

  // Filter features based on user type and auth state
  let featuresMenuItems = allFeaturesMenuItems;
  if (isDoctor) {
    // Doctors: only doctor dashboard related entries
    featuresMenuItems = allFeaturesMenuItems.filter(item => item.dashboardType === 'doctor');
  } else if (isAuthenticated) {
    // Authenticated patients: show only patient-appropriate items
    featuresMenuItems = allFeaturesMenuItems
      .filter(item => item.forPatients === true || item.dashboardType === 'patient')
      .map(item => {
        // If patient is logged in, Patient Pre-Registration should open profile update
        if (item.to === '/patient-pre-registration') {
          return { ...item, to: '/patient-profile-update' };
        }
        return item;
      });
  }

  const navigationItems = [
    { label: t('nav.home'), to: "/", description: "Back to homepage" },
    { label: t('nav.howItWorks'), href: "#how-it-works", description: "Learn our 3-step process" },
    { label: t('nav.security'), href: "#trust", description: "Data protection & compliance" }
  ];

  return (
    <>
      <style>
        {`
          .user-is-patient .patient-hidden {
            display: none !important;
          }
        `}
      </style>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg border-b border-[#E8E8E8]/50 dark:border-gray-700/50'
          : 'bg-white dark:bg-gray-900 shadow-sm'
          }`}
        role="banner"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo - New Design */}
            <div className="logo-section space-x-3">
              <Link
                to="/"
                className="flex items-center space-x-3 cursor-pointer focus-ring group"
                tabIndex={0}
                role="button"
                aria-label="EaseHealth AI - Your Health Simplified"
              >
                <img
                  src="/Logo.png"
                  alt="EaseHealth AI Logo"
                  className="h-12 w-auto object-contain"
                  style={{ backgroundColor: 'transparent' }}
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
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="nav-section hidden lg:flex items-center space-x-1" role="navigation" aria-label="Main navigation">
              {navigationItems.slice(0, 1).map((item) => (
                <Link // Changed to Link
                  key={item.label}
                  to={item.to} // Changed to 'to'
                  className="px-3 py-2 text-[#0A2647] dark:text-white hover:text-[#0075A2] dark:hover:text-[#0EA5E9] hover:bg-[#F6F6F6] dark:hover:bg-gray-700 rounded-lg transition-all duration-200 font-medium focus-ring whitespace-nowrap"
                  aria-label={item.description}
                // onFocus removed as Link handles navigation
                >
                  {item.label}
                </Link>
              ))}

              {/* Features Dropdown */}
              {featuresMenuItems.length > 0 && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    className="flex items-center px-3 py-2 text-[#0A2647] dark:text-white hover:text-[#0075A2] dark:hover:text-[#0EA5E9] hover:bg-[#F6F6F6] dark:hover:bg-gray-700 rounded-lg transition-all duration-200 font-medium focus-ring whitespace-nowrap"
                    onClick={() => setActiveDropdown(activeDropdown === 'features' ? null : 'features')}
                    onKeyDown={(e) => handleKeyDown(e, () => setActiveDropdown(activeDropdown === 'features' ? null : 'features'))}
                    aria-expanded={activeDropdown === 'features'}
                    aria-haspopup="true"
                    aria-label="Features menu"
                    aria-controls="features-dropdown"
                    id="features-trigger"
                  >
                    {t('nav.features')}
                    <ChevronDown className={`w-4 h-4 ml-1 transition-transform duration-200 ${activeDropdown === 'features' ? 'rotate-180' : ''
                      }`} />
                  </button>

                  {activeDropdown === 'features' && (
                    <div
                      id="features-dropdown"
                      className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-[#E8E8E8] dark:border-gray-700 opacity-100 visible transition-all duration-200 overflow-hidden z-50"
                      role="menu"
                      aria-labelledby="features-trigger"
                      onKeyDown={handleDropdownKeyDown}
                      tabIndex={-1}
                    >
                      <div className="p-2">
                        {featuresMenuItems.map((item, index) => (
                          <Link // Changed to Link
                            key={index}
                            to={item.to || '#'} // Changed to 'to'
                            state={item.dashboardType ? { dashboardType: item.dashboardType } : undefined}
                            className={`flex items-start p-3 rounded-lg hover:bg-[#F6F6F6] dark:hover:bg-gray-700 transition-colors duration-200 group focus-ring ${item.dashboardType === 'doctor' || item.dashboardType === 'admin' ? 'patient-hidden' : ''}`}
                            onClick={() => setActiveDropdown(null)} // Keep onClick to close dropdown
                            role="menuitem"
                            tabIndex={0}
                          >
                            <div className="w-10 h-10 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-lg flex items-center justify-center mr-3 group-hover:scale-105 transition-transform">
                              <item.icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-[#0A2647] dark:text-gray-100 text-sm mb-1 group-hover:text-[#0075A2] dark:group-hover:text-[#0EA5E9] transition-colors">
                                {item.title}
                              </h4>
                              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                {item.description}
                              </p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#0075A2] dark:group-hover:text-[#0EA5E9] transition-colors" />
                          </Link>
                        ))}
                      </div>
                      <div className="border-t border-[#E8E8E8] dark:border-gray-700 p-3 bg-[#F6F6F6] dark:bg-gray-700">
                        <Link // Changed to Link
                          to="/#features" // Changed to 'to'
                          className="text-sm text-[#0075A2] dark:text-[#0EA5E9] hover:text-[#0A2647] dark:hover:text-gray-100 font-medium transition-colors focus-ring"
                          onClick={() => setActiveDropdown(null)} // Keep onClick to close dropdown
                          role="menuitem"
                          tabIndex={0}
                        >
                          {t('features.viewAllFeatures')}
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {navigationItems.slice(1).map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="px-3 py-2 text-[#0A2647] dark:text-white hover:text-[#0075A2] dark:hover:text-[#0EA5E9] hover:bg-[#F6F6F6] dark:hover:bg-gray-700 rounded-lg transition-all duration-200 font-medium focus-ring whitespace-nowrap"
                  aria-label={item.description}
                >
                  {item.label}
                </a>
              ))}
            </nav>

            {/* Search and CTA */}
            <div className="cta-section hidden lg:flex items-center space-x-3">
              <div className="relative" ref={searchRef}>
                <button
                  className="p-2 text-gray-600 dark:text-gray-300 hover:text-[#0075A2] dark:hover:text-[#0EA5E9] hover:bg-[#F6F6F6] dark:hover:bg-gray-700 rounded-lg transition-all duration-200 focus-ring"
                  aria-label={t('nav.search')}
                  aria-expanded={isSearchOpen}
                  onClick={toggleSearch}
                >
                  <Search className="w-5 h-5" />
                </button>
                {isSearchOpen && (
                  <form onSubmit={handleSearchSubmit} className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 flex items-center space-x-2">
                    <input
                      id="global-search-input"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('nav.searchPlaceholder')}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0075A2]"
                      onKeyDown={(e) => { if (e.key === 'Escape') { setIsSearchOpen(false); } }}
                      aria-label={t('nav.search')}
                    />
                    <button type="submit" className="px-3 py-2 bg-[#0075A2] dark:bg-[#0EA5E9] text-white rounded-md text-sm hover:opacity-90 transition-colors">Go</button>
                  </form>
                )}
              </div>
              <LanguageToggle showDropdown={true} />
              <DarkModeToggle showDropdown={true} />
              {/* Login Button - only for unauthenticated users (desktop) */}
              {!isAuthenticated && (
                <Link
                  to="/login-page?from=topbar"
                  className="flex items-center bg-gradient-to-r from-[#0075A2] to-[#0A2647] text-white px-4 py-2.5 rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:ring-offset-2"
                  title="Login"
                  aria-label="Sign in"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </Link>
              )}
              {getDynamicCTA()}
            </div>

            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-[#F6F6F6] transition-colors duration-200 focus-ring"
              onClick={handleMenuToggle}
              onKeyDown={(e) => handleKeyDown(e, handleMenuToggle)}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? (
                <X className="w-6 h-6 text-[#0A2647]" />
              ) : (
                <Menu className="w-6 h-6 text-[#0A2647]" />
              )}
            </button>
          </div>

          {/* Enhanced Mobile Navigation */}
          {isMenuOpen && (
            <div
              className="lg:hidden bg-white border-t border-[#E8E8E8] animate-in slide-in-from-top duration-200"
              data-mobile-menu
              role="navigation"
              aria-label="Mobile navigation menu"
            >
              <div className="py-4 space-y-1">
                {/* Search Bar */}
                <div className="px-4 pb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder={t('nav.searchPlaceholder')}
                      className="w-full pl-10 pr-4 py-2 border border-[#E8E8E8] rounded-lg focus-ring transition-colors"
                    />
                  </div>
                </div>

                {/* Navigation Items */}
                {navigationItems.map((item, index) => (
                  item.href ? (
                    <a
                      key={item.label}
                      href={item.href}
                      className="flex items-center justify-between px-4 py-3 text-[#0A2647] hover:text-[#0075A2] hover:bg-[#F6F6F6] transition-all duration-200 font-medium focus-ring"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div>
                        <div className="font-medium">{item.label}</div>
                        <div className="text-sm text-gray-600">{item.description}</div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </a>
                  ) : (
                    <Link
                      key={item.label}
                      to={item.to || '#'}
                      className="flex items-center justify-between px-4 py-3 text-[#0A2647] hover:text-[#0075A2] hover:bg-[#F6F6F6] transition-all duration-200 font-medium focus-ring"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div>
                        <div className="font-medium">{item.label}</div>
                        <div className="text-sm text-gray-600">{item.description}</div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </Link>
                  )
                ))}

                {/* Features Section */}
                <div className="px-4 py-2">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('nav.features')}</h3>
                  <div className="space-y-1">
                    {featuresMenuItems.slice(0, 3).map((item, index) => (
                      <Link // Changed to Link
                        key={index}
                        to={item.to} // Changed to 'to'
                        className="flex items-center p-2 rounded-lg hover:bg-[#F6F6F6] transition-colors duration-200 focus-ring"
                        onClick={() => setIsMenuOpen(false)} // Keep onClick to close menu
                      >
                        <div className="w-8 h-8 bg-gradient-to-r from-[#0075A2] to-[#0A2647] rounded-lg flex items-center justify-center mr-3">
                          <item.icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-[#0A2647]">{item.title}</span>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Contact Info */}
                <div className="px-4 py-2 border-t border-[#E8E8E8] mt-4">
                  {userState === 'authenticated' && (
                    <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center text-sm text-[#0A2647] dark:text-white mb-2">
                        <User className="w-4 h-4 mr-2 text-[#0A2647] dark:text-white" />
                        <span className="text-[#0A2647] dark:text-white">{t('common.hi')}, <span className="font-bold text-[#0A2647] dark:text-white">{getFirstName(profile?.full_name || user?.user_metadata?.full_name || (user?.email?.split('@')[0] || t('common.user')))}</span></span>
                      </div>
                      <button
                        onClick={handleLogoutClick}
                        className="flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:text-white dark:hover:text-white hover:bg-red-600 dark:hover:bg-red-600 rounded-lg transition-all duration-200 border border-red-200 dark:border-red-800 hover:border-red-600 dark:hover:border-red-600 font-medium whitespace-nowrap"
                        title="Log out"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        {t('nav.signOut')}
                      </button>
                    </div>
                  )}
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <Phone className="w-4 h-4 mr-2" />
                    <span>+91 80-EASEHEALTH</span>
                  </div>
                </div>

                {/* CTA */}
                <div className="px-4 pt-4 border-t border-[#E8E8E8]">
                  <div className="mb-4 flex items-center space-x-3">
                    <LanguageToggle />
                    <DarkModeToggle />
                    {/* Login Button - only for unauthenticated users (mobile) */}
                    {!isAuthenticated && (
                      <Link
                        to="/login-page?from=topbar"
                        className="flex items-center bg-gradient-to-r from-[#0075A2] to-[#0A2647] text-white px-4 py-2.5 rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:ring-offset-2"
                        title="Login"
                        aria-label="Sign in"
                      >
                        <LogIn className="w-4 h-4 mr-2" />
                        Login
                      </Link>
                    )}
                  </div>
                  {getDynamicCTA()}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
};

export default Navigation;