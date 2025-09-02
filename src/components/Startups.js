// src/components/Startups.js - Enhanced Mobile-First Responsive Version
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from '../config/axios';
import SearchBar from './SearchBar';
import FilterChips from './FilterChips';
import useSearch from '../hooks/useSearch';
import Pagination from './Pagination';
import { 
  Bookmark, BookmarkCheck, Heart, Star, Loader, Filter, 
  MapPin, Users, Eye, TrendingUp, DollarSign, Calendar,
  Building, Zap, Globe, Award, ChevronRight, Target,
  Sparkles, ArrowUp, ArrowDown, Grid3X3, List, Search,
  SlidersHorizontal, RefreshCw, Flame, Rocket, Crown,
  AlertCircle, Plus, Upload, ExternalLink, TrendingDown,
  Activity, BarChart3, Clock, CheckCircle, Shield, X,
  ChevronDown, Filter as FilterIcon, SortAsc, SortDesc,
  Menu, XCircle
} from 'lucide-react';

const Startups = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [filterOptions, setFilterOptions] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('-created_at');
  const [bookmarkingStates, setBookmarkingStates] = useState({});
  const [likingStates, setLikingStates] = useState({});
  const [viewMode, setViewMode] = useState('grid');
  const [screenSize, setScreenSize] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    width: 0
  });
  
  // Search hook for managing search state
  const {
    results: startups,
    loading,
    error,
    filters,
    totalResults,
    hasNextPage,
    currentPage,
    updateFilters,
    resetFilters,
    removeFilter,
    loadMore,
    goToPage,
    updateResults
  } = useSearch('/api/startups/');

  // Enhanced responsive detection
  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      setScreenSize({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        width
      });
    };
    
    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  // Load filter options on component mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const response = await axios.get('/api/startups/filters/');
        setFilterOptions(response.data);
      } catch (error) {
        console.error('Error loading filter options:', error);
      }
    };
    
    loadFilterOptions();
  }, []);

  // Handle search term from navigation state
  useEffect(() => {
    if (location.state?.searchTerm) {
      handleSearch(location.state.searchTerm);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleSearch = useCallback((searchTerm) => {
    updateFilters({ search: searchTerm });
  }, [updateFilters]);

  const handleFilterChange = useCallback((filterKey, value) => {
    updateFilters({ [filterKey]: value });
  }, [updateFilters]);

  const handleSortChange = useCallback((newSortBy) => {
    setSortBy(newSortBy);
    updateFilters({ ordering: newSortBy });
  }, [updateFilters]);

  const handleBookmark = useCallback(async (startupId, currentBookmarkState) => {
    if (bookmarkingStates[startupId]) return;
    
    setBookmarkingStates(prev => ({ ...prev, [startupId]: true }));
    
    try {
      const response = await axios.post(`/startups/${startupId}/bookmark/`);
      
      if (response.data.success !== false) {
        updateResults(startup => {
          if (startup.id === startupId) {
            return {
              ...startup,
              is_bookmarked: response.data.bookmarked,
              total_bookmarks: response.data.total_bookmarks
            };
          }
          return startup;
        });
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    } finally {
      setBookmarkingStates(prev => ({ ...prev, [startupId]: false }));
    }
  }, [bookmarkingStates, updateResults]);

  const handleLike = useCallback(async (startupId, currentLikeState) => {
    if (likingStates[startupId]) return;
    
    setLikingStates(prev => ({ ...prev, [startupId]: true }));
    
    try {
      const response = await axios.post(`/startups/${startupId}/like/`);
      
      updateResults(startup => {
        if (startup.id === startupId) {
          return {
            ...startup,
            is_liked: response.data.liked,
            total_likes: response.data.total_likes
          };
        }
        return startup;
      });
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLikingStates(prev => ({ ...prev, [startupId]: false }));
    }
  }, [likingStates, updateResults]);

  const filterLabels = useMemo(() => ({
    search: 'Search',
    industry: 'Industry',
    location: 'Location',
    min_employees: 'Min Employees',
    max_employees: 'Max Employees',
    min_rating: 'Min Rating',
    has_funding: 'Funding',
    featured: 'Featured',
    min_founded_year: 'Founded After',
    max_founded_year: 'Founded Before'
  }), []);

  const sortOptions = useMemo(() => [
    { value: '-created_at', label: 'Newest First', icon: Calendar },
    { value: 'created_at', label: 'Oldest First', icon: Calendar },
    { value: 'name', label: 'Name A-Z', icon: Target },
    { value: '-name', label: 'Name Z-A', icon: Target },
    { value: '-views', label: 'Most Popular', icon: Eye },
    { value: '-employee_count', label: 'Largest Companies', icon: Users },
    { value: 'employee_count', label: 'Smallest Companies', icon: Users },
    { value: '-average_rating', label: 'Highest Rated', icon: Star }
  ], []);

  // Responsive grid columns calculation - Fixed to 4 per row max
  const getGridCols = useMemo(() => {
    if (screenSize.isMobile) return 'grid-cols-1';
    if (screenSize.isTablet) return 'grid-cols-2';
    if (screenSize.width < 1280) return 'grid-cols-3';
    return 'grid-cols-4';
  }, [screenSize]);

  // Enhanced Mobile-First Startup Card Component
  const StartupCard = React.memo(({ startup, onBookmark, onLike, bookmarkLoading, likeLoading }) => (
    <div 
      className="group rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg sm:hover:shadow-xl transition-all duration-300 sm:transform sm:hover:-translate-y-1 overflow-hidden h-full flex flex-col relative"
      style={startup.cover_image_display_url ? {
        backgroundImage: `url(${startup.cover_image_display_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      } : { backgroundColor: 'white' }}
    >
      {/* Background overlay for better text readability when there's a cover image */}
      {startup.cover_image_display_url && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-black/30" />
      )}
      
      {/* Responsive Badges overlay */}
      <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex flex-wrap gap-1 sm:gap-2 z-10">
        {startup.is_featured && (
          <span className="px-1.5 py-0.5 sm:px-2.5 sm:py-1 bg-gradient-to-r from-amber-400 to-amber-500 text-white text-xs font-bold rounded-full shadow-lg backdrop-blur-sm">
            <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3 inline mr-0.5 sm:mr-1" />
            <span className="hidden xs:inline">Featured</span>
            <span className="xs:hidden">★</span>
          </span>
        )}
        {startup.is_claimed && startup.claim_verified && (
          <span className="px-1.5 py-0.5 sm:px-2.5 sm:py-1 bg-gradient-to-r from-green-400 to-green-500 text-white text-xs font-bold rounded-full shadow-lg backdrop-blur-sm">
            <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3 inline mr-0.5 sm:mr-1" />
            <span className="hidden xs:inline">Verified</span>
            <span className="xs:hidden">✓</span>
          </span>
        )}
      </div>

      {/* Mobile-optimized Action buttons overlay */}
      <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex gap-1 sm:gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 z-10">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onBookmark(startup.id, startup.is_bookmarked);
          }}
          disabled={bookmarkLoading}
          className={`p-1.5 sm:p-2 rounded-full backdrop-blur-sm transition-all duration-200 ${
            startup.is_bookmarked
              ? 'bg-blue-500 text-white shadow-lg'
              : 'bg-white/90 text-gray-700 hover:bg-blue-500 hover:text-white shadow-md'
          } disabled:opacity-50 touch-manipulation`}
        >
          {bookmarkLoading ? (
            <Loader className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
          ) : startup.is_bookmarked ? (
            <BookmarkCheck className="w-3 h-3 sm:w-4 sm:h-4" />
          ) : (
            <Bookmark className="w-3 h-3 sm:w-4 sm:h-4" />
          )}
        </button>

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onLike(startup.id, startup.is_liked);
          }}
          disabled={likeLoading}
          className={`p-1.5 sm:p-2 rounded-full backdrop-blur-sm transition-all duration-200 ${
            startup.is_liked
              ? 'bg-red-500 text-white shadow-lg'
              : 'bg-white/90 text-gray-700 hover:bg-red-500 hover:text-white shadow-md'
          } disabled:opacity-50 touch-manipulation`}
        >
          {likeLoading ? (
            <Loader className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
          ) : (
            <Heart className={`w-3 h-3 sm:w-4 sm:h-4 ${startup.is_liked ? 'fill-current' : ''}`} />
          )}
        </button>
      </div>

      {/* Mobile-optimized Card Content - positioned at bottom for background image cards */}
      <div 
        className={`p-3 sm:p-4 flex-grow flex flex-col relative z-10 ${
          startup.cover_image_display_url 
            ? 'mt-auto bg-gradient-to-t from-black/80 via-black/60 to-transparent text-white' 
            : 'bg-white text-gray-900'
        }`}
      >
        {/* Header - responsive layout */}
        <div className="flex items-start justify-between mb-2 sm:mb-3">
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-1 sm:space-x-2 mb-1">
                <h3 className={`text-sm sm:text-lg font-bold transition-colors line-clamp-1 ${
                  startup.cover_image_display_url 
                    ? 'text-white group-hover:text-blue-300' 
                    : 'text-gray-900 group-hover:text-blue-600'
                }`}>
                  {startup.name}
                </h3>
                {!startup.cover_image_display_url && startup.is_featured && (
                  <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500 flex-shrink-0" />
                )}
                {!startup.cover_image_display_url && startup.is_claimed && startup.claim_verified && (
                  <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                <span className={`inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 text-xs font-medium rounded border ${
                  startup.cover_image_display_url
                    ? 'bg-white/20 text-white border-white/30 backdrop-blur-sm'
                    : 'bg-blue-100 text-blue-700 border-blue-200'
                }`}>
                  {screenSize.isMobile ? startup.industry_name.substring(0, 12) + (startup.industry_name.length > 12 ? '...' : '') : startup.industry_name}
                </span>
                {startup.funding_amount && (
                  <span className={`inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 text-xs font-medium rounded border ${
                    startup.cover_image_display_url
                      ? 'bg-green-500/20 text-green-200 border-green-400/30 backdrop-blur-sm'
                      : 'bg-green-100 text-green-700 border-green-200'
                  }`}>
                    <DollarSign className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                    <span className="hidden sm:inline">{startup.funding_amount}</span>
                    <span className="sm:hidden">Funded</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          <ChevronRight className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors flex-shrink-0 ${
            startup.cover_image_display_url
              ? 'text-white/60 group-hover:text-white'
              : 'text-gray-300 group-hover:text-blue-500'
          }`} />
        </div>
        
        {/* Description - responsive line clamp */}
        <p className={`text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2 sm:line-clamp-2 leading-relaxed flex-shrink-0 ${
          startup.cover_image_display_url
            ? 'text-white/90'
            : 'text-gray-600'
        }`}>
          {startup.description}
        </p>
        
        {/* Metrics Grid - responsive layout */}
        <div className="grid grid-cols-2 gap-1 sm:gap-2 mb-2 sm:mb-3 text-xs sm:text-sm flex-shrink-0">
          <div className={`flex items-center space-x-1 sm:space-x-1.5 ${
            startup.cover_image_display_url ? 'text-white/80' : 'text-gray-600'
          }`}>
            <MapPin className={`w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0 ${
              startup.cover_image_display_url ? 'text-white/60' : 'text-gray-400'
            }`} />
            <span className="truncate text-xs">
              {screenSize.isMobile && startup.location.length > 12 
                ? startup.location.substring(0, 12) + '...' 
                : startup.location}
            </span>
          </div>
          <div className={`flex items-center space-x-1 sm:space-x-1.5 ${
            startup.cover_image_display_url ? 'text-white/80' : 'text-gray-600'
          }`}>
            <Users className={`w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0 ${
              startup.cover_image_display_url ? 'text-white/60' : 'text-gray-400'
            }`} />
            <span className="text-xs">
              {screenSize.isMobile ? `${startup.employee_count}+` : `${startup.employee_count}+ people`}
            </span>
          </div>
          <div className={`flex items-center space-x-1 sm:space-x-1.5 ${
            startup.cover_image_display_url ? 'text-white/80' : 'text-gray-600'
          }`}>
            <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 flex-shrink-0" />
            <span className="text-xs">
              {startup.average_rating?.toFixed(1) || 'N/A'} ({startup.total_ratings})
            </span>
          </div>
          <div className={`flex items-center space-x-1 sm:space-x-1.5 ${
            startup.cover_image_display_url ? 'text-white/80' : 'text-gray-600'
          }`}>
            <Eye className={`w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0 ${
              startup.cover_image_display_url ? 'text-white/60' : 'text-gray-400'
            }`} />
            <span className="text-xs">
              {screenSize.isMobile ? startup.views : `${startup.views} views`}
            </span>
          </div>
        </div>

        {/* Tags - responsive display */}
        {startup.tags_list && startup.tags_list.length > 0 && (
          <div className="mb-2 sm:mb-3 flex-shrink-0">
            <div className="flex flex-wrap gap-1">
              {startup.tags_list.slice(0, screenSize.isMobile ? 2 : 3).map((tag, index) => (
                <span
                  key={index}
                  className={`px-1.5 py-0.5 sm:px-2 sm:py-0.5 text-xs font-medium rounded border transition-colors ${
                    startup.cover_image_display_url
                      ? 'bg-white/10 text-white/90 border-white/20 hover:bg-white/20 backdrop-blur-sm'
                      : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  {screenSize.isMobile && tag.length > 8 ? tag.substring(0, 8) + '...' : tag}
                </span>
              ))}
              {startup.tags_list.length > (screenSize.isMobile ? 2 : 3) && (
                <span className={`text-xs px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded border ${
                  startup.cover_image_display_url
                    ? 'text-white/70 bg-white/10 border-white/20 backdrop-blur-sm'
                    : 'text-gray-500 bg-gray-100 border-gray-200'
                }`}>
                  +{startup.tags_list.length - (screenSize.isMobile ? 2 : 3)}
                </span>
              )}
            </div>
          </div>
        )}
        
        {/* Action Bar - responsive design */}
        <div className={`flex items-center justify-between pt-2 sm:pt-3 border-t mt-auto ${
          startup.cover_image_display_url
            ? 'border-white/20'
            : 'border-gray-100'
        }`}>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className={`flex items-center space-x-1 text-xs sm:text-sm ${
              startup.cover_image_display_url ? 'text-white/80' : 'text-gray-500'
            }`}>
              <Heart className={`w-3 h-3 sm:w-4 sm:h-4 ${startup.is_liked ? 'text-red-500 fill-current' : startup.cover_image_display_url ? 'text-white/60' : 'text-gray-400'}`} />
              <span className="font-medium">{startup.total_likes || 0}</span>
            </div>
            <div className={`flex items-center space-x-1 text-xs sm:text-sm ${
              startup.cover_image_display_url ? 'text-white/80' : 'text-gray-500'
            }`}>
              <Bookmark className={`w-3 h-3 sm:w-4 sm:h-4 ${startup.is_bookmarked ? 'text-blue-400' : startup.cover_image_display_url ? 'text-white/60' : 'text-gray-400'}`} />
              <span className="font-medium">{startup.total_bookmarks || 0}</span>
            </div>
          </div>

          <div className={`flex items-center text-xs font-medium ${
            startup.cover_image_display_url ? 'text-white/80' : 'text-gray-500'
          }`}>
            <span className="hidden sm:inline">View Details</span>
            <span className="sm:hidden">View</span>
            <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3 ml-1" />
          </div>
        </div>
      </div>
    </div>
  ));

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto p-6 sm:p-8 bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100">
          <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Error Loading Startups</h2>
          <p className="text-gray-600 mb-4 text-sm sm:text-base">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 sm:px-6 py-2 sm:py-2.5 bg-red-600 text-white rounded-lg sm:rounded-xl hover:bg-red-700 transition-colors font-medium text-sm sm:text-base"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-10">


        {/* Main Content */}
        <div className="space-y-4 sm:space-y-6">
          {/* Combined Search Bar and Filter Controls */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-4 lg:p-6">
            {/* Search Bar */}
            <div className="mb-4 sm:mb-6">
              <SearchBar
                value={filters.search || ''}
                onChange={handleSearch}
                onClear={() => handleSearch('')}
                placeholder={screenSize.isMobile ? "Search startups..." : "Search startups, industries, locations..."}
                loading={loading}
                className="w-full"
                showRecentSearches={!screenSize.isMobile}
                showTrendingSearches={!screenSize.isMobile}
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
                    {Object.keys(filters).length > 0 && (
                      <span className="ml-2 px-1.5 py-0.5 text-xs bg-white/20 rounded-full">
                        {Object.keys(filters).length}
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
                        <Building className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">
                          {totalResults.toLocaleString()} startup{totalResults !== 1 ? 's' : ''} found
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
                        {screenSize.isMobile && option.label.length > 15 
                          ? option.label.substring(0, 15) + '...' 
                          : option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
          </div>

          {/* Mobile-First Additional Filter Controls Container */}
          <div className="space-y-3 sm:space-y-4">
            {/* Active Filter Chips */}
            {Object.keys(filters).length > 0 && (
              <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-4">
                <FilterChips
                  filters={filters}
                  onRemoveFilter={removeFilter}
                  onClearAll={resetFilters}
                  filterLabels={filterLabels}
                />
              </div>
            )}

            {/* Advanced Filters Panel - Mobile optimized */}
            {showFilters && filterOptions && (
              <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">Advanced Filters</h3>
                  </div>
                  {screenSize.isMobile && (
                    <button
                      onClick={() => setShowFilters(false)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  
                  {/* Industry Filter */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Industry</label>
                    <select
                      value={filters.industry || ''}
                      onChange={(e) => handleFilterChange('industry', e.target.value || null)}
                      className="w-full px-2 sm:px-3 py-2 sm:py-2.5 bg-white border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
                      style={{ color: '#111827' }}
                    >
                      <option value="" style={{ color: '#111827', backgroundColor: '#ffffff' }}>All Industries</option>
                      {filterOptions.industries.map(industry => (
                        <option key={industry.id} value={industry.id} style={{ color: '#111827', backgroundColor: '#ffffff' }}>
                          {industry.icon} {industry.name} ({industry.startup_count})
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
                      {filterOptions.locations.map(location => (
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
                      value={filters.employee_range || ''}
                      onChange={(e) => {
                        const range = filterOptions.employee_ranges.find(r => r.label === e.target.value);
                        if (range) {
                          handleFilterChange('min_employees', range.min);
                          handleFilterChange('max_employees', range.max);
                        } else {
                          handleFilterChange('min_employees', null);
                          handleFilterChange('max_employees', null);
                        }
                      }}
                      className="w-full px-2 sm:px-3 py-2 sm:py-2.5 bg-white border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
                      style={{ color: '#111827' }}
                    >
                      <option value="" style={{ color: '#111827', backgroundColor: '#ffffff' }}>Any Size</option>
                      {filterOptions.employee_ranges.map(range => (
                        <option key={range.label} value={range.label} style={{ color: '#111827', backgroundColor: '#ffffff' }}>
                          {range.label} employees
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Minimum Rating */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Minimum Rating</label>
                    <select
                      value={filters.min_rating || ''}
                      onChange={(e) => handleFilterChange('min_rating', e.target.value || null)}
                      className="w-full px-2 sm:px-3 py-2 sm:py-2.5 bg-white border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
                      style={{ color: '#111827' }}
                    >
                      <option value="" style={{ color: '#111827', backgroundColor: '#ffffff' }}>Any Rating</option>
                      <option value="4" style={{ color: '#111827', backgroundColor: '#ffffff' }}>4+ Stars</option>
                      <option value="3" style={{ color: '#111827', backgroundColor: '#ffffff' }}>3+ Stars</option>
                      <option value="2" style={{ color: '#111827', backgroundColor: '#ffffff' }}>2+ Stars</option>
                      <option value="1" style={{ color: '#111827', backgroundColor: '#ffffff' }}>1+ Star</option>
                    </select>
                  </div>
                </div>

                {/* Mobile-optimized Checkboxes */}
                <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                  <label className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-amber-50 border border-amber-200 rounded-lg sm:rounded-xl hover:bg-amber-100 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.featured === 'true'}
                      onChange={(e) => handleFilterChange('featured', e.target.checked ? 'true' : null)}
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500"
                    />
                    <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
                    <span className="text-xs sm:text-sm font-medium text-amber-700">Featured only</span>
                  </label>

                  <label className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-green-50 border border-green-200 rounded-lg sm:rounded-xl hover:bg-green-100 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.has_funding === 'true'}
                      onChange={(e) => handleFilterChange('has_funding', e.target.checked ? 'true' : null)}
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                    />
                    <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                    <span className="text-xs sm:text-sm font-medium text-green-700">Has funding</span>
                  </label>

                  <label className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg sm:rounded-xl hover:bg-blue-100 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.claimed === 'true'}
                      onChange={(e) => handleFilterChange('claimed', e.target.checked ? 'true' : null)}
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
                    <span className="text-xs sm:text-sm font-medium text-blue-700">Verified only</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Mobile-First Results Grid */}
          {startups.length > 0 ? (
            <div className={`${
              viewMode === 'grid' 
                ? `grid gap-3 sm:gap-4 lg:gap-6 ${getGridCols}` 
                : 'space-y-3 sm:space-y-4'
            }`}>
              {startups.map((startup) => (
                <Link
                  key={startup.id}
                  to={`/startups/${startup.id}`}
                  className="block h-full"
                >
                  <StartupCard
                    startup={startup}
                    onBookmark={handleBookmark}
                    onLike={handleLike}
                    bookmarkLoading={bookmarkingStates[startup.id]}
                    likeLoading={likingStates[startup.id]}
                  />
                </Link>
              ))}
            </div>
          ) : (
            /* Mobile-optimized Empty State */
            <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 lg:p-12 text-center">
              {loading ? (
                <div className="flex flex-col items-center">
                  <div className="relative mb-4 sm:mb-6">
                    <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-2 border-gray-200 border-t-blue-600"></div>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 opacity-20 animate-ping"></div>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Discovering amazing startups...</h3>
                  <p className="text-sm sm:text-base text-gray-600">Please wait while we find the perfect matches for you</p>
                </div>
              ) : (
                <div>
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <Search className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">No startups found</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto leading-relaxed px-4">
                    We couldn't find any startups matching your criteria. Try adjusting your search or filters to discover more companies.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center max-w-md mx-auto">
                    <button
                      onClick={resetFilters}
                      className="px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg sm:rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base"
                    >
                      Clear all filters
                    </button>
                    <button
                      onClick={() => handleSearch('')}
                      className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 text-gray-700 rounded-lg sm:rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm sm:text-base"
                    >
                      Browse all startups
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalResults={totalResults}
            resultsPerPage={20}
            onPageChange={goToPage}
            showResultsInfo={true}
            className="border-t border-gray-200 pt-6"
          />

          {/* Loading More Indicator */}
          {loading && startups.length > 0 && (
            <div className="flex justify-center">
              <div className="flex items-center space-x-2 sm:space-x-3 bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
                <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-2 border-gray-200 border-t-blue-600"></div>
                <span className="text-gray-600 font-medium text-sm sm:text-base">Loading more startups...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Custom CSS for responsive design */}
      <style jsx="true">{`
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .aspect-video {
          aspect-ratio: 16 / 9;
        }
        
        /* Enhanced responsive breakpoints - Max 4 columns */
        @media (max-width: 475px) {
          .xs\\:hidden {
            display: none;
          }
          .xs\\:inline {
            display: inline;
          }
        }
        
        @media (min-width: 476px) {
          .xs\\:hidden {
            display: initial;
          }
          .xs\\:inline {
            display: none;
          }
        }
        
        /* Touch targets for mobile */
        @media (max-width: 767px) {
          .touch-manipulation {
            touch-action: manipulation;
            min-height: 44px;
            min-width: 44px;
          }
        }
        
        /* Better mobile card spacing */
        @media (max-width: 640px) {
          .line-clamp-2 {
            -webkit-line-clamp: 3;
          }
        }
        
        /* Ensure consistent grid spacing */
        .grid-cols-1 > * {
          width: 100%;
        }
        
        .grid-cols-2 > * {
          min-width: 0;
        }
        
        .grid-cols-3 > * {
          min-width: 0;
        }
        
        .grid-cols-4 > * {
          min-width: 0;
        }
        
        /* Smooth scroll for mobile */
        html {
          scroll-behavior: smooth;
        }
        
        /* Better focus states for accessibility */
        button:focus,
        select:focus,
        input:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }
        
        /* Prevent layout shifts */
        img {
          max-width: 100%;
          height: auto;
        }
        
        /* Ensure proper z-index stacking */
        .relative {
          z-index: 1;
        }
        
        .group:hover .group-hover\\:opacity-100 {
          z-index: 2;
        }
      `}</style>
    </div>
  );
};

export default Startups;