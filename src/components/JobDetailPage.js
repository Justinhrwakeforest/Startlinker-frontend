// src/components/JobDetailPage.js - Enhanced with fully visible details
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  Building, MapPin, DollarSign, Clock, Users, Globe, Star, 
  ChevronLeft, Briefcase, CheckCircle, AlertCircle, Edit, 
  Trash2, Share2, Bookmark, Eye, Menu, X, ExternalLink, 
  Calendar, Mail, User, Award, Heart, TrendingUp
} from 'lucide-react';
import api from '../services/api';
import JobApplicationModal from './JobApplicationModal';

const JobDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applying, setApplying] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(false);

  useEffect(() => {
    fetchJobDetails();
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      const jobData = await api.jobs.get(id);
      setJob(jobData);
      setIsBookmarked(false);
    } catch (error) {
      console.error('Error fetching job:', error);
      setError('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/jobs/${id}/edit`);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this job posting? This action cannot be undone.')) {
      try {
        await api.jobs.delete(id);
        alert('Job deleted successfully');
        navigate('/jobs');
      } catch (error) {
        console.error('Error deleting job:', error);
        alert('Failed to delete job. Please try again.');
      }
    }
  };

  const handleBookmark = async () => {
    setIsBookmarked(!isBookmarked);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: job.title,
        text: `Check out this job at ${job.startup_name}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const canEditJob = () => {
    if (!user || !job) return false;
    
    // Check multiple ways the user could be the original poster
    const isOriginalPoster = 
      job.posted_by === user.id ||                    // posted_by as user ID
      job.posted_by?.id === user.id ||                // posted_by as user object
      job.posted_by_username === user.username;       // posted_by as username
    
    return job.can_edit || 
           user.is_staff || 
           user.is_superuser || 
           isOriginalPoster;
  };

  const canDeleteJob = () => {
    if (!user || !job) return false;
    return (job.posted_by_username === user.username) || user.is_staff || user.is_superuser;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Under Review' },
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Active' },
      rejected: { color: 'bg-red-100 text-red-800', icon: AlertCircle, text: 'Rejected' },
      draft: { color: 'bg-slate-100 text-slate-800', icon: Edit, text: 'Draft' },
      paused: { color: 'bg-blue-100 text-blue-800', icon: Clock, text: 'Paused' },
      closed: { color: 'bg-slate-100 text-slate-800', icon: X, text: 'Closed' }
    };

    const config = statusConfig[status] || statusConfig.draft;
    const IconComponent = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${config.color}`}>
        <IconComponent size={14} />
        {config.text}
      </span>
    );
  };

  const MobileActionSheet = () => (
    <div className={`fixed inset-0 z-50 transform transition-transform duration-300 ${showMobileActions ? 'translate-y-0' : 'translate-y-full'}`}>
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowMobileActions(false)} />
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl p-4 space-y-3">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Actions</h3>
          <button onClick={() => setShowMobileActions(false)}>
            <X size={24} />
          </button>
        </div>
        
        <button
          onClick={handleBookmark}
          className={`w-full p-3 rounded-lg border transition-colors flex items-center gap-3 ${
            isBookmarked 
              ? 'bg-blue-50 border-blue-200 text-blue-600' 
              : 'bg-white border-gray-300 text-gray-600'
          }`}
        >
          <Bookmark size={20} />
          <span>{isBookmarked ? 'Remove Bookmark' : 'Bookmark Job'}</span>
        </button>
        
        <button
          onClick={handleShare}
          className="w-full p-3 bg-white border border-gray-300 text-gray-600 rounded-lg flex items-center gap-3"
        >
          <Share2 size={20} />
          <span>Share Job</span>
        </button>
        
        {canEditJob() && (
          <button
            onClick={handleEdit}
            className="w-full p-3 bg-orange-100 text-orange-700 rounded-lg flex items-center gap-3"
          >
            <Edit size={20} />
            <span>Edit Job</span>
          </button>
        )}
        
        {canDeleteJob() && (
          <button
            onClick={handleDelete}
            className="w-full p-3 bg-red-100 text-red-700 rounded-lg flex items-center gap-3"
          >
            <Trash2 size={20} />
            <span>Delete Job</span>
          </button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Job Not Found</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/jobs')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6">
          <button
            onClick={() => navigate('/jobs')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeft size={20} />
            <span className="text-sm sm:text-base">Back to Jobs</span>
          </button>

          <div className="flex flex-col space-y-4">
            {/* Job Header */}
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="text-2xl sm:text-4xl flex-shrink-0">
                {job.startup_detail?.logo || '🏢'}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 break-words">
                  {job.title}
                </h1>
                
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm sm:text-base text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <Building size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">{job.startup_name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">{job.location}</span>
                    {job.is_remote && <span className="text-green-600">(Remote)</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
                    <span>{job.posted_ago}</span>
                  </div>
                  {job.salary_range && (
                    <div className="flex items-center gap-1">
                      <DollarSign size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">{job.salary_range}</span>
                    </div>
                  )}
                </div>
                
                {/* Status and Job Type badges */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {getStatusBadge(job.status)}
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                    {job.job_type_name}
                  </span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                    {job.experience_level_display}
                  </span>
                  {job.is_urgent && (
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                      <AlertCircle size={12} className="inline mr-1" />
                      Urgent
                    </span>
                  )}
                  {!job.is_verified && (
                    <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-semibold">
                      <AlertCircle size={12} className="inline mr-1" />
                      Email Unverified
                    </span>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Eye size={14} />
                    <span>{job.view_count || 0} views</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User size={14} />
                    <span>{job.application_count || 0} applications</span>
                  </div>
                  {job.company_email && (
                    <div className="flex items-center gap-1">
                      <Mail size={14} />
                      <span className={job.is_verified ? 'text-green-600' : 'text-orange-600'}>
                        Email {job.is_verified ? 'verified' : 'pending verification'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Desktop Action buttons */}
            <div className="hidden sm:flex flex-wrap gap-3">
              <button
                onClick={handleBookmark}
                className={`p-3 rounded-lg border transition-colors ${
                  isBookmarked 
                    ? 'bg-blue-50 border-blue-200 text-blue-600' 
                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Bookmark size={20} />
              </button>
              <button
                onClick={handleShare}
                className="p-3 bg-white border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50"
              >
                <Share2 size={20} />
              </button>
              
              {canEditJob() && (
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                >
                  <Edit size={16} />
                  <span className="hidden md:inline">Edit Job</span>
                </button>
              )}
              
              {canDeleteJob() && (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  <Trash2 size={16} />
                  <span className="hidden md:inline">Delete</span>
                </button>
              )}
              
              {job.status === 'active' && !job.has_applied ? (
                <button
                  onClick={() => setShowApplicationModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium"
                >
                  Apply Now
                </button>
              ) : job.has_applied ? (
                <button
                  disabled
                  className="px-6 py-3 bg-green-100 text-green-800 rounded-lg font-medium flex items-center gap-2"
                >
                  <CheckCircle size={16} />
                  Applied
                </button>
              ) : job.status !== 'active' ? (
                <button
                  disabled
                  className="px-6 py-3 bg-gray-100 text-gray-500 rounded-lg font-medium cursor-not-allowed"
                >
                  Not Available
                </button>
              ) : null}
            </div>

            {/* Mobile Action buttons */}
            <div className="sm:hidden flex gap-3">
              <button
                onClick={() => setShowMobileActions(true)}
                className="flex-1 p-3 bg-white border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <Menu size={20} />
                Actions
              </button>
              
              {job.status === 'active' && !job.has_applied ? (
                <button
                  onClick={() => setShowApplicationModal(true)}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium"
                >
                  Apply Now
                </button>
              ) : job.has_applied ? (
                <button
                  disabled
                  className="flex-1 px-6 py-3 bg-green-100 text-green-800 rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  <CheckCircle size={16} />
                  Applied
                </button>
              ) : job.status !== 'active' ? (
                <button
                  disabled
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-500 rounded-lg font-medium cursor-not-allowed"
                >
                  Not Available
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Description - Always Visible */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <Briefcase className="text-blue-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">Job Description</h3>
              </div>
              <div className="prose prose-gray max-w-none">
                <div 
                  className="text-gray-700 leading-relaxed whitespace-pre-wrap break-words"
                  style={{ 
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    hyphens: 'auto'
                  }}
                >
                  {job.description}
                </div>
              </div>
            </div>

            {/* Requirements - Always Visible */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="text-green-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">Requirements</h3>
              </div>
              {(job.requirements || (job.requirements_list && job.requirements_list.length > 0)) ? (
                <>
                  {job.requirements && (
                    <div className="prose prose-gray max-w-none mb-4">
                      <div className="text-gray-900 leading-relaxed whitespace-pre-wrap break-words">
                        {job.requirements}
                      </div>
                    </div>
                  )}
                  {job.requirements_list && job.requirements_list.length > 0 && (
                    <ul className="space-y-2">
                      {job.requirements_list.map((req, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="break-words overflow-wrap-anywhere text-sm sm:text-base text-gray-900">{req}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <div className="text-gray-600 italic">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="text-gray-400 mt-0.5 flex-shrink-0" size={16} />
                    <span className="text-gray-900">No specific requirements listed</span>
                  </div>
                </div>
              )}
            </div>

            {/* Benefits - Always Visible */}
            {(job.benefits || (job.benefits_list && job.benefits_list.length > 0)) && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Star className="text-yellow-500" size={20} />
                  <h3 className="text-lg font-semibold text-gray-900">Benefits & Perks</h3>
                </div>
                {job.benefits && (
                  <div className="prose prose-gray max-w-none mb-4">
                    <div className="text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                      {job.benefits}
                    </div>
                  </div>
                )}
                {job.benefits_list && job.benefits_list.length > 0 && (
                  <ul className="space-y-2">
                    {job.benefits_list.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Star size={16} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                        <span className="break-words overflow-wrap-anywhere text-sm sm:text-base">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Skills - Always Visible */}
            {job.skills && job.skills.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Award className="text-purple-600" size={20} />
                  <h3 className="text-lg font-semibold text-gray-900">Required Skills</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill, index) => (
                    <span
                      key={index}
                      className={`px-3 py-2 rounded-lg text-sm font-medium break-words ${
                        skill.is_required 
                          ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                          : 'bg-slate-100 text-slate-800 border border-slate-200'
                      }`}
                    >
                      {skill.skill}
                      {skill.proficiency_level !== 'intermediate' && (
                        <span className="ml-1 text-xs text-gray-600 font-medium">
                          ({skill.proficiency_level})
                        </span>
                      )}
                      {skill.is_required && (
                        <span className="ml-1 text-xs font-bold">*</span>
                      )}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">* Required skills</p>
              </div>
            )}

            {/* Important Dates - Always Visible */}
            {(job.application_deadline || job.expires_at) && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="text-orange-600" size={20} />
                  <h3 className="text-lg font-semibold text-gray-900">Important Dates</h3>
                </div>
                <div className="space-y-3">
                  {job.application_deadline && (
                    <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                      <Calendar size={16} className="text-orange-600" />
                      <div>
                        <p className="font-medium text-orange-900">Application Deadline</p>
                        <p className="text-sm text-orange-700">
                          {new Date(job.application_deadline).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                  {job.expires_at && (
                    <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                      <Clock size={16} className="text-red-600" />
                      <div>
                        <p className="font-medium text-red-900">Position Expires</p>
                        <p className="text-sm text-red-700">
                          {new Date(job.expires_at).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Status-specific Messages */}
            {job.status === 'pending' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Clock className="text-yellow-500 mt-1 mr-3" size={20} />
                  <div>
                    <h4 className="text-yellow-900 font-medium">Job Under Review</h4>
                    <p className="text-yellow-700 text-sm mt-1">
                      This job posting is currently being reviewed by our admin team and will be published once approved.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {job.status === 'rejected' && job.rejection_reason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="text-red-500 mt-1 mr-3 flex-shrink-0" size={20} />
                  <div>
                    <h4 className="text-red-900 font-medium">Job Rejected</h4>
                    <p className="text-red-700 text-sm mt-1">{job.rejection_reason}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Company Info - Always Visible */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <Building className="text-blue-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">About the Company</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="text-xl sm:text-2xl flex-shrink-0">{job.startup_detail?.logo || '🏢'}</div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-gray-900 break-words text-sm sm:text-base">{job.startup_name}</h4>
                    <p className="text-xs sm:text-sm text-gray-600 break-words">{job.startup_industry}</p>
                  </div>
                </div>
                
                {job.startup_detail?.description && (
                  <div className="text-gray-700 break-words overflow-wrap-anywhere text-sm sm:text-base">
                    {job.startup_detail.description}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div>
                    <span className="text-gray-500 text-sm">Industry:</span>
                    <p className="font-medium text-gray-800 break-words">{job.startup_detail?.industry_name || job.startup_industry || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">Size:</span>
                    <p className="font-medium text-gray-800">{job.startup_employee_count ? `${job.startup_employee_count} employees` : 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">Founded:</span>
                    <p className="font-medium text-gray-800">{job.startup_detail?.founded_year || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">Location:</span>
                    <p className="font-medium text-gray-800 break-words">{job.startup_detail?.location || job.location || 'Not specified'}</p>
                  </div>
                </div>

                {job.startup_detail?.website && (
                  <a
                    href={job.startup_detail.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 break-all text-sm sm:text-base"
                  >
                    <Globe size={16} />
                    Visit Website
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>

            {/* Job Stats - Always Visible */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="text-green-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">Job Stats</h3>
              </div>
              <div className="space-y-3 text-sm sm:text-base">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Eye size={14} />
                    Views:
                  </span>
                  <span className="font-medium text-gray-800">{job.view_count || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center gap-2">
                    <User size={14} />
                    Applications:
                  </span>
                  <span className="font-medium text-gray-800">{job.application_count || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Calendar size={14} />
                    Posted:
                  </span>
                  <span className="font-medium text-gray-800">{job.posted_ago || job.created_at || 'Unknown'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center gap-2">
                    <CheckCircle size={14} />
                    Status:
                  </span>
                  <span className={`font-bold ${
                    job.status === 'active' ? 'text-green-700' : 
                    job.status === 'pending' ? 'text-yellow-700' : 
                    'text-red-700'
                  }`}>
                    {job.status_display || job.status || 'Unknown'}
                  </span>
                </div>
                {job.company_email && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Mail size={14} />
                      Email:
                    </span>
                    <span className={`font-medium text-xs ${job.is_verified ? 'text-green-600' : 'text-orange-600'}`}>
                      {job.is_verified ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Information - Always Visible */}
            {job.company_email && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Mail className="text-purple-600" size={20} />
                  <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail size={16} className="text-gray-600" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Company Email</p>
                      <p className="text-sm text-gray-600 break-all">{job.company_email}</p>
                      <p className={`text-xs mt-1 ${job.is_verified ? 'text-green-600' : 'text-orange-600'}`}>
                        {job.is_verified ? '✓ Verified with company domain' : '⚠ Pending verification'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Job Type & Experience - Always Visible */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <Briefcase className="text-indigo-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">Job Details</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-500 text-sm">Job Type</span>
                  <p className="font-medium text-gray-800">{job.job_type_name || job.job_type || 'Not specified'}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">Experience Level</span>
                  <p className="font-medium text-gray-800">{job.experience_level_display || job.experience_level || 'Not specified'}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">Salary Range</span>
                  <p className="font-medium text-gray-800">{job.salary_range || job.salary || 'Not specified'}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">Work Options</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {job.is_remote && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Remote OK
                      </span>
                    )}
                    {job.is_urgent && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                        Urgent Hiring
                      </span>
                    )}
                    {!job.is_remote && !job.is_urgent && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                        On-site
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Similar Jobs - Always Visible */}
            {job.similar_jobs && job.similar_jobs.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Heart className="text-pink-600" size={20} />
                  <h3 className="text-lg font-semibold text-gray-900">Similar Jobs</h3>
                </div>
                <div className="space-y-3">
                  {job.similar_jobs.map((similarJob) => (
                    <div
                      key={similarJob.id}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/jobs/${similarJob.id}`)}
                    >
                      <h4 className="font-medium text-gray-900 break-words text-sm sm:text-base">{similarJob.title}</h4>
                      <p className="text-xs sm:text-sm text-gray-600 break-words">{similarJob.startup_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs sm:text-sm text-gray-500 break-words">{similarJob.location}</p>
                        {similarJob.is_remote && (
                          <span className="text-xs text-green-600">• Remote</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Action Sheet */}
      <MobileActionSheet />

      {/* Job Application Modal */}
      {showApplicationModal && (
        <JobApplicationModal
          isOpen={showApplicationModal}
          onClose={() => setShowApplicationModal(false)}
          job={job}
          onApplicationSubmitted={() => {
            setShowApplicationModal(false);
            fetchJobDetails(); // Refresh job details
          }}
        />
      )}
    </div>
  );
};

export default JobDetailPage;