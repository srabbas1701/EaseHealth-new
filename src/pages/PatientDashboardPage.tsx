import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { AccessibilityAnnouncer } from '../components/AccessibilityAnnouncer';
import { useDarkMode } from '../hooks/useDarkMode';
import { ArrowLeft, Calendar, FileText, User, Clock, CheckCircle, Bell, Shield, Activity, Heart, Zap, Star, MessageCircle, Phone, MapPin, Mail, Home, UserCheck, ChevronRight, ChevronLeft, TrendingUp, BarChart3, PieChart as PieChartIcon, X, AlertCircle, Edit3, Upload, Brain, Pill, Thermometer, Scale, Gauge, Eye } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslations } from '../translations';
import { getPatientProfileWithStats, getUpcomingAppointments, getAppointmentHistory } from '../utils/patientProfileUtils';
import { getFreshSignedUrls, deletePatientDocument, updatePatientFileUrls } from '../utils/patientFileUploadUtils';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import { usePatientVitals } from '../hooks/patient/usePatientVitals';
import { usePatientReports } from '../hooks/patient/usePatientReports';
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
  const [freshIdProofUrls, setFreshIdProofUrls] = useState<string[]>([]);

  // Use patient reports hook for lab reports (replaces freshLabReportUrls)
  const { reports: labReports, isLoading: isLoadingLabReports, deleteReport: deletePatientReport } = usePatientReports(patientProfile?.id || null);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<{
    type: 'idProof' | 'labReport' | 'profileImage';
    index: number;
    fileName: string;
    reportId?: string; // for labReport
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Loading states for appointment actions
  const [isCancellingAppointment, setIsCancellingAppointment] = useState(false);
  const [isReschedulingAppointment, setIsReschedulingAppointment] = useState(false);

  // Patient vitals hook
  const { vitals, isLoading: isLoadingVitals } = usePatientVitals(patientProfile?.id);

  // Chart data
  const appointmentTrendData = [
    { month: 'Jan', appointments: 2 },
    { month: 'Feb', appointments: 3 },
    { month: 'Mar', appointments: 1 },
    { month: 'Apr', appointments: 4 },
    { month: 'May', appointments: 2 },
    { month: 'Jun', appointments: 3 },
  ];

  // Dynamic health metrics data from patient_vitals table
  const healthMetricsData = [
    {
      name: t('patientDashboard.healthMetrics.bloodPressure'),
      value: vitals?.blood_pressure || '--',
      unit: 'mmHg',
      status: vitals?.blood_pressure ? t('common.status.normal') : '--',
      icon: Thermometer
    },
    {
      name: t('patientDashboard.healthMetrics.heartRate'),
      value: vitals?.heart_rate || '--',
      unit: 'bpm',
      status: vitals?.heart_rate ? t('common.status.normal') : '--',
      icon: Heart
    },
    {
      name: t('patientDashboard.healthMetrics.weight'),
      value: vitals?.weight ? vitals.weight.toFixed(1) : '--',
      unit: 'kg',
      status: vitals?.weight ? t('common.status.normal') : '--',
      icon: Scale
    },
    {
      name: t('patientDashboard.healthMetrics.bmi'),
      value: vitals?.bmi ? vitals.bmi.toFixed(1) : '--',
      unit: '',
      status: vitals?.bmi ? t('common.status.normal') : '--',
      icon: Gauge
    },
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

    setIsCancellingAppointment(true);
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
    } finally {
      setIsCancellingAppointment(false);
    }
  };

  // Reschedule appointment functionality
  const handleRescheduleAppointment = async (appointmentData: any) => {
    setIsReschedulingAppointment(true);
    try {
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
    } catch (error) {
      console.error('❌ Error rescheduling appointment:', error);
      setAnnouncement('Failed to reschedule appointment. Please try again.');
    } finally {
      setIsReschedulingAppointment(false);
    }
  };

  // Function to refresh signed URLs for documents
  const refreshSignedUrls = async (patientProfile: any) => {
    try {
      console.log('🔄 Refreshing signed URLs for documents...');

      // Lab reports are now handled by usePatientReports hook - no need to refresh here

      // Refresh ID proof URLs
      if (patientProfile.id_proof_urls && patientProfile.id_proof_urls.length > 0) {
        const freshIdUrls = await getFreshSignedUrls(patientProfile.id_proof_urls, 'aadhaar_documents');
        setFreshIdProofUrls(freshIdUrls);
        console.log('✅ Refreshed ID proof URLs:', freshIdUrls.length);
      }
    } catch (error) {
      console.error('❌ Error refreshing signed URLs:', error);
      // Fallback to original URLs
      setFreshIdProofUrls(patientProfile.id_proof_urls || []);
    }
  };

  // Handle file deletion
  const handleDeleteFile = async () => {
    if (!fileToDelete || !patientProfile) return;

    setIsDeleting(true);
    try {
      console.log('🗑️ Deleting file:', fileToDelete);

      // Get current URLs based on file type
      let currentUrls: string[] = [];
      let documentType: 'aadhaar_documents' | 'lab_reports' | 'profile_image';

      switch (fileToDelete.type) {
        case 'idProof':
          currentUrls = [...freshIdProofUrls];
          documentType = 'aadhaar_documents';
          break;
        case 'labReport':
          // handled via onConfirmWithReason below, not here
          setShowDeleteModal(false);
          setIsDeleting(false);
          return;
        case 'profileImage':
          currentUrls = patientProfile.profile_image_url ? [patientProfile.profile_image_url] : [];
          documentType = 'profile_image';
          break;
        default:
          throw new Error('Invalid file type');
      }

      // Remove the file from the array
      const updatedUrls = currentUrls.filter((_, index) => index !== fileToDelete.index);

      // Update the patient record with new URLs
      await updatePatientFileUrls(patientProfile.id, documentType, updatedUrls);

      // Update local state
      switch (fileToDelete.type) {
        case 'idProof':
          setFreshIdProofUrls(updatedUrls);
          break;
        case 'labReport':
          // No longer needed - handled by patient_reports table
          break;
        case 'profileImage':
          // Update patient profile state
          setPatientProfile(prev => ({
            ...prev,
            profile_image_url: updatedUrls.length > 0 ? updatedUrls[0] : null
          }));
          break;
      }

      console.log('✅ File deleted successfully');
      setAnnouncement('File deleted successfully');

      // Close modal
      setShowDeleteModal(false);
      setFileToDelete(null);

    } catch (error) {
      console.error('❌ Error deleting file:', error);
      setAnnouncement('Failed to delete file. Please try again.');
    } finally {
      setIsDeleting(false);
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
                  <span className="text-[#0075A2] dark:text-[#0EA5E9]">{getUserDisplayName()}</span> {t('patientDashboard.title')}
                </h1>
                <p className="text-gray-600 dark:text-gray-300 text-lg">{t('patientDashboard.portal')}</p>
                {patientProfile?.email && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{patientProfile.email}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('patientDashboard.lastLogin')}</p>
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
                  {t('patientDashboard.updateProfile')}
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
                {t('patientDashboard.healthOverview')}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">{t('patientDashboard.healthStatus')}</p>
            </div>
            {isLoadingVitals ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-[#E8E8E8] dark:border-gray-600">
                    <div className="animate-pulse">
                      <div className="flex items-center">
                        <div className="p-3 bg-gray-200 dark:bg-gray-700 rounded-xl">
                          <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
                        </div>
                        <div className="ml-4 space-y-2">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {healthMetricsData.map((metric, index) => {
                  const MetricIcon = metric.icon;
                  const colors = [
                    { bg: 'bg-gradient-to-br from-red-500 to-pink-600', text: 'text-red-100' },
                    { bg: 'bg-gradient-to-br from-blue-500 to-cyan-600', text: 'text-blue-100' },
                    { bg: 'bg-gradient-to-br from-green-500 to-emerald-600', text: 'text-green-100' },
                    { bg: 'bg-gradient-to-br from-purple-500 to-indigo-600', text: 'text-purple-100' }
                  ];
                  const color = colors[index % colors.length];
                  return (
                    <div key={metric.name} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-[#E8E8E8] dark:border-gray-600">
                      <div className="flex items-center">
                        <div className={`p-3 ${color.bg} rounded-xl`}>
                          <MetricIcon className="w-6 h-6 text-white" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{metric.name}</p>
                          <p className="text-2xl font-bold text-[#0A2647] dark:text-gray-100">{metric.value}{metric.unit}</p>
                          <p className={`text-xs font-medium ${metric.value === '--' ? 'text-gray-500 dark:text-gray-400' : 'text-green-600 dark:text-green-400'}`}>{metric.status}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-[#E8E8E8] dark:border-gray-600">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('patientDashboard.upcomingAppointments')}</p>
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
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('patientDashboard.profileComplete')}</p>
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
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('patientDashboard.totalVisits')}</p>
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
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('patientDashboard.secureData')}</p>
                  <p className="text-2xl font-bold text-[#0A2647] dark:text-gray-100">{t('patientDashboard.protected')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Appointments */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-[#E8E8E8] dark:border-gray-600">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-[#0075A2] dark:text-[#0EA5E9]" />
                {t('patientDashboard.upcomingAppointments')}
              </h3>
              <Link
                to="/smart-appointment-booking"
                className="bg-gradient-to-r from-[#0075A2] to-[#0A2647] text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 text-sm"
              >
                {t('patientDashboard.bookNewAppointment')}
              </Link>
            </div>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-700">
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">{t('patientDashboard.date')}</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">{t('patientDashboard.time')}</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">{t('patientDashboard.doctor')}</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">{t('patientDashboard.status')}</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">{t('patientDashboard.queueNumber')}</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">{t('patientDashboard.actions')}</th>
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
                          {appointment.doctor || t('patientDashboard.doctor')}
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
                              disabled={appointment.status === 'CANCELLED' || isCancellingAppointment}
                              className={`text-sm font-medium transition-colors flex items-center space-x-1 ${appointment.status === 'CANCELLED' || isCancellingAppointment
                                ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                : 'text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:underline'
                                }`}
                              title={appointment.status === 'CANCELLED' ? 'Appointment already cancelled' : isCancellingAppointment ? 'Cancelling appointment...' : 'Cancel this appointment'}
                            >
                              {isCancellingAppointment && (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                              )}
                              <span>{t('patientDashboard.cancel')}</span>
                            </button>
                            <button
                              onClick={() => handleRescheduleAppointment(appointment)}
                              disabled={appointment.status === 'CANCELLED' || isReschedulingAppointment}
                              className={`text-sm font-medium transition-colors flex items-center space-x-1 ${appointment.status === 'CANCELLED' || isReschedulingAppointment
                                ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                : 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline'
                                }`}
                              title={appointment.status === 'CANCELLED' ? 'Cannot reschedule cancelled appointment' : isReschedulingAppointment ? 'Rescheduling appointment...' : 'Reschedule this appointment'}
                            >
                              {isReschedulingAppointment && (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                              )}
                              <span>{t('patientDashboard.reschedule')}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500 dark:text-gray-400">
                        {t('patientDashboard.noAppointments')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg mb-8 border border-[#E8E8E8] dark:border-gray-600 overflow-hidden">
          <div className="flex border-b-2 border-gray-200 dark:border-gray-700">
            {[
              { id: 'pre-registration', label: t('patientDashboard.tabs.preRegistration'), icon: FileText, disabled: false },
              { id: 'prescriptions', label: t('patientDashboard.tabs.prescriptions'), icon: Pill, disabled: true },
              { id: 'uploaded-files', label: t('patientDashboard.tabs.uploadedFiles'), icon: Upload, disabled: false },
              { id: 'ai-analytics', label: t('patientDashboard.tabs.aiAnalytics'), icon: Brain, disabled: true }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => !tab.disabled && setActiveTab(tab.id as any)}
                  disabled={tab.disabled}
                  className={`flex-1 flex items-center justify-center space-x-2 px-6 py-4 font-semibold transition-all relative ${activeTab === tab.id
                    ? 'bg-gradient-to-r from-[#0075A2] to-[#0A2647] text-white border-b-4 border-[#0075A2] shadow-lg'
                    : tab.disabled
                      ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed bg-gray-100 dark:bg-gray-900'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-[#0075A2] dark:hover:text-[#0EA5E9]'
                    }`}
                  title={tab.disabled ? 'Coming in Phase 2' : ''}
                >
                  <Icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-white' : ''}`} />
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
                  {t('patientDashboard.preRegistration.title')}
                </h3>
                <Link
                  to="/patient-profile-update"
                  className="bg-gradient-to-r from-[#0075A2] to-[#0A2647] text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 text-sm flex items-center"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  {t('patientDashboard.updateProfile')}
                </Link>
              </div>

              {patientProfile && (
                <div className="space-y-6">
                  {/* Personal Information */}
                  <div>
                    <h4 className="text-lg font-semibold text-[#0A2647] dark:text-gray-100 mb-4 flex items-center">
                      <User className="w-5 h-5 mr-2 text-[#0075A2] dark:text-[#0EA5E9]" />
                      {t('patientDashboard.preRegistration.personalInfo')}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('patientDashboard.preRegistration.patientName')}</p>
                        <p className="font-semibold text-[#0A2647] dark:text-gray-100">{patientProfile.full_name || 'N/A'}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('patientDashboard.preRegistration.phoneNumber')}</p>
                        <p className="font-semibold text-[#0A2647] dark:text-gray-100">{patientProfile.phone_number || 'N/A'}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('patientDashboard.preRegistration.ageGender')}</p>
                        <p className="font-semibold text-[#0A2647] dark:text-gray-100">
                          {patientProfile.age ? `${patientProfile.age} years` : 'N/A'} / {patientProfile.gender || 'N/A'}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('patientDashboard.preRegistration.location')}</p>
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
                      {t('patientDashboard.preRegistration.medicalInfo')}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('patientDashboard.preRegistration.medicalHistory')}</p>
                        <p className="font-semibold text-[#0A2647] dark:text-gray-100">{patientProfile.medical_history || 'N/A'}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('patientDashboard.preRegistration.allergies')}</p>
                        <p className="font-semibold text-[#0A2647] dark:text-gray-100">{patientProfile.allergies || 'N/A'}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('patientDashboard.preRegistration.currentMedications')}</p>
                        <p className="font-semibold text-[#0A2647] dark:text-gray-100">{patientProfile.current_medications || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Insurance and Blood Type Information */}
                  <div>
                    <h4 className="text-lg font-semibold text-[#0A2647] dark:text-gray-100 mb-4 flex items-center">
                      <Shield className="w-5 h-5 mr-2 text-[#0075A2] dark:text-[#0EA5E9]" />
                      {t('patientDashboard.preRegistration.insuranceBloodType')}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('patientDashboard.preRegistration.insuranceProvider')}</p>
                        <p className="font-semibold text-[#0A2647] dark:text-gray-100">{patientProfile.insurance_provider || 'N/A'}</p>
                        {patientProfile.insurance_number && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Policy: {patientProfile.insurance_number}</p>
                        )}
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('patientDashboard.preRegistration.bloodType')}</p>
                        <p className="font-semibold text-[#0A2647] dark:text-gray-100">{patientProfile.blood_type || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Lab Reports Section */}
                  <div>
                    <h4 className="text-lg font-semibold text-[#0A2647] dark:text-gray-100 mb-4 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-[#0075A2] dark:text-[#0EA5E9]" />
                      {t('patientDashboard.preRegistration.labReports')}
                    </h4>
                    {isLoadingLabReports ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0075A2] dark:border-[#0EA5E9] mx-auto"></div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading reports...</p>
                      </div>
                    ) : labReports && labReports.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {labReports.map((report) => (
                          <div key={report.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-[#0A2647] dark:text-gray-100">{report.report_name}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {new Date(report.upload_date).toLocaleDateString()}
                                </p>
                              </div>
                              <a
                                href={report.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-[#0075A2] dark:bg-[#0EA5E9] text-white px-3 py-2 rounded-lg hover:bg-[#0A2647] dark:hover:bg-[#0284C7] transition-colors text-sm font-medium"
                              >
                                {t('patientDashboard.preRegistration.viewReport')}
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
                        <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 dark:text-gray-400">{t('patientDashboard.preRegistration.noReports')}</p>
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
                {t('patientDashboard.uploadedFiles.title')}
              </h3>
              {patientProfile && (
                <div className="space-y-8">
                  {/* ID Proof Documents */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-[#0A2647] dark:text-gray-100 flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                        {t('patientDashboard.uploadedFiles.idProof')}
                      </h4>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {freshIdProofUrls.length} {t('patientDashboard.uploadedFiles.files')}
                      </span>
                    </div>
                    {freshIdProofUrls && freshIdProofUrls.length > 0 ? (
                      <div className="space-y-3">
                        {freshIdProofUrls.map((url: string, index: number) => (
                          <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center flex-1">
                                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                                  <FileText className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <p className="font-semibold text-[#0A2647] dark:text-gray-100">ID Proof Document {index + 1}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Aadhaar / ID Card</p>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-[#0075A2] hover:bg-[#0A2647] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  View
                                </a>
                                <button
                                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
                                  onClick={() => {
                                    setFileToDelete({
                                      type: 'idProof',
                                      index: index,
                                      fileName: `${t('patientDashboard.uploadedFiles.idProofDocument')} ${index + 1}`
                                    });
                                    setShowDeleteModal(true);
                                  }}
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-8 text-center">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 dark:text-gray-400 text-sm">No ID proof documents uploaded</p>
                      </div>
                    )}
                  </div>

                  {/* Lab Reports */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-[#0A2647] dark:text-gray-100 flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                        {t('patientDashboard.uploadedFiles.labReports')}
                      </h4>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {isLoadingLabReports ? '...' : labReports.length} {t('patientDashboard.uploadedFiles.fileCount')}
                      </span>
                    </div>
                    {isLoadingLabReports ? (
                      <div className="text-center py-6">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading reports...</p>
                      </div>
                    ) : labReports && labReports.length > 0 ? (
                      <div className="space-y-3">
                        {labReports.map((report) => (
                          <div key={report.id} className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center flex-1">
                                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center mr-3">
                                  <FileText className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <p className="font-semibold text-[#0A2647] dark:text-gray-100">{report.report_name}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {new Date(report.upload_date).toLocaleDateString()} • {report.upload_source?.replace('_', ' ')}
                                  </p>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <a
                                  href={report.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-[#0075A2] hover:bg-[#0A2647] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  View
                                </a>
                                {!report.locked && (
                                <button
                                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
                                  onClick={() => {
                                    setFileToDelete({
                                      type: 'labReport',
                                      index: 0,
                                      fileName: report.report_name,
                                      reportId: report.id,
                                    });
                                    setShowDeleteModal(true);
                                  }}
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Delete
                                </button>
                                )}
                                {report.locked && (
                                  <span className="px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs" title="This report is part of your medical record and can’t be deleted.">Locked</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-8 text-center">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 dark:text-gray-400 text-sm">No lab reports uploaded</p>
                      </div>
                    )}
                  </div>

                  {/* Profile Image */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-[#0A2647] dark:text-gray-100 flex items-center">
                        <User className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                        {t('patientDashboard.uploadedFiles.profileImage')}
                      </h4>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {patientProfile.profile_image_url ? 1 : 0} {t('patientDashboard.uploadedFiles.fileCount')}
                      </span>
                    </div>
                    {patientProfile.profile_image_url ? (
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center flex-1">
                            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-[#0A2647] dark:text-gray-100">Profile Picture</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Profile Image</p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <a
                              href={patientProfile.profile_image_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-[#0075A2] hover:bg-[#0A2647] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </a>
                            <button
                              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
                              onClick={() => {
                                setFileToDelete({
                                  type: 'profileImage',
                                  index: 0,
                                  fileName: 'Profile Picture'
                                });
                                setShowDeleteModal(true);
                              }}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-8 text-center">
                        <User className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 dark:text-gray-400 text-sm">No profile image uploaded</p>
                      </div>
                    )}
                  </div>

                  {/* No files message */}
                  {freshIdProofUrls.length === 0 &&
                    labReports.length === 0 &&
                    !patientProfile.profile_image_url && (
                      <div className="text-center py-12">
                        <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No Files Uploaded</h4>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Upload documents from your profile page</p>
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
                  disabled={isCancellingAppointment}
                  className={`flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2 ${isCancellingAppointment ? 'opacity-75 cursor-not-allowed' : ''
                    }`}
                >
                  {isCancellingAppointment && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  <span>Yes, Cancel</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setFileToDelete(null);
          }}
          onConfirm={handleDeleteFile}
          onConfirmWithReason={fileToDelete?.type === 'labReport' && fileToDelete?.reportId ? async (reason: string) => {
            if (!fileToDelete?.reportId) return;
            setIsDeleting(true);
            const ok = await deletePatientReport(fileToDelete.reportId, reason, 'patient');
            setIsDeleting(false);
            setShowDeleteModal(false);
            setFileToDelete(null);
            if (!ok) {
              setAnnouncement('Failed to delete the report. It may be locked or you may not have permission.');
            }
          } : undefined}
          title="Delete File"
          message={fileToDelete?.type === 'labReport' ? 'Select a reason and confirm to delete this report. This action hides the report from both dashboards.' : 'Are you sure you want to delete this file? This action cannot be undone.'}
          fileName={fileToDelete?.fileName}
          isLoading={isDeleting}
          reasons={fileToDelete?.type === 'labReport' ? [
            'Wrong report',
            'Old report',
            'Incomplete report',
            'Duplicate upload',
            'Not related to this patient',
            'Poor image quality / Unreadable',
            'Other',
          ] : undefined}
        />
      </main>
    </div>
  );
}

export default PatientDashboardPage;