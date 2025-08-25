import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, XCircle, Clock, AlertTriangle, Search, Filter,
  Eye, Mail, Building, MapPin, Calendar, User, ChevronDown,
  MoreHorizontal, Trash2, Edit, MessageSquare
} from 'lucide-react';
import api from '../services/api';

const JobAdminDashboard = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [stats, setStats] = useState({
    total_jobs: 0,
    pending_jobs: 0,
    active_jobs: 0,
    rejected_jobs: 0,
    total_applications: 0
  });
  const [expandedJob, setExpandedJob] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🔄 JobAdminDashboard mounted, fetching data...');
    fetchJobs();
    fetchStats();
  }, [selectedFilter, searchTerm]);

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📡 Fetching jobs with filter:', selectedFilter, 'search:', searchTerm);
      
      const params = new URLSearchParams({
        filter: selectedFilter,
        search: searchTerm
      });

      const response = await api.get(`/api/jobs/admin/?${params}`);
      
      console.log('✅ Jobs response:', response.data);
      
      const jobsData = response.data.results || response.data || [];
      setJobs(Array.isArray(jobsData) ? jobsData : []);
      
      console.log('📊 Loaded jobs:', jobsData.length);
    } catch (error) {
      console.error('❌ Error fetching jobs:', error);
      
      // Handle different error types
      if (error.response?.status === 401) {
        setError('You are not authorized to access this page. Please log in as an admin.');
      } else if (error.response?.status === 403) {
        setError('You do not have permission to access the admin panel.');
      } else if (error.message.includes('Network Error')) {
        setError('Network error. Please check your connection.');
      } else {
        setError(`Failed to load jobs: ${error.message}`);
      }
      
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      console.log('📡 Fetching admin stats...');
      
      const response = await api.get('/api/jobs/admin_stats/');
      
      console.log('✅ Stats response:', response.data);
      
      if (response.data) {
        setStats({
          total_jobs: response.data.total_jobs || 0,
          pending_jobs: response.data.pending_jobs || 0,
          active_jobs: response.data.active_jobs || 0,
          rejected_jobs: response.data.rejected_jobs || 0,
          total_applications: response.data.total_applications || 0
        });
      }
    } catch (error) {
      console.error('❌ Error fetching stats:', error);
      
      // Don't show error for stats, just log it
      if (error.response?.status === 401) {
        console.warn('🔐 Not authorized to fetch stats');
      }
    }
  };

  const handleJobAction = async (jobId, action, reason = '') => {
    try {
      console.log(`🔄 Performing action "${action}" on job ${jobId}`);
      
      const response = await api.patch(`/api/jobs/${jobId}/admin/`, { 
        action, 
        reason 
      });

      if (response.status === 200) {
        console.log(`✅ Action "${action}" completed successfully`);
        
        // Show success message
        alert(response.data.message || `Job ${action}d successfully`);
        
        // Refresh data
        await Promise.all([fetchJobs(), fetchStats()]);
      }
    } catch (error) {
      console.error(`❌ Error ${action}ing job:`, error);
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          `Failed to ${action} job`;
      alert(errorMessage);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedJobs.length === 0) {
      alert('Please select jobs first');
      return;
    }

    if (!window.confirm(`Are you sure you want to ${action} ${selectedJobs.length} job(s)?`)) {
      return;
    }

    try {
      console.log(`🔄 Performing bulk action "${action}" on ${selectedJobs.length} jobs`);
      
      const response = await api.post('/api/jobs/bulk-admin/', {
        job_ids: selectedJobs,
        action
      });

      if (response.status === 200) {
        console.log(`✅ Bulk action "${action}" completed successfully`);
        
        alert(response.data.message || `Bulk ${action} completed successfully`);
        setSelectedJobs([]);
        
        // Refresh data
        await Promise.all([fetchJobs(), fetchStats()]);
      }
    } catch (error) {
      console.error(`❌ Error performing bulk ${action}:`, error);
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          `Failed to ${action} jobs`;
      alert(errorMessage);
    }
  };

  const toggleJobSelection = (jobId) => {
    setSelectedJobs(prev => 
      prev.includes(jobId) 
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  const selectAllJobs = () => {
    if (selectedJobs.length === jobs.length) {
      setSelectedJobs([]);
    } else {
      setSelectedJobs(jobs.map(job => job.id));
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      draft: 'bg-gray-100 text-gray-800',
      paused: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || colors.draft;
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock size={16} />,
      active: <CheckCircle size={16} />,
      rejected: <XCircle size={16} />,
      draft: <Edit size={16} />,
      paused: <AlertTriangle size={16} />
    };
    return icons[status] || icons.draft;
  };

  const JobCard = ({ job }) => {
    const isExpanded = expandedJob === job.id;
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <input
                type="checkbox"
                checked={selectedJobs.includes(job.id)}
                onChange={() => toggleJobSelection(job.id)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{job.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Building size={14} />
                        <span>{job.startup_name || 'Unknown Company'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin size={14} />
                        <span>{job.location}</span>
                        {job.is_remote && <span className="text-green-600">(Remote)</span>}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>{job.posted_ago || 'Recently'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                      {getStatusIcon(job.status)}
                      {job.status_display || job.status}
                    </span>
                  </div>
                </div>

                {/* Email and Poster Info */}
                <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <Mail size={14} />
                    <span>{job.company_email || 'No email provided'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User size={14} />
                    <span>Posted by {job.posted_by_username || 'Unknown'}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <span>{job.view_count || 0} views</span>
                  <span>{job.application_count || 0} applications</span>
                  {job.salary_range && <span>{job.salary_range}</span>}
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Job Details</h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p><span className="font-medium">Type:</span> {job.job_type_name || 'Not specified'}</p>
                          <p><span className="font-medium">Experience:</span> {job.experience_level_display || job.experience_level}</p>
                          {job.skills_list && job.skills_list.length > 0 && (
                            <p><span className="font-medium">Skills:</span> {job.skills_list.join(', ')}</p>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Company Info</h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p><span className="font-medium">Industry:</span> {job.startup_industry || 'Not specified'}</p>
                          <p><span className="font-medium">Size:</span> {job.startup_employee_count || 'Not specified'} employees</p>
                          <p><span className="font-medium">Location:</span> {job.startup_location || 'Not specified'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                      <p className="text-sm text-gray-600 line-clamp-3">{job.description}</p>
                    </div>

                    {job.rejection_reason && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                        <h4 className="font-medium text-red-900 mb-1">Rejection Reason</h4>
                        <p className="text-sm text-red-700">{job.rejection_reason}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => setExpandedJob(isExpanded ? null : job.id)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {isExpanded ? 'Show Less' : 'Show More'}
            </button>

            <div className="flex gap-2">
              {job.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleJobAction(job.id, 'approve')}
                    className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-lg hover:bg-green-200"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Enter rejection reason (optional):');
                      if (reason !== null) {
                        handleJobAction(job.id, 'reject', reason);
                      }
                    }}
                    className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-lg hover:bg-red-200"
                  >
                    Reject
                  </button>
                </>
              )}
              
              {job.status === 'active' && (
                <button
                  onClick={() => handleJobAction(job.id, 'deactivate')}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
                >
                  Deactivate
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg shadow-sm">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => {
              setError(null);
              fetchJobs();
              fetchStats();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Administration</h1>
          <p className="text-gray-600">Review and manage job postings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Jobs</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pending_jobs}</p>
              </div>
              <Clock className="text-orange-500" size={24} />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                <p className="text-2xl font-bold text-green-600">{stats.active_jobs}</p>
              </div>
              <CheckCircle className="text-green-500" size={24} />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Applications</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total_applications}</p>
              </div>
              <User className="text-blue-500" size={24} />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rejected Jobs</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected_jobs}</p>
              </div>
              <XCircle className="text-red-500" size={24} />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'pending', label: 'Pending', count: stats.pending_jobs },
                { key: 'approved', label: 'Approved', count: stats.active_jobs },
                { key: 'rejected', label: 'Rejected', count: stats.rejected_jobs },
                { key: 'all', label: 'All', count: stats.total_jobs }
              ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setSelectedFilter(filter.key)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedFilter === filter.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.label} ({filter.count || 0})
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search jobs, companies, or users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedJobs.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {selectedJobs.length} job{selectedJobs.length !== 1 ? 's' : ''} selected
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleBulkAction('approve')}
                    className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-lg hover:bg-green-200"
                  >
                    Approve Selected
                  </button>
                  <button
                    onClick={() => handleBulkAction('reject')}
                    className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-lg hover:bg-red-200"
                  >
                    Reject Selected
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Select All */}
        {jobs.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              checked={selectedJobs.length === jobs.length}
              onChange={selectAllJobs}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-600">Select all visible jobs</span>
          </div>
        )}

        {/* Jobs List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600">
              {searchTerm 
                ? `No jobs match your search for "${searchTerm}"`
                : `No ${selectedFilter} jobs at the moment`
              }
            </p>
            <button
              onClick={() => {
                fetchJobs();
                fetchStats();
              }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map(job => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}

        {/* Quick Actions Panel */}
        <div className="fixed bottom-6 right-6 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
          <div className="space-y-2">
            <button
              onClick={() => setSelectedFilter('pending')}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Review Pending ({stats.pending_jobs || 0})
            </button>
            <button
              onClick={() => {
                fetchStats();
                fetchJobs();
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Refresh Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobAdminDashboard;