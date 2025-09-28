import React, { useState } from 'react';
import Navigation from '../components/Navigation';
import { AccessibilityAnnouncer } from '../components/AccessibilityAnnouncer';
import { SkipLinks as KeyboardSkipLinks } from '../components/KeyboardNavigation';
import AuthModal from '../components/AuthModal';
import { getDoctors, getAvailableTimeSlots, generateTimeSlots, Doctor, createPreRegistration } from '../utils/supabase';
import { Link } from 'react-router-dom';

// Auth props interface
interface AuthProps {
  user: any;
  session: any;
  profile: any;
  userState: 'new' | 'returning' | 'authenticated';
  isAuthenticated: boolean;
  handleLogout: () => Promise<void>;
}

import { 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Clock, 
  User,
  CheckCircle,
  FileText,
  Bell
} from 'lucide-react';

function SmartAppointmentBookingPage({ user, session, profile, userState, isAuthenticated, handleLogout }: AuthProps) {
  const [announcement, setAnnouncement] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState(5); // July 5th
  const [selectedTime, setSelectedTime] = useState('9:30 AM');
  const [currentMonth, setCurrentMonth] = useState('July 2024');
  const [isDoctorDropdownOpen, setIsDoctorDropdownOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [authError, setAuthError] = useState<string>('');

  // Load doctors on component mount
  React.useEffect(() => {
    loadDoctors();
  }, []);

  // Load time slots when doctor or date changes
  React.useEffect(() => {
    if (selectedDoctor) {
      loadTimeSlots();
    }
  }, [selectedDoctor, selectedDate]);

  const loadDoctors = async () => {
    try {
      setIsLoadingDoctors(true);
      const doctorsList = await getDoctors();
      setDoctors(doctorsList || []);
      if (doctorsList && doctorsList.length > 0) {
        setSelectedDoctor(doctorsList[0]);
      }
    } catch (error) {
      console.error('Error loading doctors:', error);
      setAnnouncement('Failed to load doctors. Please refresh the page.');
    } finally {
      setIsLoadingDoctors(false);
    }
  };

  const loadTimeSlots = async () => {
    if (!selectedDoctor) return;

    try {
      setIsLoadingSlots(true);
      const selectedDateStr = `2024-07-${selectedDate.toString().padStart(2, '0')}`;
      
      // First try to get existing slots
      let slots = await getAvailableTimeSlots(selectedDoctor.id, selectedDateStr);
      
      // If no slots exist, generate them
      if (!slots || slots.length === 0) {
        slots = await generateTimeSlots(selectedDoctor.id, selectedDateStr);
      }
      
      setAvailableSlots(slots || []);
    } catch (error) {
      console.error('Error loading time slots:', error);
      setAvailableSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const timeSlots = [
    { time: '9:00 AM', available: true },
    { time: '9:30 AM', available: true, highlighted: true },
    { time: '10:00 AM', available: true },
    { time: '10:30 AM', available: true },
    { time: '11:00 AM', available: true },
    { time: '11:30 AM', available: true, highlighted: true },
    { time: '12:00 PM', available: true },
  ];

  const calendarDays = [
    { day: '', disabled: true },
    { day: '', disabled: true },
    { day: '', disabled: true },
    { day: '', disabled: true },
    { day: '', disabled: true },
    { day: '', disabled: true },
    { day: 1, disabled: false },
    { day: 2, disabled: false },
    { day: 3, disabled: false },
    { day: 4, disabled: false },
    { day: 5, disabled: false, selected: true },
    { day: 6, disabled: false },
    { day: 7, disabled: false },
    { day: 8, disabled: false },
    { day: 9, disabled: false },
    { day: 10, disabled: false },
    { day: 11, disabled: false },
    { day: 12, disabled: false },
    { day: 13, disabled: false },
    { day: 14, disabled: false },
    { day: 15, disabled: false },
    { day: 16, disabled: false },
    { day: 17, disabled: false, highlighted: true },
    { day: 18, disabled: false },
    { day: 19, disabled: false },
    { day: 20, disabled: false },
    { day: 21, disabled: false },
    { day: 22, disabled: false },
    { day: 23, disabled: false },
    { day: 24, disabled: false },
    { day: 25, disabled: false },
    { day: 26, disabled: false },
    { day: 27, disabled: false, highlighted: true },
    { day: 28, disabled: false },
    { day: 29, disabled: false },
    { day: 30, disabled: false },
    { day: 31, disabled: false },
  ];

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const steps = [
    {
      number: "01",
      title: "Select Doctor & Specialty",
      description: "Choose from our network of verified healthcare professionals based on your needs.",
      icon: User
    },
    {
      number: "02", 
      title: "Pick Your Preferred Date & Time",
      description: "View real-time availability and select a slot that works best for your schedule.",
      icon: Calendar
    },
    {
      number: "03",
      title: "Instant Confirmation & Reminders", 
      description: "Get immediate booking confirmation with SMS/WhatsApp reminders before your visit.",
      icon: CheckCircle
    }
  ];

  const handleDoctorSelect = (doctor: string) => {
    const doctorObj = doctors.find(d => `${d.full_name} - ${d.specialty}` === doctor);
    if (doctorObj) {
      setSelectedDoctor(doctorObj);
    }
    setIsDoctorDropdownOpen(false);
    setAnnouncement(`Selected doctor: ${doctor}`);
  };

  const handleDateSelect = (day: number) => {
    setSelectedDate(day);
    setAnnouncement(`Selected date: July ${day}, 2024`);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setAnnouncement(`Selected time: ${time}`);
  };

  const handleConfirmBooking = () => {
    setShowAuthModal(true);
  };

  const handleAuthSuccess = async () => {
    setShowAuthModal(false);
    setBookingConfirmed(true);
    setAnnouncement(`Booking confirmed for ${selectedDoctor?.full_name} on July ${selectedDate}, 2024 at ${selectedTime}`);
    
    // Here you could also create an actual appointment record in the database
    // For now, we'll just show the confirmation
  };

  const authContext = {
    title: 'Complete Your Booking',
    description: `To confirm your appointment with ${selectedDoctor?.full_name} on July ${selectedDate}, 2024 at ${selectedTime}, please create an account or sign in to your existing account.`,
    actionText: 'Confirm Booking'
  };

  return (
    <div className="min-h-screen bg-[#F6F6F6] dark:bg-gray-900 text-[#0A2647] dark:text-gray-100 transition-colors duration-300">
      <KeyboardSkipLinks />
      <AccessibilityAnnouncer message={announcement} />

      <Navigation 
        user={user}
        session={session}
        profile={profile}
        userState={userState}
        isAuthenticated={isAuthenticated}
        handleLogout={handleLogout}
      />

      <main id="main-content" tabIndex={-1} aria-label="Smart Appointment Booking">
        {/* Hero Section with Immediate Booking */}
        <section className="relative bg-gradient-to-br from-white dark:from-gray-800 to-[#F6F6F6] dark:to-gray-900 py-8 lg:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Back Button */}
            <Link 
              to="/" 
              className="inline-flex items-center text-[#0075A2] dark:text-[#0EA5E9] hover:text-[#0A2647] dark:hover:text-gray-100 transition-colors mb-8 focus-ring"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Back to Home
            </Link>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Page Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-6">
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
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0A2647] dark:text-gray-100 leading-tight mb-4">
                Smart Appointment{' '}
                <span className="bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] bg-clip-text text-transparent">
                  Booking
                </span>
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed max-w-2xl mx-auto">
                Book your appointment in seconds with AI-powered scheduling and instant confirmations
              </p>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {/* Left Column - Booking Interface (2/3 width) */}
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 lg:p-8 border border-gray-200 dark:border-gray-700">
                  <h2 className="text-2xl font-bold text-[#0A2647] dark:text-gray-100 mb-6 text-center">
                    Book an Appointment
                  </h2>

                  {/* Step 1: Select Doctor */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-[#0075A2] dark:text-[#0EA5E9] mb-3 flex items-center">
                      <span className="w-6 h-6 bg-[#0075A2] dark:bg-[#0EA5E9] text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">1</span>
                      Select Doctor
                    </h3>
                    
                    <div className="relative">
                      <button
                        onClick={() => setIsDoctorDropdownOpen(!isDoctorDropdownOpen)}
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 text-left flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] disabled:opacity-50"
                        aria-expanded={isDoctorDropdownOpen}
                        aria-haspopup="listbox"
                        disabled={isLoadingDoctors}
                      >
                        <span className="text-[#0A2647] dark:text-gray-100">
                          {isLoadingDoctors ? 'Loading doctors...' :
                           selectedDoctor ? `${selectedDoctor.full_name} - ${selectedDoctor.specialty}` :
                           'Select a doctor'}
                        </span>
                        <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isDoctorDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isDoctorDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                          {doctors.map((doctor, index) => {
                            const doctorDisplay = `${doctor.full_name} - ${doctor.specialty}`;
                            return (
                              <button
                                key={index}
                                onClick={() => handleDoctorSelect(doctorDisplay)}
                                className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700"
                                role="option"
                                aria-selected={selectedDoctor?.id === doctor.id}
                              >
                                <div className="flex items-center">
                                  <User className="w-4 h-4 text-gray-400 mr-3" />
                                  <div>
                                    <span className="text-[#0A2647] dark:text-gray-100 font-medium">{doctor.full_name}</span>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{doctor.specialty}</p>
                                    {doctor.consultation_fee && (
                                      <p className="text-xs text-[#0075A2] dark:text-[#0EA5E9]">₹{doctor.consultation_fee}</p>
                                    )}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 2: Select Date */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-[#0075A2] dark:text-[#0EA5E9] mb-3 flex items-center">
                      <span className="w-6 h-6 bg-[#0075A2] dark:bg-[#0EA5E9] text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">2</span>
                      Select Date
                    </h3>

                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      {/* Calendar Header */}
                      <div className="flex items-center justify-between mb-4">
                        <button 
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#0075A2]"
                          aria-label="Previous month"
                        >
                          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>
                        <h4 className="text-lg font-semibold text-[#0A2647] dark:text-gray-100">{currentMonth}</h4>
                        <button 
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#0075A2]"
                          aria-label="Next month"
                        >
                          <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>
                      </div>

                      {/* Week Days Header */}
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {weekDays.map((day, index) => (
                          <div key={index} className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2">
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* Calendar Grid */}
                      <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((dayObj, index) => (
                          <button
                            key={index}
                            onClick={() => dayObj.day && !dayObj.disabled && handleDateSelect(dayObj.day)}
                            disabled={dayObj.disabled || !dayObj.day}
                            className={`
                              h-10 w-10 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#0075A2]
                              ${dayObj.disabled || !dayObj.day 
                                ? 'text-transparent cursor-default' 
                                : dayObj.selected 
                                  ? 'bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] text-white shadow-md transform scale-105' 
                                  : dayObj.highlighted 
                                    ? 'bg-[#0075A2] text-white hover:bg-[#005a7a]' 
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                              }
                            `}
                            aria-label={dayObj.day ? `July ${dayObj.day}, 2024` : ''}
                            aria-selected={dayObj.selected}
                          >
                            {dayObj.day || ''}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Select Time Slot */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-[#0075A2] dark:text-[#0EA5E9] mb-3 flex items-center">
                      <span className="w-6 h-6 bg-[#0075A2] dark:bg-[#0EA5E9] text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">3</span>
                      Select Time Slot for July {selectedDate}, 2024
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {isLoadingSlots ? (
                        <div className="col-span-full text-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0075A2] dark:border-[#0EA5E9] mx-auto mb-2"></div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Loading available slots...</p>
                        </div>
                      ) : availableSlots.length > 0 ? (
                        availableSlots.map((slot, index) => {
                          const timeDisplay = new Date(`2000-01-01T${slot.start_time}`).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          });
                          return (
                            <button
                              key={index}
                              onClick={() => handleTimeSelect(timeDisplay)}
                              className={`
                                px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#0075A2]
                                ${selectedTime === timeDisplay
                                  ? 'bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] text-white shadow-md transform scale-105'
                                  : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500'
                                }
                              `}
                              aria-label={`${timeDisplay} available`}
                              aria-selected={selectedTime === timeDisplay}
                            >
                              <div className="flex items-center justify-center">
                                <Clock className="w-4 h-4 mr-2" />
                                {timeDisplay}
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        timeSlots.map((slot, index) => (
                          <button
                            key={index}
                            onClick={() => handleTimeSelect(slot.time)}
                            disabled={!slot.available}
                            className={`
                              px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#0075A2]
                              ${selectedTime === slot.time
                                ? 'bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] text-white shadow-md transform scale-105'
                                : slot.highlighted
                                  ? 'bg-[#0075A2] text-white hover:bg-[#005a7a]'
                                  : slot.available
                                    ? 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500'
                                    : 'bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                              }
                            `}
                            aria-label={`${slot.time} ${slot.available ? 'available' : 'unavailable'}`}
                            aria-selected={selectedTime === slot.time}
                          >
                            <div className="flex items-center justify-center">
                              <Clock className="w-4 h-4 mr-2" />
                              {slot.time}
                            </div>
                          </button>
                        )))}
                    </div>
                  </div>

                  {/* Confirm Booking Button */}
                  <button
                    onClick={handleConfirmBooking}
                    disabled={bookingConfirmed}
                    className={`w-full font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:ring-offset-2 ${
                      bookingConfirmed
                        ? 'bg-green-600 text-white cursor-default'
                        : 'bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] hover:from-[#005a7a] hover:to-[#081f3a] text-white'
                    }`}
                    aria-describedby="booking-summary"
                  >
                    {bookingConfirmed ? (
                      <div className="flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Booking Confirmed!
                      </div>
                    ) : (
                      'Confirm Booking'
                    )}
                  </button>

                  {/* Booking Summary for Screen Readers */}
                  <div id="booking-summary" className="sr-only">
                    Booking summary: {selectedDoctor?.full_name} on July {selectedDate}, 2024 at {selectedTime}
                  </div>
                </div>
              </div>

              {/* Right Column - How It Works (1/3 width) */}
              <div className="lg:col-span-1">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 sticky top-24">
                  <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-6 text-center">
                    How Our Smart Booking Works
                  </h3>
                  
                  <div className="space-y-6">
                    {steps.map((step, index) => (
                      <div key={index} className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-full flex items-center justify-center text-white font-bold text-sm">
                            <step.icon className="w-5 h-5" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-bold text-[#0075A2] dark:text-[#0EA5E9] mb-1">STEP {step.number}</div>
                          <h4 className="font-semibold text-[#0A2647] dark:text-gray-100 text-sm mb-2">{step.title}</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Additional Tips */}
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold text-[#0A2647] dark:text-gray-100 text-sm mb-3">💡 Quick Tips</h4>
                    <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
                      <li className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-[#00D4AA] rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                        Book 24/7 with instant confirmation
                      </li>
                      <li className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-[#00D4AA] rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                        Get SMS & WhatsApp reminders
                      </li>
                      <li className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-[#00D4AA] rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                        Reschedule anytime before visit
                      </li>
                    </ul>
                  </div>
                  {/* Booking Summary for Screen Readers */}
                  <div id="booking-summary" className="sr-only">
                    Current booking: {selectedDoctor?.full_name} on July {selectedDate}, 2024 at {selectedTime}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 lg:py-24 bg-[#F6F6F6] dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0A2647] dark:text-gray-100 mb-4">
                Why Choose Smart Booking?
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Experience the advantages of AI-powered appointment scheduling
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 border border-[#E8E8E8] dark:border-gray-600 group text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform mx-auto">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-3">Real-time Availability</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">See live doctor schedules and book instantly without waiting for confirmations.</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 border border-[#E8E8E8] dark:border-gray-600 group text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform mx-auto">
                  <Bell className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-3">Smart Reminders</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">Get SMS and WhatsApp reminders so you never miss an appointment.</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 border border-[#E8E8E8] dark:border-gray-600 group text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform mx-auto">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-3">Digital Integration</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">Seamlessly connects with pre-registration and your health records.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        mode="signup"
        context={authContext}
      />

    </div>
  );
}

export default SmartAppointmentBookingPage;