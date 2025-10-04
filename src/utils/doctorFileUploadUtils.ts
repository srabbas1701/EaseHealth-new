// File upload utilities for Doctor document uploads
// This file contains helper functions for uploading and managing doctor documents in Supabase Storage

import { supabase } from './supabase';

// Doctor document types supported by the system
export type DoctorDocumentType = 
  | 'profile_image' 
  | 'medical_certificate' 
  | 'aadhaar_front' 
  | 'aadhaar_back' 
  | 'pan_card' 
  | 'cancelled_cheque' 
  | 'degree_certificate';

// Upload response interface
export interface DoctorUploadResponse {
  path: string;
  fullPath: string;
  publicUrl?: string;
  signedUrl?: string;
}

// File validation interface
export interface FileValidation {
  isValid: boolean;
  error?: string;
}

/**
 * Validates file before upload based on document type
 * @param file - The file to validate
 * @param documentType - Type of document
 * @returns Validation result with error message if invalid
 */
export const validateDoctorFile = (file: File, documentType: DoctorDocumentType): FileValidation => {
  // Define allowed types and size limits for each document type
  const validationRules = {
    profile_image: {
      allowedTypes: ['image/jpeg', 'image/jpg'],
      maxSizeMB: 5
    },
    medical_certificate: {
      allowedTypes: ['application/pdf', 'image/jpeg', 'image/jpg'],
      maxSizeMB: 10
    },
    aadhaar_front: {
      allowedTypes: ['image/jpeg', 'image/jpg'],
      maxSizeMB: 10
    },
    aadhaar_back: {
      allowedTypes: ['image/jpeg', 'image/jpg'],
      maxSizeMB: 10
    },
    pan_card: {
      allowedTypes: ['image/jpeg', 'image/jpg'],
      maxSizeMB: 10
    },
    cancelled_cheque: {
      allowedTypes: ['image/jpeg', 'image/jpg'],
      maxSizeMB: 10
    },
    degree_certificate: {
      allowedTypes: ['application/pdf', 'image/jpeg', 'image/jpg'],
      maxSizeMB: 10
    }
  };

  const rules = validationRules[documentType];
  
  // Check file type
  if (!rules.allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Only ${rules.allowedTypes.join(', ')} files are allowed for ${documentType}`
    };
  }

  // Check file size
  const maxSizeInBytes = rules.maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeInBytes) {
    return {
      isValid: false,
      error: `File size must be less than ${rules.maxSizeMB}MB for ${documentType}`
    };
  }

  return { isValid: true };
};

/**
 * Gets the storage bucket name for a document type
 * @param documentType - Type of document
 * @returns Storage bucket name
 */
export const getDoctorBucketName = (documentType: DoctorDocumentType): string => {
  switch (documentType) {
    case 'profile_image':
      return 'doctor-profile-images';
    case 'medical_certificate':
    case 'aadhaar_front':
    case 'aadhaar_back':
    case 'pan_card':
    case 'cancelled_cheque':
      return 'doctor-documents';
    case 'degree_certificate':
      return 'doctor-certificates';
    default:
      return 'doctor-documents';
  }
};

/**
 * Generates a unique filename for doctor document upload
 * @param doctorId - Doctor ID
 * @param documentType - Type of document
 * @param originalFileName - Original filename
 * @returns Unique filename with timestamp
 */
export const generateDoctorFileName = (
  doctorId: string,
  documentType: DoctorDocumentType,
  originalFileName: string
): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileExtension = originalFileName.split('.').pop()?.toLowerCase() || '';
  return `${doctorId}/${documentType}/${timestamp}_${originalFileName}`;
};

/**
 * Uploads a doctor document to Supabase Storage
 * @param file - File to upload
 * @param doctorId - Doctor ID
 * @param documentType - Type of document
 * @returns Promise with upload response
 */
export const uploadDoctorDocument = async (
  file: File,
  doctorId: string,
  documentType: DoctorDocumentType
): Promise<DoctorUploadResponse> => {
  try {
    // Validate file
    const validation = validateDoctorFile(file, documentType);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Generate unique filename and path
    const fileName = generateDoctorFileName(doctorId, documentType, file.name);
    const bucketName = getDoctorBucketName(documentType);

    // Upload file to storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false // Don't overwrite existing files
      });

    if (error) {
      throw error;
    }

    // Get public URL for profile images, signed URL for others
    let publicUrl: string | undefined;
    let signedUrl: string | undefined;

    if (documentType === 'profile_image') {
      // Profile images are public
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);
      publicUrl = urlData.publicUrl;
    } else {
      // Other documents need signed URLs
      const { data: signedData, error: signedError } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(fileName, 3600); // 1 hour expiry
      
      if (signedError) {
        console.warn('Could not create signed URL:', signedError);
      } else {
        signedUrl = signedData.signedUrl;
      }
    }

    return {
      path: data.path,
      fullPath: data.fullPath,
      publicUrl,
      signedUrl
    };
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error(`Failed to upload ${documentType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Downloads a doctor document from Supabase Storage
 * @param filePath - Path to the file in storage
 * @param documentType - Type of document
 * @returns Promise with file blob
 */
export const downloadDoctorDocument = async (
  filePath: string,
  documentType: DoctorDocumentType
): Promise<Blob> => {
  try {
    const bucketName = getDoctorBucketName(documentType);
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(filePath);

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Download error:', error);
    throw new Error(`Failed to download ${documentType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Gets a signed URL for private doctor document access
 * @param filePath - Path to the file in storage
 * @param documentType - Type of document
 * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 * @returns Promise with signed URL
 */
export const getDoctorSignedUrl = async (
  filePath: string,
  documentType: DoctorDocumentType,
  expiresIn: number = 3600
): Promise<string> => {
  try {
    const bucketName = getDoctorBucketName(documentType);
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      throw error;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Signed URL error:', error);
    throw new Error(`Failed to get signed URL for ${documentType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Deletes a doctor document from Supabase Storage
 * @param filePath - Path to the file in storage
 * @param documentType - Type of document
 * @returns Promise with deletion result
 */
export const deleteDoctorDocument = async (
  filePath: string,
  documentType: DoctorDocumentType
): Promise<boolean> => {
  try {
    const bucketName = getDoctorBucketName(documentType);
    
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Delete error:', error);
    throw new Error(`Failed to delete ${documentType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Lists all documents for a doctor
 * @param doctorId - Doctor ID
 * @param documentType - Type of document (optional)
 * @returns Promise with list of documents
 */
export const listDoctorDocuments = async (
  doctorId: string,
  documentType?: DoctorDocumentType
): Promise<any[]> => {
  try {
    const bucketName = documentType ? getDoctorBucketName(documentType) : 'doctor-documents';
    const folderPath = documentType ? `${doctorId}/${documentType}` : doctorId;
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(folderPath);

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('List documents error:', error);
    throw new Error(`Failed to list documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Utility function to format file size for display
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Gets the display name for a document type
 * @param documentType - Type of document
 * @returns Human-readable document type name
 */
export const getDocumentTypeDisplayName = (documentType: DoctorDocumentType): string => {
  const displayNames = {
    profile_image: 'Profile Image',
    medical_certificate: 'Medical Certificate',
    aadhaar_front: 'Aadhaar Card (Front)',
    aadhaar_back: 'Aadhaar Card (Back)',
    pan_card: 'PAN Card',
    cancelled_cheque: 'Cancelled Cheque',
    degree_certificate: 'Degree Certificate'
  };

  return displayNames[documentType] || documentType;
};

