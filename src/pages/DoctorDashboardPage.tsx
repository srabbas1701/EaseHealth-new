import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, Clock, Save, ChevronLeft, ChevronRight, X, CheckCircle, AlertCircle, User, FileText, ArrowLeft, Shield
} from 'lucide-react';
import Navigation from '../components/Navigation';
import AuthModal from '../components/AuthModal';
import UnifiedDoctorRegistrationForm from '../components/UnifiedDoctorRegistrationForm';
import { createDoctorSchedulesForNext4Weeks, generateTimeSlotsForNext4Weeks, getDoctorIdByUserId, supabase } from '../utils/supabase';

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
  console.log('🔍 DoctorDashboardPage rendering with props:', { 
    user: !!user, 
    session: !!session, 
    profile: !!profile, 
    userState, 
    isAuthenticated, 
    isLoadingInitialAuth, 
    isProfileLoading 
  });
  
  console.log('🔍 Detailed auth data:', {
    user: user,
    session: session,
    profile: profile,
    isAuthenticated,
    isLoadingInitialAuth
  });

  // Authentication states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDoctorRegistration, setShowDoctorRegistration] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  
  // Form states for inline login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState('');
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState('');
  
  // Schedule management states
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'patients' | 'reports'>('overview');
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
  
  // Get current week dates with past/today flags
  const getWeekDates = useCallback(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    
    // Calculate start of current week (Monday)
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, so 6 days to Monday
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
  
  // Generate initials from full name (skip "Dr" prefix)
  const getInitials = (fullName: string) => {
    if (!fullName) return 'D';
    
    // Split by spaces and get first letter of each word
    const words = fullName.trim().split(/\s+/);
    
    // Skip "Dr" if it's the first word
    const filteredWords = words[0].toLowerCase() === 'dr' ? words.slice(1) : words;
    
    if (filteredWords.length === 1) {
      return filteredWords[0].charAt(0).toUpperCase();
    }
    
    // Get first letter of first two words (or all words if only 2)
    const initials = filteredWords.slice(0, 2).map(word => word.charAt(0).toUpperCase()).join('');
    return initials;
  };
  
  // Handle schedule form changes
  const handleScheduleChange = useCallback((dayId: number, field: keyof ScheduleDay, value: any) => {
    console.log(`🔄 Schedule change - Day ${dayId}, Field: ${field}, Value: ${value}`);
    setCurrentWeekSchedule(prev => {
      const newSchedule = {
      ...prev,
      [dayId]: {
        ...prev[dayId],
        [field]: value
      }
      };
      console.log(`📝 Updated schedule for day ${dayId}:`, newSchedule[dayId]);
      return newSchedule;
    });
  }, []);
  
  // Copy schedule from one day to another
  const copySchedule = useCallback((fromDayId: number, toDayId: number) => {
    const fromSchedule = currentWeekSchedule[fromDayId];
    setCurrentWeekSchedule(prev => ({
      ...prev,
      [toDayId]: {
        ...fromSchedule,
        isAvailable: true // Ensure the target day is marked as available
      }
    }));
  }, [currentWeekSchedule]);
  
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
      
      console.log('🔄 Saving schedules for doctor:', user.id);
      
      // Get the actual doctor ID from the doctors table
      const doctorId = await getDoctorIdByUserId(user.id);
      if (!doctorId) {
        throw new Error('Doctor profile not found. Please complete your doctor registration first.');
      }
      
      console.log('🔄 Using doctor ID:', doctorId);
      
      // First, check if there are any booked time slots that would prevent changes
      console.log('🔄 Checking for booked time slots...');
      const { data: bookedSlots, error: bookedError } = await supabase
        .from('time_slots')
        .select('id, schedule_date, start_time, status')
        .eq('doctor_id', doctorId)
        .eq('status', 'booked');
      
      if (bookedError) {
        console.error('❌ Error checking booked slots:', bookedError);
        throw bookedError;
      }
      
      if (bookedSlots && bookedSlots.length > 0) {
        const bookedDates = [...new Set(bookedSlots.map(slot => slot.schedule_date))];
        throw new Error(`Cannot modify schedule. You have ${bookedSlots.length} booked appointments on dates: ${bookedDates.join(', ')}. Please contact patients to reschedule before making changes.`);
      }
      
      // Don't mark existing schedules as inactive - just update them directly
      
      // Save schedules for each available day
      const savePromises = [];
      for (const [dayId, schedule] of Object.entries(currentWeekSchedule)) {
        if (schedule.isAvailable && schedule.startTime && schedule.endTime) {
          const dayNumber = parseInt(dayId);
          console.log(`📅 Creating schedule for day ${dayNumber}:`, schedule);
          
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
      
      // Generate time slots for the next 4 weeks (this will handle existing slots properly)
      console.log('🔄 Generating time slots for next 4 weeks...');
      await generateTimeSlotsForNext4Weeks(doctorId);
      
      console.log('✅ Schedule and time slots saved successfully');
      setSaveSuccess(true);
      setSlotsGenerated(true);
      
      // Reload time slots to show the newly generated ones
      await loadExistingTimeSlots();
      
      // Refresh the 4-week schedule check to update button visibility
      await checkSchedulesFor4Weeks();
      
      setTimeout(() => setSaveSuccess(false), 3000);
      
    } catch (error) {
      console.error('❌ Error saving schedules:', error);
      console.error('❌ Error details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
        code: error?.code,
        details: error?.details,
        hint: error?.hint
      });
      
      // Provide more specific error messages
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
    } finally {
      setIsSaving(false);
    }
  }, [currentWeekSchedule, user, profile]);
  
  // Update existing schedules (without generating new time slots)
  const handleUpdateSchedules = useCallback(async () => {
    try {
      setIsUpdating(true);
      setError('');
      setSaveSuccess(false);
      
      // Validate that user is authenticated and has a profile
      if (!user || !profile) {
        throw new Error('Please log in to update schedules.');
      }
      
      console.log('🔄 Updating schedules for doctor:', user.id);
      
      // Get the actual doctor ID from the doctors table
      const doctorId = await getDoctorIdByUserId(user.id);
      if (!doctorId) {
        throw new Error('Doctor profile not found. Please complete your doctor registration first.');
      }
      
      console.log('🔄 Using doctor ID:', doctorId);
      
      // Get the specific week date range (same as loadExistingSchedules)
      const today = new Date();
      const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Find Monday of current week
      const mondayOfCurrentWeek = new Date(today);
      const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay; // If Sunday, go back 6 days; otherwise go to Monday
      mondayOfCurrentWeek.setDate(today.getDate() + daysToMonday);
      
      // Calculate the specific week (currentWeekOffset * 7 days from Monday)
      const startDate = new Date(mondayOfCurrentWeek);
      startDate.setDate(mondayOfCurrentWeek.getDate() + (currentWeekOffset * 7));
      
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6); // Week ends 6 days after start
      
      // First, get existing schedule records for specific week to update them by ID
      const { data: existingSchedules, error: fetchError } = await supabase
        .from('doctor_schedules')
        .select('id, day_of_week, schedule_date, status, is_available')
        .eq('doctor_id', doctorId)
        .gte('schedule_date', startDate.toISOString().split('T')[0])
        .lte('schedule_date', endDate.toISOString().split('T')[0]);
      
      if (fetchError) {
        throw new Error(`Failed to fetch existing schedules: ${fetchError.message}`);
      }
      
      console.log(`🔍 Found ${existingSchedules?.length || 0} existing schedule records for week ${currentWeekOffset + 1}:`, existingSchedules);
      
      // Calculate the specific dates for the current week to match schedules
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      console.log(`🔄 Updating schedules for week ${currentWeekOffset + 1} (${startDateStr} to ${endDateStr})`);
      
      // Update schedules for each day
      const updatePromises = [];
      const updatedRecordIds = new Set(); // Track updated records to avoid duplicates
      
      for (const [dayId, schedule] of Object.entries(currentWeekSchedule)) {
        const dayNumber = parseInt(dayId);
        
        // Calculate the specific date for this day in the current week
        // startDate is Monday, so we need to add the correct offset for each day
        const dayDate = new Date(startDate);
        const dayOffset = dayNumber === 0 ? 6 : dayNumber - 1; // Sunday = 6 days from Monday, Monday = 0, Tuesday = 1, etc.
        dayDate.setDate(startDate.getDate() + dayOffset);
        const dayDateStr = dayDate.toISOString().split('T')[0];
        
        console.log(`📅 Calculating date for day ${dayNumber}: ${dayDateStr} (offset: ${dayOffset} from Monday)`);
        
        // Find existing schedule record for this specific date
        const existingSchedule = existingSchedules?.find(s => s.schedule_date === dayDateStr);
        
        if (!existingSchedule) {
          console.log(`⚠️ No existing schedule found for date ${dayDateStr} (day ${dayNumber}), skipping update`);
          continue;
        }
        
        // Check if we've already updated this record
        if (updatedRecordIds.has(existingSchedule.id)) {
          console.log(`⚠️ Record ${existingSchedule.id} already updated, skipping duplicate`);
          continue;
        }
        
        updatedRecordIds.add(existingSchedule.id);
        
        if (schedule.isAvailable) {
          // Validate that required times are provided for available days
          if (!schedule.startTime || !schedule.endTime) {
            console.log(`⚠️ Day ${dayNumber} is marked as available but missing start/end times, skipping update`);
            continue;
          }
          
          console.log(`📅 Updating existing schedule ID ${existingSchedule.id} for date ${dayDateStr} (day ${dayNumber}):`, schedule);
          
          // Ensure consistent time format (HH:MM:SS)
          const formatTime = (time: string) => {
            if (!time) return null;
            // If time is in HH:MM format, add :00 for seconds
            if (time.length === 5 && time.includes(':')) {
              return time + ':00';
            }
            return time;
          };
          
          const startTime = formatTime(schedule.startTime);
          const endTime = formatTime(schedule.endTime);
          const breakStartTime = formatTime(schedule.breakStartTime || '');
          const breakEndTime = formatTime(schedule.breakEndTime || '');
          
          console.log(`📅 Formatted times - Start: ${startTime}, End: ${endTime}, Break: ${breakStartTime}-${breakEndTime}`);
          
          // Update by ID to ensure we're updating the correct record
          const updateData = {
            start_time: startTime,
            end_time: endTime,
            slot_duration_minutes: schedule.slotDuration,
            break_start_time: breakStartTime || null,
            break_end_time: breakEndTime || null,
            is_available: true,
            status: 'active'
          };
          
          console.log(`📤 Sending update data for ID ${existingSchedule.id}:`, updateData);
          
          const updatePromise = supabase
            .from('doctor_schedules')
            .update(updateData)
            .eq('id', existingSchedule.id);
          updatePromises.push(updatePromise);
        } else {
          // Mark day as unavailable - keep original times, just change status
          console.log(`📅 Marking existing schedule ID ${existingSchedule.id} for date ${dayDateStr} (day ${dayNumber}) as unavailable`);
          
          const inactiveUpdateData = {
            is_available: false,
            status: 'inactive'
          };
          
          console.log(`📤 Sending inactive update data for ID ${existingSchedule.id}:`, inactiveUpdateData);
          
          const updatePromise = supabase
            .from('doctor_schedules')
            .update(inactiveUpdateData)
            .eq('id', existingSchedule.id);
          updatePromises.push(updatePromise);
        }
      }
      
      // Wait for all updates to complete and check for errors
      console.log(`🔄 Executing ${updatePromises.length} update operations...`);
      const results = await Promise.all(updatePromises);
      
      // Log detailed results for debugging
      console.log('📊 Update results:', results);
      results.forEach((result, index) => {
        if (result.error) {
          console.error(`❌ Update ${index + 1} failed:`, result.error);
        } else {
          console.log(`✅ Update ${index + 1} succeeded:`, result.data);
        }
      });
      
      // Check if any of the updates failed
      const hasErrors = results.some(result => result.error);
      if (hasErrors) {
        const errors = results.filter(result => result.error).map(result => result.error);
        console.error('❌ Update errors:', errors);
        console.error('❌ Failed results:', results.filter(result => result.error));
        throw new Error(`Failed to update some schedules: ${errors[0]?.message || 'Unknown error'}`);
      }
      
      console.log(`✅ Successfully updated ${results.length} schedule records`);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
    } catch (error) {
      console.error('❌ Error updating schedules:', error);
      setError(error instanceof Error ? error.message : 'Failed to update schedule. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  }, [currentWeekSchedule, user, profile]);
  
  // Clear all schedules
  const clearAllSchedules = useCallback(async () => {
    try {
      setIsSaving(true);
      setError('');
      
      // Reset form
      setCurrentWeekSchedule({
        1: { isAvailable: false, startTime: '', endTime: '', slotDuration: 15, breakStartTime: '', breakEndTime: '' },
        2: { isAvailable: false, startTime: '', endTime: '', slotDuration: 15, breakStartTime: '', breakEndTime: '' },
        3: { isAvailable: false, startTime: '', endTime: '', slotDuration: 15, breakStartTime: '', breakEndTime: '' },
        4: { isAvailable: false, startTime: '', endTime: '', slotDuration: 15, breakStartTime: '', breakEndTime: '' },
        5: { isAvailable: false, startTime: '', endTime: '', slotDuration: 15, breakStartTime: '', breakEndTime: '' },
        6: { isAvailable: false, startTime: '', endTime: '', slotDuration: 15, breakStartTime: '', breakEndTime: '' },
        0: { isAvailable: false, startTime: '', endTime: '', slotDuration: 15, breakStartTime: '', breakEndTime: '' }
      });
      
      console.log('✅ Cleared all schedules');
      
    } catch (error) {
      console.error('❌ Error clearing schedules:', error);
      setError('Failed to clear schedules. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Authentication handlers
  const handleLoginClick = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  const handleInlineLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setLoginError('Please enter both email and password');
      return;
    }

    setIsLoggingIn(true);
    setLoginError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        setLoginError(error.message);
      } else {
        console.log('✅ Login successful:', data);
        // The useAuth hook will automatically update the authentication state
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      setLoginError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleInlineSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupEmail || !signupPassword || !signupConfirmPassword) {
      setSignupError('Please fill in all fields');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setSignupError('Passwords do not match');
      return;
    }

    if (signupPassword.length < 6) {
      setSignupError('Password must be at least 6 characters');
      return;
    }

    setIsSigningUp(true);
    setSignupError('');

    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
      });

      if (error) {
        setSignupError(error.message);
      } else {
        console.log('✅ Signup successful:', data);
        // Show doctor registration form after successful signup
        setShowDoctorRegistration(true);
        setIsSignupMode(false);
      }
    } catch (error) {
      console.error('❌ Signup error:', error);
      setSignupError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPasswordEmail) {
      setForgotPasswordError('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotPasswordEmail)) {
      setForgotPasswordError('Please enter a valid email address');
      return;
    }

    setIsSendingReset(true);
    setForgotPasswordError('');
    setForgotPasswordSuccess('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setForgotPasswordError(error.message);
      } else {
        setForgotPasswordSuccess('Password reset email sent! Please check your inbox.');
        setForgotPasswordEmail('');
      }
    } catch (error) {
      console.error('❌ Forgot password error:', error);
      setForgotPasswordError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSendingReset(false);
    }
  };

  const toggleSignupMode = () => {
    setIsSignupMode(!isSignupMode);
    setLoginError('');
    setSignupError('');
    setIsForgotPasswordMode(false);
    setForgotPasswordError('');
    setForgotPasswordSuccess('');
  };

  const toggleForgotPasswordMode = () => {
    setIsForgotPasswordMode(!isForgotPasswordMode);
    setLoginError('');
    setSignupError('');
    setIsSignupMode(false);
    setForgotPasswordError('');
    setForgotPasswordSuccess('');
  };

  const handleSignupClick = () => {
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  const handleAuthSuccess = async (authData?: { name?: string; email?: string; phone?: string }) => {
    setShowAuthModal(false);
    console.log('✅ Authentication successful:', authData);
    
    // If this is a signup, show doctor registration form
    if (authMode === 'signup' && authData) {
      setShowDoctorRegistration(true);
    }
    // The useAuth hook will automatically update the authentication state
    // and the component will re-render with the authenticated user
  };

  const handleDoctorRegistrationSuccess = () => {
    setShowDoctorRegistration(false);
    console.log('✅ Doctor registration completed successfully');
    // The dashboard will automatically refresh with the new doctor data
  };

  // Show loading state while determining initial authentication
  if (isLoadingInitialAuth) {
    return (
      <div className="min-h-screen bg-[#F6F6F6] dark:bg-gray-900 text-[#0A2647] dark:text-gray-100 transition-colors duration-300">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0075A2] dark:border-[#0EA5E9] mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading...</p>
          </div>
            </div>
      </div>
    );
  }

  // Authentication check - require proper login
  const isTestMode = false; // Set to false in production
  
  // Doctor data state
  const [doctor, setDoctor] = useState<any>(null);
  const [isLoadingDoctor, setIsLoadingDoctor] = useState(false);
  
  // Check if schedules exist for rolling 4-week period (current week + next 3 weeks)
  const checkSchedulesFor4Weeks = useCallback(async () => {
    try {
      if (!user || !profile) {
        setHasSchedulesFor4Weeks(false);
        return;
      }

      const doctorId = await getDoctorIdByUserId(user.id);
      if (!doctorId) {
        setHasSchedulesFor4Weeks(false);
        return;
      }

      // Calculate rolling 4-week period starting from current week's Monday
      const today = new Date();
      const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Find Monday of current week
      const mondayOfCurrentWeek = new Date(today);
      const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay; // If Sunday, go back 6 days; otherwise go to Monday
      mondayOfCurrentWeek.setDate(today.getDate() + daysToMonday);
      
      // Calculate 4-week period (28 days) starting from current week's Monday
      const startDate = new Date(mondayOfCurrentWeek);
      const endDate = new Date(mondayOfCurrentWeek);
      endDate.setDate(mondayOfCurrentWeek.getDate() + 27); // 4 weeks = 28 days
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      console.log(`🔍 Checking rolling 4-week schedules: ${startDateStr} to ${endDateStr}`);
      
      // Count how many days in the 4-week period have schedules
      const { data: schedules, error } = await supabase
        .from('doctor_schedules')
        .select('schedule_date')
        .eq('doctor_id', doctorId)
        .gte('schedule_date', startDateStr)
        .lte('schedule_date', endDateStr)
        .not('schedule_date', 'is', null); // Only count records with actual dates
      
      if (error) {
        console.error('❌ Error checking 4-week schedules:', error);
        setHasSchedulesFor4Weeks(false);
        return;
      }
      
      // Count unique dates
      const uniqueDates = new Set(schedules?.map(s => s.schedule_date) || []);
      const totalDays = 28; // 4 weeks * 7 days
      
      console.log(`📊 Found schedules for ${uniqueDates.size} out of ${totalDays} days in rolling 4-week period`);
      
      // Consider schedules exist if we have schedules for at least 80% of the days (22+ days)
      // This accounts for weekends or days when doctor might not work
      const hasEnoughSchedules = uniqueDates.size >= 22;
      setHasSchedulesFor4Weeks(hasEnoughSchedules);
      
      console.log(`✅ Rolling 4-week schedule check: ${hasEnoughSchedules ? 'Schedules exist' : 'No schedules'}`);
      
    } catch (error) {
      console.error('❌ Error in checkSchedulesFor4Weeks:', error);
      setHasSchedulesFor4Weeks(false);
    }
  }, [user, profile]);

  // Load existing schedules from database for a specific week
  const loadExistingSchedules = useCallback(async (weekOffset = 0) => {
    try {
      if (!user || !profile) {
        console.log('No user or profile for schedule loading');
        return;
      }
      
      console.log('Loading schedules for user:', user.id);
      
      // Get the actual doctor ID from the doctors table
      const doctorId = await getDoctorIdByUserId(user.id);
      console.log('Found doctor ID:', doctorId);
      
      if (!doctorId) {
        console.log('No doctor ID found');
        return;
      }
      
      // Calculate the specific week based on offset
      const today = new Date();
      const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Find Monday of current week
      const mondayOfCurrentWeek = new Date(today);
      const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay; // If Sunday, go back 6 days; otherwise go to Monday
      mondayOfCurrentWeek.setDate(today.getDate() + daysToMonday);
      
      // Calculate the specific week (weekOffset * 7 days from Monday)
      const startDate = new Date(mondayOfCurrentWeek);
      startDate.setDate(mondayOfCurrentWeek.getDate() + (weekOffset * 7));
      
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6); // Week ends 6 days after start
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      console.log(`Week ${weekOffset + 1} from Monday:`, startDateStr, 'to', endDateStr);
      
      // Query database directly for specific week
      const { data: schedules, error: weekError } = await supabase
        .from('doctor_schedules')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('status', 'active')
        .gte('schedule_date', startDateStr)
        .lte('schedule_date', endDateStr)
        .order('schedule_date');
      
      if (weekError) {
        console.error(`Error loading week ${weekOffset + 1} schedules:`, weekError);
        return;
      }
      
      console.log(`Schedules for week ${weekOffset + 1}:`, schedules);
      
      if (schedules && schedules.length > 0) {
        console.log(`Found schedules for week ${weekOffset + 1}:`, schedules);
        
        // Convert database schedules to form format
        const loadedSchedule: ScheduleForm = {
          1: { isAvailable: false, startTime: '', endTime: '', slotDuration: 15, breakStartTime: '', breakEndTime: '' },
          2: { isAvailable: false, startTime: '', endTime: '', slotDuration: 15, breakStartTime: '', breakEndTime: '' },
          3: { isAvailable: false, startTime: '', endTime: '', slotDuration: 15, breakStartTime: '', breakEndTime: '' },
          4: { isAvailable: false, startTime: '', endTime: '', slotDuration: 15, breakStartTime: '', breakEndTime: '' },
          5: { isAvailable: false, startTime: '', endTime: '', slotDuration: 15, breakStartTime: '', breakEndTime: '' },
          6: { isAvailable: false, startTime: '', endTime: '', slotDuration: 15, breakStartTime: '', breakEndTime: '' },
          0: { isAvailable: false, startTime: '', endTime: '', slotDuration: 15, breakStartTime: '', breakEndTime: '' }
        };
        
        // Create a map to store the most recent schedule for each specific date
        const dateScheduleMap = new Map();
        
        schedules.forEach(schedule => {
          const scheduleDate = schedule.schedule_date;
          const existingSchedule = dateScheduleMap.get(scheduleDate);
          
          // If no existing schedule for this date, or if this schedule is more recent, use this one
          if (!existingSchedule || schedule.created_at > existingSchedule.created_at) {
            dateScheduleMap.set(scheduleDate, schedule);
          }
        });
        
        // Populate the form with the most recent schedule for each specific date
        dateScheduleMap.forEach((schedule, scheduleDate) => {
          const dayId = schedule.day_of_week;
          console.log(`Loading schedule for date ${scheduleDate} (day ${dayId}):`, schedule);
          loadedSchedule[dayId] = {
            isAvailable: schedule.is_available,
            startTime: schedule.start_time || '',
            endTime: schedule.end_time || '',
            slotDuration: schedule.slot_duration_minutes || 15,
            breakStartTime: schedule.break_start_time || '',
            breakEndTime: schedule.break_end_time || ''
          };
        });
        
        console.log('Setting schedule form with:', loadedSchedule);
        setCurrentWeekSchedule(loadedSchedule);
        console.log('Schedule form updated successfully');
      } else {
        console.log('No schedules found for 4-week period');
      }
    } catch (error) {
      console.error('Error in loadExistingSchedules:', error);
    }
  }, [user, profile, currentWeekOffset]);

  // Week navigation functions - limited to 4 weeks (0, 1, 2, 3)
  const goToPreviousWeek = useCallback(async () => {
    if (currentWeekOffset > 0) {
      const newOffset = currentWeekOffset - 1;
      setCurrentWeekOffset(newOffset);
      await loadExistingSchedules(newOffset);
    }
  }, [currentWeekOffset, loadExistingSchedules]);

  const goToNextWeek = useCallback(async () => {
    if (currentWeekOffset < 3) { // Limit to week 4 (offset 3)
      const newOffset = currentWeekOffset + 1;
      setCurrentWeekOffset(newOffset);
      await loadExistingSchedules(newOffset);
    }
  }, [currentWeekOffset, loadExistingSchedules]);
  
  // Load existing time slots for all 4 weeks
  const loadExistingTimeSlots = useCallback(async () => {
    try {
      if (!user || !profile) {
        return;
      }
      
      setIsLoadingSlots(true);
      
      // Get the actual doctor ID from the doctors table
      const doctorId = await getDoctorIdByUserId(user.id);
      if (!doctorId) {
        return;
      }
      
      // Calculate date range for next 4 weeks
      const today = new Date();
      const fourWeeksFromNow = new Date(today);
      fourWeeksFromNow.setDate(today.getDate() + 28);
      
      // Load existing time slots for the next 4 weeks
      const { data: timeSlots, error } = await supabase
        .from('time_slots')
        .select('*')
        .eq('doctor_id', doctorId)
        .gte('schedule_date', today.toISOString().split('T')[0])
        .lte('schedule_date', fourWeeksFromNow.toISOString().split('T')[0])
        .order('schedule_date')
        .order('start_time');
      
      if (error) {
        console.error('❌ Error loading time slots:', error);
        return;
      }
      
      if (timeSlots && timeSlots.length > 0) {
        console.log('✅ Loaded existing time slots:', timeSlots.length, 'slots');
        setExistingTimeSlots(timeSlots);
      } else {
        console.log('No existing time slots found');
        setExistingTimeSlots([]);
      }
    } catch (error) {
      console.error('❌ Error in loadExistingTimeSlots:', error);
    } finally {
      setIsLoadingSlots(false);
    }
  }, [user, profile]);
  
  // Load doctor data and existing schedules when authenticated or in test mode
  useEffect(() => {
    const loadDoctorData = async () => {
      if (isAuthenticated && user && profile) {
        console.log('Starting doctor data loading...');
        setIsLoadingDoctor(true);
        try {
          // Simulate doctor data loading
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Get doctor data from database
          const doctorId = await getDoctorIdByUserId(user.id);
          
          if (doctorId) {
            const { data: doctorData, error: doctorError } = await supabase
              .from('doctors')
              .select('full_name, specialty, email, phone_number, profile_image_url')
              .eq('id', doctorId)
              .single();
            
            if (!doctorError && doctorData) {
              // Use actual doctor data from database
              setDoctor({
                id: doctorId,
                full_name: doctorData.full_name,
                specialty: doctorData.specialty,
                profile_image_url: doctorData.profile_image_url, // Use the actual URL from database
                email: doctorData.email,
                phone: doctorData.phone_number
              });
            } else {
              // Fallback if no doctor data found
              setDoctor({
                id: doctorId,
                full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Doctor',
                specialty: 'Specialty not set',
                profile_image_url: null,
                email: user?.email || '',
                phone: user?.user_metadata?.phone || ''
              });
            }
          } else {
            // No doctor ID found
            setDoctor({
            id: user?.id || 'test-doctor-id',
              full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Doctor',
              specialty: 'Specialty not set',
            profile_image_url: null,
              email: user?.email || '',
              phone: user?.user_metadata?.phone || ''
            });
          }
        } catch (error) {
          console.error('Error loading doctor data:', error);
        } finally {
          setIsLoadingDoctor(false);
        }
      }
    };

    loadDoctorData();
  }, [isAuthenticated, user, profile]);

  // Load schedules after doctor data is available
  useEffect(() => {
    if (doctor && isAuthenticated) {
      console.log('About to load schedules...');
      loadExistingSchedules(currentWeekOffset);
      loadExistingTimeSlots();
      checkSchedulesFor4Weeks(); // Check if 4-week schedules exist
    }
  }, [doctor, isAuthenticated, loadExistingSchedules, loadExistingTimeSlots, currentWeekOffset, checkSchedulesFor4Weeks]);
  
  if (!isAuthenticated && !isTestMode) {
    return (
      <div className="min-h-screen bg-[#F6F6F6] dark:bg-gray-900 text-[#0A2647] dark:text-gray-100 transition-colors duration-300">
        {/* Standard Navigation */}
        <Navigation 
          user={user}
          session={session}
          profile={profile}
          userState={userState}
          isAuthenticated={isAuthenticated}
          handleLogout={handleLogout}
          doctor={null}
        />

        {/* Main Login Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Side - Login Form */}
            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-md">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-[#E8E8E8] dark:border-gray-600 p-8">
                  
                  {/* Header with Logo */}
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h1 className="text-3xl font-bold text-[#0A2647] dark:text-gray-100 mb-2">Doctor Login</h1>
                      <p className="text-gray-600 dark:text-gray-300">Access your professional portal</p>
                    </div>
                    {/* EaseHealth.AI Logo */}
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-[#0075A2] to-[#0A2647] rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">E</span>
                      </div>
                      <span className="text-[#0075A2] font-semibold text-sm">EaseHealth.AI</span>
                    </div>
                  </div>

                  {/* Login/Signup/Forgot Password Form */}
                  {!isSignupMode && !isForgotPasswordMode ? (
                    <form onSubmit={handleInlineLogin} className="space-y-6">
                      {/* Error Message */}
                      {loginError && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                          <p className="text-red-700 dark:text-red-300 text-sm">{loginError}</p>
                        </div>
                      )}

                      {/* Email Field */}
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          id="email"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0075A2] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                          placeholder="Enter your email address"
                          required
                        />
                      </div>

                      {/* Password Field */}
                      <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Password
                        </label>
                        <input
                          type="password"
                          id="password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0075A2] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                          placeholder="Enter your password"
                          required
                        />
                      </div>

                      {/* Login Button */}
                      <button
                        type="submit"
                        disabled={isLoggingIn}
                        className="w-full bg-gradient-to-r from-[#0075A2] to-[#0A2647] text-white py-3 rounded-lg font-semibold text-lg hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {isLoggingIn ? (
                          <div className="flex items-center justify-center space-x-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                            <span>LOGGING IN...</span>
                          </div>
                        ) : (
                          'LOGIN'
                        )}
                      </button>
                    </form>
                  ) : isSignupMode ? (
                    <form onSubmit={handleInlineSignup} className="space-y-6">
                      {/* Error Message */}
                      {signupError && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                          <p className="text-red-700 dark:text-red-300 text-sm">{signupError}</p>
                        </div>
                      )}

                      {/* Email Field */}
                      <div>
                        <label htmlFor="signupEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          id="signupEmail"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0075A2] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                          placeholder="Enter your email address"
                          required
                        />
                      </div>

                      {/* Password Field */}
                      <div>
                        <label htmlFor="signupPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Password
                        </label>
                        <input
                          type="password"
                          id="signupPassword"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0075A2] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                          placeholder="Enter your password"
                          required
                          minLength={6}
                        />
                      </div>

                      {/* Confirm Password Field */}
                      <div>
                        <label htmlFor="signupConfirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          id="signupConfirmPassword"
                          value={signupConfirmPassword}
                          onChange={(e) => setSignupConfirmPassword(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0075A2] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                          placeholder="Confirm your password"
                          required
                          minLength={6}
                        />
                      </div>

                      {/* Signup Button */}
                      <button
                        type="submit"
                        disabled={isSigningUp}
                        className="w-full bg-gradient-to-r from-[#0075A2] to-[#0A2647] text-white py-3 rounded-lg font-semibold text-lg hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {isSigningUp ? (
                          <div className="flex items-center justify-center space-x-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                            <span>CREATING ACCOUNT...</span>
                          </div>
                        ) : (
                          'CREATE ACCOUNT'
                        )}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleForgotPassword} className="space-y-6">
                      {/* Success Message */}
                      {forgotPasswordSuccess && (
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                          <p className="text-green-700 dark:text-green-300 text-sm">{forgotPasswordSuccess}</p>
                        </div>
                      )}

                      {/* Error Message */}
                      {forgotPasswordError && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                          <p className="text-red-700 dark:text-red-300 text-sm">{forgotPasswordError}</p>
                        </div>
                      )}

                      {/* Email Field */}
                      <div>
                        <label htmlFor="forgotPasswordEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          id="forgotPasswordEmail"
                          value={forgotPasswordEmail}
                          onChange={(e) => setForgotPasswordEmail(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0075A2] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                          placeholder="Enter your email address"
                          required
                        />
                      </div>

                      {/* Send Reset Email Button */}
                      <button
                        type="submit"
                        disabled={isSendingReset}
                        className="w-full bg-gradient-to-r from-[#0075A2] to-[#0A2647] text-white py-3 rounded-lg font-semibold text-lg hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {isSendingReset ? (
                          <div className="flex items-center justify-center space-x-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                            <span>SENDING...</span>
                          </div>
                        ) : (
                          'SEND RESET EMAIL'
                        )}
                      </button>
                    </form>
                  )}

                  {/* Footer Links */}
                  <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex justify-between items-center text-sm">
                      <button
                        onClick={isForgotPasswordMode ? toggleForgotPasswordMode : toggleSignupMode}
                        className="text-gray-600 dark:text-gray-300 hover:text-[#0075A2] dark:hover:text-[#0EA5E9] transition-colors"
                      >
                        {isSignupMode ? 'Already have an account?' : 
                         isForgotPasswordMode ? 'Back to Login' : 
                         "Don't have your account?"}
                      </button>
                      {!isSignupMode && !isForgotPasswordMode && (
                        <button 
                          onClick={toggleForgotPasswordMode}
                          className="text-[#0075A2] dark:text-[#0EA5E9] hover:underline transition-colors"
                        >
                          Forgot Password?
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Back to Home Link */}
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => window.location.href = '/'}
                      className="text-gray-600 dark:text-gray-300 hover:text-[#0075A2] dark:hover:text-[#0EA5E9] transition-colors text-sm"
                    >
                      ← Back to Home
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Image */}
            <div className="hidden lg:flex lg:justify-start">
              <div className="relative w-full max-w-lg">
                {/* Main Image with Decorative Elements */}
                <div className="relative">
                  <img 
                    src="/Doctor Login Image.png" 
                    alt="Healthcare Technology" 
                    className="w-full h-auto rounded-2xl shadow-2xl border border-[#E8E8E8] dark:border-gray-600"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/digital pre-registration.png';
                    }}
                  />
                  
                  {/* Decorative Circles */}
                  <div className="absolute -top-4 -right-4 w-16 h-16 bg-blue-200 dark:bg-blue-900/30 rounded-full opacity-60"></div>
                  <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-blue-100 dark:bg-blue-800/30 rounded-full opacity-80"></div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Auth Modal */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
          mode={authMode}
          context={{
            title: authMode === 'login' ? 'Sign In as Doctor' : 'Register as Doctor',
            description: authMode === 'login' 
              ? 'Welcome back! Please sign in to access your doctor dashboard.'
              : 'Join EaseHealth as a medical professional and start managing your practice.',
            actionText: authMode === 'login' ? 'Sign In' : 'Register'
          }}
        />
        
        {/* Doctor Registration Modal */}
        <UnifiedDoctorRegistrationForm
          isOpen={showDoctorRegistration}
          onClose={() => setShowDoctorRegistration(false)}
          onSuccess={handleDoctorRegistrationSuccess}
          userId={user?.id}
          prefillData={user ? {
            fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
            email: user.email || '',
            mobileNumber: user.user_metadata?.phone || ''
          } : undefined}
        />
      </div>
    );
  }

  // Show loading while fetching doctor data
  if (isLoadingDoctor) {
    return (
      <div className="min-h-screen bg-[#F6F6F6] dark:bg-gray-900 text-[#0A2647] dark:text-gray-100 transition-colors duration-300">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0075A2] dark:border-[#0EA5E9] mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading doctor information...</p>
            </div>
          </div>
      </div>
    );
  }

  // Show main dashboard content
    return (
      <div className="min-h-screen bg-[#F6F6F6] dark:bg-gray-900 text-[#0A2647] dark:text-gray-100 transition-colors duration-300">
        {/* Standard Navigation */}
        <Navigation 
          user={user}
          session={session}
          profile={profile}
          userState={userState}
          isAuthenticated={isAuthenticated}
          handleLogout={handleLogout}
          doctor={doctor}
        />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link 
          to="/" 
          className="inline-flex items-center text-[#0075A2] dark:text-[#0EA5E9] hover:text-[#0A2647] dark:hover:text-gray-100 transition-colors mb-8"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>

        {/* Doctor Dashboard Header */}
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
                  getInitials(doctor?.full_name || user?.user_metadata?.full_name || 'Doctor')
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#0A2647] dark:text-gray-100">
                  <span className="text-[#0075A2] dark:text-[#0EA5E9]">{doctor?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Doctor'}</span> Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-300 text-lg">{doctor?.specialty || 'Specialty not set'}</p>
                {doctor?.email && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{doctor.email}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Last login</p>
              <p className="text-lg font-semibold text-[#0A2647] dark:text-gray-100">
                {new Date().toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {new Date().toLocaleTimeString('en-GB', { hour12: false })}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 border border-[#E8E8E8] dark:border-gray-600">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {[
              { id: 'overview', label: 'Overview', icon: Calendar },
              { id: 'schedule', label: 'Schedule', icon: Clock },
              { id: 'patients', label: 'Patients', icon: User },
                { id: 'reports', label: 'Reports', icon: FileText }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-md font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-gray-600 text-[#0075A2] dark:text-[#0EA5E9] shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-[#0075A2] dark:hover:text-[#0EA5E9]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-[#E8E8E8] dark:border-gray-600">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                    <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Today's Appointments</p>
                    <p className="text-2xl font-bold text-[#0A2647] dark:text-gray-100">8</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-[#E8E8E8] dark:border-gray-600">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                    <User className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Patients</p>
                    <p className="text-2xl font-bold text-[#0A2647] dark:text-gray-100">142</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-[#E8E8E8] dark:border-gray-600">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                    <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Pending Reviews</p>
                    <p className="text-2xl font-bold text-[#0A2647] dark:text-gray-100">3</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-[#E8E8E8] dark:border-gray-600">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                    <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Reports Generated</p>
                    <p className="text-2xl font-bold text-[#0A2647] dark:text-gray-100">24</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Schedule Management Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-[#E8E8E8] dark:border-gray-600 flex flex-col items-center justify-center text-center">
                <Calendar className="w-16 h-16 text-[#0075A2] dark:text-[#0EA5E9] mb-4" />
                <h2 className="text-2xl font-bold text-[#0A2647] dark:text-gray-100 mb-2">Schedule Management</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">Manage your availability and appointments.</p>
                <button 
                  onClick={() => setActiveTab('schedule')}
                  className="bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-1 transition-all focus-ring"
                >
                  Go to Schedule
                  </button>
              </div>

              {/* Patient Records Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-[#E8E8E8] dark:border-gray-600 flex flex-col items-center justify-center text-center">
                <User className="w-16 h-16 text-[#0075A2] dark:text-[#0EA5E9] mb-4" />
                <h2 className="text-2xl font-bold text-[#0A2647] dark:text-gray-100 mb-2">Patient Records</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">Access and manage patient information.</p>
                <button 
                  onClick={() => setActiveTab('patients')}
                  className="bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-1 transition-all focus-ring"
                >
                  View Patients
                  </button>
              </div>
              
              {/* Reports Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-[#E8E8E8] dark:border-gray-600 flex flex-col items-center justify-center text-center">
                <FileText className="w-16 h-16 text-[#0075A2] dark:text-[#0EA5E9] mb-4" />
                <h2 className="text-2xl font-bold text-[#0A2647] dark:text-gray-100 mb-2">Reports</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">Generate and view various reports.</p>
                <button 
                  onClick={() => setActiveTab('reports')}
                  className="bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-1 transition-all focus-ring"
                >
                  View Reports
                </button>
                      </div>
                      </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-[#E8E8E8] dark:border-gray-600">
              <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">Appointment completed with John Doe</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">2 hours ago</span>
                    </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">New patient registration: Jane Smith</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">4 hours ago</span>
                        </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">Schedule updated for next week</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">1 day ago</span>
                      </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="space-y-6">
            {/* Week Navigation */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-[#E8E8E8] dark:border-gray-600">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-[#0A2647] dark:text-gray-100">Schedule Management</h2>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={goToPreviousWeek}
                    disabled={currentWeekOffset === 0}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-lg font-medium text-[#0A2647] dark:text-gray-100 min-w-[200px] text-center">
                    Week {currentWeekOffset + 1}
                  </span>
                  <button
                    onClick={goToNextWeek}
                    disabled={currentWeekOffset >= 3}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
            </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Week {currentWeekOffset + 1} of 4 • {weekRange.start} - {weekRange.end}
              </p>
            </div>

            {/* Schedule Form */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-[#E8E8E8] dark:border-gray-600">
          <div className="space-y-6">
                {daysOfWeek.map((day) => {
                  const weekDate = currentWeekDates.find(d => d.dayOfWeek === day.id);
                  const schedule = currentWeekSchedule[day.id];
                  const isPast = weekDate?.isPast || false;
                  const isToday = weekDate?.isToday || false;
                  
                  return (
                    <div key={day.id} className={`p-6 rounded-xl border-2 transition-all ${
                      isPast 
                        ? 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50' 
                        : 'border-[#E8E8E8] dark:border-gray-600 bg-white dark:bg-gray-800'
                    }`}>
                      <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                          <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                              checked={schedule.isAvailable}
                        onChange={(e) => handleScheduleChange(day.id, 'isAvailable', e.target.checked)}
                              disabled={isPast}
                              className="w-5 h-5 text-[#0075A2] dark:text-[#0EA5E9] rounded focus:ring-2 focus:ring-[#0075A2] dark:focus:ring-[#0EA5E9]"
                            />
                            <span className={`text-lg font-medium ${
                              isPast 
                                ? 'text-gray-400 dark:text-gray-500' 
                                : 'text-[#0A2647] dark:text-gray-100'
                            }`}>
                              {day.name}
                            </span>
                            {weekDate && (
                              <span className={`text-sm px-2 py-1 rounded ${
                                isPast 
                                  ? 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400' 
                                  : isToday
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                              }`}>
                                {isPast ? 'Past' : isToday ? 'Today' : weekDate.dateString}
                              </span>
                            )}
                    </label>
                  </div>
                        
                        {!isPast && schedule.isAvailable && (
                          <div className="flex space-x-2">
                            {daysOfWeek.filter(d => d.id !== day.id).map((otherDay) => (
                    <button
                                key={otherDay.id}
                                onClick={() => copySchedule(day.id, otherDay.id)}
                                className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                                Copy to {otherDay.name}
                    </button>
                            ))}
                          </div>
                  )}
                </div>

                      {schedule.isAvailable && !isPast && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {/* Start Time */}
                    <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Start Time
                      </label>
                      <input
                        type="time"
                              value={schedule.startTime}
                        onChange={(e) => handleScheduleChange(day.id, 'startTime', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0075A2] dark:focus:ring-[#0EA5E9] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>

                          {/* End Time */}
                    <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        End Time
                      </label>
                      <input
                        type="time"
                              value={schedule.endTime}
                        onChange={(e) => handleScheduleChange(day.id, 'endTime', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0075A2] dark:focus:ring-[#0EA5E9] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>

                          {/* Slot Duration */}
                    <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Slot Duration
                      </label>
                      <select
                              value={schedule.slotDuration}
                        onChange={(e) => handleScheduleChange(day.id, 'slotDuration', parseInt(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0075A2] dark:focus:ring-[#0EA5E9] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        {slotDurations.map((duration) => (
                          <option key={duration.value} value={duration.value}>
                            {duration.label}
                          </option>
                        ))}
                      </select>
                    </div>

                          {/* Break Time */}
                    <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Break Time (Optional)
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="time"
                                value={schedule.breakStartTime}
                          onChange={(e) => handleScheduleChange(day.id, 'breakStartTime', e.target.value)}
                          placeholder="Start"
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0075A2] dark:focus:ring-[#0EA5E9] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                        <input
                          type="time"
                                value={schedule.breakEndTime}
                          onChange={(e) => handleScheduleChange(day.id, 'breakEndTime', e.target.value)}
                          placeholder="End"
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0075A2] dark:focus:ring-[#0EA5E9] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                    </div>
                  </div>
                )}

                      {isPast && (
                        <div className="text-center py-4">
                          <p className="text-gray-400 dark:text-gray-500 italic">Past dates cannot be edited</p>
              </div>
                      )}
                    </div>
                  );
                })}
          </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
            {/* Show Update button only when schedules exist for 4 weeks */}
            {hasSchedulesFor4Weeks && (
              <button
                onClick={handleUpdateSchedules}
                disabled={isUpdating || isSaving}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isUpdating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Update Schedule</span>
                  </>
                )}
              </button>
            )}

            {/* Show Generate button only when NO schedules exist for 4 weeks */}
            {!hasSchedulesFor4Weeks && (
            <button
              onClick={handleSaveSchedules}
                disabled={isSaving || isUpdating}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] text-white rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSaving ? (
                <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Generating...</span>
                </>
              ) : (
                <>
                      <Save className="w-4 h-4" />
                    <span>Generate New Schedule & Time Slots</span>
                </>
              )}
            </button>
            )}

                <button
                  onClick={clearAllSchedules}
                  disabled={isSaving}
                  className="flex items-center space-x-2 px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-4 h-4" />
                  <span>Clear All</span>
                </button>

                    </div>

              {/* Success/Error Messages */}
              {saveSuccess && (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <p className="text-green-700 dark:text-green-300">Schedule and time slots generated successfully for the next 4 weeks!</p>
              </div>
            </div>
          )}

              {error && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                    <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
                      </div>
              )}
          </div>
          </div>
        )}

        {/* Time Slots Display Section - Hidden initially as requested */}
        {false && activeTab === 'schedule' && existingTimeSlots.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-[#E8E8E8] dark:border-gray-600">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100">Generated Time Slots (Next 4 Weeks)</h3>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">{existingTimeSlots.length} slots generated</span>
              </div>
            </div>
            
            {isLoadingSlots ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0075A2] dark:border-[#0EA5E9] mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-300">Loading time slots...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Group slots by week */}
                {Array.from({ length: 4 }, (_, weekIndex) => {
                  const weekStart = new Date();
                  weekStart.setDate(weekStart.getDate() + (weekIndex * 7));
                  const weekEnd = new Date(weekStart);
                  weekEnd.setDate(weekStart.getDate() + 6);
                  
                  const weekSlots = existingTimeSlots.filter(slot => {
                    const slotDate = new Date(slot.schedule_date);
                    return slotDate >= weekStart && slotDate <= weekEnd;
                  });
                  
                  if (weekSlots.length === 0) return null;
                  
                  return (
                    <div key={weekIndex} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <h4 className="font-semibold text-[#0A2647] dark:text-gray-100 mb-3">
                        Week {weekIndex + 1}: {weekStart.toLocaleDateString()} - {weekEnd.toLocaleDateString()}
                      </h4>
                      
                      {/* Group slots by date */}
                      {Array.from(new Set(weekSlots.map(slot => slot.schedule_date))).map(date => {
                        const dateSlots = weekSlots.filter(slot => slot.schedule_date === date);
                        const dateObj = new Date(date);
                        
                        return (
                          <div key={date} className="mb-3 last:mb-0">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {dateSlots.length} slots
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                              {dateSlots.map(slot => (
                                <div
                                  key={slot.id}
                                  className={`px-2 py-1 rounded text-xs text-center ${
                                    slot.status === 'available'
                                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                      : slot.status === 'booked'
                                      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                      : slot.status === 'blocked'
                                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                      : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                  }`}
                                >
                                  {slot.start_time}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'patients' && (
          <div className="space-y-6">
            {/* Patient Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-[#E8E8E8] dark:border-gray-600">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                    <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Patients</p>
                    <p className="text-2xl font-bold text-[#0A2647] dark:text-gray-100">142</p>
                  </div>
              </div>
            </div>
            
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-[#E8E8E8] dark:border-gray-600">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Active Patients</p>
                    <p className="text-2xl font-bold text-[#0A2647] dark:text-gray-100">128</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-[#E8E8E8] dark:border-gray-600">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                    <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">New This Month</p>
                    <p className="text-2xl font-bold text-[#0A2647] dark:text-gray-100">12</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Patient List */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-[#E8E8E8] dark:border-gray-600">
              <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-4">Recent Patients</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                      JD
                    </div>
                    <div>
                      <p className="font-medium text-[#0A2647] dark:text-gray-100">John Doe</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Last visit: 2 days ago</p>
                        </div>
                        </div>
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm">
                    Active
                  </span>
                      </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                      JS
                    </div>
                    <div>
                      <p className="font-medium text-[#0A2647] dark:text-gray-100">Jane Smith</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Last visit: 1 week ago</p>
                  </div>
                      </div>
                  <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-sm">
                    Follow-up
                      </span>
                    </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-medium">
                      MB
                    </div>
                    <div>
                      <p className="font-medium text-[#0A2647] dark:text-gray-100">Mike Brown</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Last visit: 3 days ago</p>
                  </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm">
                    Active
                  </span>
                </div>
              </div>
              </div>
            </div>
          )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* Report Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-[#E8E8E8] dark:border-gray-600">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                    <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Reports</p>
                    <p className="text-2xl font-bold text-[#0A2647] dark:text-gray-100">24</p>
                  </div>
                </div>
            </div>
            
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-[#E8E8E8] dark:border-gray-600">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                    <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">This Month</p>
                    <p className="text-2xl font-bold text-[#0A2647] dark:text-gray-100">8</p>
                      </div>
                    </div>
                  </div>
                  
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-[#E8E8E8] dark:border-gray-600">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                    <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Pending</p>
                    <p className="text-2xl font-bold text-[#0A2647] dark:text-gray-100">2</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Report Types */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-[#E8E8E8] dark:border-gray-600">
                <h3 className="text-lg font-bold text-[#0A2647] dark:text-gray-100 mb-4">Quick Reports</h3>
                <div className="space-y-3">
                  <button className="w-full text-left p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    <p className="font-medium text-[#0A2647] dark:text-gray-100">Patient Summary Report</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Generate patient activity summary</p>
                          </button>
                  <button className="w-full text-left p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    <p className="font-medium text-[#0A2647] dark:text-gray-100">Appointment Analytics</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">View appointment trends and statistics</p>
                  </button>
                  <button className="w-full text-left p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    <p className="font-medium text-[#0A2647] dark:text-gray-100">Revenue Report</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Track financial performance</p>
                          </button>
                        </div>
                      </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-[#E8E8E8] dark:border-gray-600">
                <h3 className="text-lg font-bold text-[#0A2647] dark:text-gray-100 mb-4">Recent Reports</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-[#0A2647] dark:text-gray-100">Monthly Summary</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Generated 2 days ago</p>
                  </div>
                    <button className="text-[#0075A2] dark:text-[#0EA5E9] hover:underline text-sm">
                      Download
                    </button>
                </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-[#0A2647] dark:text-gray-100">Patient List</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Generated 1 week ago</p>
                    </div>
                    <button className="text-[#0075A2] dark:text-[#0EA5E9] hover:underline text-sm">
                      Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
        </div>
        )}
      </main>
      
      {/* Doctor Registration Modal for authenticated users */}
      <UnifiedDoctorRegistrationForm
        isOpen={showDoctorRegistration}
        onClose={() => setShowDoctorRegistration(false)}
        onSuccess={handleDoctorRegistrationSuccess}
        userId={user?.id}
        prefillData={user ? {
          fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
          email: user.email || '',
          mobileNumber: user.user_metadata?.phone || ''
        } : undefined}
      />
    </div>
  );
}

export default DoctorDashboardPage;