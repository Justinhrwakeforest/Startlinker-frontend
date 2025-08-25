// Dashboard Component - Updated with autoplay featured section
import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Star, MapPin, Users, Clock, ChevronRight, 
  Briefcase, Building, Award, Activity, Calendar, 
  ArrowUp, ArrowDown, Eye, Heart, Bookmark, Search,
  Zap, Target, Rocket, Filter, AlertCircle, Plus,
  Globe, DollarSign, Flame, Mail, Bell, Settings, BarChart3,
  ExternalLink, Sparkles, ChevronLeft, Shield, CheckCircle
} from 'lucide-react';

const Dashboard = () => {
  const [featuredStartups, setFeaturedStartups] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentFeaturedIndex, setCurrentFeaturedIndex] = useState(0);
  const [isAutoplayPaused, setIsAutoplayPaused] = useState(false);

  // Mock data for demonstration
  const mockFeaturedStartups = [
    {
      id: 1,
      name: "TechFlow AI",
      description: "Revolutionary AI platform transforming enterprise workflows with intelligent automation and predictive analytics.",
      industry_name: "Artificial Intelligence",
      industry_icon: "🤖",
      location: "San Francisco, CA",
      founded_year: 2022,
      employee_count: "50-100",
      average_rating: 4.8,
      funding_amount: "$15M Series A",
      logo: "🚀",
      cover_image_display_url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop",
      is_featured: true,
      is_claimed: true,
      claim_verified: true,
      claimed_by_username: "john_doe"
    },
    {
      id: 2,
      name: "EcoCharge",
      description: "Sustainable energy solutions for electric vehicle charging infrastructure across urban environments.",
      industry_name: "CleanTech",
      industry_icon: "⚡",
      location: "Austin, TX",
      founded_year: 2021,
      employee_count: "25-50",
      average_rating: 4.6,
      funding_amount: "$8M Seed",
      logo: "🔋",
      cover_image_display_url: "https://images.unsplash.com/photo-1593941707882-a5bac6861d75?w=800&h=400&fit=crop",
      is_featured: true,
      is_claimed: false,
      claim_verified: false
    },
    {
      id: 3,
      name: "HealthAI",
      description: "AI-powered medical diagnosis platform helping doctors make faster and more accurate treatment decisions.",
      industry_name: "HealthTech",
      industry_icon: "🏥",
      location: "Boston, MA",
      founded_year: 2020,
      employee_count: "100+",
      average_rating: 4.9,
      funding_amount: "$25M Series B",
      logo: "💊",
      cover_image_display_url: null,
      is_featured: true,
      is_claimed: true,
      claim_verified: true,
      claimed_by_username: "dr_smith"
    }
  ];

  const mockRecentJobs = [
    {
      id: 1,
      title: "Senior Frontend Developer",
      startup_name: "TechFlow AI",
      startup: 1,
      location: "San Francisco, CA",
      posted_ago: "2 days ago",
      job_type_name: "Full-time",
      is_remote: true,
      is_urgent: false
    },
    {
      id: 2,
      title: "Product Manager",
      startup_name: "EcoCharge",
      startup: 2,
      location: "Austin, TX",
      posted_ago: "1 week ago",
      job_type_name: "Full-time",
      is_remote: false,
      is_urgent: true
    },
    {
      id: 3,
      title: "ML Engineer",
      startup_name: "HealthAI",
      startup: 3,
      location: "Boston, MA",
      posted_ago: "3 days ago",
      job_type_name: "Full-time",
      is_remote: true,
      is_urgent: false
    }
  ];

  const quickActions = [
    {
      title: 'Discover Startups',
      description: 'Explore innovative companies',
      IconComponent: Building,
      link: '/startups',
      gradient: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      title: 'Find Opportunities',
      description: 'Browse career openings',
      IconComponent: Briefcase,
      link: '/jobs',
      gradient: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      title: 'My Profile',
      description: 'Manage your account',
      IconComponent: Users,
      link: '/profile',
      gradient: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    }
  ];

  useEffect(() => {
    // Simulate API call with mock data
    setLoading(true);
    setTimeout(() => {
      setFeaturedStartups(mockFeaturedStartups);
      setRecentJobs(mockRecentJobs);
      setLoading(false);
    }, 1000);
  }, []);

  // Autoplay functionality for featured startups
  useEffect(() => {
    if (featuredStartups.length > 1 && !isAutoplayPaused) {
      const interval = setInterval(() => {
        setCurrentFeaturedIndex((prevIndex) => 
          (prevIndex + 1) % featuredStartups.length
        );
      }, 5000); // 5 seconds delay

      return () => clearInterval(interval);
    }
  }, [featuredStartups.length, isAutoplayPaused]);

  const fetchDashboardData = () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call with mock data
      setTimeout(() => {
        setFeaturedStartups(mockFeaturedStartups);
        setRecentJobs(mockRecentJobs);
        setLoading(false);
      }, 1000);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleFeaturedNavigation = (direction) => {
    setIsAutoplayPaused(true);
    if (direction === 'next') {
      setCurrentFeaturedIndex((prevIndex) => 
        (prevIndex + 1) % featuredStartups.length
      );
    } else {
      setCurrentFeaturedIndex((prevIndex) => 
        prevIndex === 0 ? featuredStartups.length - 1 : prevIndex - 1
      );
    }
    
    // Resume autoplay after 10 seconds of manual interaction
    setTimeout(() => setIsAutoplayPaused(false), 10000);
  };

  const handleDotClick = (index) => {
    setIsAutoplayPaused(true);
    setCurrentFeaturedIndex(index);
    setTimeout(() => setIsAutoplayPaused(false), 10000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Dashboard Error</h2>
          <p className="text-gray-600 mb-4">Failed to load dashboard data: {error}</p>
          <button 
            onClick={fetchDashboardData}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const currentFeatured = featuredStartups[currentFeaturedIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        
        {/* Hero Welcome Section */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-8 md:p-12">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Welcome to <span className="text-blue-600">Startlinker</span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8">
                Connect with innovative startups and discover your next opportunity
              </p>
              
              {/* Quick Actions - Responsive Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-4xl mx-auto">
                {quickActions.map((action, index) => {
                  const IconComponent = action.IconComponent;
                  return (
                    <a
                      key={index}
                      href={action.link}
                      className={`group relative p-4 sm:p-6 ${action.bgColor} ${action.borderColor} border-2 rounded-xl sm:rounded-2xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 block`}
                    >
                      <div className="text-center">
                        <div className={`inline-flex p-3 sm:p-4 bg-gradient-to-br ${action.gradient} rounded-xl sm:rounded-2xl shadow-lg mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300`}>
                          <IconComponent className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
                          {action.title}
                        </h3>
                        <p className="text-sm text-gray-600">{action.description}</p>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Responsive Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12">
          
          {/* Featured Startups Carousel - Full width on mobile, 2/3 on desktop */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 sm:p-6 lg:p-8 border-b border-amber-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="p-2 sm:p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl sm:rounded-2xl shadow-lg">
                      <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Featured Startups</h2>
                      <p className="text-amber-700 text-sm sm:text-base">Discover the most promising companies</p>
                    </div>
                  </div>
                  <a
                    href="/startups"
                    className="hidden sm:flex items-center space-x-2 px-3 sm:px-4 py-2 bg-white border border-amber-200 text-amber-700 font-medium rounded-lg sm:rounded-xl hover:bg-amber-50 transition-colors text-sm"
                  >
                    <span>View all</span>
                    <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                  </a>
                </div>
              </div>
              
              <div className="relative">
                {featuredStartups.length > 0 && currentFeatured ? (
                  <div className="relative">
                    {/* Main Featured Startup Card */}
                    <div className="relative h-64 sm:h-80 lg:h-96 overflow-hidden">
                      {/* Background Image or Gradient */}
                      {currentFeatured.cover_image_display_url ? (
                        <div className="absolute inset-0">
                          <img 
                            src={currentFeatured.cover_image_display_url}
                            alt={`${currentFeatured.name} cover`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/60"></div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700">
                          <div className="absolute inset-0 bg-black/20"></div>
                        </div>
                      )}

                      {/* Content Overlay */}
                      <div className="absolute inset-0 flex items-end">
                        <div className="w-full p-4 sm:p-6 lg:p-8">
                          <a
                            href={`/startups/${currentFeatured.id}`}
                            className="block group"
                          >
                            <div className="flex items-start space-x-3 sm:space-x-4">
                              <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-xl sm:rounded-2xl shadow-lg border-2 sm:border-4 border-white flex items-center justify-center text-lg sm:text-2xl font-bold relative">
                                {currentFeatured.logo}
                                <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-6 sm:h-6 bg-amber-500 rounded-full flex items-center justify-center">
                                  <Award className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                                </div>
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white drop-shadow-lg group-hover:text-amber-200 transition-colors">
                                    {currentFeatured.name}
                                  </h3>
                                  <span className="px-2 sm:px-3 py-1 bg-gradient-to-r from-amber-400 to-amber-500 text-white rounded-full text-xs sm:text-sm font-semibold flex items-center shadow-lg">
                                    <Award className="w-2 h-2 sm:w-3 sm:h-3 mr-1" /> Featured
                                  </span>
                                  {currentFeatured.is_claimed && currentFeatured.claim_verified && (
                                    <span className="px-2 sm:px-3 py-1 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-full text-xs sm:text-sm font-semibold flex items-center shadow-lg">
                                      <CheckCircle className="w-2 h-2 sm:w-3 sm:h-3 mr-1" /> Verified
                                    </span>
                                  )}
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-2 sm:mb-3">
                                  <span className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium bg-white/90 backdrop-blur-sm text-slate-800 border border-white/20">
                                    {currentFeatured.industry_icon} {currentFeatured.industry_name}
                                  </span>
                                  <div className="flex items-center text-white/90 font-medium drop-shadow text-sm sm:text-base">
                                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> {currentFeatured.location}
                                  </div>
                                  <div className="flex items-center text-white/90 font-medium drop-shadow text-sm sm:text-base">
                                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Founded {currentFeatured.founded_year}
                                  </div>
                                </div>
                                
                                <p className="text-white/95 text-sm sm:text-base lg:text-lg leading-relaxed drop-shadow line-clamp-2 sm:line-clamp-3">
                                  {currentFeatured.description}
                                </p>
                                
                                {/* Stats Row */}
                                <div className="flex items-center space-x-4 sm:space-x-6 mt-3 sm:mt-4">
                                  <div className="flex items-center text-white/90 font-medium drop-shadow text-sm">
                                    <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> 
                                    {currentFeatured.employee_count} employees
                                  </div>
                                  <div className="flex items-center text-white/90 font-medium drop-shadow text-sm">
                                    <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-amber-400" /> 
                                    {currentFeatured.average_rating?.toFixed(1) || 'N/A'}
                                  </div>
                                  {currentFeatured.funding_amount && (
                                    <div className="flex items-center text-white/90 font-medium drop-shadow text-sm">
                                      <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> 
                                      {currentFeatured.funding_amount}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </a>
                        </div>
                      </div>

                      {/* Navigation Arrows */}
                      {featuredStartups.length > 1 && (
                        <>
                          <button
                            onClick={() => handleFeaturedNavigation('prev')}
                            className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-200 z-10"
                          >
                            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                          <button
                            onClick={() => handleFeaturedNavigation('next')}
                            className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-200 z-10"
                          >
                            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Dots Indicator */}
                    {featuredStartups.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
                        {featuredStartups.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => handleDotClick(index)}
                            className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-200 ${
                              index === currentFeaturedIndex 
                                ? 'bg-white shadow-lg' 
                                : 'bg-white/50 hover:bg-white/75'
                            }`}
                          />
                        ))}
                      </div>
                    )}

                    {/* Mobile View All Link */}
                    <div className="sm:hidden p-4 border-t border-gray-100">
                      <a
                        href="/startups"
                        className="flex items-center justify-center space-x-2 px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 font-medium rounded-lg hover:bg-amber-100 transition-colors text-sm w-full"
                      >
                        <span>View all startups</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 sm:p-12 text-center">
                    <Building className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Featured Startups</h3>
                    <p className="text-gray-500">Check back soon for featured companies.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Activity - Responsive */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 overflow-hidden h-fit">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6 border-b border-blue-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl shadow-lg">
                    <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900">Recent Activity</h3>
                    <p className="text-blue-700 text-xs sm:text-sm">Your latest interactions</p>
                  </div>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  {[
                    { icon: Star, action: 'You rated HealthAI', time: '2 hours ago', color: 'bg-amber-50 text-amber-600 border-amber-200' },
                    { icon: Bookmark, action: 'Bookmarked EcoCharge', time: '1 day ago', color: 'bg-blue-50 text-blue-600 border-blue-200' },
                    { icon: Briefcase, action: 'Applied to Software Engineer', time: '2 days ago', color: 'bg-purple-50 text-purple-600 border-purple-200' },
                    { icon: Eye, action: 'Viewed PayFlow startup', time: '3 days ago', color: 'bg-green-50 text-green-600 border-green-200' }
                  ].map((activity, index) => {
                    const ActivityIcon = activity.icon;
                    return (
                      <div 
                        key={index}
                        className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 border-gray-100 hover:shadow-md transition-all duration-200"
                      >
                        <div className={`p-1.5 sm:p-2 ${activity.color} border rounded-lg sm:rounded-xl`}>
                          <ActivityIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{activity.action}</p>
                          <p className="text-xs text-gray-500">{activity.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Latest Jobs - Responsive */}
        <div className="mb-8 sm:mb-12">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 sm:p-6 lg:p-8 border-b border-purple-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="p-2 sm:p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl sm:rounded-2xl shadow-lg">
                    <Rocket className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Latest Opportunities</h2>
                    <p className="text-purple-700 text-sm sm:text-base">Find your next career move</p>
                  </div>
                </div>
                <a
                  href="/jobs"
                  className="hidden sm:flex items-center space-x-2 px-3 sm:px-4 py-2 bg-white border border-purple-200 text-purple-700 font-medium rounded-lg sm:rounded-xl hover:bg-purple-50 transition-colors text-sm"
                >
                  <span>View all</span>
                  <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                </a>
              </div>
            </div>
            
            <div className="p-4 sm:p-6 lg:p-8">
              {recentJobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {recentJobs.map((job) => (
                    <div
                      key={job.id}
                      className="p-4 sm:p-6 border-2 border-gray-100 rounded-xl sm:rounded-2xl hover:border-purple-300 hover:shadow-lg transition-all duration-300 group bg-gradient-to-br from-gray-50 to-white hover:from-purple-50"
                    >
                      <div className="flex justify-between items-start mb-3 sm:mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors truncate">
                            {job.title}
                          </h3>
                          <a 
                            href={`/startups/${job.startup}`}
                            className="text-sm text-blue-600 hover:text-blue-500 font-semibold truncate block"
                          >
                            {job.startup_name}
                          </a>
                        </div>
                        {job.is_urgent && (
                          <span className="px-2 sm:px-3 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-lg sm:rounded-xl border border-red-200 ml-2">
                            Urgent
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="truncate">{job.location}</span>
                          {job.is_remote && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-md flex-shrink-0">
                              Remote
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span>{job.posted_ago}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-green-100 text-green-800 text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl border border-green-200">
                          {job.job_type_name}
                        </span>
                        <button className="p-1.5 sm:p-2 text-purple-600 hover:text-purple-500 hover:bg-purple-50 rounded-lg sm:rounded-xl transition-colors">
                          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <Briefcase className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Jobs Available</h3>
                  <p className="text-gray-500 mb-4 sm:mb-6">Check back soon for new opportunities.</p>
                  <a
                    href="/jobs"
                    className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-purple-600 text-white text-sm font-bold rounded-lg sm:rounded-xl hover:bg-purple-700 transition-colors shadow-lg"
                  >
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Explore All Jobs
                  </a>
                </div>
              )}
              
              {/* Mobile View All Link for Jobs */}
              <div className="sm:hidden mt-4 pt-4 border-t border-gray-100">
                <a
                  href="/jobs"
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-purple-50 border border-purple-200 text-purple-700 font-medium rounded-lg hover:bg-purple-100 transition-colors text-sm w-full"
                >
                  <span>View all opportunities</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Insights - Responsive Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          
          {/* Market Trends */}
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 sm:p-6 border-b border-green-100">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg sm:rounded-xl shadow-lg">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">Market Trends</h3>
                  <p className="text-green-700 text-xs sm:text-sm">Growing industries</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 sm:p-6">
              <div className="space-y-4 sm:space-y-6">
                <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl sm:rounded-2xl border-2 border-blue-200">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <span className="text-sm font-bold text-gray-700">AI & Machine Learning</span>
                    <span className="text-sm font-bold text-blue-600 bg-white px-2 py-1 rounded-lg">+24%</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2 sm:h-3">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 sm:h-3 rounded-full shadow-sm" style={{width: '75%'}}></div>
                  </div>
                </div>
                
                <div className="p-3 sm:p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl sm:rounded-2xl border-2 border-green-200">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <span className="text-sm font-bold text-gray-700">FinTech</span>
                    <span className="text-sm font-bold text-green-600 bg-white px-2 py-1 rounded-lg">+18%</span>
                  </div>
                  <div className="w-full bg-green-200 rounded-full h-2 sm:h-3">
                    <div className="bg-gradient-to-r from-green-500 to-green-600 h-2 sm:h-3 rounded-full shadow-sm" style={{width: '65%'}}></div>
                  </div>
                </div>
                
                <div className="p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl sm:rounded-2xl border-2 border-purple-200">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <span className="text-sm font-bold text-gray-700">HealthTech</span>
                    <span className="text-sm font-bold text-purple-600 bg-white px-2 py-1 rounded-lg">+15%</span>
                  </div>
                  <div className="w-full bg-purple-200 rounded-full h-2 sm:h-3">
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 sm:h-3 rounded-full shadow-sm" style={{width: '55%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Popular Topics */}
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 sm:p-6 border-b border-orange-100">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg sm:rounded-xl shadow-lg">
                  <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">Popular Topics</h3>
                  <p className="text-orange-700 text-xs sm:text-sm">Trending discussions</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
                {[
                  { tag: 'Remote Work', count: '1.2k', color: 'bg-blue-100 text-blue-800 border-blue-200' },
                  { tag: 'AI Startups', count: '890', color: 'bg-purple-100 text-purple-800 border-purple-200' },
                  { tag: 'Web3', count: '650', color: 'bg-orange-100 text-orange-800 border-orange-200' },
                  { tag: 'Climate Tech', count: '420', color: 'bg-green-100 text-green-800 border-green-200' },
                  { tag: 'EdTech', count: '380', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
                  { tag: 'Crypto', count: '290', color: 'bg-amber-100 text-amber-800 border-amber-200' }
                ].map((topic, index) => (
                  <div 
                    key={index}
                    className={`px-2 sm:px-3 py-2 sm:py-3 ${topic.color} border-2 rounded-lg sm:rounded-xl hover:shadow-md transition-all duration-200 cursor-pointer transform hover:-translate-y-1`}
                  >
                    <div className="text-center">
                      <div className="font-bold text-xs sm:text-sm mb-1">{topic.tag}</div>
                      <div className="text-xs bg-white bg-opacity-80 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md font-medium">
                        {topic.count}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl border-2 border-gray-200">
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-gray-900 mb-1">Pro Tip</p>
                    <p className="text-xs sm:text-sm text-gray-600">Follow trending topics to discover emerging opportunities before they go mainstream.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;