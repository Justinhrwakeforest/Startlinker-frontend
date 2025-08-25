// src/components/social/AchievementNotification.js - Real-time achievement notifications
import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Star, Crown, Shield, Award, X, Sparkles } from 'lucide-react';
import axios from 'axios';
import '../../styles/achievement-animations.css';

const AchievementNotification = ({ currentUser }) => {
  const [notifications, setNotifications] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    if (!currentUser) return;

    // Check for new achievement notifications on component mount
    fetchAchievementNotifications();

    // Set up WebSocket for real-time updates
    setupWebSocket();

    // Fallback polling every 60 seconds (reduced frequency due to WebSocket)
    const interval = setInterval(fetchAchievementNotifications, 60000);

    return () => {
      clearInterval(interval);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [currentUser]);

  const setupWebSocket = () => {
    if (!currentUser) return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/achievements/`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('Achievement WebSocket connected');
      };

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'achievement_earned') {
          showAchievementPopup({
            id: data.notification_id,
            title: `Achievement Unlocked: ${data.achievement.name}!`,
            message: data.achievement.description,
            extra_data: data.achievement
          });
        } else if (data.type === 'achievement_progress') {
          // Show progress toast for significant milestones
          if (data.progress_percentage >= 50 && data.progress_percentage < 100) {
            showProgressToast({
              achievement_slug: data.achievement_slug,
              percentage: data.progress_percentage
            });
          }
        }
      };

      wsRef.current.onclose = () => {
        console.log('Achievement WebSocket disconnected');
        // Attempt to reconnect after 5 seconds
        setTimeout(setupWebSocket, 5000);
      };

      wsRef.current.onerror = (error) => {
        console.error('Achievement WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to setup WebSocket:', error);
    }
  };

  const fetchAchievementNotifications = async () => {
    try {
      const response = await axios.get('/api/notifications/?type=achievement_earned&unread=true');
      const achievementNotifications = response.data.results || response.data;
      
      if (achievementNotifications.length > 0) {
        // Show the most recent achievement
        const latestAchievement = achievementNotifications[0];
        showAchievementPopup(latestAchievement);
        
        // Mark as read
        await axios.patch(`/notifications/${latestAchievement.id}/`, { is_read: true });
      }
    } catch (error) {
      console.error('Error fetching achievement notifications:', error);
    }
  };

  const showAchievementPopup = (notification) => {
    const achievementData = notification.extra_data || {};
    setNotifications(prev => [...prev, {
      id: notification.id,
      name: extractAchievementName(notification.title),
      description: notification.message,
      rarity: achievementData.rarity || 'common',
      icon: achievementData.icon || '🏆',
      points: achievementData.points || 0,
      showTime: Date.now()
    }]);
    setShowNotification(true);

    // Auto-hide after 5 seconds
    setTimeout(() => {
      dismissNotification(notification.id);
    }, 5000);
  };

  const extractAchievementName = (title) => {
    // Extract achievement name from title like "Achievement Unlocked: First Post!"
    const match = title.match(/Achievement Unlocked: (.+)!/);
    return match ? match[1] : 'New Achievement';
  };

  const showProgressToast = (progressData) => {
    // Create a temporary toast for progress updates
    const progressToast = {
      id: `progress-${Date.now()}`,
      type: 'progress',
      achievement_slug: progressData.achievement_slug,
      percentage: progressData.percentage,
      message: `Achievement progress: ${Math.round(progressData.percentage)}% complete`,
      showTime: Date.now()
    };

    setNotifications(prev => [...prev, progressToast]);
    
    // Auto-hide progress toast after 3 seconds
    setTimeout(() => {
      dismissNotification(progressToast.id);
    }, 3000);
  };

  const dismissNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    if (notifications.length <= 1) {
      setShowNotification(false);
    }
    
    // Mark WebSocket notification as read if it's an achievement
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'mark_notification_read',
        notification_id: notificationId
      }));
    }
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-400 to-orange-500';
      case 'epic': return 'from-purple-500 to-pink-600';
      case 'rare': return 'from-blue-500 to-cyan-600';
      case 'uncommon': return 'from-green-500 to-emerald-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getRarityIcon = (rarity) => {
    switch (rarity) {
      case 'legendary': return Crown;
      case 'epic': return Trophy;
      case 'rare': return Star;
      case 'uncommon': return Shield;
      default: return Award;
    }
  };

  if (!showNotification || notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => {
        if (notification.type === 'progress') {
          return (
            <ProgressToast
              key={notification.id}
              notification={notification}
              onDismiss={() => dismissNotification(notification.id)}
            />
          );
        }
        return (
          <AchievementPopup
            key={notification.id}
            achievement={notification}
            onDismiss={() => dismissNotification(notification.id)}
          />
        );
      })}
    </div>
  );
};

const AchievementPopup = ({ achievement, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);
  const RarityIcon = getRarityIcon(achievement.rarity);

  useEffect(() => {
    // Trigger animation
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-400 to-orange-500';
      case 'epic': return 'from-purple-500 to-pink-600';
      case 'rare': return 'from-blue-500 to-cyan-600';
      case 'uncommon': return 'from-green-500 to-emerald-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getRarityIcon = (rarity) => {
    switch (rarity) {
      case 'legendary': return Crown;
      case 'epic': return Trophy;
      case 'rare': return Star;
      case 'uncommon': return Shield;
      default: return Award;
    }
  };

  return (
    <div 
      className={`relative transform transition-all duration-500 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      {/* Achievement notification card */}
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 max-w-sm">
        {/* Close button */}
        <button
          onClick={onDismiss}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Sparkle animation */}
        <div className="absolute -top-2 -right-2">
          <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
        </div>

        {/* Content */}
        <div className="text-center">
          {/* Achievement title */}
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              🎉 Achievement Unlocked!
            </h3>
            <div className="w-12 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 mx-auto rounded-full"></div>
          </div>

          {/* Achievement badge */}
          <div className={`w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br ${getRarityColor(achievement.rarity)} 
            p-1 shadow-xl animate-achievement-earn relative
            ${achievement.rarity === 'legendary' ? 'legendary-badge' : achievement.rarity === 'epic' ? 'epic-badge' : ''}`}>
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center relative overflow-hidden">
              <div className="text-3xl animate-bounce-in">{achievement.icon}</div>
              
              {/* Shimmer effect for legendary */}
              {achievement.rarity === 'legendary' && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-200 to-transparent 
                  opacity-100 animate-shimmer legendary-shimmer"></div>
              )}
              
              {/* Sparkle effects */}
              {['rare', 'epic', 'legendary'].includes(achievement.rarity) && (
                <>
                  <div className="absolute -top-1 -left-1 w-2 h-2 bg-yellow-400 rounded-full animate-rare-sparkle sparkle-effect"></div>
                  <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-white rounded-full animate-rare-sparkle sparkle-effect animation-delay-300"></div>
                </>
              )}
            </div>
          </div>

          {/* Achievement info */}
          <div className="mb-4">
            <h4 className="text-xl font-bold text-gray-900 mb-2">
              {achievement.name}
            </h4>
            <p className="text-gray-600 text-sm mb-3">
              {achievement.description}
            </p>
            
            <div className="flex items-center justify-center space-x-4">
              <div className={`flex items-center space-x-1 px-3 py-1 rounded-full bg-gradient-to-r ${getRarityColor(achievement.rarity)}`}>
                <RarityIcon className="w-3 h-3 text-white" />
                <span className="text-white text-xs font-medium capitalize">
                  {achievement.rarity}
                </span>
              </div>
              {achievement.points > 0 && (
                <div className="flex items-center space-x-1 px-3 py-1 bg-gray-100 rounded-full">
                  <Star className="w-3 h-3 text-gray-600" />
                  <span className="text-gray-600 text-xs font-medium">
                    +{achievement.points} pts
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={() => window.location.href = '/achievements'}
            className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-colors text-sm font-medium"
          >
            View All Achievements
          </button>
        </div>
      </div>
    </div>
  );
};

// Progress Toast Component
const ProgressToast = ({ notification, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  return (
    <div 
      className={`transform transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg shadow-lg p-4 max-w-xs">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">📊</div>
          <div className="flex-1">
            <div className="font-medium text-sm">Achievement Progress!</div>
            <div className="text-xs opacity-90">{notification.message}</div>
            <div className="w-full bg-white/20 rounded-full h-2 mt-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-500"
                style={{ width: `${notification.percentage}%` }}
              ></div>
            </div>
          </div>
          <button onClick={onDismiss} className="text-white/80 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Hook for programmatically triggering achievement notifications
export const useAchievementNotification = () => {
  const showAchievement = (achievementData) => {
    // Dispatch custom event for achievement notification
    const event = new CustomEvent('showAchievement', {
      detail: achievementData
    });
    window.dispatchEvent(event);
  };

  return { showAchievement };
};

// Achievement toast for immediate feedback
export const AchievementToast = ({ achievement, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!achievement) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 transform transition-all duration-300 animate-slide-up">
      <div className="bg-gradient-to-r from-green-400 to-green-600 text-white rounded-lg shadow-lg p-4 max-w-xs">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">{achievement.icon}</div>
          <div className="flex-1">
            <div className="font-medium text-sm">Achievement Progress!</div>
            <div className="text-xs opacity-90">{achievement.message}</div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AchievementNotification;