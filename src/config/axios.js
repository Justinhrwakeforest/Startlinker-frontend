// src/config/axios.js
import axios from 'axios';

// Configure axios defaults
// Force HTTP for development to avoid SSL issues with Django dev server
const getBackendUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // For development, always use HTTP for Django dev server
  // Django's development server doesn't support HTTPS
  return 'http://localhost:8000';
};

const backendUrl = getBackendUrl();
axios.defaults.baseURL = backendUrl;
// Don't set a default Content-Type - let axios decide based on the data
// axios.defaults.headers.common['Content-Type'] = 'application/json';

// Log the configured backend URL for debugging
console.log('Backend URL configured:', backendUrl);

// Additional HTTP-only settings
axios.defaults.httpsAgent = null;
axios.defaults.maxRedirects = 0;

// Add CSRF token for Django
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';

// Add auth token if available
const token = localStorage.getItem('auth_token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Token ${token}`;
}

// Request interceptor to add auth token and ensure HTTP for backend
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    
    // Handle Content-Type based on data type
    if (config.data instanceof FormData) {
      // Remove any Content-Type header for FormData - let browser set it with boundary
      delete config.headers['Content-Type'];
      console.log('Request is FormData, letting browser set Content-Type');
    } else if (config.data && typeof config.data === 'object' && !config.headers['Content-Type']) {
      // Set Content-Type for JSON data if not already set
      config.headers['Content-Type'] = 'application/json';
    }
    
    // Force HTTP for localhost development
    if (config.baseURL) {
      config.baseURL = config.baseURL.replace('https://', 'http://');
    }
    
    // Ensure we're always making HTTP requests
    if (config.url) {
      config.url = config.url.replace('https://', 'http://');
    }
    
    console.log('Request details:', { 
      method: config.method, 
      url: config.url, 
      baseURL: config.baseURL,
      fullUrl: (config.baseURL || '') + (config.url || ''),
      isFormData: config.data instanceof FormData,
      headers: config.headers
    });
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('auth_token');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

export default axios;