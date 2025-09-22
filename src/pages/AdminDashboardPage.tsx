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
  const [selectedTriageFlag, setSelectedTriageFlag] = useState('');

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

  const triageOptions = [
    { id: 'urgent', label: 'Urgent', value: 'urgent' },
    { id: 'high', label: 'High Priority', value: 'high' },
    { id: 'normal', label: 'Normal', value: 'normal' },
    { id: 'low', label: 'Low Priority', value: 'low' },
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
      <Navigation userState="authenticated" />
      
      <div className="flex h-screen pt-16">
        {/* Sidebar */}
        <div className="w-64 bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700">
          {/* Clinic Info */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-[#0A2647] dark:text-gray-100">Aarogya Clinic</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Receptionist</p>
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
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[#0A2647] dark:text-gray-100">Receptionist Dashboard</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Manage appointments, patients, and daily operations</p>
              </div>
              <div className="flex items-center space-x-4">
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
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-bold text-[#0A2647] dark:text-gray-100 mb-4">Triage Flags</h3>
                  
                  <div className="space-y-4">
                    <AccessibleDropdown
                      options={triageOptions}
                      value={selectedTriageFlag}
                      onChange={(value) => setSelectedTriageFlag(value as string)}
                      placeholder="Select Triage Flag"
                      className="w-full"
                    />
                    
                    <button className="w-full bg-[#F6F6F6] dark:bg-gray-700 text-[#0A2647] dark:text-gray-100 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center">
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

                {/* Quick Stats */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-bold text-[#0A2647] dark:text-gray-100 mb-4">Today's Overview</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-[#0075A2] dark:text-[#0EA5E9]">24</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Appointments</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">18</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Completed</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">6</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Pending</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">12</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Pre-Registered</div>
                    </div>
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