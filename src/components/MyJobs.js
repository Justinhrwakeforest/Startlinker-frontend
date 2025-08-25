import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  Briefcase, Plus, Edit3, Trash2, Eye, Clock, CheckCircle, 
  XCircle, AlertCircle, Users, MapPin, DollarSign, Calendar,
  RefreshCw, Search, Filter, MoreHorizontal, ExternalLink,
  Building, TrendingUp, Activity, BarChart3
} from 'lucide-react';
import api from '../services/api';
import ApplicationManagement from './ApplicationManagement';

const MyJobs = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showApplications, setShowApplications] = useState(false);
  const [selectedJobForApplications, setSelectedJobForApplications] = useState(null);

  // Check authentication
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadMyJobs();
  }, [user, navigate]);

  const loadMyJobs = async () => {
    if (refreshing) setRefreshing(true);
    else setLoading(true);
    
    try {
      console.log('🔍 Loading my jobs for user:', user?.id);
      
      // Try multiple endpoints to find user's jobs
      let response;
      try {
        // First try the dedicated my-jobs endpoint
        response = await api.jobs.getMyJobs();
        console.log('✅ Got jobs from my-jobs endpoint:', response);
      } catch (myJobsError) {
        console.warn('⚠️ my-jobs endpoint failed, trying alternative approach:', myJobsError);
        
        // Fallback: get all jobs and filter by current user on frontend
        try {
          const allJobsResponse = await api.jobs.list();
          const allJobs = allJobsResponse.results || allJobsResponse || [];
          console.log('📋 All jobs received:', allJobs.length);
          
          // Filter jobs posted by current user
          const userJobs = allJobs.filter(job => {
            const postedBy = job.posted_by;
            const userId = user?.id;
            
            // Handle different data structures for posted_by
            if (typeof postedBy === 'object' && postedBy !== null) {
              return postedBy.id === userId;
            }
            return postedBy === userId;
          });
          
          console.log('✅ Filtered user jobs:', userJobs.length);
          response = { results: userJobs };
        } catch (fallbackError) {
          console.error('❌ Fallback approach also failed:', fallbackError);
          throw fallbackError;
        }
      }
      
      const jobs = response.results || response || [];
      console.log('🎯 Final jobs to display:', jobs.length);
      setJobs(jobs);
      setError(null);
    } catch (error) {
      console.error('❌ Error loading my jobs:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to load your jobs. Please try again.';
      setError(errorMessage);
      setJobs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDeleteJob = async () => {
    if (!jobToDelete) return;
    
    setDeleting(true);
    try {
      await api.delete(`/api/jobs/${jobToDelete.id}/`);
      setJobs(prev => prev.filter(job => job.id !== jobToDelete.id));
      setShowDeleteModal(false);
      setJobToDelete(null);
      alert('Job deleted successfully!');
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('Failed to delete job. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { 
        color: 'bg-green-100 text-green-800 border-green-200', 
        icon: CheckCircle, 
        label: 'Active' 
      },
      pending: { 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
        icon: Clock, 
        label: 'Pending Review' 
      },
      rejected: { 
        color: 'bg-red-100 text-red-800 border-red-200', 
        icon: XCircle, 
        label: 'Rejected' 
      },
      expired: { 
        color: 'bg-gray-100 text-gray-800 border-gray-200', 
        icon: AlertCircle, 
        label: 'Expired' 
      },
      draft: { 
        color: 'bg-blue-100 text-blue-800 border-blue-200', 
        icon: Edit3, 
        label: 'Draft' 
      }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const filteredJobs = jobs.filter(job => {
    const matchesStatus = filterStatus === 'all' || job.status === filterStatus;
    const matchesSearch = !searchQuery || 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const statusCounts = jobs.reduce((acc, job) => {
    acc[job.status] = (acc[job.status] || 0) + 1;
    return acc;
  }, {});

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          .my-jobs-page input,
          .my-jobs-page select,
          .my-jobs-page textarea {
            color: #1f2937 !important;
            background-color: #ffffff !important;
          }
          .my-jobs-page input::placeholder {
            color: #9ca3af !important;
          }
        `}
      </style>
      <div className="min-h-screen bg-gray-50 my-jobs-page">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Job Postings</h1>
              <p className="text-gray-600">Manage your job postings and track their status</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0">
              <button
                onClick={() => setRefreshing(true) || loadMyJobs()}
                disabled={refreshing}
                className="flex items-center justify-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => navigate('/jobs/create')}
                className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Post New Job
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                  <p className="text-xl font-semibold text-gray-900">{jobs.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-xl font-semibold text-gray-900">{statusCounts.active || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-xl font-semibold text-gray-900">{statusCounts.pending || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total Views</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {jobs.reduce((sum, job) => sum + (job.view_count || 0), 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search your jobs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    style={{ color: '#1f2937', backgroundColor: '#ffffff' }}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                {['all', 'active', 'pending', 'rejected', 'expired'].map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filterStatus === status
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                    }`}
                  >
                    {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                    {status !== 'all' && statusCounts[status] ? ` (${statusCounts[status]})` : ''}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Jobs List */}
        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your jobs...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Jobs</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 text-left">
                <h4 className="text-yellow-800 font-medium text-sm mb-2">🔧 Troubleshooting Info:</h4>
                <ul className="text-yellow-700 text-xs space-y-1">
                  <li>• Make sure the backend server is running (python manage.py runserver)</li>
                  <li>• Verify the /jobs/my-jobs/ endpoint is accessible</li>
                  <li>• Check if you're logged in with proper authentication</li>
                  <li>• Ensure you have posted at least one job to see here</li>
                </ul>
              </div>
              <div className="space-y-3">
                <button
                  onClick={loadMyJobs}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
                <div className="text-sm text-gray-500">
                  <p>If the problem persists, try posting a new job first:</p>
                  <button
                    onClick={() => navigate('/jobs/create')}
                    className="mt-2 px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                  >
                    Post Your First Job
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="text-center">
              <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {jobs.length === 0 ? 'No Jobs Posted Yet' : 'No Jobs Match Your Filters'}
              </h3>
              <p className="text-gray-600 mb-4">
                {jobs.length === 0 
                  ? 'Get started by posting your first job!'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
              {jobs.length === 0 && (
                <button
                  onClick={() => navigate('/jobs/create')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Post Your First Job
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map(job => (
              <div key={job.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    {/* Job Info */}
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                            {getStatusBadge(job.status)}
                            {job.is_urgent && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                Urgent
                              </span>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                              <Building className="w-4 h-4" />
                              <span>{job.company_name || 'Your Company'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span>{job.location}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              <span>{job.salary_range || 'Not specified'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>Posted {job.posted_ago || 'recently'}</span>
                            </div>
                          </div>
                          
                          <p className="text-gray-700 mb-3 line-clamp-2">{job.description}</p>
                          
                          <div className="flex flex-wrap gap-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                              {job.job_type_name || job.job_type}
                            </span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                              {job.experience_level_display || job.experience_level}
                            </span>
                            {job.is_remote && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                                Remote
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Stats */}
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span>{job.view_count || 0} views</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{job.application_count || 0} applications</span>
                        </div>
                        {job.expires_at && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>Expires {new Date(job.expires_at).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex flex-row lg:flex-col gap-2 lg:min-w-[140px]">
                      <button
                        onClick={() => navigate(`/jobs/${job.id}`)}
                        className="flex items-center justify-center px-3 py-2 text-gray-700 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </button>

                      <button
                        onClick={() => {
                          setSelectedJobForApplications(job);
                          setShowApplications(true);
                        }}
                        className="flex items-center justify-center px-3 py-2 text-purple-700 bg-purple-100 border border-purple-200 rounded-lg hover:bg-purple-200 transition-colors text-sm"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Applications
                        {job.application_count > 0 && (
                          <span className="ml-1 px-1.5 py-0.5 bg-purple-600 text-white text-xs rounded-full">
                            {job.application_count}
                          </span>
                        )}
                      </button>
                      
                      <button
                        onClick={() => navigate(`/jobs/${job.id}/edit`)}
                        className="flex items-center justify-center px-3 py-2 text-blue-700 bg-blue-100 border border-blue-200 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit
                      </button>
                      
                      <button
                        onClick={() => {
                          setJobToDelete(job);
                          setShowDeleteModal(true);
                        }}
                        className="flex items-center justify-center px-3 py-2 text-red-700 bg-red-100 border border-red-200 rounded-lg hover:bg-red-200 transition-colors text-sm"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  {/* Status Messages */}
                  {job.status === 'pending' && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start">
                        <Clock className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800">Pending Admin Review</p>
                          <p className="text-sm text-yellow-700 mt-1">
                            Your job is being reviewed by our admin team. It will be published once approved.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {job.status === 'rejected' && job.rejection_reason && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start">
                        <XCircle className="w-5 h-5 text-red-600 mt-0.5 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-red-800">Job Rejected</p>
                          <p className="text-sm text-red-700 mt-1">{job.rejection_reason}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-red-100 rounded-full mr-3">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Job Posting</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{jobToDelete?.title}"? This action cannot be undone and will remove the job posting permanently.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setJobToDelete(null);
                  }}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteJob}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {deleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    'Delete Job'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Application Management Modal */}
        {showApplications && selectedJobForApplications && (
          <ApplicationManagement
            jobId={selectedJobForApplications.id}
            onClose={() => {
              setShowApplications(false);
              setSelectedJobForApplications(null);
            }}
          />
        )}
        </div>
      </div>
    </>
  );
};

export default MyJobs;