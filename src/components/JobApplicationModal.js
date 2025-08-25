// src/components/JobApplicationModal.js - Enhanced with better file handling and validation
import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, User, Mail, Phone, MapPin, Briefcase, AlertCircle, CheckCircle } from 'lucide-react';
import { useNotifications } from './NotificationSystem';
import ResumeSelector from './ResumeSelector';
import axios from '../config/axios';

const JobApplicationModal = ({ 
  isOpen, 
  onClose, 
  job, 
  onApplicationSubmitted 
}) => {
  const { success, error, jobApplicationSuccess } = useNotifications();
  const [formData, setFormData] = useState({
    coverLetter: '',
    selectedResumeId: null,
    additionalInfo: {
      phone: '',
      portfolio: '',
      linkedinUrl: '',
      availability: '',
      salaryExpectation: '',
      experience: '',
      whyInterested: '',
      skills: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFormData({
        coverLetter: '',
        selectedResumeId: null,
        additionalInfo: {
          phone: '',
          portfolio: '',
          linkedinUrl: '',
          availability: '',
          salaryExpectation: '',
          experience: '',
          whyInterested: '',
          skills: ''
        }
      });
      setErrors({});
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };


  const validateForm = () => {
    const newErrors = {};

    console.log('Validating form data:', formData);

    if (!formData.coverLetter.trim()) {
      newErrors.coverLetter = 'Cover letter is required';
    } else if (formData.coverLetter.length < 100) {
      newErrors.coverLetter = 'Cover letter must be at least 100 characters';
    } else if (formData.coverLetter.length > 2000) {
      newErrors.coverLetter = 'Cover letter must be less than 2000 characters';
    }

    // Make resume selection optional - users can apply without uploading a resume
    // if (!formData.selectedResumeId) {
    //   newErrors.selectedResumeId = 'Please select a resume';
    // }

    // Validate additional info
    if (formData.additionalInfo.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.additionalInfo.phone)) {
      newErrors['additionalInfo.phone'] = 'Please enter a valid phone number';
    }

    if (formData.additionalInfo.linkedinUrl && 
        formData.additionalInfo.linkedinUrl && 
        !formData.additionalInfo.linkedinUrl.includes('linkedin.com')) {
      newErrors['additionalInfo.linkedinUrl'] = 'Please enter a valid LinkedIn URL';
    }

    if (formData.additionalInfo.portfolio && 
        formData.additionalInfo.portfolio &&
        !/^https?:\/\/.+/.test(formData.additionalInfo.portfolio)) {
      newErrors['additionalInfo.portfolio'] = 'Please enter a valid URL';
    }

    console.log('Validation errors:', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('Submit button clicked, validating form...');
    if (!validateForm()) {
      console.log('Validation failed, not submitting');
      return;
    }

    console.log('Validation passed, submitting application...');
    setLoading(true);
    
    try {
      // Create submission data
      const submitData = {
        cover_letter: formData.coverLetter,
        selected_resume_id: formData.selectedResumeId,
        additional_info: formData.additionalInfo
      };

      console.log('Submitting data:', submitData);

      const response = await axios.post(
        `/jobs/${job.id}/apply/`, 
        submitData
      );

      console.log('Application submitted successfully:', response.data);
      jobApplicationSuccess(job.title, job.startup?.name || 'this company');
      onApplicationSubmitted && onApplicationSubmitted(response.data);
      onClose();
      
    } catch (err) {
      console.error('Error submitting application:', err);
      if (err.response?.status === 400 && err.response?.data?.error) {
        error(err.response.data.error);
      } else if (err.response?.status === 401) {
        error('Please log in to apply for jobs.');
      } else {
        error('Failed to submit application. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !job) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-start justify-center pt-8 pb-20">
      <div className="relative w-full max-w-4xl mx-4 my-8">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-40"
          onClick={onClose}
        />

        {/* Modal */}
        <div 
          className="relative bg-white rounded-lg shadow-2xl transform transition-all z-50 max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-xl leading-6 font-bold text-white truncate">
                  Apply for {job.title}
                </h3>
                <p className="mt-1 text-blue-100 text-sm">
                  at {job.startup_name} • {job.location}
                  {job.is_remote && <span className="ml-2 px-2 py-1 bg-white/20 rounded-full text-xs">Remote</span>}
                </p>
              </div>
              <button
                onClick={onClose}
                className="ml-4 text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full"
                type="button"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Form Container */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 160px)' }}>
            <form onSubmit={handleSubmit} className="px-6 py-6">
              <div className="space-y-6">
              
              {/* Job Requirements Preview */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Position Overview</h4>
                <p className="text-sm text-blue-800 mb-2">{job.description}</p>
                <div className="flex flex-wrap gap-2">
                  {job.skills_list && job.skills_list.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Cover Letter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Letter *
                </label>
                <textarea
                  value={formData.coverLetter}
                  onChange={(e) => handleInputChange('coverLetter', e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  style={{ color: '#1f2937', backgroundColor: '#ffffff' }}
                  placeholder="Dear Hiring Manager,

I am writing to express my strong interest in the [Position Title] role at [Company Name]. With my background in [relevant experience/skills], I am excited about the opportunity to contribute to your team.

In my previous role at [Previous Company], I [specific achievement or responsibility that relates to this job]. I am particularly drawn to this position because [why you're interested in this specific role/company].

I would welcome the opportunity to discuss how my skills and experience can contribute to [Company Name]'s continued success.

Best regards,
[Your Name]"
                />
                {errors.coverLetter && (
                  <div className="mt-1 flex items-center text-sm text-red-600">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.coverLetter}
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {formData.coverLetter.length}/2000 characters • Minimum 100 characters required
                </p>
              </div>

              {/* Resume Selection */}
              <div>
                <ResumeSelector
                  selectedResumeId={formData.selectedResumeId}
                  onResumeSelect={(resumeId) => setFormData(prev => ({ ...prev, selectedResumeId: resumeId }))}
                  allowUpload={true}
                  onNewResumeUpload={(resume) => {
                    setFormData(prev => ({ ...prev, selectedResumeId: resume.id }));
                  }}
                />
                {errors.selectedResumeId && (
                  <div className="mt-1 flex items-center text-sm text-red-600">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.selectedResumeId}
                  </div>
                )}
              </div>

              {/* Additional Information */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.additionalInfo.phone}
                      onChange={(e) => handleInputChange('additionalInfo.phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ color: '#1f2937', backgroundColor: '#ffffff' }}
                      placeholder="+1 (555) 123-4567"
                    />
                    {errors['additionalInfo.phone'] && (
                      <p className="mt-1 text-xs text-red-600">{errors['additionalInfo.phone']}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      <User className="w-4 h-4 inline mr-1" />
                      LinkedIn Profile
                    </label>
                    <input
                      type="url"
                      value={formData.additionalInfo.linkedinUrl}
                      onChange={(e) => handleInputChange('additionalInfo.linkedinUrl', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ color: '#1f2937', backgroundColor: '#ffffff' }}
                      placeholder="https://linkedin.com/in/yourname"
                    />
                    {errors['additionalInfo.linkedinUrl'] && (
                      <p className="mt-1 text-xs text-red-600">{errors['additionalInfo.linkedinUrl']}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Portfolio/Website
                    </label>
                    <input
                      type="url"
                      value={formData.additionalInfo.portfolio}
                      onChange={(e) => handleInputChange('additionalInfo.portfolio', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ color: '#1f2937', backgroundColor: '#ffffff' }}
                      placeholder="https://yourportfolio.com"
                    />
                    {errors['additionalInfo.portfolio'] && (
                      <p className="mt-1 text-xs text-red-600">{errors['additionalInfo.portfolio']}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Availability
                    </label>
                    <select
                      value={formData.additionalInfo.availability}
                      onChange={(e) => handleInputChange('additionalInfo.availability', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ color: '#1f2937', backgroundColor: '#ffffff' }}
                    >
                      <option value="">Select availability</option>
                      <option value="immediately">Immediately</option>
                      <option value="2weeks">2 weeks notice</option>
                      <option value="1month">1 month notice</option>
                      <option value="2months">2+ months</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">
                      Salary Expectation
                    </label>
                    <input
                      type="text"
                      value={formData.additionalInfo.salaryExpectation}
                      onChange={(e) => handleInputChange('additionalInfo.salaryExpectation', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ color: '#1f2937', backgroundColor: '#ffffff' }}
                      placeholder="e.g., $80,000 - $100,000 or Negotiable"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">
                      Relevant Experience & Skills
                    </label>
                    <textarea
                      value={formData.additionalInfo.experience}
                      onChange={(e) => handleInputChange('additionalInfo.experience', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ color: '#1f2937', backgroundColor: '#ffffff' }}
                      placeholder="Briefly describe your relevant experience and key skills for this role..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Why are you interested in this position?
                    </label>
                    <textarea
                      value={formData.additionalInfo.whyInterested}
                      onChange={(e) => handleInputChange('additionalInfo.whyInterested', e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical min-h-[100px]"
                      style={{ color: '#1f2937', backgroundColor: '#ffffff' }}
                      placeholder="What excites you about this role and company? Share your motivation and what draws you to this opportunity..."
                    />
                  </div>
                </div>
              </div>
                
              {/* Loading indicator */}
              {loading && (
                <div className="mt-4">
                  <div className="flex items-center justify-center text-sm text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    <span>Submitting application...</span>
                  </div>
                </div>
              )}
              </div>
            </form>
          </div>

          {/* Footer - Sticky at bottom */}
          <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-t sticky bottom-0">
            <div className="flex items-center text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              Your application will be sent directly to the hiring team
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !formData.coverLetter.trim()}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center transition-all"
              >
                {loading && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobApplicationModal;