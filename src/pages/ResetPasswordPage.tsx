import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);

  useEffect(() => {
    // Check if we have a valid reset token in the URL
    const checkResetToken = async () => {
      try {
        console.log('🔍 Checking reset token from URL...');
        console.log('🔍 Full URL:', window.location.href);
        console.log('🔍 URL hash:', window.location.hash);
        console.log('🔍 URL search:', window.location.search);
        
        // Parse URL fragment parameters (Supabase puts tokens in hash)
        const fragmentParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);
        
        // Try to get tokens from hash first, then search params
        const tokenType = fragmentParams.get('type') || searchParams.get('type');
        const accessToken = fragmentParams.get('access_token') || searchParams.get('access_token');
        const refreshToken = fragmentParams.get('refresh_token') || searchParams.get('refresh_token');
        
        console.log('🔍 Token type:', tokenType);
        console.log('🔍 Access token exists:', !!accessToken);
        console.log('🔍 Refresh token exists:', !!refreshToken);
        
        // Check if we have valid recovery tokens in URL
        if (tokenType === 'recovery' && accessToken && refreshToken) {
          console.log('✅ Valid recovery tokens found in URL');
          setIsValidToken(true);
        } else {
          // If no tokens in URL, check if we have a valid session from password recovery
          console.log('🔍 No tokens in URL, checking for password recovery session...');
          
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          console.log('🔍 Current session:', { session: !!session, error: sessionError });
          
          if (session?.user) {
            console.log('✅ User has session from password recovery, allowing password reset');
            setIsValidToken(true);
          } else {
            console.log('❌ No valid recovery tokens or session found');
            setError('Invalid or expired reset link. Please request a new password reset.');
          }
        }
      } catch (err) {
        console.error('❌ Error checking reset token:', err);
        setError('Invalid or expired reset link. Please request a new password reset.');
      }
    };

    checkResetToken();
  }, []);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔄 Starting password reset process...');
      
      // Get the recovery token from URL (check both hash and search params)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const searchParams = new URLSearchParams(window.location.search);
      
      const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
      
      console.log('🔍 Recovery tokens:', { hasAccessToken: !!accessToken, hasRefreshToken: !!refreshToken });
      
      // Try to set session with recovery tokens if we have them
      if (accessToken && refreshToken) {
        console.log('🔐 Setting session with recovery tokens...');
        console.log('🔍 Access token length:', accessToken?.length);
        console.log('🔍 Refresh token length:', refreshToken?.length);
        
        try {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (sessionError) {
            console.error('❌ Session error:', sessionError);
            setError('Reset link has expired or is invalid. Please request a new password reset.');
            return;
          }

          console.log('✅ Session set successfully with recovery tokens');
          
        } catch (error) {
          console.error('❌ Failed to set session:', error);
          setError('Reset link has expired or is invalid. Please request a new password reset.');
          return;
        }
      } else {
        // If no tokens, check if we already have a valid session
        console.log('🔍 No tokens found, checking existing session...');
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session?.user) {
          console.error('❌ No valid session found:', sessionError);
          setError('Reset link has expired or is invalid. Please request a new password reset.');
          return;
        }
        
        console.log('✅ Using existing session for password reset');
      }

      console.log('🔄 Updating password...');

      // Now update the password
      const { error, data } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('❌ Password update error:', error);
        setError(error.message);
      } else {
        console.log('✅ Password updated successfully:', data);
        setSuccess(true);
        
        // Sign out the user to clear any session
        await supabase.auth.signOut();
        console.log('✅ User signed out after password reset');
        
        // Redirect to login page after 3 seconds
        // User will need to login with their new password
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    } catch (err) {
      console.error('❌ Unexpected error during password reset:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0075A2] to-[#0A2647] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Password Reset Successful!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your password has been updated successfully! You will be redirected to the login page where you can sign in with your new password.
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0075A2] border-t-transparent mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0075A2] to-[#0A2647] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Invalid Reset Link
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error || 'This password reset link is invalid or has expired.'}
            </p>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-gradient-to-r from-[#0075A2] to-[#0A2647] text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0075A2] to-[#0A2647] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Reset Password
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Enter your new password below
          </p>
        </div>

        <form onSubmit={handlePasswordReset} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* New Password Field */}
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0075A2] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                placeholder="Enter new password"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0075A2] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                placeholder="Confirm new password"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-[#0075A2] to-[#0A2647] text-white py-3 rounded-lg font-semibold text-lg hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>UPDATING...</span>
              </div>
            ) : (
              'UPDATE PASSWORD'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-[#0075A2] dark:text-[#0EA5E9] hover:underline transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
