import React from 'react';
import { Camera, Stethoscope, GraduationCap, Plus, Trash2, Upload, Globe, MessageSquare } from 'lucide-react';
import { DoctorFormData } from '../DoctorRegistrationForm';

interface ClinicalProfileStepProps {
  formData: DoctorFormData;
  updateFormData: (updates: Partial<DoctorFormData>) => void;
  errors: string[];
}

const ClinicalProfileStep: React.FC<ClinicalProfileStepProps> = ({
  formData,
  updateFormData,
  errors
}) => {
  const specializations = [
    'Cardiology', 'Dermatology', 'General Physician', 'Gynaecology', 'Orthopaedics', 
    'Paediatrics', 'Neurology', 'Psychiatry', 'Ophthalmology', 'ENT', 'Radiology', 
    'Anesthesiology', 'Emergency Medicine', 'Family Medicine', 'Internal Medicine', 
    'Surgery', 'Oncology', 'Endocrinology', 'Gastroenterology', 'Pulmonology', 
    'Nephrology', 'Rheumatology', 'Infectious Disease', 'Pathology', 'Physical Medicine', 
    'Plastic Surgery', 'Urology', 'Dermatology', 'Psychiatry', 'Radiology'
  ];

  const languages = [
    'English', 'Hindi', 'Marathi', 'Tamil', 'Bengali', 'Telugu', 'Gujarati', 
    'Kannada', 'Malayalam', 'Punjabi', 'Urdu', 'Odia', 'Assamese', 'Nepali', 
    'Sanskrit', 'French', 'German', 'Spanish', 'Arabic', 'Chinese'
  ];

  const degrees = [
    'MBBS', 'MD', 'MS', 'DM', 'DNB', 'MCh', 'BAMS', 'BHMS', 'BUMS', 'BDS', 
    'MDS', 'BPT', 'MPT', 'BSc Nursing', 'MSc Nursing', 'BPharm', 'MPharm', 
    'BSc Medical Technology', 'MSc Medical Technology'
  ];

  const handleFileUpload = (field: keyof DoctorFormData, file: File | null) => {
    updateFormData({ [field]: file });
  };

  const handleMultipleFileUpload = (field: 'degreeCertificates', files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files);
      updateFormData({ [field]: [...formData.degreeCertificates, ...newFiles] });
    }
  };

  const handleSpecializationChange = (specialization: string, checked: boolean) => {
    const updatedSpecializations = checked
      ? [...formData.specialization, specialization]
      : formData.specialization.filter(s => s !== specialization);
    updateFormData({ specialization: updatedSpecializations });
  };

  const handleLanguageChange = (language: string, checked: boolean) => {
    const updatedLanguages = checked
      ? [...formData.languagesSpoken, language]
      : formData.languagesSpoken.filter(l => l !== language);
    updateFormData({ languagesSpoken: updatedLanguages });
  };

  const addQualification = () => {
    updateFormData({
      qualifications: [...formData.qualifications, { degree: '', medicalCollege: '', yearOfCompletion: new Date().getFullYear() }]
    });
  };

  const removeQualification = (index: number) => {
    const updated = formData.qualifications.filter((_, i) => i !== index);
    updateFormData({ qualifications: updated });
  };

  const updateQualification = (index: number, field: string, value: string | number) => {
    const updated = [...formData.qualifications];
    updated[index] = { ...updated[index], [field]: value };
    updateFormData({ qualifications: updated });
  };

  const removeDegreeCertificate = (index: number) => {
    const updated = formData.degreeCertificates.filter((_, i) => i !== index);
    updateFormData({ degreeCertificates: updated });
  };

  return (
    <div className="space-y-8">
      {/* Profile Picture */}
      <div className="bg-gradient-to-br from-white dark:from-gray-800 to-[#F6F6F6] dark:to-gray-700 rounded-2xl p-8 shadow-lg border border-[#E8E8E8] dark:border-gray-600">
        <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-6 flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-xl flex items-center justify-center mr-3">
            <Camera className="w-5 h-5 text-white" />
          </div>
          Profile Picture
        </h3>
        
        <div className="flex items-center space-x-8">
          <div className="w-32 h-32 bg-gradient-to-br from-[#E8E8E8] dark:from-gray-600 to-[#F6F6F6] dark:to-gray-700 rounded-2xl flex items-center justify-center overflow-hidden shadow-lg">
            {formData.profilePicture ? (
              <img
                src={URL.createObjectURL(formData.profilePicture)}
                alt="Profile"
                className="w-full h-full object-cover rounded-2xl"
              />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-xl flex items-center justify-center">
                <Camera className="w-8 h-8 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <input
              type="file"
              id="profilePicture"
              accept=".jpg,.jpeg"
              onChange={(e) => handleFileUpload('profilePicture', e.target.files?.[0] || null)}
              className="hidden"
            />
            <label htmlFor="profilePicture" className="cursor-pointer">
              <div className="border-2 border-dashed border-[#E8E8E8] dark:border-gray-600 rounded-2xl p-6 text-center hover:border-[#0075A2] dark:hover:border-[#0EA5E9] hover:bg-[#F6F6F6] dark:hover:bg-gray-700 transition-all duration-200 group">
                <div className="w-12 h-12 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-200">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <p className="text-lg font-medium text-[#0A2647] dark:text-gray-100 mb-2">
                  {formData.profilePicture ? 'Change Photo' : 'Upload Professional Headshot'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Professional headshot, clear background, min. 500x500 pixels
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Specialization */}
      <div className="bg-gradient-to-br from-white dark:from-gray-800 to-[#F6F6F6] dark:to-gray-700 rounded-2xl p-8 shadow-lg border border-[#E8E8E8] dark:border-gray-600">
        <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-6 flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-xl flex items-center justify-center mr-3">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          Medical Specialization
        </h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-[#0A2647] dark:text-gray-100 mb-3">
              Specialization *
            </label>
            <div className="border-2 border-[#E8E8E8] dark:border-gray-600 rounded-2xl p-6 max-h-64 overflow-y-auto bg-white dark:bg-gray-800 shadow-inner">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {specializations.map(spec => (
                  <label key={spec} className="flex items-center space-x-3 cursor-pointer hover:bg-[#F6F6F6] dark:hover:bg-gray-700 p-3 rounded-xl transition-all duration-200 group">
                    <input
                      type="checkbox"
                      checked={formData.specialization.includes(spec)}
                      onChange={(e) => handleSpecializationChange(spec, e.target.checked)}
                      className="w-5 h-5 text-[#0075A2] border-2 border-[#E8E8E8] dark:border-gray-600 rounded-lg focus:ring-[#0075A2] focus:ring-2"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-[#0A2647] dark:group-hover:text-gray-100 transition-colors">{spec}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="superSpecialization" className="block text-sm font-semibold text-[#0A2647] dark:text-gray-100 mb-3">
              Super-specialization (Optional)
            </label>
            <input
              type="text"
              id="superSpecialization"
              value={formData.superSpecialization}
              onChange={(e) => updateFormData({ superSpecialization: e.target.value })}
              className="w-full px-4 py-4 border-2 border-[#E8E8E8] dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-lg"
              placeholder="e.g., Interventional Cardiology, Paediatric Orthopaedics"
            />
          </div>
        </div>
      </div>

      {/* Qualifications */}
      <div className="bg-gradient-to-br from-white dark:from-gray-800 to-[#F6F6F6] dark:to-gray-700 rounded-2xl p-8 shadow-lg border border-[#E8E8E8] dark:border-gray-600">
        <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-6 flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-xl flex items-center justify-center mr-3">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          Qualifications / Degrees
        </h3>
        
        <div className="space-y-6">
          {formData.qualifications.map((qual, index) => (
            <div key={index} className="border-2 border-[#E8E8E8] dark:border-gray-600 rounded-2xl p-6 bg-white dark:bg-gray-800 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-lg font-semibold text-[#0A2647] dark:text-gray-100">Qualification {index + 1}</h4>
                {formData.qualifications.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQualification(index)}
                    className="w-8 h-8 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40 rounded-lg flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-[#0A2647] dark:text-gray-100 mb-3">
                    Degree *
                  </label>
                  <select
                    value={qual.degree}
                    onChange={(e) => updateQualification(index, 'degree', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-[#E8E8E8] dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-lg"
                  >
                    <option value="">Select degree</option>
                    {degrees.map(degree => (
                      <option key={degree} value={degree}>{degree}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-[#0A2647] dark:text-gray-100 mb-3">
                    Medical College / University *
                  </label>
                  <input
                    type="text"
                    value={qual.medicalCollege}
                    onChange={(e) => updateQualification(index, 'medicalCollege', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-[#E8E8E8] dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-lg"
                    placeholder="Enter college/university name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-[#0A2647] dark:text-gray-100 mb-3">
                    Year of Completion *
                  </label>
                  <input
                    type="number"
                    value={qual.yearOfCompletion}
                    onChange={(e) => updateQualification(index, 'yearOfCompletion', parseInt(e.target.value) || new Date().getFullYear())}
                    min="1950"
                    max={new Date().getFullYear()}
                    className="w-full px-4 py-3 border-2 border-[#E8E8E8] dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-lg"
                  />
                </div>
              </div>
            </div>
          ))}
          
          <button
            type="button"
            onClick={addQualification}
            className="flex items-center justify-center w-full py-4 text-lg font-semibold text-[#0075A2] dark:text-[#0EA5E9] hover:text-[#0A2647] dark:hover:text-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#0075A2] rounded-2xl border-2 border-dashed border-[#E8E8E8] dark:border-gray-600 hover:border-[#0075A2] dark:hover:border-[#0EA5E9] hover:bg-[#F6F6F6] dark:hover:bg-gray-700 group"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-xl flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-200">
              <Plus className="w-4 h-4 text-white" />
            </div>
            Add Another Qualification
          </button>
        </div>

        {/* Degree Certificates Upload */}
        <div className="mt-8 pt-6 border-t-2 border-[#E8E8E8] dark:border-gray-600">
          <label className="block text-sm font-semibold text-[#0A2647] dark:text-gray-100 mb-4">
            Upload Degree Certificates (Optional but Recommended)
          </label>
          <div className="border-2 border-dashed border-[#E8E8E8] dark:border-gray-600 rounded-2xl p-8 text-center hover:border-[#0075A2] dark:hover:border-[#0EA5E9] hover:bg-[#F6F6F6] dark:hover:bg-gray-700 transition-all duration-200 group">
            <input
              type="file"
              id="degreeCertificates"
              accept=".pdf,.jpg,.jpeg"
              multiple
              onChange={(e) => handleMultipleFileUpload('degreeCertificates', e.target.files)}
              className="hidden"
            />
            <label htmlFor="degreeCertificates" className="cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <p className="text-lg font-medium text-[#0A2647] dark:text-gray-100 mb-2">
                Click to upload degree certificates
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                PDF, JPG, JPEG format only. Adds another layer of trust.
              </p>
            </label>
          </div>
          
          {formData.degreeCertificates.length > 0 && (
            <div className="mt-6 space-y-3">
              {formData.degreeCertificates.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gradient-to-r from-[#F6F6F6] dark:from-gray-700 to-white dark:to-gray-800 rounded-xl p-4 border border-[#E8E8E8] dark:border-gray-600 shadow-sm">
                  <span className="text-sm font-medium text-[#0A2647] dark:text-gray-100">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeDegreeCertificate(index)}
                    className="w-8 h-8 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40 rounded-lg flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Experience and Bio */}
      <div className="bg-gradient-to-br from-white dark:from-gray-800 to-[#F6F6F6] dark:to-gray-700 rounded-2xl p-8 shadow-lg border border-[#E8E8E8] dark:border-gray-600">
        <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-6 flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-xl flex items-center justify-center mr-3">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          Professional Experience & Bio
        </h3>
        
        <div className="space-y-6">
          <div>
            <label htmlFor="totalYearsOfExperience" className="block text-sm font-semibold text-[#0A2647] dark:text-gray-100 mb-3">
              Total Years of Experience *
            </label>
            <input
              type="number"
              id="totalYearsOfExperience"
              value={formData.totalYearsOfExperience}
              onChange={(e) => updateFormData({ totalYearsOfExperience: parseInt(e.target.value) || 0 })}
              min="0"
              max="70"
              className="w-full px-4 py-4 border-2 border-[#E8E8E8] dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-lg"
              placeholder="0"
            />
          </div>

          <div>
            <label htmlFor="professionalBio" className="block text-sm font-semibold text-[#0A2647] dark:text-gray-100 mb-3">
              Professional Bio / About Me *
            </label>
            <textarea
              id="professionalBio"
              value={formData.professionalBio}
              onChange={(e) => updateFormData({ professionalBio: e.target.value })}
              rows={6}
              className="w-full px-4 py-4 border-2 border-[#E8E8E8] dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:border-[#0075A2] transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-lg resize-none"
              placeholder="Write about your approach, philosophy, and expertise. This will be visible to patients."
            />
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Encourage patients to write about their approach, philosophy, and expertise.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#0A2647] dark:text-gray-100 mb-3">
              Languages Spoken * <span className="text-sm text-gray-500 dark:text-gray-400">(Very important for patients)</span>
            </label>
            <div className="border-2 border-[#E8E8E8] dark:border-gray-600 rounded-2xl p-6 max-h-48 overflow-y-auto bg-white dark:bg-gray-800 shadow-inner">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {languages.map(language => (
                  <label key={language} className="flex items-center space-x-3 cursor-pointer hover:bg-[#F6F6F6] dark:hover:bg-gray-700 p-3 rounded-xl transition-all duration-200 group">
                    <input
                      type="checkbox"
                      checked={formData.languagesSpoken.includes(language)}
                      onChange={(e) => handleLanguageChange(language, e.target.checked)}
                      className="w-5 h-5 text-[#0075A2] border-2 border-[#E8E8E8] dark:border-gray-600 rounded-lg focus:ring-[#0075A2] focus:ring-2"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-[#0A2647] dark:group-hover:text-gray-100 transition-colors">{language}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicalProfileStep;

