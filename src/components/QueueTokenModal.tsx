import React from 'react';
import { X, CheckCircle, Copy, Calendar, Clock, User, MapPin } from 'lucide-react';

interface QueueTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRedirect?: () => void;
  queueToken: string;
  appointmentDetails: {
    doctorName: string;
    date: string;
    time: string;
    specialty?: string;
  };
}

const QueueTokenModal: React.FC<QueueTokenModalProps> = ({
  isOpen,
  onClose,
  onRedirect,
  queueToken,
  appointmentDetails
}) => {
  const handleCopyToken = () => {
    navigator.clipboard.writeText(queueToken);
    // You could add a toast notification here
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="relative p-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0075A2]"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-[#0A2647] dark:text-gray-100 mb-2">
              Booking Confirmed!
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-xs leading-relaxed">
              Your appointment has been confirmed. Your token number is <span className="font-bold text-[#0A2647] dark:text-blue-400">{queueToken}</span>
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Queue Token */}
          <div className="bg-gradient-to-r from-[#0075A2] to-[#0A2647] rounded-xl p-4 text-white mb-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Your Queue Token</h3>
              <div className="flex items-center justify-center space-x-3">
                <span className="text-3xl font-bold tracking-wider">{queueToken}</span>
                <button
                  onClick={handleCopyToken}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                  aria-label="Copy token"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-white/80 mt-2">
                Show this token at the clinic for quick check-in
              </p>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="space-y-3 mb-4">
            <h4 className="text-base font-semibold text-[#0A2647] dark:text-gray-100 mb-2">
              Appointment Details
            </h4>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Doctor</p>
                  <p className="font-semibold text-[#0A2647] dark:text-gray-100">
                    {appointmentDetails.doctorName}
                  </p>
                  {appointmentDetails.specialty && (
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {appointmentDetails.specialty}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
                  <p className="font-semibold text-[#0A2647] dark:text-gray-100">
                    {appointmentDetails.date}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Time</p>
                  <p className="font-semibold text-[#0A2647] dark:text-gray-100">
                    {appointmentDetails.time}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-3 border border-yellow-200 dark:border-yellow-800">
            <h5 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1 text-sm">
              Important Reminders
            </h5>
            <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-0.5">
              <li>• Arrive 15 minutes before your appointment time</li>
              <li>• Bring a valid ID and your queue token</li>
              <li>• You'll receive SMS reminders before your appointment</li>
              <li>• Contact us if you need to reschedule or cancel</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              onClose();
              if (onRedirect) {
                onRedirect();
              }
            }}
            className="w-full bg-gradient-to-r from-[#0075A2] to-[#0A2647] hover:from-[#005a7a] hover:to-[#081f3a] text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:ring-offset-2"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default QueueTokenModal;
