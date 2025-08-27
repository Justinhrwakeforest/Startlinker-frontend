/**
 * Navigation fix utilities to handle intermittent routing issues
 */

// Handle navigation errors and refresh issues
export const handleNavigationError = (error, navigate) => {
  console.warn('Navigation error detected:', error);
  
  // If we get a navigation error, try to gracefully recover
  const currentPath = window.location.pathname;
  
  // List of valid routes in our app
  const validRoutes = [
    '/', '/social', '/startups', '/jobs', '/profile', '/settings',
    '/messages', '/notifications', '/bookmarks', '/activity', '/help',
    '/my-claims', '/my-jobs', '/auth', '/welcome', '/terms', '/privacy'
  ];
  
  // Check if current path starts with any valid route
  const isValidRoute = validRoutes.some(route => 
    currentPath === route || currentPath.startsWith(route + '/')
  );
  
  if (!isValidRoute) {
    console.log('Invalid route detected, redirecting to dashboard');
    navigate('/', { replace: true });
  }
};

// Add navigation event listeners
export const setupNavigationListeners = (navigate) => {
  // Handle browser back/forward button issues
  window.addEventListener('popstate', (event) => {
    const currentPath = window.location.pathname;
    
    // If we end up on an invalid route, redirect
    setTimeout(() => {
      if (document.title === 'Not Found' || !document.querySelector('#root').children.length) {
        console.log('Detected navigation to invalid route, fixing...');
        navigate('/', { replace: true });
      }
    }, 100);
  });
  
  // Handle page visibility changes (when tab becomes active again)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      // Check if we're on a broken page when tab becomes visible
      setTimeout(() => {
        if (document.body.innerText.includes('Not Found') && 
            !window.location.pathname.includes('/404')) {
          console.log('Detected broken page on tab focus, refreshing...');
          window.location.reload();
        }
      }, 500);
    }
  });
};

// Force refresh if we detect a broken state
export const detectAndFixBrokenState = () => {
  // Check every 30 seconds if we're in a broken state
  const checkInterval = setInterval(() => {
    const hasContent = document.querySelector('#root').children.length > 0;
    const isNotFoundPage = document.body.innerText.includes('Not Found');
    const shouldHaveContent = !window.location.pathname.includes('/404');
    
    if (!hasContent && shouldHaveContent) {
      console.log('Detected broken app state, refreshing...');
      window.location.reload();
    }
    
    // Stop checking after 5 minutes
    setTimeout(() => clearInterval(checkInterval), 5 * 60 * 1000);
  }, 30000);
};

// Enhanced error boundary recovery
export const recoverFromRoutingError = () => {
  try {
    // Clear any corrupted router state
    if (window.history.state) {
      window.history.replaceState(null, '', window.location.pathname);
    }
    
    // Force React Router to re-evaluate current route
    window.dispatchEvent(new PopStateEvent('popstate'));
    
  } catch (error) {
    console.error('Error in routing recovery:', error);
    // Last resort: reload the page
    window.location.reload();
  }
};