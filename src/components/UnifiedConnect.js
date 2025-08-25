// src/components/UnifiedConnect.js - Unified Connect experience with all social features
import React, { useState, useEffect } from 'react';
import { getAvatarUrl, getUserDisplayName } from '../utils/avatarUtils';
import { 
  TrendingUp, Users, Clock, Activity, MessageCircle, 
  Award, Sparkles, Bell, Settings, Plus, Calendar,
  Heart, Share2, Bookmark, Eye, Edit, Filter,
  RefreshCw, ChevronRight, ArrowRight, Grid, List
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { 
  StoriesBar, 
  PersonalizedFeed, 
  AchievementBadges, 
  PostScheduler,
  CollectionsGrid,
  PostCreationWithMentions,
  FollowButton
} from './social';
import PostsFeed from './PostsFeed';
import api from '../services/api';

const UnifiedConnect = () => {
  const { user } = useAuth();
  const [activeFeedTab, setActiveFeedTab] = useState('latest'); // default to latest for all users
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    following: 0,
    achievements: 0
  });
  const [recentCollections, setRecentCollections] = useState([]);
  const [recentAchievements, setRecentAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  const feedTabs = [
    { key: 'latest', label: 'Latest', icon: Clock, description: 'Most recent posts from everyone' },
    { key: 'following', label: 'Following', icon: Users, description: 'Posts from people you follow' },
    { key: 'personalized', label: 'For You', icon: Sparkles, description: 'Personalized content based on your interests' },
    { key: 'smart', label: 'Smart', icon: TrendingUp, description: 'AI-curated trending content' },
    { key: 'hot', label: 'Hot', icon: Activity, description: 'Most engaging content right now' },
    { key: 'top', label: 'Top', icon: Award, description: 'Best content of all time' },
    { key: 'discussed', label: 'Most Discussed', icon: MessageCircle, description: 'Posts with most comments' }
  ];

  useEffect(() => {
    fetchUserStats();
    fetchRecentCollections();
    fetchRecentAchievements();
  }, []);

  const fetchUserStats = async () => {
    try {
      if (!user?.id) {
        console.log('No user ID available for stats');
        return;
      }
      
      console.log('Fetching user stats for user ID:', user.id);
      const response = await api.get(`/social/social-stats/${user.id}/`);
      console.log('User stats response:', response.data);
      
      // Transform the API response to match our expected format
      const transformedStats = {
        posts: response.data.posts_count || 0
        followers: response.data.followers_count || 0
        following: response.data.following_count || 0
        achievements: response.data.achievements_count || 0
        stories: response.data.stories_count || 0
        collections: response.data.collections_count || 0
        points: response.data.total_achievement_points || 0
      };
      
      setStats(transformedStats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
      console.error('Error details:', error.response?.data);
      
      // Set default values if API fails
      setStats({
        posts: 0
        followers: 0
        following: 0
        achievements: 0
        stories: 0
        collections: 0
        points: 0
      });
    }
  };

  const fetchRecentCollections = async () => {
    try {
      const response = await api.get('/api/social/collaborations/?limit=3');
      const data = response.data;
      setRecentCollections(data.results || data || []);
    } catch (error) {
      console.error('Error fetching collections:', error);
      setRecentCollections([]);
    }
  };

  const fetchRecentAchievements = async () => {
    try {
      if (!user?.id) {
        setRecentAchievements([]);
        return;
      }
      
      const response = await api.get(`/social/user-achievements/?limit=3`);
      const data = response.data;
      setRecentAchievements(data.results || data || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      setRecentAchievements([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (postData) => {
    try {
      await api.posts.create(postData);
      setShowCreatePost(false);
      // Refresh feed content
      window.location.reload();
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Connect</h1>
                  <p className="text-sm text-gray-600">Your social startup network</p>
                </div>
              </div>
              
              {!loading && (
                <div className="hidden md:flex items-center space-x-6 text-sm text-gray-600 ml-8">
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="w-4 h-4" />
                    <span>{stats.posts} posts</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{stats.followers} followers</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Heart className="w-4 h-4" />
                    <span>{stats.following} following</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Award className="w-4 h-4" />
                    <span>{stats.achievements} achievements</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowScheduler(true)}
                className="hidden sm:flex items-center space-x-2 px-3 py-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Clock className="w-4 h-4" />
                <span className="text-sm">Schedule</span>
              </button>
              
              <button
                onClick={() => setShowCreatePost(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Post</span>
              </button>
              
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Feed Area (3/4 width) */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {/* Stories Bar */}
              <StoriesBar currentUser={user} />

              {/* Feed Tabs */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="border-b border-gray-200">
                  <div className="flex overflow-x-auto">
                    {feedTabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.key}
                          onClick={() => setActiveFeedTab(tab.key)}
                          className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                            activeFeedTab === tab.key
                              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                {/* Create Post Section */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <img
                      src={getAvatarUrl(user, 40)}
                      alt={user?.username}
                      className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                      onError={(e) => {
                        e.target.src = getAvatarUrl(user, 40);
                      }}
                    />
                    <button
                      onClick={() => setShowCreatePost(true)}
                      className="flex-1 text-left px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
                    >
                      What's on your mind, {user?.first_name || user?.username}?
                    </button>
                    <button
                      onClick={() => setShowScheduler(true)}
                      className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                      title="Schedule Post"
                    >
                      <Clock className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Feed Content */}
              <div>
                {activeFeedTab === 'personalized' && <PersonalizedFeed currentUser={user} />}
                {activeFeedTab === 'latest' && <PostsFeed feedType="latest" enableSocialFeatures={true} hideFilters={true} />}
                {activeFeedTab === 'following' && <PostsFeed feedType="following" enableSocialFeatures={true} hideFilters={true} />}
                {activeFeedTab === 'smart' && <PostsFeed feedType="smart" enableSocialFeatures={true} hideFilters={true} />}
                {activeFeedTab === 'hot' && <PostsFeed feedType="latest" filter="hot" enableSocialFeatures={true} hideFilters={true} />}
                {activeFeedTab === 'top' && <PostsFeed feedType="latest" filter="top" enableSocialFeatures={true} hideFilters={true} />}
                {activeFeedTab === 'discussed' && <PostsFeed feedType="latest" filter="discussed" enableSocialFeatures={true} hideFilters={true} />}
              </div>
            </div>
          </div>

          {/* Social Sidebar (1/4 width) */}
          <div className="lg:col-span-1">
            <div className="space-y-6 sticky top-24">
              {/* Quick Stats */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Your Network</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Posts</span>
                    <span className="font-semibold text-gray-900">{stats.posts}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Followers</span>
                    <span className="font-semibold text-gray-900">{stats.followers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Following</span>
                    <span className="font-semibold text-gray-900">{stats.following}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Achievements</span>
                    <span className="font-semibold text-gray-900">{stats.achievements}</span>
                  </div>
                </div>
              </div>

              {/* Collections Widget */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Collections</h3>
                  <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                    View All
                  </button>
                </div>
                
                {recentCollections.length === 0 ? (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Bookmark className="w-6 h-6 text-purple-600" />
                    </div>
                    <p className="text-gray-600 text-sm mb-3">No collections yet</p>
                    <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                      Create your first collection
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentCollections.slice(0, 3).map((collection) => (
                      <div key={collection.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{collection.name}</p>
                          <p className="text-xs text-gray-500">{collection.startup_count} startups</p>
                        </div>
                      </div>
                    ))}
                    <button className="w-full mt-3 px-3 py-2 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors">
                      Create New Collection
                    </button>
                  </div>
                )}
              </div>

              {/* Achievements Widget */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Achievements</h3>
                  <button className="text-orange-600 hover:text-orange-700 text-sm font-medium">
                    View All
                  </button>
                </div>
                
                {recentAchievements.length === 0 ? (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Award className="w-6 h-6 text-orange-600" />
                    </div>
                    <p className="text-gray-600 text-sm mb-3">No achievements yet</p>
                    <p className="text-gray-500 text-xs">Start engaging to earn badges!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {recentAchievements.slice(0, 3).map((achievement) => (
                      <div key={achievement.id} className="text-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-2">
                          <span className="text-lg">{achievement.achievement_icon}</span>
                        </div>
                        <p className="text-xs font-medium text-gray-900 truncate">{achievement.achievement_name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button 
                    onClick={() => setShowScheduler(true)}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">Schedule Post</span>
                  </button>
                  <button className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">Manage Following</span>
                  </button>
                  <button className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors">
                    <Bookmark className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">View Collections</span>
                  </button>
                  <button className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors">
                    <Award className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">View Achievements</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Create New Post</h2>
                <button
                  onClick={() => setShowCreatePost(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <PostCreationWithMentions
                onSubmit={handleCreatePost}
                placeholder="Share something with your network..."
              />
            </div>
          </div>
        </div>
      )}

      {/* Post Scheduler Modal */}
      {showScheduler && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Post Scheduler</h2>
                <button
                  onClick={() => setShowScheduler(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <PostScheduler currentUser={user} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedConnect;