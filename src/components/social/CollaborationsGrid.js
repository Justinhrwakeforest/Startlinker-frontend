// src/components/social/CollaborationsGrid.js - Pinterest-style startup collaborations
import React, { useState, useEffect } from 'react';
import { 
  Plus, Heart, Eye, Users, Share2, MoreHorizontal, 
  Edit, Trash2, UserPlus, Lock, Globe, Folder,
  BookmarkPlus, Filter, Search, Grid, List, X
} from 'lucide-react';
import axios from 'axios';

const CollaborationsGrid = ({ currentUser, showCreateButton = true }) => {
  const [collaborations, setCollaborations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [filter, setFilter] = useState('all'); // all, public, private, collaborative
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchCollaborations();
  }, [filter]);

  const fetchCollaborations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('type', filter);
      }

      const response = await axios.get(`/api/social/collaborations/?${params}`);
      setCollaborations(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching collaborations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCollaborationAction = async (action, collaborationId, data = {}) => {
    try {
      switch (action) {
        case 'follow':
          await axios.post(`/api/social/collaborations/${collaborationId}/follow/`);
          break;
        case 'unfollow':
          await axios.post(`/api/social/collaborations/${collaborationId}/unfollow/`);
          break;
        case 'delete':
          await axios.delete(`/api/social/collaborations/${collaborationId}/`);
          break;
        default:
          break;
      }
      fetchCollaborations();
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      alert(`Failed to ${action}. Please try again.`);
    }
  };

  const filteredCollaborations = collaborations.filter(collaboration => {
    if (!searchQuery) return true;
    return collaboration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           collaboration.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
           collaboration.owner_display_name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                <Folder className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Startup Collaborations</h1>
                <p className="text-purple-100 text-lg">Collaborate and organize innovative startup projects</p>
              </div>
            </div>
            
            {showCreateButton && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 px-6 py-3 bg-white text-purple-600 rounded-xl hover:bg-purple-50 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Plus className="w-5 h-5" />
                <span>Create Collaboration</span>
              </button>
            )}
          </div>
        </div>

        {/* Controls Section */}
        <div className="p-6 bg-gray-50/50 border-b border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="relative flex-1 max-w-lg">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search collaborations by name, description, or creator..."
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-500 bg-white shadow-sm transition-all duration-200"
              />
            </div>

            <div className="flex items-center space-x-3">
              {/* Filter Dropdown */}
              <div className="relative">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 pr-10 text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium shadow-sm transition-all duration-200"
                >
                  <option value="all">All Collaborations</option>
                  <option value="public">🌍 Public</option>
                  <option value="private">🔒 Private</option>
                  <option value="collaborative">👥 Collaborative</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Filter className="h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 rounded-lg transition-all duration-200 ${
                    viewMode === 'grid' 
                      ? 'bg-purple-100 text-purple-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                  title="Grid view"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 rounded-lg transition-all duration-200 ${
                    viewMode === 'list' 
                      ? 'bg-purple-100 text-purple-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                  title="List view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Collaborations Grid/List */}
      {loading ? (
        <CollaborationsGridSkeleton viewMode={viewMode} />
      ) : filteredCollaborations.length === 0 ? (
        <EmptyCollaborations 
          hasSearch={!!searchQuery} 
          onCreateClick={() => setShowCreateModal(true)} 
        />
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        }>
          {filteredCollaborations.map(collaboration => (
            <CollaborationCard
              key={collaboration.id}
              collaboration={collaboration}
              currentUser={currentUser}
              viewMode={viewMode}
              onAction={handleCollaborationAction}
            />
          ))}
        </div>
      )}

      {/* Create Collaboration Modal */}
      {showCreateModal && (
        <CreateCollaborationModal
          onClose={() => setShowCreateModal(false)}
          onCreated={fetchCollaborations}
        />
      )}
    </div>
  );
};

// Collaboration Card Component
const CollaborationCard = ({ collaboration, currentUser, viewMode, onAction }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isFollowing, setIsFollowing] = useState(collaboration.is_following);

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await onAction('unfollow', collaboration.id);
        setIsFollowing(false);
      } else {
        await onAction('follow', collaboration.id);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Error following/unfollowing collaboration:', error);
    }
  };

  const getPrivacyIcon = () => {
    switch (collaboration.collaboration_type) {
      case 'private':
        return <Lock className="w-4 h-4 text-gray-500" />;
      case 'collaborative':
        return <Users className="w-4 h-4 text-blue-500" />;
      default:
        return <Globe className="w-4 h-4 text-green-500" />;
    }
  };

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
        <div className="flex items-start space-x-4">
          {/* Collaboration Cover */}
          <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex-shrink-0 overflow-hidden">
            {collaboration.cover_image ? (
              <img
                src={collaboration.cover_image}
                alt={collaboration.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Folder className="w-8 h-8 text-white" />
              </div>
            )}
          </div>

          {/* Collaboration Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-lg font-bold text-gray-900 truncate">
                  {collaboration.name}
                </h3>
                <p className="text-sm text-gray-600">
                  by {collaboration.owner_display_name}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {getPrivacyIcon()}
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  {showMenu && (
                    <CollaborationMenu
                      collaboration={collaboration}
                      currentUser={currentUser}
                      onAction={onAction}
                      onClose={() => setShowMenu(false)}
                    />
                  )}
                </div>
              </div>
            </div>

            {collaboration.description && (
              <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                {collaboration.description}
              </p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>{collaboration.startup_count} startups</span>
                <span>•</span>
                <span>{collaboration.follower_count} followers</span>
                <span>•</span>
                <span>{collaboration.view_count} views</span>
              </div>

              {collaboration.owner !== currentUser?.id && (
                <button
                  onClick={handleFollow}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    isFollowing
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                  }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow group">
      {/* Folder Cover */}
      <div className="relative h-48 bg-gradient-to-br from-purple-400 to-pink-500 overflow-hidden">
        {collaboration.cover_image ? (
          <img
            src={collaboration.cover_image}
            alt={collaboration.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Folder className="w-16 h-16 text-white opacity-80" />
          </div>
        )}
        
        {/* Privacy indicator */}
        <div className="absolute top-3 left-3">
          <div className="bg-black bg-opacity-50 backdrop-blur-sm rounded-full p-2">
            {getPrivacyIcon()}
          </div>
        </div>

        {/* Menu button */}
        <div className="absolute top-3 right-3">
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="bg-black bg-opacity-50 backdrop-blur-sm rounded-full p-2 text-white hover:bg-opacity-70 transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {showMenu && (
              <CollaborationMenu
                collaboration={collaboration}
                currentUser={currentUser}
                onAction={onAction}
                onClose={() => setShowMenu(false)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Folder Info */}
      <div className="p-6">
        <div className="mb-3">
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {collaboration.name}
          </h3>
          <p className="text-sm text-gray-600">
            by {collaboration.owner_display_name}
          </p>
        </div>

        {collaboration.description && (
          <p className="text-gray-700 text-sm mb-4 line-clamp-2">
            {collaboration.description}
          </p>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Folder className="w-4 h-4" />
              <span>{collaboration.startup_count}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{collaboration.follower_count}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Eye className="w-4 h-4" />
              <span>{collaboration.view_count}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button className="flex items-center space-x-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors">
            <Folder className="w-4 h-4" />
            <span className="text-sm font-medium">View</span>
          </button>

          {collaboration.owner !== currentUser?.id && (
            <button
              onClick={handleFollow}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isFollowing
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Collaboration Menu Component
const CollaborationMenu = ({ collaboration, currentUser, onAction, onClose }) => {
  const canEdit = collaboration.can_edit;

  return (
    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
      <button
        onClick={() => {
          // Navigate to collaboration detail
          onClose();
        }}
        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
      >
        <Eye className="w-4 h-4" />
        <span>View Collaboration</span>
      </button>
      
      <button
        onClick={() => {
          // Share collaboration
          onClose();
        }}
        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
      >
        <Share2 className="w-4 h-4" />
        <span>Share</span>
      </button>

      {canEdit && (
        <>
          <button
            onClick={() => {
              // Edit collaboration
              onClose();
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
          >
            <Edit className="w-4 h-4" />
            <span>Edit</span>
          </button>
          
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this collaboration?')) {
                onAction('delete', collaboration.id);
              }
              onClose();
            }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </>
      )}
    </div>
  );
};

// Create Collaboration Modal
const CreateCollaborationModal = ({ onClose, onCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    collaboration_type: 'public',
    cover_image: null
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('collaboration_type', formData.collaboration_type);
      if (formData.cover_image) {
        data.append('cover_image', formData.cover_image);
      }

      await axios.post('/api/social/collaborations/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      onCreated();
      onClose();
    } catch (error) {
      console.error('Error creating collaboration:', error);
      alert('Failed to create collaboration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Create Collaboration</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Collaboration Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="My Startup Collaboration"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                placeholder="A collaborative space for innovative startup projects..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Privacy
              </label>
              <select
                value={formData.collaboration_type}
                onChange={(e) => setFormData({ ...formData, collaboration_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="public">Public - Anyone can view</option>
                <option value="private">Private - Only you can view</option>
                <option value="collaborative">Collaborative - Others can contribute</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cover Image (Optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({ ...formData, cover_image: e.target.files[0] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.name.trim()}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating...' : 'Create Collaboration'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Empty State
const EmptyCollaborations = ({ hasSearch, onCreateClick }) => (
  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
    <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
    <h3 className="text-xl font-semibold text-gray-900 mb-2">
      {hasSearch ? 'No collaborations found' : 'No collaborations yet'}
    </h3>
    <p className="text-gray-600 mb-6 max-w-md mx-auto">
      {hasSearch 
        ? 'Try adjusting your search terms or filters'
        : 'Create collaborative spaces for your favorite startups to organize and share your discoveries'
      }
    </p>
    {!hasSearch && (
      <button
        onClick={onCreateClick}
        className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
      >
        Create Your First Collaboration
      </button>
    )}
  </div>
);

// Loading Skeleton
const CollaborationsGridSkeleton = ({ viewMode }) => (
  <div className={
    viewMode === 'grid' 
      ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
      : 'space-y-4'
  }>
    {[...Array(6)].map((_, i) => (
      <div key={i} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {viewMode === 'grid' ? (
          <>
            <div className="h-48 bg-gray-200 animate-pulse"></div>
            <div className="p-6 space-y-3">
              <div className="h-5 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
            </div>
          </>
        ) : (
          <div className="p-6 flex items-start space-x-4">
            <div className="w-20 h-20 bg-gray-200 rounded-lg animate-pulse flex-shrink-0"></div>
            <div className="flex-1 space-y-3">
              <div className="h-5 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
            </div>
          </div>
        )}
      </div>
    ))}
  </div>
);

export default CollaborationsGrid;