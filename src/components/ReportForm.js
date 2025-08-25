import React, { useState } from 'react';
import { X, Flag, AlertTriangle } from 'lucide-react';

const ReportForm = ({ isOpen, onClose, reportType, targetId, targetUser, targetPost, onSubmit }) => {
  const [reportReason, setReportReason] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [evidenceUrls, setEvidenceUrls] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debug logging
  React.useEffect(() => {
    console.log('ReportForm props:', { isOpen, reportType, targetId, targetUser, targetPost });
  }, [isOpen, reportType, targetId, targetUser, targetPost]);

  const getUserReportTypes = () => [
    { value: 'harassment', label: 'Harassment or Bullying', description: 'Targeted harassment, bullying, or intimidation' },
    { value: 'hate_speech', label: 'Hate Speech', description: 'Content that attacks or discriminates based on identity' },
    { value: 'spam', label: 'Spam', description: 'Unwanted repetitive content or promotional material' },
    { value: 'inappropriate_content', label: 'Inappropriate Content', description: 'Content that violates community guidelines' },
    { value: 'misinformation', label: 'Misinformation', description: 'False or misleading information' },
    { value: 'scam', label: 'Scam or Fraud', description: 'Fraudulent or deceptive content' },
    { value: 'impersonation', label: 'Impersonation', description: 'Pretending to be someone else' },
    { value: 'other', label: 'Other', description: 'Other violation not listed above' }
  ];

  const getPostReportTypes = () => [
    { value: 'spam', label: 'Spam or Unwanted Content', description: 'Repetitive, promotional, or unwanted content' },
    { value: 'harassment', label: 'Harassment or Bullying', description: 'Content that harasses or bullies users' },
    { value: 'inappropriate_content', label: 'Inappropriate Content', description: 'Content not suitable for the platform' },
    { value: 'misinformation', label: 'Misinformation', description: 'False or misleading information' },
    { value: 'hate_speech', label: 'Hate Speech', description: 'Content promoting hatred or discrimination' },
    { value: 'violence', label: 'Violence or Harmful Content', description: 'Content promoting violence or harm' },
    { value: 'nudity', label: 'Nudity or Sexual Content', description: 'Inappropriate sexual content' },
    { value: 'intellectual_property', label: 'Copyright Violation', description: 'Unauthorized use of copyrighted content' },
    { value: 'privacy_violation', label: 'Privacy Violation', description: 'Sharing private information without consent' },
    { value: 'scam', label: 'Scam or Fraud', description: 'Fraudulent or deceptive content' },
    { value: 'off_topic', label: 'Off-topic', description: 'Content not relevant to the platform' },
    { value: 'duplicate', label: 'Duplicate Content', description: 'Content that has been posted before' },
    { value: 'other', label: 'Other', description: 'Other violation not listed above' }
  ];

  const reportTypes = reportType === 'post' ? getPostReportTypes() : getUserReportTypes();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('Submit form attempt:', {
      selectedType,
      reportReason: reportReason.trim(),
      reasonLength: reportReason.trim().length,
      reportType,
      targetPost: targetPost?.id,
      targetUser: targetUser?.id
    });
    
    if (!selectedType || !reportReason.trim()) {
      alert('Please select a report type and provide a reason.');
      return;
    }

    if (reportReason.trim().length < 10) {
      alert('Please provide a more detailed reason (at least 10 characters).');
      return;
    }

    setIsSubmitting(true);
    
    try {
      let reportData;
      
      if (reportType === 'post') {
        reportData = {
          post: targetPost.id,
          report_type: selectedType,
          reason: reportReason.trim(),
          additional_context: evidenceUrls.trim() || ''
        };
      } else {
        reportData = {
          reported_user: targetUser.id,
          report_type: selectedType,
          reason: reportReason.trim(),
          evidence_urls: evidenceUrls.split('\n').filter(url => url.trim()).map(url => url.trim())
        };
      }

      console.log('Submitting report data:', reportData);
      await onSubmit(reportData);
      
      // Reset form
      setSelectedType('');
      setReportReason('');
      setEvidenceUrls('');
      onClose();
      
      alert('Report submitted successfully. Our team will review it shortly.');
    } catch (error) {
      console.error('=== UPDATED ERROR HANDLER TRIGGERED ===');
      console.error('Error submitting report:', error);
      console.error('Error details:', error.response?.data);
      
      // Handle different types of error responses
      let errorMessage = 'Failed to submit report. Please try again.';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        console.log('Full error data structure:', JSON.stringify(errorData, null, 2));
        
        // Handle non_field_errors (like duplicate reports)
        if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
          console.log('Non-field errors found:', errorData.non_field_errors);
          errorMessage = errorData.non_field_errors[0];
        }
        // Handle field-specific errors
        else if (errorData.reason && Array.isArray(errorData.reason)) {
          console.log('Reason errors found:', errorData.reason);
          errorMessage = errorData.reason[0];
        }
        else if (errorData.post && Array.isArray(errorData.post)) {
          console.log('Post errors found:', errorData.post);
          errorMessage = errorData.post[0];
        }
        else if (errorData.reported_user && Array.isArray(errorData.reported_user)) {
          console.log('Reported user errors found:', errorData.reported_user);
          errorMessage = errorData.reported_user[0];
        }
        // Handle generic error messages
        else if (errorData.detail) {
          console.log('Detail error found:', errorData.detail);
          errorMessage = errorData.detail;
        }
        else if (errorData.message) {
          console.log('Message error found:', errorData.message);
          errorMessage = errorData.message;
        }
        
        console.log('Final error message to show:', errorMessage);
      }
      
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedType('');
      setReportReason('');
      setEvidenceUrls('');
      onClose();
    }
  };

  if (!isOpen) {
    console.log('ReportForm not rendering - isOpen is false');
    return null;
  }

  console.log('ReportForm rendering modal...');
  console.log('Report types available:', reportTypes.length);
  console.log('Current form state:', { selectedType, reportReason, evidenceUrls });

  return (
    <div className="fixed inset-0 bg-red-500 bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Flag className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              Report {reportType === 'post' ? 'Post' : 'User'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Target Info */}
          {(targetUser || targetPost) && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Reporting:</p>
              {reportType === 'post' && targetPost ? (
                <div>
                  <p className="font-medium text-gray-900">
                    Post by {targetPost.author?.display_name || targetPost.author?.username}
                  </p>
                  {targetPost.title && (
                    <p className="text-sm text-gray-600 mt-1">"{targetPost.title}"</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Posted {new Date(targetPost.created_at).toLocaleDateString()}
                  </p>
                </div>
              ) : targetUser && (
                <div>
                  <p className="font-medium text-gray-900">
                    {targetUser.display_name || targetUser.username}
                  </p>
                  {targetUser.username && targetUser.display_name && (
                    <p className="text-sm text-gray-500">@{targetUser.username}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              What type of violation is this? *
            </label>
            <div className="space-y-2">
              {reportTypes.map((type) => (
                <label key={type.value} className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    value={type.value}
                    checked={selectedType === type.value}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="mt-1 text-red-600 focus:ring-red-500"
                    disabled={isSubmitting}
                  />
                  <div>
                    <div className="font-medium text-gray-900">{type.label}</div>
                    <div className="text-sm text-gray-500">{type.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
              Please provide details about this violation *
            </label>
            <textarea
              id="reason"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder={reportType === 'post' 
                ? "Describe why this post violates our community guidelines..."
                : "Describe the issue in detail. What happened? When did it occur?"
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows={4}
              disabled={isSubmitting}
              required
              minLength={10}
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum 10 characters ({reportReason.length}/10)
            </p>
          </div>

          {/* Evidence URLs / Additional Context */}
          <div>
            <label htmlFor="evidence" className="block text-sm font-medium text-gray-700 mb-2">
              {reportType === 'post' ? 'Additional Context (optional)' : 'Evidence URLs (optional)'}
            </label>
            <textarea
              id="evidence"
              value={evidenceUrls}
              onChange={(e) => setEvidenceUrls(e.target.value)}
              placeholder={reportType === 'post'
                ? "Any additional context that might help our review team..."
                : "Add URLs to screenshots or other evidence (one per line)"
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows={3}
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              {reportType === 'post'
                ? "Additional information that might help with the review"
                : "Links to screenshots, archived content, or other supporting evidence"
              }
            </p>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Important:</p>
                <ul className="space-y-1 text-xs">
                  <li>• False reports may result in action against your account</li>
                  <li>• Reports are reviewed by our moderation team</li>
                  <li>• You will receive updates on the status of your report</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedType || reportReason.trim().length < 10}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportForm;