// src/components/activity/ActivityFeed.js - Comprehensive Activity Feed
import React, { useState, useEffect } from 'react';
import { 
  Trophy, Star, Crown, Shield, Award, TrendingUp, Target, Zap, Users, Calendar, 
  ArrowUp, Search, Filter, Download, RefreshCw, ChevronDown, Clock, MapPin,
  MessageCircle, Heart, Bookmark, Briefcase, Code, Mail, Phone, Camera,
  FileText, Share, ThumbsUp, UserPlus, Lightbulb, Gift, Flame
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const ActivityFeed = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterTimeRange, setFilterTimeRange] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // list or grid

  useEffect(() => {
    if (user) {
      fetchActivityData();
    }
  }, [user, filterCategory, filterTimeRange, searchTerm]);

  const fetchActivityData = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams({
        limit: '50',
        category: filterCategory,
        time_range: filterTimeRange,
        search: searchTerm
      });
      
      const [activitiesRes, statsRes] = await Promise.all([
        axios.get(`/auth/${user.id}/activity-feed/?${params}`),
        axios.get(`/auth/${user.id}/points/`)
      ]);

      const activityData = activitiesRes.data;
      setActivities(activityData.results || []);
      setStats({
        ...statsRes.data,
        total_activities: activityData.total_activities,
        total_points_earned: activityData.total_points_earned,
        category_stats: activityData.category_stats
      });
    } catch (error) {
      console.error('Error fetching activity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (reason) => {
    const iconMap = {
      // Onboarding & Profile
      signup_bonus: Gift,
      email_verify: Mail,
      phone_verify: Phone,
      profile_picture_upload: Camera,
      profile_bio_complete: FileText,
      profile_location_add: MapPin,
      profile_website_add: Code,
      profile_complete: Shield,
      first_interests_select: Target,
      
      // Engagement & Login
      daily_login: Calendar,
      login_streak_3: Flame,
      login_streak_7: Flame,
      login_streak_30: Flame,
      first_session: Clock,
      
      // Content Creation
      first_post: Trophy,
      post_create: FileText,
      post_with_image: Camera,
      post_with_video: Camera,
      first_story: Star,
      story_create: MessageCircle,
      story_with_media: Camera,
      comment_create: MessageCircle,
      first_comment: MessageCircle,
      
      // Startup Activities
      first_startup_submit: Crown,
      startup_submit: TrendingUp,
      startup_claim: Crown,
      startup_verify: Shield,
      startup_update: FileText,
      startup_logo_upload: Camera,
      
      // Job Activities
      first_job_post: Briefcase,
      job_post: Briefcase,
      job_apply: FileText,
      job_bookmark: Bookmark,
      resume_upload: FileText,
      resume_update: FileText,
      
      // Social Activities
      first_follow: UserPlus,
      follow_user: UserPlus,
      get_followed: Users,
      like_post: Heart,
      share_post: Share,
      bookmark_post: Bookmark,
      message_send: MessageCircle,
      first_message: MessageCircle,
      
      // Achievements & Milestones
      achievement: Trophy,
      milestone_10_posts: Award,
      milestone_50_posts: Crown,
      milestone_100_followers: Users,
      milestone_verified: Shield,
      
      // Default
      default: Star
    };
    
    return iconMap[reason] || iconMap.default;
  };

  const getActivityCategory = (reason) => {
    if (reason.startsWith('milestone_') || reason.startsWith('first_') || reason.includes('streak')) {
      return { name: 'milestone', color: 'yellow', bg: 'bg-yellow-50', border: 'border-yellow-200' };
    } else if (reason.includes('post') || reason.includes('story') || reason.includes('comment')) {
      return { name: 'content', color: 'blue', bg: 'bg-blue-50', border: 'border-blue-200' };
    } else if (reason.includes('startup')) {
      return { name: 'startup', color: 'purple', bg: 'bg-purple-50', border: 'border-purple-200' };
    } else if (reason.includes('job') || reason.includes('resume')) {
      return { name: 'job', color: 'indigo', bg: 'bg-indigo-50', border: 'border-indigo-200' };
    } else if (reason.includes('follow') || reason.includes('like') || reason.includes('share') || reason.includes('message') || reason.includes('profile') || reason.includes('login')) {
      return { name: 'social', color: 'green', bg: 'bg-green-50', border: 'border-green-200' };
    } else {
      return { name: 'general', color: 'gray', bg: 'bg-gray-50', border: 'border-gray-200' };
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) {
        return `${diffInDays}d ago`;
      } else {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
      }
    }
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || getActivityCategory(activity.reason).name === filterCategory;
    
    let matchesTimeRange = true;
    if (filterTimeRange !== 'all') {
      const activityDate = new Date(activity.created_at);
      const now = new Date();
      const diffInDays = Math.floor((now - activityDate) / (1000 * 60 * 60 * 24));
      
      switch (filterTimeRange) {
        case 'today':
          matchesTimeRange = diffInDays === 0;
          break;
        case 'week':
          matchesTimeRange = diffInDays <= 7;
          break;
        case 'month':
          matchesTimeRange = diffInDays <= 30;
          break;
        default:
          matchesTimeRange = true;
      }
    }
    
    return matchesSearch && matchesCategory && matchesTimeRange;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Enhanced Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-3xl blur-3xl"></div>
          <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-30"></div>
                  <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-2xl">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Activity Feed
                  </h1>
                  <p className="text-gray-600 mt-2 text-lg">Track your interactions and engagement on StartLinker</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button 
                  onClick={fetchActivityData}
                  className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-800 translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                  <div className="relative flex items-center space-x-2">
                    <RefreshCw className="w-5 h-5" />
                    <span>Refresh</span>
                  </div>
                </button>
                <button className="group relative overflow-hidden bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-700 to-gray-800 translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                  <div className="relative flex items-center space-x-2">
                    <Download className="w-5 h-5" />
                    <span>Export</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            <div className="group relative overflow-hidden bg-white/90 backdrop-blur-lg rounded-3xl p-6 shadow-xl border border-white/30 hover:shadow-2xl hover:scale-105 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative flex flex-col items-center text-center space-y-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                  <div className="relative p-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1">
                    {stats.total_activities || activities.length}
                  </div>
                  <div className="text-sm font-bold text-blue-600 uppercase tracking-wider">Total Activity</div>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-white/90 backdrop-blur-lg rounded-3xl p-6 shadow-xl border border-white/30 hover:shadow-2xl hover:scale-105 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative flex flex-col items-center text-center space-y-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                  <div className="relative p-4 bg-gradient-to-br from-orange-100 to-red-100 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Trophy className="w-8 h-8 text-orange-600" />
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-1">
                    {stats.total_points || 0}
                  </div>
                  <div className="text-sm font-bold text-orange-600 uppercase tracking-wider">Total Points</div>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-white/90 backdrop-blur-lg rounded-3xl p-6 shadow-xl border border-white/30 hover:shadow-2xl hover:scale-105 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative flex flex-col items-center text-center space-y-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                  <div className="relative p-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Crown className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1">
                    {stats.level || 1}
                  </div>
                  <div className="text-sm font-bold text-purple-600 uppercase tracking-wider">Level</div>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-white/90 backdrop-blur-lg rounded-3xl p-6 shadow-xl border border-white/30 hover:shadow-2xl hover:scale-105 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative flex flex-col items-center text-center space-y-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                  <div className="relative p-4 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <FileText className="w-8 h-8 text-cyan-600" />
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-1">
                    {stats.content_points || 0}
                  </div>
                  <div className="text-sm font-bold text-cyan-600 uppercase tracking-wider">Content</div>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-white/90 backdrop-blur-lg rounded-3xl p-6 shadow-xl border border-white/30 hover:shadow-2xl hover:scale-105 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative flex flex-col items-center text-center space-y-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                  <div className="relative p-4 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Users className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-1">
                    {stats.social_points || 0}
                  </div>
                  <div className="text-sm font-bold text-green-600 uppercase tracking-wider">Social</div>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-white/90 backdrop-blur-lg rounded-3xl p-6 shadow-xl border border-white/30 hover:shadow-2xl hover:scale-105 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative flex flex-col items-center text-center space-y-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                  <div className="relative p-4 bg-gradient-to-br from-violet-100 to-purple-100 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="w-8 h-8 text-violet-600" />
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mb-1">
                    {stats.startup_points || 0}
                  </div>
                  <div className="text-sm font-bold text-violet-600 uppercase tracking-wider">Startups</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Premium Filters Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-purple-600/10 rounded-3xl blur-2xl"></div>
          <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/30">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl blur-lg opacity-30"></div>
                  <div className="relative p-3 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl shadow-lg">
                    <Filter className="w-6 h-6 text-indigo-600" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Filter & Search
                </h3>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-lg opacity-20"></div>
                <div className="relative bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-3 rounded-full shadow-lg border border-white/50">
                  <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {filteredActivities.length} activities found
                  </span>
                </div>
              </div>
            </div>
          
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-6">
            {/* Premium Search */}
            <div className="flex-1 relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-300" />
                <input
                  type="text"
                  placeholder="Search activities, milestones, achievements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-white/70 backdrop-blur-sm border-2 border-white/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all duration-300 font-medium placeholder-gray-500 shadow-lg text-gray-700"
                />
              </div>
            </div>

            {/* Premium Category Filter */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="absolute left-5 top-1/2 transform -translate-y-1/2 p-2 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl shadow-sm">
                  <Target className="w-4 h-4 text-purple-600" />
                </div>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="appearance-none bg-white/70 backdrop-blur-sm border-2 border-white/50 rounded-2xl pl-16 pr-12 py-5 focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-500 focus:bg-white transition-all duration-300 font-semibold text-gray-700 shadow-lg min-w-[200px]"
                >
                  <option value="all">All Categories</option>
                  <option value="milestone">Milestones</option>
                  <option value="content">Content</option>
                  <option value="social">Social</option>
                  <option value="startup">Startups</option>
                  <option value="job">Jobs</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400 pointer-events-none group-focus-within:text-purple-500 transition-colors duration-300" />
              </div>
            </div>

            {/* Premium Time Range Filter */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="absolute left-5 top-1/2 transform -translate-y-1/2 p-2 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl shadow-sm">
                  <Calendar className="w-4 h-4 text-green-600" />
                </div>
                <select
                  value={filterTimeRange}
                  onChange={(e) => setFilterTimeRange(e.target.value)}
                  className="appearance-none bg-white/70 backdrop-blur-sm border-2 border-white/50 rounded-2xl pl-16 pr-12 py-5 focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 focus:bg-white transition-all duration-300 font-semibold text-gray-700 shadow-lg min-w-[180px]"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400 pointer-events-none group-focus-within:text-green-500 transition-colors duration-300" />
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* Premium Activity Timeline */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-3xl blur-2xl"></div>
          <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 overflow-hidden">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10"></div>
              <div className="relative px-8 py-8 border-b border-white/20">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-30"></div>
                      <div className="relative p-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl shadow-lg">
                        <TrendingUp className="w-8 h-8 text-blue-600" />
                      </div>
                    </div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Activity Timeline
                    </h2>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur-lg opacity-20"></div>
                    <div className="relative bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-3 rounded-full shadow-lg border border-white/50">
                      <span className="text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        {filteredActivities.length} activities
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-16 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-purple-200 to-green-200"></div>
            
            <div className="space-y-1">
            {filteredActivities.length > 0 ? (
              filteredActivities.map((activity, index) => {
                const IconComponent = getActivityIcon(activity.reason);
                const category = getActivityCategory(activity.reason);
                const isHighValue = activity.points >= 50;
                const isMilestone = activity.reason.startsWith('milestone_') || activity.reason.startsWith('first_');
                
                return (
                  <div 
                    key={activity.id} 
                    className={`relative group hover:shadow-md transition-all duration-300 ${
                      isMilestone ? 'bg-gradient-to-r from-yellow-50 via-orange-50 to-yellow-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* Timeline Node */}
                    <div className={`absolute left-14 top-8 w-4 h-4 rounded-full border-4 border-white shadow-lg ${
                      isMilestone ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                      category.name === 'content' ? 'bg-blue-500' :
                      category.name === 'social' ? 'bg-green-500' :
                      category.name === 'startup' ? 'bg-purple-500' :
                      category.name === 'job' ? 'bg-indigo-500' :
                      'bg-gray-400'
                    } ${isMilestone ? 'animate-pulse' : ''}`}></div>
                    
                    <div className="pl-24 pr-8 py-6">
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 group-hover:shadow-lg transition-all duration-300">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4 flex-1">
                            {/* Enhanced Icon */}
                            <div className={`relative flex-shrink-0 p-4 rounded-2xl shadow-lg ${
                              isMilestone ? 'bg-gradient-to-br from-yellow-100 to-orange-100 ring-2 ring-yellow-300' :
                              category.name === 'content' ? 'bg-gradient-to-br from-blue-100 to-cyan-100' :
                              category.name === 'social' ? 'bg-gradient-to-br from-green-100 to-emerald-100' :
                              category.name === 'startup' ? 'bg-gradient-to-br from-purple-100 to-pink-100' :
                              category.name === 'job' ? 'bg-gradient-to-br from-indigo-100 to-blue-100' :
                              'bg-gradient-to-br from-gray-100 to-slate-100'
                            } group-hover:scale-110 transition-transform duration-300`}>
                              {isMilestone && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                                  <Star className="w-2 h-2 text-yellow-800" />
                                </div>
                              )}
                              <IconComponent className={`w-6 h-6 ${
                                isMilestone ? 'text-yellow-700' :
                                category.name === 'content' ? 'text-blue-600' :
                                category.name === 'social' ? 'text-green-600' :
                                category.name === 'startup' ? 'text-purple-600' :
                                category.name === 'job' ? 'text-indigo-600' :
                                'text-gray-600'
                              }`} />
                            </div>

                            {/* Enhanced Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-2">
                                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-gray-800">
                                      {activity.description}
                                    </h3>
                                    {isMilestone && (
                                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg animate-pulse">
                                        Milestone
                                      </span>
                                    )}
                                    {isHighValue && !isMilestone && (
                                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg">
                                        Bonus
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                                    <span className="flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full">
                                      <Clock className="w-4 h-4" />
                                      <span className="font-medium">{formatDate(activity.created_at)}</span>
                                    </span>
                                    <span className={`px-3 py-1 rounded-full font-semibold text-sm shadow-sm ${
                                      category.name === 'milestone' ? 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border border-yellow-200' :
                                      category.name === 'content' ? 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border border-blue-200' :
                                      category.name === 'social' ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200' :
                                      category.name === 'startup' ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border border-purple-200' :
                                      category.name === 'job' ? 'bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-800 border border-indigo-200' :
                                      'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200'
                                    }`}>
                                      {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Enhanced Points Display */}
                          <div className={`flex flex-col items-end space-y-2 ${
                            activity.points > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl shadow-lg font-bold text-lg ${
                              isHighValue ? 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 border-2 border-yellow-300' :
                              activity.points > 0 ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200' :
                              'bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border border-red-200'
                            } group-hover:scale-105 transition-transform duration-300`}>
                              {activity.points > 0 && (
                                <ArrowUp className={`w-5 h-5 ${isHighValue ? 'text-yellow-600' : 'text-green-600'}`} />
                              )}
                              <span className={isHighValue ? 'text-xl' : 'text-lg'}>
                                {activity.points > 0 ? '+' : ''}{activity.points}
                              </span>
                            </div>
                            {isHighValue && (
                              <div className="text-xs text-yellow-600 font-medium bg-yellow-50 px-2 py-1 rounded-full">
                                High Value!
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Progress indicator for milestones */}
                        {isMilestone && (
                          <div className="mt-4 pt-4 border-t border-yellow-200">
                            <div className="flex items-center space-x-2 text-sm text-yellow-700">
                              <Trophy className="w-4 h-4" />
                              <span className="font-medium">Achievement unlocked! Keep up the great work.</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <TrendingUp className="h-10 w-10 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">No activities found</h3>
                <p className="text-gray-600 mb-6 leading-relaxed max-w-md mx-auto">
                  {searchTerm || filterCategory !== 'all' || filterTimeRange !== 'all' 
                    ? 'Try adjusting your filters to see more activities.'
                    : 'Start engaging with the platform to see your activity here!'
                  }
                </p>
                {(!searchTerm && filterCategory === 'all' && filterTimeRange === 'all') && (
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl font-medium">
                      Explore Startups
                    </button>
                    <button className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl font-medium">
                      Browse Jobs
                    </button>
                  </div>
                )}
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default ActivityFeed;