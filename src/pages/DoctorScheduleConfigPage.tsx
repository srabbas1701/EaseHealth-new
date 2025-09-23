import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Clock, Save, Plus, Trash2, User, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { useDarkMode } from '../hooks/useDarkMode';
import AuthModal from '../components/AuthModal';
import { getDoctorByUserId, getDoctorSchedules, upsertDoctorSchedule, DoctorSchedule, Doctor, supabase } from '../utils/supabase';

// Auth props interface
interface AuthProps {
  user: any;
  session: any;
  profile: any;
  userState: 'new' | 'returning' | 'authenticated';
  isAuthenticated: boolean;
  handleLogout: () => Promise<void>;
}

interface ScheduleForm {
  [key: number]: {
    isAvailable: boolean;
    startTime: string;
    endTime: string;
    slotDuration: number;
    breakStartTime: string;
    breakEndTime: string;
  };
}

function DoctorScheduleConfigPage({ user, session, profile, userState, isAuthenticated, handleLogout }: AuthProps) {
  const { isDarkMode } = useDarkMode();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string>('');
  
  const [scheduleForm, setScheduleForm] = useState<ScheduleForm>({
    1: { isAvailable: true, startTime: '09:00', endTime: '17:00', slotDuration: 15, breakStartTime: '13:00', breakEndTime: '14:00' },
    2: { isAvailable: true, startTime: '09:00', endTime: '17:00', slotDuration: 15, breakStartTime: '13:00', breakEndTime: '14:00' },
    3: { isAvailable: true, startTime: '09:00', endTime: '17:00', slotDuration: 15, breakStartTime: '13:00', breakEndTime: '14:00' },
    4: { isAvailable: true, startTime: '09:00', endTime: '17:00', slotDuration: 15, breakStartTime: '13:00', breakEndTime: '14:00' },
    5: { isAvailable: true, startTime: '09:00', endTime: '17:00', slotDuration: 15, breakStartTime: '13:00', breakEndTime: '14:00' },
    6: { isAvailable: true, startTime: '09:00', endTime: '13:00', slotDuration: 15, breakStartTime: '', breakEndTime: '' },
    0: { isAvailable: false, startTime: '09:00', endTime: '17:00', slotDuration: 15, breakStartTime: '', breakEndTime: '' }
  });

  const daysOfWeek = [
    { id: 1, name: 'Monday', short: 'Mon' },
    { id: 2, name: 'Tuesday', short: 'Tue' },
    { id: 3, name: 'Wednesday', short: 'Wed' },
    { id: 4, name: 'Thursday', short: 'Thu' },
    { id: 5, name: 'Friday', short: 'Fri' },
    { id: 6, name: 'Saturday', short: 'Sat' },
    { id: 0, name: 'Sunday', short: 'Sun' }
  ];

  const slotDurations = [
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 45, label: '45 minutes' },
    { value: 60, label: '1 hour' }
  ];

  useEffect(() => {
    if (isAuthenticated && user) {
      loadDoctorData();
    } else if (!isAuthenticated) {
      setShowAuthModal(true);
    }
  }, [isAuthenticated, user]);

  const loadDoctorData = async () => {
    try {
      setIsLoading(true);
      setError('');
      const doctorData = await getDoctorByUserId(user.id);
      
      if (!doctorData) {
        // Try to create a doctor profile if one doesn't exist
        console.log('No doctor profile found, checking if user should have one...');
        setError('Doctor profile not found. You may need to register as a doctor first.');
        return;
      }

      setDoctor(doctorData);
      
      // Load existing schedules
      const schedules = await getDoctorSchedules(doctorData.id);
      if (schedules && schedules.length > 0) {
        const newScheduleForm: ScheduleForm = { ...scheduleForm };
        schedules.forEach((schedule: DoctorSchedule) => {
          newScheduleForm[schedule.day_of_week] = {
            isAvailable: schedule.is_available,
            startTime: schedule.start_time.slice(0, 5), // Remove seconds
            endTime: schedule.end_time.slice(0, 5),
            slotDuration: schedule.slot_duration_minutes,
            breakStartTime: schedule.break_start_time ? schedule.break_start_time.slice(0, 5) : '',
            breakEndTime: schedule.break_end_time ? schedule.break_end_time.slice(0, 5) : ''
          };
        });
        setScheduleForm(newScheduleForm);
      }
    } catch (error) {
      console.error('Error loading doctor data:', error);
      setError('Failed to load doctor information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    // Reload the page to get updated user data
    window.location.reload();
  };

  const handleScheduleChange = (dayId: number, field: string, value: string | number | boolean) => {
    setScheduleForm(prev => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        [field]: value
      }
    }));
    setSaveSuccess(false);
  };

  const handleSaveSchedules = async () => {
    if (!doctor) return;

    try {
      setSaving(true);
      setError('');

      // Validate schedules
      for (const [dayId, schedule] of Object.entries(scheduleForm)) {
        if (schedule.isAvailable) {
          if (!schedule.startTime || !schedule.endTime) {
            throw new Error(`Please set start and end times for ${daysOfWeek.find(d => d.id === parseInt(dayId))?.name}`);
          }
          if (schedule.startTime >= schedule.endTime) {
            throw new Error(`End time must be after start time for ${daysOfWeek.find(d => d.id === parseInt(dayId))?.name}`);
          }
          if (schedule.breakStartTime && schedule.breakEndTime) {
            if (schedule.breakStartTime >= schedule.breakEndTime) {
              throw new Error(`Break end time must be after break start time for ${daysOfWeek.find(d => d.id === parseInt(dayId))?.name}`);
            }
          }
        }
      }

      // Save each day's schedule
      const savePromises = Object.entries(scheduleForm).map(([dayId, schedule]) => {
        const scheduleData: Omit<DoctorSchedule, 'id' | 'created_at' | 'updated_at'> = {
          doctor_id: doctor.id,
          day_of_week: parseInt(dayId),
          start_time: `${schedule.startTime}:00`,
          end_time: `${schedule.endTime}:00`,
          slot_duration_minutes: schedule.slotDuration,
          break_start_time: schedule.breakStartTime ? `${schedule.breakStartTime}:00` : undefined,
          break_end_time: schedule.breakEndTime ? `${schedule.breakEndTime}:00` : undefined,
          is_available: schedule.isAvailable
        };
        return upsertDoctorSchedule(scheduleData);
      });

      await Promise.all(savePromises);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving schedules:', error);
      setError(error instanceof Error ? error.message : 'Failed to save schedules. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const copySchedule = (fromDay: number, toDay: number) => {
    setScheduleForm(prev => ({
      ...prev,
      [toDay]: { ...prev[fromDay] }
    }));
    setSaveSuccess(false);
  };

  // Create a temporary doctor profile for testing
  const createTempDoctorProfile = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('doctors')
        .insert([
          {
            user_id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Doctor',
            email: user.email,
            phone_number: '+91 9876543210',
            specialty: 'General Medicine',
            license_number: `LIC${Date.now()}`,
            experience_years: 5,
            qualification: 'MBBS',
            hospital_affiliation: 'City Hospital',
            consultation_fee: 500,
            is_verified: true,
            is_active: true
          }
        ])
        .select()
        .single();

      if (error) throw error;
      
      setDoctor(data);
      setError('');
    } catch (error) {
      console.error('Error creating doctor profile:', error);
      setError('Failed to create doctor profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const authContext = {
    title: 'Doctor Authentication Required',
    description: 'Please sign in with your doctor account to access the schedule configuration system.',
    actionText: 'Sign In as Doctor'
  };

  if (!isAuthenticated) {
    return (
      <>
        <div className="min-h-screen bg-[#F6F6F6] dark:bg-gray-900 text-[#0A2647] dark:text-gray-100 transition-colors duration-300">
          <Navigation 
            user={user}
            session={session}
            profile={profile}
            userState={userState}
            isAuthenticated={isAuthenticated}
            handleLogout={handleLogout}
          />
          
          <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-[#0A2647] dark:text-gray-100 mb-4">
                Authentication Required
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
                Please sign in with your doctor account to access the schedule configuration system.
              </p>
              <button
                onClick={() => setShowAuthModal(true)}
                className="bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] text-white px-8 py-3 rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-1 transition-all focus-ring"
              >
                Sign In as Doctor
              </button>
            </div>
          </main>
        </div>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
          mode="login"
          context={authContext}
        />
      </>
    );
  }

  if (isLoading) {
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
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0075A2] dark:border-[#0EA5E9] mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading doctor information...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error && !doctor) {
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
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
            <div className="w-24 h-24 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-3xl font-bold text-[#0A2647] dark:text-gray-100 mb-4">
              Access Denied
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
              {error}
            </p>
            {error.includes('Doctor profile not found') && (
              <button
                onClick={createTempDoctorProfile}
                className="bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] text-white px-8 py-3 rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-1 transition-all focus-ring mr-4"
              >
                Create Doctor Profile
              </button>
            )}
            <Link 
              to="/" 
              className="bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] text-white px-8 py-3 rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-1 transition-all focus-ring inline-block"
            >
              Return to Home
            </Link>
          </div>
        </main>
      </div>
    );
  }

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
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link 
          to="/" 
          className="inline-flex items-center text-[#0075A2] dark:text-[#0EA5E9] hover:text-[#0A2647] dark:hover:text-gray-100 transition-colors mb-8 focus-ring"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </Link>

        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-2xl flex items-center justify-center relative overflow-hidden">
              <Calendar className="w-8 h-8 text-white" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-[#00D4AA] dark:from-[#06D6A0] to-[#0075A2] dark:to-[#0EA5E9] rounded-full flex items-center justify-center">
                <Clock className="w-3 h-3 text-white" />
              </div>
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-transparent via-transparent to-white/10 pointer-events-none"></div>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0A2647] dark:text-gray-100 leading-tight mb-4">
            Schedule{' '}
            <span className="bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] bg-clip-text text-transparent">
              Configuration
            </span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed max-w-2xl mx-auto">
            Manage your availability and appointment slots
          </p>
          {doctor && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 inline-block shadow-md">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-full flex items-center justify-center text-white font-bold">
                  {doctor.full_name.charAt(0)}
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-[#0A2647] dark:text-gray-100">{doctor.full_name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{doctor.specialty}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Schedule Configuration */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
          {/* Success/Error Messages */}
          {saveSuccess && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Schedule saved successfully!
              </p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                {error}
              </p>
            </div>
          )}

          <div className="space-y-6">
            {daysOfWeek.map((day) => (
              <div key={day.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-bold text-[#0A2647] dark:text-gray-100">{day.name}</h3>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={scheduleForm[day.id].isAvailable}
                        onChange={(e) => handleScheduleChange(day.id, 'isAvailable', e.target.checked)}
                        className="w-4 h-4 text-[#0075A2] border-gray-300 dark:border-gray-600 rounded focus:ring-[#0075A2] focus:ring-2"
                      />
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">Available</span>
                    </label>
                  </div>
                  {scheduleForm[day.id].isAvailable && day.id !== 1 && (
                    <button
                      onClick={() => copySchedule(1, day.id)}
                      className="text-xs text-[#0075A2] dark:text-[#0EA5E9] hover:text-[#0A2647] dark:hover:text-gray-100 transition-colors"
                    >
                      Copy from Monday
                    </button>
                  )}
                </div>

                {scheduleForm[day.id].isAvailable && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Working Hours */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={scheduleForm[day.id].startTime}
                        onChange={(e) => handleScheduleChange(day.id, 'startTime', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={scheduleForm[day.id].endTime}
                        onChange={(e) => handleScheduleChange(day.id, 'endTime', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>

                    {/* Slot Duration */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Slot Duration
                      </label>
                      <select
                        value={scheduleForm[day.id].slotDuration}
                        onChange={(e) => handleScheduleChange(day.id, 'slotDuration', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
                          value={scheduleForm[day.id].breakStartTime}
                          onChange={(e) => handleScheduleChange(day.id, 'breakStartTime', e.target.value)}
                          placeholder="Start"
                          className="flex-1 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                        />
                        <input
                          type="time"
                          value={scheduleForm[day.id].breakEndTime}
                          onChange={(e) => handleScheduleChange(day.id, 'breakEndTime', e.target.value)}
                          placeholder="End"
                          className="flex-1 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                        />
                      </div>
                      {scheduleForm[day.id].breakStartTime && scheduleForm[day.id].breakEndTime && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Break: {scheduleForm[day.id].breakStartTime} - {scheduleForm[day.id].breakEndTime}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Save Button */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleSaveSchedules}
              disabled={isSaving}
              className="bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] hover:from-[#005a7a] hover:to-[#081f3a] disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:ring-offset-2 disabled:transform-none disabled:cursor-not-allowed flex items-center"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Saving Schedule...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Schedule
                </>
              )}
            </button>
          </div>

          {/* Schedule Preview */}
          {doctor && (
            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-[#0A2647] dark:text-gray-100 mb-4">Schedule Preview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {daysOfWeek.map((day) => (
                  <div key={day.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="font-medium text-[#0A2647] dark:text-gray-100 mb-2">{day.name}</h4>
                    {scheduleForm[day.id].isAvailable ? (
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        <p>🕐 {scheduleForm[day.id].startTime} - {scheduleForm[day.id].endTime}</p>
                        <p>⏱️ {scheduleForm[day.id].slotDuration} min slots</p>
                        {scheduleForm[day.id].breakStartTime && scheduleForm[day.id].breakEndTime && (
                          <p>☕ Break: {scheduleForm[day.id].breakStartTime} - {scheduleForm[day.id].breakEndTime}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">Not available</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default DoctorScheduleConfigPage;