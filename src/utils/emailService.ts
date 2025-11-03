// Email service utility for EaseHealth
// This handles sending verification emails and other email notifications

import { supabase } from './supabase';

export interface EmailTemplate {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

// Send verification email
export const sendVerificationEmail = async (email: string, token: string): Promise<boolean> => {
    try {
        const verificationUrl = `${window.location.origin}/verify-email?token=${token}&email=${email}`;

        const emailTemplate: EmailTemplate = {
            to: email,
            subject: 'Verify your EaseHealth account',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0075A2; font-size: 28px; margin: 0;">EaseHealth</h1>
            <p style="color: #666; font-size: 16px; margin: 10px 0 0 0;">Your Health, Our Priority</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
            <h2 style="color: #333; font-size: 24px; margin: 0 0 20px 0;">Welcome to EaseHealth!</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Thank you for creating your EaseHealth account. To complete your registration and start using our services, please verify your email address.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: #0075A2; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
              If the button doesn't work, you can also copy and paste this link into your browser:
            </p>
            <p style="color: #0075A2; font-size: 14px; word-break: break-all; margin: 10px 0 0 0;">
              ${verificationUrl}
            </p>
          </div>
          
          <div style="text-align: center; color: #999; font-size: 12px;">
            <p>This verification link will expire in 24 hours.</p>
            <p>If you didn't create an account with EaseHealth, please ignore this email.</p>
          </div>
        </div>
      `,
            text: `
        Welcome to EaseHealth!
        
        Thank you for creating your EaseHealth account. To complete your registration and start using our services, please verify your email address.
        
        Click this link to verify: ${verificationUrl}
        
        This verification link will expire in 24 hours.
        
        If you didn't create an account with EaseHealth, please ignore this email.
      `
        };

        // Use Supabase's built-in email service for reliable delivery
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: email,
            options: {
                emailRedirectTo: verificationUrl
            }
        });

        if (error) {
            console.error('Error sending verification email:', error);
            return false;
        }

        console.log('📧 Verification email sent to:', email);
        console.log('⏰ User has 5 minutes to verify their email');
        return true;

    } catch (error) {
        console.error('Error in sendVerificationEmail:', error);
        return false;
    }
};

// Send password reset email
export const sendPasswordResetEmail = async (email: string): Promise<boolean> => {
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`
        });

        if (error) {
            console.error('Error sending password reset email:', error);
            return false;
        }

        console.log('📧 Password reset email sent to:', email);
        return true;

    } catch (error) {
        console.error('Error in sendPasswordResetEmail:', error);
        return false;
    }
};

// Send welcome email after verification
export const sendWelcomeEmail = async (email: string, name: string): Promise<boolean> => {
    try {
        const emailTemplate: EmailTemplate = {
            to: email,
            subject: 'Welcome to EaseHealth - Your account is verified!',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0075A2; font-size: 28px; margin: 0;">EaseHealth</h1>
            <p style="color: #666; font-size: 16px; margin: 10px 0 0 0;">Your Health, Our Priority</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
            <h2 style="color: #333; font-size: 24px; margin: 0 0 20px 0;">Welcome, ${name}!</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Your EaseHealth account has been successfully verified! You can now access all our services.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${window.location.origin}/onboarding-choice" 
                 style="background: #0075A2; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; display: inline-block;">
                Get Started
              </a>
            </div>
          </div>
          
          <div style="text-align: center; color: #999; font-size: 12px;">
            <p>Thank you for choosing EaseHealth for your healthcare needs.</p>
          </div>
        </div>
      `
        };

        // For now, just log the email (in production, send via email service)
        console.log('📧 Welcome email would be sent to:', email);
        return true;

    } catch (error) {
        console.error('Error in sendWelcomeEmail:', error);
        return false;
    }
};
