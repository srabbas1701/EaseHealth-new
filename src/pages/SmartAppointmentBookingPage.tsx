import React, { useState } from 'react';
import Navigation from '../components/Navigation';
import { AccessibilityAnnouncer } from '../components/AccessibilityAnnouncer';
import { SkipLinks as KeyboardSkipLinks } from '../components/KeyboardNavigation';
import { ChevronDown, ChevronLeft, ChevronRight, Calendar, Clock, User } from 'lucide-react';

function SmartAppointmentBookingPage() {
  const [announcement, setAnnouncement] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('Dr. Anjali Sharma - Cardiologist');
  const [selectedDate, setSelectedDate] = useState(5); // July 5th
  const [selectedTime, setSelectedTime] = useState('9:30 AM');
  const [currentMonth, setCurrentMonth] = useState('July 2024');
  const [isDoctorDropdownOpen, setIsDoctorDropdownOpen] = useState(false);

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <KeyboardSkipLinks />
      <AccessibilityAnnouncer message={announcement} />

      <Navigation userState="new" />

      <main id="main-content" tabIndex={-1} aria-label="Smart Appointment Booking">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">
              Book an Appointment
            </h1>

            {/* Step 1: Select Doctor */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center">
                <span className="bg-[#0075A2] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">1</span>
                Select Doctor
              </h2>
              
              <div className="relative">
                <button
                  onClick={() => setIsDoctorDropdownOpen(!isDoctorDropdownOpen)}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 text-left flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2]"
                  aria-expanded={isDoctorDropdownOpen}
                  aria-haspopup="listbox"
                >
                  <span className="text-gray-900 dark:text-gray-100">{selectedDoctor}</span>
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
                          <span className="text-gray-900 dark:text-gray-100">{doctor}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Select Date */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center">
                <span className="bg-[#0075A2] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">2</span>
                Select Date
              </h2>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-4">
                  <button 
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#0075A2]"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{currentMonth}</h3>
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
              <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center">
                <span className="bg-[#0075A2] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">3</span>
                Select Time Slot for July {selectedDate}, 2024
              </h2>

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
      </main>
    </div>
  );
}

export default SmartAppointmentBookingPage;