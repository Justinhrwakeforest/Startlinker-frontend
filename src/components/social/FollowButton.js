// src/components/social/FollowButton.js - Follow/Unfollow button component
import React, { useState, useEffect } from 'react';
import { UserPlus, UserMinus, Users, Bell, BellOff } from 'lucide-react';
import axios from '../../config/axios';

const FollowButton = ({ 
  targetUser, 
  currentUser, 
  size = 'medium',
  variant = 'primary',
  showNotificationSettings = false,
  onFollowChange 
}) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [followData, setFollowData] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (targetUser && currentUser && targetUser.id !== currentUser.id) {
      checkFollowStatus();
    }
  }, [targetUser, currentUser]);

  const checkFollowStatus = async () => {
    try {
      const response = await axios.get('/api/social/follows/following/');
      const following = response.data.results || response.data;
      const followRelation = following.find(f => f.following === targetUser.id);
      
      if (followRelation) {
        setIsFollowing(true);
        setFollowData(followRelation);
      } else {
        setIsFollowing(false);
        setFollowData(null);
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleFollow = async () => {
    if (!targetUser || !currentUser || targetUser.id === currentUser.id) return;
    
    setIsLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        await axios.post('/api/social/follows/unfollow_user/', {
          user: String(targetUser.id)
        });
        setIsFollowing(false);
        setFollowData(null);
        onFollowChange?.('unfollow', targetUser);
      } else {
        // Follow
        const response = await axios.post('/api/social/follows/follow_user/', {
          user: String(targetUser.id),
          notify_on_posts: true,
          notify_on_stories: true,
          notify_on_achievements: false
        });
        setIsFollowing(true);
        setFollowData(response.data);
        onFollowChange?.('follow', targetUser);
      }
      
      // Trigger a global refresh of follow state
      window.dispatchEvent(new CustomEvent('followStateChanged', {
        detail: {
          userId: targetUser.id,
          isFollowing: !isFollowing,
          action: isFollowing ? 'unfollow' : 'follow'
        }
      }));

      // Also emit follower count change event for the target user
      window.dispatchEvent(new CustomEvent('followerCountChanged', {
        detail: {
          userId: targetUser.id,
          action: isFollowing ? 'lost_follower' : 'gained_follower'
        }
      }));
    } catch (error) {
      console.error('Error updating follow status:', error);
      console.error('Error details:', error.response?.data);
      alert('Failed to update follow status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateNotificationSettings = async (settings) => {
    if (!followData) return;
    
    try {
      const response = await axios.patch(`/api/social/follows/${followData.id}/`, settings);
      setFollowData(response.data);
      setShowSettings(false);
    } catch (error) {
      console.error('Error updating notification settings:', error);
      alert('Failed to update notification settings.');
    }
  };

  // Don't show button for same user
  if (!targetUser || !currentUser || targetUser.id === currentUser.id) {
    return null;
  }

  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-sm',
    large: 'px-6 py-3 text-base'
  };

  const variantClasses = {
    primary: isFollowing 
      ? 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
      : 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
    outline: isFollowing
      ? 'bg-transparent text-gray-700 border border-gray-300 hover:bg-gray-50'
      : 'bg-transparent text-blue-600 border border-blue-600 hover:bg-blue-50'
  };

  const iconSize = size === 'small' ? 'w-4 h-4' : size === 'large' ? 'w-6 h-6' : 'w-5 h-5';

  return (
    <div className="relative">
      <div className="flex items-center space-x-2">
        <button
          onClick={handleFollow}
          disabled={isLoading}
          className={`
            ${sizeClasses[size]} ${variantClasses[variant]}
            font-medium rounded-lg transition-all duration-200 
            disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center space-x-2 group
          `}
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
          ) : (
            <>
              {isFollowing ? (
                <>
                  <UserMinus className={`${iconSize} group-hover:text-red-500 transition-colors`} />
                  <span className="group-hover:hidden">Following</span>
                  <span className="hidden group-hover:inline text-red-500">Unfollow</span>
                </>
              ) : (
                <>
                  <UserPlus className={iconSize} />
                  <span>Follow</span>
                </>
              )}
            </>
          )}
        </button>

        {/* Notification Settings Button */}
        {isFollowing && showNotificationSettings && (
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Notification settings"
          >
            <Bell className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Notification Settings Dropdown */}
      {showSettings && followData && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-10">
          <h4 className="font-medium text-gray-900 mb-3">Notification Settings</h4>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Posts</span>
              <input
                type="checkbox"
                checked={followData.notify_on_posts}
                onChange={(e) => updateNotificationSettings({ notify_on_posts: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Stories</span>
              <input
                type="checkbox"
                checked={followData.notify_on_stories}
                onChange={(e) => updateNotificationSettings({ notify_on_stories: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Achievements</span>
              <input
                type="checkbox"
                checked={followData.notify_on_achievements}
                onChange={(e) => updateNotificationSettings({ notify_on_achievements: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </label>
          </div>
          <button
            onClick={() => setShowSettings(false)}
            className="mt-3 w-full px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
};

export default FollowButton;