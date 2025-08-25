// API Configuration
const getApiUrl = () => {
  // Priority order:
  // 1. Environment variable
  // 2. Window location (for dynamic deployment)
  // 3. Fallback to production server
  
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // If running on production domain, use HTTPS with /api path
  if (window.location.hostname === 'startlinker.com' || 
      window.location.hostname === 'www.startlinker.com' ||
      window.location.hostname.includes('startlinker') && window.location.hostname.includes('onrender.com')) {
    // For Render deployment, use the backend service URL
    if (window.location.hostname.includes('onrender.com')) {
      return 'https://startlinker-backend.onrender.com';
    }
    return `https://${window.location.hostname}/api`;  // Include /api in baseURL
  }
  
  // Development or direct IP access
  if (window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8000/api';
  }
  
  // For EC2 deployment, use current hostname to avoid hardcoded IP
  if (window.location.hostname && window.location.hostname !== 'localhost') {
    return `http://${window.location.hostname}/api`;
  }
  
  // Fallback to AWS EC2 instance (correct IP from AWS console)
  return 'http://51.21.246.24/api';
};

const getWebSocketUrl = () => {
  const apiUrl = getApiUrl();
  return apiUrl.replace('http://', 'ws://').replace('https://', 'wss://');
};

export const API_CONFIG = {
  baseURL: getApiUrl(),
  wsURL: getWebSocketUrl(),
  timeout: 10000, // Reduced timeout for faster feedback
  withCredentials: true,
};

export default API_CONFIG;