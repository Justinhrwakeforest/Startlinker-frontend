// src/components/social/CollaborationProjectDetail.js - Enhanced Project detail view with full functionality
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Users, Calendar, Clock, Target, CheckCircle, 
  Plus, Edit, Trash2, Share2, Settings, FileText, Video,
  MessageSquare, AlertCircle, Loader, MoreVertical, Upload,
  Download, X, Send, Link, Eye, EyeOff, UserPlus, Mail,
  CheckSquare, Square, Filter, Search, ChevronDown, ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const CollaborationProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  
  // State management
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [files, setFiles] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Form states
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    goals: '',
    status: 'planning',
    collaboration_type: 'public'
  });
  
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    assigned_to: null
  });
  
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'member',
    message: ''
  });
  
  const [meetingForm, setMeetingForm] = useState({
    title: '',
    description: '',
    scheduled_at: '',
    duration: 60,
    meeting_link: ''
  });

  useEffect(() => {
    fetchProjectDetails();
    fetchTasks();
    fetchTeamMembers();
    fetchFiles();
    fetchMeetings();
    fetchInvites();
  }, [projectId]);

  const fetchProjectDetails = async () => {
    try {
      const response = await api.get(`/api/social/collaborations/${projectId}/`);
      console.log('Project details:', response.data);
      console.log('Can edit:', response.data.can_edit);
      console.log('Current user:', user);
      setProject(response.data);
      setEditForm({
        name: response.data.name || '',
        description: response.data.description || '',
        goals: response.data.goals || '',
        status: response.data.status || 'planning',
        collaboration_type: response.data.collaboration_type || 'public'
      });
    } catch (error) {
      console.error('Error fetching project details:', error);
      if (error.response?.status === 404) {
        navigate('/social');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await api.get(`/api/social/tasks/?project=${projectId}`);
      console.log('Tasks response:', response.data);
      const taskData = response.data.results || response.data;
      console.log('Tasks data:', taskData);
      setTasks(taskData);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      // Fetch collaborators for the project
      const response = await api.get(`/api/social/collaborations/${projectId}/collaborators/`);
      setTeamMembers(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching team members:', error);
      // If endpoint doesn't exist, create mock data from project owner
      if (project?.owner_display_name) {
        setTeamMembers([{
          id: project.owner,
          username: project.owner_display_name,
          role: 'owner',
          joined_at: project.created_at
        }]);
      }
    }
  };

  const fetchFiles = async () => {
    try {
      const response = await api.get(`/api/social/project-files/?project=${projectId}`);
      setFiles(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const fetchMeetings = async () => {
    try {
      const response = await api.get(`/api/social/meetings/?project=${projectId}`);
      setMeetings(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    }
  };

  const fetchInvites = async () => {
    try {
      const response = await api.get(`/api/social/invites/?project=${projectId}`);
      setInvites(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching invites:', error);
    }
  };

  const handleEditProject = async () => {
    try {
      await api.patch(`/api/social/collaborations/${projectId}/`, editForm);
      await fetchProjectDetails();
      setShowEditModal(false);
      alert('Project updated successfully!');
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Failed to update project. Please try again.');
    }
  };

  const handleCreateTask = async () => {
    try {
      const taskData = {
        ...taskForm,
        project: projectId
      };
      await api.post('/api/social/tasks/', taskData);
      await fetchTasks();
      setShowTaskModal(false);
      setTaskForm({
        title: '',
        description: '',
        priority: 'medium',
        due_date: '',
        assigned_to: null
      });
      alert('Task created successfully!');
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task. Please try again.');
    }
  };

  const handleTaskStatusUpdate = async (taskId, newStatus) => {
    console.log('Updating task status:', { taskId, newStatus });
    try {
      const response = await api.post(`/api/social/tasks/${taskId}/update_status/`, {
        status: newStatus
      });
      console.log('Task update response:', response.data);
      
      // Update local state immediately for better UX
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );
      
      // Fetch fresh data
      await fetchTasks();
      
      // Update progress if task is completed
      if (newStatus === 'completed') {
        const completedCount = tasks.filter(t => t.status === 'completed').length + 1;
        const progress = Math.round((completedCount / tasks.length) * 100);
        await api.patch(`/api/social/collaborations/${projectId}/`, {
          progress_percentage: progress
        });
        await fetchProjectDetails();
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      console.error('Error response:', error.response?.data);
      alert(`Failed to update task status: ${error.response?.data?.error || error.message}`);
      // Refresh tasks to restore correct state
      await fetchTasks();
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      console.log('Deleting task:', taskId);
      try {
        await api.delete(`/api/social/tasks/${taskId}/`);
        
        // Update local state immediately
        setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
        
        // Fetch fresh data
        await fetchTasks();
        alert('Task deleted successfully!');
      } catch (error) {
        console.error('Error deleting task:', error);
        console.error('Error response:', error.response?.data);
        alert(`Failed to delete task: ${error.response?.data?.error || error.message}`);
        // Refresh tasks to restore correct state
        await fetchTasks();
      }
    }
  };

  const handleInviteMember = async () => {
    try {
      const inviteData = {
        project: projectId,
        invitee_email: inviteForm.email,
        role: inviteForm.role,
        message: inviteForm.message
      };
      await api.post('/api/social/invites/', inviteData);
      await fetchInvites();
      setShowInviteModal(false);
      setInviteForm({
        email: '',
        role: 'member',
        message: ''
      });
      alert('Invitation sent successfully!');
    } catch (error) {
      console.error('Error sending invitation:', error);
      alert('Failed to send invitation. Please try again.');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('project', projectId);
    formData.append('name', file.name);
    formData.append('description', `Uploaded file: ${file.name}`);

    try {
      await api.post('/api/social/project-files/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      await fetchFiles();
      alert('File uploaded successfully!');
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    }
  };

  const getFileType = (fileName) => {
    const extension = fileName.toLowerCase().split('.').pop();
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    const documentTypes = ['pdf', 'doc', 'docx', 'txt', 'rtf'];
    const videoTypes = ['mp4', 'webm', 'ogg', 'mov', 'avi'];
    const audioTypes = ['mp3', 'wav', 'ogg', 'm4a'];
    const codeTypes = ['js', 'jsx', 'ts', 'tsx', 'css', 'html', 'json', 'xml', 'py', 'java', 'cpp', 'c', 'h'];
    
    if (imageTypes.includes(extension)) return 'image';
    if (documentTypes.includes(extension)) return 'document';
    if (videoTypes.includes(extension)) return 'video';
    if (audioTypes.includes(extension)) return 'audio';
    if (codeTypes.includes(extension)) return 'code';
    return 'other';
  };

  const getFileIcon = (fileName) => {
    const type = getFileType(fileName);
    switch (type) {
      case 'image': return '🖼️';
      case 'document': return '📄';
      case 'video': return '🎥';
      case 'audio': return '🎵';
      case 'code': return '💻';
      default: return '📎';
    }
  };

  const handleFileView = (file) => {
    setSelectedFile(file);
    setShowFileViewer(true);
  };

  const handleFileDownload = async (fileId, fileName) => {
    try {
      // Get the download URL from the backend
      const response = await api.get(`/api/social/project-files/${fileId}/`);
      
      // Create a download link with the original file URL
      const link = document.createElement('a');
      link.href = response.data.file || response.data.file_url;
      link.download = fileName;
      link.target = '_blank';
      
      // Add to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
      
      // Fallback: try direct file URL access
      try {
        const fileResponse = await api.get(`/api/social/project-files/?project=${projectId}`);
        const file = fileResponse.data.results?.find(f => f.id === fileId) || fileResponse.data.find(f => f.id === fileId);
        
        if (file?.file || file?.file_url) {
          const link = document.createElement('a');
          link.href = file.file || file.file_url;
          link.download = fileName;
          link.target = '_blank';
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          throw new Error('File URL not found');
        }
      } catch (fallbackError) {
        console.error('Fallback download also failed:', fallbackError);
        alert('Failed to download file. Please try again or contact support.');
      }
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        await api.delete(`/api/social/project-files/${fileId}/`);
        await fetchFiles();
        alert('File deleted successfully!');
      } catch (error) {
        console.error('Error deleting file:', error);
        alert('Failed to delete file. Please try again.');
      }
    }
  };

  const handleCreateMeeting = async () => {
    // Validate required fields
    if (!meetingForm.title.trim()) {
      alert('Please enter a meeting title.');
      return;
    }
    
    if (!meetingForm.scheduled_at) {
      alert('Please select a date and time for the meeting.');
      return;
    }
    
    // Validate that the scheduled time is in the future
    const selectedDate = new Date(meetingForm.scheduled_at);
    const now = new Date();
    if (selectedDate <= now) {
      alert('Please select a future date and time for the meeting.');
      return;
    }
    
    try {
      const meetingData = {
        title: meetingForm.title.trim(),
        description: meetingForm.description.trim(),
        scheduled_at: meetingForm.scheduled_at,
        duration: parseInt(meetingForm.duration) || 60,
        meeting_link: meetingForm.meeting_link.trim(),
        project: projectId,
        organizer: user.id
      };
      
      console.log('Creating meeting with data:', meetingData);
      
      await api.post('/api/social/meetings/', meetingData);
      await fetchMeetings();
      setShowMeetingModal(false);
      setMeetingForm({
        title: '',
        description: '',
        scheduled_at: '',
        duration: 60,
        meeting_link: ''
      });
      alert('Meeting scheduled successfully!');
    } catch (error) {
      console.error('Error creating meeting:', error);
      
      // Show more specific error message
      if (error.response?.data) {
        console.error('Server response:', error.response.data);
        const errorMessage = error.response.data.message || 
                           error.response.data.error || 
                           Object.values(error.response.data).flat().join(', ') ||
                           'Failed to schedule meeting. Please check your input and try again.';
        alert(errorMessage);
      } else {
        alert('Failed to schedule meeting. Please try again.');
      }
    }
  };

  const handleDeleteMeeting = async (meetingId) => {
    if (window.confirm('Are you sure you want to cancel this meeting?')) {
      try {
        await api.delete(`/api/social/meetings/${meetingId}/`);
        await fetchMeetings();
        alert('Meeting cancelled successfully!');
      } catch (error) {
        console.error('Error deleting meeting:', error);
        alert('Failed to cancel meeting. Please try again.');
      }
    }
  };

  const handleShareProject = () => {
    const shareUrl = `${window.location.origin}/social/projects/${projectId}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Project link copied to clipboard!');
    setShowShareModal(false);
  };

  const handleUpdateSettings = async (settings) => {
    try {
      await api.patch(`/api/social/collaborations/${projectId}/`, settings);
      await fetchProjectDetails();
      setShowSettingsModal(false);
      alert('Settings updated successfully!');
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Failed to update settings. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Not Found</h2>
          <p className="text-gray-600 mb-6">The project you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/social')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Social Hub
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: 'overview', label: 'Overview', icon: Target },
    { key: 'tasks', label: 'Tasks', icon: CheckCircle, count: tasks.length },
    { key: 'team', label: 'Team', icon: Users, count: teamMembers.length || 1 },
    { key: 'files', label: 'Files', icon: FileText, count: files.length },
    { key: 'meetings', label: 'Meetings', icon: Video, count: meetings.length },
    { key: 'settings', label: 'Settings', icon: Settings }
  ];

  const taskStatuses = ['todo', 'in_progress', 'review', 'completed', 'blocked'];
  const getTaskStatusColor = (status) => {
    const colors = {
      todo: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      review: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      blocked: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/social')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    {project.project_type === 'collection' ? 'Startup Collection' : project.project_type} • 
                    Created by {project.owner_display_name}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  style={{ color: '#374151' }}
                >
                  <Share2 className="w-4 h-4" style={{ color: '#374151' }} />
                  <span style={{ color: '#374151' }}>Share</span>
                </button>
                {project.can_edit && (
                  <button 
                    onClick={() => setShowEditModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
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
                  {tab.count !== undefined && (
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

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">About this Project</h2>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {project.description || 'No description provided.'}
                </p>
                {project.goals && (
                  <>
                    <h3 className="text-md font-semibold text-gray-900 mt-6 mb-3">Goals</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{project.goals}</p>
                  </>
                )}
              </div>

              {/* Progress */}
              {project.project_type !== 'collection' && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Progress</h2>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                        <span>Overall Progress</span>
                        <span className="font-medium">{project.progress_percentage || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${project.progress_percentage || 0}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">
                          {tasks.filter(t => t.status === 'completed').length}
                        </div>
                        <div className="text-sm text-gray-600">Tasks Completed</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">
                          {tasks.filter(t => t.status === 'in_progress').length}
                        </div>
                        <div className="text-sm text-gray-600">In Progress</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Project Info */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Project Info</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Type</span>
                    <span className="font-medium text-gray-900 capitalize">
                      {project.project_type === 'collection' ? 'Startup Collection' : project.project_type}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Status</span>
                    <span className="font-medium text-gray-900 capitalize">{project.status || 'Planning'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Privacy</span>
                    <span className="font-medium text-gray-900 capitalize">{project.collaboration_type}</span>
                  </div>
                  {project.start_date && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Started</span>
                      <span className="font-medium text-gray-900">
                        {new Date(project.start_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {project.end_date && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Target Date</span>
                      <span className="font-medium text-gray-900">
                        {new Date(project.end_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              {project.can_edit && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-2">
                    <button 
                      onClick={() => setShowTaskModal(true)}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <Plus className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-700">Add Task</span>
                    </button>
                    <button 
                      onClick={() => setShowInviteModal(true)}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <Users className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-700">Invite Members</span>
                    </button>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <FileText className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-700">Upload File</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Tasks</h2>
              {project.can_edit && (
                <button 
                  onClick={() => setShowTaskModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Task</span>
                </button>
              )}
            </div>
            {tasks.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No tasks yet. Add your first task to get started!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map(task => (
                  <div key={task.id} className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Checkbox clicked for task:', task.id, 'Current status:', task.status);
                        handleTaskStatusUpdate(task.id, task.status === 'completed' ? 'todo' : 'completed');
                      }}
                      className="flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors"
                      type="button"
                    >
                      {task.status === 'completed' ? (
                        <CheckSquare className="w-5 h-5 text-green-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                    <div className="flex-1">
                      <h4 className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                      )}
                      {task.due_date && (
                        <p className="text-xs text-gray-500 mt-2 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <select
                      value={task.status}
                      onChange={(e) => {
                        e.stopPropagation();
                        console.log('Status dropdown changed for task:', task.id, 'New status:', e.target.value);
                        handleTaskStatusUpdate(task.id, e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className={`px-3 py-1 text-xs font-medium rounded-full border-0 cursor-pointer ${getTaskStatusColor(task.status)}`}
                      style={{ color: '#374151' }}
                    >
                      {taskStatuses.map(status => (
                        <option key={status} value={status} style={{ color: '#374151', backgroundColor: 'white' }}>
                          {status.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                    {(project?.can_edit || true) && ( // Temporarily always show delete button for testing
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Delete button clicked for task:', task.id);
                          handleDeleteTask(task.id);
                        }}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        type="button"
                        title="Delete task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Team Tab */}
        {activeTab === 'team' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Team Members</h2>
              {project.can_edit && (
                <button 
                  onClick={() => setShowInviteModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Invite Member</span>
                </button>
              )}
            </div>
            
            {teamMembers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No team members yet. Invite collaborators to join!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamMembers.map(member => (
                  <div key={member.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">
                          {member.username?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{member.username}</h4>
                        <p className="text-sm text-gray-600 capitalize">{member.role || 'Member'}</p>
                      </div>
                    </div>
                    {member.joined_at && (
                      <p className="text-xs text-gray-500 mt-3">
                        Joined {new Date(member.joined_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pending Invitations */}
            {invites.filter(i => i.status === 'pending').length > 0 && (
              <>
                <h3 className="text-md font-semibold text-gray-900 mt-8 mb-4">Pending Invitations</h3>
                <div className="space-y-3">
                  {invites.filter(i => i.status === 'pending').map(invite => (
                    <div key={invite.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{invite.invitee_email}</p>
                        <p className="text-sm text-gray-600">Invited {new Date(invite.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                        Pending
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Files Tab */}
        {activeTab === 'files' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Project Files</h2>
              {project.can_edit && (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload File</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            
            {files.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No files uploaded yet. Upload your first file!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map(file => (
                  <div key={file.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group">
                    <div className="flex items-start justify-between">
                      <div 
                        className="flex-1 cursor-pointer" 
                        onClick={() => handleFileView(file)}
                        title="Click to view file"
                      >
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-2xl">{getFileIcon(file.name)}</span>
                          <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <h4 className="font-medium text-gray-900 text-sm hover:text-blue-600 transition-colors">
                          {file.name}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          Uploaded by {file.uploaded_by_name || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {file.uploaded_at ? new Date(file.uploaded_at).toLocaleDateString() : 'Invalid Date'}
                        </p>
                        <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="inline-flex items-center text-xs text-blue-600">
                            <Eye className="w-3 h-3 mr-1" />
                            Click to view
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFileView(file);
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="View file"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFileDownload(file.id, file.name);
                          }}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Download file"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {project.can_edit && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFile(file.id);
                            }}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Delete file"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Meetings Tab */}
        {activeTab === 'meetings' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Meetings</h2>
              {project.can_edit && (
                <button 
                  onClick={() => setShowMeetingModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Schedule Meeting</span>
                </button>
              )}
            </div>
            
            {meetings.length === 0 ? (
              <div className="text-center py-12">
                <Video className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No meetings scheduled. Schedule your first meeting!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {meetings.map(meeting => (
                  <div key={meeting.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{meeting.title}</h4>
                        {meeting.description && (
                          <p className="text-sm text-gray-600 mt-1">{meeting.description}</p>
                        )}
                        <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(meeting.scheduled_at).toLocaleDateString()}
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {new Date(meeting.scheduled_at).toLocaleTimeString()}
                          </span>
                        </div>
                        {meeting.meeting_link && (
                          <a 
                            href={meeting.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm mt-2"
                          >
                            <Link className="w-4 h-4" />
                            <span>Join Meeting</span>
                          </a>
                        )}
                      </div>
                      {project.can_edit && (
                        <button
                          onClick={() => handleDeleteMeeting(meeting.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && project.can_edit && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Project Settings</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Status
                </label>
                <select
                  value={project.status || 'planning'}
                  onChange={(e) => handleUpdateSettings({ status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ color: '#374151', backgroundColor: 'white' }}
                >
                  <option value="planning" style={{ color: '#374151', backgroundColor: 'white' }}>Planning</option>
                  <option value="active" style={{ color: '#374151', backgroundColor: 'white' }}>Active</option>
                  <option value="on_hold" style={{ color: '#374151', backgroundColor: 'white' }}>On Hold</option>
                  <option value="completed" style={{ color: '#374151', backgroundColor: 'white' }}>Completed</option>
                  <option value="archived" style={{ color: '#374151', backgroundColor: 'white' }}>Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Privacy Settings
                </label>
                <select
                  value={project.collaboration_type}
                  onChange={(e) => handleUpdateSettings({ collaboration_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ color: '#374151', backgroundColor: 'white' }}
                >
                  <option value="public" style={{ color: '#374151', backgroundColor: 'white' }}>Public - Anyone can view</option>
                  <option value="private" style={{ color: '#374151', backgroundColor: 'white' }}>Private - Only team members</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Team Size
                </label>
                <input
                  type="number"
                  value={project.max_team_size || 10}
                  onChange={(e) => handleUpdateSettings({ max_team_size: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="50"
                  style={{ color: '#374151', backgroundColor: 'white' }}
                />
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-md font-semibold text-red-600 mb-4">Danger Zone</h3>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
                      // Handle project deletion
                      alert('Project deletion is not yet implemented for safety reasons.');
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Project
                </button>
              </div>
            </div>
          </div>
        )}

        {!['overview', 'tasks', 'team', 'files', 'meetings'].includes(activeTab) && 
         activeTab === 'settings' && !project.can_edit && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
            <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600">Only project owners can access settings.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {/* Edit Project Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Edit Project</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Goals
                </label>
                <textarea
                  value={editForm.goals}
                  onChange={(e) => setEditForm({...editForm, goals: e.target.value})}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditProject}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Add New Task</h3>
              <button
                onClick={() => setShowTaskModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter task title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter task description (optional)"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ color: '#374151', backgroundColor: 'white' }}
                  >
                    <option value="low" style={{ color: '#374151', backgroundColor: 'white' }}>Low</option>
                    <option value="medium" style={{ color: '#374151', backgroundColor: 'white' }}>Medium</option>
                    <option value="high" style={{ color: '#374151', backgroundColor: 'white' }}>High</option>
                    <option value="urgent" style={{ color: '#374151', backgroundColor: 'white' }}>Urgent</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={taskForm.due_date}
                    onChange={(e) => setTaskForm({...taskForm, due_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ color: '#374151', backgroundColor: 'white', colorScheme: 'light' }}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  style={{ color: '#374151' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTask}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Invite Team Member</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email address"
                  style={{ color: '#374151', backgroundColor: 'white' }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({...inviteForm, role: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ color: '#374151', backgroundColor: 'white' }}
                >
                  <option value="member" style={{ color: '#374151', backgroundColor: 'white' }}>Member</option>
                  <option value="admin" style={{ color: '#374151', backgroundColor: 'white' }}>Admin</option>
                  <option value="viewer" style={{ color: '#374151', backgroundColor: 'white' }}>Viewer</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message (Optional)
                </label>
                <textarea
                  value={inviteForm.message}
                  onChange={(e) => setInviteForm({...inviteForm, message: e.target.value})}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add a personal message to the invitation"
                  style={{ color: '#374151', backgroundColor: 'white' }}
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  style={{ color: '#374151' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleInviteMember}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Send Invitation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Meeting Modal */}
      {showMeetingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Schedule Meeting</h3>
              <button
                onClick={() => setShowMeetingModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting Title *
                </label>
                <input
                  type="text"
                  value={meetingForm.title}
                  onChange={(e) => setMeetingForm({...meetingForm, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter meeting title"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={meetingForm.description}
                  onChange={(e) => setMeetingForm({...meetingForm, description: e.target.value})}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter meeting agenda or description"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={meetingForm.scheduled_at}
                    onChange={(e) => setMeetingForm({...meetingForm, scheduled_at: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={new Date().toISOString().slice(0, 16)}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Select a future date and time</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={meetingForm.duration}
                    onChange={(e) => setMeetingForm({...meetingForm, duration: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="15"
                    max="480"
                    style={{ color: '#374151', backgroundColor: 'white' }}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting Link (Optional)
                </label>
                <input
                  type="url"
                  value={meetingForm.meeting_link}
                  onChange={(e) => setMeetingForm({...meetingForm, meeting_link: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://meet.google.com/..."
                  style={{ color: '#374151', backgroundColor: 'white' }}
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowMeetingModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  style={{ color: '#374151' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateMeeting}
                  disabled={!meetingForm.title.trim() || !meetingForm.scheduled_at}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Schedule Meeting
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Share Project</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Link
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={`${window.location.origin}/social/projects/${projectId}`}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                  <button
                    onClick={handleShareProject}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Link className="w-4 h-4" />
                    <span>Copy</span>
                  </button>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Anyone with this link can view the project if it's public. 
                  Private projects require team membership to access.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Viewer Modal */}
      {showFileViewer && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getFileIcon(selectedFile.name)}</span>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedFile.name}</h3>
                  <p className="text-sm text-gray-600">
                    Uploaded by {selectedFile.uploaded_by_name || 'Unknown'} • {' '}
                    {selectedFile.uploaded_at ? new Date(selectedFile.uploaded_at).toLocaleDateString() : 'Unknown date'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleFileDownload(selectedFile.id, selectedFile.name)}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setShowFileViewer(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-4 overflow-auto max-h-[calc(90vh-120px)]">
              {(() => {
                const fileType = getFileType(selectedFile.name);
                const fileUrl = selectedFile.file || selectedFile.file_url;
                
                switch (fileType) {
                  case 'image':
                    return (
                      <div className="flex justify-center">
                        <img 
                          src={fileUrl} 
                          alt={selectedFile.name}
                          className="max-w-full max-h-full object-contain rounded-lg"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                        <div className="hidden text-center py-8">
                          <p className="text-gray-500">Unable to display image. You can download it to view.</p>
                        </div>
                      </div>
                    );
                    
                  case 'document':
                    return (
                      <div className="w-full h-full">
                        {selectedFile.name.toLowerCase().endsWith('.pdf') ? (
                          <iframe
                            src={fileUrl}
                            className="w-full h-96 border-0 rounded-lg"
                            title={selectedFile.name}
                          />
                        ) : (
                          <div className="text-center py-8">
                            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 mb-4">
                              Preview not available for this document type.
                            </p>
                            <button
                              onClick={() => handleFileDownload(selectedFile.id, selectedFile.name)}
                              className="flex items-center space-x-2 mx-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <Download className="w-4 h-4" />
                              <span>Download to view</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                    
                  case 'video':
                    return (
                      <div className="flex justify-center">
                        <video 
                          controls 
                          className="max-w-full max-h-full rounded-lg"
                          preload="metadata"
                        >
                          <source src={fileUrl} />
                          Your browser does not support video playback.
                        </video>
                      </div>
                    );
                    
                  case 'audio':
                    return (
                      <div className="flex justify-center py-8">
                        <audio 
                          controls 
                          className="w-full max-w-md"
                          preload="metadata"
                        >
                          <source src={fileUrl} />
                          Your browser does not support audio playback.
                        </audio>
                      </div>
                    );
                    
                  default:
                    return (
                      <div className="text-center py-8">
                        <div className="text-6xl mb-4">{getFileIcon(selectedFile.name)}</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">{selectedFile.name}</h3>
                        <p className="text-gray-600 mb-4">
                          Preview not available for this file type.
                        </p>
                        <div className="flex justify-center space-x-4">
                          <button
                            onClick={() => handleFileDownload(selectedFile.id, selectedFile.name)}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download</span>
                          </button>
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span>Open in new tab</span>
                          </a>
                        </div>
                      </div>
                    );
                }
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollaborationProjectDetail;