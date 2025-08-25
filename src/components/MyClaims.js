// src/components/MyClaims.js - Fully Responsive Mobile-Optimized Version
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { 
  Shield, Building, Clock, CheckCircle, XCircle, 
  AlertCircle, Mail, User, Eye, RefreshCw, Filter,
  ExternalLink, Calendar, MapPin, ChevronDown, Menu, X
} from 'lucide-react';

const MyClaims = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected, expired
  const [refreshing, setRefreshing] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    fetchClaims();
  }, [filter]);

  const fetchClaims = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 Fetching claims with filter:', filter);
      
      const params = filter !== 'all' ? { status: filter } : {};
      console.log('📤 Request params:', params);
      
      const response = await api.startups.getMyClaims(params);
      
      console.log('✅ Claims fetched:', response);
      console.log('📊 Number of claims:', Array.isArray(response) ? response.length : (response.results ? response.results.length : 'unknown'));
      
      const claimsData = response.results || response;
      setClaims(Array.isArray(claimsData) ? claimsData : []);
      
      if (Array.isArray(claimsData) && claimsData.length === 0) {
        console.log('⚠️ No claims found for current user');
      }
    } catch (error) {
      console.error('❌ Error fetching claims:', error);
      console.error('❌ Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      setError('Failed to load your claims. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchClaims();
    setRefreshing(false);
  };

  const getStatusIcon = (claim) => {
    switch (claim.status) {
      case 'pending':
        return claim.email_verified ? 
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" /> : 
          <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />;
      case 'expired':
        return <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (claim) => {
    switch (claim.status) {
      case 'pending':
        return claim.email_verified ? 
          'bg-orange-100 text-orange-800 border-orange-200' : 
          'bg-blue-100 text-blue-800 border-blue-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'expired':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (claim) => {
    switch (claim.status) {
      case 'pending':
        return claim.email_verified ? 'Pending Admin Review' : 'Email Verification Required';
      case 'approved':
        return 'Claim Approved';
      case 'rejected':
        return 'Claim Rejected';
      case 'expired':
        return 'Verification Expired';
      default:
        return claim.status;
    }
  };

  const filteredClaims = claims.filter(claim => {
    if (filter === 'all') return true;
    return claim.status === filter;
  });

  const getFilterCount = (status) => {
    if (status === 'all') return claims.length;
    return claims.filter(claim => claim.status === status).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-4 border-blue-300 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm sm:text-base">Loading your claims...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-orange-600 flex-shrink-0" />
                <span className="truncate">My Startup Claims</span>
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Track your requests to claim ownership of startup profiles</p>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm sm:text-base flex-shrink-0"
            >
              <RefreshCw className={`w-4 h-4 mr-1 sm:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-start">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <span className="text-red-700 text-sm sm:text-base flex-1">{error}</span>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm border mb-4 sm:mb-6">
          {/* Mobile Filter Toggle */}
          <div className="sm:hidden p-4">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center justify-between w-full px-3 py-2 text-left text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="flex items-center text-sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter Claims ({getFilterCount(filter)})
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isFilterOpen && (
              <div className="mt-3 space-y-2">
                {[
                  { key: 'all', label: 'All Claims', count: getFilterCount('all') },
                  { key: 'pending', label: 'Pending', count: getFilterCount('pending') },
                  { key: 'approved', label: 'Approved', count: getFilterCount('approved') },
                  { key: 'rejected', label: 'Rejected', count: getFilterCount('rejected') },
                  { key: 'expired', label: 'Expired', count: getFilterCount('expired') }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setFilter(tab.key);
                      setIsFilterOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === tab.key
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {tab.label}
                    {tab.count > 0 && (
                      <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                        filter === tab.key
                          ? 'bg-orange-200 text-orange-800'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Desktop Filter Tabs */}
          <div className="hidden sm:block border-b border-gray-200">
            <nav className="flex space-x-8 px-6 overflow-x-auto">
              {[
                { key: 'all', label: 'All Claims', count: getFilterCount('all') },
                { key: 'pending', label: 'Pending', count: getFilterCount('pending') },
                { key: 'approved', label: 'Approved', count: getFilterCount('approved') },
                { key: 'rejected', label: 'Rejected', count: getFilterCount('rejected') },
                { key: 'expired', label: 'Expired', count: getFilterCount('expired') }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    filter === tab.key
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                      filter === tab.key
                        ? 'bg-orange-100 text-orange-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Claims List */}
        <div className="space-y-3 sm:space-y-4">
          {filteredClaims.length > 0 ? (
            filteredClaims.map((claim) => (
              <div key={claim.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow overflow-hidden">
                <div className="p-4 sm:p-6 break-words">
                  <div className="flex flex-col space-y-4">
                    {/* Header */}
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      {/* Startup Logo/Icon */}
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      
                      {/* Claim Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 mb-3">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                            {claim.startup_name}
                          </h3>
                          <div className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(claim)} flex-shrink-0`}>
                            {getStatusIcon(claim)}
                            <span className="ml-1 hidden sm:inline">{getStatusText(claim)}</span>
                            <span className="ml-1 sm:hidden">
                              {claim.status === 'pending' && !claim.email_verified ? 'Verify Email' :
                               claim.status === 'pending' && claim.email_verified ? 'Under Review' :
                               claim.status === 'approved' ? 'Approved' :
                               claim.status === 'rejected' ? 'Rejected' : 'Expired'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600 min-w-0">
                          <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span className="truncate flex-1">{claim.email}</span>
                          {claim.email_verified && (
                            <CheckCircle className="w-4 h-4 ml-1 text-green-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center text-sm text-gray-600 min-w-0">
                          <User className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span className="truncate flex-1">{claim.position}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span>Submitted {claim.time_ago || new Date(claim.created_at).toLocaleDateString()}</span>
                        </div>
                        {claim.startup_domain && claim.email_domain_valid !== undefined && (
                          <div className="flex items-center text-sm min-w-0">
                            <span className={`flex items-center min-w-0 ${
                              claim.email_domain_valid ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {claim.email_domain_valid ? 
                                <CheckCircle className="w-4 h-4 mr-1 flex-shrink-0" /> : 
                                <XCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                              }
                              <span className="truncate">Domain {claim.email_domain_valid ? 'verified' : 'mismatch'}</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Reason */}
                    <div className="min-w-0">
                      <p className="text-sm text-gray-700 leading-relaxed break-words hyphens-auto">
                        <strong>Reason:</strong> {claim.reason}
                      </p>
                    </div>
                    
                    {/* Review Notes (if rejected) */}
                    {claim.status === 'rejected' && claim.review_notes && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 min-w-0">
                        <p className="text-sm text-red-700 break-words hyphens-auto">
                          <strong>Admin Notes:</strong> {claim.review_notes}
                        </p>
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 pt-3 border-t border-gray-100">
                      <div className="flex flex-wrap items-center gap-3">
                        <Link
                          to={`/startups/${claim.startup}`}
                          className="inline-flex items-center px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Startup
                        </Link>
                        
                        {claim.status === 'approved' && (
                          <Link
                            to={`/startups/${claim.startup}/edit`}
                            className="inline-flex items-center px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium"
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            Edit Startup
                          </Link>
                        )}
                      </div>
                      
                      {claim.status === 'pending' && !claim.email_verified && (
                        <span className="inline-flex items-center px-3 py-1.5 text-sm text-orange-600 font-medium bg-orange-50 rounded-lg">
                          <Mail className="w-4 h-4 mr-1" />
                          Check your email to verify
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow-sm border p-8 sm:p-12 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === 'all' ? 'No claims yet' : `No ${filter} claims`}
              </h3>
              <p className="text-gray-600 max-w-md mx-auto mb-6 text-sm sm:text-base">
                {filter === 'all' 
                  ? "You haven't submitted any startup claim requests yet. Visit a startup page and click 'Claim This Company' to get started."
                  : `You don't have any ${filter} claim requests.`
                }
              </p>
              {filter === 'all' && (
                <Link
                  to="/startups"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                >
                  <Building className="w-4 h-4 mr-2" />
                  Browse Startups
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 sm:mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
          <h4 className="font-medium text-blue-900 mb-3 text-sm sm:text-base">How Startup Claims Work</h4>
          <div className="space-y-2 text-xs sm:text-sm text-blue-700">
            <div className="flex items-start">
              <span className="inline-block w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 text-blue-600 rounded-full text-xs flex items-center justify-center mt-0.5 mr-2 sm:mr-3 flex-shrink-0">1</span>
              <p>Submit a claim request using your company email address</p>
            </div>
            <div className="flex items-start">
              <span className="inline-block w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 text-blue-600 rounded-full text-xs flex items-center justify-center mt-0.5 mr-2 sm:mr-3 flex-shrink-0">2</span>
              <p>Verify your email address by clicking the verification link</p>
            </div>
            <div className="flex items-start">
              <span className="inline-block w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 text-blue-600 rounded-full text-xs flex items-center justify-center mt-0.5 mr-2 sm:mr-3 flex-shrink-0">3</span>
              <p>Wait for admin review and approval</p>
            </div>
            <div className="flex items-start">
              <span className="inline-block w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 text-blue-600 rounded-full text-xs flex items-center justify-center mt-0.5 mr-2 sm:mr-3 flex-shrink-0">4</span>
              <p>Once approved, you can edit and manage the startup profile</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyClaims;