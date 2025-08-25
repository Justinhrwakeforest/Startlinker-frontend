// src/components/NotificationsPage.js - View All Notifications Page
import React, { useState, useEffect } from 'react';
import { useNotifications } from './NotificationSystem';
import { Bell, CheckCircle, AlertCircle, Info, AlertTriangle, MessageCircle, Heart, UserPlus, Briefcase, Star, X, Eye, EyeOff } from 'lucide-react';

const NotificationsPage = () => {
  const { notifications, markAsRead, markAllAsRead, deleteNotification, loading, fetchNotifications, unreadCount } = useNotifications();
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [selectedType, setSelectedType] = useState('all'); // all, comment_startup, like_startup, etc.

  useEffect(() => {
    // Refresh notifications when page loads
    fetchNotifications();
  }, [fetchNotifications]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'comment_startup':
      case 'comment_post':
        return <MessageCircle className="w-5 h-5" />;
      case 'like_startup':
      case 'like_post':
        return <Heart className="w-5 h-5" />;
      case 'rating_startup':
        return <Star className="w-5 h-5" />;
      case 'follow_user':
        return <UserPlus className="w-5 h-5" />;
      case 'job_application':
        return <Briefcase className="w-5 h-5" />;
      case 'mention':
        return <MessageCircle className="w-5 h-5" />;
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getIconColor = (type, isRead) => {
    const baseColor = isRead ? 'text-gray-400' : '';
    switch (type) {
      case 'comment_startup':
      case 'comment_post':
      case 'mention':
        return `${baseColor || 'text-blue-500'}`;
      case 'like_startup':
      case 'like_post':
        return `${baseColor || 'text-red-500'}`;
      case 'rating_startup':
        return `${baseColor || 'text-yellow-500'}`;
      case 'follow_user':
        return `${baseColor || 'text-green-500'}`;
      case 'job_application':
        return `${baseColor || 'text-purple-500'}`;
      case 'success':
        return `${baseColor || 'text-green-500'}`;
      case 'error':
        return `${baseColor || 'text-red-500'}`;
      case 'warning':
        return `${baseColor || 'text-yellow-500'}`;
      default:
        return `${baseColor || 'text-gray-500'}`;
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' year' + (Math.floor(interval) > 1 ? 's' : '') + ' ago';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' month' + (Math.floor(interval) > 1 ? 's' : '') + ' ago';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' day' + (Math.floor(interval) > 1 ? 's' : '') + ' ago';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hour' + (Math.floor(interval) > 1 ? 's' : '') + ' ago';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minute' + (Math.floor(interval) > 1 ? 's' : '') + ' ago';
    
    return 'Just now';
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read && !notification.read) {
      markAsRead(notification.id);
    }
    // Add navigation logic based on notification type if needed
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    // Filter by read status
    if (filter === 'unread' && (notification.is_read || notification.read)) return false;
    if (filter === 'read' && !notification.is_read && !notification.read) return false;
    
    // Filter by type
    if (selectedType !== 'all' && (notification.notification_type || notification.type) !== selectedType) return false;
    
    return true;
  });

  // Get unique notification types for filter dropdown
  const notificationTypes = [...new Set(notifications.map(n => n.notification_type || n.type).filter(Boolean))];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-600">Manage all your notifications</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
                </div>
                <Bell className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Unread</p>
                  <p className="text-2xl font-bold text-blue-600">{unreadCount}</p>
                </div>
                <EyeOff className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Read</p>
                  <p className="text-2xl font-bold text-green-600">{notifications.length - unreadCount}</p>
                </div>
                <Eye className="w-8 h-8 text-green-400" />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Filter Tabs */}
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    filter === 'all' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    filter === 'unread' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
                <button
                  onClick={() => setFilter('read')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    filter === 'read' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Read
                </button>
              </div>

              {/* Type Filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                {notificationTypes.map(type => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark All as Read
                </button>
              )}
              <button
                onClick={fetchNotifications}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map((notification) => {
                const isRead = notification.is_read || notification.read;
                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-6 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !isRead ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-lg flex-shrink-0 ${
                        !isRead ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <div className={getIconColor(notification.notification_type || notification.type, isRead)}>
                          {getNotificationIcon(notification.notification_type || notification.type)}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className={`text-sm ${
                              !isRead ? 'font-semibold text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </p>
                            {notification.message && notification.message !== notification.title && (
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                            )}
                            <div className="flex items-center space-x-4 mt-2">
                              <p className="text-xs text-gray-500">
                                {getTimeAgo(notification.created_at || notification.timestamp)}
                              </p>
                              {!isRead && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  New
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            {!isRead && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                title="Mark as read"
                              >
                                <Eye className="w-4 h-4 text-gray-500" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                              title="Delete notification"
                            >
                              <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === 'unread' ? 'No unread notifications' : 
                 filter === 'read' ? 'No read notifications' :
                 'No notifications yet'}
              </h3>
              <p className="text-gray-500">
                {filter === 'unread' ? 'All caught up! Check back later for new updates.' :
                 filter === 'read' ? 'No notifications have been read yet.' :
                 'We\'ll notify you when something important happens.'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Notifications are updated automatically every 30 seconds
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;