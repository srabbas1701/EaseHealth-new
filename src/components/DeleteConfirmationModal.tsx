import React from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    fileName?: string;
    isLoading?: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    fileName,
    isLoading = false
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full">
                {/* Header */}
                <div className="relative p-6 border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="text-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                            {title}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            {message}
                        </p>
                        {fileName && (
                            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    File: <span className="text-gray-900 dark:text-gray-100">{fileName}</span>
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                        <div className="flex items-start space-x-3">
                            <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="font-semibold text-red-800 dark:text-red-200 text-sm mb-1">
                                    Warning
                                </h4>
                                <p className="text-sm text-red-700 dark:text-red-300">
                                    This action cannot be undone. The file will be permanently deleted from your account.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex space-x-3">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-3 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete File
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;

