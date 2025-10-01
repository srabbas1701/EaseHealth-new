import React, { useState, useMemo } from 'react';
import Navigation from '../components/Navigation';
import { AccessibilityAnnouncer } from '../components/AccessibilityAnnouncer';
import { SkipLinks as KeyboardSkipLinks } from '../components/KeyboardNavigation';
import AuthModal from '../components/AuthModal';
import { getDoctors, getAvailableTimeSlots, generateTimeSlots, Doctor, createPreRegistration, getDoctorSchedules, getSpecialties, getDoctorsBySpecialty, Specialty, createAppointment } from '../utils/supabase';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslations } from '../translations';

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
  Bell,
  Stethoscope
} from 'lucide-react';

function SmartAppointmentBookingPage({ user, session, profile, userState, isAuthenticated, handleLogout }: AuthProps) {
  const { language } = useLanguage();
  const { t } = useTranslations(language);
  const [announcement, setAnnouncement] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isSpecialtyDropdownOpen, setIsSpecialtyDropdownOpen] = useState(false);
  const [isDoctorDropdownOpen, setIsDoctorDropdownOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [authError, setAuthError] = useState<string>('');
  const [doctorSchedules, setDoctorSchedules] = useState<any[]>([]);
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [specialtiesLoaded, setSpecialtiesLoaded] = useState(false);
  const [isLoadingSpecialties, setIsLoadingSpecialties] = useState(false);

  // Load doctors and specialties on component mount for better performance
  React.useEffect(() => {
    loadDoctors();
    loadSpecialties(); // Preload specialties for instant dropdown display
  }, []);

  // Filter doctors when specialty changes
  React.useEffect(() => {
    if (selectedSpecialty) {
      // Simple name-based filtering instead of UUID lookup
      const filtered = doctors.filter(doctor => 
        doctor.specialty.toLowerCase() === selectedSpecialty.name.toLowerCase()
      );
      console.log('Filtering doctors for specialty:', selectedSpecialty.name);
      console.log('Available doctors:', doctors);
      console.log('Filtered doctors:', filtered);
      
      setFilteredDoctors(filtered);
      setSelectedDoctor(null); // Reset doctor selection
      setSelectedDate(null);
      setSelectedTime('');
      setAvailableSlots([]);
    } else {
      setFilteredDoctors(doctors);
    }
  }, [selectedSpecialty, doctors]);

  // Load doctor schedules when doctor is selected
  React.useEffect(() => {
    if (selectedDoctor) {
      loadDoctorSchedules();
      setSelectedDate(null);
      setSelectedTime('');
      setAvailableSlots([]);
    }
  }, [selectedDoctor]);

  // Load time slots when date is selected
  React.useEffect(() => {
    if (selectedDoctor && selectedDate) {
      loadTimeSlots();
    }
  }, [selectedDoctor, selectedDate]);

  const loadSpecialties = async () => {
    try {
      setIsLoadingSpecialties(true);
      const specialtiesList = await getSpecialties();
      console.log('Loaded specialties:', specialtiesList);
      setSpecialties(specialtiesList || []);
      setSpecialtiesLoaded(true);
    } catch (error) {
      console.error('Error loading specialties:', error);
      setAnnouncement('Failed to load specialties. Please refresh the page.');
    } finally {
      setIsLoadingSpecialties(false);
    }
  };

  const loadDoctors = async () => {
    try {
      setIsLoadingDoctors(true);
      const doctorsList = await getDoctors();
      console.log('Loaded doctors:', doctorsList);
      
      setDoctors(doctorsList || []);
      setFilteredDoctors(doctorsList || []);
    } catch (error) {
      console.error('Error loading doctors:', error);
      setAnnouncement('Failed to load doctors. Please refresh the page.');
    } finally {
      setIsLoadingDoctors(false);
    }
  };


  const loadDoctorSchedules = async () => {
    if (!selectedDoctor) return;

    try {
      console.log('Loading schedules for doctor:', selectedDoctor.id);
      const schedules = await getDoctorSchedules(selectedDoctor.id);
      console.log('Doctor schedules:', schedules);
      setDoctorSchedules(schedules || []);
      
      // Calculate available dates for the next 30 days
      const dates = new Set<string>();
      const today = new Date();
      
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dayOfWeek = date.getDay();
        
        // Check if doctor is available on this day of week
        // JavaScript getDay(): Sunday=0, Monday=1, Tuesday=2, etc.
        // Database day_of_week should match this convention
        const isAvailable = schedules?.some(schedule => 
          schedule.day_of_week === dayOfWeek && schedule.is_available
        );
        
        // Debug logging to identify the alignment issue
        if (i < 7) { // Log first week for debugging
          console.log(`Date: ${date.toDateString()}, Day of Week: ${dayOfWeek}, Available: ${isAvailable}`);
          if (schedules?.length > 0) {
            console.log('Schedule days:', schedules.map(s => s.day_of_week));
          }
        }
        
        if (isAvailable) {
          dates.add(date.toISOString().split('T')[0]);
        }
      }
      
      console.log('Available dates:', Array.from(dates));
      
      // If no schedules found, make all future dates available for testing
      if (dates.size === 0) {
        console.log('No schedules found, making all future dates available for testing');
        for (let i = 1; i < 30; i++) { // Start from tomorrow
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          dates.add(date.toISOString().split('T')[0]);
        }
      }
      
      setAvailableDates(dates);
    } catch (error) {
      console.error('Error loading doctor schedules:', error);
      setDoctorSchedules([]);
      // Make all future dates available as fallback
      const dates = new Set<string>();
      const today = new Date();
      for (let i = 1; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        dates.add(date.toISOString().split('T')[0]);
      }
      setAvailableDates(dates);
    }
  };

  const loadTimeSlots = async () => {
    if (!selectedDoctor || !selectedDate) return;

    try {
      setIsLoadingSlots(true);
      const selectedDateStr = selectedDate.toISOString().split('T')[0];
      console.log('Loading time slots for:', selectedDoctor.id, selectedDateStr);
      
      // First try to get existing slots
      let slots = await getAvailableTimeSlots(selectedDoctor.id, selectedDateStr);
      console.log('Existing slots:', slots);
      
      // If no slots exist, generate them
      if (!slots || slots.length === 0) {
        console.log('No existing slots, generating new ones...');
        slots = await generateTimeSlots(selectedDoctor.id, selectedDateStr);
        console.log('Generated slots:', slots);
      }
      
      // If still no slots, provide some mock slots for testing
      if (!slots || slots.length === 0) {
        console.log('No slots generated, using mock slots for testing');
        slots = [
          { id: 'mock-1', start_time: '09:00:00', end_time: '09:30:00', status: 'available' },
          { id: 'mock-2', start_time: '09:30:00', end_time: '10:00:00', status: 'available' },
          { id: 'mock-3', start_time: '10:00:00', end_time: '10:30:00', status: 'available' },
          { id: 'mock-4', start_time: '10:30:00', end_time: '11:00:00', status: 'available' },
          { id: 'mock-5', start_time: '11:00:00', end_time: '11:30:00', status: 'available' },
          { id: 'mock-6', start_time: '11:30:00', end_time: '12:00:00', status: 'available' },
        ];
      }
      
      setAvailableSlots(slots || []);
    } catch (error) {
      console.error('Error loading time slots:', error);
      // Provide mock slots as fallback
      const mockSlots = [
        { id: 'mock-1', start_time: '09:00:00', end_time: '09:30:00', status: 'available' },
        { id: 'mock-2', start_time: '09:30:00', end_time: '10:00:00', status: 'available' },
        { id: 'mock-3', start_time: '10:00:00', end_time: '10:30:00', status: 'available' },
        { id: 'mock-4', start_time: '10:30:00', end_time: '11:00:00', status: 'available' },
        { id: 'mock-5', start_time: '11:00:00', end_time: '11:30:00', status: 'available' },
        { id: 'mock-6', start_time: '11:30:00', end_time: '12:00:00', status: 'available' },
      ];
      setAvailableSlots(mockSlots);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  // Generate calendar days for current month
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const today = new Date();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ day: '', disabled: true, isPast: false, isAvailable: false });
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const dateString = currentDate.toISOString().split('T')[0];
      const isPast = currentDate < today.setHours(0, 0, 0, 0);
      
      // Use the current availableDates state
      const isAvailable = availableDates.has(dateString);
      const isSelected = selectedDate && selectedDate.toDateString() === currentDate.toDateString();
      
      // Debug: Log calendar generation for first week
      if (day <= 7) {
        console.log(`Calendar Day ${day}: ${currentDate.toDateString()}, Day of Week: ${currentDate.getDay()}, Available: ${isAvailable}, Disabled: ${isPast || !isAvailable}, In Set: ${availableDates.has(dateString)}`);
      }
      
      days.push({
        day,
        disabled: isPast || !isAvailable,
        isPast,
        isAvailable,
        isSelected,
        date: currentDate
      });
    }
    
    return days;
  };

  // Generate calendar days with proper dependency tracking
  const calendarDays = useMemo(() => {
    // Debug: Log available dates set before calendar generation
    console.log('Available dates set:', Array.from(availableDates).sort());
    
    return generateCalendarDays();
  }, [currentMonth, availableDates, selectedDate]);

  const weekDays = t('appointmentBooking.weekDaysShort') as unknown as string[];
  
  // Debug: Log weekDays to verify alignment
  console.log('Week days array:', weekDays);

  const steps = [
    {
      number: "01",
      title: "Choose Medical Specialty",
      description: "Select the type of medical care you need from our comprehensive list of specialties.",
      icon: Stethoscope
    },
    {
      number: "02",
      title: "Select Your Doctor",
      description: "Choose from our network of verified healthcare professionals in your selected specialty.",
      icon: User
    },
    {
      number: "03", 
      title: "Pick Your Preferred Date & Time",
      description: "View real-time availability and select a slot that works best for your schedule.",
      icon: Calendar
    },
    {
      number: "04",
      title: "Instant Confirmation & Reminders", 
      description: "Get immediate booking confirmation with SMS/WhatsApp reminders before your visit.",
      icon: CheckCircle
    }
  ];

  const handleSpecialtySelect = (specialty: Specialty) => {
    console.log('Specialty selected:', specialty);
    setSelectedSpecialty(specialty);
    setIsSpecialtyDropdownOpen(false);
    setAnnouncement(`Selected specialty: ${specialty.name}`);
  };

  const handleDoctorSelect = (doctor: string) => {
    const doctorObj = filteredDoctors.find(d => `${d.full_name} - ${d.specialty}` === doctor);
    if (doctorObj) {
      setSelectedDoctor(doctorObj);
    }
    setIsDoctorDropdownOpen(false);
    setAnnouncement(`Selected doctor: ${doctor}`);
  };

  const handleDateSelect = (dayObj: any) => {
    if (dayObj.disabled || !dayObj.isAvailable) return;
    
    setSelectedDate(dayObj.date);
    setSelectedTime('');
    setAnnouncement(`Selected date: ${dayObj.date.toLocaleDateString()}`);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setAnnouncement(`Selected time: ${time}`);
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const handleConfirmBooking = () => {
    setShowAuthModal(true);
  };

  const handleAuthSuccess = async () => {
    try {
      setShowAuthModal(false);
      
      if (!selectedDoctor || !selectedDate || !selectedTime || !user) {
        setAnnouncement('Missing booking information. Please try again.');
        return;
      }

      // Convert time to proper format (e.g., "9:30 AM" to "09:30:00")
      const timeParts = selectedTime.split(':');
      const hour = parseInt(timeParts[0]);
      const minute = parseInt(timeParts[1].split(' ')[0]);
      const isPM = selectedTime.includes('PM');
      
      let hour24 = hour;
      if (isPM && hour !== 12) hour24 += 12;
      if (!isPM && hour === 12) hour24 = 0;
      
      const timeString = `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
      const dateString = selectedDate.toISOString().split('T')[0];
      
      console.log('Creating appointment:', {
        doctorId: selectedDoctor.id,
        patientId: user.id,
        date: dateString,
        startTime: timeString,
        durationMinutes: 30 // Default 30 minutes
      });

      // Create the appointment in the database
      const appointment = await createAppointment(
        selectedDoctor.id,
        user.id,
        dateString,
        timeString,
        30, // 30 minutes duration
        `Appointment booked through EaseHealth platform`
      );

      console.log('Appointment created:', appointment);
      
      setBookingConfirmed(true);
      setAnnouncement(`Appointment confirmed with ${selectedDoctor.full_name} on ${selectedDate.toLocaleDateString()} at ${selectedTime}. Your appointment has been saved.`);
      
    } catch (error) {
      console.error('Error creating appointment:', error);
      setAnnouncement('Failed to create appointment. Please try again.');
      setShowAuthModal(true); // Reopen modal to retry
    }
  };

  const authContext = {
    title: 'Complete Your Booking',
    description: `To confirm your appointment with ${selectedDoctor?.full_name} on ${selectedDate?.toLocaleDateString()} at ${selectedTime}, please create an account or sign in to your existing account.`,
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
              {t('appointmentBooking.backToHome')}
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
                {t('appointmentBooking.title')}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed max-w-2xl mx-auto">
                {t('appointmentBooking.subtitle')}
              </p>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {/* Left Column - Booking Interface (2/3 width) */}
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 lg:p-8 border border-gray-200 dark:border-gray-700">
                  <h2 className="text-2xl font-bold text-[#0A2647] dark:text-gray-100 mb-6 text-center">{t('appointmentBooking.bookAppointment')}</h2>

                  {/* Step 1: Select Specialty */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-[#0075A2] dark:text-[#0EA5E9] mb-3 flex items-center">
                      <span className="w-6 h-6 bg-[#0075A2] dark:bg-[#0EA5E9] text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">1</span>
                      Select Medical Specialty
                    </h3>
                    
                    <div className="relative">
                      <button
                        onClick={() => {
                          // Only load specialties if not already loaded
                          if (!specialtiesLoaded && !isLoadingSpecialties) {
                            loadSpecialties();
                          }
                          setIsSpecialtyDropdownOpen(!isSpecialtyDropdownOpen);
                        }}
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 text-left flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2]"
                        aria-expanded={isSpecialtyDropdownOpen}
                        aria-haspopup="listbox"
                      >
                        <span className="text-[#0A2647] dark:text-gray-100">
                          {selectedSpecialty ? selectedSpecialty.name : 'Choose your medical specialty'}
                        </span>
                        <div className="flex items-center">
                          {isLoadingSpecialties && specialties.length === 0 && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0075A2] dark:border-[#0EA5E9] mr-2"></div>
                          )}
                          <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isSpecialtyDropdownOpen ? 'rotate-180' : ''}`} />
                        </div>
                      </button>

                      {isSpecialtyDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                          {isLoadingSpecialties && specialties.length === 0 ? (
                            <div className="px-4 py-8 text-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0075A2] dark:border-[#0EA5E9] mx-auto mb-2"></div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Loading specialties...</p>
                            </div>
                          ) : specialties.length > 0 ? (
                            specialties.map((specialty, index) => (
                              <button
                                key={specialty.id}
                                onClick={() => handleSpecialtySelect(specialty)}
                                className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700"
                                role="option"
                                aria-selected={selectedSpecialty?.id === specialty.id}
                              >
                                <div>
                                  <span className="text-[#0A2647] dark:text-gray-100 font-medium">{specialty.name}</span>
                                  {specialty.description && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{specialty.description}</p>
                                  )}
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                              No specialties found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 2: Select Doctor */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-[#0075A2] dark:text-[#0EA5E9] mb-3 flex items-center">
                      <span className="w-6 h-6 bg-[#0075A2] dark:bg-[#0EA5E9] text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">2</span>
                      {t('appointmentBooking.selectDoctor')}
                    </h3>
                    
                    <div className="relative">
                      <button
                        onClick={() => setIsDoctorDropdownOpen(!isDoctorDropdownOpen)}
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 text-left flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] disabled:opacity-50"
                        aria-expanded={isDoctorDropdownOpen}
                        aria-haspopup="listbox"
                        disabled={isLoadingDoctors || !selectedSpecialty}
                      >
                        <span className="text-[#0A2647] dark:text-gray-100">
                          {isLoadingDoctors ? t('appointmentBooking.loading') :
                           !selectedSpecialty ? 'Please select a specialty first' :
                           selectedDoctor ? `${selectedDoctor.full_name} - ${selectedDoctor.specialty}` :
                           'Choose a doctor'}
                        </span>
                        <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isDoctorDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isDoctorDropdownOpen && selectedSpecialty && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                          {filteredDoctors.length > 0 ? (
                            filteredDoctors.map((doctor, index) => {
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
                            })
                          ) : (
                            <div className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                              No doctors found for {selectedSpecialty}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 3: Select Date */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-[#0075A2] dark:text-[#0EA5E9] mb-3 flex items-center">
                      <span className="w-6 h-6 bg-[#0075A2] dark:bg-[#0EA5E9] text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">3</span>
                      {t('appointmentBooking.selectDate')}
                    </h3>

                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      {/* Calendar Header */}
                      <div className="flex items-center justify-between mb-4">
                        <button 
                          onClick={() => handleMonthChange('prev')}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#0075A2]"
                          aria-label={t('appointmentBooking.prevMonth')}
                        >
                          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>
                        <h4 className="text-lg font-semibold text-[#0A2647] dark:text-gray-100">
                          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h4>
                        <button 
                          onClick={() => handleMonthChange('next')}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#0075A2]"
                          aria-label={t('appointmentBooking.nextMonth')}
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
                            onClick={() => handleDateSelect(dayObj)}
                            disabled={dayObj.disabled}
                            className={`
                              h-10 w-10 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#0075A2]
                              ${!dayObj.day 
                                ? 'text-transparent cursor-default' 
                                : dayObj.isSelected 
                                  ? 'bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] text-white shadow-md transform scale-105' 
                                  : dayObj.disabled
                                    ? dayObj.isPast
                                      ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed bg-gray-100 dark:bg-gray-800'
                                      : 'text-gray-400 dark:text-gray-500 cursor-not-allowed bg-gray-100 dark:bg-gray-800'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 bg-white dark:bg-gray-700'
                              }
                            `}
                            aria-label={dayObj.day ? `${dayObj.date.toLocaleDateString()}` : ''}
                            aria-selected={dayObj.isSelected}
                            title={dayObj.disabled ? (dayObj.isPast ? 'Past date' : 'Not available') : 'Available'}
                          >
                            {dayObj.day || ''}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Step 4: Select Time Slot */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-[#0075A2] dark:text-[#0EA5E9] mb-3 flex items-center">
                      <span className="w-6 h-6 bg-[#0075A2] dark:bg-[#0EA5E9] text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">4</span>
                      {t('appointmentBooking.selectTime')}
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {!selectedDate ? (
                        <div className="col-span-full text-center py-8">
                          <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">Please select a date first</p>
                        </div>
                      ) : isLoadingSlots ? (
                        <div className="col-span-full text-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0075A2] dark:border-[#0EA5E9] mx-auto mb-2"></div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{t('appointmentBooking.loadingSlots')}</p>
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
                        <div className="col-span-full text-center py-8">
                          <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">No available slots for this date</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Please try another date</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Confirm Booking Button */}
                  <button
                    onClick={handleConfirmBooking}
                    disabled={bookingConfirmed || !selectedTime || !selectedDate}
                    className={`w-full font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:ring-offset-2 ${
                      bookingConfirmed
                        ? 'bg-green-600 text-white cursor-default'
                        : !selectedTime || !selectedDate
                          ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed transform-none hover:scale-100 hover:shadow-none'
                          : 'bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] hover:from-[#005a7a] hover:to-[#081f3a] text-white'
                    }`}
                    aria-describedby="booking-summary"
                  >
                    {bookingConfirmed ? (
                      <div className="flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        {t('appointmentBooking.bookingConfirmed')}
                      </div>
                    ) : !selectedTime || !selectedDate ? (
                      'Complete selection to book'
                    ) : (
                      t('appointmentBooking.confirmBooking')
                    )}
                  </button>

                  {/* Booking Summary for Screen Readers */}
                  <div id="booking-summary" className="sr-only">
                    Booking summary: {selectedDoctor?.full_name} on {selectedDate?.toLocaleDateString()} at {selectedTime}
                  </div>
                </div>
              </div>

              {/* Right Column - How It Works (1/3 width) */}
              <div className="lg:col-span-1">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 sticky top-24">
                  <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-6 text-center">{t('appointmentBooking.howTitle')}</h3>
                  
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
                    <h4 className="font-semibold text-[#0A2647] dark:text-gray-100 text-sm mb-3">💡 {t('appointmentBooking.quickTips.title')}</h4>
                    <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
                      <li className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-[#00D4AA] rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                        {t('appointmentBooking.quickTips.tip1')}
                      </li>
                      <li className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-[#00D4AA] rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                        {t('appointmentBooking.quickTips.tip2')}
                      </li>
                      <li className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-[#00D4AA] rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                        {t('appointmentBooking.quickTips.tip3')}
                      </li>
                    </ul>
                  </div>
                  {/* Booking Summary for Screen Readers */}
                  <div id="booking-summary" className="sr-only">
                    Current booking: {selectedDoctor?.full_name} on {selectedDate?.toLocaleDateString()} at {selectedTime}
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
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0A2647] dark:text-gray-100 mb-4">{t('appointmentBooking.whyChooseTitle')}</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">{t('appointmentBooking.whyChooseSubtitle')}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 border border-[#E8E8E8] dark:border-gray-600 group text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform mx-auto">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-3">{t('appointmentBooking.whyChoose.realtimeTitle')}</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{t('appointmentBooking.whyChoose.realtimeDesc')}</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 border border-[#E8E8E8] dark:border-gray-600 group text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform mx-auto">
                  <Bell className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-3">{t('appointmentBooking.whyChoose.remindersTitle')}</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{t('appointmentBooking.whyChoose.remindersDesc')}</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 border border-[#E8E8E8] dark:border-gray-600 group text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform mx-auto">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-3">{t('appointmentBooking.whyChoose.integrationTitle')}</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{t('appointmentBooking.whyChoose.integrationDesc')}</p>
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