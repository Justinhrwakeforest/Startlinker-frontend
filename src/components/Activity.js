// src/components/Activity.js - Professional Activity Dashboard
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from '../config/axios';
import { 
  Trophy, Star, Crown, Shield, Award, TrendingUp, Target, Zap, Users, Calendar, 
  ArrowUp, Search, Filter, Download, RefreshCw, ChevronDown, Clock, MapPin,
  MessageCircle, Heart, Bookmark, Briefcase, Code, Mail, Phone, Camera,
  FileText, Share, ThumbsUp, UserPlus, Lightbulb, Gift, Flame, Grid, List,
  Activity as ActivityIcon
} from 'lucide-react';

const Activity = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [allActivities, setAllActivities] = useState([]);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterTimeRange, setFilterTimeRange] = useState('all');

  const fetchActivityData = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        limit: '100',
        category: filterCategory,
        time_range: filterTimeRange
      });
      
      const [activitiesRes, statsRes] = await Promise.all([
        axios.get(`/auth/${user.id}/activity-feed/?${params}`),
        axios.get(`/auth/${user.id}/points/`)
      ]);

      const activityData = activitiesRes.data;
      setAllActivities(activityData.results || []);
      setStats({
        ...statsRes.data,
        total_activities: activityData.total_activities,
        total_points_earned: activityData.total_points_earned,
        category_stats: activityData.category_stats
      });
    } catch (error) {
      console.error('Error fetching activity data:', error);
      fetchBasicActivity();
    } finally {
      setLoading(false);
    }
  }, [user, filterCategory, filterTimeRange]);

  useEffect(() => {
    if (user) {
      fetchActivityData();
    }
  }, [user, fetchActivityData]);

  const activities = allActivities.filter(activity => {
    const matchesSearch = !searchTerm || 
      activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.reason.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const fetchBasicActivity = async () => {
    try {
      const response = await axios.get('/api/auth/activity/');
      const basicActivity = response.data;
      
      const convertedActivities = [];
      
      if (basicActivity.recent_ratings) {
        basicActivity.recent_ratings.forEach(rating => {
          convertedActivities.push({
            id: `rating-${rating.startup_id}-${rating.created_at}`,
            reason: 'startup_rating',
            description: `Rated ${rating.startup_name} with ${rating.rating} stars`,
            points: 5,
            created_at: rating.created_at,
            startup: {
              id: rating.startup_id,
              name: rating.startup_name,
              logo: rating.startup_logo
            }
          });
        });
      }
      
      if (basicActivity.bookmarked_startups) {
        basicActivity.bookmarked_startups.forEach(bookmark => {
          convertedActivities.push({
            id: `bookmark-${bookmark.startup_id}-${bookmark.created_at}`,
            reason: 'startup_bookmark',
            description: `Bookmarked ${bookmark.startup_name}`,
            points: 3,
            created_at: bookmark.created_at,
            startup: {
              id: bookmark.startup_id,
              name: bookmark.startup_name,
              logo: bookmark.startup_logo
            }
          });
        });
      }
      
      setAllActivities(convertedActivities);
      setStats({
        total_points: 0,
        level: 1,
        total_activities: convertedActivities.length,
        content_points: 0,
        social_points: 0,
        startup_points: 0,
        job_points: 0
      });
    } catch (error) {
      console.error('Error fetching basic activity:', error);
      setAllActivities([]);
      setStats({
        total_points: 0,
        level: 1,
        total_activities: 0,
        content_points: 0,
        social_points: 0,
        startup_points: 0,
        job_points: 0
      });
    }
  };

  const getActivityIcon = (reason) => {
    const iconMap = {
      signup_bonus: Gift,
      email_verify: Mail,
      phone_verify: Phone,
      profile_picture_upload: Camera,
      profile_bio_complete: FileText,
      profile_location_add: MapPin,
      profile_website_add: Code,
      profile_complete: Shield,
      first_interests_select: Target,
      daily_login: Calendar,
      login_streak_3: Flame,
      login_streak_7: Flame,
      login_streak_30: Flame,
      first_session: Clock,
      first_post: Trophy,
      post_create: FileText,
      post_with_image: Camera,
      post_with_video: Camera,
      first_story: Star,
      story_create: MessageCircle,
      story_with_media: Camera,
      comment_create: MessageCircle,
      first_comment: MessageCircle,
      first_startup_submit: Crown,
      startup_submit: TrendingUp,
      startup_claim: Crown,
      startup_verify: Shield,
      startup_update: FileText,
      startup_logo_upload: Camera,
      startup_rating: Star,
      startup_bookmark: Bookmark,
      first_job_post: Briefcase,
      job_post: Briefcase,
      job_apply: FileText,
      job_bookmark: Bookmark,
      resume_upload: FileText,
      resume_update: FileText,
      first_follow: UserPlus,
      follow_user: UserPlus,
      get_followed: Users,
      like_post: Heart,
      share_post: Share,
      bookmark_post: Bookmark,
      message_send: MessageCircle,
      first_message: MessageCircle,
      achievement: Trophy,
      milestone_10_posts: Award,
      milestone_50_posts: Crown,
      milestone_100_followers: Users,
      milestone_verified: Shield,
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

  const refreshActivity = async () => {
    await fetchActivityData();
  };

  const exportActivity = async () => {
    try {
      const response = await axios.get('/api/auth/export-data/');
      const blob = new Blob([JSON.stringify(response.data, null, 2)], {
        type: 'application/json'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting activity:', error);
      alert('Failed to export activity data.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-8">
            {/* Header skeleton */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-2xl"></div>
                  <div>
                    <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-64"></div>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <div className="w-24 h-12 bg-gray-200 rounded-xl"></div>
                  <div className="w-24 h-12 bg-gray-200 rounded-xl"></div>
                </div>
              </div>
            </div>
            
            {/* Stats skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-16 h-16 bg-gray-200 rounded-2xl"></div>
                    <div className="w-12 h-8 bg-gray-200 rounded"></div>
                    <div className="w-20 h-4 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Filters skeleton */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="h-6 bg-gray-200 rounded w-32 mb-6"></div>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 h-14 bg-gray-200 rounded-xl"></div>
                <div className="w-48 h-14 bg-gray-200 rounded-xl"></div>
                <div className="w-40 h-14 bg-gray-200 rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Professional Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-center space-x-6">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-2xl shadow-lg">
                <ActivityIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Activity</h1>
                <p className="text-lg text-gray-600">Track your journey and achievements on StartLinker</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={refreshActivity}
                className="inline-flex items-center space-x-2 bg-blue-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-sm"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Refresh</span>
              </button>
              <button 
                onClick={exportActivity}
                className="inline-flex items-center space-x-2 bg-gray-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors shadow-sm"
              >
                <Download className="w-5 h-5" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Professional Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
            {/* Total Activity */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="bg-blue-50 p-4 rounded-2xl">
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {stats.total_activities || activities.length}
                  </div>
                  <div className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Total Activity</div>
                </div>
              </div>
            </div>

            {/* Total Points */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="bg-orange-50 p-4 rounded-2xl">
                  <Trophy className="w-8 h-8 text-orange-600" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-orange-600 mb-1">
                    {stats.total_points || 0}
                  </div>
                  <div className="text-sm font-semibold text-orange-600 uppercase tracking-wider">Total Points</div>
                </div>
              </div>
            </div>

            {/* Level */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="bg-purple-50 p-4 rounded-2xl">
                  <Crown className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    {stats.level || 1}
                  </div>
                  <div className="text-sm font-semibold text-purple-600 uppercase tracking-wider">Level</div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="bg-cyan-50 p-4 rounded-2xl">
                  <FileText className="w-8 h-8 text-cyan-600" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-cyan-600 mb-1">
                    {stats.content_points || 0}
                  </div>
                  <div className="text-sm font-semibold text-cyan-600 uppercase tracking-wider">Content</div>
                </div>
              </div>
            </div>

            {/* Social */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="bg-green-50 p-4 rounded-2xl">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {stats.social_points || 0}
                  </div>
                  <div className="text-sm font-semibold text-green-600 uppercase tracking-wider">Social</div>
                </div>
              </div>
            </div>

            {/* Startups */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="bg-violet-50 p-4 rounded-2xl">
                  <TrendingUp className="w-8 h-8 text-violet-600" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-violet-600 mb-1">
                    {stats.startup_points || 0}
                  </div>
                  <div className="text-sm font-semibold text-violet-600 uppercase tracking-wider">Startups</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Professional Filters Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="bg-indigo-50 p-3 rounded-xl">
                <Filter className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Filter & Search</h3>
            </div>
            <div className="bg-blue-50 px-4 py-2 rounded-full">
              <span className="text-sm font-semibold text-blue-600">
                {activities.length} activities found
              </span>
            </div>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search activities, milestones, achievements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="appearance-none bg-gray-50 border border-gray-200 rounded-xl pl-4 pr-10 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors min-w-[200px]"
              >
                <option value="all">All Categories</option>
                <option value="milestone">Milestones</option>
                <option value="content">Content</option>
                <option value="social">Social</option>
                <option value="startup">Startups</option>
                <option value="job">Jobs</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>

            {/* Time Range Filter */}
            <div className="relative">
              <select
                value={filterTimeRange}
                onChange={(e) => setFilterTimeRange(e.target.value)}
                className="appearance-none bg-gray-50 border border-gray-200 rounded-xl pl-4 pr-10 py-4 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors min-w-[160px]"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Activities List */}
        <div className="space-y-4">
          {activities.length > 0 ? (
            activities.map((activity, index) => {
              const IconComponent = getActivityIcon(activity.reason);
              const category = getActivityCategory(activity.reason);
              const isMilestone = activity.reason.startsWith('milestone_') || activity.reason.startsWith('first_');
              
              return (
                <div 
                  key={activity.id} 
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-4">
                    {/* Icon */}
                    <div className={`p-3 rounded-xl ${
                      isMilestone ? 'bg-yellow-100' :
                      category.name === 'content' ? 'bg-blue-100' :
                      category.name === 'social' ? 'bg-green-100' :
                      category.name === 'startup' ? 'bg-purple-100' :
                      category.name === 'job' ? 'bg-indigo-100' :
                      'bg-gray-100'
                    }`}>
                      <IconComponent className={`w-6 h-6 ${
                        isMilestone ? 'text-yellow-600' :
                        category.name === 'content' ? 'text-blue-600' :
                        category.name === 'social' ? 'text-green-600' :
                        category.name === 'startup' ? 'text-purple-600' :
                        category.name === 'job' ? 'text-indigo-600' :
                        'text-gray-600'
                      }`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {activity.description}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{formatDate(activity.created_at)}</span>
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              category.name === 'milestone' ? 'bg-yellow-100 text-yellow-800' :
                              category.name === 'content' ? 'bg-blue-100 text-blue-800' :
                              category.name === 'social' ? 'bg-green-100 text-green-800' :
                              category.name === 'startup' ? 'bg-purple-100 text-purple-800' :
                              category.name === 'job' ? 'bg-indigo-100 text-indigo-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
                            </span>
                          </div>
                        </div>
                        
                        {/* Points */}
                        <div className={`px-4 py-2 rounded-xl font-semibold ${
                          activity.points > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {activity.points > 0 ? '+' : ''}{activity.points}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <ActivityIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No activities found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filterCategory !== 'all' || filterTimeRange !== 'all' 
                  ? 'Try adjusting your filters to see more activities.'
                  : 'Start engaging with the platform to see your activity here!'
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/startups"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
                >
                  Explore Startups
                </Link>
                <Link
                  to="/jobs"
                  className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold"
                >
                  Browse Jobs
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Activity;