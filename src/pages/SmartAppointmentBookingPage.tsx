import React, { useState } from 'react';
import Navigation from '../components/Navigation';
import { AccessibilityAnnouncer } from '../components/AccessibilityAnnouncer';
import { SkipLinks as KeyboardSkipLinks } from '../components/KeyboardNavigation';
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
  Brain,
  Zap,
  ArrowUp
} from 'lucide-react';

function SmartAppointmentBookingPage() {
  const [announcement, setAnnouncement] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('Dr. Anjali Sharma - Cardiologist');
  const [selectedDate, setSelectedDate] = useState(5); // July 5th
  const [selectedTime, setSelectedTime] = useState('9:30 AM');
  const [currentMonth, setCurrentMonth] = useState('July 2024');
  const [isDoctorDropdownOpen, setIsDoctorDropdownOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Handle scroll to top button
  React.useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      const mainContent = document.getElementById('main-content');
      mainContent?.focus();
    }, 500);
  };

  const doctors = [
    'Dr. Anjali Sharma - Cardiologist',
    'Dr. Rajesh Kumar - Neurologist',
    'Dr. Priya Patel - Dermatologist',
    'Dr. Amit Singh - Orthopedic',
    'Dr. Meera Gupta - Pediatrician'
  ];

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
    setSelectedDoctor(doctor);
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
    setAnnouncement(`Booking confirmed for ${selectedDoctor} on July ${selectedDate}, 2024 at ${selectedTime}`);
  };

  return (
    <div className="min-h-screen bg-[#F6F6F6] dark:bg-gray-900 text-[#0A2647] dark:text-gray-100 transition-colors duration-300">
      <KeyboardSkipLinks />
      <AccessibilityAnnouncer message={announcement} />

      <Navigation userState="new" />

      <main id="main-content" tabIndex={-1} aria-label="Smart Appointment Booking">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-white dark:from-gray-800 to-[#F6F6F6] dark:to-gray-900 py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-2xl flex items-center justify-center relative overflow-hidden">
                  <Brain className="w-8 h-8 text-white" />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-[#00D4AA] dark:from-[#06D6A0] to-[#0075A2] dark:to-[#0EA5E9] rounded-full flex items-center justify-center">
                    <Zap className="w-3 h-3 text-white" />
                  </div>
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-transparent via-transparent to-white/10 pointer-events-none"></div>
                </div>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#0A2647] dark:text-gray-100 leading-tight mb-6">
                Smart Appointment{' '}
                <span className="bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] bg-clip-text text-transparent">
                  Booking
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed max-w-3xl mx-auto">
                Experience the future of healthcare scheduling with AI-powered appointment booking. Get instant confirmations, smart reminders, and seamless integration with your healthcare journey.
              </p>
            </div>
          </div>
        </section>

        {/* How Our Smart Booking Works */}
        <section className="py-16 lg:py-24 bg-white dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0A2647] dark:text-gray-100 mb-4">
                How Our Smart Booking Works
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Three simple steps to secure your healthcare appointment with intelligent automation
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {steps.map((step, index) => (
                <div key={index} className="relative">
                  <div className="bg-[#F6F6F6] dark:bg-gray-700 rounded-2xl p-8 text-center hover:bg-white dark:hover:bg-gray-600 hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-[#0075A2] dark:hover:border-[#0EA5E9] focus-ring">
                    <div className="w-16 h-16 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-6">
                      <step.icon className="w-8 h-8" />
                    </div>
                    <div className="text-sm font-bold text-[#0075A2] dark:text-[#0EA5E9] mb-2">STEP {step.number}</div>
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

        {/* Booking Interface */}
        <section className="py-16 lg:py-24 bg-[#F6F6F6] dark:bg-gray-900">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-[#0A2647] dark:text-gray-100 mb-8 text-center">
                Book an Appointment
              </h2>

              {/* Step 1: Select Doctor */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-[#0075A2] dark:text-[#0EA5E9] mb-4">
                  1. Select Doctor
                </h3>
                
                <div className="relative">
                  <button
                    onClick={() => setIsDoctorDropdownOpen(!isDoctorDropdownOpen)}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 text-left flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2]"
                    aria-expanded={isDoctorDropdownOpen}
                    aria-haspopup="listbox"
                  >
                    <span className="text-[#0A2647] dark:text-gray-100">{selectedDoctor}</span>
                    <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isDoctorDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isDoctorDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                      {doctors.map((doctor, index) => (
                        <button
                          key={index}
                          onClick={() => handleDoctorSelect(doctor)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700"
                          role="option"
                          aria-selected={selectedDoctor === doctor}
                        >
                          <div className="flex items-center">
                            <User className="w-4 h-4 text-gray-400 mr-3" />
                            <span className="text-[#0A2647] dark:text-gray-100">{doctor}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Select Date */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-[#0075A2] dark:text-[#0EA5E9] mb-4">
                  2. Select Date
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
                              ? 'bg-[#00D4AA] text-white shadow-md transform scale-105' 
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
              <div className="mb-8">
                <h3 className="text-lg font-medium text-[#0075A2] dark:text-[#0EA5E9] mb-4">
                  3. Select Time Slot for July {selectedDate}, 2024
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {timeSlots.map((slot, index) => (
                    <button
                      key={index}
                      onClick={() => handleTimeSelect(slot.time)}
                      disabled={!slot.available}
                      className={`
                        px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#0075A2]
                        ${selectedTime === slot.time
                          ? 'bg-[#00D4AA] text-white shadow-md transform scale-105'
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
                  ))}
                </div>
              </div>

              {/* Confirm Booking Button */}
              <button
                onClick={handleConfirmBooking}
                className="w-full bg-[#00D4AA] hover:bg-[#00c299] text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA] focus:ring-offset-2"
                aria-describedby="booking-summary"
              >
                Confirm Booking
              </button>

              {/* Booking Summary for Screen Readers */}
              <div id="booking-summary" className="sr-only">
                Booking summary: {selectedDoctor} on July {selectedDate}, 2024 at {selectedTime}
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 lg:py-24 bg-white dark:bg-gray-800">
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
              <div className="bg-[#F6F6F6] dark:bg-gray-700 rounded-2xl p-8 shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 border border-[#E8E8E8] dark:border-gray-600 group text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform mx-auto">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-3">Real-time Availability</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">See live doctor schedules and book instantly without waiting for confirmations.</p>
              </div>
              
              <div className="bg-[#F6F6F6] dark:bg-gray-700 rounded-2xl p-8 shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 border border-[#E8E8E8] dark:border-gray-600 group text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform mx-auto">
                  <Bell className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-3">Smart Reminders</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">Get SMS and WhatsApp reminders so you never miss an appointment.</p>
              </div>
              
              <div className="bg-[#F6F6F6] dark:bg-gray-700 rounded-2xl p-8 shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 border border-[#E8E8E8] dark:border-gray-600 group text-center">
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

export default SmartAppointmentBookingPage;