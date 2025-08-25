// src/services/api.js - Enhanced API service with better error handling and startup-specific methods
import axios from 'axios';

// Import config
import API_CONFIG from '../config/api.config';

// Use API_CONFIG.baseURL which handles protocol correctly
const CORRECT_BASE_URL = API_CONFIG.baseURL;

// Create a completely new axios instance that forces HTTP
const api = axios.create({
  baseURL: CORRECT_BASE_URL,
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: API_CONFIG.withCredentials,
  maxRedirects: 0,
  validateStatus: function (status) {
    return status >= 200 && status < 400;
  },
});

// Debug: Log the actual baseURL being used
console.log('🔧 Original API baseURL:', API_CONFIG.baseURL);
console.log('🔧 Corrected baseURL:', CORRECT_BASE_URL);
console.log('🔧 Window hostname:', window.location.hostname);

// Combined request interceptor - add auth token and fix URLs
api.interceptors.request.use(
  (config) => {
    // Only force HTTP for direct IP access, allow HTTPS for domain
    if (config.baseURL && (config.baseURL.includes('13.50.234.250') || config.baseURL.includes('44.219.216.107'))) {
      config.baseURL = config.baseURL.replace('https://', 'http://');
    }
    if (config.url && (config.url.includes('13.50.234.250') || config.url.includes('44.219.216.107'))) {
      config.url = config.url.replace('https://', 'http://');
    }
    
    // No need to prepend /api since it's now in the baseURL
    // Just ensure URLs start with /
    if (config.url && !config.url.startsWith('/')) {
      config.url = '/' + config.url;
    }
    
    // Add auth token
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    
    // Handle FormData - remove Content-Type to let browser set multipart boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    console.log('🔵 Making request to:', `${config.baseURL || ''}${config.url || ''}`);
    
    return config;
  },
  (error) => {
    console.error('🔴 Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Handle responses and errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Enhanced error logging
    console.error('🔴 API Error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      responseData: error.response?.data,
      requestData: error.config?.data,
      headers: error.response?.headers
    });
    
    // Handle different error types
    if (error.response?.status === 401) {
        // Only redirect to auth if we're not already there
      if (!window.location.pathname.includes('/auth')) {
        localStorage.removeItem('auth_token');
        window.location.href = '/auth';
      }
    } else if (error.message === 'Network Error') {
      console.error('Network connectivity issue - backend may be down');
    } else if (error.code === 'ECONNABORTED') {
      console.error('Request timeout');
    }
    
    return Promise.reject(error);
  }
);

// Add some utility methods for debugging
api.testConnection = async () => {
  try {
    const response = await api.get('/');
    return true;
  } catch (error) {
    console.error('API connection failed:', error.message);
    return false;
  }
};

api.checkAuth = async () => {
  try {
    const response = await api.get('/api/auth/user/');
    return response.data;
  } catch (error) {
    console.error('Authentication check failed:', error.message);
    return null;
  }
};

// Startup-specific helper methods
api.startups = {
  // Get all industries
  getIndustries: async () => {
    try {
      const response = await api.get('/api/startups/industries/');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch industries:', error);
      throw error;
    }
  },

  // Create a new startup
  create: async (startupData) => {
    try {
      const response = await api.post('/api/startups/', startupData);
      return response.data;
    } catch (error) {
      console.error('Failed to create startup:', error);
      throw error;
    }
  },

  // Upload cover image for a startup
  uploadCoverImage: async (startupId, imageFile) => {
    try {
      const formData = new FormData();
      formData.append('cover_image', imageFile);

      const response = await api.post(
        `/startups/${startupId}/upload_cover_image/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to upload cover image:', error);
      throw error;
    }
  },

  // Get a single startup
  get: async (id) => {
    try {
      const response = await api.get(`/api/startups/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch startup ${id}:`, error);
      throw error;
    }
  },

  // List startups with filters
  list: async (params = {}) => {
    try {
      const response = await api.get('/api/startups/', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch startups:', error);
      throw error;
    }
  },

  // Update a startup directly
  update: async (id, startupData) => {
    try {
      const response = await api.put(`/api/startups/${id}/`, startupData);
      return response.data;
    } catch (error) {
      console.error('Failed to update startup:', error);
      throw error;
    }
  },

  // Submit edit request for a startup
  submitEdit: async (startupId, changes) => {
    try {
      const response = await api.post(`/api/startups/${startupId}/submit_edit/`, { changes });
      return response.data;
    } catch (error) {
      console.error('Failed to submit edit request:', error);
      throw error;
    }
  },

  // Claim a startup
  claim: async (startupId, claimData) => {
    try {
      const response = await api.post(`/api/startups/${startupId}/claim/`, claimData);
      return response.data;
    } catch (error) {
      console.error('Failed to claim startup:', error);
      throw error;
    }
  },

  // Get user's claim requests
  getMyClaims: async (params = {}) => {
    try {
      const response = await api.get('/api/startups/my-claims/', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch my claims:', error);
      throw error;
    }
  },

  // Rate a startup
  rate: async (startupId, rating) => {
    try {
      const response = await api.post(`/api/startups/${startupId}/rate/`, { rating });
      return response.data;
    } catch (error) {
      console.error('Failed to rate startup:', error);
      throw error;
    }
  },

  // Toggle bookmark
  toggleBookmark: async (startupId) => {
    try {
      const response = await api.post(`/api/startups/${startupId}/bookmark/`);
      return response.data;
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
      throw error;
    }
  },

  // Toggle like
  toggleLike: async (startupId) => {
    try {
      const response = await api.post(`/api/startups/${startupId}/like/`);
      return response.data;
    } catch (error) {
      console.error('Failed to toggle like:', error);
      throw error;
    }
  },

  // Add comment
  addComment: async (startupId, text) => {
    try {
      const response = await api.post(`/api/startups/${startupId}/comment/`, { text });
      return response.data;
    } catch (error) {
      console.error('Failed to add comment:', error);
      throw error;
    }
  },

  // Get user's startups
  myStartups: async () => {
    try {
      const response = await api.get('/api/startups/my-startups/');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch my startups:', error);
      throw error;
    }
  },

  // Get featured startups
  featured: async () => {
    try {
      const response = await api.get('/api/startups/featured/');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch featured startups:', error);
      throw error;
    }
  },

  // Get trending startups
  trending: async () => {
    try {
      const response = await api.get('/api/startups/trending/');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch trending startups:', error);
      throw error;
    }
  },

  // Search startups (for navbar quick search)
  search: async (query, limit = 5) => {
    try {
      const response = await api.get('/api/startups/', {
        params: { search: query, limit: limit }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to search startups:', error);
      throw error;
    }
  },

  // Get trending searches
  getTrendingSearches: async () => {
    try {
      // This would need to be implemented on the backend
      // For now, we'll return hardcoded data but structure it properly
      return [
        'AI startups',
        'Remote jobs',
        'Series A funding',
        'Frontend developer',
        'FinTech companies',
        'Product manager roles'
      ];
    } catch (error) {
      console.error('Failed to fetch trending searches:', error);
      throw error;
    }
  },
};

// Authentication helper methods
api.auth = {
  // Login
  login: async (credentials) => {
    try {
      const response = await api.post('/api/auth/login/', credentials);
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
      }
      return response.data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  // Logout
  logout: async () => {
    try {
      await api.post('/api/auth/logout/');
      localStorage.removeItem('auth_token');
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails on server, clear local token
      localStorage.removeItem('auth_token');
    }
  },

  // Register
  register: async (userData) => {
    try {
      const response = await api.post('/api/auth/register/', userData);
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
      }
      return response.data;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await api.get('/api/auth/user/');
      return response.data;
    } catch (error) {
      console.error('Failed to get current user:', error);
      throw error;
    }
  },
};

// Admin-specific methods
api.admin = {
  // Get all startups (including unapproved)
  getStartups: async (filter = 'all', search = '') => {
    try {
      const response = await api.get('/api/startups/admin/', {
        params: { filter, search }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch admin startups:', error);
      throw error;
    }
  },

  // Perform admin action on a startup
  performAction: async (startupId, action) => {
    try {
      const response = await api.patch(`/api/startups/${startupId}/admin/`, { action });
      return response.data;
    } catch (error) {
      console.error(`Failed to perform admin action '${action}':`, error);
      throw error;
    }
  },

  // Bulk admin actions
  bulkAction: async (startupIds, action) => {
    try {
      const response = await api.post('/api/startups/bulk-admin/', {
        startup_ids: startupIds,
        action
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to perform bulk admin action '${action}':`, error);
      throw error;
    }
  },

  // Get edit requests
  getEditRequests: async (status = 'pending') => {
    try {
      const response = await api.get('/api/startups/edit-requests/', {
        params: { status }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch edit requests:', error);
      throw error;
    }
  },

  // Approve edit request
  approveEditRequest: async (requestId) => {
    try {
      const response = await api.post(`/api/startups/edit-requests/${requestId}/approve/`);
      return response.data;
    } catch (error) {
      console.error('Failed to approve edit request:', error);
      throw error;
    }
  },

  // Reject edit request
  rejectEditRequest: async (requestId, notes = '') => {
    try {
      const response = await api.post(`/api/startups/edit-requests/${requestId}/reject/`, { notes });
      return response.data;
    } catch (error) {
      console.error('Failed to reject edit request:', error);
      throw error;
    }
  },

  // Get claim requests
  getClaimRequests: async (status = 'pending') => {
    try {
      const response = await api.get('/api/startups/admin/claim-requests/', {
        params: { status }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch claim requests:', error);
      throw error;
    }
  },

  // Approve claim request
  approveClaimRequest: async (requestId, notes = '') => {
    try {
      const response = await api.post(`/api/startups/admin/claim-requests/${requestId}/approve/`, { notes });
      return response.data;
    } catch (error) {
      console.error('Failed to approve claim request:', error);
      throw error;
    }
  },

  // Reject claim request
  rejectClaimRequest: async (requestId, notes = '') => {
    try {
      const response = await api.post(`/api/startups/admin/claim-requests/${requestId}/reject/`, { notes });
      return response.data;
    } catch (error) {
      console.error('Failed to reject claim request:', error);
      throw error;
    }
  },
};

// Job-related helper methods
api.jobs = {
  // Get all job types
  getJobTypes: async () => {
    try {
      const response = await api.get('/api/jobs/types/');
      // Handle both paginated and direct array responses
      const data = response.data;
      if (data && data.results && Array.isArray(data.results)) {
        return data.results;
      } else if (Array.isArray(data)) {
        return data;
      } else {
        return [];
      }
    } catch (error) {
      console.error('Failed to fetch job types:', error);
      throw error;
    }
  },

  // Create a new job posting
  create: async (jobData) => {
    try {
      const response = await api.post('/api/jobs/', jobData);
      return response.data;
    } catch (error) {
      console.error('Failed to create job:', error);
      throw error;
    }
  },

  // Get all jobs with filters
  list: async (params = {}) => {
    try {
      const response = await api.get('/api/jobs/', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      throw error;
    }
  },

  // Get a single job
  get: async (id) => {
    try {
      const response = await api.get(`/api/jobs/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch job ${id}:`, error);
      throw error;
    }
  },

  // Update a job
  update: async (id, jobData) => {
    try {
      const response = await api.put(`/api/jobs/${id}/`, jobData);
      return response.data;
    } catch (error) {
      console.error(`Failed to update job ${id}:`, error);
      throw error;
    }
  },

  // Delete a job
  delete: async (id) => {
    try {
      const response = await api.delete(`/api/jobs/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Failed to delete job ${id}:`, error);
      throw error;
    }
  },

  // Apply to a job
  apply: async (jobId, applicationData) => {
    try {
      const response = await api.post(`/api/jobs/${jobId}/apply/`, applicationData);
      return response.data;
    } catch (error) {
      console.error(`Failed to apply to job ${jobId}:`, error);
      throw error;
    }
  },

  // Get user's own jobs
  getMyJobs: async () => {
    try {
      console.log('🔍 Attempting to fetch my jobs...');
      const response = await api.get('/api/jobs/my-jobs/');
      console.log('✅ My jobs response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch my jobs from /jobs/my-jobs/:', error);
      
      // Try alternative endpoints
      try {
        console.log('🔄 Trying alternative endpoint with underscore...');
        const alternativeResponse = await api.get('/api/jobs/my_jobs/');
        console.log('✅ Alternative endpoint worked:', alternativeResponse.data);
        return alternativeResponse.data;
      } catch (alternativeError) {
        console.error('❌ Alternative endpoint also failed:', alternativeError);
        throw error; // Throw the original error
      }
    }
  },

  // Get user's applications
  getMyApplications: async () => {
    try {
      const response = await api.get('/api/jobs/my-applications/');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch my applications:', error);
      throw error;
    }
  },

  // Toggle bookmark for a job
  toggleBookmark: async (jobId) => {
    try {
      const response = await api.post(`/api/jobs/${jobId}/bookmark/`);
      return response.data;
    } catch (error) {
      console.error('Failed to toggle job bookmark:', error);
      throw error;
    }
  },

  // Search jobs (for navbar quick search)
  search: async (query, limit = 5) => {
    try {
      const response = await api.get('/api/jobs/', {
        params: { search: query, limit: limit }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to search jobs:', error);
      throw error;
    }
  },

  // Admin methods
  admin: {
    // Get all jobs for admin panel
    list: async (params = {}) => {
      try {
        const response = await api.get('/api/jobs/admin/', { params });
        return response.data;
      } catch (error) {
        console.error('Failed to fetch admin jobs:', error);
        throw error;
      }
    },

    // Admin action on a job (approve/reject/deactivate)
    action: async (jobId, action, data = {}) => {
      try {
        const response = await api.patch(`/api/jobs/${jobId}/admin/`, { action, ...data });
        return response.data;
      } catch (error) {
        console.error(`Failed to perform admin action ${action} on job ${jobId}:`, error);
        throw error;
      }
    },

    // Bulk admin actions
    bulkAction: async (jobIds, action, data = {}) => {
      try {
        const response = await api.post('/api/jobs/bulk-admin/', {
          job_ids: jobIds,
          action,
          ...data
        });
        return response.data;
      } catch (error) {
        console.error(`Failed to perform bulk admin action ${action}:`, error);
        throw error;
      }
    },

    // Get admin stats
    getStats: async () => {
      try {
        const response = await api.get('/api/jobs/admin_stats/');
        return response.data;
      } catch (error) {
        console.error('Failed to fetch admin stats:', error);
        throw error;
      }
    }
  }
};

// Authentication helper methods
api.auth = {
  // Login
  login: async (credentials) => {
    try {
      const response = await api.post('/api/auth/login/', credentials);
      return response.data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  // Logout
  logout: async () => {
    try {
      const response = await api.post('/api/auth/logout/');
      return response.data;
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  },

  // Register
  register: async (userData) => {
    try {
      const response = await api.post('/api/auth/register/', userData);
      return response.data;
    } catch (error) {
      console.error('Registration failed:', error);
      
      // If we get a 404, try direct URL
      if (error.response?.status === 404) {
        console.log('🔧 Registration got 404, trying direct URL...');
        try {
          const directResponse = await axios.post('http://44.219.216.107/api/auth/register/', userData, {
            headers: { 'Content-Type': 'application/json' }
          });
          console.log('✅ Direct registration URL worked:', directResponse.data);
          return directResponse.data;
        } catch (retryError) {
          console.error('❌ Direct registration URL also failed:', retryError);
        }
      }
      
      throw error;
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await api.get('/api/auth/user/');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      throw error;
    }
  },

  // Username validation and availability
  checkUsername: async (username) => {
    try {
      // Use the correct API endpoint path
      const response = await api.get(`/api/auth/check-username/?username=${encodeURIComponent(username)}`);
      return response.data;
    } catch (error) {
      console.error('Failed to check username:', error);
      
      // If we get a 404, try different URL patterns
      if (error.response?.status === 404) {
        console.log('🔧 Got 404, trying alternative URLs...');
        
        const attempts = [
          `http://44.219.216.107/api/auth/check-username/?username=${encodeURIComponent(username)}`,
          `https://startlinker.com/api/auth/check-username/?username=${encodeURIComponent(username)}`,
        ];
        
        for (const url of attempts) {
          try {
            console.log(`🔄 Trying: ${url}`);
            const retryResponse = await axios.get(url, { timeout: 5000 });
            console.log('✅ URL worked:', retryResponse.data);
            return retryResponse.data;
          } catch (retryError) {
            console.error(`❌ Failed: ${url}`, retryError.message);
          }
        }
      }
      
      // If it's a timeout or network error, try a simpler approach
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout') || error.message?.includes('Network Error')) {
        console.log('🔄 Timeout detected, trying direct backend connection...');
        
        // Try direct connection to the backend
        try {
          const directResponse = await axios.get(`http://51.21.246.24/api/auth/check-username/?username=${encodeURIComponent(username)}`, {
            timeout: 5000,
            headers: {
              'Content-Type': 'application/json',
            }
          });
          console.log('✅ Direct connection worked:', directResponse.data);
          return directResponse.data;
        } catch (directError) {
          console.error('❌ Direct connection also failed:', directError.message);
        }
      }
      
      throw error;
    }
  },

  validateUsername: async (username) => {
    try {
      const response = await api.post('/auth/validate-username/', { username });
      return response.data;
    } catch (error) {
      console.error('Failed to validate username:', error);
      throw error;
    }
  },

  getUsernameSuggestions: async (base, max = 5) => {
    try {
      const response = await api.get(`/auth/username-suggestions/?base=${encodeURIComponent(base)}&max=${max}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get username suggestions:', error);
      throw error;
    }
  },

  generateUsername: async (data) => {
    try {
      const response = await api.post('/auth/generate-username/', data);
      return response.data;
    } catch (error) {
      console.error('Failed to generate username:', error);
      throw error;
    }
  },

  // Profile picture methods
  uploadProfilePicture: async (file) => {
    try {
      console.log('API: Starting upload with file:', file);
      const formData = new FormData();
      formData.append('profile_picture', file);
      
      // Log FormData contents
      for (let pair of formData.entries()) {
        console.log('FormData entry:', pair[0], pair[1]);
      }
      
      // Don't set Content-Type header - let axios handle it for FormData
      const response = await api.post('/api/auth/upload-profile-picture/', formData, {
        // Remove Content-Type header to let axios set it with boundary
        headers: {
          // Let axios auto-set Content-Type for FormData
        },
        // Add these to ensure proper handling
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });
      
      console.log('API: Upload successful, response:', response.data);
      return response.data;
    } catch (error) {
      console.error('API: Failed to upload profile picture:', error);
      console.error('API: Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      throw error;
    }
  },

  deleteProfilePicture: async () => {
    try {
      const response = await api.delete('/api/auth/delete-profile-picture/');
      return response.data;
    } catch (error) {
      console.error('Failed to delete profile picture:', error);
      throw error;
    }
  },

  // Follow/Unfollow functionality
  followUser: async (userId) => {
    try {
      const response = await api.post('/api/social/follows/follow_user/', {
        user: String(userId),
        notify_on_posts: true,
        notify_on_stories: true,
        notify_on_achievements: false
      });
      
      // Log updated counts for debugging
      if (response.data.updated_counts) {
        console.log('Follow API - Updated counts received:', response.data.updated_counts);
      }
      
      return response.data;
    } catch (error) {
      console.error('Failed to follow user:', error);
      throw error;
    }
  },

  unfollowUser: async (userId) => {
    try {
      const response = await api.post('/api/social/follows/unfollow_user/', {
        user: String(userId)
      });
      
      // Log updated counts for debugging
      if (response.data.updated_counts) {
        console.log('Unfollow API - Updated counts received:', response.data.updated_counts);
      }
      
      return response.data;
    } catch (error) {
      console.error('Failed to unfollow user:', error);
      throw error;
    }
  },

  // Check follow status
  checkFollowStatus: async (userId) => {
    try {
      const response = await api.get('/api/social/follows/check_follow_status/', {
        params: { user_id: userId }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to check follow status:', error);
      throw error;
    }
  },

  // Get user profile with follow status
  getUserProfile: async (userId) => {
    try {
      const response = await api.get(`/api/auth/${userId}/`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch user profile ${userId}:`, error);
      throw error;
    }
  },

  // Get user's followers
  getUserFollowers: async (userId, params = {}) => {
    try {
      const response = await api.get(`/api/auth/users/${userId}/followers/`, { params });
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch followers for user ${userId}:`, error);
      throw error;
    }
  },

  // Get user's following
  getUserFollowing: async (userId, params = {}) => {
    try {
      const response = await api.get(`/api/auth/users/${userId}/following/`, { params });
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch following for user ${userId}:`, error);
      throw error;
    }
  },

  // Get user statistics
  getUserStats: async () => {
    try {
      const response = await api.get('/api/auth/stats/');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
      throw error;
    }
  }
};

// Posts-related helper methods
api.posts = {
  // Get all posts with filters
  list: async (params = {}) => {
    try {
      const response = await api.get('/api/posts/posts/', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      throw error;
    }
  },

  // Get a single post
  get: async (id) => {
    try {
      const response = await api.get(`/api/posts/posts/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch post ${id}:`, error);
      throw error;
    }
  },

  // Create a new post
  create: async (postData) => {
    try {
      // Configure headers for FormData if needed
      const config = {};
      if (postData instanceof FormData) {
        config.headers = {
          'Content-Type': 'multipart/form-data',
        };
        
        // Debug: Log FormData contents
        console.log('🔵 FormData contents:');
        for (let [key, value] of postData.entries()) {
          console.log(`${key}:`, value);
        }
      }
      
      const response = await api.post('/api/posts/posts/', postData, config);
      return response.data;
    } catch (error) {
      console.error('Failed to create post:', error);
      throw error;
    }
  },

  // Update a post
  update: async (id, postData) => {
    try {
      const response = await api.put(`/api/posts/posts/${id}/`, postData);
      return response.data;
    } catch (error) {
      console.error(`Failed to update post ${id}:`, error);
      throw error;
    }
  },

  // Delete a post
  delete: async (id) => {
    try {
      const response = await api.delete(`/api/posts/posts/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Failed to delete post ${id}:`, error);
      throw error;
    }
  },

  // React to a post
  react: async (postId, reactionType) => {
    try {
      const response = await api.post(`/api/posts/posts/${postId}/react/`, { 
        reaction_type: reactionType 
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to react to post ${postId}:`, error);
      throw error;
    }
  },

  // Bookmark a post
  bookmark: async (postId) => {
    try {
      const response = await api.post(`/api/posts/posts/${postId}/bookmark/`);
      return response.data;
    } catch (error) {
      console.error(`Failed to bookmark post ${postId}:`, error);
      throw error;
    }
  },

  // Share a post
  share: async (postId, platform = 'direct') => {
    try {
      const response = await api.post(`/api/posts/posts/${postId}/share/`, { platform });
      return response.data;
    } catch (error) {
      console.error(`Failed to share post ${postId}:`, error);
      throw error;
    }
  },

  // Get post comments
  getComments: async (postId, params = {}) => {
    try {
      const response = await api.get(`/api/posts/posts/${postId}/comments/`, { params });
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch comments for post ${postId}:`, error);
      throw error;
    }
  },

  // Add comment to post
  addComment: async (postId, commentData) => {
    try {
      const response = await api.post(`/api/posts/posts/${postId}/comments/`, commentData);
      return response.data;
    } catch (error) {
      console.error(`Failed to add comment to post ${postId}:`, error);
      throw error;
    }
  },

  // Get topics/hashtags
  getTopics: async (params = {}) => {
    try {
      const response = await api.get('/api/posts/topics/', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch topics:', error);
      throw error;
    }
  },

  // Get trending posts
  trending: async (params = {}) => {
    try {
      const response = await api.get('/api/posts/posts/trending/', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch trending posts:', error);
      throw error;
    }
  },

  // Get following feed
  following: async (params = {}) => {
    try {
      const response = await api.get('/api/posts/posts/following/', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch following feed:', error);
      throw error;
    }
  },

  // Get reactions summary for a post
  getReactionsSummary: async (postId) => {
    try {
      const response = await api.get(`/api/posts/posts/${postId}/reactions_summary/`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch reactions summary for post ${postId}:`, error);
      throw error;
    }
  },

  // Get intelligently ranked posts
  rankedFeed: async (params = {}) => {
    try {
      const response = await api.get('/api/posts/posts/ranked_feed/', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch ranked feed:', error);
      throw error;
    }
  },

  // Get smart personalized feed
  smartFeed: async (params = {}) => {
    try {
      const response = await api.get('/api/posts/posts/smart_feed/', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch smart feed:', error);
      throw error;
    }
  },

  // Track post view for ranking algorithm
  trackView: async (postId) => {
    try {
      const response = await api.post(`/api/posts/posts/${postId}/view/`);
      return response.data;
    } catch (error) {
      // Don't throw error for tracking failures to avoid disrupting user experience
      return null;
    }
  },

  // Vote on a poll
  votePoll: async (postId, optionId) => {
    try {
      const response = await api.post(`/api/posts/posts/${postId}/vote_poll/`, { 
        option_id: optionId 
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to vote on poll ${postId}:`, error);
      throw error;
    }
  },

  // Remove vote from a poll
  removePollVote: async (postId, optionId) => {
    try {
      const response = await api.delete(`/api/posts/posts/${postId}/remove_poll_vote/`, {
        data: { option_id: optionId }
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to remove vote from poll ${postId}:`, error);
      throw error;
    }
  }
};

// Comments-related helper methods
api.comments = {
  // Update a comment
  update: async (id, commentData) => {
    try {
      const response = await api.put(`/api/posts/comments/${id}/`, commentData);
      return response.data;
    } catch (error) {
      console.error(`Failed to update comment ${id}:`, error);
      throw error;
    }
  },

  // Delete a comment
  delete: async (id) => {
    try {
      const response = await api.delete(`/api/posts/comments/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Failed to delete comment ${id}:`, error);
      throw error;
    }
  },

  // React to a comment
  react: async (commentId, reactionType) => {
    try {
      const response = await api.post(`/api/posts/comments/${commentId}/react/`, { 
        reaction_type: reactionType 
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to react to comment ${commentId}:`, error);
      throw error;
    }
  },

  // Get comment replies
  getReplies: async (commentId, params = {}) => {
    try {
      const response = await api.get(`/api/posts/comments/${commentId}/replies/`, { params });
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch replies for comment ${commentId}:`, error);
      throw error;
    }
  },

  // Like a comment (using the react endpoint)
  like: async (commentId) => {
    try {
      const response = await api.post(`/api/posts/comments/${commentId}/like/`);
      return response.data;
    } catch (error) {
      console.error(`Failed to like comment ${commentId}:`, error);
      throw error;
    }
  },

  // Unlike a comment (using the react endpoint with DELETE)
  unlike: async (commentId) => {
    try {
      const response = await api.delete(`/api/posts/comments/${commentId}/like/`);
      return response.data;
    } catch (error) {
      console.error(`Failed to unlike comment ${commentId}:`, error);
      throw error;
    }
  },

  // Reply to a comment
  reply: async (postId, parentCommentId, content) => {
    try {
      const response = await api.post(`/api/posts/posts/${postId}/comments/`, {
        parent: parentCommentId,
        content: content
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to reply to comment ${parentCommentId}:`, error);
      throw error;
    }
  },

  // Load more replies for a comment
  loadMoreReplies: async (commentId, offset = 3, limit = 10) => {
    try {
      const response = await api.get(`/api/posts/comments/${commentId}/more_replies/`, {
        params: { offset, limit }
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to load more replies for comment ${commentId}:`, error);
      throw error;
    }
  }
};

// Messaging-related helper methods
api.messaging = {
  // Get unread message count
  getUnreadCount: async () => {
    try {
      const response = await api.get('/api/messaging/unread-count/');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch unread message count:', error);
      throw error;
    }
  },

  // Get all conversations
  getConversations: async () => {
    try {
      const response = await api.get('/api/messaging/conversations/');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      throw error;
    }
  },

  // Get conversation details
  getConversation: async (conversationId) => {
    try {
      const response = await api.get(`/api/messaging/conversations/${conversationId}/`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch conversation ${conversationId}:`, error);
      throw error;
    }
  },

  // Send a message
  sendMessage: async (messageData) => {
    try {
      const response = await api.post('/api/messaging/messages/', messageData);
      return response.data;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  },

  // Create conversation
  createConversation: async (conversationData) => {
    try {
      const response = await api.post('/api/messaging/conversations/', conversationData);
      return response.data;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      throw error;
    }
  },

  // Mark messages as read
  markAsRead: async (data) => {
    try {
      const response = await api.post('/api/messaging/mark-read/', data);
      return response.data;
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
      throw error;
    }
  }
};

// Analysis-related helper methods (Pitch Deck Analysis)
api.analysis = {
  // Get feature info (check if user is pro)
  getFeatureInfo: async () => {
    try {
      const response = await api.get('/analysis/feature/');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch analysis feature info:', error);
      throw error;
    }
  },

  // Upload pitch deck for analysis
  upload: async (file) => {
    try {
      const formData = new FormData();
      formData.append('deck_file', file);
      
      const response = await api.post('/analysis/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to upload pitch deck:', error);
      throw error;
    }
  },

  // Get analysis details
  get: async (id) => {
    try {
      const response = await api.get(`/analysis/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch analysis ${id}:`, error);
      throw error;
    }
  },

  // List user's analyses
  list: async () => {
    try {
      const response = await api.get('/analysis/');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch analyses:', error);
      throw error;
    }
  }
};

// Resume management endpoints
api.resumes = {
  // List user's resumes
  list: async () => {
    try {
      const response = await api.get('/api/auth/resumes/');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch resumes:', error);
      throw error;
    }
  },

  // Upload new resume
  upload: async (file, title, isDefault = false) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('is_default', isDefault);

      const response = await api.post('/api/auth/resumes/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to upload resume:', error);
      throw error;
    }
  },

  // Update resume
  update: async (id, data) => {
    try {
      const response = await api.put(`/api/auth/resumes/${id}/`, data);
      return response.data;
    } catch (error) {
      console.error(`Failed to update resume ${id}:`, error);
      throw error;
    }
  },

  // Delete resume
  delete: async (id) => {
    try {
      const response = await api.delete(`/api/auth/resumes/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Failed to delete resume ${id}:`, error);
      throw error;
    }
  },

  // Set as default
  setDefault: async (id) => {
    try {
      const response = await api.post(`/api/auth/resumes/${id}/set-default/`);
      return response.data;
    } catch (error) {
      console.error(`Failed to set resume ${id} as default:`, error);
      throw error;
    }
  },

  // Get default resume
  getDefault: async () => {
    try {
      const response = await api.get('/api/auth/resumes/default/');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch default resume:', error);
      throw error;
    }
  }
};

// Export the enhanced API instance
export default api;