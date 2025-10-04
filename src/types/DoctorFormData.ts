// Doctor form data types
export interface DoctorFormData {
  // Section 1: Basic Account Creation
  fullName: string;
  email: string;
  mobileNumber: string;
  password: string;
  confirmPassword: string;
  
  // Section 2: Professional & Identity Verification
  medicalRegistrationNumber: string;
  issuingCouncil: string;
  yearOfRegistration: number;
  medicalRegistrationCertificate: File | null;
  medicalRegistrationCertificateUrl?: string;
  aadhaarNumber: string;
  aadhaarFront: File | null;
  aadhaarFrontUrl?: string;
  aadhaarBack: File | null;
  aadhaarBackUrl?: string;
  panNumber: string;
  panCard: File | null;
  panCardUrl?: string;
  
  // Section 3: Clinical & Public Profile Details
  profilePicture: File | null;
  profilePictureUrl?: string;
  specialization: string[];
  superSpecialization: string;
  qualifications: Array<{
    degree: string;
    medicalCollege: string;
    yearOfCompletion: number;
  }>;
  degreeCertificates: File[];
  degreeCertificateUrls?: string[];
  totalYearsOfExperience: number;
  professionalBio: string;
  languagesSpoken: string[];
  
  // Section 4: Practice & Consultation Settings
  practiceLocations: Array<{
    clinicName: string;
    fullAddress: string;
    city: string;
    pincode: string;
  }>;
  consultationTypes: string[];
  consultationFees: {
    inClinic: number;
    video: number;
    audio: number;
  };
  servicesOffered: string[];
  
  // Section 5: Financial Information
  bankAccountHolderName: string;
  bankAccountNumber: string;
  confirmBankAccountNumber: string;
  ifscCode: string;
  bankName: string;
  bankBranch: string;
  cancelledCheque: File | null;
  cancelledChequeUrl?: string;
  
  // Section 6: Legal & Consents
  termsAccepted: boolean;
  privacyPolicyAccepted: boolean;
  telemedicineConsent: boolean;
}

