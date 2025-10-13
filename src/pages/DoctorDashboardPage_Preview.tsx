import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Save, ChevronLeft, ChevronRight, X, CheckCircle, AlertCircle, User, FileText } from 'lucide-react';
import Navigation from '../components/Navigation';
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

function DoctorDashboardPagePreview({ user, session, profile, userState, isAuthenticated, isLoadingInitialAuth, isProfileLoading, handleLogout }: AuthProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'patients' | 'reports'>('overview');
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [existingTimeSlots, setExistingTimeSlots] = useState<any[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [hasSchedulesFor4Weeks, setHasSchedulesFor4Weeks] = useState(false);
  const [doctor, setDoctor] = useState<any>(null);
  const [isLoadingDoctor, setIsLoadingDoctor] = useState(false);

  const [currentWeekSchedule, setCurrentWeekSchedule] = useState<ScheduleForm>({
    1: { isAvailable: false, startTime: '', endTime: '', slotDuration: 15, breakStartTime: '', breakEndTime: '' },
    2: { isAvailable: false, startTime: '', endTime: '', slotDuration: 15, breakStartTime: '', breakEndTime: '' },
    3: { isAvailable: false, startTime: '', endTime: '', slotDuration: 15, breakStartTime: '', breakEndTime: '' },
    4: { isAvailable: false, startTime: '', endTime: '', slotDuration: 15, breakStartTime: '', breakEndTime: '' },
    5: { isAvailable: false, startTime: '', endTime: '', slotDuration: 15, breakStartTime: '', breakEndTime: '' },
    6: { isAvailable: false, startTime: '', endTime: '', slotDuration: 15, breakStartTime: '', breakEndTime: '' },
    0: { isAvailable: false, startTime: '', endTime: '', slotDuration: 15, breakStartTime: '', breakEndTime: '' }
  });

  const slotDurations = [
    { value: 10, label: '10 minutes' },
    { value: 15, label: '15 minutes' },
    { value: 20, label: '20 minutes' },
    { value: 30, label: '30 minutes' }
  ];

  const daysOfWeek = [
    { id: 1, name: 'Monday' },
    { id: 2, name: 'Tuesday' },
    { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday' },
    { id: 5, name: 'Friday' },
    { id: 6, name: 'Saturday' },
    { id: 0, name: 'Sunday' }
  ];

  const getWeekDates = useCallback(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWeek.setDate(today.getDate() - daysToMonday);
    startOfWeek.setDate(startOfWeek.getDate() + (currentWeekOffset * 7));
    const weekDates: Array<{ dayOfWeek: number; date: Date; dateString: string; isPast: boolean; isToday: boolean }> = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const isPast = date < today && date.toDateString() !== today.toDateString();
      const isToday = date.toDateString() === today.toDateString();
      weekDates.push({
        dayOfWeek: date.getDay(),
        date,
        dateString: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        isPast,
        isToday
      });
    }
    return weekDates;
  }, [currentWeekOffset]);

  const currentWeekDates = getWeekDates();
  const getWeekRange = useCallback(() => {
    if (currentWeekDates.length === 0) return { start: '', end: '' };
    const start = currentWeekDates[0].dateString;
    const end = currentWeekDates[6].dateString;
    return { start, end };
  }, [currentWeekDates]);
  const weekRange = getWeekRange();

  const getInitials = (fullName: string) => {
    if (!fullName) return 'D';
    const words = fullName.trim().split(/\s+/);
    const filtered = words[0].toLowerCase() === 'dr' ? words.slice(1) : words;
    if (filtered.length === 1) return filtered[0].charAt(0).toUpperCase();
    return filtered.slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('');
  };

  const handleScheduleChange = useCallback((dayId: number, field: keyof ScheduleDay, value: any) => {
    setCurrentWeekSchedule(prev => ({
      ...prev,
      [dayId]: { ...prev[dayId], [field]: value }
    }));
  }, []);

  const copySchedule = useCallback((fromDayId: number, toDayId: number) => {
    const from = currentWeekSchedule[fromDayId];
    setCurrentWeekSchedule(prev => ({
      ...prev,
      [toDayId]: { ...from, isAvailable: true }
    }));
  }, [currentWeekSchedule]);

  const handleSaveSchedules = useCallback(async () => {
    try {
      setIsSaving(true);
      setError('');
      setSaveSuccess(false);
      const hasAvailable = Object.values(currentWeekSchedule).some(d => d.isAvailable);
      if (!hasAvailable) throw new Error('Please select at least one day to be available.');
      if (!user || !profile) throw new Error('Please log in to save schedules.');
      const doctorId = await getDoctorIdByUserId(user.id);
      if (!doctorId) throw new Error('Doctor profile not found. Please complete your registration first.');
      const savePromises: Promise<any>[] = [];
      for (const [dayId, schedule] of Object.entries(currentWeekSchedule)) {
        if (schedule.isAvailable && schedule.startTime && schedule.endTime) {
          savePromises.push(createDoctorSchedulesForNext4Weeks(
            doctorId,
            parseInt(dayId),
            schedule.startTime,
            schedule.endTime,
            schedule.slotDuration,
            schedule.breakStartTime || undefined,
            schedule.breakEndTime || undefined
          ));
        }
      }
      await Promise.all(savePromises);
      await generateTimeSlotsForNext4Weeks(doctorId);
      setSaveSuccess(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to save schedule. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [currentWeekSchedule, user, profile]);

  useEffect(() => {
    const loadDoctorData = async () => {
      if (!isAuthenticated || !user || !profile) return;
      setIsLoadingDoctor(true);
      try {
        const doctorId = await getDoctorIdByUserId(user.id);
        if (doctorId) {
          const { data } = await supabase
            .from('doctors')
            .select('full_name, specialty, email, phone_number, profile_image_url')
            .eq('id', doctorId)
            .single();
          setDoctor({
            id: doctorId,
            full_name: data?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Doctor',
            specialty: data?.specialty || 'Specialty not set',
            profile_image_url: data?.profile_image_url || null,
            email: data?.email || user?.email || '',
            phone: data?.phone_number || user?.user_metadata?.phone || ''
          });
        }
      } finally {
        setIsLoadingDoctor(false);
      }
    };
    loadDoctorData();
  }, [isAuthenticated, user, profile]);

  if (isLoadingInitialAuth || isLoadingDoctor) {
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

  return (
    <div className="min-h-screen bg-[#F6F6F6] dark:bg-gray-900 text-[#0A2647] dark:text-gray-100 transition-colors duration-300">
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
        <Link to="/" className="inline-flex items-center text-[#0075A2] dark:text-[#0EA5E9] hover:text-[#0A2647] dark:hover:text-gray-100 transition-colors mb-8">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-[#E8E8E8] dark:border-gray-600 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-2xl flex items-center justify-center text-white font-bold text-3xl overflow-hidden">
                {doctor?.profile_image_url ? (
                  <img src={doctor.profile_image_url} alt="Profile" className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  (doctor?.full_name ? getInitials(doctor.full_name) : 'D')
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#0A2647] dark:text-gray-100">
                  <span className="text-[#0075A2] dark:text-[#0EA5E9]">{doctor?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Doctor'}</span> Dashboard (Preview)
                </h1>
                <p className="text-gray-600 dark:text-gray-300 text-lg">{doctor?.specialty || 'Specialty not set'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 border border-[#E8E8E8] dark:border-gray-600">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {[{ id: 'overview', label: 'Overview', icon: Calendar }, { id: 'schedule', label: 'Schedule', icon: Clock }, { id: 'patients', label: 'Patients', icon: User }, { id: 'reports', label: 'Reports', icon: FileText }].map(t => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-md font-medium transition-all ${activeTab === t.id ? 'bg-white dark:bg-gray-600 text-[#0075A2] dark:text-[#0EA5E9] shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:text-[#0075A2] dark:hover:text-[#0EA5E9]'}`}>
                  <Icon className="w-5 h-5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-[#E8E8E8] dark:border-gray-600">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-[#0A2647] dark:text-gray-100">Schedule Management</h2>
                <div className="flex items-center space-x-4">
                  <button onClick={() => currentWeekOffset > 0 && setCurrentWeekOffset(currentWeekOffset - 1)} disabled={currentWeekOffset === 0} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-lg font-medium text-[#0A2647] dark:text-gray-100 min-w-[200px] text-center">Week {currentWeekOffset + 1}</span>
                  <button onClick={() => currentWeekOffset < 3 && setCurrentWeekOffset(currentWeekOffset + 1)} disabled={currentWeekOffset >= 3} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Week {currentWeekOffset + 1} of 4 • {weekRange.start} - {weekRange.end}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-[#E8E8E8] dark:border-gray-600">
              <div className="space-y-6">
                {daysOfWeek.map((day) => {
                  const weekDate = currentWeekDates.find(d => d.dayOfWeek === day.id);
                  const schedule = currentWeekSchedule[day.id];
                  const isPast = weekDate?.isPast || false;
                  const isToday = weekDate?.isToday || false;
                  return (
                    <div key={day.id} className={`p-6 rounded-xl border-2 transition-all ${isPast ? 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50' : 'border-[#E8E8E8] dark:border-gray-600 bg-white dark:bg-gray-800'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input type="checkbox" checked={schedule.isAvailable} onChange={(e) => handleScheduleChange(day.id, 'isAvailable', e.target.checked)} disabled={isPast} className="w-5 h-5 text-[#0075A2] dark:text-[#0EA5E9] rounded focus:ring-2 focus:ring-[#0075A2] dark:focus:ring-[#0EA5E9]" />
                            <span className={`text-lg font-medium ${isPast ? 'text-gray-400 dark:text-gray-500' : 'text-[#0A2647] dark:text-gray-100'}`}>{day.name}</span>
                            {weekDate && (
                              <span className={`text-sm px-2 py-1 rounded ${isPast ? 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400' : isToday ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                                {isPast ? 'Past' : isToday ? 'Today' : weekDate.dateString}
                              </span>
                            )}
                          </label>
                        </div>
                      </div>
                      {schedule.isAvailable && !isPast && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Time</label>
                            <input type="time" value={schedule.startTime} onChange={(e) => handleScheduleChange(day.id, 'startTime', e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0075A2] dark:focus:ring-[#0EA5E9] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Time</label>
                            <input type="time" value={schedule.endTime} onChange={(e) => handleScheduleChange(day.id, 'endTime', e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0075A2] dark:focus:ring-[#0EA5E9] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Slot Duration</label>
                            <select value={schedule.slotDuration} onChange={(e) => handleScheduleChange(day.id, 'slotDuration', parseInt(e.target.value))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0075A2] dark:focus:ring-[#0EA5E9] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                              {slotDurations.map(d => (<option key={d.value} value={d.value}>{d.label}</option>))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Break Time (Optional)</label>
                            <div className="flex space-x-2">
                              <input type="time" value={schedule.breakStartTime} onChange={(e) => handleScheduleChange(day.id, 'breakStartTime', e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0075A2] dark:focus:ring-[#0EA5E9] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                              <input type="time" value={schedule.breakEndTime} onChange={(e) => handleScheduleChange(day.id, 'breakEndTime', e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0075A2] dark:focus:ring-[#0EA5E9] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
                {hasSchedulesFor4Weeks && (
                  <button onClick={() => { /* no-op in preview */ }} disabled={isUpdating || isSaving} className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
                    {isUpdating ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div><span>Updating...</span></>) : (<><Save className="w-4 h-4" /><span>Update Schedule</span></>)}
                  </button>
                )}
                {!hasSchedulesFor4Weeks && (
                  <button onClick={handleSaveSchedules} disabled={isSaving || isUpdating} className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] text-white rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
                    {isSaving ? (<><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div><span>Generating...</span></>) : (<><Save className="w-4 h-4" /><span>Generate New Schedule & Time Slots</span></>)}
                  </button>
                )}
                <button onClick={() => setCurrentWeekSchedule({ 1:{isAvailable:false,startTime:'',endTime:'',slotDuration:15,breakStartTime:'',breakEndTime:''}, 2:{isAvailable:false,startTime:'',endTime:'',slotDuration:15,breakStartTime:'',breakEndTime:''}, 3:{isAvailable:false,startTime:'',endTime:'',slotDuration:15,breakStartTime:'',breakEndTime:''}, 4:{isAvailable:false,startTime:'',endTime:'',slotDuration:15,breakStartTime:'',breakEndTime:''}, 5:{isAvailable:false,startTime:'',endTime:'',slotDuration:15,breakStartTime:'',breakEndTime:''}, 6:{isAvailable:false,startTime:'',endTime:'',slotDuration:15,breakStartTime:'',breakEndTime:''}, 0:{isAvailable:false,startTime:'',endTime:'',slotDuration:15,breakStartTime:'',breakEndTime:''} })} disabled={isSaving} className="flex items-center space-x-2 px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <X className="w-4 h-4" />
                  <span>Clear All</span>
                </button>
              </div>

              {saveSuccess && (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-2" /><p className="text-green-700 dark:text-green-300">Schedule and time slots generated successfully for the next 4 weeks!</p></div>
                </div>
              )}
              {error && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center"><AlertCircle className="w-5 h-5 text-red-500 mr-2" /><p className="text-red-700 dark:text-red-300">{error}</p></div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <UnifiedDoctorRegistrationForm
        isOpen={false}
        onClose={() => {}}
        onSuccess={() => {}}
        userId={user?.id}
        prefillData={user ? { fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || '', email: user.email || '', mobileNumber: user.user_metadata?.phone || '' } : undefined}
      />
    </div>
  );
}

export default DoctorDashboardPagePreview;


