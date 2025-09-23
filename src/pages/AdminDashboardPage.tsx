import React, { useState } from 'react';
import { ArrowLeft, Search, Plus, Users, Calendar, FileText, BarChart3, Settings, LogOut, Eye, Flag, CheckCircle, Clock, AlertTriangle, Filter, Download, Bell, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { useDarkMode } from '../hooks/useDarkMode';
import AccessibleDropdown from '../components/AccessibleDropdown';

interface Appointment {
  id: string;
  patientName: string;
  time: string;
  doctor: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
}

interface PreRegisteredPatient {
  id: string;
  patientName: string;
  docsStatus: 'complete' | 'incomplete' | 'pending';
  consent: 'signed' | 'pending' | 'n/a';
  registrationTime: string;
}

function AdminDashboardPage() {
  const { isDarkMode } = useDarkMode();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('2024-01-15');

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, active: true },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'billing', label: 'Billing', icon: FileText },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  const newAppointments: Appointment[] = [
    { id: '1', patientName: 'Priya Sharma', time: '10:00 AM', doctor: 'Dr. Kumar', status: 'scheduled' },
    { id: '2', patientName: 'Arjun Verma', time: '11:30 AM', doctor: 'Dr. Singh', status: 'confirmed' },
    { id: '3', patientName: 'Kiran Patel', time: '02:00 PM', doctor: 'Dr. Kumar', status: 'scheduled' },
    { id: '4', patientName: 'Meera Gupta', time: '03:30 PM', doctor: 'Dr. Sharma', status: 'scheduled' },
  ];

  const preRegisteredPatients: PreRegisteredPatient[] = [
    { id: '1', patientName: 'Rohan Kapoor', docsStatus: 'complete', consent: 'signed', registrationTime: '09:15 AM' },
    { id: '2', patientName: 'Divya Singh', docsStatus: 'complete', consent: 'pending', registrationTime: '09:45 AM' },
    { id: '3', patientName: 'Vikram Joshi', docsStatus: 'incomplete', consent: 'n/a', registrationTime: '10:20 AM' },
    { id: '4', patientName: 'Anjali Reddy', docsStatus: 'pending', consent: 'signed', registrationTime: '10:55 AM' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
      case 'signed':
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'incomplete':
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'n/a':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  const worklistItems = [
    { id: '1', task: "Confirm tomorrow's appointments", completed: false, priority: 'high' },
    { id: '2', task: 'Follow up on pending consent forms', completed: true, priority: 'normal' },
    { id: '3', task: 'Review patient feedback', completed: false, priority: 'low' },
    { id: '4', task: 'Update doctor schedules', completed: false, priority: 'high' },
  ];

  return (
    <div className="min-h-screen bg-[#F6F6F6] dark:bg-gray-900 text-[#0A2647] dark:text-gray-100 transition-colors duration-300">
      <Navigation />
      
      <div className="flex h-screen pt-16">
        {/* Sidebar */}
        <div className="w-64 bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700">
          {/* Clinic Info */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-full flex items-center justify-center text-white font-bold">
                AS
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#0A2647] dark:text-gray-100">Anjali Sharma</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Administrator</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4">
            <ul className="space-y-2">
              {sidebarItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors focus:outline-none focus:ring-2 focus:ring-[#0075A2] ${
                      activeTab === item.id
                        ? 'bg-[#E8F4F8] dark:bg-gray-700 text-[#0075A2] dark:text-[#0EA5E9] font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Today's Overview - Moved to Sidebar */}
          <div className="px-4 pb-4">
            <div className="bg-gradient-to-br from-[#E8F4F8] dark:from-gray-700 to-white dark:to-gray-800 rounded-xl p-4 border border-[#0075A2]/20 dark:border-gray-600">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-[#0A2647] dark:text-gray-100">Today's Overview</h3>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="text-center p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-blue-100 dark:border-gray-600">
                  <div className="text-lg font-bold text-[#0075A2] dark:text-[#0EA5E9]">24</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Appointments</div>
                </div>
                <div className="text-center p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-green-100 dark:border-gray-600">
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">18</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Completed</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-yellow-100 dark:border-gray-600">
                  <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">6</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Pending</div>
                </div>
                <div className="text-center p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-purple-100 dark:border-gray-600">
                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400">12</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Pre-Registered</div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                  <span>Progress</span>
                  <span>75%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                  <div className="bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#00D4AA] dark:to-[#06D6A0] h-1.5 rounded-full transition-all duration-500" style={{ width: '75%' }}></div>
                </div>
              </div>
            </div>
          </div>
          {/* Logout */}
          <div className="absolute bottom-4 left-4 right-4">
            <button className="w-full flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#0075A2]">
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {/* Page Header */}
          <div className="bg-gradient-to-br from-white dark:from-gray-800 to-[#F6F6F6] dark:to-gray-900 py-8 lg:py-12 border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-2xl flex items-center justify-center relative overflow-hidden">
                    <BarChart3 className="w-8 h-8 text-white" />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-[#00D4AA] dark:from-[#06D6A0] to-[#0075A2] dark:to-[#0EA5E9] rounded-full flex items-center justify-center">
                      <Users className="w-3 h-3 text-white" />
                    </div>
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-transparent via-transparent to-white/10 pointer-events-none"></div>
                  </div>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0A2647] dark:text-gray-100 leading-tight mb-4">
                  Admin{' '}
                  <span className="bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] bg-clip-text text-transparent">
                    Dashboard
                  </span>
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed max-w-2xl mx-auto">
                  Comprehensive patient management, appointment tracking, and real-time analytics
                </p>
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#0A2647] dark:text-gray-100">Dashboard Overview</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Today's appointments and patient management for {new Date(selectedDate).toLocaleDateString('en-IN', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label htmlFor="date-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Date:
                  </label>
                  <input
                    type="date"
                    id="date-filter"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search Patients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <button className="bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:ring-offset-2">
                  <Plus className="w-4 h-4 mr-2" />
                  New Appointment
                </button>
              </div>
            </div>
          </div>

          {/* Dashboard Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* New Appointment Bookings */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-[#0A2647] dark:text-gray-100">New Appointment Bookings</h2>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-500 hover:text-[#0075A2] dark:hover:text-[#0EA5E9] transition-colors">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-500 hover:text-[#0075A2] dark:hover:text-[#0EA5E9] transition-colors">
                        <Filter className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Patient Name</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Time</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Doctor</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {newAppointments.map((appointment) => (
                          <tr key={appointment.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <td className="py-4 px-4 font-medium text-[#0A2647] dark:text-gray-100">{appointment.patientName}</td>
                            <td className="py-4 px-4 text-gray-600 dark:text-gray-300">{appointment.time}</td>
                            <td className="py-4 px-4 text-gray-600 dark:text-gray-300">{appointment.doctor}</td>
                            <td className="py-4 px-4">
                              <button className="text-[#0075A2] dark:text-[#0EA5E9] hover:text-[#0A2647] dark:hover:text-gray-100 font-medium transition-colors flex items-center">
                                <Eye className="w-4 h-4 mr-1" />
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pre-Registered Patients */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-[#0A2647] dark:text-gray-100">Pre-Registered Patients</h2>
                    <button className="text-sm text-[#0075A2] dark:text-[#0EA5E9] hover:text-[#0A2647] dark:hover:text-gray-100 font-medium transition-colors">
                      View All
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Patient Name</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Docs Status</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Consent</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preRegisteredPatients.map((patient) => (
                          <tr key={patient.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <td className="py-4 px-4 font-medium text-[#0A2647] dark:text-gray-100">{patient.patientName}</td>
                            <td className="py-4 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(patient.docsStatus)}`}>
                                {patient.docsStatus.charAt(0).toUpperCase() + patient.docsStatus.slice(1)}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(patient.consent)}`}>
                                {patient.consent === 'n/a' ? 'N/A' : patient.consent.charAt(0).toUpperCase() + patient.consent.slice(1)}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <button className="text-[#0075A2] dark:text-[#0EA5E9] hover:text-[#0A2647] dark:hover:text-gray-100 font-medium transition-colors flex items-center">
                                <Eye className="w-4 h-4 mr-1" />
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Column - Sidebar Widgets */}
              <div className="space-y-6">
                {/* Queue Management */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-bold text-[#0A2647] dark:text-gray-100 mb-4">Queue Management</h3>
                  <button className="w-full bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center mb-4">
                    <Users className="w-4 h-4 mr-2" />
                    Generate Queue Token
                  </button>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-sm font-medium text-[#0A2647] dark:text-gray-100">Current Queue</span>
                      <span className="text-sm font-bold text-[#0075A2] dark:text-[#0EA5E9]">12 patients</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-sm font-medium text-[#0A2647] dark:text-gray-100">Avg Wait Time</span>
                      <span className="text-sm font-bold text-[#0075A2] dark:text-[#0EA5E9]">25 mins</span>
                    </div>
                  </div>
                </div>

                {/* Triage Flags */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 relative overflow-hidden">
                  {/* Blur overlay */}
                  <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm z-10 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Flag className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Coming Soon</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">Triage Flags</p>
                    </div>
                  </div>
                  
                  {/* Blurred content */}
                  <div className="filter blur-sm">
                    <h3 className="text-lg font-bold text-[#0A2647] dark:text-gray-100 mb-4">Triage Flags</h3>
                    <div className="space-y-4">
                      <div className="w-full bg-[#F6F6F6] dark:bg-gray-700 py-3 px-4 rounded-lg">
                        <span className="text-gray-500">Select Triage Flag</span>
                      </div>
                      <button className="w-full bg-[#F6F6F6] dark:bg-gray-700 text-[#0A2647] dark:text-gray-100 py-2 px-4 rounded-lg font-medium flex items-center justify-center">
                        <Flag className="w-4 h-4 mr-2" />
                        Apply Flag
                      </button>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center text-red-600 dark:text-red-400">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Urgent
                        </span>
                        <span className="font-medium">3</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center text-yellow-600 dark:text-yellow-400">
                          <Clock className="w-3 h-3 mr-1" />
                          High Priority
                        </span>
                        <span className="font-medium">7</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center text-green-600 dark:text-green-400">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Normal
                        </span>
                        <span className="font-medium">15</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Daily Worklist */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-bold text-[#0A2647] dark:text-gray-100 mb-4">Daily Worklist</h3>
                  
                  <div className="space-y-3">
                    {worklistItems.map((item) => (
                      <div key={item.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          className="mt-1 w-4 h-4 text-[#0075A2] border-gray-300 dark:border-gray-600 rounded focus:ring-[#0075A2] focus:ring-2"
                          readOnly
                        />
                        <div className="flex-1">
                          <p className={`text-sm ${item.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-[#0A2647] dark:text-gray-100'}`}>
                            {item.task}
                          </p>
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            item.priority === 'high' 
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : item.priority === 'normal'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}>
                            {item.priority}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardPage;