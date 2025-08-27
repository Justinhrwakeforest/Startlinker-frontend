// src/components/Profile.js - Responsive Enhanced Version
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { getAvatarUrl, getUserDisplayName, getFirstNameInitials } from '../utils/avatarUtils';
import axios from '../config/axios';
import api from '../services/api';
import { useNotifications } from './NotificationSystem';
import UsernameInput from './UsernameInput';
import ProfilePictureUpload from './ProfilePictureUpload';
import ProfileAchievements from './profile/ProfileAchievements';
import { 
  User, MapPin, Calendar, Edit, Save, X, 
  Star, Bookmark, MessageCircle, Heart,
  Building, Briefcase, Settings, Activity,
  TrendingUp, Award, Target, AlertCircle,
  Sparkles, ExternalLink, ChevronDown, Menu,
  Camera, Upload, Trash2, Users, UserPlus, FileText,
  Search, Trophy
} from 'lucide-react';
import ResumeManager from './ResumeManager';

const Profile = () => {
  const { user, token, updateUser } = useContext(AuthContext);
  const { success, error } = useNotifications();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [activity, setActivity] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    bio: '',
    location: ''
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [interests, setInterests] = useState([]);
  const [newInterest, setNewInterest] = useState('');
  const [isTabMenuOpen, setIsTabMenuOpen] = useState(false);
  const [usernameValid, setUsernameValid] = useState(true);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [showPictureUpload, setShowPictureUpload] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [followersSearchQuery, setFollowersSearchQuery] = useState('');
  const [followingSearchQuery, setFollowingSearchQuery] = useState('');
  const [filteredFollowers, setFilteredFollowers] = useState([]);
  const [filteredFollowing, setFilteredFollowing] = useState([]);

  useEffect(() => {
    fetchProfileData();
    
    // Listen for follow state changes from other components
    const handleFollowStateChange = async (event) => {
      console.log('Profile: Follow state changed', event.detail);
      
      // If currently on following/followers tab, refresh that data first (which updates counts)
      if (activeTab === 'following') {
        console.log('Refreshing following data from global event...');
        await fetchFollowing();
      } else if (activeTab === 'followers') {
        console.log('Refreshing followers data from global event...');
        await fetchFollowers();
      }
      
      // Also refresh profile data to get updated user info
      console.log('Refreshing profile data from global event...');
      await fetchProfileData();
    };
    
    window.addEventListener('followStateChanged', handleFollowStateChange);
    
    return () => {
      window.removeEventListener('followStateChanged', handleFollowStateChange);
    };
  }, [activeTab]);

  // Load followers/following data when their tabs are accessed
  useEffect(() => {
    if (activeTab === 'followers') {
      fetchFollowers();
    } else if (activeTab === 'following') {
      fetchFollowing();
    }
  }, [activeTab]);

  // Filter followers based on search query
  useEffect(() => {
    if (!followersSearchQuery.trim()) {
      setFilteredFollowers(followers);
    } else {
      const filtered = followers.filter(follower => {
        const displayName = follower.display_name || `${follower.first_name || ''} ${follower.last_name || ''}`.trim();
        const username = follower.username || '';
        return displayName.toLowerCase().includes(followersSearchQuery.toLowerCase()) ||
               username.toLowerCase().includes(followersSearchQuery.toLowerCase());
      });
      setFilteredFollowers(filtered);
    }
  }, [followers, followersSearchQuery]);

  // Filter following based on search query
  useEffect(() => {
    if (!followingSearchQuery.trim()) {
      setFilteredFollowing(following);
    } else {
      const filtered = following.filter(user => {
        const displayName = user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim();
        const username = user.username || '';
        return displayName.toLowerCase().includes(followingSearchQuery.toLowerCase()) ||
               username.toLowerCase().includes(followingSearchQuery.toLowerCase());
      });
      setFilteredFollowing(filtered);
    }
  }, [following, followingSearchQuery]);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const [profileRes, activityRes, bookmarksRes, interestsRes] = await Promise.all([
        axios.get('/api/auth/profile/'),
        axios.get('/api/auth/activity/'),
        fetchBookmarks(),
        axios.get('/api/auth/interests/')
      ]);
      
      // Follower counts are now retrieved from profile data above

      console.log('Profile API Response:', profileRes.data);
      setProfile(profileRes.data);
      setActivity(activityRes.data);
      setInterests(interestsRes.data);
      
      // Set follower counts from profile data
      setFollowersCount(profileRes.data.follower_count || 0);
      setFollowingCount(profileRes.data.following_count || 0);
      
      setEditData({
        username: profileRes.data.username || '',
        first_name: profileRes.data.first_name || '',
        last_name: profileRes.data.last_name || '',
        bio: profileRes.data.bio || '',
        location: profileRes.data.location || ''
      });
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookmarks = async () => {
    try {
      // Get user's bookmarked startups
      const response = await axios.get('/api/startups/', {
        params: { bookmarked: true }
      });
      setBookmarks(response.data.results || []);
      return response;
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      return { data: [] };
    }
  };

  const fetchFollowers = async () => {
    setLoadingFollowers(true);
    try {
      const response = await axios.get('/api/social/follows/followers/');
      const followersData = (response.data.results || response.data || []).map(follow => ({
        id: follow.follower,
        username: follow.follower_username,
        display_name: follow.follower_display_name,
        avatar: follow.follower_avatar,
        relationData: follow
      }));
      setFollowers(followersData);
      
      // Always use actual data count - this is the source of truth
      const actualCount = followersData.length;
      setFollowersCount(actualCount);
      
      // If profile data exists and count doesn't match, sync it
      if (profile && profile.follower_count !== actualCount) {
        console.log(`Follower count mismatch detected: profile shows ${profile.follower_count}, actual is ${actualCount}. Syncing...`);
        // Update profile data locally
        setProfile(prev => ({ ...prev, follower_count: actualCount }));
      }
      
      // Auto-correct any mismatch by updating the profile data immediately
      setProfile(prev => {
        if (prev && prev.follower_count !== actualCount) {
          console.log(`Auto-correcting profile follower count: ${prev.follower_count} -> ${actualCount}`);
          return { ...prev, follower_count: actualCount };
        }
        return prev;
      });
    } catch (error) {
      console.error('Error fetching followers:', error);
      setFollowers([]);
      setFollowersCount(0);
    } finally {
      setLoadingFollowers(false);
    }
  };

  const fetchFollowing = async () => {
    setLoadingFollowing(true);
    try {
      console.log('Fetching following data...'); // Debug log
      // Add timestamp to prevent caching
      const response = await axios.get(`/api/social/follows/following/?t=${Date.now()}`);
      console.log('Following API response:', response.data); // Debug log
      const followingData = (response.data.results || response.data || []).map(follow => ({
        id: follow.following,
        username: follow.following_username,
        display_name: follow.following_display_name,
        avatar: follow.following_avatar,
        relationData: follow
      }));
      console.log('Processed following data:', followingData, 'Count:', followingData.length); // Debug log
      setFollowing(followingData);
      
      // Always use actual data count - this is the source of truth
      const actualCount = followingData.length;
      setFollowingCount(actualCount);
      console.log(`Following count updated to: ${actualCount}`);
      
      // If profile data exists and count doesn't match, sync it immediately
      if (profile && profile.following_count !== actualCount) {
        console.log(`Count mismatch detected: profile shows ${profile.following_count}, actual is ${actualCount}. Syncing locally...`);
        // Update profile data locally
        setProfile(prev => ({ ...prev, following_count: actualCount }));
      }
      
      // Force update the display count in header by directly setting it
      // This ensures the header always shows the correct count
      console.log(`Forcing header count update to: ${actualCount}`);
      
      // Auto-correct any mismatch by updating the profile data immediately
      setProfile(prev => {
        if (prev && prev.following_count !== actualCount) {
          console.log(`Auto-correcting profile following count: ${prev.following_count} -> ${actualCount}`);
          return { ...prev, following_count: actualCount };
        }
        return prev;
      });
      
    } catch (error) {
      console.error('Error fetching following:', error);
      setFollowing([]);
      setFollowingCount(0);
    } finally {
      setLoadingFollowing(false);
    }
  };



  const handleFollow = async (userId) => {
    try {
      const response = await axios.post('/api/social/follows/follow_user/', {
        user: String(userId),
        notify_on_posts: true,
        notify_on_stories: true,
        notify_on_achievements: false
      });
      
      success('User followed successfully!');
      
      // Use updated counts from API response if available
      if (response.data.updated_counts) {
        const counts = response.data.updated_counts;
        console.log('Received updated counts from API:', counts);
        
        // Update following count immediately
        setFollowingCount(counts.follower_following_count);
        
        // Update profile data to match
        if (profile) {
          setProfile(prev => ({
            ...prev,
            following_count: counts.follower_following_count
          }));
        }
      }
      
      // Refresh data to ensure everything is in sync
      if (activeTab === 'following') {
        await fetchFollowing();
      } else if (activeTab === 'followers') {
        await fetchFollowers();
      }
      
      // Also refresh profile data as a backup
      await fetchProfileData();
      
    } catch (err) {
      console.error('Error following user:', err);
      error('Failed to follow user. Please try again.');
    }
  };

  const handleUnfollow = async (userId) => {
    try {
      console.log('Starting unfollow for user:', userId);
      const response = await axios.post('/api/social/follows/unfollow_user/', {
        user: String(userId)
      });
      
      success('User unfollowed successfully!');
      
      // Use updated counts from API response if available
      if (response.data.updated_counts) {
        const counts = response.data.updated_counts;
        console.log('Received updated counts from API:', counts);
        
        // Update following count immediately
        setFollowingCount(counts.follower_following_count);
        
        // Update profile data to match
        if (profile) {
          setProfile(prev => ({
            ...prev,
            following_count: counts.follower_following_count
          }));
        }
      }
      
      // Refresh data to ensure everything is in sync
      if (activeTab === 'following') {
        console.log('Refreshing following data...');
        await fetchFollowing();
      }
      
      // Also refresh profile data as a backup
      console.log('Refreshing profile data...');
      await fetchProfileData();
      
      console.log('Unfollow refresh complete');
    } catch (err) {
      console.error('Error unfollowing user:', err);
      error('Failed to unfollow user. Please try again.');
    }
  };

  const handleUserClick = (username) => {
    navigate(`/profile/${username}`);
  };

  const handleEditToggle = () => {
    if (editMode) {
      // Cancel edit
      setEditData({
        username: profile.username || '',
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        bio: profile.bio || '',
        location: profile.location || ''
      });
    }
    setEditMode(!editMode);
  };

  const handleSaveProfile = async () => {
    if (!usernameValid) {
      alert('Please choose a valid and available username');
      return;
    }
    
    try {
      const response = await axios.patch('/api/auth/profile/', editData);
      setProfile(response.data);
      setEditMode(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  };

  const handleAddInterest = async (e) => {
    e.preventDefault();
    if (!newInterest.trim()) return;

    try {
      await axios.post('/api/auth/interests/', {
        interest: newInterest.trim()
      });
      setNewInterest('');
      // Refresh interests
      const response = await axios.get('/api/auth/interests/');
      setInterests(response.data);
    } catch (error) {
      console.error('Error adding interest:', error);
    }
  };

  const handleRemoveInterest = async (interestId) => {
    try {
      await axios.delete(`/auth/interests/${interestId}/`);
      setInterests(interests.filter(i => i.id !== interestId));
    } catch (error) {
      console.error('Error removing interest:', error);
    }
  };

  const removeBookmark = async (startupId) => {
    try {
      await axios.post(`/startups/${startupId}/bookmark/`);
      setBookmarks(bookmarks.filter(b => b.id !== startupId));
    } catch (error) {
      console.error('Error removing bookmark:', error);
    }
  };

  const handleProfilePictureUpload = async (file) => {
    console.log('Starting profile picture upload:', file);
    console.log('File details:', {
      name: file.name,
      size: file.size,
      type: file.type
    });
    
    setUploadingPicture(true);
    try {
      const response = await api.auth.uploadProfilePicture(file);
      console.log('Upload response:', response);
      
      if (response.user) {
        // Update profile immediately with the new data
        setProfile(response.user);
        console.log('Profile updated with new avatar:', response.user.avatar_url);
        
        // Update the user context to reflect the new avatar everywhere
        updateUser(response.user);
        
        // Show success message
        success('Profile picture updated successfully!');
      }
      
    } catch (err) {
      console.error('Error uploading profile picture - Full error:', err);
      console.error('Error response:', err.response);
      console.error('Error response data:', err.response?.data);
      console.error('Error response status:', err.response?.status);
      console.error('Error response headers:', err.response?.headers);
      
      // More detailed error message
      let errorMessage = 'Failed to upload profile picture: ';
      if (err.response?.data?.error) {
        errorMessage += err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage += err.response.data.message;
      } else if (err.response?.data) {
        errorMessage += JSON.stringify(err.response.data);
      } else if (err.message) {
        errorMessage += err.message;
      } else {
        errorMessage += 'Unknown error occurred';
      }
      
      error(errorMessage);
      throw err; // Re-throw so the component can handle it
    } finally {
      setUploadingPicture(false);
    }
  };

  const handlePictureUploadClick = () => {
    setShowPictureUpload(true);
  };

  const handleProfilePictureDelete = async () => {
    if (!profile.profile_picture) return;

    if (!window.confirm('Are you sure you want to delete your profile picture?')) {
      return;
    }

    setUploadingPicture(true);
    try {
      const response = await api.auth.deleteProfilePicture();
      setProfile(response.user);
      alert('Profile picture deleted successfully!');
    } catch (error) {
      console.error('Error deleting profile picture:', error);
      alert('Failed to delete profile picture. Please try again.');
    } finally {
      setUploadingPicture(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'achievements', label: 'Achievements', icon: Trophy },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark },
    { id: 'resumes', label: 'Resumes', icon: FileText },
    { id: 'followers', label: 'Followers', icon: Users },
    { id: 'following', label: 'Following', icon: UserPlus },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-2 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm sm:text-base">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto sm:mx-0">
                <img
                  key={profile?.id} // Force re-render when profile changes
                  src={getAvatarUrl(profile, 128)}
                  alt={getUserDisplayName(profile)}
                  className={`w-full h-full rounded-2xl object-cover shadow-lg transition-opacity ${uploadingPicture ? 'opacity-50' : 'opacity-100'}`}
                />
                
                {/* Upload progress indicator */}
                {uploadingPicture && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 rounded-2xl">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                  </div>
                )}
                
                {/* Profile picture upload/edit buttons */}
                {editMode && (
                  <div className="absolute -bottom-2 -right-2 flex space-x-1">
                    <button
                      onClick={handlePictureUploadClick}
                      disabled={uploadingPicture}
                      className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors shadow-lg"
                    >
                      {uploadingPicture ? (
                        <div className="animate-spin rounded-full h-4 w-4 border border-white border-t-transparent"></div>
                      ) : (
                        <Camera className="w-4 h-4" />
                      )}
                    </button>
                    {profile?.profile_picture && (
                      <button
                        onClick={handleProfilePictureDelete}
                        disabled={uploadingPicture}
                        className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white hover:bg-red-700 transition-colors shadow-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="flex-1 text-center sm:text-left">
                {editMode ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Username
                      </label>
                      <UsernameInput
                        value={editData.username}
                        onChange={(value) => setEditData({...editData, username: value})}
                        onValidationChange={(isValid, isAvailable) => {
                          setUsernameValid(isValid && isAvailable);
                        }}
                        placeholder="Choose your username..."
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base text-gray-900"
                        showSuggestions={true}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={editData.first_name}
                        onChange={(e) => setEditData({...editData, first_name: e.target.value})}
                        placeholder="First Name"
                        className="px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                      />
                      <input
                        type="text"
                        value={editData.last_name}
                        onChange={(e) => setEditData({...editData, last_name: e.target.value})}
                        placeholder="Last Name"
                        className="px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                      />
                    </div>
                    <input
                      type="text"
                      value={editData.location}
                      onChange={(e) => setEditData({...editData, location: e.target.value})}
                      placeholder="Location"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    />
                    <textarea
                      value={editData.bio}
                      onChange={(e) => setEditData({...editData, bio: e.target.value})}
                      placeholder="Bio"
                      rows="3"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    />
                  </div>
                ) : (
                  <div>
                    <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                      {profile?.first_name && profile?.last_name 
                        ? `${profile.first_name} ${profile.last_name}` 
                        : (profile?.username || 'User')}
                    </h1>
                    {profile?.username && (profile?.first_name || profile?.last_name) && (
                      <p className="text-blue-600 text-sm sm:text-base">@{profile.username}</p>
                    )}
                    <p className="text-gray-600 text-sm sm:text-base">{profile?.email}</p>
                    {profile?.location && (
                      <div className="flex items-center justify-center sm:justify-start text-gray-500 mt-1">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span className="text-sm">{profile.location}</span>
                      </div>
                    )}
                    {profile?.bio && (
                      <p className="text-gray-700 mt-2 text-sm sm:text-base">{profile.bio}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-center space-x-3">
              {profile?.is_premium && (
                <span className="inline-flex items-center px-2 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 border border-amber-300">
                  <Award className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  Premium
                </span>
              )}
              
              {editMode ? (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSaveProfile}
                    className="flex items-center px-3 sm:px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base"
                  >
                    <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Save
                  </button>
                  <button
                    onClick={handleEditToggle}
                    className="flex items-center px-3 sm:px-4 py-2.5 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-medium text-sm sm:text-base"
                  >
                    <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleEditToggle}
                  className="flex items-center px-3 sm:px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base"
                >
                  <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Edit Profile</span>
                  <span className="sm:hidden">Edit</span>
                </button>
              )}
            </div>
          </div>
          
          {/* Stats Row */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4 sm:gap-6 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-100">
            <div className="text-center cursor-pointer" onClick={() => setActiveTab('followers')}>
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{followersCount}</div>
              <div className="text-xs sm:text-sm text-gray-600">Followers</div>
            </div>
            <div className="text-center cursor-pointer" onClick={() => setActiveTab('following')}>
              <div className="text-xl sm:text-2xl font-bold text-green-600">{followingCount}</div>
              <div className="text-xs sm:text-sm text-gray-600">Following</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-purple-600">{profile?.total_ratings || 0}</div>
              <div className="text-xs sm:text-sm text-gray-600">Ratings</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-orange-600">{profile?.total_comments || 0}</div>
              <div className="text-xs sm:text-sm text-gray-600">Comments</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-pink-600">{profile?.total_bookmarks || 0}</div>
              <div className="text-xs sm:text-sm text-gray-600">Bookmarks</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-red-600">{profile?.total_likes || 0}</div>
              <div className="text-xs sm:text-sm text-gray-600">Likes</div>
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
                          {new Date(profile?.member_since).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 text-sm">Account Type</span>
                        <span className="font-medium text-sm">
                          {profile?.is_premium ? 'Premium' : 'Free'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 text-sm">Total Activity</span>
                        <span className="font-medium text-sm">
                          {(profile?.total_ratings || 0) + (profile?.total_comments || 0) + (profile?.total_likes || 0)} actions
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Interests Section */}
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Interests</h3>
                    <div className="space-y-4">
                      <form onSubmit={handleAddInterest} className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                        <input
                          type="text"
                          value={newInterest}
                          onChange={(e) => setNewInterest(e.target.value)}
                          placeholder="Add an interest..."
                          className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base text-gray-900"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base"
                        >
                          Add
                        </button>
                      </form>
                      
                      <div className="flex flex-wrap gap-2">
                        {interests.map((interest) => (
                          <span
                            key={interest.id}
                            className="inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200"
                          >
                            {interest.interest}
                            <button
                              onClick={() => handleRemoveInterest(interest.id)}
                              className="ml-2 text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Achievements Tab */}
            {activeTab === 'achievements' && (
              <ProfileAchievements 
                userId={profile?.id} 
                currentUser={user} 
                isOwnProfile={true} 
              />
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="space-y-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Recent Activity</h3>
                
                {/* Recent Ratings */}
                {activity?.recent_ratings?.length > 0 && (
                  <div>
                    <h4 className="text-sm sm:text-md font-medium text-gray-800 mb-3">Recent Ratings</h4>
                    <div className="space-y-3">
                      {activity.recent_ratings.map((rating, index) => (
                        <Link
                          key={index}
                          to={`/startups/${rating.startup_id}`}
                          className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-100"
                        >
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            <span className="text-lg sm:text-xl flex-shrink-0">{rating.startup_logo}</span>
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
                {activity?.recent_comments?.length > 0 && (
                  <div>
                    <h4 className="text-sm sm:text-md font-medium text-gray-800 mb-3">Recent Comments</h4>
                    <div className="space-y-3">
                      {activity.recent_comments.map((comment, index) => (
                        <Link
                          key={index}
                          to={`/startups/${comment.startup_id}`}
                          className="block p-3 sm:p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-100"
                        >
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-lg flex-shrink-0">{comment.startup_logo}</span>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{comment.startup_name}</p>
                              <p className="text-xs sm:text-sm text-gray-500">
                                {new Date(comment.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <p className="text-gray-700 text-xs sm:text-sm">{comment.text}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {(!activity?.recent_ratings?.length && !activity?.recent_comments?.length) && (
                  <div className="text-center py-8">
                    <Activity className="w-8 h-8 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 mb-3 text-sm sm:text-base">No recent activity found.</p>
                    <Link
                      to="/startups"
                      className="inline-block px-4 sm:px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base"
                    >
                      Explore Startups
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Bookmarks Tab */}
            {activeTab === 'bookmarks' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Your Bookmarks</h3>
                  <span className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-xl w-fit">{bookmarks.length} startups</span>
                </div>
                
                {bookmarks.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {bookmarks.map((startup) => (
                      <div
                        key={startup.id}
                        className="bg-white border border-gray-100 rounded-2xl p-4 hover:border-gray-200 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                            <span className="text-lg sm:text-xl flex-shrink-0">{startup.logo}</span>
                            <div className="min-w-0 flex-1">
                              <Link
                                to={`/startups/${startup.id}`}
                                className="font-medium text-gray-900 hover:text-blue-600 transition-colors text-sm sm:text-base truncate block"
                              >
                                {startup.name}
                              </Link>
                              <p className="text-xs sm:text-sm text-gray-600 truncate">{startup.industry_name}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeBookmark(startup.id)}
                            className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded-lg hover:bg-red-50 flex-shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <p className="text-gray-700 text-xs sm:text-sm mb-3 line-clamp-2">{startup.description}</p>
                        
                        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
                          <span className="flex items-center min-w-0">
                            <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span className="truncate">{startup.location}</span>
                          </span>
                          <span className="flex items-center flex-shrink-0 ml-2">
                            <Star className="w-3 h-3 mr-1 text-amber-400" />
                            {startup.average_rating?.toFixed(1) || 'N/A'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Bookmark className="w-8 h-8 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 mb-3 text-sm sm:text-base">No bookmarks yet.</p>
                    <Link
                      to="/startups"
                      className="inline-block px-4 sm:px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base"
                    >
                      Browse Startups
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Resumes Tab */}
            {activeTab === 'resumes' && (
              <div className="space-y-6">
                <ResumeManager />
              </div>
            )}

            {/* Followers Tab */}
            {activeTab === 'followers' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    Followers ({followersCount})
                  </h3>
                  {followers.length > 0 && (
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={followersSearchQuery}
                        onChange={(e) => setFollowersSearchQuery(e.target.value)}
                        placeholder="Search followers..."
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                  )}
                </div>
                
                {loadingFollowers ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-blue-600"></div>
                  </div>
                ) : filteredFollowers.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredFollowers.map((follower) => (
                      <div 
                        key={follower.id} 
                        onClick={() => handleUserClick(follower.username)}
                        className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center space-x-3">
                          <img
                            src={getAvatarUrl(follower, 128)}
                            alt={follower.display_name || follower.username}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
                              {follower.display_name || follower.username}
                            </h4>
                            <p className="text-gray-500 text-xs">@{follower.username}</p>
                          </div>
                        </div>
                        {follower.bio && (
                          <p className="text-gray-600 text-sm mt-2 line-clamp-2">{follower.bio}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : followers.length > 0 && followersSearchQuery ? (
                  <div className="text-center py-8">
                    <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No followers found matching "{followersSearchQuery}"</p>
                    <button
                      onClick={() => setFollowersSearchQuery('')}
                      className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Clear search
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No followers yet</p>
                  </div>
                )}
              </div>
            )}

            {/* Following Tab */}
            {activeTab === 'following' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                      Following ({followingCount})
                    </h3>
                    <button
                      onClick={() => {
                        fetchFollowing();
                        fetchProfileData(); // Also refresh profile data for counts
                      }}
                      className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Refresh following list"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                  {following.length > 0 && (
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={followingSearchQuery}
                        onChange={(e) => setFollowingSearchQuery(e.target.value)}
                        placeholder="Search following..."
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                  )}
                </div>
                
                {loadingFollowing ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-blue-600"></div>
                  </div>
                ) : filteredFollowing.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredFollowing.map((followedUser) => (
                      <div 
                        key={followedUser.id} 
                        className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-300 transition-all group"
                      >
                        <div className="flex items-center space-x-3">
                          <img
                            src={getAvatarUrl(followedUser, 128)}
                            alt={followedUser.display_name || followedUser.username}
                            className="w-10 h-10 rounded-full object-cover cursor-pointer"
                            onClick={() => handleUserClick(followedUser.username)}
                          />
                          <div 
                            className="flex-1 cursor-pointer" 
                            onClick={() => handleUserClick(followedUser.username)}
                          >
                            <h4 className="font-medium text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
                              {followedUser.display_name || followedUser.username}
                            </h4>
                            <p className="text-gray-500 text-xs">@{followedUser.username}</p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnfollow(followedUser.id);
                            }}
                            className="px-3 py-1 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            Unfollow
                          </button>
                        </div>
                        {followedUser.bio && (
                          <p 
                            className="text-gray-600 text-sm mt-2 line-clamp-2 cursor-pointer" 
                            onClick={() => handleUserClick(followedUser.username)}
                          >
                            {followedUser.bio}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : following.length > 0 && followingSearchQuery ? (
                  <div className="text-center py-8">
                    <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No users found matching "{followingSearchQuery}"</p>
                    <button
                      onClick={() => setFollowingSearchQuery('')}
                      className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Clear search
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Not following anyone yet</p>
                    <Link 
                      to="/startups" 
                      className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Discover People
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Account Settings</h3>
                
                <div className="space-y-6">
                  {/* Username Settings */}
                  <div className="bg-gray-50 rounded-2xl p-4 sm:p-6 border border-gray-100">
                    <h4 className="font-semibold text-gray-900 mb-4 text-sm sm:text-base">Username Settings</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Your Username
                        </label>
                        <UsernameInput
                          value={editData.username}
                          onChange={(value) => setEditData({...editData, username: value})}
                          onValidationChange={(isValid, isAvailable) => {
                            setUsernameValid(isValid && isAvailable);
                          }}
                          placeholder="Choose your username..."
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base text-gray-900"
                          showSuggestions={true}
                        />
                      </div>
                      <button
                        onClick={handleSaveProfile}
                        disabled={!usernameValid}
                        className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium text-sm sm:text-base"
                      >
                        Update Username
                      </button>
                    </div>
                  </div>

                  {/* Account Information */}
                  <div className="bg-gray-50 rounded-2xl p-4 sm:p-6 border border-gray-100">
                    <h4 className="font-semibold text-gray-900 mb-4 text-sm sm:text-base">Account Information</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">Username</span>
                        <span className="font-medium text-sm">@{profile?.username}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">Email</span>
                        <span className="font-medium text-sm truncate ml-2">{profile?.email}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">Account Status</span>
                        <span className={`px-3 py-1 rounded-xl text-xs font-medium ${
                          profile?.is_premium 
                            ? 'bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 border border-amber-300' 
                            : 'bg-gray-100 text-gray-800 border border-gray-200'
                        }`}>
                          {profile?.is_premium ? 'Premium' : 'Free'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Privacy Settings */}
                  <div className="bg-gray-50 rounded-2xl p-4 sm:p-6 border border-gray-100">
                    <h4 className="font-semibold text-gray-900 mb-4 text-sm sm:text-base">Privacy Settings</h4>
                    <div className="space-y-4">
                      {[
                        { key: 'profile_public', label: 'Show profile to other users' },
                        { key: 'email_notifications', label: 'Allow email notifications' },
                        { key: 'activity_public', label: 'Show activity publicly' }
                      ].map((setting) => (
                        <label key={setting.key} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer">
                          <span className="text-gray-700 font-medium text-sm sm:text-base flex-1 mr-3">{setting.label}</span>
                          <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0" defaultChecked />
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Upgrade Section (if not premium) */}
                  {!profile?.is_premium && (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 sm:p-6 border border-amber-200">
                      <div className="flex items-center space-x-3 mb-4">
                        <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 flex-shrink-0" />
                        <h4 className="font-semibold text-amber-900 text-sm sm:text-base">Upgrade to Premium</h4>
                      </div>
                      <p className="text-amber-800 mb-4 text-sm sm:text-base">Unlock exclusive features and get priority support.</p>
                      <button className="w-full sm:w-auto px-4 sm:px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-colors font-medium text-sm sm:text-base">
                        Upgrade Now
                      </button>
                    </div>
                  )}

                  {/* Danger Zone */}
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4 sm:p-6">
                    <h4 className="font-semibold text-red-900 mb-4 text-sm sm:text-base">Danger Zone</h4>
                    <div className="space-y-2">
                      <button className="w-full text-left px-4 py-3 text-red-700 hover:bg-red-100 rounded-xl transition-colors font-medium text-sm sm:text-base">
                        Change Password
                      </button>
                      <button className="w-full text-left px-4 py-3 text-red-700 hover:bg-red-100 rounded-xl transition-colors font-medium text-sm sm:text-base">
                        Download My Data
                      </button>
                      <button className="w-full text-left px-4 py-3 text-red-700 hover:bg-red-100 rounded-xl transition-colors font-medium text-sm sm:text-base">
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom CSS for line clamp */}
      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      {/* Profile Picture Upload Modal */}
      {showPictureUpload && (
        <ProfilePictureUpload
          currentAvatar={profile?.avatar_url}
          onUpload={handleProfilePictureUpload}
          onCancel={() => setShowPictureUpload(false)}
          isUploading={uploadingPicture}
        />
      )}
    </div>
  );
};

export default Profile;