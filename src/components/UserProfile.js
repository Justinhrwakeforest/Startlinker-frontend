// src/components/UserProfile.js - Enhanced Comprehensive User Profile Component
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getAvatarUrl, getUserDisplayName, getFirstNameInitials } from '../utils/avatarUtils';
import axios from '../config/axios';
import ProfileAchievements from './profile/ProfileAchievements';
import { 
  User, MapPin, Calendar, MessageCircle, Heart,
  Building, Briefcase, Settings, Activity,
  TrendingUp, Award, Target, AlertCircle,
  Sparkles, ExternalLink, ChevronDown, Menu,
  UserPlus, UserMinus, Users, Star, Bookmark,
  ArrowLeft, Share, MoreHorizontal, Shield,
  Clock, Mail, Phone, Globe, X, ThumbsUp,
  MessageSquare, Eye, TrendingUp as TrendingUpIcon,
  Trophy
} from 'lucide-react';

// Modal component for followers/following lists
const FollowModal = ({ isOpen, onClose, type, userId, username }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUsers();
    }
  }, [isOpen, userId, type]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let response;
      
      if (type === 'followers') {
        response = await axios.get(`/api/social/follows/followers/?user=${userId}`);
        
        // Process followers data - people who follow the specified user
        const followersData = (response.data.results || response.data || []).map(follow => ({
          id: follow.follower,
          username: follow.follower_username,
          display_name: follow.follower_display_name,
          avatar: follow.follower_avatar,
          relationData: follow,
          type: 'follower'
        }));
        
        setUsers(followersData);
      } else if (type === 'following') {
        response = await axios.get(`/api/social/follows/following/?user=${userId}`);
        
        // Process following data - people the specified user follows
        const followingData = (response.data.results || response.data || []).map(follow => ({
          id: follow.following,
          username: follow.following_username,
          display_name: follow.following_display_name,
          avatar: follow.following_avatar,
          relationData: follow,
          type: 'following'
        }));
        
        setUsers(followingData);
      }
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-96 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            {type === 'followers' ? 'Followers' : 'Following'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-80">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-blue-600"></div>
            </div>
          ) : users.length > 0 ? (
            <div className="space-y-3">
              {users.map(user => (
                <Link
                  key={user.id}
                  to={`/profile/${user.username}`}
                  className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={onClose}
                >
                  <img
                    src={getAvatarUrl(user, 128)}
                    alt={user.display_name || user.username}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{user.display_name || user.username}</p>
                    <p className="text-sm text-gray-500 truncate">@{user.username}</p>
                  </div>
                  <div className="text-xs text-gray-400">
                    {type === 'followers' ? 'Follower' : 'Following'}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No {type} yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const UserProfile = () => {
  const { identifier } = useParams(); // Can be username or user ID
  const navigate = useNavigate();
  const { user: currentUser, token } = useContext(AuthContext);
  
  const [profile, setProfile] = useState(null);
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isTabMenuOpen, setIsTabMenuOpen] = useState(false);
  const [followModal, setFollowModal] = useState({ isOpen: false, type: null });
  const [imageError, setImageError] = useState(false);

  // Check if viewing own profile
  const isOwnProfile = currentUser && (
    currentUser.id?.toString() === identifier || 
    currentUser.username === identifier
  );

  useEffect(() => {
    if (identifier) {
      setImageError(false); // Reset image error state when profile changes
      fetchUserProfile();
    }
  }, [identifier]);

  // Listen for global follow state changes to update counts
  useEffect(() => {
    const handleFollowStateChange = (event) => {
      const { userId, isFollowing, action } = event.detail;
      
      // Only update if this profile is affected
      if (profile && userId === profile.id) {
        if (action === 'follow') {
          setProfile(prev => ({
            ...prev,
            follower_count: (prev.follower_count || 0) + 1
          }));
        } else if (action === 'unfollow') {
          setProfile(prev => ({
            ...prev,
            follower_count: Math.max(0, (prev.follower_count || 0) - 1)
          }));
        }
      }
    };

    window.addEventListener('followStateChanged', handleFollowStateChange);
    
    return () => {
      window.removeEventListener('followStateChanged', handleFollowStateChange);
    };
  }, [profile]);

  const fetchUserProfile = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let profileResponse;
      
      if (isOwnProfile) {
        // Use existing profile endpoint for own profile
        profileResponse = await axios.get('/api/auth/profile/', {
          headers: { Authorization: `Token ${token}` }
        });
        
        // Also fetch activity data for own profile
        try {
          const activityResponse = await axios.get('/api/auth/activity/', {
            headers: { Authorization: `Token ${token}` }
          });
          setActivity(activityResponse.data);
        } catch (activityError) {
          console.error('Error fetching activity:', activityError);
          setActivity(null);
        }
      } else {
        // Check if identifier is numeric (user ID) or string (username)
        const isNumeric = /^\d+$/.test(identifier);
        
        if (isNumeric) {
          // Fetch by user ID using the get_user_by_id endpoint
          profileResponse = await axios.get(`/api/auth/${identifier}/`, {
            headers: { Authorization: `Token ${token}` }
          });
        } else {
          // Fetch by username - search for the user first
          const searchResponse = await axios.get('/api/auth/search/', {
            params: { q: identifier },
            headers: { Authorization: `Token ${token}` }
          });
          
          const user = searchResponse.data.results?.find(u => u.username === identifier);
          if (!user) {
            throw new Error('User not found');
          }
          
          // Now fetch full user details
          profileResponse = await axios.get(`/api/auth/${user.id}/`, {
            headers: { Authorization: `Token ${token}` }
          });
        }
        
        // Check if currently following this user using social API
        try {
          const followStatusResponse = await axios.get('/api/social/follows/check_follow_status/', {
            params: { user_id: profileResponse.data.id },
            headers: { Authorization: `Token ${token}` }
          });
          setIsFollowing(followStatusResponse.data.is_following || false);
        } catch (followError) {
          console.error('Error checking follow status:', followError);
          setIsFollowing(false);
        }
        
        // Mock activity data for other users (since we don't have their private activity)
        setActivity({
          recent_ratings: [],
          recent_comments: [],
          activity_counts: {
            total_ratings: profileResponse.data.total_ratings || 0,
            total_comments: profileResponse.data.total_comments || 0,
            total_bookmarks: profileResponse.data.total_bookmarks || 0,
            total_likes: profileResponse.data.total_likes || 0
          }
        });
      }

      // Fetch accurate social stats using the social API
      let socialStats = {
        follower_count: 0,
        following_count: 0,
        posts_count: 0,
        achievements_count: 0,
        stories_count: 0,
        collections_count: 0,
        total_achievement_points: 0
      };

      try {
        const socialStatsResponse = await axios.get(`/api/social/social-stats/${profileResponse.data.id}/`, {
          headers: { Authorization: `Token ${token}` }
        });
        socialStats = {
          follower_count: socialStatsResponse.data.followers_count || 0,
          following_count: socialStatsResponse.data.following_count || 0,
          posts_count: socialStatsResponse.data.posts_count || 0,
          achievements_count: socialStatsResponse.data.achievements_count || 0,
          stories_count: socialStatsResponse.data.stories_count || 0,
          collections_count: socialStatsResponse.data.collections_count || 0,
          total_achievement_points: socialStatsResponse.data.total_achievement_points || 0
        };
      } catch (socialError) {
        console.error('Error fetching social stats:', socialError);
        // Keep default values if social stats fail
      }

      // Enhance profile data with additional computed fields and accurate social stats
      const enhancedProfile = {
        ...profileResponse.data,
        bio: profileResponse.data.bio || profileResponse.data.headline || '',
        location: profileResponse.data.location || '',
        member_since: profileResponse.data.date_joined || profileResponse.data.member_since,
        total_ratings: profileResponse.data.total_ratings || 0,
        total_comments: profileResponse.data.total_comments || 0,
        total_bookmarks: profileResponse.data.total_bookmarks || 0,
        total_likes: profileResponse.data.total_likes || 0,
        follower_count: socialStats.follower_count,
        following_count: socialStats.following_count,
        posts_count: socialStats.posts_count,
        achievements_count: socialStats.achievements_count,
        stories_count: socialStats.stories_count,
        collections_count: socialStats.collections_count,
        total_achievement_points: socialStats.total_achievement_points,
        reputation_score: profileResponse.data.reputation_score || 0
      };
      
      setProfile(enhancedProfile);

    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError(error.response?.status === 404 ? 'User not found' : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!profile || followLoading) return;
    
    setFollowLoading(true);
    try {
      if (isFollowing) {
        // Use the social API unfollow endpoint
        const response = await axios.post('/api/social/follows/unfollow_user/', {
          user: profile.id
        }, {
          headers: { Authorization: `Token ${token}` }
        });
        
        setIsFollowing(false);
        
        // Update counts using the response data from the backend
        if (response.data.updated_counts) {
          setProfile(prev => ({
            ...prev,
            follower_count: response.data.updated_counts.target_follower_count
          }));
        } else {
          // Fallback: decrement count
          setProfile(prev => ({
            ...prev,
            follower_count: Math.max(0, (prev.follower_count || 0) - 1)
          }));
        }
        
        // Emit global event for other components
        const followEvent = new CustomEvent('followStateChanged', {
          detail: { userId: profile.id, isFollowing: false, action: 'unfollow' }
        });
        window.dispatchEvent(followEvent);
        
        // Show success message
        alert('Successfully unfollowed user');
      } else {
        // Use the social API follow endpoint
        const response = await axios.post('/api/social/follows/follow_user/', {
          user: profile.id,
          notify_on_posts: true,
          notify_on_stories: true,
          notify_on_achievements: false
        }, {
          headers: { Authorization: `Token ${token}` }
        });
        
        setIsFollowing(true);
        
        // Update counts using the response data from the backend
        if (response.data.updated_counts) {
          setProfile(prev => ({
            ...prev,
            follower_count: response.data.updated_counts.target_follower_count
          }));
        } else {
          // Fallback: increment count
          setProfile(prev => ({
            ...prev,
            follower_count: (prev.follower_count || 0) + 1
          }));
        }
        
        // Emit global event for other components
        const followEvent = new CustomEvent('followStateChanged', {
          detail: { userId: profile.id, isFollowing: true, action: 'follow' }
        });
        window.dispatchEvent(followEvent);
        
        // Show success message
        alert('Successfully followed user');
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
      
      // Show specific error message
      if (error.response?.status === 404) {
        alert('User not found');
      } else if (error.response?.status === 400) {
        alert(error.response.data?.error || 'Cannot perform this action');
      } else {
        alert('Failed to update follow status. Please try again.');
      }
    } finally {
      setFollowLoading(false);
    }
  };

  const handleMessage = async () => {
    // Navigate to messages with this user
    if (profile?.id) {
      try {
        // Create a new conversation or get existing one
        const response = await axios.post('/api/messaging/conversations/', {
          participant_ids: [profile.id],
          is_group: false
        });
        
        // Navigate to the conversation
        navigate(`/messages/${response.data.id}`);
      } catch (error) {
        console.error('Error creating conversation:', error);
        // Fallback to general messages page with user info
        navigate(`/messages?user=${profile.id}&username=${profile.username}`);
      }
    } else {
      alert('Unable to start conversation. Please try again.');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile.display_name || profile.username}'s Profile`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Profile link copied to clipboard!');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'achievements', label: 'Achievements', icon: Trophy },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'posts', label: 'Posts', icon: MessageCircle },
    ...(isOwnProfile ? [{ id: 'settings', label: 'Settings', icon: Settings }] : [])
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-2 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm sm:text-base">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{error}</h2>
          <p className="text-gray-600 mb-4">
            {error === 'User not found' 
              ? "The user you're looking for doesn't exist or has been removed."
              : "We're having trouble loading this profile. Please try again."
            }
          </p>
          <div className="space-y-3">
            <button 
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button 
              onClick={() => navigate('/')}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Back button for non-own profiles */}
        {!isOwnProfile && (
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
        )}

        {/* Profile Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto sm:mx-0">
                {imageError ? (
                  <div className="w-full h-full rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">
                      {getFirstNameInitials(profile)}
                    </span>
                  </div>
                ) : (
                  <img
                    src={getAvatarUrl(profile, 128)}
                    alt={profile.display_name || 'Profile'}
                    className="w-full h-full rounded-2xl object-cover shadow-lg"
                    onError={() => {
                      setImageError(true);
                    }}
                    onLoad={() => {
                      setImageError(false);
                    }}
                  />
                )}
                
                {/* Online status indicator */}
                {profile.is_online && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                )}
              </div>
              
              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start space-x-2 mb-1">
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                    {profile.first_name && profile.last_name 
                      ? `${profile.first_name} ${profile.last_name}` 
                      : (profile.username || 'User')}
                  </h1>
                  {profile.is_verified && (
                    <Shield className="w-4 h-4 text-blue-600" />
                  )}
                  {profile.is_premium && (
                    <Award className="w-4 h-4 text-amber-600" />
                  )}
                </div>
                
                {profile.username && (profile.first_name || profile.last_name) && (
                  <p className="text-blue-600 text-sm sm:text-base">@{profile.username}</p>
                )}
                
                {!isOwnProfile && profile.email && (
                  <p className="text-gray-600 text-sm sm:text-base">{profile.email}</p>
                )}
                
                {profile.headline && (
                  <p className="text-gray-700 text-sm sm:text-base font-medium mt-1">{profile.headline}</p>
                )}
                
                {profile.location && (
                  <div className="flex items-center justify-center sm:justify-start text-gray-500 mt-1">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span className="text-sm">{profile.location}</span>
                  </div>
                )}
                
                {profile.bio && (
                  <p className="text-gray-700 mt-2 text-sm sm:text-base">{profile.bio}</p>
                )}
                
                <div className="flex items-center justify-center sm:justify-start text-gray-500 mt-2 text-sm">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>
                    Joined {new Date(profile.date_joined || profile.member_since).toLocaleDateString('en-US', { 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center justify-center space-x-3">
              {!isOwnProfile && (
                <>
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={`flex items-center px-3 sm:px-4 py-2.5 rounded-xl font-medium text-sm sm:text-base transition-colors ${
                      isFollowing
                        ? 'bg-gray-600 text-white hover:bg-gray-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {followLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border border-white border-t-transparent mr-2"></div>
                    ) : isFollowing ? (
                      <UserMinus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    ) : (
                      <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    )}
                    {isFollowing ? 'Unfollow' : 'Follow'}
                  </button>
                  
                  <button
                    onClick={handleMessage}
                    className="flex items-center px-3 sm:px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm sm:text-base"
                  >
                    <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Message
                  </button>
                </>
              )}
              
              <button
                onClick={handleShare}
                className="flex items-center px-3 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                <Share className="w-4 h-4" />
              </button>
              
              {isOwnProfile && (
                <Link
                  to="/profile"
                  className="flex items-center px-3 sm:px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base"
                >
                  <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Edit Profile</span>
                  <span className="sm:hidden">Edit</span>
                </Link>
              )}
            </div>
          </div>
          
          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 sm:gap-6 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-100">
            <button
              onClick={() => setFollowModal({ isOpen: true, type: 'followers' })}
              className="text-center hover:bg-gray-50 rounded-lg p-2 transition-colors"
            >
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{profile.follower_count || 0}</div>
              <div className="text-xs sm:text-sm text-gray-600">Followers</div>
            </button>
            <button
              onClick={() => setFollowModal({ isOpen: true, type: 'following' })}
              className="text-center hover:bg-gray-50 rounded-lg p-2 transition-colors"
            >
              <div className="text-xl sm:text-2xl font-bold text-green-600">{profile.following_count || 0}</div>
              <div className="text-xs sm:text-sm text-gray-600">Following</div>
            </button>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-purple-600">{profile.total_ratings || 0}</div>
              <div className="text-xs sm:text-sm text-gray-600">Ratings</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-orange-600">{profile.total_comments || 0}</div>
              <div className="text-xs sm:text-sm text-gray-600">Comments</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-amber-600">{profile.reputation_score || 0}</div>
              <div className="text-xs sm:text-sm text-gray-600">Reputation</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-4 sm:mb-6">
          {/* Mobile Tab Menu */}
          <div className="md:hidden border-b border-gray-100">
            <button
              onClick={() => setIsTabMenuOpen(!isTabMenuOpen)}
              className="flex items-center justify-between w-full px-4 sm:px-6 py-4 text-left"
            >
              <div className="flex items-center space-x-2">
                {tabs.find(tab => tab.id === activeTab)?.icon && (
                  React.createElement(tabs.find(tab => tab.id === activeTab).icon, { className: "w-4 h-4 text-blue-600" })
                )}
                <span className="font-medium text-gray-900 text-sm sm:text-base">
                  {tabs.find(tab => tab.id === activeTab)?.label}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isTabMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isTabMenuOpen && (
              <div className="border-t border-gray-100">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setIsTabMenuOpen(false);
                      }}
                      className={`flex items-center w-full px-4 sm:px-6 py-3 text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <IconComponent className="w-4 h-4 mr-2" />
                      <span className="font-medium text-sm sm:text-base">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Desktop Tab Navigation */}
          <div className="hidden md:block border-b border-gray-100">
            <nav className="flex space-x-8 px-6 overflow-x-auto">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
                    }`}
                  >
                    <IconComponent className="w-4 h-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-4 sm:p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* About Section */}
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">About</h3>
                    <div className="bg-gray-50 rounded-xl p-3 sm:p-4 space-y-3 border border-gray-100">
                      <div className="flex justify-between">
                        <span className="text-gray-600 text-sm">Member since</span>
                        <span className="font-medium text-sm">
                          {new Date(profile.date_joined || profile.member_since).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 text-sm">Account Type</span>
                        <span className="font-medium text-sm">
                          {profile.is_premium ? 'Premium' : 'Free'}
                        </span>
                      </div>
                      {profile.reputation_score && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 text-sm">Reputation</span>
                          <span className="font-medium text-sm">{profile.reputation_score} points</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600 text-sm">Total Activity</span>
                        <span className="font-medium text-sm">
                          {(profile.total_ratings || 0) + (profile.total_comments || 0) + (profile.total_likes || 0)} actions
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information (for non-own profiles) */}
                  {!isOwnProfile && (
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Contact</h3>
                      <div className="space-y-3">
                        {profile.email && (
                          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                            <Mail className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-700">{profile.email}</span>
                          </div>
                        )}
                          {profile.linkedin_url && (
                          <a
                            href={profile.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-700">LinkedIn Profile</span>
                          </a>
                        )}
                        {profile.personal_website && (
                          <a
                            href={profile.personal_website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                          >
                            <Globe className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-700">Personal Website</span>
                          </a>
                        )}
                        
                        {/* Action buttons for messaging */}
                        <div className="flex space-x-2">
                          <button
                            onClick={handleMessage}
                            className="flex-1 flex items-center justify-center space-x-2 p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Send Message</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Achievements Tab */}
            {activeTab === 'achievements' && (
              <ProfileAchievements 
                userId={profile.id} 
                currentUser={currentUser} 
                isOwnProfile={isOwnProfile} 
              />
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="space-y-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Recent Activity</h3>
                
                {activity ? (
                  <div className="space-y-6">
                    {/* Recent Ratings */}
                    {activity.recent_ratings?.length > 0 && (
                      <div>
                        <h4 className="text-sm sm:text-md font-medium text-gray-800 mb-3 flex items-center">
                          <Star className="w-4 h-4 mr-2 text-amber-500" />
                          Recent Ratings
                        </h4>
                        <div className="space-y-3">
                          {activity.recent_ratings.map((rating, index) => (
                            <Link
                              key={index}
                              to={`/startups/${rating.startup_id}`}
                              className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-100"
                            >
                              <div className="flex items-center space-x-3 min-w-0 flex-1">
                                <span className="text-lg sm:text-xl flex-shrink-0">{rating.startup_logo || '🚀'}</span>
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{rating.startup_name}</p>
                                  <p className="text-xs sm:text-sm text-gray-500">
                                    {new Date(rating.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1 flex-shrink-0">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3 h-3 sm:w-4 sm:h-4 ${
                                      i < rating.rating ? 'text-amber-400 fill-current' : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recent Comments */}
                    {activity.recent_comments?.length > 0 && (
                      <div>
                        <h4 className="text-sm sm:text-md font-medium text-gray-800 mb-3 flex items-center">
                          <MessageSquare className="w-4 h-4 mr-2 text-blue-500" />
                          Recent Comments
                        </h4>
                        <div className="space-y-3">
                          {activity.recent_comments.map((comment, index) => (
                            <Link
                              key={index}
                              to={`/startups/${comment.startup_id}`}
                              className="block p-3 sm:p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-100"
                            >
                              <div className="flex items-center space-x-3 mb-2">
                                <span className="text-lg flex-shrink-0">{comment.startup_logo || '🚀'}</span>
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{comment.startup_name}</p>
                                  <p className="text-xs sm:text-sm text-gray-500">
                                    {new Date(comment.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <p className="text-gray-700 text-xs sm:text-sm line-clamp-2">{comment.text}</p>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Activity Summary Stats */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
                      <h4 className="text-sm sm:text-md font-medium text-gray-800 mb-3 flex items-center">
                        <TrendingUpIcon className="w-4 h-4 mr-2 text-purple-500" />
                        Activity Summary
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-purple-600">{activity.activity_counts?.total_ratings || 0}</div>
                          <div className="text-xs text-gray-600">Total Ratings</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">{activity.activity_counts?.total_comments || 0}</div>
                          <div className="text-xs text-gray-600">Comments</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">{activity.activity_counts?.total_likes || 0}</div>
                          <div className="text-xs text-gray-600">Likes</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-amber-600">{activity.activity_counts?.total_bookmarks || 0}</div>
                          <div className="text-xs text-gray-600">Bookmarks</div>
                        </div>
                      </div>
                    </div>

                    {(!activity.recent_ratings?.length && !activity.recent_comments?.length) && (
                      <div className="text-center py-8">
                        <Activity className="w-8 h-8 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600 mb-3 text-sm sm:text-base">No recent activity found.</p>
                        {isOwnProfile && (
                          <Link
                            to="/startups"
                            className="inline-block px-4 sm:px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base"
                          >
                            Explore Startups
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="w-8 h-8 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 mb-3 text-sm sm:text-base">Unable to load activity data.</p>
                  </div>
                )}
              </div>
            )}

            {/* Posts Tab */}
            {activeTab === 'posts' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Recent Posts</h3>
                  {isOwnProfile && (
                    <Link
                      to="/posts/new"
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Create Post
                    </Link>
                  )}
                </div>
                
                {/* Mock posts data - replace with real posts when available */}
                <div className="space-y-4">
                  {[1, 2, 3].map((post) => (
                    <div key={post} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start space-x-3">
                        <img
                          src={getAvatarUrl(profile, 128)}
                          alt={profile.display_name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <p className="font-medium text-gray-900 text-sm">{profile.display_name || profile.username}</p>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-xs text-gray-500">2 hours ago</span>
                          </div>
                          <p className="text-gray-700 text-sm mb-3">
                            Sample post content would appear here. This is a demonstration of how posts would look in the user profile.
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <button className="flex items-center space-x-1 hover:text-blue-600 transition-colors">
                              <ThumbsUp className="w-3 h-3" />
                              <span>12</span>
                            </button>
                            <button className="flex items-center space-x-1 hover:text-blue-600 transition-colors">
                              <MessageCircle className="w-3 h-3" />
                              <span>5</span>
                            </button>
                            <button className="flex items-center space-x-1 hover:text-blue-600 transition-colors">
                              <Share className="w-3 h-3" />
                              <span>Share</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">Posts integration coming soon...</p>
                  <Link
                    to="/posts"
                    className="inline-block mt-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    View All Posts
                  </Link>
                </div>
              </div>
            )}

            {/* Settings Tab (own profile only) */}
            {activeTab === 'settings' && isOwnProfile && (
              <div className="space-y-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Profile Settings</h3>
                <div className="text-center py-8">
                  <Link
                    to="/profile"
                    className="inline-block px-4 sm:px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base"
                  >
                    Go to Full Settings
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Follow Modal */}
      <FollowModal
        isOpen={followModal.isOpen}
        onClose={() => setFollowModal({ isOpen: false, type: null })}
        type={followModal.type}
        userId={profile?.id}
        username={profile?.username}
      />
      
      {/* Custom CSS for line clamp */}
      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default UserProfile;