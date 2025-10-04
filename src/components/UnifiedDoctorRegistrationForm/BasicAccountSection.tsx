import React from 'react';
import { User, Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react';
import { DoctorFormData } from '../../types/DoctorFormData';

interface BasicAccountSectionProps {
  formData: DoctorFormData;
  updateFormData: (updates: Partial<DoctorFormData>) => void;
  errors: Record<string, string[]>;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (show: boolean) => void;
  isPrefilled?: boolean;
}

const BasicAccountSection: React.FC<BasicAccountSectionProps> = ({
  formData,
  updateFormData,
  errors,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  isPrefilled = false
}) => {
  return (
    <div className="bg-gradient-to-br from-white dark:from-gray-800 to-[#F6F6F6] dark:to-gray-700 rounded-2xl p-8 shadow-lg border border-[#E8E8E8] dark:border-gray-600">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-2 flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-xl flex items-center justify-center mr-3">
            <User className="w-5 h-5 text-white" />
          </div>
          Basic Account Information
        </h3>
        {isPrefilled && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-4">
            <p className="text-sm text-green-700 dark:text-green-300 flex items-center">
              <User className="w-4 h-4 mr-2" />
              Your basic information has been pre-filled from your account. Please verify and complete any missing details.
            </p>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Name */}
        <div className="md:col-span-2">
          <label htmlFor="fullName" className="block text-sm font-semibold text-[#0A2647] dark:text-gray-100 mb-3">
            Full Name * <span className="text-xs text-gray-500">(as per official records)</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              id="fullName"
              value={formData.fullName}
              onChange={(e) => updateFormData({ fullName: e.target.value })}
              className={`w-full pl-10 pr-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-lg ${
                errors.fullName ? 'border-red-500' : 'border-[#E8E8E8] dark:border-gray-600'
              }`}
              placeholder="Enter your full name as per official records"
            />
          </div>
          {errors.fullName && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.fullName[0]}</p>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            This should match your name on medical registration documents.
          </p>
        </div>

        {/* Email Address */}
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-[#0A2647] dark:text-gray-100 mb-3">
            Email Address *
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => updateFormData({ email: e.target.value })}
              className={`w-full pl-10 pr-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-lg ${
                errors.email ? 'border-red-500' : 'border-[#E8E8E8] dark:border-gray-600'
              }`}
              placeholder="your.email@example.com"
            />
          </div>
          {errors.email && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.email[0]}</p>
          )}
        </div>

        {/* Mobile Number */}
        <div>
          <label htmlFor="mobileNumber" className="block text-sm font-semibold text-[#0A2647] dark:text-gray-100 mb-3">
            Mobile Number * <span className="text-xs text-gray-500">(+91)</span>
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-xl border-2 border-r-0 border-[#E8E8E8] dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 text-lg">
                +91
              </span>
              <input
                type="tel"
                id="mobileNumber"
                value={formData.mobileNumber}
                onChange={(e) => updateFormData({ mobileNumber: e.target.value })}
                className={`flex-1 pl-3 pr-4 py-4 border-2 rounded-r-xl focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-lg ${
                  errors.mobileNumber ? 'border-red-500' : 'border-[#E8E8E8] dark:border-gray-600'
                }`}
                placeholder="9876543210"
                maxLength={10}
              />
            </div>
          </div>
          {errors.mobileNumber && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.mobileNumber[0]}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-[#0A2647] dark:text-gray-100 mb-3">
            Create Password *
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={formData.password}
              onChange={(e) => updateFormData({ password: e.target.value })}
              className={`w-full pl-10 pr-12 py-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-lg ${
                errors.password ? 'border-red-500' : 'border-[#E8E8E8] dark:border-gray-600'
              }`}
              placeholder="Create a strong password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.password[0]}</p>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Minimum 8 characters with uppercase, lowercase, and number.
          </p>
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-semibold text-[#0A2647] dark:text-gray-100 mb-3">
            Confirm Password *
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={(e) => updateFormData({ confirmPassword: e.target.value })}
              className={`w-full pl-10 pr-12 py-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-lg ${
                errors.confirmPassword ? 'border-red-500' : 'border-[#E8E8E8] dark:border-gray-600'
              }`}
              placeholder="Confirm your password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword[0]}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BasicAccountSection;
