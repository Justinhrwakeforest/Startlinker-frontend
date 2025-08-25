// src/components/social/PostScheduler.js - Post scheduling component
import React, { useState, useEffect } from 'react';
import { 
  Clock, Calendar, Send, Save, Trash2, Edit, 
  Play, Pause, Eye, EyeOff, ChevronDown, 
  Plus, Filter, Search, Grid, List, X
} from 'lucide-react';
import axios from 'axios';
import { PostCreationWithMentions } from './UserMentions';
import '../../styles/datetime-input-fix.css';

const PostScheduler = ({ currentUser }) => {
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [filter, setFilter] = useState('all'); // all, scheduled, published, cancelled
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list');

  useEffect(() => {
    fetchScheduledPosts();
    
    // Set up polling for status updates
    const interval = setInterval(fetchScheduledPosts, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const fetchScheduledPosts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/social/scheduled-posts/');
      setScheduledPosts(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching scheduled posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredPosts = () => {
    let filtered = scheduledPosts;

    if (filter !== 'all') {
      filtered = filtered.filter(post => post.status === filter);
    }

    if (searchQuery) {
      filtered = filtered.filter(post =>
        post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered.sort((a, b) => new Date(a.scheduled_for) - new Date(b.scheduled_for));
  };

  const handlePostAction = async (action, postId, data = {}) => {
    try {
      console.log(`Attempting to ${action} post ${postId}`);
      
      switch (action) {
        case 'publish':
          console.log('Making publish_now API call...');
          const response = await axios.post(`/api/social/scheduled-posts/${postId}/publish_now/`);
          console.log('Publish response:', response.data);
          alert('Post published successfully!');
          break;
        case 'delete':
          await axios.delete(`/api/social/scheduled-posts/${postId}/`);
          alert('Post deleted successfully!');
          break;
        case 'pause':
          await axios.patch(`/api/social/scheduled-posts/${postId}/`, { status: 'cancelled' });
          alert('Post cancelled successfully!');
          break;
        case 'resume':
          await axios.patch(`/api/social/scheduled-posts/${postId}/`, { status: 'scheduled' });
          alert('Post resumed successfully!');
          break;
        case 'update':
          await axios.patch(`/api/social/scheduled-posts/${postId}/`, data);
          alert('Post updated successfully!');
          break;
        default:
          break;
      }
      
      // Refresh the list
      await fetchScheduledPosts();
      
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = `Failed to ${action} post.`;
      if (error.response?.data?.error) {
        errorMessage += ` Error: ${error.response.data.error}`;
      } else if (error.message) {
        errorMessage += ` Error: ${error.message}`;
      }
      
      alert(errorMessage);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled': return Clock;
      case 'published': return Send;
      case 'cancelled': return Pause;
      default: return Clock;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'text-blue-600 bg-blue-50';
      case 'published': return 'text-green-600 bg-green-50';
      case 'cancelled': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-4 sm:mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Post Scheduler</h2>
              <p className="text-gray-600 text-xs sm:text-sm">Schedule posts for optimal timing</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Post</span>
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          {/* Search */}
          <div className="relative flex-1 max-w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search scheduled posts..."
              className="w-full pl-10 pr-4 py-2 text-gray-900 placeholder-gray-500 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
            />
          </div>

          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
            {/* Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer text-sm sm:text-base w-full sm:w-auto"
            >
              <option value="all" className="text-gray-900">All Posts</option>
              <option value="scheduled" className="text-gray-900">Scheduled</option>
              <option value="published" className="text-gray-900">Published</option>
              <option value="cancelled" className="text-gray-900">Cancelled</option>
            </select>

            {/* View Mode */}
            <div className="flex items-center justify-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-all ${
                  viewMode === 'list' 
                    ? 'bg-white shadow-sm text-gray-900' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-white shadow-sm text-gray-900' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6">
          <div className="bg-blue-50 rounded-lg p-3 sm:p-4 text-center">
            <div className="text-lg sm:text-2xl font-bold text-blue-600">
              {scheduledPosts.filter(p => p.status === 'scheduled').length}
            </div>
            <div className="text-xs sm:text-sm text-blue-700">Scheduled</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 sm:p-4 text-center">
            <div className="text-lg sm:text-2xl font-bold text-green-600">
              {scheduledPosts.filter(p => p.status === 'published').length}
            </div>
            <div className="text-xs sm:text-sm text-green-700">Published</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4 text-center">
            <div className="text-lg sm:text-2xl font-bold text-gray-600">
              {scheduledPosts.filter(p => p.status === 'cancelled').length}
            </div>
            <div className="text-xs sm:text-sm text-gray-700">Cancelled</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 sm:p-4 text-center">
            <div className="text-lg sm:text-2xl font-bold text-purple-600">
              {scheduledPosts.length}
            </div>
            <div className="text-xs sm:text-sm text-purple-700">Total</div>
          </div>
        </div>
      </div>

      {/* Scheduled Posts */}
      <div className="space-y-4">
        {loading ? (
          <ScheduledPostsSkeleton viewMode={viewMode} />
        ) : getFilteredPosts().length === 0 ? (
          <EmptyScheduledPosts 
            filter={filter}
            hasSearch={!!searchQuery}
            onCreateClick={() => setShowCreateModal(true)}
          />
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6' : 'space-y-4'}>
            {getFilteredPosts().map(post => (
              <ScheduledPostCard
                key={post.id}
                post={post}
                viewMode={viewMode}
                onAction={handlePostAction}
                onEdit={(post) => setSelectedPost(post)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || selectedPost) && (
        <SchedulePostModal
          post={selectedPost}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedPost(null);
          }}
          onSaved={fetchScheduledPosts}
        />
      )}
    </div>
  );
};

// Scheduled Post Card Component
const ScheduledPostCard = ({ post, viewMode, onAction, onEdit }) => {
  const [showMenu, setShowMenu] = useState(false);
  const StatusIcon = getStatusIcon(post.status);
  
  const getTimeUntilPost = () => {
    const now = new Date();
    const scheduledTime = new Date(post.scheduled_for);
    const diff = scheduledTime - now;
    
    if (diff < 0) return 'Overdue';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  if (viewMode === 'grid') {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6">
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className={`flex items-center space-x-2 px-2 py-1 rounded-full text-xs sm:text-sm ${getStatusColor(post.status)}`}>
            <StatusIcon className="w-3 h-3" />
            <span className="capitalize">{post.status}</span>
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            {showMenu && (
              <PostMenu 
                post={post} 
                onAction={onAction} 
                onEdit={onEdit}
                onClose={() => setShowMenu(false)}
              />
            )}
          </div>
        </div>

        <div className="mb-3 sm:mb-4">
          {post.title && (
            <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-2 line-clamp-2">{post.title}</h3>
          )}
          <p className="text-gray-700 text-xs sm:text-sm line-clamp-3">{post.content}</p>
        </div>

        <div className="space-y-2 text-xs sm:text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="truncate">{new Date(post.scheduled_for).toLocaleString()}</span>
          </div>
          {post.status === 'scheduled' && (
            <div className="flex items-center space-x-2">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span>in {getTimeUntilPost()}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6">
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0 mb-4">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <div className={`p-2 rounded-lg ${getStatusColor(post.status)}`}>
            <StatusIcon className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            {post.title && (
              <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1 line-clamp-2">{post.title}</h3>
            )}
            <p className="text-gray-600 text-xs sm:text-sm truncate">
              {new Date(post.scheduled_for).toLocaleString()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-between sm:justify-end space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(post.status)}`}>
            {post.status}
          </span>
          
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            {showMenu && (
              <PostMenu 
                post={post} 
                onAction={onAction} 
                onEdit={onEdit}
                onClose={() => setShowMenu(false)}
              />
            )}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-gray-700 text-sm line-clamp-3">{post.content}</p>
      </div>

      <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="text-xs sm:text-sm text-gray-600">
          {post.status === 'scheduled' && (
            <span>Posts in {getTimeUntilPost()}</span>
          )}
          {post.status === 'published' && post.published_at && (
            <span>Published {new Date(post.published_at).toLocaleDateString()}</span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {post.status === 'scheduled' && (
            <button
              onClick={() => onAction('publish', post.id)}
              className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm w-full sm:w-auto"
            >
              Publish Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Post Menu Component
const PostMenu = ({ post, onAction, onEdit, onClose }) => {
  return (
    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
      <button
        onClick={() => {
          onEdit(post);
          onClose();
        }}
        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
      >
        <Edit className="w-4 h-4" />
        <span>Edit</span>
      </button>
      
      {post.status === 'scheduled' && (
        <>
          <button
            onClick={() => {
              onAction('publish', post.id);
              onClose();
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>Publish Now</span>
          </button>
          <button
            onClick={() => {
              onAction('pause', post.id);
              onClose();
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
          >
            <Pause className="w-4 h-4" />
            <span>Save as Draft</span>
          </button>
        </>
      )}
      
      {post.status === 'cancelled' && (
        <button
          onClick={() => {
            onAction('resume', post.id);
            onClose();
          }}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
        >
          <Play className="w-4 h-4" />
          <span>Resume Scheduling</span>
        </button>
      )}
      
      <button
        onClick={() => {
          if (window.confirm('Are you sure you want to delete this scheduled post?')) {
            onAction('delete', post.id);
          }
          onClose();
        }}
        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
      >
        <Trash2 className="w-4 h-4" />
        <span>Delete</span>
      </button>
    </div>
  );
};

// Schedule Post Modal
const SchedulePostModal = ({ post, onClose, onSaved }) => {
  const [formData, setFormData] = useState({
    title: post?.title || '',
    content: post?.content || '',
    scheduled_for: post?.scheduled_for ? new Date(post.scheduled_for).toISOString().slice(0, 16) : '',
    status: post?.status || 'scheduled'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      const postData = {
        ...data,
        scheduled_for: formData.scheduled_for,
        status: formData.status
      };

      if (post) {
        await axios.patch(`/api/social/scheduled-posts/${post.id}/`, postData);
      } else {
        await axios.post('/api/social/scheduled-posts/', postData);
      }

      onSaved();
      onClose();
    } catch (error) {
      console.error('Error saving scheduled post:', error);
      alert('Failed to save scheduled post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5); // Minimum 5 minutes from now
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {post ? 'Edit Scheduled Post' : 'Schedule New Post'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Post Creation Component */}
            <PostCreationWithMentions
              onSubmit={handleSubmit}
              placeholder="What would you like to share?"
            />

            {/* Scheduling Options */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Scheduling Options</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schedule Time
                  </label>
                  <div className="relative">
                    <input
                      type="datetime-local"
                      value={formData.scheduled_for}
                      onChange={(e) => setFormData({ ...formData, scheduled_for: e.target.value })}
                      min={getMinDateTime()}
                      className="datetime-input-custom w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      style={{
                        colorScheme: 'light',
                        WebkitAppearance: 'none',
                        color: '#111827 !important',
                        backgroundColor: '#ffffff !important',
                        fontSize: '14px',
                        fontFamily: 'inherit'
                      }}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
                  >
                    <option value="scheduled" className="text-gray-900">Schedule for Publishing</option>
                    <option value="cancelled" className="text-gray-900">Save as Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Empty State Component
const EmptyScheduledPosts = ({ filter, hasSearch, onCreateClick }) => (
  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
    <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
    <h3 className="text-xl font-semibold text-gray-900 mb-2">
      {hasSearch 
        ? 'No posts found' 
        : filter === 'all' 
          ? 'No scheduled posts yet' 
          : `No ${filter} posts`}
    </h3>
    <p className="text-gray-600 mb-6 max-w-md mx-auto">
      {hasSearch
        ? 'Try adjusting your search terms or filters'
        : 'Schedule posts to publish at optimal times when your audience is most active'}
    </p>
    {!hasSearch && (
      <button
        onClick={onCreateClick}
        className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Schedule Your First Post
      </button>
    )}
  </div>
);

// Loading Skeleton
const ScheduledPostsSkeleton = ({ viewMode }) => (
  <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-4'}>
    {[...Array(4)].map((_, i) => (
      <div key={i} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-gray-200 rounded animate-pulse w-20"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-4"></div>
        </div>
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
      </div>
    ))}
  </div>
);

// Helper functions
const getStatusIcon = (status) => {
  switch (status) {
    case 'scheduled': return Clock;
    case 'published': return Send;
    case 'cancelled': return Pause;
    default: return Clock;
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'scheduled': return 'text-blue-600 bg-blue-50';
    case 'published': return 'text-green-600 bg-green-50';
    case 'cancelled': return 'text-gray-600 bg-gray-50';
    default: return 'text-gray-600 bg-gray-50';
  }
};

export default PostScheduler;