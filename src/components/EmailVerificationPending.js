// src/components/EmailVerificationPending.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Clock, RefreshCw, CheckCircle, ArrowLeft } from 'lucide-react';
import api from '../services/api';

const EmailVerificationPending = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [canResend, setCanResend] = useState(true);
  const [countdown, setCountdown] = useState(0);
  
  // Get email from location state or props
  const email = location.state?.email || '';
  const userName = location.state?.userName || '';

  useEffect(() => {
    // Start countdown if resend is disabled
    if (!canResend && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !canResend) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  const resendVerification = async () => {
    if (!email) {
      setMessage('Email address is required to resend verification.');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/api/auth/send-verification/', {
        email: email
      });

      if (response.data.success) {
        setMessage('Verification email has been sent! Please check your inbox and spam folder.');
        setCanResend(false);
        setCountdown(300); // 5 minutes cooldown
      } else {
        setMessage(response.data.message || 'Failed to send verification email.');
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to send verification email. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
              <Mail className="w-10 h-10 text-blue-600" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Check Your Email
          </h1>
          
          <p className="text-gray-600">
            {userName && `Hi ${userName}! `}
            We've sent a verification email to:
          </p>
          
          <div className="bg-gray-50 rounded-lg p-3 mt-3 mb-4">
            <p className="font-medium text-gray-900">{email}</p>
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-4 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Next Steps:
            </h3>
            <ol className="text-blue-800 text-sm space-y-1 ml-6">
              <li>1. Check your email inbox</li>
              <li>2. Look for an email from StartLinker</li>
              <li>3. Click the verification link</li>
              <li>4. Return here to continue</li>
            </ol>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">
              <strong>Can't find the email?</strong> Check your spam/junk folder. 
              Verification emails sometimes end up there.
            </p>
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-700">{message}</p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-4">
          {/* Resend Button */}
          <button
            onClick={resendVerification}
            disabled={loading || !canResend || !email}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Sending...</span>
              </>
            ) : !canResend ? (
              <>
                <Clock className="w-4 h-4" />
                <span>Resend in {formatTime(countdown)}</span>
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                <span>Resend Verification Email</span>
              </>
            )}
          </button>

          {/* Continue Button */}
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center space-x-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>I've Verified My Email - Continue</span>
          </button>

          {/* Back to Auth */}
          <button
            onClick={() => navigate('/auth')}
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Sign In</span>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500">
            Wrong email address?{' '}
            <button 
              onClick={() => navigate('/auth')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Sign up again
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPending;