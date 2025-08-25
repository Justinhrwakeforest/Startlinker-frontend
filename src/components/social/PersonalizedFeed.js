// src/components/social/PersonalizedFeed.js - Personalized feed from followed users
import React, { useState, useEffect } from 'react';
import { 
  Heart, MessageCircle, Share2, Bookmark, Clock, Users, 
  TrendingUp, Sparkles, Award, Folder, Filter,
  RefreshCw, ChevronDown, Eye
} from 'lucide-react';
import axios from 'axios';
import StoriesBar from './StoriesBar';

const PersonalizedFeed = ({ currentUser }) => {
  const [feedData, setFeedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, posts, stories, collections, achievements
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await axios.get('/api/social/feed/personalized/');
      setFeedData(response.data);
    } catch (error) {
      console.error('Error fetching personalized feed:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchFeed(true);
  };

  const filterItems = [
    { value: 'all', label: 'All Updates', icon: Sparkles },
    { value: 'posts', label: 'Posts', icon: MessageCircle },
    { value: 'stories', label: 'Stories', icon: Eye },
    { value: 'collections', label: 'Folders', icon: Folder },
    { value: 'achievements', label: 'Achievements', icon: Award }
  ];

  const getFilteredContent = () => {
    if (!feedData) return [];
    
    let content = [];
    
    if (filter === 'all' || filter === 'posts') {
      content.push(...(feedData.posts || []).map(post => ({
        ...post,
        type: 'post',
        timestamp: post.created_at,
        author: post.author_username
      })));
    }
    
    if (filter === 'all' || filter === 'collections') {
      content.push(...(feedData.collections || []).map(collection => ({
        ...collection,
        type: 'collection',
        timestamp: collection.updated_at,
        author: collection.owner_username
      })));
    }
    
    if (filter === 'all' || filter === 'achievements') {
      content.push(...(feedData.achievements || []).map(achievement => ({
        ...achievement,
        type: 'achievement',
        timestamp: achievement.earned_at,
        author: achievement.user_username
      })));
    }
    
    // Sort by timestamp
    return content.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <StoriesBarSkeleton />
        <FeedSkeleton />
      </div>
    );
  }

  const filteredContent = getFilteredContent();

  return (
    <div className="space-y-6">
      {/* Stories Bar */}
      {(filter === 'all' || filter === 'stories') && feedData?.stories && (
        <StoriesBar currentUser={currentUser} />
      )}

      {/* Feed Header */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Your Personalized Feed</h2>
              <p className="text-gray-600 text-sm">Updates from people you follow</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-800"
              >
                <Filter className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-800">
                  {filterItems.find(item => item.value === filter)?.label}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-600" />
              </button>
              
              {showFilterMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                  {filterItems.map(item => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.value}
                        onClick={() => {
                          setFilter(item.value);
                          setShowFilterMenu(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
                          filter === item.value ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Feed Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {feedData?.posts?.length || 0}
            </div>
            <div className="text-sm text-blue-700">New Posts</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {feedData?.stories?.length || 0}
            </div>
            <div className="text-sm text-purple-700">Active Stories</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {feedData?.collections?.length || 0}
            </div>
            <div className="text-sm text-green-700">New Folders</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {feedData?.achievements?.length || 0}
            </div>
            <div className="text-sm text-orange-700">Achievements</div>
          </div>
        </div>
      </div>

      {/* Feed Content */}
      <div className="space-y-6">
        {filteredContent.length === 0 ? (
          <EmptyFeedState filter={filter} />
        ) : (
          filteredContent.map((item, index) => (
            <FeedItem key={`${item.type}-${item.id}-${index}`} item={item} currentUser={currentUser} />
          ))
        )}
      </div>
    </div>
  );
};

// Feed Item Component
const FeedItem = ({ item, currentUser }) => {
  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInMinutes = Math.floor((now - past) / 60000);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  switch (item.type) {
    case 'post':
      return <PostFeedItem item={item} currentUser={currentUser} />;
    case 'collection':
      return <FolderFeedItem item={item} currentUser={currentUser} />;
    case 'achievement':
      return <AchievementFeedItem item={item} currentUser={currentUser} />;
    default:
      return null;
  }
};

// Post Feed Item
const PostFeedItem = ({ item, currentUser }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="p-6">
        {/* Author Header */}
        <div className="flex items-center space-x-3 mb-4">
          <img
            src={item.author_avatar}
            alt={item.author_display_name}
            className="w-10 h-10 rounded-full"
          />
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900">{item.author_display_name}</h3>
              <span className="text-gray-500">•</span>
              <span className="text-sm text-gray-500">{new Date(item.created_at).toLocaleDateString()}</span>
            </div>
            <p className="text-sm text-gray-600">@{item.author_username}</p>
          </div>
          <div className="flex items-center space-x-1 text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
            <MessageCircle className="w-3 h-3" />
            <span>Post</span>
          </div>
        </div>

        {/* Post Content */}
        <div className="mb-4">
          {item.title && (
            <h2 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h2>
          )}
          <p className="text-gray-700 leading-relaxed">{item.content}</p>
        </div>

        {/* Post Engagement */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-6">
            <button className="flex items-center space-x-2 text-gray-500 hover:text-red-500 transition-colors">
              <Heart className="w-5 h-5" />
              <span className="text-sm">{item.like_count || 0}</span>
            </button>
            <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors">
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm">{item.comment_count || 0}</span>
            </button>
            <button className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors">
              <Share2 className="w-5 h-5" />
              <span className="text-sm">{item.share_count || 0}</span>
            </button>
          </div>
          <button className="text-gray-500 hover:text-yellow-500 transition-colors">
            <Bookmark className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Folder Feed Item
const FolderFeedItem = ({ item, currentUser }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="p-6">
        {/* Author Header */}
        <div className="flex items-center space-x-3 mb-4">
          <img
            src={item.owner_avatar}
            alt={item.owner_display_name}
            className="w-10 h-10 rounded-full"
          />
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900">{item.owner_display_name}</h3>
              <span className="text-gray-500">•</span>
              <span className="text-sm text-gray-500">Updated collection</span>
            </div>
            <p className="text-sm text-gray-600">@{item.owner_username}</p>
          </div>
          <div className="flex items-center space-x-1 text-sm text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
            <Folder className="w-3 h-3" />
            <span>Folder</span>
          </div>
        </div>

        {/* Folder Content */}
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-900 mb-2">{item.name}</h2>
          {item.description && (
            <p className="text-gray-700 mb-3">{item.description}</p>
          )}
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>{item.startup_count} startups</span>
            <span>•</span>
            <span>{item.follower_count} followers</span>
            <span>•</span>
            <span>{item.view_count} views</span>
          </div>
        </div>

        {/* Folder Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <button className="flex items-center space-x-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors">
            <Folder className="w-4 h-4" />
            <span className="text-sm font-medium">View Folder</span>
          </button>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {new Date(item.updated_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Achievement Feed Item
const AchievementFeedItem = ({ item, currentUser }) => {
  return (
    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl shadow-lg border border-orange-200 overflow-hidden">
      <div className="p-6">
        {/* Achievement Header */}
        <div className="flex items-center space-x-3 mb-4">
          <img
            src={item.user_avatar}
            alt={item.user_username}
            className="w-10 h-10 rounded-full"
          />
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900">{item.user_username}</h3>
              <span className="text-gray-500">•</span>
              <span className="text-sm text-gray-600">Earned an achievement</span>
            </div>
            <p className="text-sm text-gray-600">
              {new Date(item.earned_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center space-x-1 text-sm text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
            <Award className="w-3 h-3" />
            <span>Achievement</span>
          </div>
        </div>

        {/* Achievement Content */}
        <div className="bg-white rounded-xl p-4 mb-4">
          <div className="flex items-center space-x-4">
            <div className="text-4xl">{item.achievement_icon}</div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900">{item.achievement_name}</h2>
              <p className="text-gray-600 text-sm mb-2">{item.achievement_description}</p>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  item.achievement_rarity === 'legendary' ? 'bg-yellow-100 text-yellow-800' :
                  item.achievement_rarity === 'epic' ? 'bg-purple-100 text-purple-800' :
                  item.achievement_rarity === 'rare' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {item.achievement_rarity}
                </span>
                <span className="text-sm text-gray-600">
                  {item.achievement_points} points
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Celebration Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-orange-200">
          <button className="flex items-center space-x-2 text-orange-600 hover:text-orange-700 transition-colors">
            <Heart className="w-5 h-5" />
            <span className="text-sm font-medium">Congratulate</span>
          </button>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Award className="w-4 h-4" />
            <span>Achievement unlocked</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Empty Feed State
const EmptyFeedState = ({ filter }) => {
  const getEmptyMessage = () => {
    switch (filter) {
      case 'posts':
        return {
          title: 'No new posts',
          description: 'The people you follow haven\'t posted recently. Follow more users to see their updates here.',
          icon: MessageCircle
        };
      case 'stories':
        return {
          title: 'No active stories',
          description: 'None of your followed users have active stories right now.',
          icon: Eye
        };
      case 'collections':
        return {
          title: 'No new collections',
          description: 'The people you follow haven\'t created or updated collections recently.',
          icon: Folder
        };
      case 'achievements':
        return {
          title: 'No recent achievements',
          description: 'The people you follow haven\'t earned any achievements recently.',
          icon: Award
        };
      default:
        return {
          title: 'Your feed is empty',
          description: 'Follow more users to see their posts, stories, collections, and achievements here.',
          icon: Users
        };
    }
  };

  const { title, description, icon: Icon } = getEmptyMessage();

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
      <Icon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      <button className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
        Discover People to Follow
      </button>
    </div>
  );
};

// Loading Skeletons
const StoriesBarSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
    <div className="flex items-center space-x-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex flex-col items-center space-y-2">
          <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="w-12 h-3 bg-gray-200 rounded animate-pulse"></div>
        </div>
      ))}
    </div>
  </div>
);

const FeedSkeleton = () => (
  <div className="space-y-6">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
            <div className="h-3 bg-gray-200 rounded animate-pulse w-1/4"></div>
          </div>
        </div>
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
        </div>
        <div className="flex items-center space-x-6">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
          <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
          <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
        </div>
      </div>
    ))}
  </div>
);

export default PersonalizedFeed;