// API Configuration
const getApiUrl = () => {
  // Priority order:
  // 1. Environment variable (for production deployment)
  // 2. Local development
  // 3. Production backend
  
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Development
  if (window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8000';
  }
  
  // Production fallback - always use Render backend
  return 'https://startlinker-backend.onrender.com';
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