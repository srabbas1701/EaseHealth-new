import React, { memo, useState, useRef } from 'react';
import { Folder, Upload, FileText, Image, File, Trash2, Eye, X } from 'lucide-react';
import type { PatientReport } from '../../../types/patient';

interface UploadedReportsCardProps {
  reports: PatientReport[];
  isLoading: boolean;
  onUpload: (file: File, reportName: string, reportType: string, doctorId: string) => Promise<PatientReport | null>;
  onDelete: (reportId: string) => Promise<boolean>;
  doctorId: string;
  patientId: string;
}

const UploadedReportsCard: React.FC<UploadedReportsCardProps> = memo(({
  reports,
  isLoading,
  onUpload,
  onDelete,
  doctorId,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [viewingReport, setViewingReport] = useState<PatientReport | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      await onUpload(file, file.name, 'general', doctorId);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (reportId: string) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      await onDelete(reportId);
    }
  };

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return FileText;
    if (fileType.startsWith('image/')) return Image;
    return File;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-[#E8E8E8] dark:border-gray-600 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <Folder className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h3 className="text-lg font-bold text-[#0A2647] dark:text-gray-100">
              Uploaded Reports & Documents
            </h3>
          </div>
        </div>

        <button
          onClick={handleUploadClick}
          disabled={isUploading}
          className="w-full mb-4 px-4 py-3 bg-[#0075A2] dark:bg-[#0EA5E9] text-white rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
        >
          <Upload className="w-5 h-5" />
          <span>{isUploading ? 'Uploading...' : '+ Upload New'}</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          className="hidden"
        />

        {uploadError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">{uploadError}</p>
          </div>
        )}

        <div className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-lg p-4 overflow-y-auto max-h-64">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 dark:bg-gray-600 h-20 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : reports.length > 0 ? (
            <div className="space-y-3">
              {reports.map((report) => {
                const IconComponent = getFileIcon(report.file_type);
                return (
                  <div
                    key={report.id}
                    className="bg-white dark:bg-gray-600 rounded-lg p-3 border border-gray-200 dark:border-gray-500 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                        <IconComponent className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {report.report_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(report.upload_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                          {report.file_size && ` • ${formatFileSize(report.file_size)}`}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setViewingReport(report)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-500 rounded transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                        </button>
                        <button
                          onClick={() => handleDelete(report.id)}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 italic text-center py-8">
              No reports uploaded yet
            </p>
          )}
        </div>
      </div>

      {viewingReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
              <h3 className="text-xl font-bold text-[#0A2647] dark:text-gray-100">
                {viewingReport.report_name}
              </h3>
              <button
                onClick={() => setViewingReport(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              {viewingReport.file_type?.startsWith('image/') ? (
                <img
                  src={viewingReport.file_url}
                  alt={viewingReport.report_name}
                  className="max-w-full h-auto mx-auto"
                />
              ) : (
                <iframe
                  src={viewingReport.file_url}
                  className="w-full h-full min-h-[600px] border-0"
                  title={viewingReport.report_name}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
});

UploadedReportsCard.displayName = 'UploadedReportsCard';

export default UploadedReportsCard;
