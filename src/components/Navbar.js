// src/components/Navbar.js - Enhanced Original Design with Working Search
import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { NotificationBell } from './NotificationSystem';
import Logo from './Logo';
import api from '../services/api';
import axios from '../config/axios';
import { getAvatarUrl, getUserDisplayName } from '../utils/avatarUtils';
import { 
  Home, Building, Briefcase, User, LogOut, Search, 
  Menu, X, ChevronDown, Settings, HelpCircle,
  Star, Bookmark, Activity, TrendingUp, Bell,
  MessageSquare, Award, Shield, CreditCard,
  Link as LinkIcon, Clock, Zap, Coffee, Code,
  Heart, Users, Calendar, Target, Rocket, Network, Sparkles, Share2, GitBranch, Waypoints, MessageCircle,
  AlertCircle, Plus, BookOpen, Upload
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [quickSearchQuery, setQuickSearchQuery] = useState('');
  const [quickSearchResults, setQuickSearchResults] = useState({ startups: [], jobs: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showQuickSearch, setShowQuickSearch] = useState(false);
  const [userStats, setUserStats] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [searchError, setSearchError] = useState('');
  const [userStatsError, setUserStatsError] = useState('');
  const [isStartupsDropdownOpen, setIsStartupsDropdownOpen] = useState(false);
  const [isJobsDropdownOpen, setIsJobsDropdownOpen] = useState(false);
  const [startupsHoverTimeout, setStartupsHoverTimeout] = useState(null);
  const [jobsHoverTimeout, setJobsHoverTimeout] = useState(null);
  
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const startupsDropdownRef = useRef(null);
  const jobsDropdownRef = useRef(null);
  const searchDebounceRef = useRef(null);

  const navItems = [
    { 
      path: '/social', 
      label: 'Social Hub', 
      icon: Users,
      description: 'Posts, stories, collections & achievements'
    },
    { 
      path: '/startups', 
      label: 'Startups', 
      icon: Building,
      description: 'Discover companies'
    },
    { 
      path: '/jobs', 
      label: 'Jobs', 
      icon: Briefcase,
      description: 'Find opportunities'
    }
  ];

  const profileMenuItems = [
    { label: 'Profile', icon: User, path: '/profile' },
    { label: 'Bookmarks', icon: Bookmark, path: '/bookmarks' },
    { label: 'Activity', icon: Activity, path: '/activity' },
    { label: 'My Claims', icon: Shield, path: '/my-claims', description: 'Track your startup claims' },
    { label: 'My Jobs', icon: Briefcase, path: '/my-jobs', description: 'Manage your job postings' },
    { label: 'Settings', icon: Settings, path: '/settings' },
    { label: 'Help', icon: HelpCircle, path: '/help' },
  ];

  // Trending searches loaded from backend
  const [trendingSearches, setTrendingSearches] = useState([]);

  // Add admin menu items dynamically for admin users
  const getMenuItems = () => {
    const items = [...profileMenuItems];
    
    if (user?.is_staff || user?.is_superuser) {
      items.splice(1, 0, { 
        label: 'Admin Panel', 
        icon: Shield, 
        path: '/admin',
        isAdmin: true,
        description: 'Manage startups and reports'
      });
      
      items.splice(2, 0, { 
        label: 'Job Admin', 
        icon: Briefcase, 
        path: '/job-admin',
        isAdmin: true 
      });
    }
    
    return items;
  };

  // Load user stats and recent searches on mount
  useEffect(() => {
    if (user) {
      loadUserStats();
      loadUnreadMessageCount();
    }
    loadRecentSearches();
    loadTrendingSearches();
  }, [user]);

  // Listen for unread count changes
  useEffect(() => {
    const handleUnreadCountChange = () => {
      if (user) {
        loadUnreadMessageCount();
      }
    };

    window.addEventListener('unreadCountChanged', handleUnreadCountChange);
    
    return () => {
      window.removeEventListener('unreadCountChanged', handleUnreadCountChange);
    };
  }, [user]);

  const loadRecentSearches = () => {
    try {
      const saved = localStorage.getItem('recent_searches');
      if (saved) {
        setRecentSearches(JSON.parse(saved).slice(0, 5));
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  // Enhanced search functionality with debouncing
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (quickSearchQuery.trim().length > 1) {
      setIsSearching(true);
      searchDebounceRef.current = setTimeout(() => {
        performQuickSearch(quickSearchQuery);
      }, 300);
    } else {
      setQuickSearchResults({ startups: [], jobs: [] });
      setIsSearching(false);
    }

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [quickSearchQuery]);

  // Show search dropdown when focused
  useEffect(() => {
    if (searchFocused) {
      setShowQuickSearch(true);
    }
  }, [searchFocused]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && 
          searchRef.current && !searchRef.current.contains(event.target)) {
        setShowQuickSearch(false);
        setSearchFocused(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
      // Note: Removed click outside handlers for startups and jobs dropdowns 
      // since they now use hover functionality
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lock/unlock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '0px';
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isMobileMenuOpen]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (startupsHoverTimeout) {
        clearTimeout(startupsHoverTimeout);
      }
      if (jobsHoverTimeout) {
        clearTimeout(jobsHoverTimeout);
      }
    };
  }, [startupsHoverTimeout, jobsHoverTimeout]);

  const loadUserStats = async () => {
    try {
      setUserStatsError('');
      const stats = await api.auth.getUserStats();
      setUserStats(stats);
    } catch (error) {
      console.error('Error loading user stats:', error);
      setUserStatsError('Failed to load user statistics');
      // Fallback to empty stats on error
      setUserStats({
        totals: {
          bookmarks: 0,
          ratings: 0,
          applications: 0
        }
      });
    }
  };

  const loadTrendingSearches = async () => {
    try {
      const searches = await api.startups.getTrendingSearches();
      setTrendingSearches(searches);
    } catch (error) {
      console.error('Error loading trending searches:', error);
      // Fallback to hardcoded searches on error
      setTrendingSearches([
        'AI startups',
        'Remote jobs',
        'Series A funding',
        'Frontend developer',
        'FinTech companies',
        'Product manager roles'
      ]);
    }
  };

  const loadUnreadMessageCount = async () => {
    try {
      const response = await api.messaging.getUnreadCount();
      setUnreadMessageCount(response.unread_count);
    } catch (error) {
      console.error('Error loading unread message count:', error);
      setUnreadMessageCount(0);
    }
  };

  const performQuickSearch = async (query) => {
    try {
      setSearchError('');
      setIsSearching(true);
      
      // Perform parallel searches for startups and jobs
      const [startupsResponse, jobsResponse] = await Promise.all([
        api.startups.search(query, 3),
        api.jobs.search(query, 3)
      ]);

      const startups = startupsResponse.results || startupsResponse || [];
      const jobs = jobsResponse.results || jobsResponse || [];

      setQuickSearchResults({
        startups: startups.slice(0, 3),
        jobs: jobs.slice(0, 3)
      });
      setIsSearching(false);
    } catch (error) {
      console.error('Quick search error:', error);
      setSearchError('Search temporarily unavailable. Please try again.');
      setQuickSearchResults({ startups: [], jobs: [] });
      setIsSearching(false);
    }
  };

  const saveRecentSearch = (query) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    
    const updated = [trimmed, ...recentSearches.filter(s => s !== trimmed)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recent_searches', JSON.stringify(updated));
  };

  const handleQuickSearchSubmit = (e) => {
    e.preventDefault();
    if (quickSearchQuery.trim()) {
      saveRecentSearch(quickSearchQuery);
      navigate('/startups', { state: { searchTerm: quickSearchQuery } });
      setQuickSearchQuery('');
      setShowQuickSearch(false);
      setSearchFocused(false);
    }
  };

  const handleQuickSearchClear = () => {
    setQuickSearchQuery('');
    setQuickSearchResults({ startups: [], jobs: [] });
  };

  const handleSearchItemClick = (type, item) => {
    if (type === 'startup') {
      navigate(`/startups/${item.id}`);
    } else if (type === 'job') {
      navigate(`/jobs/${item.id}`);
    } else if (type === 'search') {
      saveRecentSearch(item);
      navigate('/startups', { state: { searchTerm: item } });
    }
    setQuickSearchQuery('');
    setShowQuickSearch(false);
    setSearchFocused(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/welcome');
    setIsProfileDropdownOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const isActivePath = (path) => {
    if (path === '/posts') {
      return location.pathname === '/posts' || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const getUserInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`;
    }
    return user?.username?.charAt(0)?.toUpperCase() || 'U';
  };

  // Helper functions for smooth hover behavior
  const handleStartupsMouseEnter = () => {
    if (startupsHoverTimeout) {
      clearTimeout(startupsHoverTimeout);
      setStartupsHoverTimeout(null);
    }
    // Close jobs dropdown when opening startups
    if (jobsHoverTimeout) {
      clearTimeout(jobsHoverTimeout);
      setJobsHoverTimeout(null);
    }
    setIsJobsDropdownOpen(false);
    setIsStartupsDropdownOpen(true);
  };

  const handleStartupsMouseLeave = () => {
    const timeout = setTimeout(() => {
      setIsStartupsDropdownOpen(false);
    }, 150); // Small delay to prevent flickering
    setStartupsHoverTimeout(timeout);
  };

  const handleJobsMouseEnter = () => {
    if (jobsHoverTimeout) {
      clearTimeout(jobsHoverTimeout);
      setJobsHoverTimeout(null);
    }
    // Close startups dropdown when opening jobs
    if (startupsHoverTimeout) {
      clearTimeout(startupsHoverTimeout);
      setStartupsHoverTimeout(null);
    }
    setIsStartupsDropdownOpen(false);
    setIsJobsDropdownOpen(true);
  };

  const handleJobsMouseLeave = () => {
    const timeout = setTimeout(() => {
      setIsJobsDropdownOpen(false);
    }, 150); // Small delay to prevent flickering
    setJobsHoverTimeout(timeout);
  };


  return (
    <nav className="navbar-glass sticky top-0 z-40 transition-all duration-300">
      <div className="w-full px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          {/* Logo and Brand */}
          <div className="flex items-center flex-shrink-0">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-12 h-12 flex items-center justify-center hover-lift transition-all duration-300 group-hover:scale-110">
                <Logo className="w-12 h-12" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gradient">
                  StartLinker
                </h1>
                <p className="text-xs text-gray-500 -mt-1">Innovation Ecosystem</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden xl:flex items-center space-x-2 ml-8">
              {navItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = isActivePath(item.path);
                
                // Special handling for Startups item with dropdown
                if (item.path === '/startups') {
                  return (
                    <div 
                      key={item.path} 
                      className="relative" 
                      ref={startupsDropdownRef}
                      onMouseEnter={handleStartupsMouseEnter}
                      onMouseLeave={handleStartupsMouseLeave}
                    >
                      <button
                        onClick={() => setIsStartupsDropdownOpen(!isStartupsDropdownOpen)}
                        className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 hover-lift relative group ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 shadow-md border border-blue-100'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                        title={item.description}
                      >
                        <IconComponent className={`w-4 h-4 mr-2 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}`} />
                        <span>{item.label}</span>
                        <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${
                          isStartupsDropdownOpen ? 'rotate-180' : ''
                        }`} />
                      </button>
                      
                      {/* Startups Dropdown Menu */}
                      {isStartupsDropdownOpen && (
                        <div 
                          className="absolute left-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-fadeInUp"
                          onMouseEnter={handleStartupsMouseEnter}
                          onMouseLeave={handleStartupsMouseLeave}
                        >
                          <Link
                            to="/startups"
                            onClick={() => setIsStartupsDropdownOpen(false)}
                            className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                          >
                            <Building className="w-4 h-4 mr-3 text-gray-500" />
                            <span>Browse Startups</span>
                          </Link>
                          <Link
                            to="/startups/new"
                            onClick={() => setIsStartupsDropdownOpen(false)}
                            className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                          >
                            <Plus className="w-4 h-4 mr-3 text-blue-500" />
                            <span>Submit Your Startup</span>
                          </Link>
                          <Link
                            to="/startup-guide"
                            onClick={() => setIsStartupsDropdownOpen(false)}
                            className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                          >
                            <BookOpen className="w-4 h-4 mr-3 text-gray-500" />
                            <span>Startup Guide</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                }
                
                // Special handling for Jobs item with dropdown
                if (item.path === '/jobs') {
                  return (
                    <div 
                      key={item.path} 
                      className="relative" 
                      ref={jobsDropdownRef}
                      onMouseEnter={handleJobsMouseEnter}
                      onMouseLeave={handleJobsMouseLeave}
                    >
                      <button
                        onClick={() => setIsJobsDropdownOpen(!isJobsDropdownOpen)}
                        className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 hover-lift relative group ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 shadow-md border border-blue-100'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                        title={item.description}
                      >
                        <IconComponent className={`w-4 h-4 mr-2 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}`} />
                        <span>{item.label}</span>
                        <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${
                          isJobsDropdownOpen ? 'rotate-180' : ''
                        }`} />
                      </button>
                      
                      {/* Jobs Dropdown Menu */}
                      {isJobsDropdownOpen && (
                        <div 
                          className="absolute left-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-fadeInUp"
                          onMouseEnter={handleJobsMouseEnter}
                          onMouseLeave={handleJobsMouseLeave}
                        >
                          <Link
                            to="/jobs"
                            onClick={() => setIsJobsDropdownOpen(false)}
                            className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                          >
                            <Briefcase className="w-4 h-4 mr-3 text-gray-500" />
                            <span>Browse Jobs</span>
                          </Link>
                          <button
                            onClick={() => {
                              setIsJobsDropdownOpen(false);
                              // Trigger job upload form modal
                              const jobsPage = document.querySelector('[data-page="jobs"]');
                              if (jobsPage) {
                                // If we're on the jobs page, trigger the modal directly
                                window.dispatchEvent(new CustomEvent('openJobUploadForm'));
                              } else {
                                // Navigate to jobs page and then open modal
                                navigate('/jobs', { state: { openJobForm: true } });
                              }
                            }}
                            className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors text-left"
                          >
                            <Plus className="w-4 h-4 mr-3 text-purple-500" />
                            <span>Post a Job</span>
                          </button>
                          {/* My Jobs Section */}
                          <div className="px-4 py-2 border-t border-gray-100">
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                              My Jobs
                            </div>
                            <Link
                              to="/my-jobs/posted"
                              onClick={() => setIsJobsDropdownOpen(false)}
                              className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors rounded-lg"
                            >
                              <Upload className="w-4 h-4 mr-3 text-gray-500" />
                              <span>Jobs Posted</span>
                            </Link>
                            <Link
                              to="/my-jobs/applied"
                              onClick={() => setIsJobsDropdownOpen(false)}
                              className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors rounded-lg"
                            >
                              <Briefcase className="w-4 h-4 mr-3 text-gray-500" />
                              <span>Jobs Applied</span>
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 hover-lift relative group ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 shadow-md border border-blue-100'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    title={item.description}
                  >
                    <IconComponent className={`w-4 h-4 mr-2 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}`} />
                    <span>{item.label}</span>
                    {item.isPro && (
                      <span className="ml-2 px-1.5 py-0.5 text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full">
                        PRO
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Enhanced Search Bar */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-4 lg:mx-8" ref={searchRef}>
            <div className="relative w-full">
              <form onSubmit={handleQuickSearchSubmit} className="w-full">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    {isSearching ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500"></div>
                    ) : (
                      <Search className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <input
                    type="text"
                    value={quickSearchQuery}
                    onChange={(e) => setQuickSearchQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    placeholder="Search startups, jobs, industries..."
                    className="block w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-2xl leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-0 focus:border-blue-500 focus:bg-white text-base font-medium text-gray-900 transition-all duration-300 hover:border-gray-300 hover:shadow-lg shadow-sm"
                  />
                  {quickSearchQuery && (
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                      <button
                        type="button"
                        onClick={handleQuickSearchClear}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>
              </form>

              {/* Enhanced Quick Search Dropdown */}
              {showQuickSearch && searchFocused && (
                <div 
                  ref={dropdownRef}
                  className="absolute z-50 mt-3 w-full bg-white shadow-2xl max-h-96 rounded-2xl py-3 text-base border border-gray-100 overflow-auto animate-fadeInUp"
                  style={{ backdropFilter: 'blur(10px)', minWidth: '100%' }}
                >
                  {/* Search Error */}
                  {searchError && (
                    <div className="px-4 py-3 text-sm text-red-600 bg-red-50 border-b border-red-100">
                      {searchError}
                    </div>
                  )}

                  {/* Search Results */}
                  {quickSearchQuery.length > 1 && !searchError && (quickSearchResults.startups.length > 0 || quickSearchResults.jobs.length > 0) ? (
                    <>
                      {quickSearchResults.startups.length > 0 && (
                        <div>
                          <div className="px-8 py-4 text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50">
                            <Building className="w-4 h-4 inline mr-3" />
                            Startups
                          </div>
                          {quickSearchResults.startups.map((startup) => (
                            <button
                              key={startup.id}
                              onClick={() => handleSearchItemClick('startup', startup)}
                              className="w-full cursor-pointer select-none relative py-5 px-8 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 text-gray-900 transition-all duration-200 flex items-center group border-b border-gray-50 last:border-b-0"
                            >
                              <span className="text-lg mr-3">{startup.logo || '🚀'}</span>
                              <div className="text-left">
                                <span className="block font-medium">{startup.name}</span>
                                <span className="block text-sm text-gray-500">{startup.industry?.name || startup.industry_name || 'Tech'}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {quickSearchResults.jobs.length > 0 && (
                        <div>
                          <div className="px-8 py-4 text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-100 bg-gradient-to-r from-gray-50 to-green-50">
                            <Briefcase className="w-4 h-4 inline mr-3" />
                            Jobs
                          </div>
                          {quickSearchResults.jobs.map((job) => (
                            <button
                              key={job.id}
                              onClick={() => handleSearchItemClick('job', job)}
                              className="w-full cursor-pointer select-none relative py-5 px-8 hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 text-gray-900 transition-all duration-200 flex items-center group border-b border-gray-50 last:border-b-0"
                            >
                              <Briefcase className="w-4 h-4 text-gray-400 mr-3" />
                              <div className="text-left">
                                <span className="block font-medium">{job.title}</span>
                                <span className="block text-sm text-gray-500">{job.startup?.name || job.startup_name || 'Company'}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : quickSearchQuery.length > 1 && !searchError && (quickSearchResults.startups.length === 0 && quickSearchResults.jobs.length === 0) ? (
                    <div className="px-8 py-8 text-center text-gray-500">
                      <div className="text-sm">No results found for "{quickSearchQuery}"</div>
                      <div className="text-xs mt-1">Try different keywords or check spelling</div>
                    </div>
                  ) : quickSearchQuery.length === 0 ? (
                    <>
                      {/* Recent Searches */}
                      {recentSearches.length > 0 && (
                        <div>
                          <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-50 flex items-center justify-between">
                            <span>Recent Searches</span>
                            <button
                              onClick={() => {
                                setRecentSearches([]);
                                localStorage.removeItem('recent_searches');
                              }}
                              className="text-xs text-blue-600 hover:text-blue-700 font-medium normal-case"
                            >
                              Clear
                            </button>
                          </div>
                          {recentSearches.map((search, index) => (
                            <button
                              key={index}
                              onClick={() => handleSearchItemClick('search', search)}
                              className="w-full cursor-pointer select-none relative py-3 pl-4 pr-9 hover:bg-gray-50 text-gray-900 transition-colors flex items-center"
                            >
                              <Clock className="w-4 h-4 text-gray-400 mr-3" />
                              <span className="text-left">{search}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Trending Searches */}
                      <div>
                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-50">
                          Trending Searches
                        </div>
                        {trendingSearches.map((search, index) => (
                          <button
                            key={index}
                            onClick={() => handleSearchItemClick('search', search)}
                            className="w-full cursor-pointer select-none relative py-3 pl-4 pr-9 hover:bg-gray-50 text-gray-900 transition-colors flex items-center"
                          >
                            <TrendingUp className="w-4 h-4 text-gray-400 mr-3" />
                            <span className="text-left">{search}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  ) : null}

                  {/* Search All Option */}
                  {quickSearchQuery.length > 1 && (
                    <div className="border-t border-gray-50 px-4 py-2">
                      <button
                        onClick={handleQuickSearchSubmit}
                        className="flex items-center w-full text-left py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <Search className="w-4 h-4 mr-2" />
                        Search all for "{quickSearchQuery}"
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right side items */}
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            {/* Notification Bell */}
            <div className="hidden sm:block">
              <NotificationBell />
            </div>

            {/* Messages Button */}
            <Link
              to="/messages"
              className="relative p-2 sm:p-3 text-gray-600 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-xl transition-all duration-300 hover-lift group"
              title="Messages"
            >
              <MessageSquare className="h-5 w-5 transition-transform group-hover:scale-110" />
              {unreadMessageCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center font-bold shadow-lg animate-pulse-gentle text-xs">
                  {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                </span>
              )}
            </Link>

            {/* User Profile Dropdown */}
            <div className="relative hidden sm:block" ref={profileDropdownRef}>
              <button
                onClick={toggleProfileDropdown}
                className="flex items-center space-x-2 p-2 rounded-xl text-sm font-medium transition-all duration-300 hover-lift group text-gray-600 hover:text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <img
                  src={getAvatarUrl(user, 32)}
                  alt={getUserDisplayName(user)}
                  className="w-8 h-8 rounded-full object-cover shadow-sm border-2 border-white ring-2 ring-gray-100"
                  onError={(e) => {
                    // Fallback to initials avatar if image fails to load
                    const initials = getUserInitials();
                    e.target.src = `https://ui-avatars.com/?name=${encodeURIComponent(initials)}&background=3b82f6&color=fff&size=32&bold=true`;
                  }}
                />
                <div className="hidden xl:block text-left">
                  <div className="text-sm font-medium text-gray-900 leading-tight">{getUserDisplayName(user)}</div>
                  {user?.is_premium && (
                    <div className="text-xs text-amber-600 flex items-center leading-none mt-0.5">
                      <Award className="w-2.5 h-2.5 mr-1" />
                      Pro
                    </div>
                  )}
                  {(user?.is_staff || user?.is_superuser) && !user?.is_premium && (
                    <div className="text-xs text-blue-600 flex items-center leading-none mt-0.5">
                      <Shield className="w-2.5 h-2.5 mr-1" />
                      Admin
                    </div>
                  )}
                </div>
                <ChevronDown className="hidden xl:block w-3 h-3 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </button>

              {/* Enhanced Profile Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-fadeInUp">
                    {/* Profile Header */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <img
                          src={getAvatarUrl(user, 40)}
                          alt={getUserDisplayName(user)}
                          className="w-10 h-10 rounded-lg object-cover shadow-sm"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate">{getUserDisplayName(user)}</div>
                          <div className="text-xs text-gray-500 truncate">{user?.email}</div>
                          <div className="flex items-center space-x-1 mt-1">
                            {user?.is_premium && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                <Award className="w-2.5 h-2.5 mr-1" />
                                Pro
                              </span>
                            )}
                            {(user?.is_staff || user?.is_superuser) && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <Shield className="w-2.5 h-2.5 mr-1" />
                                Admin
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* User Stats */}
                    {userStats && (
                      <div className="px-4 py-2 border-b border-gray-100">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center p-2 bg-gray-50 rounded-lg">
                            <div className="text-sm font-bold text-gray-900">{userStats.totals?.bookmarks || 0}</div>
                            <div className="text-xs text-gray-600">Bookmarks</div>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded-lg">
                            <div className="text-sm font-bold text-gray-900">{userStats.totals?.ratings || 0}</div>
                            <div className="text-xs text-gray-600">Ratings</div>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded-lg">
                            <div className="text-sm font-bold text-gray-900">{userStats.totals?.applications || 0}</div>
                            <div className="text-xs text-gray-600">Applied</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Menu Items */}
                    <div className="py-1">
                      {getMenuItems().map((item, index) => {
                        const IconComponent = item.icon;
                        const isFirstAdmin = item.isAdmin && index > 0 && !getMenuItems()[index - 1]?.isAdmin;
                        return (
                          <React.Fragment key={item.path}>
                            {isFirstAdmin && (
                              <div className="my-1 mx-3 border-t border-gray-100"></div>
                            )}
                            <Link
                              to={item.path}
                              className="flex items-center mx-2 px-3 py-2.5 rounded-lg text-sm transition-colors text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                              onClick={() => setIsProfileDropdownOpen(false)}
                              title={item.description}
                            >
                              <IconComponent className="w-4 h-4 mr-3 text-gray-500" />
                              <span className="flex-1 truncate">{item.label}</span>
                              {item.isAdmin && (
                                <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded-full font-medium">
                                  Admin
                                </span>
                              )}
                              {item.path === '/my-claims' && (
                                <span className="ml-2 bg-orange-100 text-orange-800 text-xs px-1.5 py-0.5 rounded-full font-medium">
                                  New
                                </span>
                              )}
                            </Link>
                          </React.Fragment>
                        );
                      })}
                    </div>

                    {/* Upgrade to Premium (if not premium) */}
                    {!user?.is_premium && (
                      <div className="px-2 py-2 border-t border-gray-100">
                        <button
                          onClick={() => {
                            navigate('/settings');
                            setIsProfileDropdownOpen(false);
                          }}
                          className="w-full flex items-center justify-center px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200 font-medium text-sm"
                        >
                          <Rocket className="w-4 h-4 mr-2" />
                          <span>Upgrade to Pro</span>
                        </button>
                      </div>
                    )}

                    {/* Logout */}
                    <div className="px-2 py-2 border-t border-gray-100">
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Sign Out
                      </button>
                    </div>
                </div>
              )}
            </div>

            {/* Mobile Profile/Menu Button */}
            <div className="sm:hidden flex items-center space-x-2">
              {/* Mobile Profile Avatar */}
              <button
                onClick={toggleMobileMenu}
                className="flex items-center space-x-2 p-1 rounded-lg transition-all duration-300 hover:bg-gray-50"
              >
                <img
                  src={getAvatarUrl(user, 28)}
                  alt={getUserDisplayName(user)}
                  className="w-7 h-7 rounded-full object-cover shadow-sm border border-gray-200"
                />
              </button>
              
              {/* Mobile Menu Toggle */}
              <button
                onClick={toggleMobileMenu}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 py-4 max-h-[calc(100vh-64px)] overflow-y-auto">
            {/* Mobile Search */}
            <div className="px-4 mb-4 md:hidden">
              <form onSubmit={handleQuickSearchSubmit}>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={quickSearchQuery}
                    onChange={(e) => setQuickSearchQuery(e.target.value)}
                    placeholder="Search startups, jobs..."
                    className="block w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all"
                  />
                </div>
              </form>
            </div>

            {/* Mobile Navigation */}
            <div className="space-y-1 px-4">
              {navItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = isActivePath(item.path);
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <IconComponent className="w-4 h-4 mr-3 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{item.label}</div>
                      <div className="text-xs text-gray-500 truncate">{item.description}</div>
                    </div>
                  </Link>
                );
              })}
              
              {/* Mobile Submit Startup Button */}
              <Link
                to="/startups/new"
                className="flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-colors bg-blue-50 text-blue-700 hover:bg-blue-100"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Plus className="w-4 h-4 mr-3 flex-shrink-0 text-blue-600" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">Submit Your Startup</div>
                  <div className="text-xs text-blue-600 truncate">Share your innovation</div>
                </div>
              </Link>
              
              {/* Mobile Post a Job Button */}
              <Link
                to="/jobs/new"
                className="flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-colors bg-purple-50 text-purple-700 hover:bg-purple-100"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Plus className="w-4 h-4 mr-3 flex-shrink-0 text-purple-600" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">Post a Job</div>
                  <div className="text-xs text-purple-600 truncate">Find your team</div>
                </div>
              </Link>
            </div>

            {/* Mobile Actions Section */}
            <div className="mt-6 px-4 flex items-center justify-center space-x-4 border-t border-gray-100 pt-4">
              {/* Mobile Notification Bell */}
              <div className="flex-1 flex justify-center">
                <NotificationBell />
              </div>
              
              {/* Mobile Messages Button */}
              <Link
                to="/messages"
                className="relative p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-300"
                onClick={() => setIsMobileMenuOpen(false)}
                title="Messages"
              >
                <MessageSquare className="h-5 w-5" />
                {unreadMessageCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                    {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                  </span>
                )}
              </Link>
            </div>

            {/* Mobile Profile Section */}
            <div className="mt-4 px-4">
              <div className="flex items-center space-x-3 mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                <img
                  src={getAvatarUrl(user, 40)}
                  alt={getUserDisplayName(user)}
                  className="w-10 h-10 rounded-xl object-cover shadow-sm flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-gray-900 truncate">{getUserDisplayName(user)}</div>
                  <div className="text-sm text-gray-500 truncate">{user?.email}</div>
                  {(user?.is_staff || user?.is_superuser) && (
                    <div className="text-xs text-blue-600 flex items-center mt-1">
                      <Shield className="w-3 h-3 mr-1" />
                      Admin
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                {getMenuItems().map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center px-3 py-2.5 text-sm rounded-xl transition-colors ${
                        item.isAdmin 
                          ? 'text-blue-700 hover:bg-blue-50' 
                          : item.path === '/my-claims'
                            ? 'text-orange-700 hover:bg-orange-50'
                            : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <IconComponent className={`w-4 h-4 mr-3 flex-shrink-0 ${
                        item.isAdmin 
                          ? 'text-blue-600' 
                          : item.path === '/my-claims'
                            ? 'text-orange-600'
                            : 'text-gray-400'
                      }`} />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.isAdmin && (
                        <span className="ml-auto bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex-shrink-0">
                          Admin
                        </span>
                      )}
                      {item.path === '/my-claims' && (
                        <span className="ml-auto bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full flex-shrink-0">
                          New
                        </span>
                      )}
                    </Link>
                  );
                })}
                
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </nav>
  );
};

export default Navbar;