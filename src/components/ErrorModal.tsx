import React from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';

interface ErrorModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    errors: string[];
    type?: 'error' | 'warning' | 'info';
}

const ErrorModal: React.FC<ErrorModalProps> = ({
    isOpen,
    onClose,
    title,
    errors,
    type = 'error'
}) => {
    if (!isOpen) return null;

    const getIconAndColor = () => {
        switch (type) {
            case 'error':
                return {
                    icon: AlertCircle,
                    iconBg: 'bg-red-500',
                    iconColor: 'text-red-600 dark:text-red-400',
                    titleColor: 'text-red-900 dark:text-red-100',
                    bgColor: 'bg-red-50 dark:bg-red-900/20',
                    borderColor: 'border-red-200 dark:border-red-800'
                };
            case 'warning':
                return {
                    icon: AlertCircle,
                    iconBg: 'bg-yellow-500',
                    iconColor: 'text-yellow-600 dark:text-yellow-400',
                    titleColor: 'text-yellow-900 dark:text-yellow-100',
                    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
                    borderColor: 'border-yellow-200 dark:border-yellow-800'
                };
            case 'info':
                return {
                    icon: CheckCircle,
                    iconBg: 'bg-blue-500',
                    iconColor: 'text-blue-600 dark:text-blue-400',
                    titleColor: 'text-blue-900 dark:text-blue-100',
                    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
                    borderColor: 'border-blue-200 dark:border-blue-800'
                };
            default:
                return {
                    icon: AlertCircle,
                    iconBg: 'bg-red-500',
                    iconColor: 'text-red-600 dark:text-red-400',
                    titleColor: 'text-red-900 dark:text-red-100',
                    bgColor: 'bg-red-50 dark:bg-red-900/20',
                    borderColor: 'border-red-200 dark:border-red-800'
                };
        }
    };

    const { icon: Icon, iconBg, iconColor, titleColor, bgColor, borderColor } = getIconAndColor();

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[95vh] overflow-y-auto">
                {/* Header */}
                <div className="relative p-4 border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="text-center">
                        <div className={`w-12 h-12 ${iconBg} rounded-full flex items-center justify-center mx-auto mb-3`}>
                            <Icon className="w-6 h-6 text-white" />
                        </div>
                        <h2 className={`text-xl font-bold ${titleColor} mb-2`}>
                            {title}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            Please fix the following issues to continue
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4">
                    {/* Error List */}
                    <div className={`${bgColor} ${borderColor} rounded-xl p-4 border`}>
                        <h4 className={`font-semibold ${titleColor} mb-3 text-sm`}>
                            Issues to Fix:
                        </h4>
                        <ul className="space-y-2">
                            {errors.map((error, index) => (
                                <li key={index} className="flex items-start space-x-2">
                                    <span className={`text-sm ${iconColor} mt-0.5`}>•</span>
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{error}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Help Text */}
                    <div className="mt-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                            <strong>Tip:</strong> Make sure all required fields are filled correctly and follow the format requirements shown in the form.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                        I Understand
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ErrorModal;

