// src/components/Jobs.js - Enhanced Responsive Design for All Screen Sizes
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from '../config/axios';
import SearchBar from './SearchBar';
import FilterChips from './FilterChips';
import JobApplicationModal from './JobApplicationModal';
import JobUploadForm from './JobUploadForm';
import useSearch from '../hooks/useSearch';
import Pagination from './Pagination';
import { useNotifications } from './NotificationSystem';
import { 
  MapPin, Clock, DollarSign, Users, Building, Briefcase, 
  AlertCircle, CheckCircle, Filter, Grid, List, RefreshCw, 
  Bookmark, Eye, Share2, Globe, Target, Plus, Sparkles, 
  Zap, Search, X, Crown, Shield, SlidersHorizontal, Grid3X3
} from 'lucide-react';

const Jobs = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const { success, error } = useNotifications();
  const [filterOptions, setFilterOptions] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [sortBy, setSortBy] = useState('-posted_at');
  const [viewMode, setViewMode] = useState('list');
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showJobUploadForm, setShowJobUploadForm] = useState(false);
  const [appliedJobs, setAppliedJobs] = useState(new Set());
  const [bookmarkedJobs, setBookmarkedJobs] = useState(new Set());
  const [likedJobs, setLikedJobs] = useState(new Set());
  const [refreshing, setRefreshing] = useState(false);
  
  // Search hook for managing search state
  const {
    results: jobs,
    loading,
    error: searchError,
    filters,
    totalResults,
    hasNextPage,
    currentPage,
    updateFilters,
    resetFilters,
    removeFilter,
    loadMore,
    goToPage,
    search,
    updateResults
  } = useSearch('/api/jobs/', { status: 'active' }); // Only show approved/active jobs

  // Load filter options and user data on component mount
  useEffect(() => {
    loadFilterOptions();
    loadAppliedJobs();
    loadUserJobInteractions();
  }, []);

  // Handle opening job upload form from navigation state or custom events
  useEffect(() => {
    // Check if we should open the job form from navigation state
    if (location.state?.openJobForm) {
      setShowJobUploadForm(true);
      // Clear the state to prevent reopening on refresh
      navigate(location.pathname, { replace: true });
    }

    // Listen for custom event from navbar
    const handleOpenJobForm = () => {
      setShowJobUploadForm(true);
    };

    window.addEventListener('openJobUploadForm', handleOpenJobForm);

    return () => {
      window.removeEventListener('openJobUploadForm', handleOpenJobForm);
    };
  }, [location, navigate]);

  const loadFilterOptions = async () => {
    try {
      const response = await axios.get('/api/jobs/filters/');
      setFilterOptions(response.data);
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  const loadAppliedJobs = async () => {
    try {
      const response = await axios.get('/api/jobs/my_applications/');
      const appliedJobIds = new Set(response.data.map(app => app.job));
      setAppliedJobs(appliedJobIds);
    } catch (error) {
      console.error('Error loading applied jobs:', error);
    }
  };

  const loadUserJobInteractions = async () => {
    try {
      // Load bookmarked jobs
      const bookmarksResponse = await axios.get('/api/jobs/bookmarks/');
      const bookmarkedJobIds = new Set();
      
      if (bookmarksResponse.data) {
        const bookmarks = bookmarksResponse.data.results || bookmarksResponse.data || [];
        bookmarks.forEach(bookmark => {
          const job = bookmark.job || bookmark;
          if (job && job.id) {
            bookmarkedJobIds.add(job.id);
          }
        });
      }
      
      setBookmarkedJobs(bookmarkedJobIds);
      setLikedJobs(new Set()); // Keep liked jobs empty for now
    } catch (error) {
      console.error('Error loading user interactions:', error);
      setBookmarkedJobs(new Set());
      setLikedJobs(new Set());
    }
  };

  const refreshJobs = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadFilterOptions(),
        loadAppliedJobs(),
        loadUserJobInteractions()
      ]);
      search(filters);
      // Don't show popup notification for refresh
    } catch (error) {
      console.error('Error refreshing jobs:', error);
      error('Failed to refresh jobs');
    } finally {
      setRefreshing(false);
    }
  };

  // Handle search input
  const handleSearch = (searchTerm) => {
    updateFilters({ search: searchTerm });
  };

  // Handle filter changes
  const handleFilterChange = (filterKey, value) => {
    updateFilters({ [filterKey]: value });
  };

  // Handle sorting
  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    updateFilters({ ordering: newSortBy });
  };

  // Handle job application
  const handleApply = (job) => {
    if (appliedJobs.has(job.id)) {
      error('You have already applied to this job');
      return;
    }
    setSelectedJob(job);
    setShowApplicationModal(true);
  };

  // Handle successful application submission
  const handleApplicationSubmitted = (applicationData) => {
    setAppliedJobs(prev => new Set([...prev, selectedJob.id]));
    setShowApplicationModal(false);
    setSelectedJob(null);
    // Don't show popup notification - user already sees modal confirmation
  };

  // Handle application modal close
  const handleApplicationModalClose = () => {
    setShowApplicationModal(false);
    setSelectedJob(null);
  };

  // Handle job upload success
  const handleJobUploadSuccess = (jobData) => {
    setShowJobUploadForm(false);
    // Don't show popup notification - form already shows success message
    refreshJobs();
  };

  // Handle job sharing
  const handleShare = (job) => {
    if (navigator.share) {
      navigator.share({
        title: `${job.title} at ${job.startup_name}`,
        text: `Check out this job opportunity: ${job.title} at ${job.startup_name}`,
        url: window.location.href
      });
    } else {
      const shareText = `${job.title} at ${job.startup_name} - ${window.location.href}`;
      navigator.clipboard.writeText(shareText).then(() => {
        console.log('Job link copied to clipboard');
      });
    }
  };

  // Handle job bookmarking
  const handleBookmark = async (jobId) => {
    try {
      const isBookmarked = bookmarkedJobs.has(jobId);
      
      // Make API call to toggle bookmark using appropriate HTTP method
      if (isBookmarked) {
        await axios.delete(`/jobs/${jobId}/bookmark/`);
        setBookmarkedJobs(prev => {
          const newSet = new Set(prev);
          newSet.delete(jobId);
          return newSet;
        });
        console.log('Job removed from bookmarks');
      } else {
        await axios.post(`/jobs/${jobId}/bookmark/`);
        setBookmarkedJobs(prev => new Set([...prev, jobId]));
        console.log('Job bookmarked successfully');
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      // Don't show error notification, just log it
    }
  };

  // Filter labels for chips
  const filterLabels = {
    search: 'Search',
    job_type: 'Job Type',
    experience_level: 'Experience',
    location: 'Location',
    is_remote: 'Remote',
    is_urgent: 'Urgent',
    industry: 'Industry',
    posted_since: 'Posted Since',
    skills: 'Skills',
    min_employees: 'Min Company Size',
    max_employees: 'Max Company Size'
  };

  // Sorting options
  const sortOptions = [
    { value: '-posted_at', label: 'Newest First' },
    { value: 'posted_at', label: 'Oldest First' },
    { value: 'title', label: 'Title A-Z' },
    { value: '-title', label: 'Title Z-A' },
    { value: '-application_count', label: 'Most Popular' },
    { value: 'application_count', label: 'Least Popular' },
    { value: '-startup__employee_count', label: 'Largest Companies' },
    { value: 'startup__employee_count', label: 'Smallest Companies' }
  ];

  const JobCard = ({ job, isGrid = false }) => {
    const hasApplied = appliedJobs.has(job.id);
    const isBookmarked = bookmarkedJobs.has(job.id);
    const isLiked = likedJobs.has(job.id);
    
    // Check if current user can edit this job
    const canEdit = user && (
      user.is_staff || 
      user.is_superuser || 
      job.posted_by === user.id ||
      job.posted_by?.id === user.id
    );

    const handleCardClick = (e) => {
      if (e.target.closest('button') || e.target.closest('a')) {
        return;
      }
      navigate(`/jobs/${job.id}`);
    };
    
    if (isGrid) {
      return (
        <div 
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 hover:shadow-md transition-all duration-300 cursor-pointer group transform hover:-translate-y-1"
          onClick={handleCardClick}
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center flex-wrap gap-2 mb-2">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                  {job.title}
                </h3>
                {job.is_urgent && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full border border-red-200 whitespace-nowrap">
                    Urgent
                  </span>
                )}
                {hasApplied && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full border border-green-200 whitespace-nowrap">
                    Applied
                  </span>
                )}
                {canEdit && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full border border-purple-200 whitespace-nowrap">
                    Can Edit
                  </span>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Building className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{job.startup_name}</span>
                </span>
                <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg border border-blue-200 text-xs font-medium self-start">
                  {job.startup_industry}
                </span>
              </div>
            </div>
          </div>
          
          <p className="text-gray-600 mb-4 text-sm line-clamp-3">{job.description}</p>
          
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-600 truncate">{job.location}</span>
                {job.is_remote && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-600 text-xs rounded-full border border-purple-200 whitespace-nowrap">
                    Remote
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-600 truncate">{job.salary_range || 'Not specified'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-600">{job.posted_ago}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-600">{job.application_count || 0} applicants</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full border border-blue-200 whitespace-nowrap">
                {job.job_type_name}
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full border border-gray-200 whitespace-nowrap">
                {job.experience_level_display}
              </span>
            </div>

            {job.skills_list && job.skills_list.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {job.skills_list.slice(0, 3).map((skill, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full border border-gray-200"
                  >
                    {skill}
                  </span>
                ))}
                {job.skills_list.length > 3 && (
                  <span className="text-xs text-gray-500 py-1">+{job.skills_list.length - 3}</span>
                )}
              </div>
            )}
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBookmark(job.id)}
                  className={`p-2 rounded-xl transition-colors ${
                    isBookmarked ? 'bg-blue-100 text-blue-600 border border-blue-200' : 'bg-gray-100 text-gray-600 hover:bg-blue-50 border border-gray-200'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={() => handleShare(job)}
                  className="p-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors border border-gray-200"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                {canEdit && (
                  <button
                    onClick={() => navigate(`/jobs/${job.id}/edit`)}
                    className="p-2 rounded-xl bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors border border-purple-200"
                    title="Edit this job"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Eye className="w-3 h-3" />
                <span>{job.view_count || 0} views</span>
              </div>
            </div>
            
            {/* Apply Button */}
            <button
              onClick={() => handleApply(job)}
              disabled={hasApplied}
              className={`w-full py-2.5 px-4 rounded-xl font-medium text-sm transition-colors ${
                hasApplied
                  ? 'bg-green-100 text-green-700 cursor-not-allowed border border-green-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md'
              }`}
            >
              {hasApplied ? 'Applied' : 'Apply Now'}
            </button>
          </div>
        </div>
      );
    } else {
      // List view - Enhanced for mobile
      return (
        <div 
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 hover:shadow-md transition-all duration-300 cursor-pointer group"
          onClick={handleCardClick}
        >
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex-shrink-0 hidden sm:block">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-semibold text-lg border border-blue-200">
                {job.startup_name?.charAt(0) || 'J'}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                    {job.title}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {job.is_urgent && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full border border-red-200">
                        Urgent
                      </span>
                    )}
                    {hasApplied && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full border border-green-200">
                        Applied
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 sm:order-last">
                  <button
                    onClick={() => handleBookmark(job.id)}
                    className={`p-2 rounded-xl transition-colors ${
                      isBookmarked ? 'bg-blue-100 text-blue-600 border border-blue-200' : 'bg-gray-100 text-gray-600 hover:bg-blue-50 border border-gray-200'
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleShare(job)}
                    className="p-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors border border-gray-200"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-3 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Building className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{job.startup_name}</span>
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{job.location}</span>
                  {job.is_remote && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-600 text-xs rounded-full border border-purple-200 ml-2 whitespace-nowrap">
                      Remote
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span>{job.posted_ago}</span>
                </span>
                {job.salary_range && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{job.salary_range}</span>
                  </span>
                )}
              </div>
              
              <p className="text-gray-700 mb-4 line-clamp-2 text-sm sm:text-base">{job.description}</p>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full border border-blue-200">
                    {job.job_type_name}
                  </span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full border border-gray-200">
                    {job.experience_level_display}
                  </span>
                  <span className="text-xs text-gray-500">{job.application_count || 0} applicants</span>
                </div>
                
                <button
                  onClick={() => handleApply(job)}
                  disabled={hasApplied}
                  className={`px-6 py-2 rounded-xl font-medium text-sm transition-colors whitespace-nowrap ${
                    hasApplied
                      ? 'bg-green-100 text-green-700 cursor-not-allowed border border-green-200'
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md'
                  }`}
                >
                  {hasApplied ? 'Applied' : 'Apply Now'}
                </button>
              </div>
              
              {job.skills_list && job.skills_list.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="text-sm font-medium text-gray-700 mb-2">Required Skills:</div>
                  <div className="flex flex-wrap gap-1">
                    {job.skills_list.map((skill, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full border border-gray-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
  };

  if (searchError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Jobs</h2>
          <p className="text-gray-600 mb-4">{searchError}</p>
          <button 
            onClick={refreshJobs}
            className="px-6 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" data-page="jobs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">


        {/* Combined Search Bar and Filter Controls */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
          {/* Search Bar */}
          <div className="mb-4 sm:mb-6">
            <SearchBar
              value={filters.search || ''}
              onChange={handleSearch}
              onClear={() => handleSearch('')}
              placeholder="Search jobs, companies, skills..."
              loading={loading}
              className="w-full"
            />
          </div>
          
          {/* Filter Controls - same container as search */}
          <div className="flex flex-col space-y-3 sm:space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
              
              {/* Top row on mobile */}
              <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center justify-center px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-medium transition-colors text-sm sm:text-base ${
                    showFilters 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  <span className="hidden xs:inline">Advanced Filters</span>
                  <span className="xs:hidden">Filters</span>
                  {Object.keys(filters).filter(key => key !== 'status').length > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs bg-white/20 rounded-full">
                      {Object.keys(filters).filter(key => key !== 'status').length}
                    </span>
                  )}
                </button>

                {/* View Mode Toggle */}
                <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg sm:rounded-xl">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 sm:p-2 rounded-md sm:rounded-lg transition-colors ${
                      viewMode === 'grid' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Grid3X3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 sm:p-2 rounded-md sm:rounded-lg transition-colors ${
                      viewMode === 'list' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <List className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>

                {/* Results count */}
                <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600 bg-gray-50 px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl">
                  {loading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">
                        {totalResults.toLocaleString()} opportunity{totalResults !== 1 ? 's' : ''} found
                      </span>
                      <span className="sm:hidden">
                        {totalResults.toLocaleString()} found
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Sort Dropdown - Full width on mobile */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="form-input px-4 py-2.5 text-sm bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-0 focus:border-blue-500 font-medium text-gray-700 cursor-pointer hover:border-gray-300 transition-all shadow-sm min-w-[160px]"
                  style={{ color: '#374151' }}
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value} style={{ color: '#111827', backgroundColor: '#ffffff' }}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
        </div>

        {/* Mobile-First Additional Filter Controls Container with extra spacing */}
        <div className="space-y-3 sm:space-y-4">
          {/* Active Filter Chips */}
          {Object.keys(filters).filter(key => key !== 'status').length > 0 && (
            <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-4">
              <FilterChips
                filters={filters}
                onRemoveFilter={removeFilter}
                onClearAll={resetFilters}
                filterLabels={filterLabels}
              />
            </div>
          )}

          {/* Advanced Filters Panel - Exactly Like Startup Page */}
          {showFilters && filterOptions && (
            <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Advanced Filters</h3>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                
                {/* Job Type Filter */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Job Type</label>
                  <select
                    value={filters.job_type || ''}
                    onChange={(e) => handleFilterChange('job_type', e.target.value || null)}
                    className="w-full px-2 sm:px-3 py-2 sm:py-2.5 bg-white border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
                    style={{ color: '#111827' }}
                  >
                    <option value="" style={{ color: '#111827', backgroundColor: '#ffffff' }}>All Types</option>
                    {filterOptions.job_types?.map(type => (
                      <option key={type.id} value={type.id} style={{ color: '#111827', backgroundColor: '#ffffff' }}>
                        {type.name} ({type.job_count})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location Filter */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <select
                    value={filters.location || ''}
                    onChange={(e) => handleFilterChange('location', e.target.value || null)}
                    className="w-full px-2 sm:px-3 py-2 sm:py-2.5 bg-white border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
                    style={{ color: '#111827' }}
                  >
                    <option value="" style={{ color: '#111827', backgroundColor: '#ffffff' }}>All Locations</option>
                    {filterOptions.locations?.map(location => (
                      <option key={location} value={location} style={{ color: '#111827', backgroundColor: '#ffffff' }}>
                        {location}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Company Size */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Company Size</label>
                  <select
                    value={filters.company_size || ''}
                    onChange={(e) => handleFilterChange('company_size', e.target.value || null)}
                    className="w-full px-2 sm:px-3 py-2 sm:py-2.5 bg-white border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
                    style={{ color: '#111827' }}
                  >
                    <option value="" style={{ color: '#111827', backgroundColor: '#ffffff' }}>Any Size</option>
                    <option value="startup" style={{ color: '#111827', backgroundColor: '#ffffff' }}>1-10 employees</option>
                    <option value="small" style={{ color: '#111827', backgroundColor: '#ffffff' }}>11-50 employees</option>
                    <option value="medium" style={{ color: '#111827', backgroundColor: '#ffffff' }}>51-200 employees</option>
                    <option value="large" style={{ color: '#111827', backgroundColor: '#ffffff' }}>201+ employees</option>
                  </select>
                </div>

                {/* Experience Level Filter */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Experience Level</label>
                  <select
                    value={filters.experience_level || ''}
                    onChange={(e) => handleFilterChange('experience_level', e.target.value || null)}
                    className="w-full px-2 sm:px-3 py-2 sm:py-2.5 bg-white border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
                    style={{ color: '#111827' }}
                  >
                    <option value="" style={{ color: '#111827', backgroundColor: '#ffffff' }}>All Levels</option>
                    {filterOptions.experience_levels?.map(level => (
                      <option key={level.value} value={level.value} style={{ color: '#111827', backgroundColor: '#ffffff' }}>
                        {level.label} ({level.count})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Salary Range */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Salary Range</label>
                  <select
                    value={filters.salary_range || ''}
                    onChange={(e) => handleFilterChange('salary_range', e.target.value || null)}
                    className="w-full px-2 sm:px-3 py-2 sm:py-2.5 bg-white border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
                    style={{ color: '#111827' }}
                  >
                    <option value="" style={{ color: '#111827', backgroundColor: '#ffffff' }}>Any Salary</option>
                    <option value="0-50k" style={{ color: '#111827', backgroundColor: '#ffffff' }}>$0-$50k</option>
                    <option value="50k-100k" style={{ color: '#111827', backgroundColor: '#ffffff' }}>$50k-$100k</option>
                    <option value="100k-150k" style={{ color: '#111827', backgroundColor: '#ffffff' }}>$100k-$150k</option>
                    <option value="150k+" style={{ color: '#111827', backgroundColor: '#ffffff' }}>$150k+</option>
                  </select>
                </div>
              </div>

              {/* Mobile-optimized Checkboxes */}
              <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                <label className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-amber-50 border border-amber-200 rounded-lg sm:rounded-xl hover:bg-amber-100 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.is_featured === 'true'}
                    onChange={(e) => handleFilterChange('is_featured', e.target.checked ? 'true' : null)}
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500"
                  />
                  <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
                  <span className="text-xs sm:text-sm font-medium text-amber-700">Featured only</span>
                </label>

                <label className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-green-50 border border-green-200 rounded-lg sm:rounded-xl hover:bg-green-100 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.is_remote === 'true'}
                    onChange={(e) => handleFilterChange('is_remote', e.target.checked ? 'true' : null)}
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                  />
                  <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                  <span className="text-xs sm:text-sm font-medium text-green-700">Remote work</span>
                </label>

                <label className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg sm:rounded-xl hover:bg-blue-100 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.is_urgent === 'true'}
                    onChange={(e) => handleFilterChange('is_urgent', e.target.checked ? 'true' : null)}
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
                  <span className="text-xs sm:text-sm font-medium text-blue-700">Urgent hiring</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Job Listings with extra spacing */}
        <div className="space-y-4 sm:space-y-6 mt-6 sm:mt-8">
          {loading && jobs.length === 0 ? (
            /* Loading State */
            <div className="space-y-4">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
                  <div className="animate-pulse">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            /* No Results State */
            <div className="text-center py-12 sm:py-16">
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm p-8 sm:p-12">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                  <Search className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">No jobs found</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  We couldn't find any jobs matching your criteria. Try adjusting your filters or search terms.
                </p>
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Clear Filters
                </button>
              </div>
            </div>
          ) : (
            /* Job Cards */
            <>
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6" 
                : "space-y-4 sm:space-y-6"
              }>
                {jobs.map(job => (
                  <JobCard key={job.id} job={job} isGrid={viewMode === 'grid'} />
                ))}
              </div>

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalResults={totalResults}
                resultsPerPage={20}
                onPageChange={goToPage}
                showResultsInfo={true}
                className="mt-8"
              />

              {/* Loading More Indicator */}
              {loading && jobs.length > 0 && (
                <div className="flex justify-center">
                  <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center space-x-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-blue-600"></div>
                      <span className="text-gray-600 font-medium">Loading more opportunities...</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

      </div>

      {/* Job Application Modal */}
      <JobApplicationModal
        isOpen={showApplicationModal}
        onClose={handleApplicationModalClose}
        job={selectedJob}
        onApplicationSubmitted={handleApplicationSubmitted}
      />

      {/* Job Upload Form Modal */}
      <JobUploadForm
        isOpen={showJobUploadForm}
        onClose={() => setShowJobUploadForm(false)}
        onSuccess={handleJobUploadSuccess}
      />

      {/* Mobile Filters Overlay */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setShowMobileFilters(false)} />
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-xl overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Mobile filter content would go here */}
              <div className="space-y-6">
                {/* Add mobile-specific filter UI */}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jobs;