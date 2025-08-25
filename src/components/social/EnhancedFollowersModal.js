// src/components/social/EnhancedFollowersModal.js - Enhanced Modal to show followers/following lists
import React, { useState, useEffect } from 'react';
import { X, Search, Users, UserPlus, Check } from 'lucide-react';
import { getAvatarUrl, getUserDisplayName } from '../../utils/avatarUtils';
import axios from '../../config/axios';
import FollowButton from './FollowButton';

const EnhancedFollowersModal = ({ 
  isOpen, 
  onClose, 
  userId, 
  initialTab = 'followers', // 'followers' or 'following'
  currentUser 
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);

  useEffect(() => {
    if (isOpen && userId) {
      fetchData();
    }
  }, [isOpen, userId]);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, activeTab, followers, following]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch both followers and following data for the specified user
      const [followersRes, followingRes] = await Promise.all([
        axios.get(`/api/social/follows/followers/?user=${userId}`),
        axios.get(`/api/social/follows/following/?user=${userId}`)
      ]);

      // Process followers data - people who follow the current user
      const followersData = (followersRes.data.results || followersRes.data || []).map(follow => ({
        id: follow.follower,
        username: follow.follower_username,
        display_name: follow.follower_display_name,
        avatar: follow.follower_avatar,
        relationData: follow,
        type: 'follower'
      }));

      // Process following data - people the current user follows
      const followingData = (followingRes.data.results || followingRes.data || []).map(follow => ({
        id: follow.following,
        username: follow.following_username,
        display_name: follow.following_display_name,
        avatar: follow.following_avatar,
        relationData: follow,
        type: 'following'
      }));

      setFollowers(followersData);
      setFollowing(followingData);
    } catch (error) {
      console.error('Error fetching follow data:', error);
      setFollowers([]);
      setFollowing([]);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    const users = activeTab === 'followers' ? followers : following;
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(user => {
      return user.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
             user.username?.toLowerCase().includes(searchQuery.toLowerCase());
    });
    
    setFilteredUsers(filtered);
  };

  const handleFollowChange = (action, user) => {
    // Refresh data after follow/unfollow
    fetchData();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Connections</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full p-2 transition-all duration-200 -mr-2"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('followers')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'followers'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Followers</span>
              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                {followers.length}
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'following'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <UserPlus className="w-4 h-4" />
              <span>Following</span>
              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                {following.length}
              </span>
            </div>
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="w-12 h-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery 
                  ? 'No users found'
                  : `No ${activeTab === 'followers' ? 'followers' : 'following'} yet`
                }
              </h3>
              <p className="text-gray-500 text-sm">
                {searchQuery
                  ? 'Try adjusting your search terms'
                  : activeTab === 'followers'
                    ? 'When people follow you, they\'ll appear here'
                    : 'When you follow others, they\'ll appear here'
                }
              </p>
            </div>
          ) : (
            <div className="p-4">
              <div className="space-y-3">
                {filteredUsers.map((user) => (
                  <UserCard
                    key={`${activeTab}-${user.id}`}
                    user={user}
                    currentUser={currentUser}
                    onFollowChange={handleFollowChange}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Individual User Card Component
const UserCard = ({ user, currentUser, onFollowChange }) => {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center space-x-3 flex-1">
        <img
          src={getAvatarUrl(user, 128)}
          alt={user.display_name || user.username}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 truncate">
            {user.display_name || user.username}
          </h4>
          <p className="text-sm text-gray-500 truncate">
            @{user.username}
          </p>
          {user.relationData?.is_mutual && (
            <div className="flex items-center space-x-1 mt-1">
              <Check className="w-3 h-3 text-green-500" />
              <span className="text-xs text-green-600 font-medium">
                Mutual follow
              </span>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex-shrink-0">
        <FollowButton
          targetUser={user}
          currentUser={currentUser}
          size="small"
          variant="outline"
          onFollowChange={onFollowChange}
        />
      </div>
    </div>
  );
};

export default EnhancedFollowersModal;