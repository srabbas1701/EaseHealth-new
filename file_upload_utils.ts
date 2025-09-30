// File upload utilities for Patient Pre-Registration documents
// This file contains helper functions for uploading and managing documents in Supabase Storage

import { supabase } from './supabase';

// Document types supported by the system
export type DocumentType = 'lab_reports' | 'aadhaar';

// Upload response interface
export interface UploadResponse {
  path: string;
  fullPath: string;
  publicUrl?: string;
}

// File validation interface
export interface FileValidation {
  isValid: boolean;
  error?: string;
}

/**
 * Validates file before upload
 * @param file - The file to validate
 * @param maxSizeInMB - Maximum file size in MB (default: 10MB)
 * @returns Validation result with error message if invalid
 */
export const validateFile = (file: File, maxSizeInMB: number = 10): FileValidation => {
  // Check file type
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg'];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Only PDF and JPEG files are allowed'
    };
  }

  // Check file size
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  if (file.size > maxSizeInBytes) {
    return {
      isValid: false,
      error: `File size must be less than ${maxSizeInMB}MB`
    };
  }

  return { isValid: true };
};

/**
 * Generates a unique filename for document upload
 * @param userId - User ID
 * @param documentType - Type of document (lab_reports or aadhaar)
 * @param originalFileName - Original filename
 * @returns Unique filename with timestamp
 */
export const generateUniqueFileName = (
  userId: string,
  documentType: DocumentType,
  originalFileName: string
): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileExtension = originalFileName.split('.').pop()?.toLowerCase() || '';
  return `${userId}_${documentType}_${timestamp}.${fileExtension}`;
};

/**
 * Gets the storage bucket name for a document type
 * @param documentType - Type of document
 * @returns Storage bucket name
 */
export const getBucketName = (documentType: DocumentType): string => {
  return documentType === 'lab_reports' ? 'lab-reports' : 'aadhaar-documents';
};

/**
 * Uploads a document to Supabase Storage
 * @param file - File to upload
 * @param userId - User ID
 * @param documentType - Type of document
 * @returns Promise with upload response
 */
export const uploadDocument = async (
  file: File,
  userId: string,
  documentType: DocumentType
): Promise<UploadResponse> => {
  try {
    // Validate file
    const validation = validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Generate unique filename and path
    const fileName = generateUniqueFileName(userId, documentType, file.name);
    const filePath = `${userId}/${fileName}`;
    const bucketName = getBucketName(documentType);

    // Upload file to storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false // Don't overwrite existing files
      });

    if (error) {
      throw error;
    }

    // Get public URL (will be null for private buckets)
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return {
      path: data.path,
      fullPath: data.fullPath,
      publicUrl: urlData.publicUrl
    };
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error(`Failed to upload ${documentType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Downloads a document from Supabase Storage
 * @param filePath - Path to the file in storage
 * @param documentType - Type of document
 * @returns Promise with file blob
 */
export const downloadDocument = async (
  filePath: string,
  documentType: DocumentType
): Promise<Blob> => {
  try {
    const bucketName = getBucketName(documentType);
    
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
 * Deletes a document from Supabase Storage
 * @param filePath - Path to the file in storage
 * @param documentType - Type of document
 * @returns Promise with deletion result
 */
export const deleteDocument = async (
  filePath: string,
  documentType: DocumentType
): Promise<boolean> => {
  try {
    const bucketName = getBucketName(documentType);
    
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
 * Gets a signed URL for private file access
 * @param filePath - Path to the file in storage
 * @param documentType - Type of document
 * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 * @returns Promise with signed URL
 */
export const getSignedUrl = async (
  filePath: string,
  documentType: DocumentType,
  expiresIn: number = 3600
): Promise<string> => {
  try {
    const bucketName = getBucketName(documentType);
    
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
 * Lists all documents for a user
 * @param userId - User ID
 * @param documentType - Type of document
 * @returns Promise with list of files
 */
export const listUserDocuments = async (
  userId: string,
  documentType: DocumentType
): Promise<any[]> => {
  try {
    const bucketName = getBucketName(documentType);
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(userId, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('List documents error:', error);
    throw new Error(`Failed to list ${documentType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Gets file information from storage
 * @param filePath - Path to the file in storage
 * @param documentType - Type of document
 * @returns Promise with file info
 */
export const getFileInfo = async (
  filePath: string,
  documentType: DocumentType
): Promise<any> => {
  try {
    const bucketName = getBucketName(documentType);
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(filePath.split('/').slice(0, -1).join('/'), {
        search: filePath.split('/').pop()
      });

    if (error) {
      throw error;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Get file info error:', error);
    throw new Error(`Failed to get file info for ${documentType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
 * Utility function to get file extension from filename
 * @param filename - File name
 * @returns File extension (without dot)
 */
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

/**
 * Utility function to check if file is an image
 * @param filename - File name
 * @returns True if file is an image
 */
export const isImageFile = (filename: string): boolean => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
  const extension = getFileExtension(filename);
  return imageExtensions.includes(extension);
};

/**
 * Utility function to check if file is a PDF
 * @param filename - File name
 * @returns True if file is a PDF
 */
export const isPdfFile = (filename: string): boolean => {
  return getFileExtension(filename) === 'pdf';
};

