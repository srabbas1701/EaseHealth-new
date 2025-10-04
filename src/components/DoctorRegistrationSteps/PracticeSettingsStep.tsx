import React from 'react';
import { MapPin, Building, Plus, Trash2, DollarSign, Stethoscope, Video, Phone, Tag } from 'lucide-react';
import { DoctorFormData } from '../DoctorRegistrationForm';

interface PracticeSettingsStepProps {
  formData: DoctorFormData;
  updateFormData: (updates: Partial<DoctorFormData>) => void;
  errors: string[];
}

const PracticeSettingsStep: React.FC<PracticeSettingsStepProps> = ({
  formData,
  updateFormData,
  errors
}) => {
  const consultationTypes = [
    { id: 'In-Clinic', label: 'In-Clinic Consultation', icon: Building },
    { id: 'Video', label: 'Video Teleconsultation', icon: Video },
    { id: 'Audio', label: 'Audio Teleconsultation', icon: Phone }
  ];

  const commonServices = [
    'Fever Treatment', 'Cold & Cough', 'Headache', 'Stomach Pain', 'Skin Problems',
    'Blood Pressure Check', 'Diabetes Management', 'Heart Checkup', 'Eye Examination',
    'Dental Checkup', 'Child Health', 'Women Health', 'Mental Health', 'Physical Therapy',
    'Vaccination', 'Health Checkup', 'Emergency Consultation', 'Follow-up Consultation',
    'Prescription Refill', 'Lab Test Interpretation', 'X-ray Review', 'ECG Analysis',
    'Blood Test Review', 'Medication Adjustment', 'Lifestyle Counseling'
  ];

  const addPracticeLocation = () => {
    updateFormData({
      practiceLocations: [...formData.practiceLocations, { clinicName: '', fullAddress: '', city: '', pincode: '' }]
    });
  };

  const removePracticeLocation = (index: number) => {
    const updated = formData.practiceLocations.filter((_, i) => i !== index);
    updateFormData({ practiceLocations: updated });
  };

  const updatePracticeLocation = (index: number, field: string, value: string) => {
    const updated = [...formData.practiceLocations];
    updated[index] = { ...updated[index], [field]: value };
    updateFormData({ practiceLocations: updated });
  };

  const handleConsultationTypeChange = (type: string, checked: boolean) => {
    const updatedTypes = checked
      ? [...formData.consultationTypes, type]
      : formData.consultationTypes.filter(t => t !== type);
    updateFormData({ consultationTypes: updatedTypes });
  };

  const handleServiceChange = (service: string, checked: boolean) => {
    const updatedServices = checked
      ? [...formData.servicesOffered, service]
      : formData.servicesOffered.filter(s => s !== service);
    updateFormData({ servicesOffered: updatedServices });
  };

  const addCustomService = (service: string) => {
    if (service.trim() && !formData.servicesOffered.includes(service.trim())) {
      updateFormData({ servicesOffered: [...formData.servicesOffered, service.trim()] });
    }
  };

  return (
    <div className="space-y-6">
      {/* Practice Locations */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <MapPin className="w-5 h-5 mr-2 text-[#0075A2]" />
          Associated Hospital(s) / Clinic(s)
        </h3>
        
        <div className="space-y-4">
          {formData.practiceLocations.map((location, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Practice Location {index + 1}
                </h4>
                {formData.practiceLocations.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePracticeLocation(index)}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 focus:outline-none"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Clinic/Hospital Name *
                  </label>
                  <input
                    type="text"
                    value={location.clinicName}
                    onChange={(e) => updatePracticeLocation(index, 'clinicName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Enter clinic/hospital name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={location.city}
                    onChange={(e) => updatePracticeLocation(index, 'city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Enter city"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Address *
                  </label>
                  <textarea
                    value={location.fullAddress}
                    onChange={(e) => updatePracticeLocation(index, 'fullAddress', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Enter complete address"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    value={location.pincode}
                    onChange={(e) => updatePracticeLocation(index, 'pincode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Enter pincode"
                    maxLength={6}
                  />
                </div>
              </div>
            </div>
          ))}
          
          <button
            type="button"
            onClick={addPracticeLocation}
            className="flex items-center text-sm text-[#0075A2] dark:text-[#0EA5E9] hover:text-[#0A2647] dark:hover:text-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0075A2] rounded p-2"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Another Practice Location
          </button>
        </div>
      </div>

      {/* Consultation Types */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <Stethoscope className="w-5 h-5 mr-2 text-[#0075A2]" />
          Consultation Types Offered
        </h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {consultationTypes.map(type => (
              <label key={type.id} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                <input
                  type="checkbox"
                  checked={formData.consultationTypes.includes(type.id)}
                  onChange={(e) => handleConsultationTypeChange(type.id, e.target.checked)}
                  className="w-4 h-4 text-[#0075A2] border-gray-300 dark:border-gray-600 rounded focus:ring-[#0075A2] focus:ring-2"
                />
                <type.icon className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{type.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Consultation Fees */}
      {formData.consultationTypes.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-[#0075A2]" />
            Consultation Fees (in ₹)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {formData.consultationTypes.includes('In-Clinic') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  In-Clinic Consultation Fee *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    value={formData.consultationFees.inClinic}
                    onChange={(e) => updateFormData({ 
                      consultationFees: { 
                        ...formData.consultationFees, 
                        inClinic: parseInt(e.target.value) || 0 
                      } 
                    })}
                    min="0"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="500"
                  />
                </div>
              </div>
            )}
            
            {formData.consultationTypes.includes('Video') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Video Consultation Fee *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    value={formData.consultationFees.video}
                    onChange={(e) => updateFormData({ 
                      consultationFees: { 
                        ...formData.consultationFees, 
                        video: parseInt(e.target.value) || 0 
                      } 
                    })}
                    min="0"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="400"
                  />
                </div>
              </div>
            )}
            
            {formData.consultationTypes.includes('Audio') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Audio Consultation Fee *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    value={formData.consultationFees.audio}
                    onChange={(e) => updateFormData({ 
                      consultationFees: { 
                        ...formData.consultationFees, 
                        audio: parseInt(e.target.value) || 0 
                      } 
                    })}
                    min="0"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="300"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Services & Treatments Offered - Disabled for now */}
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 opacity-60">
        <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-4 flex items-center">
          <Tag className="w-5 h-5 mr-2 text-gray-400" />
          Services & Treatments Offered
          <span className="ml-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
            Coming Soon
          </span>
        </h3>
        
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            This feature will be available in a future update
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            You can add your services and treatments after completing registration
          </p>
        </div>
      </div>
    </div>
  );
};

export default PracticeSettingsStep;

