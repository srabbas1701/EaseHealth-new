import { supabase } from './supabase';

export type PatientDocumentType = 'lab_reports' | 'aadhaar_documents' | 'profile_image';

interface FileValidationResult {
    isValid: boolean;
    error?: string;
}

interface PatientUploadResponse {
    path: string;
    fullPath: string;
    publicUrl?: string;
    signedUrl?: string;
}

/**
 * Validates a file for upload
 */
export const validatePatientFile = (file: File, documentType: PatientDocumentType): FileValidationResult => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    let allowedTypes: string[];

    // Set allowed types based on document type
    switch (documentType) {
        case 'profile_image':
            allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
            break;
        case 'lab_reports':
        case 'aadhaar_documents':
            allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
            break;
        default:
            return { isValid: false, error: 'Invalid document type' };
    }

    if (file.size > maxSize) {
        return { isValid: false, error: `File size must be less than ${maxSize / (1024 * 1024)}MB` };
    }

    if (!allowedTypes.includes(file.type)) {
        return { isValid: false, error: `File type must be ${allowedTypes.join(' or ')}` };
    }

    return { isValid: true };
};

/**
 * Gets the storage bucket name for a document type
 */
export const getPatientBucketName = (documentType: PatientDocumentType): string => {
    switch (documentType) {
        case 'lab_reports':
            return 'lab-reports';
        case 'aadhaar_documents':
            return 'aadhaar-documents';
        case 'profile_image':
            return 'profile_image';
        default:
            throw new Error(`Invalid document type: ${documentType}`);
    }
};

/**
 * Generates a unique filename for a patient document
 */
export const generatePatientFileName = (
    patientId: string,
    documentType: PatientDocumentType,
    originalFileName: string
): string => {
    const timestamp = Date.now();
    const extension = originalFileName.split('.').pop();
    // For storage policies, we need the auth.uid() as the first part of the path
    return `${patientId}/documents/${documentType}/${timestamp}_${originalFileName}`;
};

/**
 * Uploads a patient document to Supabase Storage
 */
export const uploadPatientDocument = async (
    file: File,
    patientId: string,
    documentType: PatientDocumentType
): Promise<PatientUploadResponse> => {
    try {
        // Validate file
        const validation = validatePatientFile(file, documentType);
        if (!validation.isValid) {
            throw new Error(validation.error);
        }

        // Generate unique filename and path
        const fileName = generatePatientFileName(patientId, documentType, file.name);
        const bucketName = getPatientBucketName(documentType);

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
 * Downloads a patient document from Supabase Storage
 */
export const downloadPatientDocument = async (
    filePath: string,
    documentType: PatientDocumentType
): Promise<Blob> => {
    try {
        const bucketName = getPatientBucketName(documentType);
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
 * Deletes a patient document from Supabase Storage
 */
export const deletePatientDocument = async (
    filePath: string,
    documentType: PatientDocumentType
): Promise<void> => {
    try {
        const bucketName = getPatientBucketName(documentType);
        const { error } = await supabase.storage
            .from(bucketName)
            .remove([filePath]);

        if (error) {
            throw error;
        }
    } catch (error) {
        console.error('Delete error:', error);
        throw new Error(`Failed to delete ${documentType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
