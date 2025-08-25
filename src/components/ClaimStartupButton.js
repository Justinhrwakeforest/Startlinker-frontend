// src/components/ClaimStartupButton.js - Fixed React Hooks Rules
import React, { useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Shield, Building, Mail, User, MessageSquare, X, CheckCircle, AlertCircle, Clock, ExternalLink } from 'lucide-react';
import api from '../services/api';

const ClaimStartupButton = ({ startup, userClaimRequest, onClaimUpdate }) => {
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    position: '',
    reason: ''
  });

  console.log('🔍 ClaimStartupButton props:', { 
    startup: {
      id: startup?.id,
      name: startup?.name,
      is_claimed: startup?.is_claimed,
      claim_verified: startup?.claim_verified,
      can_claim: startup?.can_claim,
      claimed_by_username: startup?.claimed_by_username
    }, 
    userClaimRequest 
  });

  // MOVED ALL HOOKS TO TOP LEVEL - BEFORE ANY EARLY RETURNS
  const statusConfig = useMemo(() => ({
    pending: {
      color: 'text-orange-600 bg-orange-50 border-orange-200',
      icon: userClaimRequest?.email_verified ? Clock : Mail,
      text: userClaimRequest?.email_verified ? 'Pending Admin Review' : 'Email Verification Required',
      description: userClaimRequest?.email_verified 
        ? 'Your claim is being reviewed by our team' 
        : 'Please check your email to verify your company address'
    },
    approved: {
      color: 'text-green-600 bg-green-50 border-green-200',
      icon: CheckCircle,
      text: 'Claim Approved',
      description: 'You can now edit this startup profile'
    },
    rejected: {
      color: 'text-red-600 bg-red-50 border-red-200',
      icon: X,
      text: 'Claim Rejected',
      description: 'Your claim request was not approved'
    },
    expired: {
      color: 'text-gray-600 bg-gray-50 border-gray-200',
      icon: AlertCircle,
      text: 'Verification Expired',
      description: 'The verification link has expired'
    }
  }), [userClaimRequest]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  }, [error]);

  const validateForm = useCallback(() => {
    const errors = {};
    
    if (!formData.email.trim()) {
      errors.email = 'Work email is required';
    } else if (!formData.email.includes('@')) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.position.trim()) {
      errors.position = 'Position is required';
    } else if (formData.position.length < 2) {
      errors.position = 'Position must be at least 2 characters';
    }
    
    if (!formData.reason.trim()) {
      errors.reason = 'Reason is required';
    } else if (formData.reason.length < 10) {
      errors.reason = 'Please provide a more detailed reason (at least 10 characters)';
    }

    return errors;
  }, [formData]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    console.log('🚀 Submitting claim request with data:', formData);
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      console.log('❌ Validation errors:', validationErrors);
      setError(validationErrors);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      console.log('📤 Making API request to claim startup:', startup.id);
      const response = await api.startups.claim(startup.id, formData);
      
      console.log('✅ Claim request submitted successfully:', response.data);
      
      setSuccess(true);
      setTimeout(() => {
        setShowModal(false);
        setSuccess(false);
        if (onClaimUpdate) {
          onClaimUpdate(response.data);
        }
        // Reset form
        setFormData({ email: '', position: '', reason: '' });
      }, 3000);
      
    } catch (error) {
      console.error('❌ Error submitting claim request:', error);
      console.error('❌ Error response data:', JSON.stringify(error.response?.data, null, 2));
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error headers:', error.response?.headers);
      console.error('❌ Request data:', JSON.stringify(formData, null, 2));
      
      if (error.response?.data) {
        // Handle specific validation errors from backend
        if (typeof error.response.data === 'object' && !error.response.data.message && !error.response.data.error) {
          // Field validation errors
          setError(error.response.data);
        } else {
          // General error message
          const errorMessage = error.response.data.message || 
                              error.response.data.error || 
                              JSON.stringify(error.response.data) ||
                              'Failed to submit claim request. Please try again.';
          setError({ general: errorMessage });
        }
      } else {
        setError({ general: 'Failed to submit claim request. Please try again.' });
      }
    } finally {
      setSubmitting(false);
    }
  }, [formData, validateForm, startup.id, onClaimUpdate]);

  const handleClose = useCallback(() => {
    if (!submitting) {
      setShowModal(false);
      setError(null);
      setSuccess(false);
      setFormData({ email: '', position: '', reason: '' });
    }
  }, [submitting]);

  const getCompanyDomain = useCallback(() => {
    if (startup.website) {
      try {
        const url = new URL(startup.website.startsWith('http') ? startup.website : `https://${startup.website}`);
        return url.hostname.replace('www.', '');
      } catch {
        return startup.website.replace(/^https?:\/\//, '').replace('www.', '').split('/')[0];
      }
    }
    return null;
  }, [startup.website]);

  const companyDomain = useMemo(() => getCompanyDomain(), [getCompanyDomain]);

  // NOW ALL CONDITIONAL LOGIC COMES AFTER HOOKS
  // Don't show claim button if startup is already claimed and verified
  if (startup.is_claimed && startup.claim_verified) {
    return (
      <div className="flex items-center text-green-600 text-sm font-medium bg-green-50 px-3 py-2 rounded-lg border border-green-200">
        <CheckCircle className="w-4 h-4 mr-2" />
        <span>Claimed by {startup.claimed_by_username}</span>
      </div>
    );
  }

  // Show status if user has already submitted a claim
  if (userClaimRequest) {
    const config = statusConfig[userClaimRequest.status] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <div className={`inline-flex items-center px-4 py-2.5 rounded-lg border text-sm font-medium ${config.color}`}>
        <IconComponent className="w-4 h-4 mr-2" />
        <div className="flex flex-col">
          <span>{config.text}</span>
          {config.description && (
            <span className="text-xs opacity-80 mt-0.5">{config.description}</span>
          )}
        </div>
      </div>
    );
  }

  // Don't show if user can't claim
  if (!startup.can_claim) {
    console.log('🚫 ClaimStartupButton: Not showing because can_claim is false');
    // Temporary fallback: show button if startup exists and isn't already claimed
    if (startup && !(startup.is_claimed && startup.claim_verified)) {
      console.log('🔧 ClaimStartupButton: Showing fallback button for testing');
      // Continue to render the button as fallback
    } else {
      return null;
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center px-4 py-2.5 border-2 border-blue-400 text-blue-700 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl hover:from-blue-100 hover:to-blue-200 hover:border-blue-500 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm"
      >
        <Shield className="w-4 h-4 mr-2" />
        <span className="hidden sm:inline">Claim This Company</span>
        <span className="sm:hidden">Claim</span>
      </button>

      {/* Enhanced Claim Modal */}
      {showModal && createPortal(
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 pt-12 overflow-y-auto" 
          style={{ 
            zIndex: 999999,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
        >
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-lg w-full my-8 flex flex-col max-h-[calc(100vh-6rem)]">
            {success ? (
              // Enhanced Success State
              <div className="p-8 text-center">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Claim Request Submitted!</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  We've sent a verification email to <strong>{formData.email}</strong>. 
                  Please check your inbox and click the verification link to continue.
                </p>
                <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 border border-blue-200">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Mail className="w-5 h-5 mr-2 text-blue-600" />
                    Next Steps
                  </h4>
                  <ol className="text-sm text-gray-700 space-y-2">
                    <li className="flex items-start">
                      <span className="inline-block w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs flex items-center justify-center mt-0.5 mr-3 flex-shrink-0 font-medium">1</span>
                      <span>Check your email inbox (and spam folder)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="inline-block w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs flex items-center justify-center mt-0.5 mr-3 flex-shrink-0 font-medium">2</span>
                      <span>Click the verification link within 24 hours</span>
                    </li>
                    <li className="flex items-start">
                      <span className="inline-block w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs flex items-center justify-center mt-0.5 mr-3 flex-shrink-0 font-medium">3</span>
                      <span>Wait for admin approval (usually 1-3 business days)</span>
                    </li>
                  </ol>
                </div>
              </div>
            ) : (
              // Enhanced Form State
              <>
                {/* Fixed Header */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 flex-shrink-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Building className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Claim {startup.name}</h3>
                      <p className="text-sm text-gray-600">Verify company ownership</p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    disabled={submitting}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                  <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
                  {/* General Error */}
                  {error?.general && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <div className="flex items-start">
                        <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-red-900 mb-1">Error</h4>
                          <p className="text-red-700 text-sm">{error.general}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Domain Info */}
                  {companyDomain && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                      <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                        <Shield className="w-4 h-4 mr-2" />
                        Email Domain Verification
                      </h4>
                      <p className="text-sm text-blue-800 leading-relaxed">
                        Please use a company email address ending with <strong>@{companyDomain}</strong> to verify your employment with {startup.name}.
                      </p>
                    </div>
                  )}

                  {/* Work Email */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Work Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 ${
                        error?.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder={companyDomain ? `your.name@${companyDomain}` : 'your.work.email@company.com'}
                      required
                      disabled={submitting}
                    />
                    {error?.email && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                        {error.email}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-gray-500">
                      Use your official company email address for verification
                    </p>
                  </div>

                  {/* Position */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <User className="w-4 h-4 inline mr-2" />
                      Your Position *
                    </label>
                    <input
                      type="text"
                      name="position"
                      value={formData.position}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 ${
                        error?.position ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="e.g., CEO, Marketing Manager, Software Engineer"
                      required
                      disabled={submitting}
                    />
                    {error?.position && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                        {error.position}
                      </p>
                    )}
                  </div>

                  {/* Reason */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <MessageSquare className="w-4 h-4 inline mr-2" />
                      Reason for Claiming *
                    </label>
                    <textarea
                      name="reason"
                      value={formData.reason}
                      onChange={handleInputChange}
                      rows={4}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors text-gray-900 ${
                        error?.reason ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Please explain why you're claiming this company profile and your role in the organization. Include details about your responsibilities and how you can verify your employment."
                      required
                      disabled={submitting}
                      maxLength={500}
                    />
                    {error?.reason && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                        {error.reason}
                      </p>
                    )}
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-gray-500">
                        Be specific and detailed to help with verification
                      </p>
                      <p className="text-xs text-gray-500">
                        {formData.reason.length}/500
                      </p>
                    </div>
                  </div>

                  {/* Enhanced Process Info */}
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <CheckCircle className="w-5 h-5 mr-2 text-blue-600" />
                      Verification Process
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm flex items-center justify-center font-semibold flex-shrink-0">1</div>
                        <div>
                          <p className="font-medium text-gray-900">Email Verification</p>
                          <p className="text-sm text-gray-600">We'll send a verification link to your work email</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm flex items-center justify-center font-semibold flex-shrink-0">2</div>
                        <div>
                          <p className="font-medium text-gray-900">Admin Review</p>
                          <p className="text-sm text-gray-600">Our team reviews your claim and supporting information</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm flex items-center justify-center font-semibold flex-shrink-0">3</div>
                        <div>
                          <p className="font-medium text-gray-900">Profile Access</p>
                          <p className="text-sm text-gray-600">Once approved, you can edit and manage the startup profile</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={submitting}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Shield className="w-5 h-5 mr-2" />
                          Submit Claim Request
                        </>
                      )}
                    </button>
                  </div>
                </form>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default ClaimStartupButton;