import React, { memo, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { PrescriptionFormData } from '../../../types/patient';
import { supabase } from '../../../utils/supabase';

interface PrintPrescriptionProps {
  formData: PrescriptionFormData;
  patientName: string;
  patientId: string;
  doctorId: string;
  onClose: () => void;
}

const PrintPrescription: React.FC<PrintPrescriptionProps> = memo(({
  formData,
  patientName,
  patientId,
  doctorId,
  onClose,
}) => {
  const [doctorData, setDoctorData] = useState<any>(null);
  const [patientData, setPatientData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: doctor } = await supabase
        .from('doctors')
        .select('*')
        .eq('id', doctorId)
        .maybeSingle();

      const { data: patient } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .maybeSingle();

      setDoctorData(doctor);
      setPatientData(patient);
    };

    fetchData();
  }, [doctorId, patientId]);

  const handlePrint = () => {
    window.print();
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

  const age = patientData?.age || calculateAge(patientData?.date_of_birth);
  const validMedications = formData.medications.filter(
    med => med.medicine_name.trim() && med.dosage.trim() && med.frequency.trim() && med.duration.trim()
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-auto print:max-w-full print:max-h-full print:shadow-none print:rounded-none">
        {/* Header - Hide on print */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 print:hidden">
          <h3 className="text-2xl font-bold text-[#0A2647]">Prescription Preview</h3>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
            >
              Print
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Prescription Content */}
        <div className="p-8 print:p-12">
          {/* Clinic Header/Letterhead */}
          <div className="text-center mb-8 pb-6 border-b-2 border-teal-600">
            <h1 className="text-3xl font-bold text-teal-700 mb-2">
              EaseHealth Medical Clinic
            </h1>
            <p className="text-gray-600 text-sm">
              Modern Healthcare Solutions | Quality Care for All
            </p>
            <p className="text-gray-600 text-sm mt-1">
              123 Healthcare Ave, Medical District, City - 560001 | Phone: +91-80-1234-5678
            </p>
          </div>

          {/* Doctor Information */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#0A2647] mb-2">
              Dr. {doctorData?.full_name || 'Doctor Name'}
            </h2>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Specialty:</span> {doctorData?.specialty || 'Specialty'}
              {doctorData?.super_specialization && ` | ${doctorData.super_specialization}`}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Registration No:</span> {doctorData?.medical_registration_number || 'N/A'}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Contact:</span> {doctorData?.phone_number || 'N/A'} | {doctorData?.email || 'N/A'}
            </p>
          </div>

          {/* Patient Information */}
          <div className="mb-6 bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm"><span className="font-semibold">Patient Name:</span> {patientName}</p>
                <p className="text-sm"><span className="font-semibold">Patient ID:</span> {patientId.substring(0, 8).toUpperCase()}</p>
              </div>
              <div>
                <p className="text-sm"><span className="font-semibold">Age/Gender:</span> {age || 'N/A'} years / {patientData?.gender || 'N/A'}</p>
                <p className="text-sm"><span className="font-semibold">Date:</span> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
          </div>

          {/* Chief Complaint */}
          <div className="mb-4">
            <h3 className="text-sm font-bold text-[#0A2647] mb-1">Chief Complaint:</h3>
            <p className="text-sm text-gray-800">{formData.chief_complaint}</p>
          </div>

          {/* Diagnosis */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-[#0A2647] mb-1">Diagnosis:</h3>
            <p className="text-sm text-gray-800">{formData.diagnosis}</p>
          </div>

          {/* Clinical Notes */}
          {formData.clinical_notes && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-[#0A2647] mb-1">Clinical Notes:</h3>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{formData.clinical_notes}</p>
            </div>
          )}

          {/* Prescription Table */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-[#0A2647] mb-3">℞ Prescription:</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">S.No</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Medicine Name</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Dosage</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Frequency</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Duration</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Instructions</th>
                </tr>
              </thead>
              <tbody>
                {validMedications.map((med, index) => (
                  <tr key={med.id}>
                    <td className="border border-gray-300 px-3 py-2 text-sm">{index + 1}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm font-medium">{med.medicine_name}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm">{med.dosage}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm">{med.frequency}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm">{med.duration}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm">{med.instructions || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Additional Instructions */}
          {formData.additional_instructions && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-[#0A2647] mb-1">Additional Instructions:</h3>
              <p className="text-sm text-gray-800">{formData.additional_instructions}</p>
            </div>
          )}

          {/* Follow-up */}
          {formData.follow_up_date && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-[#0A2647] mb-1">Follow-up Date:</h3>
              <p className="text-sm text-gray-800">
                {new Date(formData.follow_up_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          )}

          {/* Signature Section */}
          <div className="mt-12 pt-6 border-t border-gray-300">
            <div className="flex justify-between items-end">
              <div className="text-xs text-gray-600">
                <p>This is a digitally generated prescription.</p>
                <p>Consultation ID: {new Date().getTime().toString(36).toUpperCase()}</p>
              </div>
              <div className="text-center">
                <div className="h-16 mb-2 flex items-end justify-center">
                  <div className="text-gray-400 italic">Digital Signature</div>
                </div>
                <div className="border-t-2 border-gray-800 pt-1">
                  <p className="text-sm font-semibold">Dr. {doctorData?.full_name || 'Doctor Name'}</p>
                  <p className="text-xs text-gray-600">{doctorData?.specialty || 'Specialty'}</p>
                  <p className="text-xs text-gray-600">Reg. No: {doctorData?.medical_registration_number || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
            <p>This prescription is valid for 30 days from the date of issue.</p>
            <p className="mt-1">For any queries, please contact the clinic at the above-mentioned contact details.</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:p-12,
          .print\\:p-12 * {
            visibility: visible;
          }
          .print\\:p-12 {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
});

PrintPrescription.displayName = 'PrintPrescription';

export default PrintPrescription;
