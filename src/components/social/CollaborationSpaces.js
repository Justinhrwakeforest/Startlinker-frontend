// src/components/social/CollaborationSpaces.js - Project collaboration spaces
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Heart, Eye, Users, Share2, MoreHorizontal, 
  Edit, Trash2, UserPlus, Lock, Globe, Briefcase,
  BookmarkPlus, Filter, Search, Grid, List, X, 
  Target, Calendar, Clock, CheckCircle
} from 'lucide-react';
import api from '../../services/api';

const CollaborationSpaces = ({ currentUser, showCreateButton = true }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [filter, setFilter] = useState('all'); // all, public, private, collaborative
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [filter]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('type', filter);
      }

      const response = await api.get(`/api/social/collaborations/?${params}`);
      setProjects(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching collaboration projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectAction = async (action, projectId, data = {}) => {
    try {
      switch (action) {
        case 'follow':
          await api.post(`/api/social/collaborations/${projectId}/follow/`);
          break;
        case 'unfollow':
          await api.post(`/api/social/collaborations/${projectId}/unfollow/`);
          break;
        case 'delete':
          await api.delete(`/api/social/collaborations/${projectId}/`);
          break;
        default:
          break;
      }
      fetchProjects();
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      alert(`Failed to ${action}. Please try again.`);
    }
  };

  const filteredProjects = projects.filter(project => {
    if (!searchQuery) return true;
    return project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
           project.owner_display_name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl w-fit">
                <Briefcase className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">Collaboration Spaces</h1>
                <p className="text-blue-100 text-sm sm:text-base lg:text-lg">Create and manage team projects, startups, and research initiatives</p>
              </div>
            </div>
            
            {showCreateButton && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center justify-center space-x-2 px-4 py-2 sm:px-6 sm:py-3 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Create Project</span>
              </button>
            )}
          </div>
        </div>

        {/* Controls Section */}
        <div className="p-4 sm:p-6 bg-gray-50/50 border-b border-gray-100">
          <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
            {/* Search */}
            <div className="relative flex-1 max-w-full lg:max-w-lg">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="w-full pl-10 sm:pl-12 pr-4 py-2 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-500 bg-white shadow-sm transition-all duration-200 text-sm sm:text-base"
              />
            </div>

            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
              {/* Filter Dropdown */}
              <div className="relative">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 rounded-xl px-3 py-2 sm:px-4 sm:py-3 pr-8 sm:pr-10 text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium shadow-sm transition-all duration-200 text-sm sm:text-base w-full sm:w-auto"
                >
                  <option value="all">All Projects</option>
                  <option value="public">🌍 Public</option>
                  <option value="private">🔒 Private</option>
                  <option value="collaborative">👥 Collaborative</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 pointer-events-none">
                  <Filter className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center justify-center bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 sm:p-2.5 rounded-lg transition-all duration-200 ${
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
                  className={`p-2 sm:p-2.5 rounded-lg transition-all duration-200 ${
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

      {/* Projects Grid/List */}
      {loading ? (
        <ProjectsGridSkeleton viewMode={viewMode} />
      ) : filteredProjects.length === 0 ? (
        <EmptyProjects 
          hasSearch={!!searchQuery} 
          onCreateClick={() => setShowCreateModal(true)} 
        />
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'
            : 'space-y-4'
        }>
          {filteredProjects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              currentUser={currentUser}
              viewMode={viewMode}
              onAction={handleProjectAction}
            />
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onCreated={fetchProjects}
        />
      )}
    </div>
  );
};

// Project Card Component
const ProjectCard = ({ project, currentUser, viewMode, onAction }) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [isFollowing, setIsFollowing] = useState(project.is_following);

  const handleFollow = async (e) => {
    e?.stopPropagation();
    try {
      if (isFollowing) {
        await onAction('unfollow', project.id);
        setIsFollowing(false);
      } else {
        await onAction('follow', project.id);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Error following/unfollowing project:', error);
    }
  };

  const getPrivacyIcon = () => {
    switch (project.collection_type) {
      case 'private':
        return <Lock className="w-4 h-4 text-gray-500" />;
      case 'collaborative':
        return <Users className="w-4 h-4 text-blue-500" />;
      default:
        return <Globe className="w-4 h-4 text-green-500" />;
    }
  };

  const getProjectTypeIcon = () => {
    switch (project.project_type) {
      case 'startup':
        return <Briefcase className="w-4 h-4 text-purple-500" />;
      case 'research':
        return <Target className="w-4 h-4 text-green-500" />;
      case 'hackathon':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'networking':
        return <Users className="w-4 h-4 text-blue-500" />;
      case 'mentorship':
        return <Heart className="w-4 h-4 text-red-500" />;
      default:
        return <Briefcase className="w-4 h-4 text-gray-500" />;
    }
  };

  if (viewMode === 'list') {
    return (
      <div 
        className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6 hover:shadow-xl transition-shadow cursor-pointer"
        onClick={() => navigate(`/social/collaboration/${project.id}`)}
      >
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-start sm:space-y-0 sm:space-x-4">
          {/* Project Cover */}
          <div className="w-full h-32 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex-shrink-0 overflow-hidden">
            {project.cover_image ? (
              <img
                src={project.cover_image}
                alt={project.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                {getProjectTypeIcon()}
              </div>
            )}
          </div>

          {/* Project Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-start sm:justify-between sm:space-y-0 mb-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-col space-y-1 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2 mb-1">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                    {project.name}
                  </h3>
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full w-fit">
                    {project.project_type || 'collection'}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  by {project.owner_display_name}
                </p>
              </div>
              <div className="flex items-center space-x-2 self-start">
                {getPrivacyIcon()}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(!showMenu);
                    }}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  {showMenu && (
                    <ProjectMenu
                      project={project}
                      currentUser={currentUser}
                      onAction={onAction}
                      onClose={() => setShowMenu(false)}
                    />
                  )}
                </div>
              </div>
            </div>

            {project.description && (
              <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                {project.description}
              </p>
            )}

            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-600">
                {project.is_project ? (
                  <>
                    <span>{project.task_count || 0} tasks</span>
                    <span className="hidden sm:inline">•</span>
                    <span>{project.team_size || 1} members</span>
                    <span className="hidden sm:inline">•</span>
                    <span>{project.progress_percentage || 0}% complete</span>
                  </>
                ) : (
                  <>
                    <span>{project.startup_count} startups</span>
                    <span className="hidden sm:inline">•</span>
                    <span>{project.follower_count} followers</span>
                    <span className="hidden sm:inline">•</span>
                    <span>{project.view_count} views</span>
                  </>
                )}
              </div>

              {project.owner !== currentUser?.id && (
                <button
                  onClick={handleFollow}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto ${
                    isFollowing
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
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
    <div 
      className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow group cursor-pointer"
      onClick={() => navigate(`/social/collaboration/${project.id}`)}
    >
      {/* Project Cover */}
      <div className="relative h-48 bg-gradient-to-br from-blue-400 to-indigo-500 overflow-hidden">
        {project.cover_image ? (
          <img
            src={project.cover_image}
            alt={project.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-white opacity-80 text-center">
              <div className="mb-2">
                {getProjectTypeIcon()}
              </div>
              <span className="text-xs uppercase font-medium">
                {project.project_type || 'Collection'}
              </span>
            </div>
          </div>
        )}
        
        {/* Status indicator */}
        {project.status && project.status !== 'active' && (
          <div className="absolute top-3 left-3">
            <span className="px-2 py-1 text-xs font-medium bg-yellow-500 text-white rounded-full">
              {project.status}
            </span>
          </div>
        )}

        {/* Privacy indicator */}
        <div className="absolute top-3 right-12">
          <div className="bg-black bg-opacity-50 backdrop-blur-sm rounded-full p-2">
            {getPrivacyIcon()}
          </div>
        </div>

        {/* Menu button */}
        <div className="absolute top-3 right-3">
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="bg-black bg-opacity-50 backdrop-blur-sm rounded-full p-2 text-white hover:bg-opacity-70 transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {showMenu && (
              <ProjectMenu
                project={project}
                currentUser={currentUser}
                onAction={onAction}
                onClose={() => setShowMenu(false)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Project Info */}
      <div className="p-4 sm:p-6">
        <div className="mb-3">
          <div className="flex flex-col space-y-1 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2 mb-1">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
              {project.name}
            </h3>
            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full w-fit">
              {project.project_type || 'collection'}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            by {project.owner_display_name}
          </p>
        </div>

        {project.description && (
          <p className="text-gray-700 text-sm mb-4 line-clamp-2">
            {project.description}
          </p>
        )}

        {/* Progress bar for projects */}
        {project.is_project && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <span>{project.progress_percentage || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${project.progress_percentage || 0}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start mb-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
            {project.is_project ? (
              <>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{project.task_count || 0}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{project.team_size || 1}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Ongoing'}</span>
                  <span className="sm:hidden">Ongoing</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center space-x-1">
                  <Briefcase className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{project.startup_count}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{project.follower_count}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{project.view_count}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-end sm:space-y-0">
          {project.owner !== currentUser?.id && (
            <button
              onClick={handleFollow}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto ${
                isFollowing
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
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

// Project Menu Component
const ProjectMenu = ({ project, currentUser, onAction, onClose }) => {
  const navigate = useNavigate();
  const canEdit = project.can_edit;

  return (
    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
      <button
        onClick={() => {
          navigate(`/social/collaboration/${project.id}`);
          onClose();
        }}
        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
      >
        <Eye className="w-4 h-4" />
        <span>Open Project</span>
      </button>
      
      <button
        onClick={() => {
          // Share project
          onClose();
        }}
        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
      >
        <Share2 className="w-4 h-4" />
        <span>Share</span>
      </button>

      {project.collection_type === 'collaborative' && (
        <button
          onClick={() => {
            // Invite collaborators
            onClose();
          }}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite Members</span>
        </button>
      )}

      {canEdit && (
        <>
          <button
            onClick={() => {
              // Edit project
              onClose();
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Project</span>
          </button>
          
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this project?')) {
                onAction('delete', project.id);
              }
              onClose();
            }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Project</span>
          </button>
        </>
      )}
    </div>
  );
};

// Create Project Modal
const CreateProjectModal = ({ onClose, onCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    collection_type: 'public',
    project_type: 'project',
    goals: '',
    skills_needed: [],
    start_date: '',
    end_date: '',
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
      data.append('collection_type', formData.collection_type);
      data.append('project_type', formData.project_type);
      data.append('goals', formData.goals);
      
      if (formData.skills_needed.length > 0) {
        data.append('skills_needed', JSON.stringify(formData.skills_needed));
      }
      if (formData.start_date) {
        data.append('start_date', formData.start_date);
      }
      if (formData.end_date) {
        data.append('end_date', formData.end_date);
      }
      if (formData.cover_image) {
        data.append('cover_image', formData.cover_image);
      }

      await api.post('/api/social/collaborations/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      onCreated();
      onClose();
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Create Collaboration Project</h2>
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
                Project Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                style={{ color: '#111827' }}
                placeholder="My Startup Idea"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Type
              </label>
              <select
                value={formData.project_type}
                onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                style={{ color: '#111827' }}
              >
                <option value="collection" style={{ color: '#111827', backgroundColor: '#ffffff' }}>Startup Collection</option>
                <option value="project" style={{ color: '#111827', backgroundColor: '#ffffff' }}>General Project</option>
                <option value="startup" style={{ color: '#111827', backgroundColor: '#ffffff' }}>Startup Development</option>
                <option value="research" style={{ color: '#111827', backgroundColor: '#ffffff' }}>Research Project</option>
                <option value="hackathon" style={{ color: '#111827', backgroundColor: '#ffffff' }}>Hackathon Team</option>
                <option value="networking" style={{ color: '#111827', backgroundColor: '#ffffff' }}>Networking Group</option>
                <option value="mentorship" style={{ color: '#111827', backgroundColor: '#ffffff' }}>Mentorship Circle</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900"
                style={{ color: '#111827' }}
                placeholder="Describe your project goals and what you're looking to achieve..."
              />
            </div>

            {formData.project_type !== 'collection' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Goals
                  </label>
                  <textarea
                    value={formData.goals}
                    onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900"
                    style={{ color: '#111827' }}
                    placeholder="What do you want to achieve with this project?"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      style={{ color: '#111827' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target End Date
                    </label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      style={{ color: '#111827' }}
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Privacy
              </label>
              <select
                value={formData.collection_type}
                onChange={(e) => setFormData({ ...formData, collection_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                style={{ color: '#111827' }}
              >
                <option value="public" style={{ color: '#111827', backgroundColor: '#ffffff' }}>Public - Anyone can view</option>
                <option value="private" style={{ color: '#111827', backgroundColor: '#ffffff' }}>Private - Only you can view</option>
                <option value="collaborative" style={{ color: '#111827', backgroundColor: '#ffffff' }}>Collaborative - Others can contribute</option>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                style={{ color: '#111827' }}
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
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Empty State
const EmptyProjects = ({ hasSearch, onCreateClick }) => (
  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
    <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
    <h3 className="text-xl font-semibold text-gray-900 mb-2">
      {hasSearch ? 'No projects found' : 'No projects yet'}
    </h3>
    <p className="text-gray-600 mb-6 max-w-md mx-auto">
      {hasSearch 
        ? 'Try adjusting your search terms or filters'
        : 'Start collaborating! Create your first project to work with others on startups, research, or any initiative'
      }
    </p>
    {!hasSearch && (
      <button
        onClick={onCreateClick}
        className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        Create Your First Project
      </button>
    )}
  </div>
);

// Loading Skeleton
const ProjectsGridSkeleton = ({ viewMode }) => (
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

export default CollaborationSpaces;