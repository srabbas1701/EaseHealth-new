import React, { useState, useMemo, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { AccessibilityAnnouncer } from '../components/AccessibilityAnnouncer';
import { SkipLinks as KeyboardSkipLinks } from '../components/KeyboardNavigation';
import AuthModal from '../components/AuthModal';
import QueueTokenModal from '../components/QueueTokenModal';
import { getDoctors, getAvailableTimeSlots, generateTimeSlots, Doctor, createPreRegistration, getDoctorSchedules, getSpecialties, getDoctorsBySpecialty, Specialty, createAppointment, getPatientProfile, createPatientProfile, generateQueueToken, supabase } from '../utils/supabase';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  Stethoscope,
  ArrowLeft,
  Search,
  MapPin,
  Star,
  Shield,
  Zap
} from 'lucide-react';

function SmartAppointmentBookingPage({ user, session, profile, userState, isAuthenticated, handleLogout }: AuthProps) {
  const { language } = useLanguage();
  const { t } = useTranslations(language);
  const navigate = useNavigate();
  const location = useLocation();
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
  const [rescheduleProcessed, setRescheduleProcessed] = useState(false);

  // Queue token modal state
  const [showQueueTokenModal, setShowQueueTokenModal] = useState(false);
  const [queueToken, setQueueToken] = useState<string>('');
  const [appointmentDetails, setAppointmentDetails] = useState<any>(null);

  // Ref to track if we've already processed auth success
  const authSuccessProcessed = React.useRef(false);

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.specialty-dropdown') && !target.closest('.doctor-dropdown')) {
        setIsSpecialtyDropdownOpen(false);
        setIsDoctorDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load doctors and specialties on component mount for better performance
  React.useEffect(() => {
    loadDoctors();
    loadSpecialties(); // Preload specialties for instant dropdown display
  }, []);

  // Define handleAuthSuccess before useEffect that uses it
  const handleAuthSuccess = React.useCallback(async (restoredBookingDetails = null) => {
    console.log('🔍 handleAuthSuccess called with restored details:', !!restoredBookingDetails);
    try {
      setShowAuthModal(false);

      // Use restored booking details if provided, otherwise use current state
      const doctor = restoredBookingDetails?.selectedDoctor || selectedDoctor;
      const date = restoredBookingDetails?.selectedDate || selectedDate;
      const time = restoredBookingDetails?.selectedTime || selectedTime;

      console.log('🔍 Checking booking requirements:', {
        selectedDoctor: !!doctor,
        selectedDate: !!date,
        selectedTime: !!time,
        user: !!user
      });

      if (!doctor || !date || !time || !user) {
        console.log('❌ Missing booking information');
        setAnnouncement('Missing booking information. Please try again.');
        return;
      }

      console.log('✅ All booking requirements met, proceeding...');

      // First, ensure user has a patient profile
      console.log('🔍 Getting patient profile for user:', user.id);
      let patientProfile = await getPatientProfile(user.id);
      console.log('🔍 Patient profile result:', patientProfile);

      if (!patientProfile) {
        console.log('🔍 Creating patient profile for user');
        try {
          patientProfile = await createPatientProfile(user.id, {
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Patient',
            email: user.email || '',
            phone_number: user.user_metadata?.phone || '000-000-0000',
            is_active: true
          });
          console.log('✅ Patient profile created:', patientProfile);
        } catch (error) {
          console.error('❌ Error creating patient profile:', error);
          setAnnouncement(`Failed to create patient profile: ${error.message || 'Unknown error occurred'}. Please try again.`);
          return;
        }
      }

      if (!patientProfile) {
        console.error('❌ Failed to create or get patient profile');
        setAnnouncement('Failed to create patient profile. Please try again.');
        return;
      }

      console.log('✅ Patient profile ready:', patientProfile.id);

      // Convert time to proper format (e.g., "9:30 AM" to "09:30:00")
      const timeParts = time.split(':');
      const hour = parseInt(timeParts[0]);
      const minute = parseInt(timeParts[1].split(' ')[0]);
      const isPM = time.includes('PM');

      let hour24 = hour;
      if (isPM && hour !== 12) hour24 += 12;
      if (!isPM && hour === 12) hour24 = 0;

      const timeString = `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
      // Use IST timezone for date string to match database
      const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      console.log('🔍 Time conversion debug:', {
        inputTime: time,
        convertedTime: timeString,
        availableSlotsCount: availableSlots.length,
        availableSlotTimes: availableSlots.map(s => s.start_time)
      });

      // Find the selected slot to get its duration
      // Use a more robust comparison that handles different time formats
      const selectedSlot = availableSlots.find(slot => {
        const slotTime = slot.start_time;
        // Handle both HH:MM:SS and HH:MM formats
        const normalizedSlotTime = slotTime.length === 5 ? `${slotTime}:00` : slotTime;
        return normalizedSlotTime === timeString;
      });

      if (!selectedSlot) {
        console.error('❌ Slot not found!', {
          lookingFor: timeString,
          availableSlots: availableSlots.map(s => ({
            id: s.id,
            start_time: s.start_time,
            status: s.status
          }))
        });
        setAnnouncement(`Error: Selected time slot not found. Please try selecting a different time slot.`);
        return;
      }

      // Check if the slot is still available
      if (selectedSlot.status !== 'available') {
        console.error('❌ Slot is not available!', {
          slotId: selectedSlot.id,
          status: selectedSlot.status,
          startTime: selectedSlot.start_time
        });
        setAnnouncement(`Error: Selected time slot is no longer available (status: ${selectedSlot.status}). Please select a different time slot.`);
        return;
      }

      const durationMinutes = selectedSlot?.duration_minutes || 30; // Default to 30 if not found

      console.log('Creating appointment:', {
        doctorId: doctor.id,
        patientId: patientProfile.id,
        date: dateString,
        startTime: timeString,
        durationMinutes: durationMinutes,
        selectedSlot: selectedSlot,
        slotFound: !!selectedSlot,
        availableSlots: availableSlots
      });

      // Handle reschedule logic
      if (location.state?.reschedule && location.state?.appointmentData) {
        console.log('🔄 Reschedule detected - cancelling old appointment first');
        const oldAppointmentId = location.state.appointmentData.id;

        try {
          // Import and call cancelAppointment function
          const { cancelAppointment } = await import('../utils/supabase');
          await cancelAppointment(oldAppointmentId);
          console.log('✅ Old appointment cancelled successfully:', oldAppointmentId);
          setAnnouncement('Previous appointment cancelled. Creating new appointment...');
        } catch (error) {
          console.error('❌ Error cancelling old appointment:', error);
          setAnnouncement(`Failed to cancel previous appointment: ${error.message}. Please try again.`);
          return;
        }
      }

      // Create the appointment in the database
      console.log('🔍 Creating appointment for real slot:', {
        doctorId: doctor.id,
        patientId: patientProfile.id,
        date: dateString,
        time: timeString,
        duration: durationMinutes
      });

      const appointment = await createAppointment(
        doctor.id,
        patientProfile.id, // CORRECT: Use patient profile id (patients.id) not user_id (auth.users.id)
        dateString,
        timeString,
        durationMinutes, // Use actual slot duration
        location.state?.reschedule
          ? `Appointment rescheduled through EaseHealth platform`
          : `Appointment booked through EaseHealth platform`
      );

      console.log('Appointment created:', appointment);

      // Only set booking confirmed if appointment was actually created
      if (appointment && appointment.id) {
        setBookingConfirmed(true);

        const isReschedule = location.state?.reschedule;
        const actionText = isReschedule ? 'rescheduled' : 'confirmed';
        setAnnouncement(`Appointment ${actionText} with ${doctor.full_name} on ${date.toLocaleDateString()} at ${time}. Your appointment has been saved.`);

        // Set queue token and appointment details for modal
        setQueueToken(appointment.queue_token || 'QT-2024-0001');
        setAppointmentDetails({
          doctorName: doctor.full_name,
          date: date.toLocaleDateString(),
          time: time,
          specialty: selectedSpecialty?.name,
          action: isReschedule ? 'rescheduled' : 'booked'
        });

        // Show queue token modal
        setShowQueueTokenModal(true);
      } else {
        throw new Error('Appointment creation failed - no appointment ID returned');
      }

    } catch (error) {
      console.error('❌ Error in handleAuthSuccess:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      setAnnouncement(`Failed to create appointment: ${error.message || 'Unknown error occurred'}. Please try again.`);
      // Don't reopen modal - user is already authenticated, just show error
    }
  }, [user, selectedDoctor, selectedDate, selectedTime, selectedSpecialty, availableSlots, setAnnouncement, setBookingConfirmed, setQueueToken, setAppointmentDetails, setShowQueueTokenModal, location.state]);

  // Handle reschedule from patient dashboard
  useEffect(() => {
    if (location.state?.reschedule && location.state?.appointmentData && doctors.length > 0 && specialties.length > 0 && !rescheduleProcessed) {
      console.log('🔄 Reschedule mode detected:', location.state.appointmentData);
      setRescheduleProcessed(true); // Prevent multiple runs

      const appointmentData = location.state.appointmentData;

      // First, set the specialty (this will trigger doctor filtering)
      if (appointmentData.specialty) {
        const specialty = specialties.find(s => s.name === appointmentData.specialty);
        if (specialty) {
          setSelectedSpecialty(specialty);
          console.log('✅ Set specialty for reschedule:', specialty);
        }
      }

      // Set the date
      if (location.state.selectedDate) {
        const rescheduleDate = new Date(location.state.selectedDate);
        setSelectedDate(rescheduleDate);
        setCurrentMonth(rescheduleDate); // Set calendar to show the reschedule month
        console.log('✅ Set date for reschedule:', location.state.selectedDate);
        console.log('✅ Set current month to:', rescheduleDate.toLocaleDateString());
      }

      // Set the time (convert from AM/PM back to 24-hour format if needed)
      if (appointmentData.time) {
        let timeToSet = appointmentData.time;

        // Convert from AM/PM to 24-hour format if needed
        if (appointmentData.time.includes('AM') || appointmentData.time.includes('PM')) {
          const timeStr = appointmentData.time.replace(' AM', '').replace(' PM', '');
          const [hours, minutes] = timeStr.split(':');
          let hour24 = parseInt(hours);

          if (appointmentData.time.includes('PM') && hour24 !== 12) {
            hour24 += 12;
          } else if (appointmentData.time.includes('AM') && hour24 === 12) {
            hour24 = 0;
          }

          timeToSet = `${hour24.toString().padStart(2, '0')}:${minutes}`;
          console.log('✅ Converted time from', appointmentData.time, 'to', timeToSet);
        }

        setSelectedTime(timeToSet);
        console.log('✅ Set time for reschedule:', timeToSet);
      }

      setAnnouncement(`Rescheduling appointment with ${appointmentData.doctor}`);
    }
  }, [location.state, doctors, specialties, rescheduleProcessed]);

  // Handle setting the doctor after specialty filtering is complete (for reschedule)
  useEffect(() => {
    if (location.state?.reschedule && location.state?.appointmentData && filteredDoctors.length > 0 && rescheduleProcessed) {
      const appointmentData = location.state.appointmentData;

      // Find the doctor in the filtered doctors list by name
      if (appointmentData.doctor) {
        const doctor = filteredDoctors.find(d => d.full_name === appointmentData.doctor);
        if (doctor) {
          setSelectedDoctor(doctor);
          console.log('✅ Found doctor for reschedule after filtering:', doctor);
        }
      }
    }
  }, [filteredDoctors, location.state, rescheduleProcessed]);

  // Handle auth success from login page
  useEffect(() => {
    console.log('🔍 Auth success useEffect triggered:', {
      'location.state': location.state,
      'authSuccess': location.state?.authSuccess,
      'isAuthenticated': isAuthenticated,
      'user': !!user,
      'alreadyProcessed': authSuccessProcessed.current,
      'hasBookingDetails': !!location.state?.bookingDetails
    });

    if (location.state?.authSuccess && isAuthenticated && user && !authSuccessProcessed.current) {
      console.log('✅ Auth success detected, proceeding with booking');

      // Restore booking details from location state
      const bookingDetails = location.state?.bookingDetails;
      if (bookingDetails) {
        console.log('📋 Restoring booking details from location state:', bookingDetails);

        // Restore the booking state
        if (bookingDetails.selectedDoctor) {
          setSelectedDoctor(bookingDetails.selectedDoctor);
          console.log('✅ Restored selectedDoctor:', bookingDetails.selectedDoctor.full_name);
        }
        if (bookingDetails.selectedDate) {
          setSelectedDate(bookingDetails.selectedDate);
          console.log('✅ Restored selectedDate:', bookingDetails.selectedDate);
        }
        if (bookingDetails.selectedTime) {
          setSelectedTime(bookingDetails.selectedTime);
          console.log('✅ Restored selectedTime:', bookingDetails.selectedTime);
        }
        if (bookingDetails.selectedSpecialty) {
          setSelectedSpecialty(bookingDetails.selectedSpecialty);
          console.log('✅ Restored selectedSpecialty:', bookingDetails.selectedSpecialty.name);
        }

        // Call handleAuthSuccess with the restored booking details
        console.log('🔄 Calling handleAuthSuccess with restored booking details');
        authSuccessProcessed.current = true;
        handleAuthSuccess(bookingDetails);
      } else {
        console.log('❌ No booking details found in location state');
        authSuccessProcessed.current = true;
      }
    } else {
      console.log('❌ Auth success conditions not met');
    }
  }, [location.state, isAuthenticated, user, handleAuthSuccess]);

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

      // Only reset doctor selection if not in reschedule mode
      if (!location.state?.reschedule) {
        setSelectedDoctor(null); // Reset doctor selection
        setSelectedDate(null);
        setSelectedTime('');
        setAvailableSlots([]);
      }
    } else {
      setFilteredDoctors(doctors);
    }
  }, [selectedSpecialty, doctors, location.state]);

  // Load doctor schedules when doctor is selected
  React.useEffect(() => {
    if (selectedDoctor) {
      loadDoctorSchedules();

      // Only reset date and time if not in reschedule mode
      if (!location.state?.reschedule) {
        setSelectedDate(null);
        setSelectedTime('');
        setAvailableSlots([]);
      }
    }
  }, [selectedDoctor, location.state]);

  // Load time slots when date is selected
  React.useEffect(() => {
    if (selectedDoctor && selectedDate) {
      loadTimeSlots();
    }
  }, [selectedDoctor, selectedDate]);

  const loadSpecialties = async (forceRefresh = false) => {
    try {
      console.log('🔄 Starting to load specialties...', forceRefresh ? '(forced refresh)' : '');
      setIsLoadingSpecialties(true);
      const specialtiesList = await getSpecialties(forceRefresh);
      console.log('✅ Loaded specialties:', specialtiesList);
      setSpecialties(specialtiesList || []);
      setSpecialtiesLoaded(true);
      console.log('✅ Specialties state updated, count:', specialtiesList?.length || 0);
    } catch (error) {
      console.error('❌ Error loading specialties:', error);
      setAnnouncement('Failed to load specialties. Please refresh the page.');
    } finally {
      setIsLoadingSpecialties(false);
      console.log('✅ Finished loading specialties');
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
      console.log('Loading available dates for doctor:', selectedDoctor.id);

      // Get available dates for the next 30 days in IST timezone
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 30);

      // Convert to IST timezone for date strings
      const todayIST = new Date(today.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
      const endDateIST = new Date(endDate.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));

      const startDateStr = `${todayIST.getFullYear()}-${String(todayIST.getMonth() + 1).padStart(2, '0')}-${String(todayIST.getDate()).padStart(2, '0')}`;
      const endDateStr = `${endDateIST.getFullYear()}-${String(endDateIST.getMonth() + 1).padStart(2, '0')}-${String(endDateIST.getDate()).padStart(2, '0')}`;

      const availableSchedules = await getDoctorSchedules(selectedDoctor.id, startDateStr, endDateStr);
      console.log('Available schedules from time_slots:', availableSchedules);
      setDoctorSchedules(availableSchedules || []);

      // Create set of available dates from time_slots table
      const dates = new Set<string>();

      if (availableSchedules && availableSchedules.length > 0) {
        availableSchedules.forEach(schedule => {
          if (schedule.schedule_date && schedule.is_available && schedule.status === 'available') {
            const scheduleDate = new Date(schedule.schedule_date);
            const todayDateIST = new Date(today.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
            todayDateIST.setHours(0, 0, 0, 0);

            // Only add future dates (including today) in IST
            if (scheduleDate >= todayDateIST) {
              dates.add(schedule.schedule_date);
              console.log(`✅ Added available date: ${schedule.schedule_date}`);
            }
          }
        });
      }

      console.log('📅 Final available dates for calendar:', Array.from(dates).sort());

      // If no schedules found, make all future dates available for testing
      if (dates.size === 0) {
        console.log('⚠️ No schedules found in time_slots, making all future dates available for testing');
        for (let i = 1; i < 30; i++) { // Start from tomorrow
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          // Use IST timezone for date string
          const dateIST = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
          const dateStr = `${dateIST.getFullYear()}-${String(dateIST.getMonth() + 1).padStart(2, '0')}-${String(dateIST.getDate()).padStart(2, '0')}`;
          dates.add(dateStr);
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
        // Use IST timezone for date string
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        dates.add(dateStr);
      }
      setAvailableDates(dates);
    }
  };

  // Smart time filtering function based on database slot status
  const applySmartTimeFiltering = (slots: any[], selectedDateStr: string) => {
    const today = new Date();
    const todayIST = new Date(today.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const todayStr = `${todayIST.getFullYear()}-${String(todayIST.getMonth() + 1).padStart(2, '0')}-${String(todayIST.getDate()).padStart(2, '0')}`;

    // Only apply smart filtering if the selected date is today
    if (selectedDateStr !== todayStr) {
      console.log('Selected date is not today, no smart filtering applied');
      return slots;
    }

    console.log('Applying smart time filtering for today:', todayStr);

    // Get current time in IST
    const currentTimeIST = new Date(today.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const currentHour = currentTimeIST.getHours();
    const currentMinute = currentTimeIST.getMinutes();
    const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}:00`;

    console.log('Current time in IST:', currentTimeStr);

    return slots.map(slot => {
      const slotStartTime = slot.start_time;
      const slotEndTime = slot.end_time;
      const dbStatus = slot.status; // This comes from database: 'available', 'booked', 'blocked'

      // Parse slot start time
      const [slotHour, slotMinute] = slotStartTime.split(':').map(Number);
      const slotTimeInMinutes = slotHour * 60 + slotMinute;
      const currentTimeInMinutes = currentHour * 60 + currentMinute;

      // Calculate slot duration in minutes
      const [endHour, endMinute] = slotEndTime.split(':').map(Number);
      const slotDurationMinutes = (endHour * 60 + endMinute) - slotTimeInMinutes;

      // Determine final availability based on database status and time
      let finalStatus = dbStatus;
      let isAvailable = false;
      let reason = '';

      // First check database status
      if (dbStatus === 'booked') {
        isAvailable = false;
        reason = 'booked';
        finalStatus = 'booked';
      } else if (dbStatus === 'blocked') {
        isAvailable = false;
        reason = 'blocked';
        finalStatus = 'blocked';
      } else if (dbStatus === 'available') {
        // Only apply time-based filtering for available slots
        if (slotTimeInMinutes < currentTimeInMinutes) {
          // Past slot - not available
          isAvailable = false;
          reason = 'past';
          finalStatus = 'unavailable';
        } else if (slotTimeInMinutes === currentTimeInMinutes) {
          // Current slot - not available
          isAvailable = false;
          reason = 'current';
          finalStatus = 'unavailable';
        } else {
          // Future slot - check if it's within the next 2 slots buffer
          const timeDifferenceMinutes = slotTimeInMinutes - currentTimeInMinutes;
          const bufferSlots = 2;
          const bufferMinutes = bufferSlots * slotDurationMinutes;

          if (timeDifferenceMinutes <= bufferMinutes) {
            isAvailable = false;
            reason = 'buffer';
            finalStatus = 'unavailable';
          } else {
            isAvailable = true;
            reason = 'available';
            finalStatus = 'available';
          }
        }
      }

      console.log(`Slot ${slotStartTime}-${slotEndTime}: Status=${dbStatus}, Final=${finalStatus}, Available=${isAvailable} (${reason})`);

      return {
        ...slot,
        status: finalStatus,
        isAvailable,
        reason,
        originalStatus: dbStatus
      };
    });
  };

  const loadTimeSlots = async () => {
    if (!selectedDoctor || !selectedDate) return;

    try {
      setIsLoadingSlots(true);

      // Use IST timezone for date string
      const selectedDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
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

      // If still no slots, show error message
      if (!slots || slots.length === 0) {
        console.error('❌ No slots available for selected date');
        setAnnouncement('No time slots available for the selected date. Please try another date.');
        setAvailableSlots([]);
        return;
      }

      // Apply smart time filtering for today's date
      const filteredSlots = applySmartTimeFiltering(slots, selectedDateStr);
      console.log('Filtered slots after smart time filtering:', filteredSlots);

      setAvailableSlots(filteredSlots || []);
    } catch (error) {
      console.error('Error loading time slots:', error);
      setAnnouncement('Failed to load time slots. Please try again.');
      setAvailableSlots([]);
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
      // Use IST timezone for date string to match database
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      // Compare with today in IST timezone
      const todayIST = new Date(today.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
      todayIST.setHours(0, 0, 0, 0);
      const isPast = currentDate < todayIST;

      // Use the current availableDates state
      const isAvailable = availableDates.has(dateString);
      const isSelected = selectedDate && selectedDate.toDateString() === currentDate.toDateString();

      // Debug: Log calendar generation for first week
      if (day <= 7) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        console.log(`📅 Calendar Day ${day}: ${currentDate.toDateString()} (${dayNames[currentDate.getDay()]}), Date String: ${dateString}, Available: ${isAvailable}, Disabled: ${isPast || !isAvailable}, In Set: ${availableDates.has(dateString)}`);
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
      title: t('appointmentBooking.steps.step1.title'),
      description: t('appointmentBooking.steps.step1.description'),
      icon: Stethoscope
    },
    {
      number: "02",
      title: t('appointmentBooking.steps.step2.title'),
      description: t('appointmentBooking.steps.step2.description'),
      icon: User
    },
    {
      number: "03",
      title: t('appointmentBooking.steps.step3.title'),
      description: t('appointmentBooking.steps.step3.description'),
      icon: Calendar
    },
    {
      number: "04",
      title: t('appointmentBooking.steps.step4.title'),
      description: t('appointmentBooking.steps.step4.description'),
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

  const handleConfirmBooking = async () => {
    console.log('🔍 handleConfirmBooking called:', {
      isAuthenticated,
      user: !!user,
      selectedDoctor: !!selectedDoctor,
      selectedDate: !!selectedDate,
      selectedTime: !!selectedTime
    });

    if (isAuthenticated && user) {
      // User is already logged in, proceed with booking
      console.log('✅ User authenticated, calling handleAuthSuccess');
      await handleAuthSuccess();
    } else {
      // User needs to authenticate first - redirect to login page with booking details
      console.log('❌ User not authenticated, redirecting to login page');
      const bookingDetails = {
        selectedDoctor,
        selectedDate,
        selectedTime,
        selectedSpecialty
      };
      navigate('/login-page', {
        state: {
          bookingDetails,
          redirectTo: '/smart-appointment-booking'
        }
      });
    }
  };

  const authContext = {
    title: 'Complete Your Appointment Booking',
    description: `You're almost done! To confirm your appointment with ${selectedDoctor?.full_name} on ${selectedDate?.toLocaleDateString()} at ${selectedTime}, please sign in to your account or create a new one.`,
    actionText: 'Sign In & Book Appointment',
    showSignupOption: true,
    bookingSummary: {
      doctor: selectedDoctor?.full_name,
      specialty: selectedSpecialty?.name,
      date: selectedDate?.toLocaleDateString(),
      time: selectedTime
    }
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
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-white dark:from-gray-800 to-[#F6F6F6] dark:to-gray-900 py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Back Button */}
            <Link
              to="/"
              className="inline-flex items-center text-[#0075A2] dark:text-[#0EA5E9] hover:text-[#0A2647] dark:hover:text-gray-100 transition-colors mb-8 focus-ring"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              {t('appointmentBooking.backToHome')}
            </Link>

            {/* Page Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#0A2647] dark:text-gray-100 leading-tight mb-6">
                {t('appointmentBooking.pageTitle')}
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed max-w-3xl mx-auto">
                {t('appointmentBooking.pageSubtitle')}
              </p>

              {/* Quick Stats */}
              <div className="flex flex-wrap justify-center gap-8 mb-12">
                <div className="flex items-center text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-full flex items-center justify-center mr-3">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#0A2647] dark:text-gray-100">{t('appointmentBooking.quickStats.bookingTime.value')}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{t('appointmentBooking.quickStats.bookingTime.label')}</p>
                  </div>
                </div>
                <div className="flex items-center text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-full flex items-center justify-center mr-3">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#0A2647] dark:text-gray-100">{t('appointmentBooking.quickStats.security.value')}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{t('appointmentBooking.quickStats.security.label')}</p>
                  </div>
                </div>
                <div className="flex items-center text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-full flex items-center justify-center mr-3">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#0A2647] dark:text-gray-100">{t('appointmentBooking.quickStats.rating.value')}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{t('appointmentBooking.quickStats.rating.label')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Booking Interface */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
              {/* Left Column - Booking Steps (3/4 width) */}
              <div className="lg:col-span-3">
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 lg:p-10 border border-gray-200 dark:border-gray-700">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-[#0A2647] dark:text-gray-100 mb-4">{t('appointmentBooking.bookAppointment.title')}</h2>
                    <p className="text-gray-600 dark:text-gray-300">{t('appointmentBooking.bookAppointment.subtitle')}</p>
                  </div>

                  {/* Progress Indicator */}
                  <div className="mb-10">
                    <div className="flex items-center justify-center">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${selectedSpecialty
                          ? 'bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] text-white shadow-lg scale-110'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                          }`}>
                          {selectedSpecialty ? <CheckCircle className="w-6 h-6" /> : '1'}
                        </div>
                        <div className={`w-20 h-1 rounded-full transition-all duration-300 ${selectedSpecialty ? 'bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7]' : 'bg-gray-200 dark:bg-gray-600'
                          }`}></div>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${selectedDoctor
                          ? 'bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] text-white shadow-lg scale-110'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                          }`}>
                          {selectedDoctor ? <CheckCircle className="w-6 h-6" /> : '2'}
                        </div>
                        <div className={`w-20 h-1 rounded-full transition-all duration-300 ${selectedDoctor ? 'bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7]' : 'bg-gray-200 dark:bg-gray-600'
                          }`}></div>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${selectedDate
                          ? 'bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] text-white shadow-lg scale-110'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                          }`}>
                          {selectedDate ? <CheckCircle className="w-6 h-6" /> : '3'}
                        </div>
                        <div className={`w-20 h-1 rounded-full transition-all duration-300 ${selectedDate ? 'bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7]' : 'bg-gray-200 dark:bg-gray-600'
                          }`}></div>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${selectedTime
                          ? 'bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] text-white shadow-lg scale-110'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                          }`}>
                          {selectedTime ? <CheckCircle className="w-6 h-6" /> : '4'}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {!selectedSpecialty ? 'Start by selecting your medical specialty' :
                          !selectedDoctor ? 'Choose your preferred doctor' :
                            !selectedDate ? 'Pick your appointment date' :
                              !selectedTime ? 'Select your preferred time slot' :
                                'Ready to confirm your appointment!'}
                      </p>
                    </div>
                  </div>

                  {/* Step 1: Select Specialty */}
                  <div className="mb-8">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-full flex items-center justify-center mr-4">
                        <Stethoscope className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100">{t('appointmentBooking.bookAppointment.selectSpecialty.title')}</h3>
                        <p className="text-gray-600 dark:text-gray-300">{t('appointmentBooking.bookAppointment.selectSpecialty.subtitle')}</p>
                      </div>
                    </div>

                    <div className="relative specialty-dropdown">
                      <button
                        onClick={() => {
                          if (!specialtiesLoaded && !isLoadingSpecialties) {
                            loadSpecialties();
                          }
                          setIsSpecialtyDropdownOpen(!isSpecialtyDropdownOpen);
                        }}
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-4 text-left flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0075A2] dark:focus:ring-[#0EA5E9] focus:border-transparent"
                        aria-expanded={isSpecialtyDropdownOpen}
                        aria-haspopup="listbox"
                      >
                        <div className="flex items-center">
                          <Search className="w-5 h-5 text-gray-400 mr-3" />
                          <span className="text-[#0A2647] dark:text-gray-100">
                            {selectedSpecialty ? selectedSpecialty.name : t('appointmentBooking.bookAppointment.searchPlaceholders.specialties')}
                          </span>
                        </div>
                        <div className="flex items-center">
                          {isLoadingSpecialties && specialties.length === 0 && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0075A2] dark:border-[#0EA5E9] mr-2"></div>
                          )}
                          <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isSpecialtyDropdownOpen ? 'rotate-180' : ''}`} />
                        </div>
                      </button>

                      {isSpecialtyDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl z-20 max-h-80 overflow-y-auto">
                          {/* Dropdown Header */}
                          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Select a specialty</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                loadSpecialties(true);
                              }}
                              className="text-xs text-[#0075A2] dark:text-[#0EA5E9] hover:underline"
                            >
                              Refresh
                            </button>
                          </div>

                          {isLoadingSpecialties && specialties.length === 0 ? (
                            <div className="px-6 py-8 text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0075A2] dark:border-[#0EA5E9] mx-auto mb-3"></div>
                              <p className="text-gray-500 dark:text-gray-400">{t('appointmentBooking.bookAppointment.loading.specialties')}</p>
                            </div>
                          ) : specialties.length > 0 ? (
                            <div className="p-2">
                              {console.log('Rendering specialties:', specialties.length, specialties)}
                              {specialties.map((specialty, index) => (
                                <button
                                  key={specialty.id}
                                  onClick={() => handleSpecialtySelect(specialty)}
                                  className="w-full px-4 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-lg focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700"
                                  role="option"
                                  aria-selected={selectedSpecialty?.id === specialty.id}
                                >
                                  <div className="flex items-start">
                                    <div className="w-10 h-10 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                                      <Stethoscope className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                      <span className="text-[#0A2647] dark:text-gray-100 font-semibold block">{specialty.name}</span>
                                      {specialty.description && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{specialty.description}</p>
                                      )}
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                              No specialties found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 2: Select Doctor */}
                  <div className="mb-8">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-full flex items-center justify-center mr-4">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100">{t('appointmentBooking.bookAppointment.selectDoctor.title')}</h3>
                        <p className="text-gray-600 dark:text-gray-300">{t('appointmentBooking.bookAppointment.selectDoctor.subtitle')}</p>
                      </div>
                    </div>

                    {!selectedSpecialty ? (
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 text-center">
                        <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">{t('appointmentBooking.bookAppointment.selectFirst.specialty')}</p>
                      </div>
                    ) : (
                      <div className="relative doctor-dropdown">
                        <button
                          onClick={() => setIsDoctorDropdownOpen(!isDoctorDropdownOpen)}
                          className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-4 text-left flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0075A2] dark:focus:ring-[#0EA5E9] focus:border-transparent"
                          aria-expanded={isDoctorDropdownOpen}
                          aria-haspopup="listbox"
                        >
                          <div className="flex items-center">
                            <Search className="w-5 h-5 text-gray-400 mr-3" />
                            <span className="text-[#0A2647] dark:text-gray-100">
                              {selectedDoctor ? `${selectedDoctor.full_name} - ${selectedDoctor.specialty}` : t('appointmentBooking.bookAppointment.searchPlaceholders.doctors')}
                            </span>
                          </div>
                          <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isDoctorDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isDoctorDropdownOpen && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl z-10 max-h-80 overflow-y-auto">
                            {isLoadingDoctors ? (
                              <div className="px-6 py-8 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0075A2] dark:border-[#0EA5E9] mx-auto mb-3"></div>
                                <p className="text-gray-500 dark:text-gray-400">{t('appointmentBooking.bookAppointment.loading.doctors')}</p>
                              </div>
                            ) : filteredDoctors.length > 0 ? (
                              <div className="p-2">
                                {filteredDoctors.map((doctor, index) => {
                                  const doctorDisplay = `${doctor.full_name} - ${doctor.specialty}`;
                                  return (
                                    <button
                                      key={index}
                                      onClick={() => handleDoctorSelect(doctorDisplay)}
                                      className="w-full px-4 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-lg focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700"
                                      role="option"
                                      aria-selected={selectedDoctor?.id === doctor.id}
                                    >
                                      <div className="flex items-start">
                                        <div className="w-12 h-12 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                                          <span className="text-white font-bold text-lg">
                                            {doctor.full_name.split(' ').map(n => n[0]).join('')}
                                          </span>
                                        </div>
                                        <div className="flex-1">
                                          <div className="flex items-center justify-between mb-1">
                                            <span className="text-[#0A2647] dark:text-gray-100 font-semibold">{doctor.full_name}</span>
                                            {doctor.consultation_fee && (
                                              <span className="text-[#0075A2] dark:text-[#0EA5E9] font-semibold">₹{doctor.consultation_fee}</span>
                                            )}
                                          </div>
                                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{doctor.specialty}</p>
                                          <div className="flex items-center">
                                            <Star className="w-4 h-4 text-yellow-500 mr-1" />
                                            <span className="text-sm text-gray-600 dark:text-gray-300">4.8</span>
                                            <MapPin className="w-4 h-4 text-gray-400 ml-3 mr-1" />
                                            <span className="text-sm text-gray-500 dark:text-gray-400">Available Online</span>
                                          </div>
                                        </div>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                No doctors found for {selectedSpecialty.name}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Step 3: Select Date */}
                  <div className="mb-8">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-full flex items-center justify-center mr-4">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100">{t('appointmentBooking.bookAppointment.selectDate.title')}</h3>
                        <p className="text-gray-600 dark:text-gray-300">{t('appointmentBooking.bookAppointment.selectDate.subtitle')}</p>
                      </div>
                    </div>

                    {!selectedDoctor ? (
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 text-center">
                        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">{t('appointmentBooking.bookAppointment.selectFirst.doctor')}</p>
                      </div>
                    ) : (
                      <div className="bg-gradient-to-br from-gray-50 dark:from-gray-700 to-gray-100 dark:to-gray-600 rounded-2xl p-6">
                        {/* Calendar Header */}
                        <div className="flex items-center justify-between mb-6">
                          <button
                            onClick={() => handleMonthChange('prev')}
                            className="p-3 hover:bg-white dark:hover:bg-gray-600 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-[#0075A2] shadow-sm"
                            aria-label="Previous month"
                          >
                            <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                          </button>
                          <h4 className="text-xl font-bold text-[#0A2647] dark:text-gray-100">
                            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          </h4>
                          <button
                            onClick={() => handleMonthChange('next')}
                            className="p-3 hover:bg-white dark:hover:bg-gray-600 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-[#0075A2] shadow-sm"
                            aria-label="Next month"
                          >
                            <ChevronRight className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                          </button>
                        </div>

                        {/* Week Days Header */}
                        <div className="grid grid-cols-7 gap-2 mb-4">
                          {weekDays.map((day, index) => (
                            <div key={index} className="text-center text-sm font-semibold text-gray-600 dark:text-gray-300 py-3">
                              {day}
                            </div>
                          ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-2">
                          {calendarDays.map((dayObj, index) => (
                            <button
                              key={index}
                              onClick={() => handleDateSelect(dayObj)}
                              disabled={dayObj.disabled}
                              className={`
                                h-14 w-full rounded-xl text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#0075A2] flex items-center justify-center
                                ${!dayObj.day
                                  ? 'text-transparent cursor-default'
                                  : dayObj.isSelected
                                    ? 'bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] text-white shadow-lg transform scale-105'
                                    : dayObj.disabled
                                      ? dayObj.isPast
                                        ? 'text-gray-300 dark:text-gray-500 cursor-not-allowed bg-gray-100 dark:bg-gray-600'
                                        : 'text-gray-400 dark:text-gray-500 cursor-not-allowed bg-gray-100 dark:bg-gray-600'
                                      : 'text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600 bg-white dark:bg-gray-700 shadow-sm hover:shadow-md'
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
                    )}
                  </div>

                  {/* Step 4: Select Time Slot */}
                  <div className="mb-8">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-full flex items-center justify-center mr-4">
                        <Clock className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100">{t('appointmentBooking.bookAppointment.selectTime.title')}</h3>
                        <p className="text-gray-600 dark:text-gray-300">{t('appointmentBooking.bookAppointment.selectTime.subtitle')}</p>
                      </div>
                    </div>

                    {!selectedDate ? (
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 text-center">
                        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">{t('appointmentBooking.bookAppointment.selectFirst.date')}</p>
                      </div>
                    ) : isLoadingSlots ? (
                      <div className="bg-gradient-to-br from-gray-50 dark:from-gray-700 to-gray-100 dark:to-gray-600 rounded-2xl p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0075A2] dark:border-[#0EA5E9] mx-auto mb-4"></div>
                        <p className="text-lg text-gray-600 dark:text-gray-300">{t('appointmentBooking.bookAppointment.loading.slots')}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{t('appointmentBooking.bookAppointment.loading.checkingAvailability')}</p>
                      </div>
                    ) : availableSlots.length > 0 ? (
                      <div className="bg-gradient-to-br from-gray-50 dark:from-gray-700 to-gray-100 dark:to-gray-600 rounded-2xl p-6">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                          {availableSlots.map((slot, index) => {
                            const timeDisplay = new Date(`2000-01-01T${slot.start_time}`).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            });

                            // Determine slot state and styling based on database status
                            const isAvailable = slot.status === 'available';
                            const isBooked = slot.status === 'booked';
                            const isBlocked = slot.status === 'blocked';
                            const isUnavailable = !isAvailable;

                            // Get reason for tooltip
                            const getTooltipText = () => {
                              if (isBooked) return 'Already booked';
                              if (isBlocked) return 'Blocked by doctor';
                              if (slot.reason === 'past') return 'Past time slot';
                              if (slot.reason === 'current') return 'Current time slot';
                              if (slot.reason === 'buffer') return 'Too soon to book';
                              return 'Available';
                            };

                            return (
                              <button
                                key={index}
                                onClick={() => isAvailable ? handleTimeSelect(timeDisplay) : null}
                                disabled={!isAvailable}
                                className={`
                                  px-6 py-4 rounded-xl text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#0075A2] flex items-center justify-center relative
                                  ${selectedTime === timeDisplay
                                    ? 'bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] text-white shadow-lg transform scale-105'
                                    : isAvailable
                                      ? 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-600 cursor-pointer'
                                      : isBooked
                                        ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 cursor-not-allowed opacity-75'
                                        : isBlocked
                                          ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800 cursor-not-allowed opacity-75'
                                          : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-60'
                                  }
                                `}
                                aria-label={`${timeDisplay} ${isAvailable ? 'available' : isBooked ? 'booked' : isBlocked ? 'blocked' : 'unavailable'}`}
                                aria-selected={selectedTime === timeDisplay}
                                title={getTooltipText()}
                              >
                                <Clock className={`w-4 h-4 mr-2 ${selectedTime === timeDisplay
                                  ? 'text-white'
                                  : isAvailable
                                    ? 'text-gray-500 dark:text-gray-400'
                                    : isBooked
                                      ? 'text-red-500 dark:text-red-400'
                                      : isBlocked
                                        ? 'text-yellow-500 dark:text-yellow-400'
                                        : 'text-gray-300 dark:text-gray-600'
                                  }`} />
                                {timeDisplay}
                                {isUnavailable && (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className={`w-full h-0.5 ${isBooked
                                      ? 'bg-red-400 dark:bg-red-600'
                                      : isBlocked
                                        ? 'bg-yellow-400 dark:bg-yellow-600'
                                        : 'bg-gray-400 dark:bg-gray-600'
                                      }`}></div>
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gradient-to-br from-red-50 dark:from-red-900/20 to-orange-50 dark:to-orange-900/20 rounded-2xl p-8 text-center border border-red-200 dark:border-red-800">
                        <Clock className="w-16 h-16 text-red-400 mx-auto mb-4" />
                        <h4 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">{t('appointmentBooking.bookAppointment.noSlots.title')}</h4>
                        <p className="text-red-600 dark:text-red-400 mb-4">{t('appointmentBooking.bookAppointment.noSlots.message')}</p>
                        <p className="text-sm text-red-500 dark:text-red-400">{t('appointmentBooking.bookAppointment.noSlots.tryAnother')}</p>
                      </div>
                    )}
                  </div>

                  {/* Confirm Booking Button */}
                  <div className="mt-8">
                    <button
                      onClick={handleConfirmBooking}
                      disabled={bookingConfirmed || !selectedTime || !selectedDate}
                      className={`w-full font-bold py-5 px-8 rounded-2xl transition-all duration-200 transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#0075A2] focus:ring-opacity-50 text-lg ${bookingConfirmed
                        ? 'bg-green-600 text-white cursor-default shadow-lg'
                        : !selectedTime || !selectedDate
                          ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed transform-none hover:scale-100 hover:shadow-none'
                          : 'bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] hover:from-[#005a7a] hover:to-[#081f3a] text-white shadow-lg'
                        }`}
                      aria-describedby="booking-summary"
                    >
                      {bookingConfirmed ? (
                        <div className="flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 mr-3" />
                          {t('appointmentBooking.bookAppointment.buttons.appointmentConfirmed')}
                        </div>
                      ) : !selectedTime || !selectedDate ? (
                        <div className="flex items-center justify-center">
                          <Clock className="w-6 h-6 mr-3" />
                          {t('appointmentBooking.bookAppointment.buttons.completeSelection')}
                        </div>
                      ) : !isAuthenticated ? (
                        <div className="flex items-center justify-center">
                          <User className="w-6 h-6 mr-3" />
                          {t('appointmentBooking.bookAppointment.buttons.signInToBook')}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 mr-3" />
                          {t('appointmentBooking.bookAppointment.buttons.confirmAppointment')}
                        </div>
                      )}
                    </button>

                    {/* Booking Status Info */}
                    {selectedTime && selectedDate && !bookingConfirmed && (
                      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                        <div className="flex items-start">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">{t('appointmentBooking.readyToBook.title')}</h4>
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                              {!isAuthenticated
                                ? t('appointmentBooking.readyToBook.signInRequired')
                                : t('appointmentBooking.readyToBook.confirmBooking')
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Booking Summary for Screen Readers */}
                  <div id="booking-summary" className="sr-only">
                    Booking summary: {selectedDoctor?.full_name} on {selectedDate?.toLocaleDateString()} at {selectedTime}
                  </div>
                </div>
              </div>

              {/* Right Column - How It Works & Booking Summary */}
              <div className="lg:col-span-1">
                <div className="space-y-6">
                  {/* How It Works */}
                  <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 border border-gray-200 dark:border-gray-700 sticky top-24">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-[#0A2647] dark:text-gray-100 mb-2">{t('appointmentBooking.howItWorksTitle')}</h3>
                      <p className="text-gray-600 dark:text-gray-300">{t('appointmentBooking.howItWorksSubtitle')}</p>
                    </div>

                    <div className="space-y-6">
                      {steps.map((step, index) => (
                        <div key={index} className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            <div className={`w-12 h-12 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-xl flex items-center justify-center text-white font-bold ${index === 0 && selectedSpecialty ? 'ring-4 ring-green-200 dark:ring-green-800' :
                              index === 1 && selectedDoctor ? 'ring-4 ring-green-200 dark:ring-green-800' :
                                index === 2 && selectedDate ? 'ring-4 ring-green-200 dark:ring-green-800' :
                                  index === 3 && selectedTime ? 'ring-4 ring-green-200 dark:ring-green-800' : ''
                              }`}>
                              <step.icon className="w-6 h-6" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="text-xs font-bold text-[#0075A2] dark:text-[#0EA5E9] mb-1">STEP {step.number}</div>
                            <h4 className="font-bold text-[#0A2647] dark:text-gray-100 text-sm mb-2">{step.title}</h4>
                            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{step.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Booking Summary */}
                  {(selectedDoctor || selectedDate || selectedTime) && (
                    <div className="bg-gradient-to-br from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-3xl shadow-xl p-6 text-white">
                      <h3 className="text-xl font-bold mb-4 flex items-center">
                        <CheckCircle className="w-6 h-6 mr-2" />
                        Booking Summary
                      </h3>
                      <div className="space-y-3">
                        {selectedSpecialty && (
                          <div className="flex items-center">
                            <Stethoscope className="w-4 h-4 mr-3 text-white/80" />
                            <span className="text-sm">{selectedSpecialty.name}</span>
                          </div>
                        )}
                        {selectedDoctor && (
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-3 text-white/80" />
                            <span className="text-sm">{selectedDoctor.full_name}</span>
                          </div>
                        )}
                        {selectedDate && (
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-3 text-white/80" />
                            <span className="text-sm">{selectedDate.toLocaleDateString()}</span>
                          </div>
                        )}
                        {selectedTime && (
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-3 text-white/80" />
                            <span className="text-sm">{selectedTime}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Quick Tips */}
                  <div className="bg-gradient-to-br from-green-50 dark:from-green-900/20 to-blue-50 dark:to-blue-900/20 rounded-3xl shadow-lg p-6 border border-green-200 dark:border-green-800">
                    <h4 className="font-bold text-[#0A2647] dark:text-gray-100 text-lg mb-4 flex items-center">
                      💡 Quick Tips
                    </h4>
                    <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span>Book in advance for better slot availability</span>
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span>You'll receive instant confirmation via SMS</span>
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span>Cancel or reschedule up to 24 hours before</span>
                      </li>
                    </ul>
                  </div>

                  {/* Support */}
                  <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 text-center">
                    <Shield className="w-8 h-8 text-[#0075A2] dark:text-[#0EA5E9] mx-auto mb-3" />
                    <h4 className="font-bold text-[#0A2647] dark:text-gray-100 mb-2">Need Help?</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Our support team is here to assist you</p>
                    <button className="text-[#0075A2] dark:text-[#0EA5E9] text-sm font-semibold hover:underline">
                      Contact Support
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 lg:py-28 bg-gradient-to-br from-white dark:from-gray-800 to-[#F6F6F6] dark:to-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#0A2647] dark:text-gray-100 mb-6">Why Choose Our Smart Booking?</h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">Experience the future of healthcare appointment booking with our intelligent, secure, and user-friendly platform</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 lg:p-10 shadow-xl hover:shadow-2xl transform hover:-translate-y-3 transition-all duration-300 border border-gray-200 dark:border-gray-700 group text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform mx-auto">
                  <Calendar className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-[#0A2647] dark:text-gray-100 mb-4">Real-Time Availability</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">See live doctor schedules and available slots updated in real-time. No more waiting for callbacks or playing phone tag.</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 lg:p-10 shadow-xl hover:shadow-2xl transform hover:-translate-y-3 transition-all duration-300 border border-gray-200 dark:border-gray-700 group text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform mx-auto">
                  <Bell className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-[#0A2647] dark:text-gray-100 mb-4">Smart Reminders</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">Get automatic SMS and WhatsApp reminders before your appointment. Never miss an important consultation again.</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 lg:p-10 shadow-xl hover:shadow-2xl transform hover:-translate-y-3 transition-all duration-300 border border-gray-200 dark:border-gray-700 group text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform mx-auto">
                  <Shield className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-[#0A2647] dark:text-gray-100 mb-4">Secure & Private</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">Your health data is protected with enterprise-grade security. DPDP compliant with end-to-end encryption.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Queue Token Modal */}
      <QueueTokenModal
        isOpen={showQueueTokenModal}
        onClose={() => setShowQueueTokenModal(false)}
        onRedirect={() => navigate('/patient-dashboard')}
        queueToken={queueToken}
        appointmentDetails={appointmentDetails}
      />

    </div>
  );
}

export default SmartAppointmentBookingPage;