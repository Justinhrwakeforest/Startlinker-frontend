// Force HTTP for development
export const forceHttpInDevelopment = () => {
  // Check if we're on localhost with HTTPS
  if (window.location.hostname === 'localhost' && window.location.protocol === 'https:') {
    console.warn('Detected HTTPS on localhost, redirecting to HTTP...');
    // Redirect to HTTP version
    window.location.href = window.location.href.replace('https://', 'http://');
  }
};

// Helper to ensure HTTP URLs
export const ensureHttpUrl = (url) => {
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    return url.replace('https://', 'http://');
  }
  return url;
};