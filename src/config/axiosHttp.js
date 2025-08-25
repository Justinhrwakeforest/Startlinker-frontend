// Force HTTP axios instance for development
import axios from 'axios';

// Create a new axios instance specifically for HTTP
const httpAxios = axios.create({
  baseURL: 'http://13.50.234.250',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  maxRedirects: 0,
  validateStatus: function (status) {
    return status >= 200 && status < 400; // Don't follow redirects
  },
});

// Add CSRF token for Django
httpAxios.defaults.xsrfCookieName = 'csrftoken';
httpAxios.defaults.xsrfHeaderName = 'X-CSRFToken';

// Request interceptor to add auth token
httpAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    
    // Handle FormData - remove Content-Type to let browser set multipart boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    // Log the request
    console.log('HTTP Request:', config.method?.toUpperCase(), config.url);
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
httpAxios.interceptors.response.use(
  (response) => {
    console.log('HTTP Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('HTTP Error:', error.response?.status, error.config?.url, error.message);
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('auth_token');
      if (!window.location.pathname.includes('/auth')) {
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);

export default httpAxios;