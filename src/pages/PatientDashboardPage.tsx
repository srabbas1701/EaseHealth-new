import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { AccessibilityAnnouncer } from '../components/AccessibilityAnnouncer';
import { useDarkMode } from '../hooks/useDarkMode';
import { ArrowLeft, Calendar, FileText, User, Clock, CheckCircle, Bell, Shield, Activity, Heart, Zap, Star, MessageCircle, Phone, MapPin, Mail, Home, UserCheck, ChevronRight, ChevronLeft, TrendingUp, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslations } from '../translations';
import { getPatientProfile, getPatientAppointments } from '../utils/supabase';
// Temporarily commented out recharts imports to fix loading issue
// import { 
//   LineChart, 
//   Line, 
//   AreaChart, 
//   Area, 
//   BarChart, 
//   Bar, 
//   PieChart as RechartsPieChart, 
//   Pie,
//   Cell, 
//   XAxis, 
//   YAxis, 
//   CartesianGrid, 
//   Tooltip, 
//   Legend, 
//   ResponsiveContainer 
// } from 'recharts';

// Auth props interface
interface AuthProps {
  user: any;
  session: any;
  profile: any;
  userState: 'new' | 'returning' | 'authenticated';
  isAuthenticated: boolean;
  handleLogout: () => Promise<void>;
}

function PatientDashboardPage({ user, session, profile, userState, isAuthenticated, handleLogout }: AuthProps) {
  const { isDarkMode } = useDarkMode();
  const { language } = useLanguage();
  const { t } = useTranslations(language);
  const [announcement, setAnnouncement] = useState('');
  const [patientProfile, setPatientProfile] = useState<any>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    completedAppointments: 0,
    upcomingAppointments: 0,
    profileCompletion: 0
  });

  // Chart data
  const appointmentTrendData = [
    { month: 'Jan', appointments: 2 },
    { month: 'Feb', appointments: 3 },
    { month: 'Mar', appointments: 1 },
    { month: 'Apr', appointments: 4 },
    { month: 'May', appointments: 2 },
    { month: 'Jun', appointments: 3 },
  ];

  const healthMetricsData = [
    { name: 'Blood Pressure', value: 120, unit: 'mmHg', status: 'Normal' },
    { name: 'Heart Rate', value: 72, unit: 'bpm', status: 'Normal' },
    { name: 'Weight', value: 65, unit: 'kg', status: 'Normal' },
    { name: 'BMI', value: 22.5, unit: '', status: 'Normal' },
  ];

  const appointmentTypeData = [
    { name: 'General Checkup', value: 45, color: '#0075A2' },
    { name: 'Specialist', value: 30, color: '#0A2647' },
    { name: 'Emergency', value: 15, color: '#E53E3E' },
    { name: 'Follow-up', value: 10, color: '#38A169' },
  ];

  const COLORS = ['#0075A2', '#0A2647', '#E53E3E', '#38A169'];

  // Load patient data
  useEffect(() => {
    const loadPatientData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // Load patient profile
        const profile = await getPatientProfile(user.id);
        setPatientProfile(profile);
        
        // Load appointments (you'll need to implement this function)
        // const appointments = await getPatientAppointments(user.id);
        // setUpcomingAppointments(appointments);
        
        // For now, use sample data
        setUpcomingAppointments([
          { 
            id: '1', 
            doctor: 'Dr. Anjali Sharma', 
            specialty: 'Cardiologist', 
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(), 
            time: '10:00 AM', 
            status: 'Confirmed' 
          },
          { 
            id: '2', 
            doctor: 'Dr. Rajesh Kumar', 
            specialty: 'Neurologist', 
            date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString(), 
            time: '02:30 PM', 
            status: 'Scheduled' 
          },
        ]);

        // Calculate stats
        setStats({
          totalAppointments: 12,
          completedAppointments: 10,
          upcomingAppointments: 2,
          profileCompletion: profile ? 100 : 0
        });

      } catch (error) {
        console.error('Error loading patient data:', error);
        setAnnouncement('Failed to load patient data. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };

    loadPatientData();
  }, [user]);

  // Get user display name
  const getUserDisplayName = () => {
    if (patientProfile?.full_name) {
      return patientProfile.full_name.split(' ')[0];
    }
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name.split(' ')[0];
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  // Show loading state
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
        
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-[#0A2647] dark:text-gray-100 mb-2">
              Loading Your Dashboard
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Please wait while we fetch your medical information...
            </p>
          </div>
        </main>
      </div>
    );
  }

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
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link 
          to="/" 
          className="inline-flex items-center text-[#0075A2] dark:text-[#0EA5E9] hover:text-[#0A2647] dark:hover:text-gray-100 transition-colors mb-8 focus-ring"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </Link>

        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            {t('patientDashboard.welcome')},{' '}
            <span className="bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] bg-clip-text text-transparent">
              {getUserDisplayName()}
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            {t('patientDashboard.tagline')}
          </p>
          
          {/* Quick Stats */}
          <div className="flex flex-wrap justify-center gap-8 mb-12">
            <div className="flex items-center text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-full flex items-center justify-center mr-3">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.upcomingAppointments}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Upcoming Appointments</p>
              </div>
            </div>
            <div className="flex items-center text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-full flex items-center justify-center mr-3">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.profileCompletion}%</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Profile Complete</p>
              </div>
            </div>
            <div className="flex items-center text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-full flex items-center justify-center mr-3">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalAppointments}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Total Visits</p>
              </div>
            </div>
            <div className="flex items-center text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-full flex items-center justify-center mr-3">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">Secure</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Data Protected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Dashboard - Temporarily Simplified */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Appointment Trends Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-[#0075A2] dark:text-[#0EA5E9]" />
                Appointment Trends
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Your healthcare visits over the past 6 months</p>
            </div>
            <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-xl">
              <p className="text-gray-500 dark:text-gray-400">Chart will be loaded here</p>
            </div>
          </div>

          {/* Health Metrics Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-[#0075A2] dark:text-[#0EA5E9]" />
                Health Metrics
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Your latest health measurements</p>
            </div>
            <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-xl">
              <p className="text-gray-500 dark:text-gray-400">Chart will be loaded here</p>
            </div>
          </div>
        </div>

        {/* Health Overview Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-[#0075A2] dark:text-[#0EA5E9]" />
                  Health Overview
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Your health status and recent activity</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {healthMetricsData.map((metric, index) => (
                  <div key={metric.name} className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-full flex items-center justify-center mx-auto mb-3">
                      <Heart className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">{metric.value}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{metric.unit}</p>
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium">{metric.status}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Appointments & Pre-Registration (2/3 width) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Upcoming Appointments */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                <Calendar className="w-6 h-6 mr-3 text-[#0075A2] dark:text-[#0EA5E9]" />
                {t('patientDashboard.upcomingAppointments')}
              </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Your scheduled appointments and medical consultations
                </p>
              </div>
              
              {upcomingAppointments.length > 0 ? (
                <div className="space-y-6">
                  {upcomingAppointments.map(appointment => (
                    <div key={appointment.id} className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-3">
                            <div className="w-12 h-12 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-full flex items-center justify-center mr-4">
                              <User className="w-6 h-6 text-white" />
                            </div>
                      <div>
                              <h3 className="text-lg font-bold text-[#0A2647] dark:text-gray-100">{appointment.doctor}</h3>
                              <p className="text-sm text-[#0075A2] dark:text-[#0EA5E9] font-medium">{appointment.specialty}</p>
                            </div>
                          </div>
                          <div className="flex items-center text-gray-600 dark:text-gray-300 mb-2">
                          <Clock className="w-4 h-4 mr-2" />
                            <span className="font-medium">{appointment.date} at {appointment.time}</span>
                          </div>
                          <div className="flex items-center text-gray-600 dark:text-gray-300">
                            <MapPin className="w-4 h-4 mr-2" />
                            <span>EaseHealth Medical Center</span>
                          </div>
                      </div>
                        <div className="flex flex-col items-end">
                          <span className={`px-4 py-2 rounded-full text-sm font-semibold mb-3 ${
                            appointment.status === 'Confirmed' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {appointment.status}
                      </span>
                          <button className="text-[#0075A2] dark:text-[#0EA5E9] text-sm font-medium hover:underline">
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Calendar className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No Upcoming Appointments</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">You don't have any scheduled appointments yet.</p>
                </div>
              )}
              
              <div className="mt-8 text-center">
                <Link 
                  to="/smart-appointment-booking" 
                  className="inline-flex items-center bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 transform hover:scale-105 focus-ring"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Book New Appointment
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Link>
              </div>
            </div>

            {/* My Pre-Registration Details */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                <FileText className="w-6 h-6 mr-3 text-[#0075A2] dark:text-[#0EA5E9]" />
                {t('patientDashboard.preRegDetails')}
              </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Your complete medical profile and registration information
                </p>
              </div>
              
              <div className="space-y-6">
                {/* Personal Information */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-[#0A2647] dark:text-gray-100 mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2 text-[#0075A2] dark:text-[#0EA5E9]" />
                    Personal Information
                  </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('patientDashboard.fields.fullName')}</p>
                      <p className="text-[#0A2647] dark:text-gray-100 font-medium">
                        {patientProfile?.full_name || user?.user_metadata?.full_name || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('patientDashboard.fields.ageGender')}</p>
                      <p className="text-[#0A2647] dark:text-gray-100 font-medium">
                        {patientProfile?.date_of_birth ? 
                          `${new Date().getFullYear() - new Date(patientProfile.date_of_birth).getFullYear()} years` : 
                          'Not provided'
                        } / {patientProfile?.gender || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('patientDashboard.fields.phoneNumber')}</p>
                      <p className="text-[#0A2647] dark:text-gray-100 font-medium flex items-center">
                        <Phone className="w-4 h-4 mr-2" />
                        {patientProfile?.phone_number || user?.user_metadata?.phone || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('patientDashboard.fields.location')}</p>
                      <p className="text-[#0A2647] dark:text-gray-100 font-medium flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        {patientProfile?.address || 'Not provided'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Medical Information */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-[#0A2647] dark:text-gray-100 mb-4 flex items-center">
                    <Heart className="w-5 h-5 mr-2 text-[#0075A2] dark:text-[#0EA5E9]" />
                    Medical Information
                  </h3>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Medical History</p>
                    <p className="text-[#0A2647] dark:text-gray-100 bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                      {patientProfile?.medical_history || 'No medical history recorded'}
                    </p>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Allergies</p>
                    <p className="text-[#0A2647] dark:text-gray-100 bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                      {patientProfile?.allergies || 'No known allergies'}
                    </p>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Current Medications</p>
                    <p className="text-[#0A2647] dark:text-gray-100 bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                      {patientProfile?.current_medications || 'No current medications'}
                    </p>
                  </div>
                </div>

                {/* Documents */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-[#0A2647] dark:text-gray-100 mb-4 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-[#0075A2] dark:text-[#0EA5E9]" />
                    Documents
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mr-3">
                          <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-[#0A2647] dark:text-gray-100 font-medium">Insurance Information</span>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {patientProfile?.insurance_provider || 'Not provided'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mr-3">
                          <Heart className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-[#0A2647] dark:text-gray-100 font-medium">Blood Type</span>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {patientProfile?.blood_type || 'Not specified'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Consent Status */}
                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-[#0A2647] dark:text-gray-100 mb-4 flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-[#0075A2] dark:text-[#0EA5E9]" />
                    Consent & Privacy
                  </h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Profile Status</p>
                      <p className="text-[#0A2647] dark:text-gray-100">Medical profile completion and data consent</p>
                </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      patientProfile?.is_active 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {patientProfile?.is_active ? 'Active' : 'Incomplete'}
                  </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 text-center">
                <Link 
                  to="/patient-pre-registration" 
                  className="inline-flex items-center bg-white dark:bg-gray-800 text-[#0075A2] dark:text-[#0EA5E9] border-2 border-[#0075A2] dark:border-[#0EA5E9] px-8 py-4 rounded-xl font-semibold hover:bg-[#0075A2] dark:hover:bg-[#0EA5E9] hover:text-white transition-all duration-200 focus-ring"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  Update Profile
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column - Quick Actions & Health Tips (1/3 width) */}
          <div className="lg:col-span-1 space-y-8">
            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700 sticky top-24">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {t('patientDashboard.quickActions')}
              </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Quick access to your most used features
                </p>
              </div>
              
              <div className="space-y-4">
                <Link 
                  to="/smart-appointment-booking" 
                  className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] text-white rounded-2xl font-semibold hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 focus-ring group"
                >
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                    <Calendar className="w-5 h-5" />
                  </div>
                  {t('patientDashboard.bookNew')}
                  <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                
                <Link 
                  to="/patient-pre-registration" 
                  className="w-full flex items-center justify-center px-6 py-4 border-2 border-[#0075A2] dark:border-[#0EA5E9] text-[#0075A2] dark:text-[#0EA5E9] rounded-2xl font-semibold hover:bg-[#0075A2] dark:hover:bg-[#0EA5E9] hover:text-white transition-all duration-200 focus-ring group"
                >
                  <div className="w-10 h-10 bg-[#0075A2]/10 dark:bg-[#0EA5E9]/10 rounded-full flex items-center justify-center mr-3 group-hover:bg-white/20 transition-colors">
                    <FileText className="w-5 h-5" />
                  </div>
                  {t('patientDashboard.updatePreRegistration')}
                  <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                
                <button className="w-full flex items-center justify-center px-6 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-2xl font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 focus-ring group">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                    <Bell className="w-5 h-5" />
                  </div>
                  {t('patientDashboard.manageReminders')}
                  <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Health Tips */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {t('patientDashboard.healthTipsTitle')}
              </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Tips for maintaining good health
                </p>
              </div>
              
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-4">
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#0A2647] dark:text-gray-100 mb-1">Stay Hydrated</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{t('patientDashboard.tips.tip1')}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-4">
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#0A2647] dark:text-gray-100 mb-1">Regular Exercise</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{t('patientDashboard.tips.tip2')}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-4">
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#0A2647] dark:text-gray-100 mb-1">Balanced Diet</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{t('patientDashboard.tips.tip3')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Support Section */}
            <div className="bg-gradient-to-br from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-3xl shadow-2xl p-8 text-white">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">Need Help?</h3>
                <p className="text-white/80 text-sm mb-6">Our support team is here to assist you with any questions or concerns.</p>
                <div className="space-y-3">
                  <button className="w-full bg-white/20 hover:bg-white/30 text-white px-4 py-3 rounded-xl font-medium transition-colors focus-ring">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Call Support
                  </button>
                  <button className="w-full bg-white/20 hover:bg-white/30 text-white px-4 py-3 rounded-xl font-medium transition-colors focus-ring">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email Support
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default PatientDashboardPage;