import React from 'react';
import { MapPin, Building, Plus, Trash2, DollarSign, Stethoscope, Video, Phone as PhoneIcon, Tag } from 'lucide-react';
import { DoctorFormData } from '../../types/DoctorFormData';

interface PracticeSettingsSectionProps {
  formData: DoctorFormData;
  updateFormData: (updates: Partial<DoctorFormData>) => void;
  errors: Record<string, string[]>;
  consultationTypes: Array<{ id: string; label: string; icon: any }>;
}

const PracticeSettingsSection: React.FC<PracticeSettingsSectionProps> = ({
  formData,
  updateFormData,
  errors,
  consultationTypes
}) => {
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

  return (
    <div className="space-y-8">
      {/* Practice Locations */}
      <div className="bg-gradient-to-br from-white dark:from-gray-800 to-[#F6F6F6] dark:to-gray-700 rounded-2xl p-8 shadow-lg border border-[#E8E8E8] dark:border-gray-600">
        <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-6 flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-xl flex items-center justify-center mr-3">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          Practice Locations
        </h3>
        
        <div className="space-y-6">
          {formData.practiceLocations.map((location, index) => (
            <div key={index} className="border-2 border-[#E8E8E8] dark:border-gray-600 rounded-2xl p-6 bg-white dark:bg-gray-800 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-lg font-semibold text-[#0A2647] dark:text-gray-100">
                  Practice Location {index + 1}
                </h4>
                {formData.practiceLocations.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePracticeLocation(index)}
                    className="w-8 h-8 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40 rounded-lg flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-[#0A2647] dark:text-gray-100 mb-3">
                    Clinic/Hospital Name *
                  </label>
                  <input
                    type="text"
                    value={location.clinicName}
                    onChange={(e) => updatePracticeLocation(index, 'clinicName', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-[#E8E8E8] dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-lg"
                    placeholder="Enter clinic/hospital name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-[#0A2647] dark:text-gray-100 mb-3">
                    City *
                  </label>
                  <input
                    type="text"
                    value={location.city}
                    onChange={(e) => updatePracticeLocation(index, 'city', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-[#E8E8E8] dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-lg"
                    placeholder="Enter city"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-[#0A2647] dark:text-gray-100 mb-3">
                    Full Address *
                  </label>
                  <textarea
                    value={location.fullAddress}
                    onChange={(e) => updatePracticeLocation(index, 'fullAddress', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-[#E8E8E8] dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-lg resize-none"
                    placeholder="Enter complete address"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-[#0A2647] dark:text-gray-100 mb-3">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    value={location.pincode}
                    onChange={(e) => updatePracticeLocation(index, 'pincode', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-[#E8E8E8] dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-lg"
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
            className="flex items-center justify-center w-full py-4 text-lg font-semibold text-[#0075A2] dark:text-[#0EA5E9] hover:text-[#0A2647] dark:hover:text-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#0075A2] rounded-2xl border-2 border-dashed border-[#E8E8E8] dark:border-gray-600 hover:border-[#0075A2] dark:hover:border-[#0EA5E9] hover:bg-[#F6F6F6] dark:hover:bg-gray-700 group"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-xl flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-200">
              <Plus className="w-4 h-4 text-white" />
            </div>
            Add Another Practice Location
          </button>
        </div>
        {errors.practiceLocations && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">{errors.practiceLocations[0]}</p>
        )}
      </div>

      {/* Consultation Types */}
      <div className="bg-gradient-to-br from-white dark:from-gray-800 to-[#F6F6F6] dark:to-gray-700 rounded-2xl p-8 shadow-lg border border-[#E8E8E8] dark:border-gray-600">
        <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-6 flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-xl flex items-center justify-center mr-3">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          Consultation Types Offered
        </h3>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {consultationTypes.map(type => (
              <label key={type.id} className="flex items-center space-x-4 cursor-pointer hover:bg-[#F6F6F6] dark:hover:bg-gray-700 p-6 rounded-2xl border-2 border-[#E8E8E8] dark:border-gray-600 hover:border-[#0075A2] dark:hover:border-[#0EA5E9] transition-all duration-200 group">
                <input
                  type="checkbox"
                  checked={formData.consultationTypes.includes(type.id)}
                  onChange={(e) => handleConsultationTypeChange(type.id, e.target.checked)}
                  className="w-5 h-5 text-[#0075A2] border-2 border-[#E8E8E8] dark:border-gray-600 rounded-lg focus:ring-[#0075A2] focus:ring-2"
                />
                <type.icon className="w-6 h-6 text-gray-400 group-hover:text-[#0075A2] dark:group-hover:text-[#0EA5E9] transition-colors" />
                <span className="text-lg font-medium text-gray-700 dark:text-gray-300 group-hover:text-[#0A2647] dark:group-hover:text-gray-100 transition-colors">{type.label}</span>
              </label>
            ))}
          </div>
        </div>
        {errors.consultationTypes && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">{errors.consultationTypes[0]}</p>
        )}
      </div>

      {/* Consultation Fees */}
      {formData.consultationTypes.length > 0 && (
        <div className="bg-gradient-to-br from-white dark:from-gray-800 to-[#F6F6F6] dark:to-gray-700 rounded-2xl p-8 shadow-lg border border-[#E8E8E8] dark:border-gray-600">
          <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-6 flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-xl flex items-center justify-center mr-3">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            Consultation Fees (in ₹)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {formData.consultationTypes.includes('In-Clinic') && (
              <div>
                <label className="block text-sm font-semibold text-[#0A2647] dark:text-gray-100 mb-3">
                  In-Clinic Consultation Fee *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">₹</span>
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
                    className="w-full pl-10 pr-4 py-4 border-2 border-[#E8E8E8] dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-lg"
                    placeholder="500"
                  />
                </div>
              </div>
            )}
            
            {formData.consultationTypes.includes('Video') && (
              <div>
                <label className="block text-sm font-semibold text-[#0A2647] dark:text-gray-100 mb-3">
                  Video Consultation Fee *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">₹</span>
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
                    className="w-full pl-10 pr-4 py-4 border-2 border-[#E8E8E8] dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-lg"
                    placeholder="400"
                  />
                </div>
              </div>
            )}
            
            {formData.consultationTypes.includes('Audio') && (
              <div>
                <label className="block text-sm font-semibold text-[#0A2647] dark:text-gray-100 mb-3">
                  Audio Consultation Fee *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">₹</span>
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
                    className="w-full pl-10 pr-4 py-4 border-2 border-[#E8E8E8] dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-lg"
                    placeholder="300"
                  />
                </div>
              </div>
            )}
          </div>
          {errors.consultationFees && (
            <p className="mt-4 text-sm text-red-600 dark:text-red-400">{errors.consultationFees[0]}</p>
          )}
        </div>
      )}

      {/* Services & Treatments Offered - Disabled for now */}
      <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-8 opacity-60">
        <h3 className="text-xl font-semibold text-gray-500 dark:text-gray-400 mb-6 flex items-center">
          <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-xl flex items-center justify-center mr-3">
            <Tag className="w-5 h-5 text-gray-400" />
          </div>
          Services & Treatments Offered
          <span className="ml-3 text-sm bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-3 py-1 rounded-full">
            Coming Soon
          </span>
        </h3>
        
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400 mb-2 text-lg">
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

export default PracticeSettingsSection;
