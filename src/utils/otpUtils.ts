import { supabase } from './supabase';

// OTP storage interface
interface OTPData {
    id: string;
    email?: string;
    phone?: string;
    otp: string;
    expiresAt: Date;
    attempts: number;
    verified: boolean;
}

// Generate a 6-digit OTP
export const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store OTP in localStorage (for demo purposes - in production, use a secure backend)
const OTP_STORAGE_KEY = 'easehealth_otp_data';

export const storeOTP = (email: string | null, phone: string | null, otp: string): void => {
    const otpData: OTPData = {
        id: Date.now().toString(),
        email: email || undefined,
        phone: phone || undefined,
        otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        attempts: 0,
        verified: false
    };

    localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(otpData));
    console.log('🔐 OTP stored:', { email, phone, expiresAt: otpData.expiresAt });
};

export const getStoredOTP = (): OTPData | null => {
    try {
        const stored = localStorage.getItem(OTP_STORAGE_KEY);
        if (!stored) return null;

        const otpData: OTPData = JSON.parse(stored);
        otpData.expiresAt = new Date(otpData.expiresAt);

        // Check if OTP has expired
        if (new Date() > otpData.expiresAt) {
            localStorage.removeItem(OTP_STORAGE_KEY);
            console.log('⏰ OTP expired, removed from storage');
            return null;
        }

        return otpData;
    } catch (error) {
        console.error('❌ Error retrieving stored OTP:', error);
        localStorage.removeItem(OTP_STORAGE_KEY);
        return null;
    }
};

export const verifyOTP = (inputOTP: string): { isValid: boolean; error?: string } => {
    const storedOTP = getStoredOTP();

    if (!storedOTP) {
        return { isValid: false, error: 'No OTP found or OTP has expired' };
    }

    // Increment attempts
    storedOTP.attempts++;
    localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(storedOTP));

    if (storedOTP.attempts > 3) {
        localStorage.removeItem(OTP_STORAGE_KEY);
        return { isValid: false, error: 'Too many attempts. Please request a new OTP' };
    }

    if (inputOTP !== storedOTP.otp) {
        return { isValid: false, error: 'Invalid OTP' };
    }

    // Mark as verified
    storedOTP.verified = true;
    localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(storedOTP));

    console.log('✅ OTP verified successfully');
    return { isValid: true };
};

export const clearStoredOTP = (): void => {
    localStorage.removeItem(OTP_STORAGE_KEY);
    console.log('🗑️ OTP cleared from storage');
};

// Validate if email/phone belongs to a registered user
export const validateUserExists = async (email?: string, phone?: string): Promise<{ exists: boolean; userId?: string; error?: string }> => {
    try {
        console.log('🔍 Validating user existence:', { email, phone });

        let query = supabase.from('patients').select('id, user_id, email, phone_number');

        if (email) {
            query = query.eq('email', email);
        } else if (phone) {
            // Normalize phone number (remove spaces, +91 prefix, etc.)
            const normalizedPhone = phone.replace(/\D/g, '').replace(/^91/, '');
            query = query.eq('phone_number', normalizedPhone);
        } else {
            return { exists: false, error: 'No email or phone provided' };
        }

        const { data, error } = await query.single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No rows returned - user doesn't exist
                console.log('❌ User not found in database');
                return { exists: false };
            }
            console.error('❌ Database error during user validation:', error);
            return { exists: false, error: 'Database error during validation' };
        }

        if (data) {
            console.log('✅ User found:', { id: data.id, user_id: data.user_id });
            return { exists: true, userId: data.user_id };
        }

        return { exists: false };
    } catch (error) {
        console.error('❌ Error validating user:', error);
        return { exists: false, error: 'Failed to validate user' };
    }
};

// Send OTP via email using Supabase or external service
export const sendOTPViaEmail = async (email: string, otp: string): Promise<{ success: boolean; error?: string }> => {
    try {
        console.log('📧 Sending OTP via email:', { email, otp });

        // SECURITY CHECK: Validate if email belongs to a registered user
        const validation = await validateUserExists(email, undefined);
        if (!validation.exists) {
            console.log('❌ Email not registered in system:', email);
            return { success: false, error: 'This email is not registered in our system' };
        }

        // Option 1: Use Supabase Auth (built-in email service)
        // This uses Supabase's built-in email service for password reset
        /*
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/reset-password',
          data: {
            otp: otp,
            custom_message: `Your EaseHealth OTP is: ${otp}. This OTP is valid for 10 minutes.`
          }
        });
        
        if (error) {
          throw new Error(error.message);
        }
        
        console.log('✅ OTP sent via email successfully via Supabase');
        return { success: true };
        */

        // Option 2: Use Supabase Edge Functions for custom email
        /*
        const { data, error } = await supabase.functions.invoke('send-otp-email', {
          body: {
            email: email,
            otp: otp,
            subject: 'Your EaseHealth OTP',
            message: `Your EaseHealth OTP is: ${otp}. This OTP is valid for 10 minutes. Do not share it with anyone.`
          }
        });
        
        if (error) {
          throw new Error(error.message);
        }
        
        console.log('✅ OTP sent via email successfully via Supabase Edge Function');
        return { success: true };
        */

        // Option 3: Use SendGrid (external email service)
        /*
        const apiKey = process.env.REACT_APP_SENDGRID_API_KEY;
        const fromEmail = process.env.REACT_APP_FROM_EMAIL || 'noreply@easehealth.com';
        
        if (!apiKey) {
          throw new Error('SendGrid API key not configured');
        }
        
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{
              to: [{ email: email }],
              subject: 'Your EaseHealth OTP'
            }],
            from: { email: fromEmail },
            content: [{
              type: 'text/html',
              value: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #0A2647;">EaseHealth OTP</h2>
                  <p>Your One-Time Password (OTP) is:</p>
                  <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
                    <h1 style="color: #0A2647; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
                  </div>
                  <p>This OTP is valid for 10 minutes. Do not share it with anyone.</p>
                  <p style="color: #666; font-size: 14px;">If you didn't request this OTP, please ignore this email.</p>
                </div>
              `
            }]
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.errors?.[0]?.message || 'Failed to send email');
        }
        
        console.log('✅ OTP sent via email successfully via SendGrid');
        return { success: true };
        */

        // TEMPORARY: Demo mode - remove this when implementing real email
        console.log('⚠️ DEMO MODE: Email not actually sent. Configure email service for production.');
        console.log(`📧 Would send OTP ${otp} to ${email}`);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // For testing purposes, you can see the OTP in console
        console.log(`🔑 DEMO OTP for ${email}: ${otp}`);

        return { success: true };

    } catch (error) {
        console.error('❌ Error sending OTP via email:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to send OTP via email' };
    }
};

// Send OTP via SMS using Twilio (production ready)
export const sendOTPViaSMS = async (phone: string, otp: string): Promise<{ success: boolean; error?: string }> => {
    try {
        console.log('📱 Sending OTP via SMS:', { phone, otp });

        // SECURITY CHECK: Validate if phone belongs to a registered user
        const validation = await validateUserExists(undefined, phone);
        if (!validation.exists) {
            console.log('❌ Phone not registered in system:', phone);
            return { success: false, error: 'This phone number is not registered in our system' };
        }

        // Format phone number for international use
        const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;

        // Option 1: Use Twilio (requires Twilio account and credentials)
        // Uncomment and configure these lines when you have Twilio set up:
        /*
        const accountSid = process.env.REACT_APP_TWILIO_ACCOUNT_SID;
        const authToken = process.env.REACT_APP_TWILIO_AUTH_TOKEN;
        const twilioPhone = process.env.REACT_APP_TWILIO_PHONE_NUMBER;
        
        if (!accountSid || !authToken || !twilioPhone) {
          throw new Error('Twilio credentials not configured');
        }
        
        const response = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + accountSid + '/Messages.json', {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + btoa(accountSid + ':' + authToken),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: formattedPhone,
            From: twilioPhone,
            Body: `Your EaseHealth OTP is: ${otp}. This OTP is valid for 10 minutes. Do not share it with anyone.`
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to send SMS');
        }
        
        console.log('✅ OTP sent via SMS successfully via Twilio');
        return { success: true };
        */

        // Option 2: Use Supabase Edge Functions (recommended for this project)
        // This is better integrated with your existing Supabase setup:
        /*
        const { data, error } = await supabase.functions.invoke('send-otp-sms', {
          body: {
            phone: formattedPhone,
            otp: otp,
            message: `Your EaseHealth OTP is: ${otp}. This OTP is valid for 10 minutes.`
          }
        });
        
        if (error) {
          throw new Error(error.message);
        }
        
        console.log('✅ OTP sent via SMS successfully via Supabase');
        return { success: true };
        */

        // Option 3: Use TextLocal (Indian SMS service)
        // Good for Indian phone numbers:
        /*
        const apiKey = process.env.REACT_APP_TEXTLOCAL_API_KEY;
        const sender = process.env.REACT_APP_TEXTLOCAL_SENDER || 'TXTLCL';
        
        if (!apiKey) {
          throw new Error('TextLocal API key not configured');
        }
        
        const response = await fetch('https://api.textlocal.in/send/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            apikey: apiKey,
            numbers: formattedPhone,
            message: `Your EaseHealth OTP is: ${otp}. This OTP is valid for 10 minutes.`,
            sender: sender
          })
        });
        
        const result = await response.json();
        if (result.status !== 'success') {
          throw new Error(result.errors?.[0]?.message || 'Failed to send SMS');
        }
        
        console.log('✅ OTP sent via SMS successfully via TextLocal');
        return { success: true };
        */

        // TEMPORARY: Demo mode - remove this when implementing real SMS
        console.log('⚠️ DEMO MODE: SMS not actually sent. Configure SMS service for production.');
        console.log(`📱 Would send OTP ${otp} to ${formattedPhone}`);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // For testing purposes, you can see the OTP in console
        console.log(`🔑 DEMO OTP for ${phone}: ${otp}`);

        return { success: true };

    } catch (error) {
        console.error('❌ Error sending OTP via SMS:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to send OTP via SMS' };
    }
};

// Update user password in Supabase
export const updateUserPassword = async (email: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
        console.log('🔐 Updating user password:', { email });

        // SECURITY CHECK: Validate if email belongs to a registered user
        const validation = await validateUserExists(email, undefined);
        if (!validation.exists) {
            console.log('❌ Email not registered in system:', email);
            return { success: false, error: 'This email is not registered in our system' };
        }

        // Additional security: Check if OTP was verified for this email
        const storedOTP = getStoredOTP();
        if (!storedOTP || !storedOTP.verified) {
            console.log('❌ OTP not verified or expired');
            return { success: false, error: 'OTP verification required' };
        }

        // Verify the email matches the one used for OTP
        if (storedOTP.email && storedOTP.email !== email) {
            console.log('❌ Email mismatch with OTP verification');
            return { success: false, error: 'Email mismatch with OTP verification' };
        }

        // In production, you would typically:
        // 1. Verify the user exists
        // 2. Update the password through Supabase Auth Admin API
        // 3. Or use Supabase's built-in password reset flow

        // For demo purposes, we'll simulate a successful update
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('✅ Password updated successfully');
        return { success: true };
    } catch (error) {
        console.error('❌ Error updating password:', error);
        return { success: false, error: 'Failed to update password' };
    }
};

// Update user password using phone number (alternative to email)
export const updateUserPasswordByPhone = async (phone: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
        console.log('🔐 Updating user password by phone:', { phone });

        // SECURITY CHECK: Validate if phone belongs to a registered user
        const validation = await validateUserExists(undefined, phone);
        if (!validation.exists) {
            console.log('❌ Phone not registered in system:', phone);
            return { success: false, error: 'This phone number is not registered in our system' };
        }

        // Additional security: Check if OTP was verified for this phone
        const storedOTP = getStoredOTP();
        if (!storedOTP || !storedOTP.verified) {
            console.log('❌ OTP not verified or expired');
            return { success: false, error: 'OTP verification required' };
        }

        // Verify the phone matches the one used for OTP
        const normalizedPhone = phone.replace(/\D/g, '').replace(/^91/, '');
        const storedPhone = storedOTP.phone?.replace(/\D/g, '').replace(/^91/, '');
        if (storedPhone && storedPhone !== normalizedPhone) {
            console.log('❌ Phone mismatch with OTP verification');
            return { success: false, error: 'Phone mismatch with OTP verification' };
        }

        // In production, you would typically:
        // 1. Get user_id from phone validation
        // 2. Update the password through Supabase Auth Admin API
        // 3. Or use Supabase's built-in password reset flow

        // For demo purposes, we'll simulate a successful update
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('✅ Password updated successfully');
        return { success: true };
    } catch (error) {
        console.error('❌ Error updating password:', error);
        return { success: false, error: 'Failed to update password' };
    }
};

// Format phone number for display
export const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');

    // Format as +91 XXXXXXXXXX
    if (cleaned.length === 10) {
        return `+91 ${cleaned}`;
    }

    return phone;
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Validate phone number format (Indian mobile numbers)
export const isValidPhoneNumber = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 10 && /^[6-9]/.test(cleaned);
};

