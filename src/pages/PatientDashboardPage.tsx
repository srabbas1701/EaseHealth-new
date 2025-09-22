import React from 'react';
import Navigation from '../components/Navigation';
import { useDarkMode } from '../hooks/useDarkMode';
import { ArrowLeft, Calendar, FileText, User, Clock, CheckCircle, Bell, Shield, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

function PatientDashboardPage() {
  const { isDarkMode } = useDarkMode();

  // Placeholder data for demonstration
  const upcomingAppointments = [
    { id: '1', doctor: 'Dr. Anjali Sharma', specialty: 'Cardiologist', date: 'July 20, 2024', time: '10:00 AM', status: 'Confirmed' },
    { id: '2', doctor: 'Dr. Rajesh Kumar', specialty: 'Neurologist', date: 'August 05, 2024', time: '02:30 PM', status: 'Scheduled' },
  ];

  const preRegistrationDetails = {
    fullName: 'Priya S.',
    age: '34',
    gender: 'Female',
    phoneNumber: '+91 9876543210',
    city: 'Mumbai',
    state: 'Maharashtra',
    symptoms: 'Occasional chest pain and shortness of breath.',
    labReports: 'Uploaded (report_priya_s.pdf)',
    aadhaar: 'Uploaded (aadhaar_priya_s.jpg)',
    consent: true,
    status: 'Complete'
  };

  return (
    <div className="min-h-screen bg-[#F6F6F6] dark:bg-gray-900 text-[#0A2647] dark:text-gray-100 transition-colors duration-300">
      <Navigation userState="authenticated" />
      
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
              <User className="w-8 h-8 text-white" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-[#00D4AA] dark:from-[#06D6A0] to-[#0075A2] dark:to-[#0EA5E9] rounded-full flex items-center justify-center">
                <Activity className="w-3 h-3 text-white" />
              </div>
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-transparent via-transparent to-white/10 pointer-events-none"></div>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0A2647] dark:text-gray-100 leading-tight mb-4">
            Welcome,{' '}
            <span className="bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] bg-clip-text text-transparent">
              Priya S.
            </span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed max-w-2xl mx-auto">
            Your personalized health overview and quick access to your services.
          </p>
        </div>

        {/* Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Appointments & Pre-Registration (2/3 width) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Upcoming Appointments */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-[#0A2647] dark:text-gray-100 mb-6 flex items-center">
                <Calendar className="w-6 h-6 mr-3 text-[#0075A2] dark:text-[#0EA5E9]" />
                Upcoming Appointments
              </h2>
              {upcomingAppointments.length > 0 ? (
                <div className="space-y-4">
                  {upcomingAppointments.map(appointment => (
                    <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm">
                      <div>
                        <p className="font-medium text-[#0A2647] dark:text-gray-100">{appointment.doctor} ({appointment.specialty})</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center mt-1">
                          <Clock className="w-4 h-4 mr-2" />
                          {appointment.date} at {appointment.time}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        appointment.status === 'Confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {appointment.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-300">No upcoming appointments.</p>
              )}
              <div className="mt-6 text-center">
                <Link 
                  to="/smart-appointment-booking" 
                  className="inline-flex items-center text-[#0075A2] dark:text-[#0EA5E9] hover:text-[#0A2647] dark:hover:text-gray-100 font-medium transition-colors focus-ring"
                >
                  Book a New Appointment
                  <ArrowLeft className="w-4 h-4 ml-1 rotate-180" />
                </Link>
              </div>
            </div>

            {/* My Pre-Registration Details */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-[#0A2647] dark:text-gray-100 mb-6 flex items-center">
                <FileText className="w-6 h-6 mr-3 text-[#0075A2] dark:text-[#0EA5E9]" />
                My Pre-Registration Details
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</p>
                    <p className="text-[#0A2647] dark:text-gray-100">{preRegistrationDetails.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Age / Gender</p>
                    <p className="text-[#0A2647] dark:text-gray-100">{preRegistrationDetails.age} / {preRegistrationDetails.gender}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone Number</p>
                    <p className="text-[#0A2647] dark:text-gray-100">{preRegistrationDetails.phoneNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</p>
                    <p className="text-[#0A2647] dark:text-gray-100">{preRegistrationDetails.city}, {preRegistrationDetails.state}</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Symptoms</p>
                  <p className="text-[#0A2647] dark:text-gray-100">{preRegistrationDetails.symptoms}</p>
                </div>
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Documents</p>
                  <ul className="list-disc list-inside text-[#0A2647] dark:text-gray-100">
                    <li>{preRegistrationDetails.labReports}</li>
                    <li>{preRegistrationDetails.aadhaar}</li>
                  </ul>
                </div>
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mr-2">Consent Status:</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    preRegistrationDetails.consent ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {preRegistrationDetails.consent ? 'Agreed' : 'Pending'}
                  </span>
                </div>
              </div>
              <div className="mt-6 text-center">
                <Link 
                  to="/patient-pre-registration" 
                  className="inline-flex items-center text-[#0075A2] dark:text-[#0EA5E9] hover:text-[#0A2647] dark:hover:text-gray-100 font-medium transition-colors focus-ring"
                >
                  Update Pre-Registration
                  <ArrowLeft className="w-4 h-4 ml-1 rotate-180" />
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column - Quick Actions & Health Tips (1/3 width) */}
          <div className="lg:col-span-1 space-y-8">
            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 sticky top-24">
              <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-6 text-center">
                Quick Actions
              </h3>
              <div className="space-y-4">
                <Link 
                  to="/smart-appointment-booking" 
                  className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] text-white rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 focus-ring"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Book New Appointment
                </Link>
                <Link 
                  to="/patient-pre-registration" 
                  className="w-full flex items-center justify-center px-4 py-3 border border-[#0075A2] dark:border-[#0EA5E9] text-[#0075A2] dark:text-[#0EA5E9] rounded-lg font-medium hover:bg-[#E8F4F8] dark:hover:bg-gray-700 transition-colors focus-ring"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  Update Pre-Registration
                </Link>
                <button className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus-ring">
                  <Bell className="w-5 h-5 mr-2" />
                  Manage Reminders
                </button>
              </div>
            </div>

            {/* Health Tips (Placeholder) */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-6 text-center">
                Health Tips for You
              </h3>
              <div className="space-y-4 text-gray-600 dark:text-gray-300">
                <p className="flex items-start">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-500 flex-shrink-0" />
                  Stay hydrated by drinking at least 8 glasses of water daily.
                </p>
                <p className="flex items-start">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-500 flex-shrink-0" />
                  Aim for 30 minutes of moderate exercise most days of the week.
                </p>
                <p className="flex items-start">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-500 flex-shrink-0" />
                  Ensure you get 7-9 hours of quality sleep each night.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default PatientDashboardPage;