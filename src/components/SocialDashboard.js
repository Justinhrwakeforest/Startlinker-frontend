// src/components/SocialDashboard.js - Enhanced dashboard with social features
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAvatarUrl, getUserDisplayName } from '../utils/avatarUtils';
import { 
  TrendingUp, Users, Clock, Activity, Calendar, 
  Award, Sparkles, Bell, Settings, Plus, 
  Search, Filter, RefreshCw, Grid, List,
  Heart, MessageCircle, Share2, Bookmark, X,
  ChevronDown, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from './NotificationSystem';
import { 
  StoriesBar,
  PersonalizedFeed, 
  PostScheduler,
  CollaborationSpaces,
  FollowButton,
  PostCreationWithMentions
} from './social';
import PostsFeed from './PostsFeed';
import api from '../services/api';
import '../styles/social-responsive.css';
import '../styles/suggested-users.css';

// Simple Suggested User Card - Clean layout without stats
const SuggestedUserCard = ({ suggestedUser, currentUser, onUserClick, onFollowChange }) => {
  return (
    <div className="flex items-center space-x-3 p-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-xl transition-all duration-200">
      <img
        src={getAvatarUrl(suggestedUser, 40)}
        alt={suggestedUser.display_name || suggestedUser.username}
        className="w-10 h-10 rounded-full shadow-md flex-shrink-0 object-cover cursor-pointer hover:ring-2 hover:ring-blue-200 transition-all"
        onClick={() => onUserClick(suggestedUser.username)}
        onError={(e) => {
          e.target.src = getAvatarUrl(suggestedUser, 40);
        }}
      />
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onUserClick(suggestedUser.username)}>
        <p className="text-sm font-semibold text-gray-900 truncate hover:text-blue-600 transition-colors">
          {suggestedUser.display_name || suggestedUser.username}
        </p>
        <p className="text-xs text-gray-500 truncate hover:text-blue-400 transition-colors">@{suggestedUser.username}</p>
      </div>
      <FollowButton
        targetUser={suggestedUser}
        currentUser={currentUser}
        size="small"
        variant="outline"
        onFollowChange={onFollowChange}
      />
    </div>
  );
};

const SocialDashboard = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('posts'); // posts, feed, collections, scheduler
  const [activeFeedTab, setActiveFeedTab] = useState('latest'); // for the feed subtabs
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    following: 0
  });
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFloatingButton, setShowFloatingButton] = useState(true);
  const [postsRefreshKey, setPostsRefreshKey] = useState(0); // Add refresh key for PostsFeed
  // Feed header is always visible - no state needed
  const footerRef = useRef(null);
  useEffect(() => {
    // Force immediate fetch when component mounts
    if (user?.id) {
      console.log('🚀 SocialDashboard mounted, fetching initial data for user:', user.id);
      fetchUserStats();
      fetchSuggestedUsers();
    }
    
    // Set up periodic refresh for stats (every 10 seconds for more real-time updates)
    const statsInterval = setInterval(() => {
      if (user?.id) {
        console.log('🔄 Periodic stats refresh');
        fetchUserStats();
      }
    }, 10000);
    
    // Refresh suggested users less frequently (every 2 minutes)
    const suggestionsInterval = setInterval(() => {
      if (user?.id) {
        fetchSuggestedUsers();
      }
    }, 120000);
    // Listen for global follow state changes
    const handleFollowStateChange = (event) => {
      const { userId, isFollowing, action } = event.detail;
      if (action === 'follow') {
        // Remove the followed user from suggestions immediately
        setSuggestedUsers(prev => prev.filter(u => u.id !== userId));
        // Update following count
        setStats(prev => ({
          ...prev,
          following: prev.following + 1
        }));
        // Fetch fresh suggestions after a delay
        setTimeout(() => {
          fetchSuggestedUsers();
        }, 1000);
      } else if (action === 'unfollow') {
        // Update following count
        setStats(prev => ({
          ...prev,
          following: prev.following - 1
        }));
        // Refetch suggestions to potentially show the unfollowed user again
        setTimeout(() => {
          fetchSuggestedUsers();
        }, 1000);
      }
    };
    // Listen for post creation events
    const handlePostCreated = (event) => {
      // Update posts count immediately
      setStats(prev => ({
        ...prev,
        posts: prev.posts + 1
      }));
      // Refresh actual stats to ensure accuracy
      setTimeout(() => {
        fetchUserStats();
      }, 500);
    };

    // Listen for follower count changes (when someone follows/unfollows the current user)
    const handleFollowerCountChanged = (event) => {
      const { action } = event.detail;
      if (action === 'gained_follower') {
        setStats(prev => ({
          ...prev,
          followers: prev.followers + 1
        }));
      } else if (action === 'lost_follower') {
        setStats(prev => ({
          ...prev,
          followers: Math.max(0, prev.followers - 1)
        }));
      }
      // Refresh actual stats to ensure accuracy
      setTimeout(() => {
        fetchUserStats();
      }, 1000);
    };
    window.addEventListener('followStateChanged', handleFollowStateChange);
    window.addEventListener('postCreated', handlePostCreated);
    window.addEventListener('followerCountChanged', handleFollowerCountChanged);
    return () => {
      window.removeEventListener('followStateChanged', handleFollowStateChange);
      window.removeEventListener('postCreated', handlePostCreated);
      window.removeEventListener('followerCountChanged', handleFollowerCountChanged);
      clearInterval(statsInterval);
      clearInterval(suggestionsInterval);
    };
  }, [user?.id]);

  // Separate useEffect to handle user changes
  useEffect(() => {
    if (user?.id && !loading) {
      console.log('👤 User changed or became available, fetching fresh data:', user.id);
      fetchUserStats();
      fetchSuggestedUsers();
    }
  }, [user?.id]);
  
  useEffect(() => {
    const handleScroll = () => {
      if (footerRef.current) {
        const footerRect = footerRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        // Hide button when footer is visible (footer top is within viewport)
        const isFooterVisible = footerRect.top < windowHeight;
        setShowFloatingButton(!isFooterVisible);
      }
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial state
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  // Handle feed header scroll detection
  // Feed header is always sticky and visible when scrolling
  // All feed tabs in horizontal layout
  const fetchUserStats = async () => {
    try {
      setLoading(true);
      if (!user?.id) {
        console.log('No user ID available for stats');
        return;
      }
      console.log('🔄 Fetching user stats for user ID:', user.id);
      
      // Try multiple API endpoints for better compatibility
      let response;
      try {
        response = await api.get(`/api/social/social-stats/${user.id}/`);
      } catch (primaryError) {
        console.warn('Primary stats endpoint failed, trying fallback:', primaryError);
        try {
          // Try alternative endpoint structure
          response = await api.get(`/auth/${user.id}/social-stats/`);
        } catch (secondaryError) {
          console.warn('Secondary stats endpoint failed, trying basic endpoint:', secondaryError);
          // Try basic user info endpoint
          const userResponse = await api.get(`/api/auth/user/${user.id}/`);
          response = { data: userResponse.data };
        }
      }
      
      console.log('✅ User stats response:', response.data);
      
      // Transform the API response to match our expected format with multiple field name possibilities
      const transformedStats = {
        posts: response.data.posts_count || response.data.post_count || response.data.posts || 0,
        followers: response.data.followers_count || response.data.follower_count || response.data.followers || 0,
        following: response.data.following_count || response.data.followings_count || response.data.following || 0,
        stories: response.data.stories_count || response.data.story_count || response.data.stories || 0,
        collections: response.data.collections_count || response.data.collection_count || response.data.collections || 0
      };
      
      console.log('📊 Transformed stats:', transformedStats);
      setStats(transformedStats);
      
    } catch (error) {
      console.error('❌ Error fetching user stats:', error);
      console.error('Error details:', error.response?.data);
      
      // Try to get basic counts from other endpoints as fallback
      try {
        console.log('🔄 Trying fallback methods for stats...');
        const [postsResponse, followsResponse] = await Promise.allSettled([
          api.get('/api/posts/').then(res => res.data?.results?.length || 0),
          api.get('/api/social/follows/following/').then(res => res.data?.results?.length || res.data?.length || 0)
        ]);
        
        const fallbackStats = {
          posts: postsResponse.status === 'fulfilled' ? postsResponse.value : 0,
          followers: 0, // Hard to get without specific endpoint
          following: followsResponse.status === 'fulfilled' ? followsResponse.value : 0,
          stories: 0,
          collections: 0
        };
        
        console.log('📊 Fallback stats:', fallbackStats);
        setStats(fallbackStats);
      } catch (fallbackError) {
        console.error('❌ Fallback methods also failed:', fallbackError);
        // Set default values if everything fails
        setStats({
          posts: 0,
          followers: 0,
          following: 0,
          stories: 0,
          collections: 0
        });
      }
    } finally {
      setLoading(false);
    }
  };
  const fetchSuggestedUsers = async () => {
    try {
      if (!user?.id) {
        console.log('No user ID available for suggested users');
        return;
      }
      console.log('Fetching suggested users for user:', user.id);
      const [suggestedResponse, followingResponse] = await Promise.all([
        api.get('/api/social/social-stats/suggested_users/').catch((error) => {
          console.error('Error fetching suggested users from API:', error);
          return { data: { suggested_users: [] } };
        }),
        api.get('/api/social/follows/following/').catch(() => ({ data: { results: [] } }))
      ]);
      console.log('Suggested users response:', suggestedResponse.data);
      console.log('Following response:', followingResponse.data);
      // Additional validation for API response structure
      if (!suggestedResponse.data || !Array.isArray(suggestedResponse.data.suggested_users)) {
        console.warn('Invalid suggested users response structure:', suggestedResponse.data);
        setSuggestedUsers([]);
        return;
      }
      // Get list of users we're already following
      const followingUsers = followingResponse.data.results || followingResponse.data || [];
      const followingIds = followingUsers.map(f => f.following || f.id);
      // Ensure we have an array of users and filter out already followed users and invalid users
      let users = suggestedResponse.data.suggested_users || [];
      users = users.filter(suggestedUser => {
        // Validate that user exists and has required fields
        if (!suggestedUser || !suggestedUser.id || !suggestedUser.username) {
          console.log('Filtering out invalid user:', suggestedUser);
          return false;
        }
        // Check if user has a display name or username (must have some identifying info)
        if (!suggestedUser.display_name && !suggestedUser.first_name && !suggestedUser.username) {
          console.log('Filtering out user with no display name:', suggestedUser);
          return false;
        }
        // Filter out already followed users and current user
        if (followingIds.includes(suggestedUser.id) || suggestedUser.id === user.id) {
          return false;
        }
        // Only include active/valid users
        if (suggestedUser.is_active === false) {
          console.log('Filtering out inactive user:', suggestedUser);
          return false;
        }
        return true;
      });
      // Limit to top 10 suggested users for performance and better UX
      users = users.slice(0, 10);
      console.log(`Found ${users.length} suggested users after filtering:`, users);
      console.log('Following IDs:', followingIds);
      setSuggestedUsers(users);
    } catch (error) {
      console.error('Error fetching suggested users:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      // Set empty array on error
      setSuggestedUsers([]);
    }
  };
  const handleCreatePost = async (postData) => {
    try {
      await api.posts.create(postData);
      setShowCreatePost(false);
      // Show success notification
      addNotification({
        type: 'success',
        title: 'Post Published! 🎉',
        message: 'Your post has been successfully published and is now visible in the feed.',
        duration: 4000
      });
      // Emit post creation event for real-time stats update
      window.dispatchEvent(new CustomEvent('postCreated', {
        detail: { userId: user?.id }
      }));
      // Refresh posts feed immediately without page reload
      setPostsRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  };
  const handleUserClick = (username) => {
    if (username) {
      navigate(`/profile/${username}`);
    }
  };
  const tabs = [
    { key: 'posts', label: 'Posts & Stories', mobileLabel: 'Posts', icon: MessageCircle, count: null, description: 'Social feed with stories & personalized content' },
    { key: 'collections', label: 'Collaboration', mobileLabel: 'Teams', icon: Users, count: null, description: 'Project collaboration spaces' },
    { key: 'scheduler', label: 'Scheduler', mobileLabel: 'Schedule', icon: Clock, count: null, description: 'Schedule posts' }
  ];
  // All feed tabs in one array
  const feedTabs = [
    { key: 'latest', label: 'Latest', icon: Clock },
    { key: 'following', label: 'Following', icon: Users },
    { key: 'personalized', label: 'For You', icon: Sparkles },
    { key: 'smart', label: 'Smart', icon: TrendingUp },
    { key: 'hot', label: 'Hot', icon: Activity },
    { key: 'top', label: 'Top', icon: Award },
    { key: 'discussed', label: 'Most Discussed', icon: MessageCircle }
  ];
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-0 sm:px-4 lg:px-8">
          {/* Mobile Navigation - 4 equal width tabs */}
          <div className="flex sm:hidden w-full">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex flex-col items-center space-y-1 py-3 px-1 border-b-2 font-medium text-xs transition-colors ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs leading-tight">{tab.mobileLabel || tab.label.split(' ')[0]}</span>
                  {tab.count !== null && tab.count > 0 && (
                    <span className="bg-blue-100 text-blue-600 px-1 py-0.5 rounded-full text-xs min-w-[16px] h-4 flex items-center justify-center">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {/* Desktop Navigation */}
          <div className="hidden sm:flex justify-center space-x-4 lg:space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count !== null && (
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Left Sidebar - Suggested Users with Vertical Scroll */}
          <div className="lg:col-span-1 order-1">
            <div className="sticky top-20">
              {/* Suggested Users Vertical List */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center">
                    <Users className="w-5 h-5 text-purple-500 mr-2" />
                    <span className="hidden sm:inline">Suggested for You</span>
                    <span className="sm:hidden">Suggested</span>
                  </h3>
                  <span className="text-xs text-gray-500 bg-purple-50 px-2 py-1 rounded-full">
                    {suggestedUsers.length}
                  </span>
                </div>
                
                {/* Vertical Scrollable Container */}
                <div 
                  className="overflow-y-auto max-h-[400px] sm:max-h-[600px] space-y-3 suggested-users-vertical"
                >
                  {suggestedUsers.length === 0 ? (
                    <div className="text-center py-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Users className="h-6 w-6 text-purple-600" />
                      </div>
                      <p className="text-sm text-gray-500 mb-2">No suggestions available</p>
                      <p className="text-xs text-gray-400">Check back later for new connections</p>
                    </div>
                  ) : (
                    suggestedUsers.map((suggestedUser) => (
                      <SuggestedUserCard 
                        key={suggestedUser.id}
                        suggestedUser={suggestedUser}
                        currentUser={user}
                        onUserClick={handleUserClick}
                        onFollowChange={(action, targetUser) => {
                          if (action === 'follow') {
                            setSuggestedUsers(prev => 
                              prev.filter(u => u.id !== targetUser.id)
                            );
                            setStats(prev => ({
                              ...prev,
                              following: prev.following + 1
                            }));
                            setTimeout(() => {
                              fetchSuggestedUsers();
                            }, 1000);
                          } else if (action === 'unfollow') {
                            setStats(prev => ({
                              ...prev,
                              following: Math.max(0, prev.following - 1)
                            }));
                            setTimeout(() => {
                              fetchSuggestedUsers();
                            }, 1000);
                          }
                        }}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* Main Content Area */}
          <div className="lg:col-span-3 order-2">
            {activeTab === 'posts' && (
              <div className="space-y-3 sm:space-y-4">
                {/* Enhanced Header Section */}
                <div className="bg-gradient-to-r from-blue-50 via-white to-purple-50 rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                  {/* Stories Section */}
                  <div className="p-4 sm:p-6 pb-2 sm:pb-3">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-gray-900 flex items-center">
                        <Sparkles className="w-5 h-5 text-purple-500 mr-2" />
                        Stories
                      </h3>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        24h expiry
                      </span>
                    </div>
                    <StoriesBar currentUser={user} />
                  </div>
                  {/* Subtle Divider */}
                  <div className="px-4 sm:px-6">
                    <div className="border-t border-gray-100"></div>
                  </div>
                  {/* Post Creation Section */}
                  <div className="p-4 sm:p-6 pt-3 sm:pt-4">
                    <div className="flex items-center space-x-3">
                      {/* User Avatar - Always on the LEFT */}
                      {user?.avatar || user?.profile_picture ? (
                        <img
                          src={user.avatar || user.profile_picture}
                          alt={user?.username}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-blue-200 shadow-md flex-shrink-0 order-1"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const initialsDiv = document.createElement('div');
                            initialsDiv.className = 'w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm border-2 border-blue-200 shadow-md flex-shrink-0 order-1';
                            const name = user?.first_name || user?.username || 'User';
                            const initials = name.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase();
                            initialsDiv.textContent = initials;
                            e.target.parentNode.appendChild(initialsDiv);
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm border-2 border-blue-200 shadow-md flex-shrink-0 order-1">
                          {(() => {
                            const name = user?.first_name || user?.username || 'User';
                            return name.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase();
                          })()}
                        </div>
                      )}
                      {/* Input Field - Takes remaining space */}
                      <button
                        onClick={() => setShowCreatePost(true)}
                        className="flex-1 text-left px-4 sm:px-5 py-3 sm:py-3.5 bg-white hover:bg-gray-50 rounded-full text-gray-500 hover:text-gray-700 transition-all duration-200 text-sm sm:text-base border-2 border-gray-200 hover:border-blue-300 shadow-sm hover:shadow-md order-2"
                      >
                        What's on your mind, {user?.first_name || user?.username}?
                      </button>
                    </div>
                  </div>
                </div>
                {/* Enhanced Feed Navigation */}
                <div 
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 sticky top-4 z-30" 
                  style={{overflow: 'visible'}}
                  data-feed-header
                >
                  <div className="px-4 sm:px-6 py-3 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-gray-900 flex items-center">
                        <Activity className="w-5 h-5 text-green-500 mr-2" />
                        Feed
                      </h3>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => setPostsRefreshKey(prev => prev + 1)}
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Refresh feed"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="px-2 sm:px-4" style={{overflow: 'visible'}}>
                    <div className="flex items-center overflow-x-auto scrollbar-hide py-2" style={{position: 'relative', overflowY: 'visible'}}>
                      {/* All feed tabs */}
                      {feedTabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeFeedTab === tab.key;
                        return (
                          <button
                            key={tab.key}
                            onClick={() => {
                              console.log('🔄 Switching to feed tab:', tab.key);
                              setActiveFeedTab(tab.key);
                            }}
                            className={`flex items-center space-x-2 px-3 sm:px-4 py-2 sm:py-3 mx-1 text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 rounded-xl ${
                              isActive
                                ? 'text-blue-600 bg-blue-100 shadow-md border-2 border-blue-200'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 border-2 border-transparent'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{tab.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                {/* Enhanced Feed Content */}
                <div className="relative">
                  {/* Feed Content with Enhanced Styling */}
                  <div className="space-y-4">
                    {activeFeedTab === 'personalized' && <PersonalizedFeed currentUser={user} />}
                    {activeFeedTab === 'latest' && <PostsFeed key={`latest-${postsRefreshKey}`} feedType="latest" filter="new" enableSocialFeatures={true} hideCreatePost={true} hideFilters={true} />}
                    {activeFeedTab === 'following' && <PostsFeed key={`following-${postsRefreshKey}`} feedType="following" enableSocialFeatures={true} hideCreatePost={true} hideFilters={true} />}
                    {activeFeedTab === 'smart' && <PostsFeed key={`smart-${postsRefreshKey}`} feedType="smart" enableSocialFeatures={true} hideCreatePost={true} hideFilters={true} />}
                    {activeFeedTab === 'hot' && <PostsFeed key={`hot-${postsRefreshKey}`} feedType="trending" filter="engagement" enableSocialFeatures={true} hideCreatePost={true} hideFilters={true} />}
                    {activeFeedTab === 'top' && <PostsFeed key={`top-${postsRefreshKey}`} feedType="latest" filter="popular" enableSocialFeatures={true} hideCreatePost={true} hideFilters={true} />}
                    {activeFeedTab === 'discussed' && <PostsFeed key={`discussed-${postsRefreshKey}`} feedType="latest" filter="comments" enableSocialFeatures={true} hideCreatePost={true} hideFilters={true} />}
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'collections' && (
              <CollaborationSpaces currentUser={user} />
            )}
            
            {activeTab === 'scheduler' && (
              <PostScheduler currentUser={user} />
            )}
          </div>
        </div>

        {/* Floating Create Post Button */}
        {activeTab === 'posts' && showFloatingButton && (
          <button
            onClick={() => setShowCreatePost(true)}
            className="fixed bottom-6 right-6 z-40 group flex items-center bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden"
            title="Create new post"
          >
            <div className="flex items-center justify-center w-12 h-12 flex-shrink-0">
              <Plus className="w-5 h-5" />
            </div>
            <div className="w-0 group-hover:w-24 transition-all duration-300 ease-in-out overflow-hidden">
              <span className="font-medium text-sm whitespace-nowrap pl-2 pr-4">
                Create Post
              </span>
            </div>
          </button>
        )}

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
                    <X className="w-6 h-6" />
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

        {/* Footer reference for scroll detection */}
        <div ref={footerRef} className="h-1"></div>
      </div>
    </div>
  );
};

export default SocialDashboard;
