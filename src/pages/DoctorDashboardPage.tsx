import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, Clock, Save, ChevronLeft, ChevronRight, X, CheckCircle, AlertCircle, User, FileText, ArrowLeft
} from 'lucide-react';
import Navigation from '../components/Navigation';
import AuthModal from '../components/AuthModal';
import UnifiedDoctorRegistrationForm from '../components/UnifiedDoctorRegistrationForm';

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
  
  // Schedule management states
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'patients' | 'reports'>('overview');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isGeneratingSlots, setIsGeneratingSlots] = useState(false);
  const [slotsGenerated, setSlotsGenerated] = useState(false);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  
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
      
      // Simulate save delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('✅ Schedule saved successfully');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
    } catch (error) {
      console.error('❌ Error saving schedules:', error);
      setError(error instanceof Error ? error.message : 'Failed to save schedule. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [currentWeekSchedule]);
  
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
  
  // Load doctor data when authenticated or in test mode
  useEffect(() => {
    const loadDoctorData = async () => {
      if ((isAuthenticated && user && !doctor) || (isTestMode && !doctor)) {
        setIsLoadingDoctor(true);
        try {
          // Simulate doctor data loading
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Mock doctor data for now
          const mockDoctor = {
            id: user?.id || 'test-doctor-id',
            full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Dr. Smith',
            specialty: 'General Medicine',
            profile_image_url: null,
            email: user?.email || 'doctor@example.com',
            phone: user?.user_metadata?.phone || '+1234567890'
          };
          
          setDoctor(mockDoctor);
        } catch (error) {
          console.error('Error loading doctor data:', error);
        } finally {
          setIsLoadingDoctor(false);
        }
      }
    };

    loadDoctorData();
  }, [isAuthenticated, user, doctor, isTestMode]);
  
  if (!isAuthenticated && !isTestMode) {
    return (
        <div className="min-h-screen bg-[#F6F6F6] dark:bg-gray-900 text-[#0A2647] dark:text-gray-100 transition-colors duration-300">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="w-20 h-20 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-2xl flex items-center justify-center text-white font-bold text-3xl mx-auto mb-6">
              D
              </div>
            <h1 className="text-3xl font-bold text-[#0A2647] dark:text-gray-100 mb-4">Doctor Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8">Please log in to access your medical practice dashboard</p>
            
            <div className="space-y-4">
              <button
                onClick={handleLoginClick}
                className="w-full bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200"
              >
                Sign In as Doctor
              </button>
              
              <button
                onClick={handleSignupClick}
                className="w-full bg-white dark:bg-gray-800 text-[#0075A2] dark:text-[#0EA5E9] px-6 py-3 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 border border-[#0075A2] dark:border-[#0EA5E9]"
              >
                Register as Doctor
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="w-full text-gray-600 dark:text-gray-300 hover:text-[#0075A2] dark:hover:text-[#0EA5E9] transition-colors text-sm"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>

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
              <div className="w-24 h-24 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-2xl flex items-center justify-center text-white font-bold text-3xl">
                {doctor?.full_name?.charAt(0) || user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'D'}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#0A2647] dark:text-gray-100">
                  {doctor?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Doctor'} Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-300 text-lg">{doctor?.specialty || 'General Medicine'}</p>
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
                    onClick={() => setCurrentWeekOffset(Math.max(0, currentWeekOffset - 1))}
                    disabled={currentWeekOffset === 0}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-lg font-medium text-[#0A2647] dark:text-gray-100 min-w-[200px] text-center">
                    {weekRange.fullStart} - {weekRange.fullEnd}
                  </span>
                  <button
                    onClick={() => setCurrentWeekOffset(Math.min(3, currentWeekOffset + 1))}
                    disabled={currentWeekOffset === 3}
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
            <button
              onClick={handleSaveSchedules}
              disabled={isSaving}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] text-white rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSaving ? (
                <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                </>
              ) : (
                <>
                      <Save className="w-4 h-4" />
                      <span>Save Schedule</span>
                </>
              )}
            </button>

                <button
                  onClick={clearAllSchedules}
                  disabled={isSaving}
                  className="flex items-center space-x-2 px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-4 h-4" />
                  <span>Clear All</span>
                </button>

                <button
                  onClick={async () => {
                    setIsGeneratingSlots(true);
                    setError('');
                    try {
                      await new Promise(resolve => setTimeout(resolve, 2000));
                      setSlotsGenerated(true);
                      setTimeout(() => setSlotsGenerated(false), 3000);
                    } catch (error) {
                      setError('Failed to generate time slots');
                    } finally {
                      setIsGeneratingSlots(false);
                    }
                  }}
                  disabled={isGeneratingSlots}
                  className="flex items-center space-x-2 px-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingSlots ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Generating Slots...</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4" />
                      <span>Generate Time Slots (4 weeks)</span>
                </>
              )}
            </button>
                    </div>

              {/* Success/Error Messages */}
              {saveSuccess && (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <p className="text-green-700 dark:text-green-300">Schedule saved successfully!</p>
                  </div>
                  </div>
              )}

              {slotsGenerated && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-blue-500 mr-2" />
                    <p className="text-blue-700 dark:text-blue-300">Time slots generated successfully for the next 4 weeks!</p>
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