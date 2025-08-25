// src/components/NotificationSystem.js - Enhanced with real-time features
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Bell, MessageCircle, Heart, UserPlus, Briefcase, Star } from 'lucide-react';

// Notification Context
const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Notification Provider
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [apiNotifications, setApiNotifications] = useState([]); // For API fetched notifications
  const [unreadCount, setUnreadCount] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(false);

  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      type: 'info', // info, success, warning, error
      title: '',
      message: '',
      duration: 5000, // 5 seconds default
      persistent: false, // if true, won't auto-dismiss
      actions: [], // array of action buttons
      ...notification,
      timestamp: new Date()
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Auto remove notification after duration (unless persistent)
    if (newNotification.duration > 0 && !newNotification.persistent) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    // Play notification sound (optional) - disabled for better UX
    // if (newNotification.type === 'success' || newNotification.type === 'error') {
    //   playNotificationSound(newNotification.type);
    // }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const markAsRead = useCallback(async (id) => {
    // Mark local notification as read
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
    
    // Mark API notification as read
    setApiNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, is_read: true }
          : notification
      )
    );
    
    // Update unread count
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    // If it's an API notification, update on server
    try {
      await api.patch(`/api/notifications/${id}/`, { is_read: true });
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setApiNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    
    try {
      await api.post('/api/notifications/mark_all_read/');
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const deleteNotification = useCallback(async (id) => {
    // Remove from local notifications
    setNotifications(prev => prev.filter(n => n.id !== id));
    
    // Remove from API notifications
    const wasUnread = apiNotifications.find(n => n.id === id && !n.is_read);
    setApiNotifications(prev => prev.filter(n => n.id !== id));
    
    if (wasUnread) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    
    // Delete on server
    try {
      await api.delete(`/api/notifications/${id}/`);
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  }, [apiNotifications]);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    console.log('🔔 Fetching notifications...');
    setLoading(true);
    try {
      const response = await api.get('/api/notifications/');
      console.log('🔔 Notifications response:', response.data);
      const fetchedNotifications = response.data.results || response.data;
      console.log('🔔 Processed notifications:', fetchedNotifications);
      setApiNotifications(fetchedNotifications);
      const unread = fetchedNotifications.filter(n => !n.is_read).length;
      console.log('🔔 Unread count:', unread);
      setUnreadCount(unread); // Set exact count, don't add to existing
    } catch (err) {
      console.error('🔔 Failed to fetch notifications:', err);
      console.error('🔔 Auth token:', localStorage.getItem('auth_token') ? 'Present' : 'Missing');
      // Only show error if user is authenticated
      if (localStorage.getItem('auth_token')) {
        setApiNotifications([]);
        setUnreadCount(0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const playNotificationSound = (type) => {
    // Only play sounds if user has interacted with the page
    try {
      const audio = new Audio();
      if (type === 'success') {
        // You can add actual sound files here
        audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgYAy+d2vPGeSgGKH7L79OEOAUXb7v0x4s7CB5/+a+'; // placeholder
      } else if (type === 'error') {
        audio.src = 'data:audio/wav;base64,UklGRtIGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YW4GAAA='; // placeholder
      }
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore audio play errors (user hasn't interacted with page yet)
      });
    } catch (error) {
      console.log('Could not play notification sound:', error);
    }
  };

  // Check for browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Load notifications on mount
  useEffect(() => {
    // Only fetch if user is authenticated
    if (localStorage.getItem('auth_token')) {
      fetchNotifications();
      
      // Set up polling for new notifications
      const interval = setInterval(fetchNotifications, 30000); // Check every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [fetchNotifications]);

  const showBrowserNotification = useCallback((notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const browserNotif = new Notification(notification.title || 'StartLinker Notification', {
          body: notification.message,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: `startlinker-${notification.id}`,
          requireInteraction: notification.persistent
        });

        browserNotif.onclick = () => {
          window.focus();
          browserNotif.close();
          markAsRead(notification.id);
        };

        // Auto-close after duration
        if (!notification.persistent) {
          setTimeout(() => {
            browserNotif.close();
          }, notification.duration || 5000);
        }
      } catch (error) {
        console.log('Could not show browser notification:', error);
      }
    }
  }, [markAsRead]);

  const value = {
    notifications: [...apiNotifications, ...notifications], // Combine both types
    unreadCount,
    isVisible,
    setIsVisible,
    loading,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    deleteNotification,
    fetchNotifications,
    showBrowserNotification,
    
    // Convenience methods
    success: (message, title = 'Success', options = {}) => {
      // Make success notifications less intrusive by default
      const id = addNotification({ 
        type: 'success', 
        title, 
        message, 
        duration: 2000, // Shorter duration
        ...options 
      });
      // Disable browser notifications for success by default
      if (options.showBrowser === true) {
        showBrowserNotification({ id, type: 'success', title, message, ...options });
      }
      return id;
    },
    
    error: (message, title = 'Error', options = {}) => {
      const id = addNotification({ 
        type: 'error', 
        title, 
        message, 
        duration: 7000, 
        ...options 
      });
      if (options.showBrowser) {
        showBrowserNotification({ id, type: 'error', title, message, ...options });
      }
      return id;
    },
    
    warning: (message, title = 'Warning', options = {}) => {
      const id = addNotification({ 
        type: 'warning', 
        title, 
        message, 
        ...options 
      });
      if (options.showBrowser) {
        showBrowserNotification({ id, type: 'warning', title, message, ...options });
      }
      return id;
    },
    
    info: (message, title = 'Info', options = {}) => {
      const id = addNotification({ 
        type: 'info', 
        title, 
        message, 
        ...options 
      });
      if (options.showBrowser) {
        showBrowserNotification({ id, type: 'info', title, message, ...options });
      }
      return id;
    },

    // Job application specific notifications
    jobApplicationSuccess: (jobTitle, companyName) => {
      return addNotification({
        type: 'success',
        title: 'Application Submitted!',
        message: `Your application for ${jobTitle} at ${companyName} has been sent successfully.`,
        duration: 8000,
        actions: [
          {
            label: 'View Applications',
            action: () => window.location.href = '/profile?tab=applications'
          }
        ]
      });
    },

    bookmarkAdded: (startupName) => {
      return addNotification({
        type: 'success',
        title: 'Bookmark Added',
        message: `${startupName} has been added to your bookmarks.`,
        duration: 3000
      });
    },

    ratingSubmitted: (startupName, rating) => {
      return addNotification({
        type: 'success',
        title: 'Rating Submitted',
        message: `You rated ${startupName} ${rating} star${rating !== 1 ? 's' : ''}.`,
        duration: 4000
      });
    }
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

// Individual Notification Component
const NotificationItem = ({ notification, onRemove, onMarkAsRead, onAction }) => {
  const [isLeaving, setIsLeaving] = useState(false);
  const [timeLeft, setTimeLeft] = useState(notification.duration);

  const handleRemove = () => {
    setIsLeaving(true);
    setTimeout(() => onRemove(notification.id), 300); // Animation duration
  };

  const handleMarkAsRead = () => {
    if (!notification.read && !notification.is_read) {
      onMarkAsRead(notification.id);
    }
  };

  // Countdown timer for non-persistent notifications
  useEffect(() => {
    if (!notification.persistent && notification.duration > 0) {
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 100) {
            handleRemove();
            return 0;
          }
          return prev - 100;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [notification.persistent, notification.duration]);

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getStyles = () => {
    const baseStyles = "border-l-4 shadow-lg relative overflow-hidden";
    switch (notification.type) {
      case 'success':
        return `${baseStyles} bg-green-50 border-green-400 text-green-800`;
      case 'error':
        return `${baseStyles} bg-red-50 border-red-400 text-red-800`;
      case 'warning':
        return `${baseStyles} bg-yellow-50 border-yellow-400 text-yellow-800`;
      default:
        return `${baseStyles} bg-blue-50 border-blue-400 text-blue-800`;
    }
  };

  const getIconColor = () => {
    switch (notification.type) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      default:
        return 'text-blue-400';
    }
  };

  const progressPercentage = notification.duration > 0 && !notification.persistent 
    ? (timeLeft / notification.duration) * 100 
    : 100;

  return (
    <div
      className={`max-w-[calc(100vw-2rem)] sm:max-w-sm w-full bg-white rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden transform transition-all duration-300 ease-in-out ${
        isLeaving ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
      } ${!notification.read && !notification.is_read ? 'ring-2 ring-blue-400' : ''}`}
      onClick={handleMarkAsRead}
    >
      <div className={`p-4 ${getStyles()}`}>
        <div className="flex items-start">
          <div className={`flex-shrink-0 ${getIconColor()}`}>
            {getIcon()}
          </div>
          <div className="ml-3 w-0 flex-1">
            <div className="flex items-center justify-between">
              {notification.title && (
                <p className="text-sm font-medium">{notification.title}</p>
              )}
              {!notification.read && !notification.is_read && (
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2"></div>
              )}
            </div>
            <p className={`text-sm ${notification.title ? 'mt-1' : ''}`}>
              {notification.message}
            </p>
            
            {/* Timestamp */}
            <p className="text-xs opacity-75 mt-1">
              {new Date(notification.timestamp || notification.created_at).toLocaleTimeString()}
            </p>

            {/* Action buttons */}
            {notification.actions && notification.actions.length > 0 && (
              <div className="mt-3 flex space-x-2">
                {notification.actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      action.action();
                      onAction && onAction(notification.id, action);
                    }}
                    className="text-xs font-medium underline hover:no-underline transition-all"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress bar for timed notifications */}
        {!notification.persistent && notification.duration > 0 && (
          <div className="absolute bottom-0 left-0 h-1 bg-gray-200 w-full">
            <div 
              className={`h-full transition-all duration-100 ease-linear ${
                notification.type === 'success' ? 'bg-green-400' :
                notification.type === 'error' ? 'bg-red-400' :
                notification.type === 'warning' ? 'bg-yellow-400' :
                'bg-blue-400'
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Notification Container
const NotificationContainer = () => {
  const { notifications, removeNotification, markAsRead, isVisible, deleteNotification } = useNotifications();

  if (!isVisible) return null;

  // Filter only local notifications for toast display
  const localNotifications = notifications.filter(n => n.duration !== undefined);

  return (
    <div className="fixed inset-0 flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 sm:items-start sm:justify-end z-50">
      <div className="w-full flex flex-col items-center space-y-4 sm:items-end max-h-screen overflow-y-auto pb-16 sm:pb-0">
        {localNotifications.slice(0, 5).map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onRemove={notification.duration !== undefined ? removeNotification : deleteNotification}
            onMarkAsRead={markAsRead}
          />
        ))}
        
        {/* Show count if more than 5 notifications */}
        {localNotifications.length > 5 && (
          <div className="max-w-sm w-full bg-gray-800 text-white rounded-lg p-3 pointer-events-auto text-center text-sm">
            +{localNotifications.length - 5} more notifications
          </div>
        )}
      </div>
    </div>
  );
};

// Notification Bell Component for Navbar
export const NotificationBell = ({ className = "" }) => {
  const { unreadCount, notifications, markAllAsRead, isVisible, setIsVisible, markAsRead, deleteNotification, loading } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unread

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'comment_startup':
      case 'comment_post':
        return <MessageCircle className="w-4 h-4" />;
      case 'like_startup':
      case 'like_post':
        return <Heart className="w-4 h-4" />;
      case 'rating_startup':
        return <Star className="w-4 h-4" />;
      case 'follow_user':
        return <UserPlus className="w-4 h-4" />;
      case 'job_application':
        return <Briefcase className="w-4 h-4" />;
      case 'mention':
        return <MessageCircle className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + 'y ago';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + 'mo ago';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + 'd ago';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + 'h ago';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + 'm ago';
    
    return 'Just now';
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read && !notification.read) {
      markAsRead(notification.id);
    }
    // Navigate to relevant page based on notification type
    // This would be implemented based on your routing setup
    setIsOpen(false);
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.is_read && !n.read)
    : notifications;

  // Debug logging
  console.log('🔔 NotificationBell Debug:', {
    isOpen,
    filter,
    totalNotifications: notifications.length,
    filteredNotifications: filteredNotifications.length,
    unreadCount,
    apiNotifications: notifications.filter(n => n.notification_type).length
  });

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={toggleDropdown}
        className="relative p-2 text-gray-600 hover:text-blue-600 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors focus:outline-none"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Dropdown */}
          <div className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 top-20 sm:top-auto sm:mt-2 w-auto sm:w-96 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-gray-100 z-50 max-h-[calc(100vh-8rem)] sm:max-h-[600px] overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              
              {/* Filter Tabs */}
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setFilter('all')}
                  className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-colors ${
                    filter === 'all' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-colors ${
                    filter === 'unread' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto max-h-[calc(100vh-20rem)] sm:max-h-[400px]">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading notifications...</p>
                </div>
              ) : filteredNotifications.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notification.is_read && !notification.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${
                          !notification.is_read && !notification.read ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          {getNotificationIcon(notification.notification_type || notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${
                            !notification.is_read && !notification.read ? 'font-semibold text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </p>
                          {notification.message && notification.message !== notification.title && (
                            <p className="text-xs text-gray-600 mt-0.5">
                              {notification.message}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {getTimeAgo(notification.created_at || notification.timestamp)}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                          <X className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">
                    {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-100">
              <a
                href="/notifications"
                className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all notifications
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Hook for API integration with enhanced features
export const useApiNotifications = () => {
  const { success, error, warning, info, jobApplicationSuccess, bookmarkAdded, ratingSubmitted } = useNotifications();

  const handleApiResponse = (response, successMessage = 'Operation completed successfully') => {
    if (response.status >= 200 && response.status < 300) {
      success(successMessage);
    }
    return response;
  };

  const handleApiError = (err, customMessage) => {
    const message = customMessage || 
                   err.response?.data?.message || 
                   err.response?.data?.error || 
                   err.message || 
                   'An error occurred';
    
    // Enhanced error handling with retry options for network errors
    if (err.code === 'NETWORK_ERROR' || err.response?.status >= 500) {
      error(message, 'Network Error', {
        persistent: true,
        actions: [
          {
            label: 'Retry',
            action: () => window.location.reload()
          }
        ]
      });
    } else {
      error(message);
    }
    
    throw err;
  };

  return {
    success,
    error,
    warning,
    info,
    handleApiResponse,
    handleApiError,
    jobApplicationSuccess,
    bookmarkAdded,
    ratingSubmitted
  };
};

export default NotificationProvider;