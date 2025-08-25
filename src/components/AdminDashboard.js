// src/components/AdminDashboard.js - Responsive Enhanced Version
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import {
  Shield, CheckCircle, XCircle, Clock, Star, Users, Building,
  Eye, Edit, Trash2, Search, Filter, Calendar, MapPin,
  AlertCircle, CheckSquare, X, RefreshCw, Menu, ChevronDown
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('pending'); // 'all', 'pending', 'approved', 'featured'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStartups, setSelectedStartups] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isBulkActionsOpen, setIsBulkActionsOpen] = useState(false);

  useEffect(() => {
    fetchStartups();
  }, [filter]);

  const fetchStartups = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 Fetching startups with params:', { filter, searchTerm });
      console.log('🔗 Making request to:', '/startups/admin/');
      console.log('🔑 Auth token:', localStorage.getItem('auth_token') ? 'Present' : 'Missing');
      console.log('👤 Current user:', user);
      
      // Fetch all startups (both approved and unapproved)
      const response = await api.get('/api/startups/admin/', {
        params: {
          filter: filter,
          search: searchTerm
        }
      });
      
      console.log('✅ Response received:', response.data);
      console.log('📊 Startups count:', response.data.results?.length || response.data.length || 0);
      
      const startupsData = response.data.results || response.data;
      setStartups(Array.isArray(startupsData) ? startupsData : []);
      
      // Log each startup's approval status
      if (Array.isArray(startupsData)) {
        startupsData.forEach(startup => {
          console.log(`📝 Startup: ${startup.name} | Approved: ${startup.is_approved} | Featured: ${startup.is_featured} | Submitted by: ${startup.submitted_by?.username || 'Unknown'}`);
        });
      }
      
    } catch (error) {
      console.error('❌ Error fetching startups:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      
      let errorMessage = 'Failed to load startups. Please try again.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication required. Please log in again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. You need admin permissions to view this page.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Admin endpoint not found. Please check your server configuration.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalAction = async (startupId, action) => {
    setActionLoading(true);
    try {
      console.log(`🔄 Performing action '${action}' on startup ${startupId}`);
      
      await api.patch(`/api/startups/${startupId}/admin/`, {
        action: action // 'approve', 'reject', 'feature', 'unfeature'
      });
      
      console.log(`✅ Action '${action}' completed successfully`);
      
      // Refresh the list
      fetchStartups();
      
      // Clear selection if startup was in selected list
      setSelectedStartups(prev => prev.filter(id => id !== startupId));
    } catch (error) {
      console.error(`❌ Error performing action '${action}':`, error);
      setError(`Failed to ${action} startup. Please try again.`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedStartups.length === 0) return;
    
    setActionLoading(true);
    try {
      console.log(`🔄 Performing bulk action '${action}' on ${selectedStartups.length} startups`);
      
      await api.post('/api/startups/bulk-admin/', {
        startup_ids: selectedStartups,
        action: action
      });
      
      console.log(`✅ Bulk action '${action}' completed successfully`);
      
      // Refresh the list
      fetchStartups();
      setSelectedStartups([]);
    } catch (error) {
      console.error(`❌ Error with bulk action '${action}':`, error);
      setError(`Failed to ${action} selected startups. Please try again.`);
    } finally {
      setActionLoading(false);
    }
  };

  const toggleStartupSelection = (startupId) => {
    setSelectedStartups(prev => 
      prev.includes(startupId) 
        ? prev.filter(id => id !== startupId)
        : [...prev, startupId]
    );
  };

  const selectAllVisible = () => {
    setSelectedStartups(startups.map(startup => startup.id));
  };

  const clearSelection = () => {
    setSelectedStartups([]);
  };

  const filteredStartups = startups.filter(startup =>
    startup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    startup.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (startup) => {
    if (startup.is_approved) {
      return startup.is_featured ? 
        <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" /> : 
        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />;
    }
    return <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />;
  };

  const getStatusText = (startup) => {
    if (startup.is_approved) {
      return startup.is_featured ? 'Featured' : 'Approved';
    }
    return 'Pending';
  };

  const getStatusColor = (startup) => {
    if (startup.is_approved) {
      return startup.is_featured ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800';
    }
    return 'bg-orange-100 text-orange-800';
  };

  // Check if user is admin/staff
  if (!user?.is_staff && !user?.is_superuser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full">
          <Shield className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to access the admin panel.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-4 border-blue-300 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm sm:text-base">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-blue-600 flex-shrink-0" />
                <span className="truncate">Admin Dashboard</span>
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage startup submissions and approvals</p>
            </div>
            
            <button
              onClick={fetchStartups}
              disabled={loading}
              className="flex items-center px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm sm:text-base transition-colors flex-shrink-0"
            >
              <RefreshCw className={`w-4 h-4 mr-1 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
              <span className="sm:hidden">Refresh</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-start">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <span className="text-red-700 text-sm sm:text-base flex-1">{error}</span>
              <button 
                onClick={() => setError(null)}
                className="ml-2 text-red-500 hover:text-red-700 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}


        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-4 sm:mb-6">
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className="flex items-center justify-between w-full px-3 py-2 text-left text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Filters & Search
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isFiltersOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <div className={`space-y-4 ${!isFiltersOpen ? 'hidden lg:block' : 'block'}`}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              {/* Filter Dropdown and Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 flex-1">
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <Filter className="w-4 h-4 text-gray-500 hidden sm:block" />
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900"
                  >
                    <option value="all">All Startups</option>
                    <option value="pending">Pending Approval</option>
                    <option value="approved">Approved</option>
                    <option value="featured">Featured</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2 flex-1">
                  <Search className="w-4 h-4 text-gray-500 hidden sm:block flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search startups..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900"
                  />
                </div>
              </div>

              {/* Bulk Actions - Mobile */}
              {selectedStartups.length > 0 && (
                <div className="lg:hidden">
                  <button
                    onClick={() => setIsBulkActionsOpen(!isBulkActionsOpen)}
                    className="flex items-center justify-between w-full px-3 py-2 text-left text-gray-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <span className="text-sm font-medium">
                      {selectedStartups.length} selected
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isBulkActionsOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isBulkActionsOpen && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg space-y-2">
                      <button
                        onClick={() => handleBulkAction('approve')}
                        disabled={actionLoading}
                        className="w-full px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        Approve Selected
                      </button>
                      <button
                        onClick={() => handleBulkAction('reject')}
                        disabled={actionLoading}
                        className="w-full px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        Reject Selected
                      </button>
                      <button
                        onClick={clearSelection}
                        className="w-full px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700"
                      >
                        Clear Selection
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Bulk Actions - Desktop */}
              {selectedStartups.length > 0 && (
                <div className="hidden lg:flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {selectedStartups.length} selected
                  </span>
                  <button
                    onClick={() => handleBulkAction('approve')}
                    disabled={actionLoading}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleBulkAction('reject')}
                    disabled={actionLoading}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    onClick={clearSelection}
                    className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Startups List */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <h2 className="text-lg font-semibold text-gray-900">
                Startup Submissions ({filteredStartups.length})
              </h2>
              <div className="flex items-center space-x-2 text-sm">
                <button
                  onClick={selectAllVisible}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Select All
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={clearSelection}
                  className="text-gray-600 hover:text-gray-700"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>

          {/* Mobile View - Card Layout */}
          <div className="block lg:hidden">
            {filteredStartups.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {filteredStartups.map((startup) => (
                  <div key={startup.id} className={`p-4 ${selectedStartups.includes(startup.id) ? 'bg-blue-50' : ''}`}>
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedStartups.includes(startup.id)}
                        onChange={() => toggleStartupSelection(startup.id)}
                        className="mt-1 rounded border-gray-300 flex-shrink-0"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2 min-w-0 flex-1">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                              {startup.logo}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-gray-900 truncate">{startup.name}</div>
                              <div className="text-xs text-gray-500 flex items-center">
                                <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                                <span className="truncate">{startup.location}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center ml-2">
                            {getStatusIcon(startup)}
                            <span className={`ml-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(startup)}`}>
                              {getStatusText(startup)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-xs text-gray-600 mb-2">
                          <span className="font-medium">{startup.industry_name || startup.industry?.name}</span>
                        </div>
                        
                        <div className="flex items-center text-xs text-gray-500 space-x-3 mb-3">
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(startup.created_at).toLocaleDateString()}
                          </span>
                          <span className="flex items-center">
                            <Users className="w-3 h-3 mr-1" />
                            {startup.submitted_by?.username || startup.submitted_by?.email || 'Unknown'}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {!startup.is_approved && (
                            <button
                              onClick={() => handleApprovalAction(startup.id, 'approve')}
                              disabled={actionLoading}
                              className="flex items-center px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Approve
                            </button>
                          )}
                          
                          {startup.is_approved && !startup.is_featured && (
                            <button
                              onClick={() => handleApprovalAction(startup.id, 'feature')}
                              disabled={actionLoading}
                              className="flex items-center px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 disabled:opacity-50"
                            >
                              <Star className="w-3 h-3 mr-1" />
                              Feature
                            </button>
                          )}
                          
                          {startup.is_featured && (
                            <button
                              onClick={() => handleApprovalAction(startup.id, 'unfeature')}
                              disabled={actionLoading}
                              className="flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                            >
                              <Star className="w-3 h-3 mr-1 fill-current" />
                              Unfeature
                            </button>
                          )}
                          
                          {startup.is_approved && (
                            <button
                              onClick={() => handleApprovalAction(startup.id, 'reject')}
                              disabled={actionLoading}
                              className="flex items-center px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Reject
                            </button>
                          )}
                          
                          <a
                            href={`/startups/${startup.id}`}
                            className="flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 px-4">
                <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No startups found</h3>
                <p className="text-gray-500 text-sm">
                  {startups.length === 0 
                    ? "No startups have been submitted yet." 
                    : "No startups match your current filter criteria."
                  }
                </p>
              </div>
            )}
          </div>

          {/* Desktop View - Table Layout */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedStartups.length === filteredStartups.length && filteredStartups.length > 0}
                      onChange={selectedStartups.length === filteredStartups.length ? clearSelection : selectAllVisible}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Startup
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Industry
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStartups.map((startup) => (
                  <tr key={startup.id} className={selectedStartups.includes(startup.id) ? 'bg-blue-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedStartups.includes(startup.id)}
                        onChange={() => toggleStartupSelection(startup.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center text-lg">
                            {startup.logo}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{startup.name}</div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {startup.location}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{startup.industry_name || startup.industry?.name}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(startup)}
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(startup)}`}>
                          {getStatusText(startup)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(startup.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        {startup.submitted_by?.username || startup.submitted_by?.email || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {!startup.is_approved && (
                          <button
                            onClick={() => handleApprovalAction(startup.id, 'approve')}
                            disabled={actionLoading}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        
                        {startup.is_approved && !startup.is_featured && (
                          <button
                            onClick={() => handleApprovalAction(startup.id, 'feature')}
                            disabled={actionLoading}
                            className="text-yellow-600 hover:text-yellow-900 disabled:opacity-50"
                            title="Feature"
                          >
                            <Star className="w-4 h-4" />
                          </button>
                        )}
                        
                        {startup.is_featured && (
                          <button
                            onClick={() => handleApprovalAction(startup.id, 'unfeature')}
                            disabled={actionLoading}
                            className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
                            title="Remove Featured"
                          >
                            <Star className="w-4 h-4 fill-current" />
                          </button>
                        )}
                        
                        {startup.is_approved && (
                          <button
                            onClick={() => handleApprovalAction(startup.id, 'reject')}
                            disabled={actionLoading}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        
                        <a
                          href={`/startups/${startup.id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredStartups.length === 0 && !loading && (
            <div className="text-center py-12 px-4">
              <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No startups found</h3>
              <p className="text-gray-500">
                {startups.length === 0 
                  ? "No startups have been submitted yet." 
                  : "No startups match your current filter criteria."
                }
              </p>
              {filter === 'pending' && startups.length === 0 && (
                <p className="text-sm text-gray-400 mt-2">
                  Try switching to "All Startups" to see if any have been submitted.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;