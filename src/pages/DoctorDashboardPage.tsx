import React, { useState, useEffect, useCallback } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  Calendar, Clock, Save, ChevronLeft, ChevronRight, X, CheckCircle, AlertCircle, User, FileText,
  ArrowLeft, Heart, Users, Activity, Edit3, RefreshCw, Eye, MoreVertical, UserCheck, UserX
} from 'lucide-react';
import Navigation from '../components/Navigation';
import { AccessibilityAnnouncer } from '../components/AccessibilityAnnouncer';
import { useDarkMode } from '../hooks/useDarkMode';
import { useLanguage } from '../contexts/LanguageContext';
import { useRBAC } from '../hooks/useRBAC';
import { supabase, getDoctorIdByUserId, createDoctorSchedulesForNext4Weeks, generateTimeSlotsForNext4Weeks } from '../utils/supabase';
import PatientTabContent from '../components/PatientTab';
import ScheduleManagement from '../components/Schedule/ScheduleManagement';

// Auth props interface
interface AuthProps {
  user: any;
  session: any;
  profile: any;
  userState: 'new' | 'returning' | 'authenticated';
  isAuthenticated: boolean;
  isLoadingInitialAuth: boolean;
  isProfileLoading: boolean;
  handleLogout: () => Promise<void>;
}

// Doctor data interface
interface Doctor {
  id: string;
  full_name: string;
  specialty: string;
  super_specialization?: string;
  email: string;
  phone_number?: string;
  profile_image_url?: string;
  last_login?: string;
}

// Appointment interface
interface Appointment {
  id: string;
  patient_id: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'confirmed' | 'in_room' | 'completed' | 'cancelled' | 'no_show' | 'arrived';
  queue_token?: string;
  notes?: string;
  patient_name?: string;
  patient_phone?: string;
  patient_profile_image?: string;
}

// Today's overview stats interface
interface TodayStats {
  appointments: number;
  waitingArrived: number;
  cancelled: number;
  newPatients: number;
}

// Monthly stats interface
interface MonthlyStats {
  appointments: number;
  cancelled: number;
  newPatients: number;
}

// Schedule types
interface ScheduleDay {
  isAvailable: boolean;
  startTime: string;
  endTime: string;
  slotDuration: number;
  breakStartTime: string;
  breakEndTime: string;
}

interface ScheduleForm {
  [dayId: number]: ScheduleDay;
}

function DoctorDashboardPage({ user, session, profile, userState, isAuthenticated, isLoadingInitialAuth, isProfileLoading, handleLogout }: AuthProps) {
  const { language } = useLanguage();
  const { userRole, isLoading: roleLoading } = useRBAC();
  const [announcement, setAnnouncement] = useState('');

  // Doctor data state
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [isLoadingDoctor, setIsLoadingDoctor] = useState(false);

  // Dashboard data states
  const [todayStats, setTodayStats] = useState<TodayStats>({
    appointments: 0,
    waitingArrived: 0,
    cancelled: 0,
    newPatients: 0
  });
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats>({
    appointments: 0,
    cancelled: 0,
    newPatients: 0
  });
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Tab management
  const [activeTab, setActiveTab] = useState<'overview' | 'maintain-schedule' | 'patients' | 'reports'>('overview');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Schedule management states (for Schedule Management tab)
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isGeneratingSlots, setIsGeneratingSlots] = useState(false);
  const [slotsGenerated, setSlotsGenerated] = useState(false);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [existingTimeSlots, setExistingTimeSlots] = useState<any[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [hasSchedulesFor4Weeks, setHasSchedulesFor4Weeks] = useState(false);

  // Schedule form state - starts with all days unchecked and blank
  const [currentWeekSchedule, setCurrentWeekSchedule] = useState<ScheduleForm>({
    1: { isAvailable: false, startTime: '', endTime: '', slotDuration: 15, breakStartTime: '', breakEndTime: '' },
    2: { isAvailable: false, startTime: '', endTime: '', slotDuration: 15, breakStartTime: '', breakEndTime: '' },
    3: { isAvailable: false, startTime: '', endTime: '', slotDuration: 15, breakStartTime: '', breakEndTime: '' },
    4: { isAvailable: false, startTime: '', endTime: '', slotDuration: 15, breakStartTime: '', breakEndTime: '' },
    5: { isAvailable: false, startTime: '', endTime: '', slotDuration: 15, breakStartTime: '', breakEndTime: '' },
    6: { isAvailable: false, startTime: '', endTime: '', slotDuration: 15, breakStartTime: '', breakEndTime: '' },
    0: { isAvailable: false, startTime: '', endTime: '', slotDuration: 15, breakStartTime: '', breakEndTime: '' }
  });

  // Slot duration options
  const slotDurations = [
    { value: 10, label: '10 minutes' },
    { value: 15, label: '15 minutes' },
    { value: 20, label: '20 minutes' },
    { value: 30, label: '30 minutes' }
  ];

  // Days of week (Monday = 1, Sunday = 0)
  const daysOfWeek = [
    { id: 1, name: 'Monday' },
    { id: 2, name: 'Tuesday' },
    { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday' },
    { id: 5, name: 'Friday' },
    { id: 6, name: 'Saturday' },
    { id: 0, name: 'Sunday' }
  ];

  // Generate initials from full name (skip "Dr" prefix)
  const getInitials = (fullName: string) => {
    if (!fullName) return 'D';

    const words = fullName.trim().split(/\s+/);
    const filteredWords = words[0].toLowerCase() === 'dr' ? words.slice(1) : words;

    if (filteredWords.length === 1) {
      return filteredWords[0].charAt(0).toUpperCase();
    }

    const initials = filteredWords.slice(0, 2).map(word => word.charAt(0).toUpperCase()).join('');
    return initials;
  };

  // Get current month in MMM format (e.g., "Nov", "Dec", "Jan")
  const getCurrentMonthShort = () => {
    return new Date().toLocaleDateString('en-US', { month: 'short' });
  };

  // Load doctor data
  const loadDoctorData = useCallback(async () => {
    if (!isAuthenticated || !user) {
      console.log('❌ Cannot load doctor data - missing auth:', { isAuthenticated, hasUser: !!user, hasProfile: !!profile });
      return;
    }

    setIsLoadingDoctor(true);
    try {
      console.log('🔍 Loading doctor data for user:', user.id);
      const doctorId = await getDoctorIdByUserId(user.id);
      console.log('📋 Doctor ID:', doctorId);

      if (doctorId) {
        const { data: doctorData, error: doctorError } = await supabase
          .from('doctors')
          .select('id, full_name, specialty, super_specialization, email, phone_number, profile_image_url')
          .eq('id', doctorId)
          .single();

        console.log('📊 Doctor query result:', { data: doctorData, error: doctorError });

        if (!doctorError && doctorData) {
          // Handle profile_image_url - could be full URL or path
          let profileImageUrl = doctorData.profile_image_url;

          // If URL is a path (not a full URL), generate public URL (not signed URL for profile images)
          if (profileImageUrl && !profileImageUrl.startsWith('http')) {
            try {
              const cleanPath = profileImageUrl.replace('doctor-profile-images/', '');
              const { data: publicUrlData } = supabase.storage
                .from('doctor-profile-images')
                .getPublicUrl(cleanPath);

              if (publicUrlData?.publicUrl) {
                profileImageUrl = publicUrlData.publicUrl;
              }
            } catch (err) {
              console.error('Error generating public URL:', err);
            }
          }

          const doctorInfo = {
            ...doctorData,
            profile_image_url: profileImageUrl,
            last_login: new Date().toISOString()
          };

          console.log('✅ Setting doctor data:', doctorInfo);
          setDoctor(doctorInfo);
        } else {
          console.log('⚠️ No doctor data found or error, using fallback');
          // Fallback data
          setDoctor({
            id: doctorId,
            full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Doctor',
            specialty: 'Specialty not set',
            super_specialization: 'Not set',
            email: user?.email || '',
            last_login: new Date().toISOString()
          });
        }
      } else {
        console.log('❌ No doctor ID found for user');
      }
    } catch (error) {
      console.error('❌ Error loading doctor data:', error);
      setAnnouncement('Failed to load doctor profile');
    } finally {
      setIsLoadingDoctor(false);
    }
  }, [isAuthenticated, user]);

  // Load today's appointments
  const loadTodayAppointments = useCallback(async () => {
    if (!doctor?.id) return;

    setIsLoadingAppointments(true);
    try {
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          id,
          patient_id,
          schedule_date,
          start_time,
          end_time,
          status,
          queue_token,
          notes,
          patients!inner(
            full_name,
            phone_number,
            profile_image_url
          )
        `)
        .eq('doctor_id', doctor.id)
        .eq('schedule_date', selectedDate)
        .order('start_time');

      if (!error && appointments) {
        const formattedAppointments: Appointment[] = appointments.map((apt: any) => ({
          id: apt.id,
          patient_id: apt.patient_id,
          schedule_date: apt.schedule_date,
          start_time: apt.start_time,
          end_time: apt.end_time,
          status: apt.status,
          queue_token: apt.queue_token,
          notes: apt.notes,
          patient_name: apt.patients?.full_name || 'Unknown Patient',
          patient_phone: apt.patients?.phone_number,
          patient_profile_image: apt.patients?.profile_image_url
        }));

        setTodayAppointments(formattedAppointments);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
      setAnnouncement('Failed to load appointments');
    } finally {
      setIsLoadingAppointments(false);
    }
  }, [doctor?.id, selectedDate]);

  // Load today's stats (ALWAYS uses actual TODAY's date, not selectedDate)
  const loadTodayStats = useCallback(async () => {
    if (!doctor?.id) return;

    setIsLoadingStats(true);
    try {
      // Get actual today's date (not selectedDate which is for appointments table filtering)
      const todayDate = new Date().toISOString().split('T')[0];

      // Get appointment count for today (exclude cancelled)
      const { count: appointmentCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', doctor.id)
        .eq('schedule_date', todayDate)
        .in('status', ['booked', 'confirmed', 'completed']);

      // Get waiting/arrived patients count
      // Note: Database schema doesn't have 'in_room' or 'arrived' statuses yet
      // This feature requires database migration to add these statuses
      const arrivedCount = 0;

      // Get cancelled count
      const { count: cancelledCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', doctor.id)
        .eq('schedule_date', todayDate)
        .eq('status', 'cancelled');

      // Get new patients count for today (patients having their FIRST appointment with this doctor today)
      const { data: todayAppointments } = await supabase
        .from('appointments')
        .select('patient_id')
        .eq('doctor_id', doctor.id)
        .eq('schedule_date', todayDate)
        .neq('status', 'cancelled');

      let newPatientsToday = 0;
      if (todayAppointments && todayAppointments.length > 0) {
        // Get unique patient IDs
        const uniquePatientIds = [...new Set(todayAppointments.map(apt => apt.patient_id))];
        
        // For each patient, check if they have any appointments before today with this doctor
        for (const patientId of uniquePatientIds) {
          const { count: previousAppointments } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('doctor_id', doctor.id)
            .eq('patient_id', patientId)
            .lt('schedule_date', todayDate);
          
          // If no previous appointments, this is a new patient for this doctor
          if (previousAppointments === 0) {
            newPatientsToday++;
          }
        }
      }

      setTodayStats({
        appointments: appointmentCount || 0,
        waitingArrived: arrivedCount || 0,
        cancelled: cancelledCount || 0,
        newPatients: newPatientsToday
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      setAnnouncement('Failed to load statistics');
    } finally {
      setIsLoadingStats(false);
    }
  }, [doctor?.id]);

  // Load monthly stats
  const loadMonthlyStats = useCallback(async () => {
    if (!doctor?.id) return;

    try {
      // Get first and last day of current month
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      const firstDayStr = firstDay.toISOString().split('T')[0];
      const lastDayStr = lastDay.toISOString().split('T')[0];

      // Get monthly appointment count (all statuses except cancelled)
      const { count: monthAppointmentCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', doctor.id)
        .gte('schedule_date', firstDayStr)
        .lte('schedule_date', lastDayStr)
        .in('status', ['booked', 'confirmed', 'completed']);

      // Get monthly cancelled count
      const { count: monthCancelledCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', doctor.id)
        .gte('schedule_date', firstDayStr)
        .lte('schedule_date', lastDayStr)
        .eq('status', 'cancelled');

      // Get monthly new patients count (patients having their FIRST appointment with this doctor in current month)
      const { data: monthAppointments } = await supabase
        .from('appointments')
        .select('patient_id, schedule_date')
        .eq('doctor_id', doctor.id)
        .gte('schedule_date', firstDayStr)
        .lte('schedule_date', lastDayStr)
        .neq('status', 'cancelled')
        .order('schedule_date', { ascending: true });

      let newPatientsMonth = 0;
      if (monthAppointments && monthAppointments.length > 0) {
        // Get unique patient IDs
        const uniquePatientIds = [...new Set(monthAppointments.map(apt => apt.patient_id))];
        
        // For each patient, check if they have any appointments before this month with this doctor
        for (const patientId of uniquePatientIds) {
          const { count: previousAppointments } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('doctor_id', doctor.id)
            .eq('patient_id', patientId)
            .lt('schedule_date', firstDayStr);
          
          // If no previous appointments before this month, this is a new patient for this doctor
          if (previousAppointments === 0) {
            newPatientsMonth++;
          }
        }
      }

      setMonthlyStats({
        appointments: monthAppointmentCount || 0,
        cancelled: monthCancelledCount || 0,
        newPatients: newPatientsMonth
      });
    } catch (error) {
      console.error('Error loading monthly stats:', error);
    }
  }, [doctor?.id]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        loadTodayAppointments(),
        loadTodayStats(),
        loadMonthlyStats()
      ]);
      setAnnouncement('Dashboard data refreshed');
    } finally {
      setIsRefreshing(false);
    }
  }, [loadTodayAppointments, loadTodayStats, loadMonthlyStats]);

  // Update appointment status
  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId);

      if (!error) {
        await loadTodayAppointments();
        await loadTodayStats();
        setAnnouncement(`Appointment status updated to ${newStatus}`);
      }
    } catch (error) {
      console.error('Error updating appointment status:', error);
      setAnnouncement('Failed to update appointment status');
    }
  };

  // Mark patient as arrived
  const markPatientArrived = async (appointmentId: string) => {
    await updateAppointmentStatus(appointmentId, 'in_room');
  };

  // Complete appointment
  const completeAppointment = async (appointmentId: string) => {
    await updateAppointmentStatus(appointmentId, 'completed');
  };

  // Handle schedule form changes
  const handleScheduleChange = useCallback((dayId: number, field: keyof ScheduleDay, value: any) => {
    setCurrentWeekSchedule(prev => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        [field]: value
      }
    }));
  }, []);

  // Copy schedule from one day to another
  const copySchedule = useCallback((fromDayId: number, toDayId: number) => {
    const fromSchedule = currentWeekSchedule[fromDayId];
    setCurrentWeekSchedule(prev => ({
      ...prev,
      [toDayId]: {
        ...fromSchedule,
        isAvailable: true
      }
    }));
  }, [currentWeekSchedule]);

  // Clear all schedules
  const clearAllSchedules = () => {
    setCurrentWeekSchedule({
      1: { isAvailable: false, startTime: '', endTime: '', slotDuration: 15, breakStartTime: '', breakEndTime: '' },
      2: { isAvailable: false, startTime: '', endTime: '', slotDuration: 15, breakStartTime: '', breakEndTime: '' },
      3: { isAvailable: false, startTime: '', endTime: '', slotDuration: 15, breakStartTime: '', breakEndTime: '' },
      4: { isAvailable: false, startTime: '', endTime: '', slotDuration: 15, breakStartTime: '', breakEndTime: '' },
      5: { isAvailable: false, startTime: '', endTime: '', slotDuration: 15, breakStartTime: '', breakEndTime: '' },
      6: { isAvailable: false, startTime: '', endTime: '', slotDuration: 15, breakStartTime: '', breakEndTime: '' },
      0: { isAvailable: false, startTime: '', endTime: '', slotDuration: 15, breakStartTime: '', breakEndTime: '' }
    });
  };

  // Get current week dates with past/today flags
  const getWeekDates = useCallback(() => {
    const today = new Date();
    const startOfWeek = new Date(today);

    // Calculate start of current week (Monday)
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWeek.setDate(today.getDate() - daysToMonday);

    // Add week offset
    startOfWeek.setDate(startOfWeek.getDate() + (currentWeekOffset * 7));

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);

      const isPast = date < today && date.toDateString() !== today.toDateString();
      const isToday = date.toDateString() === today.toDateString();

      weekDates.push({
        dayOfWeek: date.getDay(),
        date: date,
        dateString: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        isPast,
        isToday
      });
    }

    return weekDates;
  }, [currentWeekOffset]);

  const currentWeekDates = getWeekDates();

  // Get week range for display
  const getWeekRange = useCallback(() => {
    if (currentWeekDates.length === 0) return { start: '', end: '', fullStart: '', fullEnd: '' };

    const start = currentWeekDates[0].dateString;
    const end = currentWeekDates[6].dateString;
    const fullStart = currentWeekDates[0].date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    const fullEnd = currentWeekDates[6].date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

    return { start, end, fullStart, fullEnd };
  }, [currentWeekDates]);

  const weekRange = getWeekRange();

  // Week navigation
  const goToPreviousWeek = () => {
    if (currentWeekOffset > 0) {
      setCurrentWeekOffset(currentWeekOffset - 1);
    }
  };

  const goToNextWeek = () => {
    if (currentWeekOffset < 3) {
      setCurrentWeekOffset(currentWeekOffset + 1);
    }
  };

  // Save schedules
  const handleSaveSchedules = useCallback(async () => {
    try {
      setIsSaving(true);
      setError('');
      setSaveSuccess(false);

      // Validate that at least one day is selected
      const hasAvailableDays = Object.values(currentWeekSchedule).some(day => day.isAvailable);
      if (!hasAvailableDays) {
        throw new Error('Please select at least one day to be available.');
      }

      // Validate that user is authenticated and has a profile
      if (!user || !profile) {
        throw new Error('Please log in to save schedules.');
      }

      const doctorId = await getDoctorIdByUserId(user.id);
      if (!doctorId) {
        throw new Error('Doctor profile not found. Please complete your doctor registration first.');
      }

      // Save schedules for each available day
      const savePromises = [];
      for (const [dayId, schedule] of Object.entries(currentWeekSchedule)) {
        if (schedule.isAvailable && schedule.startTime && schedule.endTime) {
          const dayNumber = parseInt(dayId);

          const savePromise = createDoctorSchedulesForNext4Weeks(
            doctorId,
            dayNumber,
            schedule.startTime,
            schedule.endTime,
            schedule.slotDuration,
            schedule.breakStartTime || undefined,
            schedule.breakEndTime || undefined
          );
          savePromises.push(savePromise);
        }
      }

      // Wait for all schedules to be saved
      await Promise.all(savePromises);

      // Generate time slots for the next 4 weeks
      await generateTimeSlotsForNext4Weeks(doctorId);

      setSaveSuccess(true);
      setSlotsGenerated(true);
      setAnnouncement('Schedule and time slots generated successfully for the next 4 weeks');

      setTimeout(() => setSaveSuccess(false), 3000);

    } catch (error) {
      console.error('Error saving schedules:', error);

      let errorMessage = 'Failed to save schedule. Please try again.';

      if (error instanceof Error) {
        if (error.message.includes('duplicate key')) {
          errorMessage = 'Schedule already exists for this day. Please try again.';
        } else if (error.message.includes('foreign key')) {
          errorMessage = 'Doctor profile not found. Please complete your registration first.';
        } else if (error.message.includes('constraint')) {
          errorMessage = 'Invalid schedule data. Please check your time settings.';
        } else {
          errorMessage = error.message;
        }
      }

      setError(errorMessage);
      setAnnouncement(`Error: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  }, [currentWeekSchedule, user, profile]);

  // Handle row click to view patient details
  const handleRowClick = (patientId: string) => {
    setSelectedPatientId(patientId);
    setActiveTab('patients');
    setAnnouncement('Switched to Patient Management tab');
  };

  // Handle back from patient detail view
  const handleBackFromPatient = () => {
    setSelectedPatientId(null);
  };

  // Load data on component mount and when doctor changes
  useEffect(() => {
    loadDoctorData();
  }, [loadDoctorData]);

  useEffect(() => {
    if (doctor?.id) {
      loadTodayAppointments();
      loadTodayStats();
      loadMonthlyStats();
    }
  }, [doctor?.id, loadTodayAppointments, loadTodayStats, loadMonthlyStats]);

  // Check if user has doctor role - AFTER all hooks
  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0075A2] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (userRole !== 'doctor' && userRole !== 'admin') {
    return <Navigate to="/login-page" replace />;
  }

  // Show loading state while determining initial authentication
  if (isLoadingInitialAuth) {
    return (
      <div className="min-h-screen bg-[#F6F6F6] dark:bg-gray-900 text-[#0A2647] dark:text-gray-100 transition-colors duration-300">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#0075A2] border-t-transparent mx-auto mb-4"></div>
            <p className="text-lg text-gray-600 dark:text-gray-300">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Authentication check - require proper login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F6F6F6] dark:bg-gray-900 text-[#0A2647] dark:text-gray-100 transition-colors duration-300">
        <Navigation
          user={user}
          session={session}
          profile={profile}
          userState={userState}
          isAuthenticated={isAuthenticated}
          handleLogout={handleLogout}
        />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-[#0A2647] dark:text-gray-100 mb-4">Doctor Login Required</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8">Please log in to access your doctor dashboard.</p>
            <Link
              to="/doctor-login"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#0075A2] to-[#0A2647] text-white rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-1 transition-all"
            >
              Go to Login
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Show loading while fetching doctor data
  if (isLoadingDoctor) {
    return (
      <div className="min-h-screen bg-[#F6F6F6] dark:bg-gray-900 text-[#0A2647] dark:text-gray-100 transition-colors duration-300">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#0075A2] border-t-transparent mx-auto mb-4"></div>
            <p className="text-lg text-gray-600 dark:text-gray-300">Loading doctor information...</p>
          </div>
        </div>
      </div>
    );
  }

  // Filter appointments based on search
  const filteredAppointments = todayAppointments.filter(appointment => {
    const matchesSearch = appointment.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.queue_token?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Map status to display label (in CAPS)
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_room': return 'IN ROOM';
      case 'scheduled': return 'SCHEDULED';
      case 'completed': return 'COMPLETED';
      case 'cancelled': return 'CANCELLED';
      case 'arrived': return 'ARRIVED';
      case 'confirmed': return 'CONFIRMED';
      case 'no_show': return 'NO SHOW';
      default: return status.toUpperCase();
    }
  };

  // Get status badge color with distinct colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_room':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700';
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700';
      case 'scheduled':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700';
      case 'confirmed':
        return 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-700';
      case 'cancelled':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700';
      case 'arrived':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-700';
      case 'no_show':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F6F6] dark:bg-gray-900 text-[#0A2647] dark:text-gray-100 transition-colors duration-300">
      <AccessibilityAnnouncer message={announcement} />
      <Navigation
        user={user}
        session={session}
        profile={profile}
        userState={userState}
        isAuthenticated={isAuthenticated}
        handleLogout={handleLogout}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          to="/"
          className="inline-flex items-center text-[#0075A2] dark:text-[#0EA5E9] hover:text-[#0A2647] dark:hover:text-gray-100 transition-colors mb-8 focus-ring"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </Link>

        {/* Doctor Dashboard Header - Matching Patient Dashboard Pattern */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-[#E8E8E8] dark:border-gray-600 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-2xl flex items-center justify-center text-white font-bold text-3xl overflow-hidden">
                {doctor?.profile_image_url ? (
                  <img
                    src={doctor.profile_image_url}
                    alt="Profile"
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  <span>{getInitials(doctor?.full_name || 'Doctor')}</span>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#0A2647] dark:text-gray-100">
                  {doctor?.full_name || 'Dr. Unknown'}
                </h1>
                <p className="text-gray-600 dark:text-gray-300 text-lg">
                  <span className="font-medium">Specialty:</span> {doctor?.specialty || 'Not set'}
                </p>
                {doctor?.super_specialization && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-medium">Super Specialization:</span> {doctor.super_specialization}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Last login</p>
              <p className="text-lg font-semibold text-[#0A2647] dark:text-gray-100">
                {new Date().toLocaleDateString('en-GB')}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {new Date().toLocaleTimeString('en-GB', { hour12: false })}
              </p>
              <div className="mt-4">
                <Link
                  to="/doctor-profile-update"
                  className="bg-gradient-to-r from-[#0075A2] to-[#0A2647] text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 text-sm flex items-center inline-flex"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Update Profile
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Overview Section - 4 Cards */}
        <div className="mb-8">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-2 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-[#0075A2] dark:text-[#0EA5E9]" />
              Today's Overview
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Appointments Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-[#E8E8E8] dark:border-gray-600">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Appointments</p>
                  <p className="text-2xl font-bold text-[#0A2647] dark:text-gray-100">
                    {isLoadingStats ? '...' : todayStats.appointments}
                  </p>
                  <p className="text-xs font-semibold text-[#0075A2] dark:text-[#0EA5E9]">
                    ({getCurrentMonthShort()}: {isLoadingStats ? '...' : monthlyStats.appointments})
                  </p>
                </div>
              </div>
            </div>

            {/* Waiting / Arrived Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-[#E8E8E8] dark:border-gray-600">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl">
                  <UserCheck className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Waiting / Arrived</p>
                  <p className="text-2xl font-bold text-[#0A2647] dark:text-gray-100">
                    {isLoadingStats ? '...' : todayStats.waitingArrived}
                  </p>
                </div>
              </div>
            </div>

            {/* Cancelled Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-[#E8E8E8] dark:border-gray-600">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                  <UserX className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Cancelled</p>
                  <p className="text-2xl font-bold text-[#0A2647] dark:text-gray-100">
                    {isLoadingStats ? '...' : todayStats.cancelled}
                  </p>
                  <p className="text-xs font-semibold text-[#0075A2] dark:text-[#0EA5E9]">
                    ({getCurrentMonthShort()}: {isLoadingStats ? '...' : monthlyStats.cancelled})
                  </p>
                </div>
              </div>
            </div>

            {/* New Patients Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-[#E8E8E8] dark:border-gray-600">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">New Patients</p>
                  <p className="text-2xl font-bold text-[#0A2647] dark:text-gray-100">
                    {isLoadingStats ? '...' : todayStats.newPatients}
                  </p>
                  <p className="text-xs font-semibold text-[#0075A2] dark:text-[#0EA5E9]">
                    ({getCurrentMonthShort()}: {isLoadingStats ? '...' : monthlyStats.newPatients})
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Appointments Schedule Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-[#E8E8E8] dark:border-gray-600 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-[#0075A2] dark:text-[#0EA5E9]" />
                Appointments Summary
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 ml-7">
                Showing appointments for{' '}
                <span className="font-semibold text-[#0075A2] dark:text-[#0EA5E9]">
                  {new Date(selectedDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0075A2] dark:focus:ring-[#0EA5E9] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <button
                onClick={refreshData}
                disabled={isRefreshing}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Queue #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                {isLoadingAppointments ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0075A2] dark:border-[#0EA5E9] mr-3"></div>
                        <span className="text-gray-600 dark:text-gray-300">Loading appointments...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      No appointments found for {new Date(selectedDate).toLocaleDateString()}
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.slice(0, 5).map((appointment) => (
                    <tr
                      key={appointment.id}
                      onClick={() => handleRowClick(appointment.patient_id)}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm mr-3 overflow-hidden bg-gradient-to-r from-[#0075A2] to-[#0A2647]">
                            {appointment.patient_profile_image ? (
                              <img
                                src={appointment.patient_profile_image}
                                alt={appointment.patient_name || 'Patient'}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.parentElement!.textContent = appointment.patient_name?.charAt(0) || 'P';
                                }}
                              />
                            ) : (
                              appointment.patient_name?.charAt(0) || 'P'
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-[#0A2647] dark:text-gray-100">
                              {appointment.patient_name || 'Unknown Patient'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {appointment.patient_phone || 'No phone'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {appointment.start_time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {appointment.queue_token || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                          {getStatusLabel(appointment.status)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-[#E8E8E8] dark:border-gray-600 mb-8">
          <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {[
              { id: 'overview', label: 'Overview', icon: Calendar },
              { id: 'maintain-schedule', label: 'Schedule Management', icon: Clock },
              { id: 'patients', label: 'Patient', icon: User },
              { id: 'reports', label: 'Reports', icon: FileText }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setAnnouncement(`Switched to ${tab.label} tab`);
                  }}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-md font-medium transition-all ${activeTab === tab.id
                    ? 'bg-white dark:bg-gray-600 text-[#0075A2] dark:text-[#0EA5E9] shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-[#0075A2] dark:hover:text-[#0EA5E9]'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-[#E8E8E8] dark:border-gray-600">
              <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-4">Overview: Daily Summary</h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  Daily clinical summary and notes — empty state hint. This area will be populated with your daily clinical summary,
                  important notes, and key observations from today's consultations. You can expand this section to add more detailed
                  clinical notes and observations.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'maintain-schedule' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-[#E8E8E8] dark:border-gray-600">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#0A2647] dark:text-gray-100">Schedule Management</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                Manage your availability for the next 4 weeks (Sunday to Saturday)
              </p>
            </div>

            <ScheduleManagement doctorId={doctor?.id || ''} />
          </div>
        )}

        {activeTab === 'patients' && (
          <PatientTabContent
            patientId={selectedPatientId}
            doctorId={doctor?.id || ''}
            onBack={handleBackFromPatient}
          />
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-[#E8E8E8] dark:border-gray-600">
              <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-4">Reports & Analytics</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Generate and view various reports for your practice analytics.
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Reports and analytics features will be implemented here.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default DoctorDashboardPage;
