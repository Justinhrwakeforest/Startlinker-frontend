import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import {
  AlertCircle, Flag, User, FileText, Clock, CheckCircle,
  XCircle, Eye, Search, Filter, ChevronDown, ChevronRight,
  Trash2, MessageSquare, Calendar, ExternalLink,
  Users, RefreshCw, AlertTriangle, Info
} from 'lucide-react';

const ReportManagementTab = () => {
  const { user } = useContext(AuthContext);
  
  // Add custom CSS to force dropdown visibility
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .force-visible-dropdown {
        color: #000000 !important;
        background-color: #ffffff !important;
        font-weight: normal !important;
        font-size: 12px !important;
      }
      .force-visible-dropdown option {
        color: #000000 !important;
        background-color: #ffffff !important;
        font-weight: normal !important;
        padding: 8px 12px !important;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('posts');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReports, setSelectedReports] = useState([]);
  const [expandedReport, setExpandedReport] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchReports();
    fetchStats();
  }, [activeTab, filter]);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = activeTab === 'posts' 
        ? '/api/reports/admin/posts/' 
        : '/api/reports/admin/users/';
      
      const response = await api.get(endpoint, {
        params: {
          status: filter !== 'all' ? filter : undefined,
          search: searchTerm || undefined
        }
      });
      
      const reportsData = response.data.results || response.data;
      console.log('Fetched reports:', reportsData);
      setReports(Array.isArray(reportsData) ? reportsData : []);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      setError('Failed to load reports. Please try again.');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/reports/admin/dashboard/');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleStatusChange = async (reportId, newStatus) => {
    setActionLoading(true);
    try {
      const endpoint = activeTab === 'posts' 
        ? `/reports/admin/posts/${reportId}/`
        : `/reports/admin/users/${reportId}/`;
      
      await api.patch(endpoint, { 
        status: newStatus,
        resolved_at: ['resolved', 'dismissed'].includes(newStatus) ? new Date().toISOString() : null
      });
      
      await fetchReports();
      await fetchStats();
    } catch (error) {
      console.error('Failed to update report status:', error);
      alert('Failed to update report status. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedReports.length === 0) {
      alert('Please select reports to perform bulk action.');
      return;
    }

    setActionLoading(true);
    try {
      await api.post('/api/reports/admin/bulk-action/', {
        report_ids: selectedReports,
        action_type: action,
        reason: `Bulk action performed by ${user.username}`
      });
      
      await fetchReports();
      await fetchStats();
      setSelectedReports([]);
    } catch (error) {
      console.error('Failed to perform bulk action:', error);
      alert('Failed to perform bulk action. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUserAction = async (report, action) => {
    console.log('=== handleUserAction called ===');
    console.log('Action:', action);
    console.log('Active tab:', activeTab);
    
    if (!action) {
      console.log('No action provided, returning');
      return;
    }

    // Get the target username for display (backend will determine the target user from report_id)
    let targetUsername;
    
    if (activeTab === 'posts') {
      targetUsername = report.post_author_username;
      console.log('Post report - target username:', targetUsername);
    } else {
      targetUsername = report.reported_user_username;
      console.log('User report - target username:', targetUsername);
    }

    if (!targetUsername) {
      console.error('Unable to identify target username. Report fields:', Object.keys(report));
      alert('Unable to identify target user for this action. Check console for details.');
      return;
    }

    // Show confirmation dialog for destructive actions
    if (action === 'temp_ban' || action === 'permanent_ban') {
      const actionText = action === 'temp_ban' ? 'temporarily ban' : 'permanently ban';
      if (!window.confirm(`Are you sure you want to ${actionText} user "${targetUsername}"? This action cannot be undone.`)) {
        return;
      }
    }

    setActionLoading(true);
    try {
      let message = '';
      let banDuration = null;

      if (action === 'warn') {
        message = window.prompt('Enter warning message for the user:', 
          'Warning: Your recent activity has violated our community guidelines. This is an official warning. If you continue to violate our terms of service, your account will be temporarily or permanently banned. Please review our community guidelines and ensure future compliance.');
        if (!message) {
          setActionLoading(false);
          return;
        }
      } else if (action === 'temp_ban') {
        const durationInput = window.prompt('Enter ban duration in days:', '7');
        if (!durationInput) {
          setActionLoading(false);
          return;
        }
        banDuration = parseInt(durationInput);
        if (isNaN(banDuration) || banDuration <= 0) {
          alert('Please enter a valid number of days.');
          setActionLoading(false);
          return;
        }
      }

      await api.post('/api/reports/admin/user-action/', {
        // user_id is not needed - backend will determine from report_id
        action_type: action,
        report_id: report.id, // Backend will use this to determine target user
        message: message,
        ban_duration_days: banDuration,
        reason: `Action taken on report #${report.id}`
      });

      // Show success message
      const actionMessages = {
        warn: 'Warning sent to user successfully.',
        temp_ban: `User temporarily banned for ${banDuration} days.`,
        permanent_ban: 'User permanently banned.'
      };
      
      alert(actionMessages[action]);
      
      // Refresh reports
      await fetchReports();
      await fetchStats();
    } catch (error) {
      console.error('Failed to perform user action:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Full error object:', error);
      
      let errorMessage = 'Failed to perform action. Please try again.';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data) {
        // Try to extract any error information from the response
        errorMessage = JSON.stringify(error.response.data);
      }
      
      alert(`Error: ${errorMessage}`);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending', icon: Clock },
      investigating: { color: 'bg-blue-100 text-blue-800', label: 'Investigating', icon: Eye },
      resolved: { color: 'bg-green-100 text-green-800', label: 'Resolved', icon: CheckCircle },
      dismissed: { color: 'bg-gray-100 text-gray-800', label: 'Dismissed', icon: XCircle },
      escalated: { color: 'bg-red-100 text-red-800', label: 'Escalated', icon: AlertTriangle }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      low: { color: 'bg-green-100 text-green-800', label: 'Low' },
      medium: { color: 'bg-yellow-100 text-yellow-800', label: 'Medium' },
      high: { color: 'bg-orange-100 text-orange-800', label: 'High' },
      critical: { color: 'bg-red-100 text-red-800', label: 'Critical' }
    };

    const config = priorityConfig[priority] || priorityConfig.medium;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading && reports.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-4" />
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Reports</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pending_reports || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Investigating</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.investigating_reports || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">High Priority</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.high_priority_reports || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Resolved (24h)</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.reports_last_24h || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tabs for Report Types */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('posts')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'posts'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Post Reports
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <User className="w-4 h-4 inline mr-2" />
            User Reports
          </button>
        </nav>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-4 relative">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4 relative">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchReports()}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              />
            </div>
            <div className="relative">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 pr-8 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white min-w-[140px] appearance-none cursor-pointer text-gray-900 text-sm font-medium shadow-sm hover:border-gray-400"
                style={{ 
                  color: '#000000 !important', 
                  backgroundColor: '#ffffff !important',
                  fontSize: '14px',
                  fontWeight: 'normal'
                }}
              >
                <option value="all" style={{ color: '#000000 !important', backgroundColor: '#ffffff !important', padding: '8px 12px' }}>All Status</option>
                <option value="pending" style={{ color: '#000000 !important', backgroundColor: '#ffffff !important', padding: '8px 12px' }}>Pending</option>
                <option value="investigating" style={{ color: '#000000 !important', backgroundColor: '#ffffff !important', padding: '8px 12px' }}>Investigating</option>
                <option value="resolved" style={{ color: '#000000 !important', backgroundColor: '#ffffff !important', padding: '8px 12px' }}>Resolved</option>
                <option value="dismissed" style={{ color: '#000000 !important', backgroundColor: '#ffffff !important', padding: '8px 12px' }}>Dismissed</option>
                <option value="escalated" style={{ color: '#000000 !important', backgroundColor: '#ffffff !important', padding: '8px 12px' }}>Escalated</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {selectedReports.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedReports.length} selected
              </span>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkAction(e.target.value);
                    e.target.value = '';
                  }
                }}
                disabled={actionLoading}
                className="force-visible-dropdown px-3 py-2 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 bg-white min-w-[140px] relative z-10 cursor-pointer appearance-none shadow-sm hover:border-gray-500"
                style={{ 
                  color: 'black !important', 
                  backgroundColor: 'white !important',
                  fontSize: '14px !important',
                  fontWeight: 'normal !important',
                  fontFamily: 'system-ui, -apple-system, sans-serif !important',
                  lineHeight: '1.4 !important',
                  textRendering: 'optimizeLegibility !important',
                  WebkitFontSmoothing: 'antialiased !important',
                  MozOsxFontSmoothing: 'grayscale !important'
                }}
              >
                <option 
                  value="" 
                  style={{ 
                    color: 'black !important', 
                    backgroundColor: 'white !important', 
                    padding: '8px 12px !important',
                    fontSize: '14px !important',
                    fontWeight: 'normal !important'
                  }}
                >
                  Bulk Actions
                </option>
                <option 
                  value="mark_investigating" 
                  style={{ 
                    color: 'black !important', 
                    backgroundColor: 'white !important', 
                    padding: '8px 12px !important',
                    fontSize: '14px !important',
                    fontWeight: 'normal !important'
                  }}
                >
                  Mark as Investigating
                </option>
                <option 
                  value="mark_resolved" 
                  style={{ 
                    color: 'black !important', 
                    backgroundColor: 'white !important', 
                    padding: '8px 12px !important',
                    fontSize: '14px !important',
                    fontWeight: 'normal !important'
                  }}
                >
                  Mark as Resolved
                </option>
                <option 
                  value="mark_dismissed" 
                  style={{ 
                    color: 'black !important', 
                    backgroundColor: 'white !important', 
                    padding: '8px 12px !important',
                    fontSize: '14px !important',
                    fontWeight: 'normal !important'
                  }}
                >
                  Mark as Dismissed
                </option>
                <option 
                  value="set_high_priority" 
                  style={{ 
                    color: 'black !important', 
                    backgroundColor: 'white !important', 
                    padding: '8px 12px !important',
                    fontSize: '14px !important',
                    fontWeight: 'normal !important'
                  }}
                >
                  Set High Priority
                </option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-400">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {reports.length === 0 && !loading ? (
          <div className="p-8 text-center">
            <Flag className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg">No reports found</p>
            <p className="text-gray-500 text-sm mt-2">
              {filter !== 'all' ? `No ${filter} reports at the moment.` : 'No reports have been submitted yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedReports.length === reports.length && reports.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedReports(reports.map(r => r.id));
                        } else {
                          setSelectedReports([]);
                        }
                      }}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Report
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report) => (
                  <React.Fragment key={report.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedReports.includes(report.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedReports([...selectedReports, report.id]);
                            } else {
                              setSelectedReports(selectedReports.filter(id => id !== report.id));
                            }
                          }}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="w-5 h-5 text-gray-500" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              Report #{report.id}
                            </div>
                            <div className="text-sm text-gray-500">
                              by {report.reporter_username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {report.report_type_display || report.report_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(report.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPriorityBadge(report.priority)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(report.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            {expandedReport === report.id ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                          <div className="flex items-center space-x-2">
                            <select
                              value={report.status}
                              onChange={(e) => handleStatusChange(report.id, e.target.value)}
                              disabled={actionLoading}
                              className="force-visible-dropdown px-2 py-1 pr-6 border-2 border-gray-400 rounded bg-white min-w-[100px] cursor-pointer appearance-none shadow-sm hover:border-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:opacity-50"
                              style={{ 
                                color: 'black !important', 
                                backgroundColor: 'white !important',
                                fontSize: '11px !important',
                                fontWeight: 'normal !important',
                                fontFamily: 'system-ui, -apple-system, sans-serif !important',
                                lineHeight: '1.4 !important',
                                textRendering: 'optimizeLegibility !important',
                                WebkitFontSmoothing: 'antialiased !important',
                                MozOsxFontSmoothing: 'grayscale !important'
                              }}
                            >
                              <option 
                                value="pending" 
                                style={{ 
                                  color: 'black !important', 
                                  backgroundColor: 'white !important', 
                                  padding: '6px 8px !important',
                                  fontSize: '11px !important',
                                  fontWeight: 'normal !important'
                                }}
                              >
                                Pending
                              </option>
                              <option 
                                value="investigating" 
                                style={{ 
                                  color: 'black !important', 
                                  backgroundColor: 'white !important', 
                                  padding: '6px 8px !important',
                                  fontSize: '11px !important',
                                  fontWeight: 'normal !important'
                                }}
                              >
                                Investigating
                              </option>
                              <option 
                                value="resolved" 
                                style={{ 
                                  color: 'black !important', 
                                  backgroundColor: 'white !important', 
                                  padding: '6px 8px !important',
                                  fontSize: '11px !important',
                                  fontWeight: 'normal !important'
                                }}
                              >
                                Resolved
                              </option>
                              <option 
                                value="dismissed" 
                                style={{ 
                                  color: 'black !important', 
                                  backgroundColor: 'white !important', 
                                  padding: '6px 8px !important',
                                  fontSize: '11px !important',
                                  fontWeight: 'normal !important'
                                }}
                              >
                                Dismissed
                              </option>
                              <option 
                                value="escalated" 
                                style={{ 
                                  color: 'black !important', 
                                  backgroundColor: 'white !important', 
                                  padding: '6px 8px !important',
                                  fontSize: '11px !important',
                                  fontWeight: 'normal !important'
                                }}
                              >
                                Escalated
                              </option>
                            </select>
                            
                            <select
                              value=""
                              onClick={() => console.log('Dropdown clicked!')}
                              onChange={(e) => {
                                console.log('=== DROPDOWN CHANGE EVENT ===');
                                console.log('Selected value:', e.target.value);
                                console.log('Action loading state:', actionLoading);
                                console.log('Report object:', report);
                                
                                if (e.target.value) {
                                  console.log('About to call handleUserAction...');
                                  handleUserAction(report, e.target.value);
                                } else {
                                  console.log('No value selected, skipping action');
                                }
                              }}
                              disabled={actionLoading}
                              className="force-visible-dropdown px-2 py-1 pr-6 border-2 border-red-300 bg-red-50 rounded min-w-[100px] cursor-pointer appearance-none shadow-sm hover:border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200 disabled:opacity-50"
                              style={{ 
                                color: 'black !important', 
                                backgroundColor: '#fef2f2 !important',
                                fontSize: '11px !important',
                                fontWeight: 'normal !important',
                                fontFamily: 'system-ui, -apple-system, sans-serif !important',
                                lineHeight: '1.4 !important',
                                textRendering: 'optimizeLegibility !important',
                                WebkitFontSmoothing: 'antialiased !important',
                                MozOsxFontSmoothing: 'grayscale !important'
                              }}
                            >
                              <option 
                                value="" 
                                style={{ 
                                  color: 'black !important', 
                                  backgroundColor: 'white !important', 
                                  padding: '6px 8px !important',
                                  fontSize: '11px !important',
                                  fontWeight: 'normal !important'
                                }}
                              >
                                User Actions
                              </option>
                              <option 
                                value="warn" 
                                style={{ 
                                  color: 'black !important', 
                                  backgroundColor: 'white !important', 
                                  padding: '6px 8px !important',
                                  fontSize: '11px !important',
                                  fontWeight: 'normal !important'
                                }}
                              >
                                ⚠️ Warn User
                              </option>
                              <option 
                                value="temp_ban" 
                                style={{ 
                                  color: 'black !important', 
                                  backgroundColor: 'white !important', 
                                  padding: '6px 8px !important',
                                  fontSize: '11px !important',
                                  fontWeight: 'normal !important'
                                }}
                              >
                                ⏰ Temporary Ban
                              </option>
                              <option 
                                value="permanent_ban" 
                                style={{ 
                                  color: 'black !important', 
                                  backgroundColor: 'white !important', 
                                  padding: '6px 8px !important',
                                  fontSize: '11px !important',
                                  fontWeight: 'normal !important'
                                }}
                              >
                                🚫 Permanent Ban
                              </option>
                            </select>
                          </div>
                        </div>
                      </td>
                    </tr>
                    {expandedReport === report.id && (
                      <tr>
                        <td colSpan="7" className="px-6 py-4 bg-gray-50">
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-2">Report Details</h4>
                              <p className="text-sm text-gray-700">{report.reason}</p>
                              {report.additional_context && (
                                <div className="mt-2">
                                  <p className="text-xs text-gray-500">Additional Context:</p>
                                  <p className="text-sm text-gray-700">{report.additional_context}</p>
                                </div>
                              )}
                            </div>
                            
                            {activeTab === 'posts' && report.post_content_preview && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-2">Reported Content</h4>
                                <div className="bg-white p-3 rounded border border-gray-200">
                                  <p className="text-sm text-gray-700">{report.post_content_preview}</p>
                                  {report.post_title && (
                                    <p className="text-xs text-gray-500 mt-1">Post: "{report.post_title}"</p>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {report.admin_notes && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-2">Admin Notes</h4>
                                <p className="text-sm text-gray-700">{report.admin_notes}</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportManagementTab;