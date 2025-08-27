// src/components/EmailVerification.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Mail, CheckCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import api from '../services/api';

const EmailVerification = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState('verifying'); // verifying, success, error, expired
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const email = location.state?.email || '';

  useEffect(() => {
    if (token) {
      verifyEmailToken();
    }
  }, [token]);

  const verifyEmailToken = async () => {
    try {
      setLoading(true);
      const response = await api.post('/api/auth/verify-email/', {
        token: token
      });

      if (response.data.success) {
        setStatus('success');
        setMessage(response.data.message);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/auth', { 
            state: { 
              message: 'Email verified successfully! You can now log in.',
              showLogin: true 
            }
          });
        }, 3000);
      } else {
        setStatus('error');
        setMessage(response.data.message);
        setCanResend(true);
      }
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.message || 'Failed to verify email. Please try again.');
      setCanResend(true);
    } finally {
      setLoading(false);
    }
  };

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
        setMessage('Verification email has been sent to your email address.');
        setCanResend(false);
        // Enable resend after 5 minutes
        setTimeout(() => setCanResend(true), 5 * 60 * 1000);
      } else {
        setMessage(response.data.message);
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to resend verification email.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'verifying':
        return <RefreshCw className={`w-16 h-16 text-blue-500 ${loading ? 'animate-spin' : ''}`} />;
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'error':
      case 'expired':
        return <AlertCircle className="w-16 h-16 text-red-500" />;
      default:
        return <Mail className="w-16 h-16 text-gray-400" />;
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'verifying':
        return 'Verifying Your Email...';
      case 'success':
        return 'Email Verified Successfully!';
      case 'error':
        return 'Verification Failed';
      case 'expired':
        return 'Verification Link Expired';
      default:
        return 'Email Verification';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'error':
      case 'expired':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Status Icon */}
        <div className="flex justify-center mb-6">
          {getStatusIcon()}
        </div>

        {/* Status Title */}
        <h1 className={`text-2xl font-bold mb-4 ${getStatusColor()}`}>
          {getStatusTitle()}
        </h1>

        {/* Status Message */}
        <p className="text-gray-600 mb-6 leading-relaxed">
          {message || 'Please wait while we verify your email address...'}
        </p>

        {/* Actions */}
        <div className="space-y-4">
          {status === 'success' && (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-green-800 text-sm">
                  Redirecting you to login page in a few seconds...
                </p>
              </div>
              <button
                onClick={() => navigate('/auth', { state: { showLogin: true } })}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Go to Login
              </button>
            </>
          )}

          {(status === 'error' || status === 'expired') && canResend && (
            <>
              <button
                onClick={resendVerification}
                disabled={loading || !email}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>Resend Verification Email</span>
                  </>
                )}
              </button>
              
              {!email && (
                <p className="text-sm text-yellow-600">
                  Please go back to the signup page to resend verification email.
                </p>
              )}
            </>
          )}

          <button
            onClick={() => navigate('/auth')}
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Back to Sign In
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Having trouble? Contact our support team for assistance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;