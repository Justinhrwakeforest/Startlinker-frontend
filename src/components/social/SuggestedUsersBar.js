// src/components/social/SuggestedUsersBar.js - Horizontal scrollable suggested users component
import React, { useState, useEffect, useRef } from 'react';
import { getAvatarUrl, getUserDisplayName } from '../../utils/avatarUtils';
import { Users, ChevronLeft, ChevronRight, UserPlus, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../../config/axios';

const SuggestedUsersBar = ({ currentUser, onUserFollow }) => {
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingStates, setFollowingStates] = useState({});
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSuggestedUsers();
    
    // Listen for follow state changes
    const handleFollowStateChange = (event) => {
      const { userId, isFollowing, action } = event.detail;
      
      if (action === 'follow') {
        // Remove the followed user from suggestions
        setSuggestedUsers(prev => prev.filter(u => u.id !== userId));
        // Refresh suggestions after a delay
        setTimeout(() => {
          fetchSuggestedUsers();
        }, 1000);
      } else if (action === 'unfollow') {
        // Refresh suggestions to potentially show the unfollowed user again
        setTimeout(() => {
          fetchSuggestedUsers();
        }, 1000);
      }
    };
    
    window.addEventListener('followStateChanged', handleFollowStateChange);
    
    return () => {
      window.removeEventListener('followStateChanged', handleFollowStateChange);
    };
  }, []);

  const fetchSuggestedUsers = async () => {
    try {
      setLoading(true);
      
      if (!currentUser?.id) {
        console.log('No user ID available for suggested users');
        return;
      }

      // Fetch suggested users
      const [suggestedResponse, followingResponse] = await Promise.all([
        axios.get('/api/social/social-stats/suggested_users/').catch((error) => {
          console.error('Error fetching suggested users:', error);
          return { data: { suggested_users: [] } };
        }),
        axios.get('/api/social/follows/following/').catch(() => ({ data: { results: [] } }))
      ]);

      // Get list of users we're already following
      const followingUsers = followingResponse.data.results || followingResponse.data || [];
      const followingIds = followingUsers.map(f => f.following || f.id);

      // Filter suggested users
      let users = suggestedResponse.data.suggested_users || [];
      users = users.filter(suggestedUser => {
        // Validate user
        if (!suggestedUser || !suggestedUser.id || !suggestedUser.username) {
          return false;
        }
        // Filter out already followed users and current user
        if (followingIds.includes(suggestedUser.id) || suggestedUser.id === currentUser.id) {
          return false;
        }
        // Only include active users
        if (suggestedUser.is_active === false) {
          return false;
        }
        return true;
      });

      // Limit to top 20 for horizontal scroll
      users = users.slice(0, 20);
      
      console.log(`Found ${users.length} suggested users for horizontal bar`);
      setSuggestedUsers(users);
      
    } catch (error) {
      console.error('Error fetching suggested users:', error);
      setSuggestedUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (user) => {
    try {
      setFollowingStates(prev => ({ ...prev, [user.id]: 'loading' }));
      
      // Send follow request
      await axios.post('/api/social/follows/follow/', {
        following: user.id
      });
      
      setFollowingStates(prev => ({ ...prev, [user.id]: 'followed' }));
      
      // Dispatch follow event
      window.dispatchEvent(new CustomEvent('followStateChanged', {
        detail: { userId: user.id, isFollowing: true, action: 'follow' }
      }));
      
      // Remove from suggestions after animation
      setTimeout(() => {
        setSuggestedUsers(prev => prev.filter(u => u.id !== user.id));
      }, 500);
      
      // Call parent callback if provided
      if (onUserFollow) {
        onUserFollow(user);
      }
      
    } catch (error) {
      console.error('Error following user:', error);
      setFollowingStates(prev => ({ ...prev, [user.id]: 'error' }));
      
      // Reset error state after 2 seconds
      setTimeout(() => {
        setFollowingStates(prev => ({ ...prev, [user.id]: null }));
      }, 2000);
    }
  };

  const handleUserClick = (username) => {
    if (username) {
      navigate(`/profile/${username}`);
    }
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center">
            <Users className="w-5 h-5 text-blue-500 mr-2" />
            Suggested for You
          </h3>
        </div>
        <div className="flex items-center space-x-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex flex-col items-center space-y-2">
              <div className="w-20 h-20 bg-gray-200 rounded-2xl animate-pulse"></div>
              <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-14 h-6 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (suggestedUsers.length === 0) {
    return null; // Don't show the bar if no suggestions
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center">
          <Users className="w-5 h-5 text-blue-500 mr-2" />
          Suggested for You
        </h3>
        <span className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded-full">
          {suggestedUsers.length} people
        </span>
      </div>
      
      <div className="relative">
        {/* Scroll buttons */}
        {suggestedUsers.length > 5 && (
          <>
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-200"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-200"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </>
        )}
        
        {/* Suggested users container */}
        <div
          ref={scrollRef}
          className="flex items-center space-x-4 overflow-x-auto scrollbar-hide pb-2 px-8"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {suggestedUsers.map((user) => (
            <div
              key={user.id}
              className="flex flex-col items-center space-y-3 flex-shrink-0 group"
            >
              {/* User Avatar */}
              <div 
                className="relative cursor-pointer"
                onClick={() => handleUserClick(user.username)}
              >
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-gray-200 group-hover:border-blue-400 transition-all duration-200 group-hover:scale-105">
                  <img
                    src={getAvatarUrl(user, 80)}
                    alt={getUserDisplayName(user)}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = getAvatarUrl(user, 80);
                    }}
                  />
                </div>
                {/* Online indicator (if user is active recently) */}
                {user.is_online && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>
              
              {/* User Name */}
              <div 
                className="text-center cursor-pointer"
                onClick={() => handleUserClick(user.username)}
              >
                <p className="text-sm font-semibold text-gray-900 truncate max-w-20 group-hover:text-blue-600 transition-colors">
                  {user.first_name || user.username}
                </p>
                <p className="text-xs text-gray-500 truncate max-w-20">
                  @{user.username}
                </p>
              </div>
              
              {/* Follow Button */}
              <button
                onClick={() => handleFollow(user)}
                disabled={followingStates[user.id] === 'loading' || followingStates[user.id] === 'followed'}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center space-x-1 ${
                  followingStates[user.id] === 'followed'
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : followingStates[user.id] === 'error'
                    ? 'bg-red-100 text-red-700 border border-red-300'
                    : followingStates[user.id] === 'loading'
                    ? 'bg-gray-100 text-gray-500 border border-gray-300'
                    : 'bg-blue-600 text-white hover:bg-blue-700 border border-blue-600'
                }`}
              >
                {followingStates[user.id] === 'followed' ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>Following</span>
                  </>
                ) : followingStates[user.id] === 'error' ? (
                  <span>Error</span>
                ) : followingStates[user.id] === 'loading' ? (
                  <span>Loading...</span>
                ) : (
                  <>
                    <UserPlus className="w-3 h-3" />
                    <span>Follow</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SuggestedUsersBar;