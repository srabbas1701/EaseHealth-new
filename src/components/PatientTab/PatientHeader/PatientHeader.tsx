import React, { memo } from 'react';
import { User } from 'lucide-react';
import type { Patient, PatientVitals } from '../../../types/patient';
import AllergyIndicator from './AllergyIndicator';
import PatientVitalsBar from './PatientVitalsBar';

interface PatientHeaderProps {
  patient: Patient;
  vitals: PatientVitals | null;
  isLoadingVitals: boolean;
}

const PatientHeader: React.FC<PatientHeaderProps> = memo(({ patient, vitals, isLoadingVitals }) => {
  const getInitials = (name: string) => {
    const words = name.trim().split(/\s+/);
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return words.slice(0, 2).map(word => word.charAt(0).toUpperCase()).join('');
  };

  const calculateAge = (dateOfBirth?: string): number | null => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = patient.age || calculateAge(patient.date_of_birth);
  const hasAllergies = patient.allergies && patient.allergies.trim() !== '' && patient.allergies.toLowerCase() !== 'none';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-[#E8E8E8] dark:border-gray-600">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-6">
          {/* Patient Avatar */}
          <div className="w-32 h-32 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-2xl flex items-center justify-center text-white font-bold text-4xl overflow-hidden">
            {patient.profile_image_url ? (
              <img
                src={patient.profile_image_url}
                alt={patient.full_name}
                className="w-full h-full object-cover rounded-2xl"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.textContent = getInitials(patient.full_name);
                  }
                }}
              />
            ) : (
              <span>{getInitials(patient.full_name)}</span>
            )}
          </div>

          {/* Patient Info */}
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h2 className="text-3xl font-bold text-[#0A2647] dark:text-gray-100">
                {patient.full_name}
              </h2>
              <AllergyIndicator
                hasAllergies={hasAllergies}
                allergies={patient.allergies}
              />
            </div>

            {/* Patient Metadata Row */}
            <div className="flex items-center space-x-6 text-gray-600 dark:text-gray-300">
              <div>
                <span className="text-sm font-medium">Patient ID: </span>
                <span className="text-sm">{patient.id.substring(0, 8).toUpperCase()}</span>
              </div>
              {age && (
                <>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <div>
                    <span className="text-sm font-medium">Age: </span>
                    <span className="text-sm">{age} years</span>
                  </div>
                </>
              )}
              {patient.gender && (
                <>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <div>
                    <span className="text-sm font-medium">Gender: </span>
                    <span className="text-sm">{patient.gender}</span>
                  </div>
                </>
              )}
              {patient.blood_type && (
                <>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <div>
                    <span className="text-sm font-medium">Blood Type: </span>
                    <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                      {patient.blood_type}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Contact Info */}
            <div className="flex items-center space-x-6 mt-3 text-sm text-gray-500 dark:text-gray-400">
              <div>
                <span className="font-medium">Phone: </span>
                <span>{patient.phone_number}</span>
              </div>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <div>
                <span className="font-medium">Email: </span>
                <span>{patient.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div>
          <span className={`inline-flex px-4 py-2 rounded-full text-sm font-semibold ${
            patient.is_active
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
          }`}>
            {patient.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Vitals Bar */}
      <PatientVitalsBar vitals={vitals} isLoading={isLoadingVitals} />
    </div>
  );
});

PatientHeader.displayName = 'PatientHeader';

export default PatientHeader;
