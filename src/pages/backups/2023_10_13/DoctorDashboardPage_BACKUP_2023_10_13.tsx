import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Calendar, Clock, Save, ChevronLeft, ChevronRight, X, CheckCircle, AlertCircle, User, FileText, ArrowLeft, Shield
} from 'lucide-react';
import Navigation from '../components/Navigation';
import AuthModal from '../components/AuthModal';
import UnifiedDoctorRegistrationForm from '../components/UnifiedDoctorRegistrationForm';
import { createDoctorSchedulesForNext4Weeks, generateTimeSlotsForNext4Weeks, getDoctorIdByUserId, supabase } from '../utils/supabase';

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
  const navigate = useNavigate();
  
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
    userState: userState,
    isAuthenticated: isAuthenticated,
    isLoadingInitialAuth: isLoadingInitialAuth,
    isProfileLoading: isProfileLoading
  });

  // Test mode state
  const [isTestMode, setIsTestMode] = useState(false);
  
  // Doctor data state
  const [doctor, setDoctor] = useState<any>(null);
  const [isLoadingDoctor, setIsLoadingDoctor] = useState(true);
  const [doctorError, setDoctorError] = useState<string>('');
  
  // Schedule management state
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [existingSchedules, setExistingSchedules] = useState<any[]>([]);
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
    7: { isAvailable: false, startTime: '', endTime: '', slotDuration: 15, breakStartTime: '', breakEndTime: '' }
  });

  // Authentication states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDoctorRegistration, setShowDoctorRegistration] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Helper function to get week dates
  const getWeekDates = (weekOffset: number) => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysUntilMonday = currentDay === 0 ? 6 : currentDay - 1; // Days to subtract to get to Monday
    
    const mondayOfCurrentWeek = new Date(today);
    mondayOfCurrentWeek.setDate(today.getDate() - daysUntilMonday);
    
    // Add the week offset (7 days per week)
    const mondayOfTargetWeek = new Date(mondayOfCurrentWeek);
    mondayOfTargetWeek.setDate(mondayOfCurrentWeek.getDate() + (weekOffset * 7));
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(mondayOfTargetWeek);
      date.setDate(mondayOfTargetWeek.getDate() + i);
      
      weekDates.push({
        date: date.toISOString().split('T')[0],
        dayName: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][i],
        isToday: date.toDateString() === today.toDateString()
      });
    }
    
    return weekDates;
  };

  // Helper function to get initials
  const getInitials = (name: string): string => {
    if (!name) return 'D';
    
    const words = name.trim().split(/\s+/);
    const filteredWords = words.filter(word => word.length > 0);
    
    if (filteredWords.length === 0) return 'D';
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
  const copyScheduleToDay = useCallback((fromDayId: number, toDayId: number) => {
    const fromSchedule = currentWeekSchedule[fromDayId];
    setCurrentWeekSchedule(prev => ({
      ...prev,
      [toDayId]: {
        ...fromSchedule,
        isAvailable: true // Ensure the target day is marked as available
      }
    }));
  }, [currentWeekSchedule]);

  // Check all days
  const handleCheckAll = useCallback(() => {
    setCurrentWeekSchedule(prev => {
      const newSchedule = { ...prev };
      for (let i = 1; i <= 7; i++) {
        newSchedule[i] = {
          ...newSchedule[i],
          isAvailable: true
        };
      }
      return newSchedule;
    });
  }, []);

  // Save schedules handler
  const handleSaveSchedules = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      setError('');
      setSaveSuccess(false);
      
      // Validate that at least one day is available
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
      
      // Check for existing booked slots before saving
      const { data: bookedSlots, error: bookedError } = await supabase
        .from('booked_slots')
        .select('schedule_date, time_slot')
        .eq('doctor_id', doctorId);
      
      if (bookedError) {
        console.error('❌ Error checking booked slots:', bookedError);
        throw bookedError;
      }
      
      if (bookedSlots && bookedSlots.length > 0) {
        const bookedDates = [...new Set(bookedSlots.map((slot: any) => slot.schedule_date))];
        throw new Error(`Cannot modify schedule. You have ${bookedSlots.length} booked appointments on dates: ${bookedDates.join(', ')}. Please contact patients to reschedule before making changes.`);
      }
      
      // Don't mark existing schedules as inactive - just update them directly
      const savePromises: Promise<any>[] = [];
      
      for (const [dayId, schedule] of Object.entries(currentWeekSchedule)) {
        if (schedule.isAvailable) {
          const dayNumber = parseInt(dayId, 10);
          const dayDate = getWeekDates(currentWeekOffset)[dayNumber - 1];
          // Convert to JavaScript day of week (0 = Sunday, 1 = Monday, etc.)
          // dayNumber: 1 = Monday, 2 = Tuesday, etc.
          const jsDay = dayNumber === 7 ? 0 : dayNumber; // Convert 7 (Sunday) to 0, keep others
          
          const savePromise = createDoctorSchedulesForNext4Weeks(
            doctorId,
            jsDay,
            schedule.startTime,
            schedule.endTime,
            schedule.slotDuration,
            schedule.breakStartTime,
            schedule.breakEndTime
          );
          savePromises.push(savePromise);
        }
      }
      
      // Wait for all schedules to be saved
      const results = await Promise.allSettled(savePromises);
      
      // Check for any failures
      const failures = results.filter(result => result.status === 'rejected');
      if (failures.length > 0) {
        const errorMessages = failures.map(failure => 
          failure.status === 'rejected' ? failure.reason?.message || 'Unknown error' : ''
        );
        throw new Error(`Failed to save some schedules: ${errorMessages.join(', ')}`);
      }
      
      console.log('✅ All schedules saved successfully');
      setSaveSuccess(true);
      
      // Reload existing schedules to reflect changes
      await loadExistingSchedules(currentWeekOffset);
      
    } catch (error: any) {
      console.error('❌ Error saving schedules:', error);
      let errorMessage = 'Failed to save schedules. Please try again.';
      if (error.message) {
        if (error.message.includes('Cannot modify schedule')) {
          errorMessage = error.message;
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  }, [currentWeekSchedule, user, profile]);
  
  // Update schedules handler
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
      
      // Check for existing booked slots before updating
      const { data: bookedSlots, error: bookedError } = await supabase
        .from('booked_slots')
        .select('schedule_date, time_slot')
        .eq('doctor_id', doctorId);
      
      if (bookedError) {
        console.error('❌ Error checking booked slots:', bookedError);
        throw bookedError;
      }
      
      if (bookedSlots && bookedSlots.length > 0) {
        const bookedDates = [...new Set(bookedSlots.map((slot: any) => slot.schedule_date))];
        throw new Error(`Cannot modify schedule. You have ${bookedSlots.length} booked appointments on dates: ${bookedDates.join(', ')}. Please contact patients to reschedule before making changes.`);
      }
      
      // Fetch existing schedules for the current week
      const weekDates = getWeekDates(currentWeekOffset);
      const dateRange = weekDates.map(day => day.date);
      
      const { data: existingSchedules, error: fetchError } = await supabase
        .from('doctor_schedules')
        .select('*')
        .eq('doctor_id', doctorId)
        .in('schedule_date', dateRange)
        .order('schedule_date', { ascending: true });
      
      if (fetchError) {
        throw new Error(`Failed to fetch existing schedules: ${fetchError.message}`);
      }
      
      console.log(`🔍 Found ${existingSchedules?.length || 0} existing schedule records for week ${currentWeekOffset + 1}:`, existingSchedules);
      
      if (!existingSchedules || existingSchedules.length === 0) {
        console.log('No existing schedules found for this week');
        return;
      }
      
      // Create a map for quick lookup
      const dateScheduleMap = new Map<string, any>();
      existingSchedules.forEach((schedule: any) => {
        const scheduleDate = schedule.schedule_date;
        const existingSchedule = dateScheduleMap.get(scheduleDate);
        
        // Keep the most recent schedule if there are duplicates
        if (!existingSchedule || schedule.created_at > existingSchedule.created_at) {
          dateScheduleMap.set(scheduleDate, schedule);
        }
      });
      
      // Update existing schedules based on current form data
      const updatePromises: Promise<any>[] = [];
      const updatedRecordIds = new Set<string>();
      
      for (const [dayId, schedule] of Object.entries(currentWeekSchedule)) {
        const dayNumber = parseInt(dayId);
        const dayDate = getWeekDates(currentWeekOffset)[dayNumber - 1];
        const dayDateStr = dayDate.date;
        
        const existingSchedule = dateScheduleMap.get(dayDateStr);
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
        
        // Prepare update data
        if (schedule.isAvailable && schedule.startTime && schedule.endTime) {
          console.log(`📅 Updating existing schedule ID ${existingSchedule.id} for date ${dayDateStr} (day ${dayNumber}):`, schedule);
          
          // Helper function to ensure time format includes seconds
          const formatTime = (time: string) => {
            if (time.length === 5 && time.includes(':')) {
              return time + ':00';
            }
            return time;
          };
          
          const updateData = {
            start_time: formatTime(schedule.startTime),
            end_time: formatTime(schedule.endTime),
            slot_duration: schedule.slotDuration,
            break_start_time: schedule.breakStartTime ? formatTime(schedule.breakStartTime) : null,
            break_end_time: schedule.breakEndTime ? formatTime(schedule.breakEndTime) : null,
            is_active: true,
            updated_at: new Date().toISOString()
          };
          
          console.log(`🔄 Updating schedule ${existingSchedule.id} with data:`, updateData);
          
          const updatePromise = supabase
            .from('doctor_schedules')
            .update(updateData)
            .eq('id', existingSchedule.id);
          updatePromises.push(updatePromise);
        }
      }
      
      // Wait for all updates to complete and check for errors
      const results = await Promise.allSettled(updatePromises);
      
      // Check results
      const errors: any[] = [];
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`❌ Update ${index + 1} failed:`, result.reason);
          errors.push(result.reason);
        } else if (result.status === 'fulfilled' && result.value.error) {
          console.error(`❌ Update ${index + 1} failed:`, result.value.error);
          errors.push(result.value.error);
        } else {
          console.log(`✅ Update ${index + 1} succeeded:`, result.value.data);
        }
      });
      
      if (errors.length > 0) {
        console.error('❌ Failed results:', results.filter(result => result.status === 'rejected'));
        throw new Error(`Failed to update some schedules: ${errors[0]?.message || 'Unknown error'}`);
      }
      
      console.log(`✅ Successfully updated ${results.length} schedule records`);
      setSaveSuccess(true);
      
      // Reload existing schedules to reflect changes
      await loadExistingSchedules(currentWeekOffset);
      
    } catch (error: any) {
      console.error('❌ Error updating schedules:', error);
      let errorMessage = 'Failed to update schedules. Please try again.';
      if (error.message) {
        if (error.message.includes('Cannot modify schedule')) {
          errorMessage = error.message;
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  }, [currentWeekSchedule, user, profile]);
  
  // Load existing schedules
  const loadExistingSchedules = useCallback(async (weekOffset: number) => {
    try {
      if (!user || !profile) {
        console.log('No user or profile for schedule loading');
        return;
      }
      
      console.log('Loading schedules for user:', user.id);
      
      const doctorId = await getDoctorIdByUserId(user.id);
      
      if (!doctorId) {
        console.log('No doctor ID found');
        return;
      }
      
      // Calculate the specific week based on offset
      const weekDates = getWeekDates(weekOffset);
      const dateRange = weekDates.map((day: any) => day.date);
      
      console.log(`Loading schedules for week ${weekOffset + 1}, dates:`, dateRange);
      
      const { data: schedules, error: weekError } = await supabase
        .from('doctor_schedules')
        .select('*')
        .eq('doctor_id', doctorId)
        .in('schedule_date', dateRange)
        .order('schedule_date', { ascending: true });
      
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
          7: { isAvailable: false, startTime: '', endTime: '', slotDuration: 15, breakStartTime: '', breakEndTime: '' }
        };
        
        // Create a map to handle duplicate dates (keep the most recent)
        const dateScheduleMap = new Map<string, any>();
        schedules.forEach((schedule: any) => {
          const scheduleDate = schedule.schedule_date;
          const existingSchedule = dateScheduleMap.get(scheduleDate);
          
          // Keep the most recent schedule if there are duplicates
          if (!existingSchedule || schedule.created_at > existingSchedule.created_at) {
            dateScheduleMap.set(scheduleDate, schedule);
          }
        });
        
        // Map schedules to days (1-7, where 1 is Monday)
        dateScheduleMap.forEach((schedule, scheduleDate) => {
          const dayIndex = weekDates.findIndex((day: any) => day.date === scheduleDate);
          if (dayIndex !== -1) {
            const dayNumber = dayIndex + 1; // Convert to 1-based day numbering
            loadedSchedule[dayNumber] = {
              isAvailable: true,
              startTime: schedule.start_time || '',
              endTime: schedule.end_time || '',
              slotDuration: schedule.slot_duration || 15,
              breakStartTime: schedule.break_start_time || '',
              breakEndTime: schedule.break_end_time || ''
            };
          }
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
  }, [user, profile]);
  
  // Load existing time slots
  const loadExistingTimeSlots = useCallback(async () => {
    try {
      if (!user || !profile) {
        return;
      }
      
      setIsLoadingSlots(true);
      
      const doctorId = await getDoctorIdByUserId(user.id);
      
      if (!doctorId) {
        return;
      }
      
      // Calculate date range for next 4 weeks
      const today = new Date();
      const fourWeeksFromNow = new Date(today);
      fourWeeksFromNow.setDate(today.getDate() + 28);
      
      const { data: timeSlots, error } = await supabase
        .from('time_slots')
        .select('*')
        .eq('doctor_id', doctorId)
        .gte('slot_date', today.toISOString().split('T')[0])
        .lte('slot_date', fourWeeksFromNow.toISOString().split('T')[0])
        .order('slot_date', { ascending: true })
        .order('start_time', { ascending: true });
      
      if (error) {
        console.error('❌ Error loading time slots:', error);
        return;
      }
      
      if (timeSlots && timeSlots.length > 0) {
        console.log('Found existing time slots:', timeSlots);
        setExistingTimeSlots(timeSlots);
        console.log('No existing time slots found');
        setExistingTimeSlots([]);
      }
    } catch (error) {
      console.error('❌ Error in loadExistingTimeSlots:', error);
    } finally {
      setIsLoadingSlots(false);
    }
  }, [user, profile]);
  
  // Navigation handlers
  const handlePreviousWeek = useCallback(async () => {
    if (currentWeekOffset > 0) {
      const newOffset = currentWeekOffset - 1;
      setCurrentWeekOffset(newOffset);
      await loadExistingSchedules(newOffset);
    }
  }, [currentWeekOffset, loadExistingSchedules]);

  const handleNextWeek = useCallback(async () => {
    const newOffset = currentWeekOffset + 1;
    setCurrentWeekOffset(newOffset);
    await loadExistingSchedules(newOffset);
  }, [currentWeekOffset, loadExistingSchedules]);
  
  // Check if schedules exist for 4 weeks
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
      const currentDay = today.getDay();
      const daysUntilMonday = currentDay === 0 ? 6 : currentDay - 1;
      const mondayOfCurrentWeek = new Date(today);
      mondayOfCurrentWeek.setDate(today.getDate() - daysUntilMonday);
      
      const fourWeeksFromMonday = new Date(mondayOfCurrentWeek);
      fourWeeksFromMonday.setDate(mondayOfCurrentWeek.getDate() + 28);
      
      console.log('Checking schedules from:', mondayOfCurrentWeek.toISOString().split('T')[0]);
      console.log('Checking schedules to:', fourWeeksFromMonday.toISOString().split('T')[0]);
      
      const { data: schedules, error } = await supabase
        .from('doctor_schedules')
        .select('schedule_date')
        .eq('doctor_id', doctorId)
        .gte('schedule_date', mondayOfCurrentWeek.toISOString().split('T')[0])
        .lte('schedule_date', fourWeeksFromMonday.toISOString().split('T')[0])
        .eq('is_active', true);
      
      if (error) {
        console.error('❌ Error in checkSchedulesFor4Weeks:', error);
        setHasSchedulesFor4Weeks(false);
        return;
      }
      
      // Count unique dates
      const uniqueDates = new Set(schedules?.map((s: any) => s.schedule_date) || []);
      const hasRequiredSchedules = uniqueDates.size >= 20; // At least 20 days in 4 weeks
      
      console.log(`Found ${uniqueDates.size} unique schedule dates in 4-week period`);
      console.log('Required: at least 20 days');
      console.log('Has required schedules:', hasRequiredSchedules);
      
      setHasSchedulesFor4Weeks(hasRequiredSchedules);
    } catch (error) {
      console.error('❌ Error in checkSchedulesFor4Weeks:', error);
      setHasSchedulesFor4Weeks(false);
    }
  }, [user, profile]);

  // Authentication handlers
  const handleLoginClick = () => {
    // Navigate to dedicated login page instead of modal
    navigate('/login-page');
    // Keep old modal logic commented as backup
    // setAuthMode('login');
    // setShowAuthModal(true);
  };

  const handleAuthSuccess = async (authData?: { name?: string; email?: string; phone?: string }) => {
    setShowAuthModal(false);
    console.log('✅ Authentication successful:', authData);
    
    // If it's a signup, show doctor registration form
    if (authMode === 'signup' && authData) {
      setShowDoctorRegistration(true);
    }
    // The useAuth hook will automatically update the authentication state
    // and the component will re-render with the authenticated user
  };

  const handleDoctorRegistrationSuccess = async () => {
    setShowDoctorRegistration(false);
    console.log('✅ Doctor registration successful');
    
    // Reload doctor data after successful registration
    if (user?.id) {
      try {
        const doctorId = await getDoctorIdByUserId(user.id);
        if (doctorId) {
          const { data: doctorData, error: doctorError } = await supabase
            .from('doctors')
            .select('*')
            .eq('id', doctorId)
            .single();
          
          if (doctorError) {
            console.error('❌ Error fetching doctor data after registration:', doctorError);
          } else {
            console.log('✅ Doctor data loaded after registration:', doctorData);
            setDoctor(doctorData);
          }
        }
      } catch (error) {
        console.error('❌ Error in doctor registration success handler:', error);
      }
    }
  };

  // Load doctor data on component mount
  useEffect(() => {
    const loadDoctorData = async () => {
      if (!user?.id) {
        setIsLoadingDoctor(false);
        return;
      }

      try {
        setIsLoadingDoctor(true);
        setDoctorError('');
        
        const doctorId = await getDoctorIdByUserId(user.id);
        
        if (!doctorId) {
          setDoctorError('Doctor profile not found. Please complete your registration.');
          setIsLoadingDoctor(false);
          return;
        }
        
        const { data: doctorData, error: doctorError } = await supabase
          .from('doctors')
          .select('*')
          .eq('id', doctorId)
          .single();
        
        if (doctorError) {
          console.error('❌ Error fetching doctor data:', doctorError);
          setDoctorError('Failed to load doctor profile');
          return;
        }
        
        console.log('✅ Doctor data loaded:', doctorData);
        setDoctor(doctorData);
        
      } catch (error) {
        console.error('❌ Error loading doctor data:', error);
        setDoctorError('Failed to load doctor profile');
      } finally {
        setIsLoadingDoctor(false);
      }
    };

    loadDoctorData();
  }, [user?.id]);

  // Load schedules when authenticated
  useEffect(() => {
    if (isAuthenticated && user && profile) {
      loadExistingSchedules(currentWeekOffset);
      loadExistingTimeSlots();
      checkSchedulesFor4Weeks(); // Check if 4-week schedules exist
    }
  }, [doctor, isAuthenticated, loadExistingSchedules, loadExistingTimeSlots, currentWeekOffset, checkSchedulesFor4Weeks]);
  
  if (!isAuthenticated && !isTestMode) {
    // Redirect to dedicated login page instead of showing inline login form
    navigate('/login-page');
    return null; // Prevent rendering while redirecting
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back to Home Link */}
        <Link 
          to="/" 
          className="inline-flex items-center text-[#0075A2] hover:text-[#005A7A] dark:text-[#0EA5E9] dark:hover:text-[#0284C7] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
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
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">Last updated</p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule Management Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-[#E8E8E8] dark:border-gray-600 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#0A2647] dark:text-gray-100 flex items-center">
              <Calendar className="w-6 h-6 mr-3 text-[#0075A2] dark:text-[#0EA5E9]" />
              Schedule Management
            </h2>
            <div className="flex items-center space-x-4">
              <button
                onClick={handlePreviousWeek}
                disabled={currentWeekOffset === 0}
                className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </button>
              <span className="px-4 py-2 bg-[#0075A2] dark:bg-[#0EA5E9] text-white rounded-lg font-medium">
                Week {currentWeekOffset + 1}
              </span>
              <button
                onClick={handleNextWeek}
                className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>

          {/* Schedule Form - List View with All 7 Days */}
          <form onSubmit={handleSaveSchedules} className="space-y-4">
            <div className="space-y-4">
              {getWeekDates(currentWeekOffset).map((day, index) => {
                const dayNumber = index + 1;
                const schedule = currentWeekSchedule[dayNumber];
                const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                const dayName = dayNames[index];
                const otherDays = dayNames.filter((_, i) => i !== index);
                
                return (
                  <div key={dayNumber} className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600 shadow-sm">
                    {/* Day Header */}
                    <div className="flex items-center gap-4 mb-4">
                      <input
                        type="checkbox"
                        checked={schedule.isAvailable}
                        onChange={(e) => handleScheduleChange(dayNumber, 'isAvailable', e.target.checked)}
                        className="w-5 h-5 text-[#0075A2] bg-gray-100 border-gray-300 rounded focus:ring-[#0075A2] dark:focus:ring-[#0EA5E9] dark:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                      />
                      <div>
                        <h3 className="font-semibold text-[#0A2647] dark:text-gray-100 text-lg">{dayName}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{day.date}</p>
                      </div>
                      {!schedule.isAvailable && (
                        <span className="ml-auto text-sm text-gray-400 dark:text-gray-500 italic">Not available for added</span>
                      )}
                    </div>
                    
                    {schedule.isAvailable && (
                      <div className="space-y-4">
                        {/* Time Fields Row */}
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                          {/* Start Time */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time</label>
                            <input
                              type="time"
                              value={schedule.startTime}
                              onChange={(e) => handleScheduleChange(dayNumber, 'startTime', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0075A2] focus:border-transparent bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                          
                          {/* End Time */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Time</label>
                            <input
                              type="time"
                              value={schedule.endTime}
                              onChange={(e) => handleScheduleChange(dayNumber, 'endTime', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0075A2] focus:border-transparent bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                          
                          {/* Slot Duration */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Slot Duration</label>
                            <select
                              value={schedule.slotDuration}
                              onChange={(e) => handleScheduleChange(dayNumber, 'slotDuration', parseInt(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0075A2] focus:border-transparent bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100"
                            >
                              <option value={15}>15 minutes</option>
                              <option value={30}>30 minutes</option>
                              <option value={45}>45 minutes</option>
                              <option value={60}>60 minutes</option>
                            </select>
                          </div>
                          
                          {/* Break Time (Optional) */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Break Time (Optional)</label>
                            <div className="flex gap-2">
                              <input
                                type="time"
                                value={schedule.breakStartTime}
                                onChange={(e) => handleScheduleChange(dayNumber, 'breakStartTime', e.target.value)}
                                placeholder="Start"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0075A2] focus:border-transparent bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100"
                              />
                            </div>
                          </div>
                          
                          <div className="flex items-end">
                            <input
                              type="time"
                              value={schedule.breakEndTime}
                              onChange={(e) => handleScheduleChange(dayNumber, 'breakEndTime', e.target.value)}
                              placeholder="End"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0075A2] focus:border-transparent bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                          
                          {/* Copy Actions */}
                          <div className="flex items-end gap-2">
                            <div className="relative group">
                              <button
                                type="button"
                                className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors whitespace-nowrap"
                              >
                                Copy to...
                              </button>
                              <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 hidden group-hover:block z-10">
                                {otherDays.map((targetDay) => (
                                  <button
                                    key={targetDay}
                                    type="button"
                                    onClick={() => {
                                      const targetIndex = dayNames.indexOf(targetDay);
                                      if (targetIndex !== -1) {
                                        copyScheduleToDay(dayNumber, targetIndex + 1);
                                      }
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 first:rounded-t-lg last:rounded-b-lg"
                                  >
                                    Copy to {targetDay}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4">
              <button
                type="button"
                onClick={handleCheckAll}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200"
              >
                Check All
              </button>
              
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-[#0075A2] to-[#0A2647] text-white rounded-lg hover:from-[#005A7A] hover:to-[#082A47] focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Clock className="w-5 h-5 mr-2" />
                    Generate New Schedule & Time Slots
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
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
