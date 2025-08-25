import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Eye, MessageCircle, Users, Clock, CheckCircle, X, Filter, Search } from 'lucide-react';
import axios from '../config/axios';
import { useNotifications } from './NotificationSystem';

const ApplicationManagement = ({ jobId, onClose }) => {
  const { success, error } = useNotifications();
  const [applications, setApplications] = useState([]);
  
  // Add custom styles to ensure text visibility
  const modalStyles = {
    backgroundColor: '#ffffff !important',
    color: '#1f2937 !important'
  };
  
  const inputStyles = {
    color: '#1f2937 !important',
    backgroundColor: '#ffffff !important',
    border: '1px solid #d1d5db !important'
  };
  const [loading, setLoading] = useState(true);
  const [jobInfo, setJobInfo] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });
  const [selectedApplications, setSelectedApplications] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [searchInput, setSearchInput] = useState(''); // Local search input state

  useEffect(() => {
    if (jobId) {
      fetchApplications();
    }
  }, [jobId, filters.status, filters.search]); // Depend on both status and search filters

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);

      const response = await axios.get(`/api/jobs/${jobId}/applications/?${params}`);
      
      if (response.data.applications) {
        setApplications(response.data.applications);
        setJobInfo(response.data.job_info);
      } else {
        // Handle paginated response
        setApplications(response.data.results || []);
      }
    } catch (err) {
      console.error('Failed to fetch applications:', err);
      error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, search: searchInput }));
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setFilters(prev => ({ ...prev, search: '' }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleStatusUpdate = async (applicationId, newStatus, reviewNotes = '') => {
    try {
      await axios.put(`/api/jobs/applications/${applicationId}/`, {
        status: newStatus,
        review_notes: reviewNotes
      });
      
      // Update local state
      setApplications(prev => prev.map(app => 
        app.id === applicationId 
          ? { ...app, status: newStatus, status_display: getStatusDisplay(newStatus) }
          : app
      ));
      
      success(`Application ${newStatus} successfully`);
    } catch (err) {
      error('Failed to update application status');
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedApplications.length === 0) return;

    try {
      await axios.post('/api/jobs/applications/bulk-update/', {
        application_ids: selectedApplications,
        status: bulkAction,
        review_notes: `Bulk action: ${bulkAction}`
      });

      // Refresh applications
      await fetchApplications();
      setSelectedApplications([]);
      setBulkAction('');
      
      success(`Bulk action completed for ${selectedApplications.length} applications`);
    } catch (err) {
      error('Failed to perform bulk action');
    }
  };

  const initiateConversation = async (application, initialMessage = '') => {
    try {
      const response = await axios.post(`/api/jobs/applications/${application.id}/message/`, {
        initial_message: initialMessage || `Hi ${application.applicant.display_name}, I'd like to discuss your application for the ${application.job_title} position.`
      });
      
      if (response.data.exists) {
        success('Conversation already exists. Redirecting to chat...');
      } else {
        success('Conversation initiated successfully!');
      }
      
      // Here you would typically redirect to the messaging interface
      // For now, we'll just show the conversation ID
      console.log('Conversation ID:', response.data.conversation_id);
      
    } catch (err) {
      error('Failed to initiate conversation');
    }
  };

  const getStatusDisplay = (status) => {
    const statusMap = {
      'pending': 'Pending Review',
      'reviewed': 'Under Review',
      'shortlisted': 'Shortlisted',
      'interview_scheduled': 'Interview Scheduled',
      'interviewed': 'Interviewed',
      'offered': 'Offer Extended',
      'hired': 'Hired',
      'rejected': 'Rejected',
      'withdrawn': 'Withdrawn'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'reviewed': 'bg-blue-100 text-blue-800',
      'shortlisted': 'bg-purple-100 text-purple-800',
      'interview_scheduled': 'bg-indigo-100 text-indigo-800',
      'interviewed': 'bg-cyan-100 text-cyan-800',
      'offered': 'bg-green-100 text-green-800',
      'hired': 'bg-green-200 text-green-900',
      'rejected': 'bg-red-100 text-red-800',
      'withdrawn': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75">
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-white rounded-lg p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading applications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          .application-management-modal * {
            color: #1f2937 !important;
          }
          .application-management-modal input,
          .application-management-modal select,
          .application-management-modal textarea {
            color: #1f2937 !important;
            background-color: #ffffff !important;
            border: 1px solid #d1d5db !important;
          }
          .application-management-modal option {
            color: #1f2937 !important;
            background-color: #ffffff !important;
          }
        `}
      </style>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20">
          <div className="application-management-modal bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden" style={{ backgroundColor: '#ffffff', color: '#1f2937' }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  Applications for {jobInfo?.title}
                </h2>
                <p className="text-blue-100 text-sm">
                  {applications.length} total applications
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Filters and Actions */}
          <div className="p-6 border-b border-gray-200" style={{ backgroundColor: '#ffffff', color: '#1f2937' }}>
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Status Filter */}
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  style={inputStyles}
                >
                  <option value="" style={{ color: '#1f2937', backgroundColor: '#ffffff' }}>All Statuses</option>
                  <option value="pending" style={{ color: '#1f2937', backgroundColor: '#ffffff' }}>Pending Review</option>
                  <option value="reviewed" style={{ color: '#1f2937', backgroundColor: '#ffffff' }}>Under Review</option>
                  <option value="shortlisted" style={{ color: '#1f2937', backgroundColor: '#ffffff' }}>Shortlisted</option>
                  <option value="interview_scheduled" style={{ color: '#1f2937', backgroundColor: '#ffffff' }}>Interview Scheduled</option>
                  <option value="offered" style={{ color: '#1f2937', backgroundColor: '#ffffff' }}>Offer Extended</option>
                  <option value="hired" style={{ color: '#1f2937', backgroundColor: '#ffffff' }}>Hired</option>
                  <option value="rejected" style={{ color: '#1f2937', backgroundColor: '#ffffff' }}>Rejected</option>
                </select>

                {/* Search */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search applicants..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      style={inputStyles}
                    />
                  </div>
                  <button
                    onClick={handleSearch}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    Search
                  </button>
                  {(searchInput || filters.search) && (
                    <button
                      onClick={handleClearSearch}
                      className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Bulk Actions */}
              {selectedApplications.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {selectedApplications.length} selected
                  </span>
                  <select
                    value={bulkAction}
                    onChange={(e) => setBulkAction(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    style={inputStyles}
                  >
                    <option value="" style={{ color: '#1f2937', backgroundColor: '#ffffff' }}>Bulk Action</option>
                    <option value="shortlisted" style={{ color: '#1f2937', backgroundColor: '#ffffff' }}>Shortlist</option>
                    <option value="rejected" style={{ color: '#1f2937', backgroundColor: '#ffffff' }}>Reject</option>
                    <option value="interview_scheduled" style={{ color: '#1f2937', backgroundColor: '#ffffff' }}>Schedule Interview</option>
                  </select>
                  <button
                    onClick={handleBulkAction}
                    disabled={!bulkAction}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Applications List */}
          <div className="overflow-y-auto max-h-[60vh]" style={{ backgroundColor: '#ffffff', color: '#1f2937' }}>
            {applications.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No applications found.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {applications.map((application) => (
                  <div key={application.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedApplications.includes(application.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedApplications(prev => [...prev, application.id]);
                          } else {
                            setSelectedApplications(prev => prev.filter(id => id !== application.id));
                          }
                        }}
                        className="mt-1 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                        style={{ backgroundColor: '#ffffff', borderColor: '#d1d5db' }}
                      />

                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                          {application.applicant.display_name?.charAt(0) || 'U'}
                        </div>
                      </div>

                      {/* Application Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {application.applicant.display_name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {application.applicant.email}
                            </p>
                            {application.applicant.location && (
                              <p className="text-sm text-gray-500">
                                📍 {application.applicant.location}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                              {application.status_display}
                            </span>
                          </div>
                        </div>

                        {/* Cover Letter Preview */}
                        <div className="mt-3">
                          <p className="text-sm text-gray-700 line-clamp-2">
                            {application.cover_letter}
                          </p>
                        </div>

                        {/* Application Meta */}
                        <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Applied {new Date(application.applied_at).toLocaleDateString()}
                          </span>
                          <span>Profile {application.applicant.profile_completeness}% complete</span>
                          {application.selected_resume && (
                            <span>📄 Resume attached</span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="mt-4 flex items-center gap-2">
                          <button
                            onClick={() => handleStatusUpdate(application.id, 'shortlisted')}
                            disabled={application.status === 'shortlisted'}
                            className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 disabled:opacity-50 text-sm"
                          >
                            Shortlist
                          </button>
                          
                          <button
                            onClick={() => initiateConversation(application)}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm flex items-center gap-1"
                          >
                            <MessageCircle className="w-3 h-3" />
                            {application.conversation_status?.exists ? 'View Chat' : 'Message'}
                          </button>
                          
                          <button
                            onClick={() => handleStatusUpdate(application.id, 'interview_scheduled')}
                            disabled={application.status === 'interview_scheduled'}
                            className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50 text-sm"
                          >
                            Schedule Interview
                          </button>
                          
                          <button
                            onClick={() => handleStatusUpdate(application.id, 'rejected')}
                            disabled={application.status === 'rejected'}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 text-sm"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                Showing {applications.length} applications
              </span>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ApplicationManagement;