import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { AccessibilityAnnouncer } from '../components/AccessibilityAnnouncer';
import { useDarkMode } from '../hooks/useDarkMode';
import { ArrowLeft, Calendar, FileText, User, Clock, CheckCircle, Bell, Shield, Activity, Heart, Zap, Star, MessageCircle, Phone, MapPin, Mail, Home, UserCheck, ChevronRight, ChevronLeft, TrendingUp, BarChart3, PieChart as PieChartIcon, X, AlertCircle, Edit3, Upload, Brain, Pill, Thermometer, Scale, Gauge } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslations } from '../translations';
import { getPatientProfileWithStats, getUpcomingAppointments, getAppointmentHistory } from '../utils/patientProfileUtils';
import { getFreshSignedUrls } from '../utils/patientFileUploadUtils';
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

  const { language } = useLanguage();
  const { t } = useTranslations(language);
  const location = useLocation();
  const navigate = useNavigate();
  const [announcement, setAnnouncement] = useState('');
  const [patientProfile, setPatientProfile] = useState<any>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [appointmentDetails, setAppointmentDetails] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [stats, setStats] = useState({
    totalAppointments: 0,
    completedAppointments: 0,
    upcomingAppointments: 0,
    profileCompletion: 0
  });

  // Tab state
  const [activeTab, setActiveTab] = useState<'pre-registration' | 'prescriptions' | 'uploaded-files' | 'ai-analytics'>('pre-registration');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<any>(null);
  const [freshLabReportUrls, setFreshLabReportUrls] = useState<string[]>([]);
  const [freshIdProofUrls, setFreshIdProofUrls] = useState<string[]>([]);

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
    { name: 'Blood Pressure', value: 120, unit: 'mmHg', status: 'Normal', icon: Thermometer },
    { name: 'Heart Rate', value: 72, unit: 'bpm', status: 'Normal', icon: Heart },
    { name: 'Weight', value: 65, unit: 'kg', status: 'Normal', icon: Scale },
    { name: 'BMI', value: 22.5, unit: '', status: 'Normal', icon: Gauge },
  ];

  const appointmentTypeData = [
    { name: 'General Checkup', value: 45, color: '#0075A2' },
    { name: 'Specialist', value: 30, color: '#0A2647' },
    { name: 'Emergency', value: 15, color: '#E53E3E' },
    ,
  ];

  const COLORS = ['#0075A2', '#0A2647', '#E53E3E', '#38A169'];

  // Check for appointment success message from login
  useEffect(() => {
    if (location.state?.appointmentCreated) {
      setShowSuccessMessage(true);
      setAppointmentDetails(location.state.appointmentDetails);
      // Announce to screen readers
      setAnnouncement(`Appointment created successfully with ${location.state.appointmentDetails.doctorName}`);
    } else if (location.state?.appointmentError) {
      // Show error message
      setShowErrorMessage(true);
      setErrorMessage(location.state.errorMessage || 'Unknown error');
      setAnnouncement(`Failed to create appointment: ${location.state.errorMessage || 'Unknown error'}`);
      console.error('❌ Appointment creation error:', location.state.errorMessage);
    }
  }, [location.state]);

  // Load patient data with caching
  useEffect(() => {
    const loadPatientData = async () => {
      if (!user) return;

      // Check if we already have data for this user (prevent re-loading on tab focus)
      if (patientProfile && patientProfile.user_id === user.id) {
        console.log('📦 Using cached patient data');
        return;
      }

      try {
        setIsLoading(true);
        console.log('🔄 Loading patient data...');

        // Load patient profile and stats
        const { profile, stats } = await getPatientProfileWithStats(user.id);
        setPatientProfile(profile);
        setStats(stats);

        // Refresh signed URLs for documents
        if (profile) {
          await refreshSignedUrls(profile);
        }

        // Load upcoming appointments
        if (profile?.id) {
          const appointments = await getUpcomingAppointments(profile.id);
          setUpcomingAppointments(appointments);
        }

        console.log('✅ Patient data loaded successfully');
      } catch (error) {
        console.error('Error loading patient data:', error);
        setAnnouncement('Failed to load patient data. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };

    loadPatientData();
  }, [user, patientProfile]);

  // Manual refresh function
  const refreshPatientData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      console.log('🔄 Manually refreshing patient data...');

      // Load patient profile and stats
      const { profile, stats } = await getPatientProfileWithStats(user.id);
      setPatientProfile(profile);
      setStats(stats);

      // Refresh signed URLs for documents
      if (profile) {
        await refreshSignedUrls(profile);
      }

      // Load upcoming appointments
      if (profile?.id) {
        const appointments = await getUpcomingAppointments(profile.id);
        setUpcomingAppointments(appointments);
      }

      console.log('✅ Patient data refreshed successfully');
      setAnnouncement('Dashboard data refreshed');
    } catch (error) {
      console.error('Error refreshing patient data:', error);
      setAnnouncement('Failed to refresh data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel appointment functionality
  const handleCancelAppointment = (appointmentId: string, appointmentData: any) => {
    setAppointmentToCancel({ id: appointmentId, data: appointmentData });
    setShowCancelModal(true);
  };

  const confirmCancelAppointment = async () => {
    if (!appointmentToCancel) return;

    try {
      console.log('🔄 Cancelling appointment:', appointmentToCancel.id);

      // Import the cancelAppointment function
      const { cancelAppointment } = await import('../utils/supabase');

      // Cancel the appointment
      await cancelAppointment(appointmentToCancel.id);

      // Refresh the appointments list
      if (patientProfile?.id) {
        const appointments = await getUpcomingAppointments(patientProfile.id);
        setUpcomingAppointments(appointments);
      }

      // Refresh stats
      if (user?.id) {
        const { stats } = await getPatientProfileWithStats(user.id);
        setStats(stats);
      }

      setAnnouncement(`Appointment with ${appointmentToCancel.data.doctor} cancelled successfully`);
      console.log('✅ Appointment cancelled successfully');

      // Close modal
      setShowCancelModal(false);
      setAppointmentToCancel(null);

    } catch (error) {
      console.error('❌ Error cancelling appointment:', error);
      setAnnouncement('Failed to cancel appointment. Please try again.');
    }
  };

  // Reschedule appointment functionality
  const handleRescheduleAppointment = (appointmentData: any) => {
    console.log('🔄 Rescheduling appointment:', appointmentData);

    // Convert date string back to Date object for proper handling
    const appointmentDate = new Date(appointmentData.date.split('/').reverse().join('-'));

    // Navigate to booking page with pre-filled data
    navigate('/smart-appointment-booking', {
      state: {
        reschedule: true,
        appointmentData: appointmentData,
        selectedDoctor: appointmentData.doctor,
        selectedDate: appointmentDate,
        selectedTime: appointmentData.time
      }
    });

    setAnnouncement(`Redirecting to reschedule appointment with ${appointmentData.doctor}`);
  };

  // Function to refresh signed URLs for documents
  const refreshSignedUrls = async (patientProfile: any) => {
    try {
      console.log('🔄 Refreshing signed URLs for documents...');

      // Refresh lab report URLs
      if (patientProfile.lab_report_urls && patientProfile.lab_report_urls.length > 0) {
        const freshLabUrls = await getFreshSignedUrls(patientProfile.lab_report_urls, 'lab_reports');
        setFreshLabReportUrls(freshLabUrls);
        console.log('✅ Refreshed lab report URLs:', freshLabUrls.length);
      }

      // Refresh ID proof URLs
      if (patientProfile.id_proof_urls && patientProfile.id_proof_urls.length > 0) {
        const freshIdUrls = await getFreshSignedUrls(patientProfile.id_proof_urls, 'aadhaar_documents');
        setFreshIdProofUrls(freshIdUrls);
        console.log('✅ Refreshed ID proof URLs:', freshIdUrls.length);
      }
    } catch (error) {
      console.error('❌ Error refreshing signed URLs:', error);
      // Fallback to original URLs
      setFreshLabReportUrls(patientProfile.lab_report_urls || []);
      setFreshIdProofUrls(patientProfile.id_proof_urls || []);
    }
  };

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
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#0075A2] border-t-transparent mx-auto mb-4"></div>
              <p className="text-lg text-gray-600 dark:text-gray-300">Loading your dashboard...</p>
            </div>
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          to="/"
          className="inline-flex items-center text-[#0075A2] dark:text-[#0EA5E9] hover:text-[#0A2647] dark:hover:text-gray-100 transition-colors mb-8 focus-ring"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          {t('common.backToHome')}
        </Link>

        {/* Success Message Banner */}
        {showSuccessMessage && appointmentDetails && (
          <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">
                  ✅ Appointment Booked Successfully!
                </h3>
                <div className="text-sm text-green-800 dark:text-green-200 space-y-1">
                  <p><strong>Doctor:</strong> {appointmentDetails.doctorName}</p>
                  <p><strong>Date:</strong> {appointmentDetails.date}</p>
                  <p><strong>Time:</strong> {appointmentDetails.time}</p>
                  {appointmentDetails.queueToken && (
                    <p className="mt-2">
                      <strong>Queue Token:</strong>
                      <span className="ml-2 px-2 py-1 bg-green-100 dark:bg-green-800 rounded font-mono text-xs">
                        {appointmentDetails.queueToken}
                      </span>
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowSuccessMessage(false)}
                className="ml-4 flex-shrink-0 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 focus-ring rounded"
                aria-label="Close success message"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Error Message Banner */}
        {showErrorMessage && errorMessage && (
          <div className="mb-6 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-semibold text-red-900 dark:text-red-100 mb-2">
                  ❌ Failed to Create Appointment
                </h3>
                <p className="text-sm text-red-800 dark:text-red-200">
                  {errorMessage}
                </p>
              </div>
              <button
                onClick={() => setShowErrorMessage(false)}
                className="ml-4 flex-shrink-0 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 focus-ring rounded"
                aria-label="Close error message"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Patient Dashboard Header - Identical to Doctor Dashboard */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-[#E8E8E8] dark:border-gray-600 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-2xl flex items-center justify-center text-white font-bold text-3xl overflow-hidden">
                {patientProfile?.profile_image_url ? (
                  <img
                    src={patientProfile.profile_image_url}
                    alt="Profile"
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  <User className="w-12 h-12 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#0A2647] dark:text-gray-100">
                  <span className="text-[#0075A2] dark:text-[#0EA5E9]">{getUserDisplayName()}</span> Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-300 text-lg">Patient Portal</p>
                {patientProfile?.email && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{patientProfile.email}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Last login</p>
              <p className="text-lg font-semibold text-[#0A2647] dark:text-gray-100">
                {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleTimeString('en-GB', { hour12: false }) : ''}
              </p>
              <div className="mt-4">
                <Link
                  to="/patient-profile-update"
                  className="bg-gradient-to-r from-[#0075A2] to-[#0A2647] text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 text-sm flex items-center inline-flex"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Update Profile
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Overview Section */}
        <div className="space-y-6 mb-8">
          {/* Health Overview Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-[#E8E8E8] dark:border-gray-600">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-2 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-[#0075A2] dark:text-[#0EA5E9]" />
                Health Overview
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Your health status and recent activity</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {healthMetricsData.map((metric, index) => {
                const MetricIcon = metric.icon;
                return (
                  <div key={metric.name} className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-full flex items-center justify-center mx-auto mb-3">
                      <MetricIcon className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-[#0A2647] dark:text-gray-100">{metric.value} {metric.unit}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{metric.name}</p>
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium">{metric.status}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-[#E8E8E8] dark:border-gray-600">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Upcoming Appointments</p>
                  <p className="text-2xl font-bold text-[#0A2647] dark:text-gray-100">{stats.upcomingAppointments}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-[#E8E8E8] dark:border-gray-600">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Profile Complete</p>
                  <p className="text-2xl font-bold text-[#0A2647] dark:text-gray-100">{stats.profileCompletion}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-[#E8E8E8] dark:border-gray-600">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                  <Activity className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Visits</p>
                  <p className="text-2xl font-bold text-[#0A2647] dark:text-gray-100">{stats.totalAppointments}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-[#E8E8E8] dark:border-gray-600">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                  <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Secure Data</p>
                  <p className="text-2xl font-bold text-[#0A2647] dark:text-gray-100">Protected</p>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Appointments */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-[#E8E8E8] dark:border-gray-600">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-[#0075A2] dark:text-[#0EA5E9]" />
                Upcoming Appointments
              </h3>
              <Link
                to="/smart-appointment-booking"
                className="bg-gradient-to-r from-[#0075A2] to-[#0A2647] text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 text-sm"
              >
                Book New Appointment
              </Link>
            </div>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-700">
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Time</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Doctor</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Queue #</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingAppointments.length > 0 ? (
                    upcomingAppointments.map((appointment, index) => (
                      <tr key={index} className="border-b border-gray-100 dark:border-gray-700">
                        <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                          {appointment.date}
                        </td>
                        <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                          {appointment.time}
                        </td>
                        <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                          {appointment.doctor || 'Doctor'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${appointment.status === 'BOOKED'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : appointment.status === 'CANCELLED'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            }`}>
                            {appointment.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                          {appointment.queue_token || 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleCancelAppointment(appointment.id, appointment)}
                              disabled={appointment.status === 'CANCELLED'}
                              className={`text-sm font-medium transition-colors ${appointment.status === 'CANCELLED'
                                ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                : 'text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:underline'
                                }`}
                              title={appointment.status === 'CANCELLED' ? 'Appointment already cancelled' : 'Cancel this appointment'}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleRescheduleAppointment(appointment)}
                              disabled={appointment.status === 'CANCELLED'}
                              className={`text-sm font-medium transition-colors ${appointment.status === 'CANCELLED'
                                ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                : 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline'
                                }`}
                              title={appointment.status === 'CANCELLED' ? 'Cannot reschedule cancelled appointment' : 'Reschedule this appointment'}
                            >
                              Reschedule
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500 dark:text-gray-400">
                        No upcoming appointments
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 border border-[#E8E8E8] dark:border-gray-600">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {[
              { id: 'pre-registration', label: 'Pre-Registration Details', icon: FileText },
              { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
              { id: 'uploaded-files', label: 'Uploaded Files', icon: Upload },
              { id: 'ai-analytics', label: 'AI Analytics', icon: Brain }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
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
        {activeTab === 'pre-registration' && (
          <div className="space-y-6">
            {/* Pre-Registration Details Tab */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-[#E8E8E8] dark:border-gray-600">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-[#0075A2] dark:text-[#0EA5E9]" />
                  Pre-Registration Details
                </h3>
                <Link
                  to="/patient-profile-update"
                  className="bg-gradient-to-r from-[#0075A2] to-[#0A2647] text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 text-sm flex items-center"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Update Profile
                </Link>
              </div>

              {patientProfile && (
                <div className="space-y-6">
                  {/* Personal Information */}
                  <div>
                    <h4 className="text-lg font-semibold text-[#0A2647] dark:text-gray-100 mb-4 flex items-center">
                      <User className="w-5 h-5 mr-2 text-[#0075A2] dark:text-[#0EA5E9]" />
                      Personal Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Patient Name</p>
                        <p className="font-semibold text-[#0A2647] dark:text-gray-100">{patientProfile.full_name || 'N/A'}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Phone Number</p>
                        <p className="font-semibold text-[#0A2647] dark:text-gray-100">{patientProfile.phone_number || 'N/A'}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Age/Gender</p>
                        <p className="font-semibold text-[#0A2647] dark:text-gray-100">
                          {patientProfile.age ? `${patientProfile.age} years` : 'N/A'} / {patientProfile.gender || 'N/A'}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Location</p>
                        <p className="font-semibold text-[#0A2647] dark:text-gray-100">
                          {patientProfile.city || 'N/A'} {patientProfile.state || ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Medical Information */}
                  <div>
                    <h4 className="text-lg font-semibold text-[#0A2647] dark:text-gray-100 mb-4 flex items-center">
                      <Heart className="w-5 h-5 mr-2 text-[#0075A2] dark:text-[#0EA5E9]" />
                      Medical Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Medical History</p>
                        <p className="font-semibold text-[#0A2647] dark:text-gray-100">{patientProfile.medical_history || 'N/A'}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Allergies</p>
                        <p className="font-semibold text-[#0A2647] dark:text-gray-100">{patientProfile.allergies || 'N/A'}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Current Medications</p>
                        <p className="font-semibold text-[#0A2647] dark:text-gray-100">{patientProfile.current_medications || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Insurance and Blood Type Information */}
                  <div>
                    <h4 className="text-lg font-semibold text-[#0A2647] dark:text-gray-100 mb-4 flex items-center">
                      <Shield className="w-5 h-5 mr-2 text-[#0075A2] dark:text-[#0EA5E9]" />
                      Insurance & Blood Type
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Insurance Provider</p>
                        <p className="font-semibold text-[#0A2647] dark:text-gray-100">{patientProfile.insurance_provider || 'N/A'}</p>
                        {patientProfile.insurance_number && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Policy: {patientProfile.insurance_number}</p>
                        )}
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Blood Type</p>
                        <p className="font-semibold text-[#0A2647] dark:text-gray-100">{patientProfile.blood_type || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Lab Reports Section */}
                  <div>
                    <h4 className="text-lg font-semibold text-[#0A2647] dark:text-gray-100 mb-4 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-[#0075A2] dark:text-[#0EA5E9]" />
                      Lab Reports
                    </h4>
                    {freshLabReportUrls && freshLabReportUrls.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {freshLabReportUrls.map((url: string, index: number) => (
                          <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-[#0A2647] dark:text-gray-100">Lab Report {index + 1}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Click to view document</p>
                              </div>
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-[#0075A2] dark:bg-[#0EA5E9] text-white px-3 py-2 rounded-lg hover:bg-[#0A2647] dark:hover:bg-[#0284C7] transition-colors text-sm font-medium"
                              >
                                View Report
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
                        <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 dark:text-gray-400">No lab reports uploaded yet</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'prescriptions' && (
          <div className="space-y-6">
            {/* Prescriptions Tab */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-[#E8E8E8] dark:border-gray-600">
              <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-6 flex items-center">
                <Pill className="w-5 h-5 mr-2 text-[#0075A2] dark:text-[#0EA5E9]" />
                Prescriptions
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Doctor</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-gray-500 dark:text-gray-400">
                        No prescriptions available
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'uploaded-files' && (
          <div className="space-y-6">
            {/* Uploaded Files Tab */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-[#E8E8E8] dark:border-gray-600">
              <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-6 flex items-center">
                <Upload className="w-5 h-5 mr-2 text-[#0075A2] dark:text-[#0EA5E9]" />
                Uploaded Files
              </h3>
              {patientProfile && (
                <div className="space-y-6">
                  {/* ID Proof Documents */}
                  {freshIdProofUrls && freshIdProofUrls.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-[#0A2647] dark:text-gray-100 mb-4">ID Proof Documents</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {freshIdProofUrls.map((url: string, index: number) => (
                          <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-[#0A2647] dark:text-gray-100">ID Proof {index + 1}</span>
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#0075A2] dark:text-[#0EA5E9] hover:underline text-sm"
                              >
                                View
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lab Reports */}
                  {freshLabReportUrls && freshLabReportUrls.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-[#0A2647] dark:text-gray-100 mb-4">Lab Reports</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {freshLabReportUrls.map((url: string, index: number) => (
                          <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-[#0A2647] dark:text-gray-100">Lab Report {index + 1}</span>
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#0075A2] dark:text-[#0EA5E9] hover:underline text-sm"
                              >
                                View
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Profile Image */}
                  {patientProfile.profile_image_url && (
                    <div>
                      <h4 className="text-lg font-semibold text-[#0A2647] dark:text-gray-100 mb-4">Profile Image</h4>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-[#0A2647] dark:text-gray-100">Profile Picture</span>
                          <a
                            href={patientProfile.profile_image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#0075A2] dark:text-[#0EA5E9] hover:underline text-sm"
                          >
                            View
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* No files message */}
                  {freshIdProofUrls.length === 0 &&
                    freshLabReportUrls.length === 0 &&
                    !patientProfile.profile_image_url && (
                      <div className="text-center py-8">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">No files uploaded yet</p>
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'ai-analytics' && (
          <div className="space-y-6">
            {/* AI Analytics Tab */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-[#E8E8E8] dark:border-gray-600">
              <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-6 flex items-center">
                <Brain className="w-5 h-5 mr-2 text-[#0075A2] dark:text-[#0EA5E9]" />
                AI Analytics
              </h3>
              <div className="text-center py-12">
                <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-[#0A2647] dark:text-gray-100 mb-2">Generate AI Analytics</h4>
                <p className="text-gray-600 dark:text-gray-300 mb-6">Select prescriptions from the Prescriptions tab to generate AI-driven health analytics</p>
                <button className="bg-gradient-to-r from-[#0075A2] to-[#0A2647] text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200">
                  Generate Analytics
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Cancel Confirmation Modal */}
        {showCancelModal && appointmentToCancel && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 max-w-md w-full mx-4 border border-[#E8E8E8] dark:border-gray-600">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mr-4">
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#0A2647] dark:text-gray-100">Cancel Appointment</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">This action cannot be undone</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  Are you sure you want to cancel your appointment with:
                </p>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <p className="font-medium text-[#0A2647] dark:text-gray-100">
                    {appointmentToCancel.data.doctor}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {appointmentToCancel.data.date} at {appointmentToCancel.data.time}
                  </p>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setAppointmentToCancel(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Keep Appointment
                </button>
                <button
                  onClick={confirmCancelAppointment}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Yes, Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default PatientDashboardPage;