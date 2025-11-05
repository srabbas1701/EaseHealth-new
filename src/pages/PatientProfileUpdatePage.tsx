import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeft,
    Upload,
    FileText,
    User,
    Phone,
    CheckCircle,
    AlertCircle,
    Shield,
    Heart,
    ChevronRight,
    X,
    Camera,
    Save
} from 'lucide-react';
import Navigation from '../components/Navigation';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslations } from '../translations';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../utils/supabase';
import { uploadPatientDocument } from '../utils/patientFileUploadUtils';
import { AccessibilityAnnouncer } from '../components/AccessibilityAnnouncer';

interface FormData {
    // Non-editable fields (display only)
    patientId: string;
    registrationDate: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    bloodType: string;
    dateOfBirth: string;
    gender: string;

    // Editable fields
    address: string;
    city: string;
    state: string;
    medicalHistory: string;
    allergies: string;
    currentMedications: string;
    insuranceProvider: string;
    insuranceNumber: string;
    emergencyContactName: string;
    emergencyContactPhone: string;

    // Documents
    idProofFiles: File[];
    labReportFiles: File[];
    profileImageFile: File | null;
}

// Helper: Format date to DD-MM-YYYY for display only
const formatDisplayDate = (dateString: string): string => {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
};

// Static list of Indian States/UTs
const INDIAN_STATES: string[] = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

// Blood type options
const BLOOD_TYPES: string[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Gender options
const GENDER_OPTIONS: string[] = ['Male', 'Female', 'Other', 'Prefer not to say'];

// Helper: Convert dd-mm-yyyy to yyyy-mm-dd for database storage
const convertDateForDatabase = (dateString: string): string => {
    if (!dateString) return '';
    // If already in yyyy-mm-dd format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
    }
    // Convert dd-mm-yyyy to yyyy-mm-dd
    const parts = dateString.split('-');
    if (parts.length === 3) {
        const [dd, mm, yyyy] = parts;
        return `${yyyy}-${mm}-${dd}`;
    }
    return dateString;
};

// Helper: Convert yyyy-mm-dd to dd-mm-yyyy for display
const convertDateForDisplay = (dateString: string): string => {
    if (!dateString) return '';
    // If already in dd-mm-yyyy format, return as is
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
        return dateString;
    }
    // Convert yyyy-mm-dd to dd-mm-yyyy
    const parts = dateString.split('-');
    if (parts.length === 3) {
        const [yyyy, mm, dd] = parts;
        return `${dd}-${mm}-${yyyy}`;
    }
    return dateString;
};

// Helper: Calculate age from date of birth
const calculateAge = (dateOfBirth: string): number | null => {
    if (!dateOfBirth) return null;

    // Handle both dd-mm-yyyy and yyyy-mm-dd formats
    let birthDate: Date;

    if (/^\d{2}-\d{2}-\d{4}$/.test(dateOfBirth)) {
        // dd-mm-yyyy format
        const [dd, mm, yyyy] = dateOfBirth.split('-').map(Number);
        birthDate = new Date(yyyy, mm - 1, dd);
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
        // yyyy-mm-dd format
        birthDate = new Date(dateOfBirth);
    } else {
        return null;
    }

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age >= 0 ? age : null;
};

interface UploadedFiles {
    idProofUrls: string[];
    labReportUrls: string[];
    profileImageUrl: string | null;
}

interface AuthProps {
    user: any;
    session: any;
    profile: any;
    userState: 'new' | 'returning' | 'authenticated';
    isAuthenticated: boolean;
    handleLogout: () => Promise<void>;
}

const PatientProfileUpdatePage: React.FC<AuthProps> = ({ user, session, profile, userState, isAuthenticated, handleLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { language } = useLanguage();
    const { t } = useTranslations(language);
    const { isDarkMode } = useTheme();

    const [formData, setFormData] = useState<FormData>({
        patientId: '',
        registrationDate: '',
        fullName: '',
        email: '',
        phoneNumber: '',
        bloodType: '',
        dateOfBirth: '',
        gender: '',
        address: '',
        city: '',
        state: '',
        medicalHistory: '',
        allergies: '',
        currentMedications: '',
        insuranceProvider: '',
        insuranceNumber: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        idProofFiles: [],
        labReportFiles: [],
        profileImageFile: null
    });

    const [errors, setErrors] = useState<Partial<FormData>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [announcement, setAnnouncement] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFiles>({
        idProofUrls: [],
        labReportUrls: [],
        profileImageUrl: null
    });
    const [isLoading, setIsLoading] = useState(true);

    // Track which fields are editable (empty initially, can be set once)
    const [editableFields, setEditableFields] = useState({
        bloodType: false,
        dateOfBirth: false,
        gender: false
    });

    // Load patient data
    useEffect(() => {
        const loadPatientData = async () => {
            if (!user) {
                navigate('/patient-dashboard');
                return;
            }

            try {
                setIsLoading(true);

                // Quick session check without refresh to avoid timeout
                console.log('🔍 Checking current session...');
                const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) {
                    console.error('Session error:', sessionError);
                    setAnnouncement('Session error. Please log in again.');
                    setTimeout(() => {
                        handleLogout();
                    }, 2000);
                    return;
                }

                if (!currentSession) {
                    console.error('No active session found');
                    setAnnouncement('No active session. Please log in again.');
                    setTimeout(() => {
                        handleLogout();
                    }, 2000);
                    return;
                }

                console.log('✅ Session is valid');

                // Get patient profile with timeout to prevent hanging
                console.log('📊 Fetching patient data...');
                const patientDataPromise = supabase
                    .from('patients')
                    .select(`
                        id,
                        created_at,
                        full_name,
                        email,
                        phone_number,
                        blood_type,
                        date_of_birth,
                        gender,
                        address,
                        city,
                        state,
                        medical_history,
                        allergies,
                        current_medications,
                        insurance_provider,
                        insurance_number,
                        emergency_contact_name,
                        emergency_contact_phone,
                        profile_image_url,
                        id_proof_urls,
                        lab_report_urls
                    `)
                    .eq('user_id', user.id)
                    .single();

                // Add 15-second timeout to prevent hanging
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => {
                        reject(new Error('Patient data fetch timeout'));
                    }, 15000);
                });

                const { data: patientData, error } = await Promise.race([patientDataPromise, timeoutPromise]);

                if (error) {
                    console.error('Error loading patient data:', error);

                    // Handle timeout specifically
                    if (error.message && error.message.includes('timeout')) {
                        setAnnouncement('Loading is taking longer than expected. Please try again.');
                        return;
                    }

                    // Handle JWT expiration specifically
                    if (error.message && error.message.includes('InvalidJWT')) {
                        setAnnouncement('Your session has expired. Please log in again.');
                        setTimeout(() => {
                            handleLogout();
                        }, 2000);
                        return;
                    }

                    setAnnouncement('Failed to load patient data. Please try again.');
                    return;
                }

                if (patientData) {
                    // Check which fields are empty and can be edited once
                    const canEditBloodType = !patientData.blood_type || patientData.blood_type.trim() === '';
                    const canEditDateOfBirth = !patientData.date_of_birth || patientData.date_of_birth.trim() === '';
                    const canEditGender = !patientData.gender || patientData.gender.trim() === '';

                    setEditableFields({
                        bloodType: canEditBloodType,
                        dateOfBirth: canEditDateOfBirth,
                        gender: canEditGender
                    });

                    setFormData({
                        patientId: patientData.id || '',
                        registrationDate: patientData.created_at ? new Date(patientData.created_at).toLocaleDateString() : '',
                        fullName: patientData.full_name || '',
                        email: patientData.email || '',
                        phoneNumber: patientData.phone_number || '',
                        bloodType: patientData.blood_type || '',
                        dateOfBirth: patientData.date_of_birth || '',
                        gender: patientData.gender || '',
                        address: patientData.address || '',
                        city: patientData.city || '',
                        state: patientData.state || '',
                        medicalHistory: patientData.medical_history || '',
                        allergies: patientData.allergies || '',
                        currentMedications: patientData.current_medications || '',
                        insuranceProvider: patientData.insurance_provider || '',
                        insuranceNumber: patientData.insurance_number || '',
                        emergencyContactName: patientData.emergency_contact_name || '',
                        emergencyContactPhone: patientData.emergency_contact_phone || '',
                        idProofFiles: [],
                        labReportFiles: [],
                        profileImageFile: null
                    });

                    setUploadedFiles({
                        idProofUrls: patientData.id_proof_urls || [],
                        labReportUrls: patientData.lab_report_urls || [],
                        profileImageUrl: patientData.profile_image_url || null
                    });
                }

            } catch (error) {
                console.error('❌ Error in loadPatientData:', error);

                // Handle timeout errors
                if (error instanceof Error && error.message.includes('timeout')) {
                    setAnnouncement('Loading is taking longer than expected. Please try again.');
                } else {
                    setAnnouncement('Failed to load patient data. Please try again.');
                }
            } finally {
                setIsLoading(false);
            }
        };

        loadPatientData();
    }, [user, navigate]);

    const handleInputChange = (field: keyof FormData, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const handleFileUpload = (field: 'idProofFiles' | 'labReportFiles' | 'profileImageFile', files: FileList | null) => {
        if (!files) return;

        if (field === 'profileImageFile') {
            const file = files[0];
            if (file && validateFile(file)) {
                setFormData(prev => ({ ...prev, [field]: file }));
            }
        } else {
            const validFiles = Array.from(files).filter(validateFile);
            setFormData(prev => ({ ...prev, [field]: validFiles }));
        }
    };

    const validateFile = (file: File): boolean => {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg'];

        if (file.size > maxSize) {
            alert(`File ${file.name} is too large. Maximum size is 10MB.`);
            return false;
        }

        if (!allowedTypes.includes(file.type)) {
            alert(`File ${file.name} is not supported. Only PDF and JPEG files are allowed.`);
            return false;
        }

        return true;
    };

    const removeFile = (field: 'idProofFiles' | 'labReportFiles' | 'profileImageFile', index?: number) => {
        if (field === 'profileImageFile') {
            setFormData(prev => ({ ...prev, [field]: null }));
        } else if (index !== undefined) {
            setFormData(prev => ({
                ...prev,
                [field]: prev[field].filter((_, i) => i !== index)
            }));
        }
    };

    const uploadFiles = async (patientId: string): Promise<UploadedFiles> => {
        const result: UploadedFiles = {
            idProofUrls: [...uploadedFiles.idProofUrls],
            labReportUrls: [...uploadedFiles.labReportUrls],
            profileImageUrl: uploadedFiles.profileImageUrl
        };

        // If no new files to upload, return current result
        if (formData.idProofFiles.length === 0 &&
            formData.labReportFiles.length === 0 &&
            !formData.profileImageFile) {
            console.log('📁 No new files to upload');
            return result;
        }

        try {
            console.log('📁 Starting file upload process for patient:', patientId);

            // Upload files in parallel for better performance
            const uploadPromises: Promise<void>[] = [];

            // Upload Profile Image
            if (formData.profileImageFile) {
                uploadPromises.push(
                    uploadPatientDocument(formData.profileImageFile, patientId, 'profile_image')
                        .then(uploadResult => {
                            result.profileImageUrl = uploadResult.publicUrl || uploadResult.signedUrl;
                            console.log('✅ Profile image uploaded successfully');
                        })
                        .catch(async (err) => {
                            console.error('❌ Profile image upload failed:', err);

                            // If JWT error, try refreshing session and retry once
                            if (err.message && err.message.includes('InvalidJWT')) {
                                console.log('🔄 JWT error detected, refreshing session and retrying...');
                                try {
                                    await supabase.auth.refreshSession();
                                    const retryResult = await uploadPatientDocument(formData.profileImageFile, patientId, 'profile_image');
                                    result.profileImageUrl = retryResult.publicUrl || retryResult.signedUrl;
                                    console.log('✅ Profile image uploaded successfully on retry');
                                } catch (retryErr) {
                                    console.error('❌ Profile image upload failed on retry:', retryErr);
                                    setAnnouncement('Failed to upload profile image. You can try again later.');
                                }
                            } else {
                                setAnnouncement('Failed to upload profile image. You can try again later.');
                            }
                        })
                );
            }

            // Upload ID Proof files
            if (formData.idProofFiles.length > 0) {
                console.log(`📄 Uploading ${formData.idProofFiles.length} ID proof files...`);
                formData.idProofFiles.forEach(file => {
                    uploadPromises.push(
                        uploadPatientDocument(file, patientId, 'aadhaar_documents')
                            .then(uploadResult => {
                                const url = uploadResult.publicUrl || uploadResult.signedUrl;
                                if (url) {
                                    result.idProofUrls.push(url);
                                    console.log('✅ ID proof file uploaded:', file.name);
                                }
                            })
                            .catch(async (err) => {
                                console.error('❌ ID proof upload failed:', err);

                                // If JWT error, try refreshing session and retry once
                                if (err.message && err.message.includes('InvalidJWT')) {
                                    console.log('🔄 JWT error detected, refreshing session and retrying...');
                                    try {
                                        await supabase.auth.refreshSession();
                                        const retryResult = await uploadPatientDocument(file, patientId, 'aadhaar_documents');
                                        const url = retryResult.publicUrl || retryResult.signedUrl;
                                        if (url) {
                                            result.idProofUrls.push(url);
                                            console.log('✅ ID proof file uploaded successfully on retry:', file.name);
                                        }
                                    } catch (retryErr) {
                                        console.error('❌ ID proof upload failed on retry:', retryErr);
                                        setAnnouncement(`Failed to upload ID proof: ${file.name}. You can try again later.`);
                                    }
                                } else {
                                    setAnnouncement(`Failed to upload ID proof: ${file.name}. You can try again later.`);
                                }
                            })
                    );
                });
            }

            // Upload Lab Report files and create records in patient_reports table
            if (formData.labReportFiles.length > 0) {
                console.log(`📄 Uploading ${formData.labReportFiles.length} lab report files...`);
                formData.labReportFiles.forEach(file => {
                    uploadPromises.push(
                        (async () => {
                            try {
                                // 1. Upload file to storage
                                const uploadResult = await uploadPatientDocument(file, patientId, 'lab_reports');

                                // 2. Get user_id for the patient
                                const { data: patientData } = await supabase
                                    .from('patients')
                                    .select('user_id')
                                    .eq('id', patientId)
                                    .single();

                                // 3. Create record in patient_reports table
                                const { data: reportData, error: insertError } = await supabase
                                    .from('patient_reports')
                                    .insert({
                                        patient_id: patientId,
                                        report_name: file.name,
                                        report_type: 'lab_report',
                                        file_url: uploadResult.path,
                                        file_size: file.size,
                                        file_type: file.type,
                                        // uploaded_by references doctors(id). For patient uploads keep NULL.
                                        uploaded_by: null,
                                        upload_source: 'patient_profile_update',
                                        upload_date: new Date().toISOString()
                                    })
                                    .select()
                                    .single();

                                if (insertError) throw insertError;

                                // Track report ID for confirmation
                                result.labReportUrls.push(reportData.id);
                                console.log('✅ Lab report uploaded and recorded in database:', file.name);

                            } catch (err: any) {
                                console.error('❌ Lab report upload failed:', err);

                                // If JWT error, try refreshing session and retry once
                                if (err.message && err.message.includes('InvalidJWT')) {
                                    console.log('🔄 JWT error detected, refreshing session and retrying...');
                                    try {
                                        await supabase.auth.refreshSession();

                                        // Retry upload
                                        const retryResult = await uploadPatientDocument(file, patientId, 'lab_reports');
                                        const { data: patientData } = await supabase
                                            .from('patients')
                                            .select('user_id')
                                            .eq('id', patientId)
                                            .single();

                                        const { data: reportData } = await supabase
                                            .from('patient_reports')
                                            .insert({
                                                patient_id: patientId,
                                                report_name: file.name,
                                                report_type: 'lab_report',
                                                file_url: retryResult.path,
                                                file_size: file.size,
                                                file_type: file.type,
                                                uploaded_by: null,
                                                upload_source: 'patient_profile_update',
                                                upload_date: new Date().toISOString()
                                            })
                                            .select()
                                            .single();

                                        if (reportData) {
                                            result.labReportUrls.push(reportData.id);
                                            console.log('✅ Lab report uploaded successfully on retry:', file.name);
                                        }
                                    } catch (retryErr) {
                                        console.error('❌ Lab report upload failed on retry:', retryErr);
                                        setAnnouncement(`Failed to upload lab report: ${file.name}. You can try again later.`);
                                    }
                                } else {
                                    setAnnouncement(`Failed to upload lab report: ${file.name}. You can try again later.`);
                                }
                            }
                        })()
                    );
                });
            }

            // Wait for all uploads to complete
            await Promise.all(uploadPromises);

            return result;
        } catch (error) {
            console.error('❌ Critical error in file upload process:', error);
            setAnnouncement('Some files failed to upload. You can try uploading them later.');
            return result;
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<FormData> = {};

        // Address validation
        if (!formData.address.trim()) {
            newErrors.address = 'Address is required';
        } else if (formData.address.trim().length < 10) {
            newErrors.address = 'Address must be at least 10 characters long';
        }

        // Emergency Contact Name
        if (!formData.emergencyContactName.trim()) {
            newErrors.emergencyContactName = 'Emergency contact name is required';
        } else if (formData.emergencyContactName.trim().length < 3) {
            newErrors.emergencyContactName = 'Emergency contact name must be at least 3 characters long';
        }

        // Emergency Contact Phone
        const phoneRegex = /^[0-9]{10}$/;
        if (!formData.emergencyContactPhone.trim()) {
            newErrors.emergencyContactPhone = 'Emergency contact phone is required';
        } else if (!phoneRegex.test(formData.emergencyContactPhone.trim())) {
            newErrors.emergencyContactPhone = 'Emergency contact phone must be 10 digits';
        }

        // Validate editable fields if they are being set for the first time
        if (editableFields.bloodType && !formData.bloodType.trim()) {
            newErrors.bloodType = 'Blood type is required';
        }

        if (editableFields.dateOfBirth) {
            if (!formData.dateOfBirth.trim()) {
                newErrors.dateOfBirth = 'Date of birth is required';
            } else {
                // Validate date format dd-mm-yyyy
                const dateRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
                if (!dateRegex.test(formData.dateOfBirth.trim())) {
                    newErrors.dateOfBirth = 'Date must be in dd-mm-yyyy format';
                } else {
                    // Validate if it's a valid date
                    const [dd, mm, yyyy] = formData.dateOfBirth.split('-').map(Number);
                    const date = new Date(yyyy, mm - 1, dd);
                    if (date.getDate() !== dd || date.getMonth() !== mm - 1 || date.getFullYear() !== yyyy) {
                        newErrors.dateOfBirth = 'Invalid date';
                    } else if (date > new Date()) {
                        newErrors.dateOfBirth = 'Date of birth cannot be in the future';
                    }
                }
            }
        }

        if (editableFields.gender && !formData.gender.trim()) {
            newErrors.gender = 'Gender is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('🔄 Starting profile update...');

        if (!validateForm()) {
            console.log('❌ Form validation failed');
            return;
        }

        setIsSubmitting(true);
        setAnnouncement('Updating your profile...');

        try {
            // Update patient record (session refresh removed for performance)
            const updateData: any = {
                address: formData.address,
                city: formData.city,
                state: formData.state,
                medical_history: formData.medicalHistory || null,
                allergies: formData.allergies || null,
                current_medications: formData.currentMedications || null,
                insurance_provider: formData.insuranceProvider || null,
                insurance_number: formData.insuranceNumber || null,
                emergency_contact_name: formData.emergencyContactName,
                emergency_contact_phone: formData.emergencyContactPhone
            };

            // Include editable fields if they are being set for the first time
            if (editableFields.bloodType && formData.bloodType) {
                updateData.blood_type = formData.bloodType;
            }

            if (editableFields.dateOfBirth && formData.dateOfBirth) {
                // Convert dd-mm-yyyy to yyyy-mm-dd for database
                const dobForDB = convertDateForDatabase(formData.dateOfBirth);
                updateData.date_of_birth = dobForDB;

                // Calculate and store age
                const calculatedAge = calculateAge(formData.dateOfBirth);
                if (calculatedAge !== null) {
                    updateData.age = calculatedAge;
                    console.log('✅ Calculated age from DOB:', calculatedAge);
                }
            }

            if (editableFields.gender && formData.gender) {
                updateData.gender = formData.gender;
            }

            console.log('📊 Updating patient record...');

            const { error: updateError } = await supabase
                .from('patients')
                .update(updateData)
                .eq('user_id', user?.id);

            if (updateError) {
                console.error('❌ Error updating patient record:', updateError);

                // Handle JWT expiration during update
                if (updateError.message && updateError.message.includes('InvalidJWT')) {
                    setAnnouncement('Your session has expired. Please log in again and try updating your profile.');
                    setTimeout(() => {
                        handleLogout();
                    }, 2000);
                    return;
                }

                throw updateError;
            }

            console.log('✅ Successfully updated patient record');

            // Upload new files if any (session refresh removed for performance)
            if (formData.idProofFiles.length > 0 || formData.labReportFiles.length > 0 || formData.profileImageFile) {
                console.log('📁 Uploading new files...');
                const uploadedFiles = await uploadFiles(formData.patientId);

                // Update patient record with new file URLs (only profile image and ID proofs)
                // Note: lab_report_urls no longer stored here - they're in patient_reports table
                if (uploadedFiles.profileImageUrl || uploadedFiles.idProofUrls.length > 0) {
                    const { error: fileUpdateError } = await supabase
                        .from('patients')
                        .update({
                            profile_image_url: uploadedFiles.profileImageUrl,
                            id_proof_urls: uploadedFiles.idProofUrls
                            // lab_report_urls removed - now stored in patient_reports table
                        })
                        .eq('id', formData.patientId);

                    if (fileUpdateError) {
                        console.error('⚠️ Error updating patient with file URLs:', fileUpdateError);

                        // Handle JWT expiration during file URL update
                        if (fileUpdateError.message && fileUpdateError.message.includes('InvalidJWT')) {
                            setAnnouncement('Your session expired during file upload. Please log in again.');
                            setTimeout(() => {
                                handleLogout();
                            }, 2000);
                            return;
                        }
                    } else {
                        console.log('✅ Updated patient record with file URLs');
                    }
                }

                // Log lab reports summary (now stored in patient_reports table)
                if (uploadedFiles.labReportUrls.length > 0) {
                    console.log(`✅ ${uploadedFiles.labReportUrls.length} lab reports saved to patient_reports table`);
                }
            }

            setSubmitSuccess(true);
            setAnnouncement('Profile updated successfully!');

            // Redirect after 2 seconds
            setTimeout(() => {
                navigate('/patient-dashboard');
            }, 2000);

        } catch (error) {
            console.error('Error updating profile:', error);
            setAnnouncement('Failed to update profile. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
                <AccessibilityAnnouncer message={announcement} />
                <Navigation
                    user={user}
                    session={session}
                    profile={profile}
                    userState={userState}
                    isAuthenticated={isAuthenticated}
                    handleLogout={handleLogout}
                />
                <div className="flex items-center justify-center min-h-screen px-4">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                        <p className="text-lg text-gray-600 dark:text-gray-300">{t('patientProfileUpdate.loading')}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (submitSuccess) {
        return (
            <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
                <AccessibilityAnnouncer message={announcement} />
                <Navigation
                    user={user}
                    session={session}
                    profile={profile}
                    userState={userState}
                    isAuthenticated={isAuthenticated}
                    handleLogout={handleLogout}
                />
                <div className="flex items-center justify-center min-h-screen px-4">
                    <div className="text-center">
                        <div className="w-24 h-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-8">
                            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
                        </div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                            Profile Updated Successfully!
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                            Your profile has been updated with the latest information.
                        </p>
                        <Link
                            to="/patient-dashboard"
                            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                        >
                            Back to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
            <AccessibilityAnnouncer message={announcement} />
            <Navigation
                user={user}
                session={session}
                profile={profile}
                userState={userState}
                isAuthenticated={isAuthenticated}
                handleLogout={handleLogout}
            />

            <div className="px-4 py-12 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    {/* Back Button */}
                    <Link
                        to="/patient-dashboard"
                        className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors mb-8"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        {t('patientProfileUpdate.backToDashboard')}
                    </Link>

                    {/* Header Section */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#0A2647] dark:text-gray-100 leading-tight mb-6">
                            {t('patientProfileUpdate.title')}
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
                            {t('patientProfileUpdate.subtitle')}
                        </p>
                        {/* Legend removed as per request; section colors indicate state */}
                    </div>
                    {/* Read-only summary on top (gray) followed by editable form (white) */}
                    <div className="space-y-8 lg:space-y-10">
                        <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-200 dark:border-gray-700">
                            <div className="pb-4">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                                    <Shield className="w-5 h-5 mr-2 text-blue-600" />
                                    {t('patientProfileUpdate.identitySection.title')}
                                </h2>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                                    {t('patientProfileUpdate.identitySection.subtitle')}
                                </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3 md:p-4 border border-gray-200 dark:border-gray-700 cursor-default min-w-0">
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Patient ID</label>
                                    <p className="text-sm font-medium text-[#0A2647] dark:text-gray-100 break-words">{formData.patientId}</p>
                                </div>
                                <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3 md:p-4 border border-gray-200 dark:border-gray-700 cursor-default min-w-0">
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Registration Date</label>
                                    <p className="text-sm font-medium text-[#0A2647] dark:text-gray-100 break-words">{formData.registrationDate}</p>
                                </div>
                                <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3 md:p-4 border border-gray-200 dark:border-gray-700 cursor-default min-w-0">
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Full Name</label>
                                    <p className="text-sm font-medium text-[#0A2647] dark:text-gray-100 break-words">{formData.fullName}</p>
                                </div>
                                <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3 md:p-4 border border-gray-200 dark:border-gray-700 cursor-default min-w-0">
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Email Address</label>
                                    <p className="text-sm font-medium text-[#0A2647] dark:text-gray-100 break-words">{formData.email}</p>
                                </div>
                                <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3 md:p-4 border border-gray-200 dark:border-gray-700 cursor-default min-w-0">
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Phone Number</label>
                                    <p className="text-sm font-medium text-[#0A2647] dark:text-gray-100 break-words">{formData.phoneNumber}</p>
                                </div>

                                {/* Conditionally display Blood Type - read-only if already set */}
                                {!editableFields.bloodType && (
                                    <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3 md:p-4 border border-gray-200 dark:border-gray-700 cursor-default min-w-0">
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Blood Type</label>
                                        <p className="text-sm font-medium text-[#0A2647] dark:text-gray-100 break-words">{formData.bloodType}</p>
                                    </div>
                                )}

                                {/* Conditionally display Date of Birth - read-only if already set */}
                                {!editableFields.dateOfBirth && (
                                    <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3 md:p-4 border border-gray-200 dark:border-gray-700 cursor-default min-w-0">
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date of Birth</label>
                                        <p className="text-sm font-medium text-[#0A2647] dark:text-gray-100 break-words">{formatDisplayDate(formData.dateOfBirth)}</p>
                                    </div>
                                )}

                                {/* Conditionally display Gender - read-only if already set */}
                                {!editableFields.gender && (
                                    <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3 md:p-4 border border-gray-200 dark:border-gray-700 cursor-default min-w-0">
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Gender</label>
                                        <p className="text-sm font-medium text-[#0A2647] dark:text-gray-100 break-words">{formData.gender}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Editable sections form (white) */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
                            <form onSubmit={handleSubmit} className="space-y-12">

                                {/* Editable Personal Information Section */}
                                <div className="space-y-6">
                                    <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                                            <User className="w-6 h-6 mr-3 text-blue-600" />
                                            {t('patientProfileUpdate.contactSection.title')}
                                        </h2>
                                        <p className="text-gray-600 dark:text-gray-300 mt-2">
                                            {t('patientProfileUpdate.contactSection.subtitle')}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                {t('patientProfileUpdate.fields.address.label')}
                                            </label>
                                            <textarea
                                                id="address"
                                                value={formData.address}
                                                onChange={(e) => handleInputChange('address', e.target.value)}
                                                rows={3}
                                                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${errors.address ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                                    }`}
                                                placeholder={t('patientProfileUpdate.fields.address.placeholder')}
                                            />
                                            {errors.address && (
                                                <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                                                    <AlertCircle className="w-4 h-4 mr-1" />
                                                    {errors.address}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                {t('patientProfileUpdate.fields.city.label')}
                                            </label>
                                            <input
                                                type="text"
                                                id="city"
                                                value={formData.city}
                                                onChange={(e) => handleInputChange('city', e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                placeholder={t('patientProfileUpdate.fields.city.placeholder')}
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                {t('patientProfileUpdate.fields.state.label')}
                                            </label>
                                            <select
                                                id="state"
                                                value={formData.state || ''}
                                                onChange={(e) => handleInputChange('state', e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                            >
                                                <option value="" disabled>{t('patientProfileUpdate.fields.state.placeholder')}</option>
                                                {INDIAN_STATES.map((st) => (
                                                    <option key={st} value={st}>{st}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Editable Blood Type - Only if empty initially */}
                                        {editableFields.bloodType && (
                                            <div>
                                                <label htmlFor="bloodType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Blood Type <span className="text-red-500">*</span>
                                                    <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(Can be set only once)</span>
                                                </label>
                                                <select
                                                    id="bloodType"
                                                    value={formData.bloodType}
                                                    onChange={(e) => handleInputChange('bloodType', e.target.value)}
                                                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${errors.bloodType ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                                        }`}
                                                >
                                                    <option value="">Select Blood Type</option>
                                                    {BLOOD_TYPES.map((type) => (
                                                        <option key={type} value={type}>{type}</option>
                                                    ))}
                                                </select>
                                                {errors.bloodType && (
                                                    <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                                                        <AlertCircle className="w-4 h-4 mr-1" />
                                                        {errors.bloodType}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Editable Date of Birth - Only if empty initially */}
                                        {editableFields.dateOfBirth && (
                                            <div>
                                                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Date of Birth <span className="text-red-500">*</span>
                                                    <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(Can be set only once)</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    id="dateOfBirth"
                                                    value={formData.dateOfBirth}
                                                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                                                    placeholder="dd-mm-yyyy"
                                                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${errors.dateOfBirth ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                                        }`}
                                                />
                                                {errors.dateOfBirth && (
                                                    <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                                                        <AlertCircle className="w-4 h-4 mr-1" />
                                                        {errors.dateOfBirth}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Editable Gender - Only if empty initially */}
                                        {editableFields.gender && (
                                            <div>
                                                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Gender <span className="text-red-500">*</span>
                                                    <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(Can be set only once)</span>
                                                </label>
                                                <select
                                                    id="gender"
                                                    value={formData.gender}
                                                    onChange={(e) => handleInputChange('gender', e.target.value)}
                                                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${errors.gender ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                                        }`}
                                                >
                                                    <option value="">Select Gender</option>
                                                    {GENDER_OPTIONS.map((option) => (
                                                        <option key={option} value={option}>{option}</option>
                                                    ))}
                                                </select>
                                                {errors.gender && (
                                                    <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                                                        <AlertCircle className="w-4 h-4 mr-1" />
                                                        {errors.gender}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Medical Information Section */}
                                <div className="space-y-6">
                                    <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                                            <Heart className="w-6 h-6 mr-3 text-blue-600" />
                                            {t('patientProfileUpdate.medicalSection.title')}
                                        </h2>
                                        <p className="text-gray-600 dark:text-gray-300 mt-2">
                                            {t('patientProfileUpdate.medicalSection.subtitle')}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <label htmlFor="medicalHistory" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                {t('patientProfileUpdate.fields.medicalHistory.label')}
                                            </label>
                                            <textarea
                                                id="medicalHistory"
                                                value={formData.medicalHistory}
                                                onChange={(e) => handleInputChange('medicalHistory', e.target.value)}
                                                rows={4}
                                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                placeholder={t('patientProfileUpdate.fields.medicalHistory.placeholder')}
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label htmlFor="allergies" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                {t('patientProfileUpdate.fields.allergies.label')}
                                            </label>
                                            <textarea
                                                id="allergies"
                                                value={formData.allergies}
                                                onChange={(e) => handleInputChange('allergies', e.target.value)}
                                                rows={3}
                                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                placeholder={t('patientProfileUpdate.fields.allergies.placeholder')}
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label htmlFor="currentMedications" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                {t('patientProfileUpdate.fields.currentMedications.label')}
                                            </label>
                                            <textarea
                                                id="currentMedications"
                                                value={formData.currentMedications}
                                                onChange={(e) => handleInputChange('currentMedications', e.target.value)}
                                                rows={3}
                                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                placeholder={t('patientProfileUpdate.fields.currentMedications.placeholder')}
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="insuranceProvider" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                {t('patientProfileUpdate.fields.insuranceProvider.label')}
                                            </label>
                                            <input
                                                type="text"
                                                id="insuranceProvider"
                                                value={formData.insuranceProvider}
                                                onChange={(e) => handleInputChange('insuranceProvider', e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                placeholder={t('patientProfileUpdate.fields.insuranceProvider.placeholder')}
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="insuranceNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                {t('patientProfileUpdate.fields.insuranceNumber.label')}
                                            </label>
                                            <input
                                                type="text"
                                                id="insuranceNumber"
                                                value={formData.insuranceNumber}
                                                onChange={(e) => handleInputChange('insuranceNumber', e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                placeholder={t('patientProfileUpdate.fields.insuranceNumber.placeholder')}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Emergency Contacts Section */}
                                <div className="space-y-6">
                                    <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                                            <Phone className="w-6 h-6 mr-3 text-blue-600" />
                                            {t('patientProfileUpdate.emergencySection.title')}
                                        </h2>
                                        <p className="text-gray-600 dark:text-gray-300 mt-2">
                                            {t('patientProfileUpdate.emergencySection.subtitle')}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label htmlFor="emergencyContactName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                {t('patientProfileUpdate.fields.emergencyContactName.label')}
                                            </label>
                                            <input
                                                type="text"
                                                id="emergencyContactName"
                                                value={formData.emergencyContactName}
                                                onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                                                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${errors.emergencyContactName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                                    }`}
                                                placeholder={t('patientProfileUpdate.fields.emergencyContactName.placeholder')}
                                            />
                                            {errors.emergencyContactName && (
                                                <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                                                    <AlertCircle className="w-4 h-4 mr-1" />
                                                    {errors.emergencyContactName}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label htmlFor="emergencyContactPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                {t('patientProfileUpdate.fields.emergencyContactPhone.label')}
                                            </label>
                                            <input
                                                type="tel"
                                                id="emergencyContactPhone"
                                                value={formData.emergencyContactPhone}
                                                onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                                                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${errors.emergencyContactPhone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                                    }`}
                                                placeholder={t('patientProfileUpdate.fields.emergencyContactPhone.placeholder')}
                                            />
                                            {errors.emergencyContactPhone && (
                                                <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                                                    <AlertCircle className="w-4 h-4 mr-1" />
                                                    {errors.emergencyContactPhone}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Document Upload Section */}
                                <div className="space-y-6">
                                    <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                                            <Upload className="w-6 h-6 mr-3 text-blue-600" />
                                            {t('patientProfileUpdate.documentsSection.title')}
                                        </h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                            {t('patientProfileUpdate.documentsSection.subtitle')}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* ID Proof Upload */}
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('patientProfileUpdate.uploads.idProof.title')}</h3>
                                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                                                <input
                                                    type="file"
                                                    id="idProof"
                                                    multiple
                                                    accept=".pdf,.jpg,.jpeg"
                                                    onChange={(e) => handleFileUpload('idProofFiles', e.target.files)}
                                                    className="hidden"
                                                />
                                                <label htmlFor="idProof" className="cursor-pointer">
                                                    <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                                    <p className="text-sm text-gray-600 dark:text-gray-300">{t('patientProfileUpdate.uploads.idProof.button')}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('patientProfileUpdate.uploads.idProof.hint')}</p>
                                                </label>
                                            </div>
                                            {formData.idProofFiles.length > 0 && (
                                                <div className="space-y-2">
                                                    {formData.idProofFiles.map((file, index) => (
                                                        <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded">
                                                            <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{file.name}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeFile('idProofFiles', index)}
                                                                className="text-red-500 hover:text-red-700"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Lab Reports Upload */}
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('patientProfileUpdate.uploads.labReports.title')}</h3>
                                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                                                <input
                                                    type="file"
                                                    id="labReports"
                                                    multiple
                                                    accept=".pdf,.jpg,.jpeg"
                                                    onChange={(e) => handleFileUpload('labReportFiles', e.target.files)}
                                                    className="hidden"
                                                />
                                                <label htmlFor="labReports" className="cursor-pointer">
                                                    <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                                    <p className="text-sm text-gray-600 dark:text-gray-300">{t('patientProfileUpdate.uploads.labReports.button')}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('patientProfileUpdate.uploads.labReports.hint')}</p>
                                                </label>
                                            </div>
                                            {formData.labReportFiles.length > 0 && (
                                                <div className="space-y-2">
                                                    {formData.labReportFiles.map((file, index) => (
                                                        <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded">
                                                            <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{file.name}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeFile('labReportFiles', index)}
                                                                className="text-red-500 hover:text-red-700"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Profile Image Upload */}
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('patientProfileUpdate.uploads.profileImage.title')}</h3>
                                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                                                <input
                                                    type="file"
                                                    id="profileImage"
                                                    accept=".jpg,.jpeg"
                                                    onChange={(e) => handleFileUpload('profileImageFile', e.target.files)}
                                                    className="hidden"
                                                />
                                                <label htmlFor="profileImage" className="cursor-pointer">
                                                    <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                                    <p className="text-sm text-gray-600 dark:text-gray-300">{t('patientProfileUpdate.uploads.profileImage.button')}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('patientProfileUpdate.uploads.profileImage.hint')}</p>
                                                </label>
                                            </div>
                                            {formData.profileImageFile && (
                                                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded">
                                                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{formData.profileImageFile.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeFile('profileImageFile')}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="flex justify-end pt-6">
                                    <div className="flex items-center justify-end gap-3 pt-6">
                                        <Link to="/patient-dashboard" className="px-6 py-3 rounded-lg font-medium text-[#0A2647] dark:text-gray-100 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                            {t('patientProfileUpdate.actions.cancel')}
                                        </Link>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className={`flex items-center px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 transform hover:scale-105 ${isSubmitting
                                                ? 'bg-gray-400 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl'
                                                }`}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                                                    {t('patientProfileUpdate.submit.updating')}
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-5 h-5 mr-2" />
                                                    {t('patientProfileUpdate.submit.update')}
                                                    <ChevronRight className="w-5 h-5 ml-2" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientProfileUpdatePage;
