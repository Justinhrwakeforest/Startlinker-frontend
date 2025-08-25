// src/hooks/useAchievementRefresh.js - Hook for refreshing achievement displays
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export const useAchievementRefresh = (userId) => {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const wsRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    // Initial load
    fetchAchievements();

    // Set up WebSocket for real-time updates
    setupWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [userId]);

  const setupWebSocket = () => {
    if (!userId) return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/achievements/`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('Achievement refresh WebSocket connected');
      };

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'achievement_earned') {
          // Refresh achievements list when new achievement is earned
          setTimeout(fetchAchievements, 1000); // Small delay to ensure backend is updated
        } else if (data.type === 'achievement_progress') {
          // Update progress for specific achievement
          updateAchievementProgress(data.achievement_slug, data.progress_percentage);
        }
      };

      wsRef.current.onclose = () => {
        console.log('Achievement refresh WebSocket disconnected');
        // Attempt to reconnect after 5 seconds
        setTimeout(setupWebSocket, 5000);
      };

      wsRef.current.onerror = (error) => {
        console.error('Achievement refresh WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to setup refresh WebSocket:', error);
    }
  };

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/social/achievements/?user=${userId}`);
      setAchievements(response.data.results || response.data);
      setLastRefresh(Date.now());
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAchievementProgress = (achievementSlug, progressPercentage) => {
    setAchievements(prev => prev.map(achievement => {
      if (achievement.slug === achievementSlug) {
        return {
          ...achievement,
          progress_percentage: progressPercentage,
          is_in_progress: progressPercentage > 0 && progressPercentage < 100
        };
      }
      return achievement;
    }));
  };

  const refreshAchievements = () => {
    fetchAchievements();
  };

  return {
    achievements,
    loading,
    lastRefresh,
    refreshAchievements,
    realTimeUpdates: wsRef.current?.readyState === WebSocket.OPEN
  };
};

// Hook for badge display components that need to stay updated
export const useBadgeDisplay = (userId) => {
  const [badgeCount, setBadgeCount] = useState(0);
  const [recentBadges, setRecentBadges] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    fetchBadgeData();
    setupBadgeWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [userId]);

  const setupBadgeWebSocket = () => {
    if (!userId) return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/achievements/`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'achievement_earned') {
          // Update badge count and recent badges
          setBadgeCount(prev => prev + 1);
          setRecentBadges(prev => [data.achievement, ...prev.slice(0, 5)]); // Keep 6 most recent
        } else if (data.type === 'achievement_count') {
          setBadgeCount(data.count);
        }
      };

      wsRef.current.onopen = () => {
        // Request current achievement count
        wsRef.current.send(JSON.stringify({
          type: 'get_achievement_count'
        }));
      };
    } catch (error) {
      console.error('Failed to setup badge WebSocket:', error);
    }
  };

  const fetchBadgeData = async () => {
    try {
      const [countResponse, recentResponse] = await Promise.all([
        axios.get(`/social/achievements/count/?user=${userId}`),
        axios.get(`/social/achievements/?user=${userId}&limit=6&order=recent`)
      ]);

      setBadgeCount(countResponse.data.count || 0);
      setRecentBadges(recentResponse.data.results || recentResponse.data || []);
    } catch (error) {
      console.error('Error fetching badge data:', error);
    }
  };

  return {
    badgeCount,
    recentBadges,
    isConnected: wsRef.current?.readyState === WebSocket.OPEN
  };
};

export default useAchievementRefresh;