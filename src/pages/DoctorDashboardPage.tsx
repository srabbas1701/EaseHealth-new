import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, Clock, Save, ChevronLeft, ChevronRight, X, CheckCircle, AlertCircle, User, FileText,
  ArrowLeft, Shield, Heart, Users, Activity, MessageSquare, BarChart3, Edit3, MoreVertical,
  UserCheck, UserX, Eye, Settings, LogOut, Bell, Search, Filter, RefreshCw
} from 'lucide-react';
import Navigation from '../components/Navigation';
import { supabase, getDoctorIdByUserId, getDoctorAppointments, getAvailableTimeSlots } from '../utils/supabase';

// Create backup of current implementation
// This file will be replaced with the new design

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
  status: 'scheduled' | 'confirmed' | 'in_room' | 'completed' | 'cancelled' | 'no_show';
  queue_token?: string;
  notes?: string;
  patient_name?: string;
  patient_phone?: string;
  arrived?: boolean;
}

// Today's overview stats interface
interface TodayStats {
  appointments: number;
  waitingArrived: number;
  patientsArrived: number;
  consultationNotes: number;
  patientHistoryCompleteness: number;
  analyticsReports: number;
  secureMessages: number;
}

function DoctorDashboardPage({ user, session, profile, userState, isAuthenticated, isLoadingInitialAuth, isProfileLoading, handleLogout }: AuthProps) {
  // Authentication states
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Doctor data state
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [isLoadingDoctor, setIsLoadingDoctor] = useState(false);

  // Dashboard data states
  const [todayStats, setTodayStats] = useState<TodayStats>({
    appointments: 0,
    waitingArrived: 0,
    patientsArrived: 0,
    consultationNotes: 0,
    patientHistoryCompleteness: 0,
    analyticsReports: 0,
    secureMessages: 0
  });
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);

  // Tab management
  const [activeTab, setActiveTab] = useState<'overview' | 'maintain-schedule' | 'patients' | 'reports'>('overview');

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyArrived, setShowOnlyArrived] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Loading states
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  // Load doctor data
  const loadDoctorData = useCallback(async () => {
    if (!isAuthenticated || !user || !profile) return;

    setIsLoadingDoctor(true);
    try {
      const doctorId = await getDoctorIdByUserId(user.id);

      if (doctorId) {
        const { data: doctorData, error: doctorError } = await supabase
          .from('doctors')
          .select('id, full_name, specialty, email, phone_number, profile_image_url')
          .eq('id', doctorId)
          .single();

        if (!doctorError && doctorData) {
          setDoctor({
            ...doctorData,
            last_login: new Date().toISOString()
          });
        } else {
          // Fallback data
          setDoctor({
            id: doctorId,
            full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Doctor',
            specialty: 'Specialty not set',
            email: user?.email || '',
            last_login: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error('Error loading doctor data:', error);
    } finally {
      setIsLoadingDoctor(false);
    }
  }, [isAuthenticated, user, profile]);

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
            phone_number
          )
        `)
        .eq('doctor_id', doctor.id)
        .eq('schedule_date', selectedDate)
        .order('start_time');

      if (!error && appointments) {
        const formattedAppointments: Appointment[] = appointments.map(apt => ({
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
          arrived: apt.status === 'in_room' || apt.status === 'completed'
        }));

        setTodayAppointments(formattedAppointments);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setIsLoadingAppointments(false);
    }
  }, [doctor?.id, selectedDate]);

  // Load today's stats
  const loadTodayStats = useCallback(async () => {
    if (!doctor?.id) return;

    setIsLoadingStats(true);
    try {
      // Get appointment count for today
      const { count: appointmentCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', doctor.id)
        .eq('schedule_date', selectedDate);

      // Get arrived patients count
      const { count: arrivedCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', doctor.id)
        .eq('schedule_date', selectedDate)
        .in('status', ['in_room', 'completed']);

      setTodayStats({
        appointments: appointmentCount || 0,
        waitingArrived: arrivedCount || 0,
        patientsArrived: arrivedCount || 0,
        consultationNotes: Math.floor(Math.random() * 5) + 1, // Placeholder
        patientHistoryCompleteness: Math.floor(Math.random() * 40) + 60, // Placeholder: 60-100%
        analyticsReports: Math.floor(Math.random() * 10) + 1, // Placeholder
        secureMessages: Math.floor(Math.random() * 20) + 1 // Placeholder
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  }, [doctor?.id, selectedDate]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        loadTodayAppointments(),
        loadTodayStats()
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadTodayAppointments, loadTodayStats]);

  // Update appointment status
  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId);

      if (!error) {
        await loadTodayAppointments();
      }
    } catch (error) {
      console.error('Error updating appointment status:', error);
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

  // Load data on component mount and when doctor changes
  useEffect(() => {
    loadDoctorData();
  }, [loadDoctorData]);

  useEffect(() => {
    if (doctor?.id) {
      loadTodayAppointments();
      loadTodayStats();
    }
  }, [doctor?.id, loadTodayAppointments, loadTodayStats]);

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
          doctor={null}
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0075A2] dark:border-[#0EA5E9] mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading doctor information...</p>
          </div>
        </div>
      </div>
    );
  }

  // Filter appointments based on search and filter criteria
  const filteredAppointments = todayAppointments.filter(appointment => {
    const matchesSearch = appointment.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.queue_token?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesArrivedFilter = !showOnlyArrived || appointment.arrived;
    return matchesSearch && matchesArrivedFilter;
  });

  return (
    <div className="min-h-screen bg-[#F6F6F6] dark:bg-gray-900 text-[#0A2647] dark:text-gray-100 transition-colors duration-300">
      {/* Navigation */}
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
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </Link>

        {/* Header Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-[#E8E8E8] dark:border-gray-600 mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* Left Area - Doctor Info */}
            <div className="flex items-center space-x-6">
              {/* Avatar */}
              <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-2xl flex items-center justify-center text-white font-bold text-2xl lg:text-3xl overflow-hidden">
                {doctor?.profile_image_url ? (
                  <img
                    src={doctor.profile_image_url}
                    alt="Profile"
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  getInitials(doctor?.full_name || 'Doctor')
                )}
              </div>

              {/* Doctor Details */}
              <div className="flex-1">
                <h1 className="text-2xl lg:text-3xl font-bold text-[#0A2647] dark:text-gray-100 mb-1">
                  {doctor?.full_name || 'Dr. Unknown'}
                </h1>
                <p className="text-gray-600 dark:text-gray-300 text-lg mb-1">
                  <span className="font-medium">Specialty:</span> {doctor?.specialty || 'Not set'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium">Super Specialization:</span> Interventional {doctor?.specialty || 'Medicine'}
                </p>
              </div>
            </div>

            {/* Right Area - Last Login & Actions */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">Last login</p>
                <p className="text-lg font-semibold text-[#0A2647] dark:text-gray-100">
                  {new Date().toLocaleDateString('en-GB')}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date().toLocaleTimeString('en-GB', { hour12: false })}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {/* Navigate to profile update */ }}
                  className="flex items-center space-x-2 px-4 py-2 bg-[#0075A2] dark:bg-[#0EA5E9] text-white rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-1 transition-all focus:outline-none focus:ring-2 focus:ring-[#0075A2] dark:focus:ring-[#0EA5E9]"
                >
                  <Edit3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Update Profile</span>
                </button>

                {/* Overflow Menu */}
                <div className="relative">
                  <button
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => {/* Toggle menu */ }}
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Overview Widget Row */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-4">Today's Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {/* Appointments Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-[#E8E8E8] dark:border-gray-600 hover:shadow-xl transition-shadow">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-2">
                  <Heart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Appointments</p>
                <p className="text-2xl font-bold text-[#0A2647] dark:text-gray-100">
                  {isLoadingStats ? '...' : todayStats.appointments}
                </p>
                <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                  normal
                </span>
              </div>
            </div>

            {/* Waiting / Arrived Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-[#E8E8E8] dark:border-gray-600 hover:shadow-xl transition-shadow">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-2">
                  <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Waiting / Arrived</p>
                <p className="text-2xl font-bold text-[#0A2647] dark:text-gray-100">
                  {isLoadingStats ? '...' : todayStats.waitingArrived}
                </p>
                <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                  Normal
                </span>
              </div>
            </div>

            {/* Patient Arrived Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-[#E8E8E8] dark:border-gray-600 hover:shadow-xl transition-shadow">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-2">
                  <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Patient Arrived</p>
                <p className="text-2xl font-bold text-[#0A2647] dark:text-gray-100">
                  {isLoadingStats ? '...' : todayStats.patientsArrived}
                </p>
                <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                  Normal
                </span>
              </div>
            </div>

            {/* BMI / Clinic KPI Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-[#E8E8E8] dark:border-gray-600 hover:shadow-xl transition-shadow">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-2">
                  <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">BMI</p>
                <p className="text-2xl font-bold text-[#0A2647] dark:text-gray-100">
                  {isLoadingStats ? '...' : '3250'}
                </p>
                <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                  normal
                </span>
              </div>
            </div>

            {/* Consultation Notes Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-[#E8E8E8] dark:border-gray-600 hover:shadow-xl transition-shadow">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-2">
                  <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Consultation Notes</p>
                <p className="text-2xl font-bold text-[#0A2647] dark:text-gray-100">
                  {isLoadingStats ? '...' : todayStats.consultationNotes}
                </p>
              </div>
            </div>

            {/* Patient History Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-green-200 dark:border-green-800 hover:shadow-xl transition-shadow">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-2">
                  <Eye className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Patient History</p>
                <p className="text-2xl font-bold text-[#0A2647] dark:text-gray-100">
                  {isLoadingStats ? '...' : `${todayStats.patientHistoryCompleteness}%`}
                </p>
              </div>
            </div>

            {/* Analytics & Reports Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-[#E8E8E8] dark:border-gray-600 hover:shadow-xl transition-shadow cursor-pointer">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-2">
                  <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Analytics & Reports</p>
                <p className="text-2xl font-bold text-[#0A2647] dark:text-gray-100">
                  {isLoadingStats ? '...' : todayStats.analyticsReports}
                </p>
              </div>
            </div>

            {/* Secure Messaging Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-[#E8E8E8] dark:border-gray-600 hover:shadow-xl transition-shadow cursor-pointer">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-2">
                  <MessageSquare className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Secure Messaging</p>
                <p className="text-2xl font-bold text-[#0A2647] dark:text-gray-100">
                  {isLoadingStats ? '...' : todayStats.secureMessages}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Schedule Table Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-[#E8E8E8] dark:border-gray-600 mb-8">
          {/* Table Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-600">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-[#0A2647] dark:text-gray-100">Today's Schedule (Summary)</h2>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                {/* Date Selector */}
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0075A2] dark:focus:ring-[#0EA5E9] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />

                {/* Refresh Button */}
                <button
                  onClick={refreshData}
                  disabled={isRefreshing}
                  className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
            </div>
          </div>

          {/* Search and Filter Controls */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-600">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by patient name or queue token..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0075A2] dark:focus:ring-[#0EA5E9] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showOnlyArrived}
                    onChange={(e) => setShowOnlyArrived(e.target.checked)}
                    className="w-4 h-4 text-[#0075A2] dark:text-[#0EA5E9] rounded focus:ring-2 focus:ring-[#0075A2] dark:focus:ring-[#0EA5E9]"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Show only arrived</span>
                </label>
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Arrived
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Queue #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                {isLoadingAppointments ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0075A2] dark:border-[#0EA5E9] mr-3"></div>
                        <span className="text-gray-600 dark:text-gray-300">Loading appointments...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      No appointments found for {new Date(selectedDate).toLocaleDateString()}
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map((appointment) => (
                    <tr key={appointment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-[#0075A2] to-[#0A2647] rounded-full flex items-center justify-center text-white font-medium text-sm mr-3">
                            {appointment.patient_name?.charAt(0) || 'P'}
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${appointment.arrived
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                          }`}>
                          {appointment.arrived ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {appointment.queue_token || 'QT-2025-8DA66478'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${appointment.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                            appointment.status === 'in_room' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
                              appointment.status === 'scheduled' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                                'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                          }`}>
                          {appointment.status === 'in_room' ? 'In Room' :
                            appointment.status === 'scheduled' ? 'Scheduled' :
                              appointment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {!appointment.arrived && appointment.status === 'scheduled' && (
                            <button
                              onClick={() => markPatientArrived(appointment.id)}
                              className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 transition-colors"
                              title="Mark as Arrived"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                          )}
                          {appointment.arrived && appointment.status !== 'completed' && (
                            <button
                              onClick={() => completeAppointment(appointment.id)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 transition-colors"
                              title="Complete Appointment"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 transition-colors"
                            title="More Actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
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
          <div className="flex flex-wrap gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {[
              { id: 'overview', label: 'Overview', icon: Calendar },
              { id: 'maintain-schedule', label: 'Maintain Schedule', icon: Clock },
              { id: 'patients', label: 'Patients', icon: User },
              { id: 'reports', label: 'Reports', icon: FileText }
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
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Daily Summary Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-[#E8E8E8] dark:border-gray-600">
              <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-4">Overview: Daily Summary</h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  Daily clinical summary and notes — empty state hint. This area will be populated with your daily clinical summary,
                  important notes, and key observations from today's consultations. You can expand this section to add more detailed
                  clinical notes and observations.
                </p>
              </div>

              {/* Analytics Placeholders */}
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                  <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">Connect to Analytics</h4>
                  <p className="text-blue-700 dark:text-blue-300 text-sm mb-4">
                    View detailed analytics and performance metrics for your practice.
                  </p>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    View Analytics
                  </button>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
                  <h4 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">Patient Insights</h4>
                  <p className="text-green-700 dark:text-green-300 text-sm mb-4">
                    Get insights into patient trends and health patterns.
                  </p>
                  <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                    View Insights
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'maintain-schedule' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-[#E8E8E8] dark:border-gray-600">
              <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-4">Schedule Management</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                This section will contain the existing schedule management functionality from the current dashboard.
                The schedule management code will be integrated here.
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Schedule management component will be copied from DoctorDashboardPageBackup.tsx
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'patients' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-[#E8E8E8] dark:border-gray-600">
              <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-4">Patient Management</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Manage your patient records, view patient history, and access patient information.
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Patient management features will be implemented here.
                </p>
              </div>
            </div>
          </div>
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