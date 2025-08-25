// src/components/JobsApplied.js - Jobs Applied Page
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from '../config/axios';
import { 
  Briefcase, Building, MapPin, Clock, DollarSign, 
  Calendar, Eye, ExternalLink, AlertCircle, CheckCircle,
  RefreshCw, Search, Filter, ArrowLeft, FileText,
  Mail, Phone, Download, Star, XCircle
} from 'lucide-react';

const JobsApplied = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('-applied_at');

  const statusOptions = [
    { value: 'all', label: 'All Applications', count: 0 },
    { value: 'pending', label: 'Pending Review', count: 0 },
    { value: 'reviewed', label: 'Under Review', count: 0 },
    { value: 'interview', label: 'Interview Stage', count: 0 },
    { value: 'accepted', label: 'Accepted', count: 0 },
    { value: 'rejected', label: 'Not Selected', count: 0 }
  ];

  const sortOptions = [
    { value: '-applied_at', label: 'Recently Applied' },
    { value: 'applied_at', label: 'Oldest First' },
    { value: 'job__title', label: 'Job Title A-Z' },
    { value: '-job__title', label: 'Job Title Z-A' },
    { value: 'job__startup__name', label: 'Company A-Z' },
    { value: '-job__startup__name', label: 'Company Z-A' }
  ];

  useEffect(() => {
    loadApplications();
  }, [sortBy]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`/api/jobs/my_applications/?ordering=${sortBy}`);
      setApplications(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error loading job applications:', error);
      setError('Failed to load your job applications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusCounts = () => {
    const counts = { all: applications.length };
    applications.forEach(app => {
      counts[app.status] = (counts[app.status] || 0) + 1;
    });
    return counts;
  };

  const getFilteredApplications = () => {
    let filtered = applications;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(app => 
        app.job?.title?.toLowerCase().includes(search) ||
        app.job?.startup?.name?.toLowerCase().includes(search) ||
        app.job?.location?.toLowerCase().includes(search)
      );
    }

    return filtered;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'reviewed':
        return <Eye className="w-4 h-4 text-blue-500" />;
      case 'interview':
        return <Star className="w-4 h-4 text-purple-500" />;
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending Review';
      case 'reviewed':
        return 'Under Review';
      case 'interview':
        return 'Interview Stage';
      case 'accepted':
        return 'Accepted';
      case 'rejected':
        return 'Not Selected';
      default:
        return 'Unknown';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'interview':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const ApplicationCard = ({ application }) => {
    const job = application.job;
    const startup = job?.startup || {};
    
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 p-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
          {/* Job Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-3">
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {job?.title || 'Job Title Not Available'}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Building className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700 font-medium">
                    {startup.name || 'Company Name Not Available'}
                  </span>
                </div>
              </div>
              
              {/* Status Badge */}
              <div className="flex items-center gap-2 ml-4">
                {getStatusIcon(application.status)}
                <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusBadgeClass(application.status)}`}>
                  {getStatusLabel(application.status)}
                </span>
              </div>
            </div>

            {/* Job Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-gray-600 mb-4">
              {job?.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{job.location}</span>
                  {job?.is_remote && (
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-600 text-xs rounded-full border border-purple-200">
                      Remote
                    </span>
                  )}
                </div>
              )}
              
              {job?.salary_range && (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{job.salary_range}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span>Applied {formatDate(application.applied_at)}</span>
              </div>
            </div>

            {/* Application Details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Your Application</h4>
              
              {application.cover_letter && (
                <div className="mb-3">
                  <p className="text-sm text-gray-700 line-clamp-3">
                    {application.cover_letter}
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {application.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700 truncate">{application.email}</span>
                  </div>
                )}
                
                {application.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">{application.phone}</span>
                  </div>
                )}
                
                {application.resume && (
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <a 
                      href={application.resume}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 underline truncate"
                    >
                      View Resume
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to={`/jobs/${job?.id}`}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Job
              </Link>
              
              {startup.id && (
                <Link
                  to={`/startups/${startup.id}`}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Building className="w-4 h-4 mr-2" />
                  View Company
                </Link>
              )}
              
              {application.resume && (
                <a
                  href={application.resume}
                  download
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Resume
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const filteredApplications = getFilteredApplications();
  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your job applications...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Applications</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={loadApplications}
              className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Job Applications</h1>
              <p className="text-gray-600 mt-1">Track the status of all your job applications</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            
            {/* Search and Status Filter */}
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search jobs, companies..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status ({statusCounts.all})</option>
                <option value="pending">Pending ({statusCounts.pending || 0})</option>
                <option value="reviewed">Under Review ({statusCounts.reviewed || 0})</option>
                <option value="interview">Interview ({statusCounts.interview || 0})</option>
                <option value="accepted">Accepted ({statusCounts.accepted || 0})</option>
                <option value="rejected">Not Selected ({statusCounts.rejected || 0})</option>
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[160px]"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Applications List */}
        {filteredApplications.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 sm:p-12">
              <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {searchTerm || statusFilter !== 'all' ? 'No matching applications found' : 'No job applications yet'}
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search terms or filters to find your applications.'
                  : 'Start applying to jobs to see your applications here. Browse available opportunities to get started.'
                }
              </p>
              {(!searchTerm && statusFilter === 'all') && (
                <Link
                  to="/jobs"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Browse Jobs
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredApplications.map(application => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobsApplied;