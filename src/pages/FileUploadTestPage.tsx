import React, { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, X } from 'lucide-react';
import { 
  uploadDoctorDocument, 
  DoctorDocumentType, 
  validateDoctorFile,
  formatFileSize 
} from '../utils/doctorFileUploadUtils';

const FileUploadTestPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DoctorDocumentType>('profile_image');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const documentTypes: { value: DoctorDocumentType; label: string }[] = [
    { value: 'profile_image', label: 'Profile Image' },
    { value: 'medical_certificate', label: 'Medical Certificate' },
    { value: 'aadhaar_front', label: 'Aadhaar Front' },
    { value: 'aadhaar_back', label: 'Aadhaar Back' },
    { value: 'pan_card', label: 'PAN Card' },
    { value: 'cancelled_cheque', label: 'Cancelled Cheque' },
    { value: 'degree_certificate', label: 'Degree Certificate' }
  ];

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    setError('');
    setUploadResult('');

    if (file) {
      const validation = validateDoctorFile(file, documentType);
      if (!validation.isValid) {
        setError(validation.error || 'Invalid file');
        setSelectedFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError('');
    setUploadResult('');

    try {
      const result = await uploadDoctorDocument(selectedFile, 'test-doctor-id', documentType);
      setUploadResult(result.publicUrl || result.signedUrl || 'Upload successful');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDocumentTypeChange = (newType: DoctorDocumentType) => {
    setDocumentType(newType);
    setSelectedFile(null);
    setError('');
    setUploadResult('');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            File Upload Test
          </h1>

          {/* Document Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Document Type
            </label>
            <select
              value={documentType}
              onChange={(e) => handleDocumentTypeChange(e.target.value as DoctorDocumentType)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {documentTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* File Upload Area */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Select File
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
              <input
                type="file"
                onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                accept=".pdf,.jpg,.jpeg"
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {selectedFile ? selectedFile.name : 'Click to select a file'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  PDF, JPG, or JPEG files only
                </p>
              </label>
            </div>

            {/* File Info */}
            {selectedFile && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleFileSelect(null)}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 mr-2" />
                Upload File
              </>
            )}
          </button>

          {/* Error Display */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
                <p className="text-red-800 dark:text-red-200">{error}</p>
              </div>
            </div>
          )}

          {/* Success Display */}
          {uploadResult && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                <div>
                  <p className="text-green-800 dark:text-green-200 font-medium">
                    Upload successful!
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1 break-all">
                    {uploadResult}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              Test Instructions:
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>1. Select a document type from the dropdown</li>
              <li>2. Choose a file (PDF, JPG, or JPEG)</li>
              <li>3. Click "Upload File" to test the upload functionality</li>
              <li>4. Check the console for any errors</li>
              <li>5. Verify the file appears in your Supabase storage buckets</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUploadTestPage;

