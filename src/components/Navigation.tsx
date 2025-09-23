import React, { useState, useEffect, useRef } from 'react';
import { 
  Brain, 
  Zap, 
  ChevronDown, 
  Menu, 
  X, 
  Calendar, 
  FileText, 
  Clock, 
  Bell, 
  Shield,
  ArrowRight,
  Phone,
  Search,
  User,
  LogOut
} from 'lucide-react';
import DarkModeToggle from './DarkModeToggle';
import { useFocusManagement } from './KeyboardNavigation';
import { Link } from 'react-router-dom'; // Import Link from react-router-dom

// Helper function to get first name from full name
const getFirstName = (fullName: string): string => {
  if (!fullName) return '';
  return fullName.split(' ')[0];
};

interface AuthProps {
  user: any;
  session: any;
  profile: any;
  userState: 'new' | 'returning' | 'authenticated';
  isAuthenticated: boolean;
  handleLogout: () => Promise<void>;
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
  onMenuToggle 
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { trapFocus, getFocusableElements } = useFocusManagement();

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
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        document.querySelector('[aria-controls="features-dropdown"]')?.focus();
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
      await handleLogout();
      // The auth state change will be handled by the useAuth hook
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  const getDynamicCTA = () => {
    switch (userState) {
      case 'returning':
        return (
          <button 
            className="bg-white text-[#0075A2] px-6 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200 border border-[#E8E8E8] hover:border-[#0075A2] hover:shadow-md"
            aria-label="Log in to your account"
          >
            Log In
          </button>
        );
      case 'authenticated':
        return (
          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
              <User className="w-4 h-4" />
              <span>Hi, {profile?.full_name ? getFirstName(profile.full_name) : (user?.email?.split('@')[0] || 'User')}</span>
            </div>
            <Link
              to="/patient-dashboard"
              className="bg-gradient-to-r from-[#0075A2] to-[#0A2647] text-white px-4 py-2.5 rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 text-sm"
              aria-label="Go to your dashboard"
            >
              Dashboard
            </Link>
            <button
              onClick={handleLogoutClick}
              className="p-2.5 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
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
            Get Started
          </Link>
        );
    }
  };

  const featuresMenuItems = [
    {
      icon: Calendar,
      title: "Smart Appointment Booking",
      description: "AI-optimized scheduling with instant confirmation",
      to: "/smart-appointment-booking" // Changed to 'to' for Link
    },
    {
      icon: FileText,
     title: "Patient Pre-Registration", 
     description: "Aadhaar-based check-in and document upload for a faster process",
     to: "/patient-pre-registration"
    },
    {
      icon: FileText,
      title: "Admin Dashboard",
      description: "Comprehensive analytics and patient management system",
      to: "/admin-dashboard"
    },
    {
      icon: Bell,
      title: "Smart Reminders",
      description: "Medication and follow-up notifications",
      to: "/#features" // Changed to 'to' for Link
    },
    {
      icon: Shield,
      title: "Secure Data Management",
      description: "DPDP-compliant health record protection",
      to: "/#features" // Changed to 'to' for Link
    },
    {
      icon: User, // Placeholder icon
      title: "Patient Dashboard",
      description: "Your personalized health overview and quick access to services.",
      to: "/patient-dashboard"
    },
    {
      icon: Calendar,
      title: "Doctor Schedule Configuration",
      description: "Manage your availability and appointment slots as a healthcare provider.",
      to: "/doctor-schedule-config"
    }
  ];

  const navigationItems = [
    { label: "Home", to: "/", description: "Back to homepage" }, // Changed to 'to' for Link
    { label: "How It Works", href: "#how-it-works", description: "Learn our 3-step process" },
    { label: "Testimonials", href: "#testimonials", description: "Patient success stories" },
    { label: "Security", href: "#trust", description: "Data protection & compliance" },
    { label: "FAQs", href: "#faqs", description: "Common questions answered" },
    { label: "Contact", href: "#contact", description: "Get in touch with us" }
  ];

  return (
    <header 
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-[#E8E8E8]/50' 
          : 'bg-white shadow-sm'
      }`}
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="logo-section space-x-3">
            <Link // Changed to Link
              to="/" // Changed to 'to'
              className="w-10 h-10 bg-gradient-to-r from-[#0075A2] to-[#0A2647] rounded-lg flex items-center justify-center relative overflow-hidden group cursor-pointer focus-ring"
              tabIndex={0}
              role="button"
              aria-label="EaseHealth AI - Your Health Simplified"
              // onKeyDown removed as Link handles navigation
            >
              <Brain className="w-6 h-6 text-white" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-[#00D4AA] to-[#0075A2] rounded-full flex items-center justify-center">
                <Zap className="w-2.5 h-2.5 text-white" />
              </div>
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-transparent via-transparent to-white/10 pointer-events-none"></div>
            </Link>
            <div>
              <Link // Changed to Link
                to="/" // Changed to 'to'
                className="text-xl font-bold text-[#0A2647] hover:text-[#0075A2] transition-colors cursor-pointer focus-ring"
                tabIndex={0}
                role="button"
                aria-label="EasyHealth AI - Your Health Simplified"
                // onKeyDown removed as Link handles navigation
              >
                EaseHealth AI
              </Link>
              <p className="text-xs text-gray-600">Your Health. Simplified.</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="nav-section hidden lg:flex items-center space-x-1" role="navigation" aria-label="Main navigation">
            {navigationItems.slice(0, 1).map((item) => (
              <Link // Changed to Link
                key={item.label}
                to={item.to} // Changed to 'to'
                className="px-3 py-2 text-[#0A2647] hover:text-[#0075A2] hover:bg-[#F6F6F6] rounded-lg transition-all duration-200 font-medium focus-ring whitespace-nowrap"
                aria-label={item.description}
                // onFocus removed as Link handles navigation
              >
                {item.label}
              </Link>
            ))}

            {/* Features Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                className="flex items-center px-3 py-2 text-[#0A2647] hover:text-[#0075A2] hover:bg-[#F6F6F6] rounded-lg transition-all duration-200 font-medium focus-ring whitespace-nowrap"
                onClick={() => setActiveDropdown(activeDropdown === 'features' ? null : 'features')}
                onKeyDown={(e) => handleKeyDown(e, () => setActiveDropdown(activeDropdown === 'features' ? null : 'features'))}
                aria-expanded={activeDropdown === 'features'}
                aria-haspopup="true"
                aria-label="Features menu"
                aria-controls="features-dropdown"
                id="features-trigger"
              >
                Features 
                <ChevronDown className={`w-4 h-4 ml-1 transition-transform duration-200 ${
                  activeDropdown === 'features' ? 'rotate-180' : ''
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
                        to={item.to} // Changed to 'to'
                        className="flex items-start p-3 rounded-lg hover:bg-[#F6F6F6] dark:hover:bg-gray-700 transition-colors duration-200 group focus-ring"
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
                      View all features →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {navigationItems.slice(1).map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="px-3 py-2 text-[#0A2647] hover:text-[#0075A2] hover:bg-[#F6F6F6] rounded-lg transition-all duration-200 font-medium focus-ring whitespace-nowrap"
                aria-label={item.description}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Search and CTA */}
          <div className="cta-section hidden lg:flex items-center space-x-3">
            <button 
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-[#0075A2] dark:hover:text-[#0EA5E9] hover:bg-[#F6F6F6] dark:hover:bg-gray-700 rounded-lg transition-all duration-200 focus-ring"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
            <DarkModeToggle showDropdown={true} />
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
                    placeholder="Search features, FAQs..."
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
                    to={item.to}
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
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Features</h3>
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
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mb-2">
                      <User className="w-4 h-4 mr-2" />
                      <span>Hi, {profile?.full_name ? getFirstName(profile.full_name) : (user?.email?.split('@')[0] || 'User')}</span>
                    </div>
                    <button
                      onClick={handleLogoutClick}
                      className="flex items-center text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                      title="Log out"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
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
                <div className="mb-4">
                  <DarkModeToggle />
                </div>
                {getDynamicCTA()}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navigation;