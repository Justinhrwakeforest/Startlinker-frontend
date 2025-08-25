// src/components/social/AchievementBadges.js - Achievement badges display and management
import React, { useState, useEffect } from 'react';
import { 
  Award, Trophy, Star, Crown, Shield, Zap, Target, 
  Clock, Users, TrendingUp, Sparkles, Lock, Info,
  ChevronDown, Filter, Search, Grid, List, X
} from 'lucide-react';
import axios from '../../config/axios';
import { useAchievementRefresh } from '../../hooks/useAchievementRefresh';
import '../../styles/achievement-animations.css';

const AchievementBadges = ({ currentUser, userId = null, compact = false, onViewAll = null }) => {
  const targetUserId = userId || currentUser?.id;
  const { achievements: refreshedAchievements, loading: refreshLoading, realTimeUpdates } = useAchievementRefresh(targetUserId);
  
  const [achievements, setAchievements] = useState([]);
  const [availableAchievements, setAvailableAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('earned'); // earned, available, locked
  const [filter, setFilter] = useState('all'); // all, common, rare, epic, legendary
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedBadge, setSelectedBadge] = useState(null);

  // Update achievements when real-time data changes
  useEffect(() => {
    if (refreshedAchievements.length > 0) {
      setAchievements(refreshedAchievements);
    }
  }, [refreshedAchievements]);

  useEffect(() => {
    console.log('AchievementBadges mounted/updated with:', {
      currentUser,
      userId,
      targetUserId,
      hasAuth: !!localStorage.getItem('auth_token')
    });
    fetchAchievements();
  }, [userId, currentUser?.id]);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const targetUserId = userId || currentUser?.id;
      
      if (!targetUserId) return;

      // Use the correct endpoints based on the backend URL patterns
      const [earnedRes, allRes, summaryRes] = await Promise.all([
        // Get user's earned achievements
        axios.get('/api/social/user-achievements/'),
        // Get all available achievements
        axios.get('/api/social/achievements/'),
        // Get comprehensive achievements summary with better data
        axios.get(`/users/${targetUserId}/achievements-summary/`).catch(() => null)
      ]);

      const earnedAchievements = earnedRes.data.results || earnedRes.data;
      const allAchievements = allRes.data.results || allRes.data;
      
      // Log what we received
      console.log('API Responses:', {
        earnedRes: earnedRes.data,
        allRes: allRes.data,
        summaryRes: summaryRes?.data
      });
      
      // If we got summary data, use it for better display
      if (summaryRes && summaryRes.data) {
        const summary = summaryRes.data;
        console.log('Using summary data:', summary);
        
        if (summary.earned_achievements && summary.earned_achievements.length > 0) {
          setAchievements(summary.earned_achievements);
          console.log('Set earned achievements from summary:', summary.earned_achievements.length);
        } else {
          setAchievements(earnedAchievements);
          console.log('Set earned achievements from user-achievements endpoint:', earnedAchievements.length);
        }
        
        // Combine available and locked achievements for the full list
        if (summary.available_achievements || summary.locked_achievements) {
          const combinedAchievements = [
            ...(summary.earned_achievements || []),
            ...(summary.available_achievements || []),
            ...(summary.locked_achievements || [])
          ];
          setAvailableAchievements(combinedAchievements);
        } else {
          setAvailableAchievements(allAchievements);
        }
      } else {
        // Fallback to basic data
        console.log('Using basic data - no summary available');
        setAchievements(earnedAchievements);
        setAvailableAchievements(allAchievements);
      }
      
      console.log('Final state - Earned achievements:', earnedAchievements.length);
      console.log('Final state - All achievements:', allAchievements.length);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      // Fallback: try fetching all achievements if specific endpoints fail
      try {
        const fallbackRes = await axios.get('/api/social/achievements/');
        const allData = fallbackRes.data.results || fallbackRes.data;
        setAvailableAchievements(allData);
        
        // Try to get user achievements separately
        try {
          const userAchievementsRes = await axios.get('/api/social/user-achievements/');
          const userAchievements = userAchievementsRes.data.results || userAchievementsRes.data;
          setAchievements(userAchievements);
        } catch (userError) {
          console.error('Failed to fetch user achievements:', userError);
          setAchievements([]);
        }
      } catch (fallbackError) {
        console.error('Fallback fetch failed:', fallbackError);
      }
    } finally {
      setLoading(false);
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

  const getFilteredAchievements = () => {
    let items = [];
    
    if (activeTab === 'earned') {
      items = achievements;
    } else if (activeTab === 'available') {
      // Show achievements not yet earned - compare by achievement ID or slug
      const earnedIds = achievements.map(a => a.achievement || a.id);
      const earnedSlugs = achievements.map(a => a.achievement_slug || a.slug);
      
      items = availableAchievements.filter(a => 
        !earnedIds.includes(a.id) && 
        !earnedSlugs.includes(a.slug) &&
        !achievements.find(earned => 
          (earned.achievement === a.id) || 
          (earned.achievement_slug === a.slug) ||
          (earned.slug === a.slug) ||
          (earned.id === a.id)
        )
      );
    } else { // locked
      // For now, treat locked same as available since we don't have lock logic
      const earnedIds = achievements.map(a => a.achievement || a.id);
      const earnedSlugs = achievements.map(a => a.achievement_slug || a.slug);
      
      items = availableAchievements.filter(a => 
        !earnedIds.includes(a.id) && 
        !earnedSlugs.includes(a.slug) &&
        !achievements.find(earned => 
          (earned.achievement === a.id) || 
          (earned.achievement_slug === a.slug) ||
          (earned.slug === a.slug) ||
          (earned.id === a.id)
        )
      ).slice(0, Math.floor(availableAchievements.length * 0.3)); // Show 30% as "locked"
    }

    // Apply filters
    if (filter !== 'all') {
      items = items.filter(item => {
        const rarity = activeTab === 'earned' ? 
          (item.achievement_rarity || item.rarity) : 
          item.rarity;
        return rarity === filter;
      });
    }

    if (searchQuery) {
      items = items.filter(item => {
        const name = activeTab === 'earned' ? 
          (item.achievement_name || item.name) : 
          item.name;
        const description = activeTab === 'earned' ? 
          (item.achievement_description || item.description) : 
          item.description;
        return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
               description.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    return items;
  };

  if (compact) {
    return (
      <div className="space-y-4">
        <h3 className="text-base sm:text-lg font-bold text-gray-900">Recent Achievements</h3>
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3">
          {achievements.slice(0, 6).map((achievement) => (
            <CompactBadge 
              key={achievement.id} 
              achievement={achievement} 
              onClick={() => setSelectedBadge(achievement)}
            />
          ))}
        </div>
        {achievements.length > 6 && (
          <button 
            onClick={onViewAll}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors w-full text-center sm:w-auto sm:text-left"
          >
            View all {achievements.length} achievements
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-4 sm:mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl shadow-lg">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Achievement Badges</h2>
              <p className="text-gray-600 text-xs sm:text-sm">Unlock badges by engaging with the platform</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between sm:justify-end space-x-4">
            <div className="text-center sm:text-right">
              <div className="text-xl sm:text-2xl font-bold text-orange-600">{achievements.length}</div>
              <div className="text-xs sm:text-sm text-gray-600">Earned</div>
            </div>
            {realTimeUpdates && (
              <div className="flex items-center space-x-1 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium">Live</span>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          {/* Search */}
          <div className="relative flex-1 max-w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search achievements..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-500 text-sm sm:text-base"
            />
          </div>

          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
            {/* Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 bg-white text-sm sm:text-base w-full sm:w-auto"
            >
              <option value="all">All Rarities</option>
              <option value="common">Common</option>
              <option value="uncommon">Uncommon</option>
              <option value="rare">Rare</option>
              <option value="epic">Epic</option>
              <option value="legendary">Legendary</option>
            </select>

            {/* View Mode */}
            <div className="flex items-center justify-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-800'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-800'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-200">
          {[
            { key: 'earned', label: 'Earned', count: achievements.length },
            { key: 'available', label: 'Available', count: getFilteredAchievements().length },
            { key: 'locked', label: 'Locked', count: Math.floor(availableAchievements.length * 0.3) }
          ].map((tab) => {
            // Calculate count for current tab
            let tabCount = 0;
            if (tab.key === 'earned') {
              tabCount = achievements.length;
            } else if (tab.key === 'available') {
              const earnedIds = achievements.map(a => a.achievement || a.id);
              const earnedSlugs = achievements.map(a => a.achievement_slug || a.slug);
              tabCount = availableAchievements.filter(a => 
                !earnedIds.includes(a.id) && 
                !earnedSlugs.includes(a.slug) &&
                !achievements.find(earned => 
                  (earned.achievement === a.id) || 
                  (earned.achievement_slug === a.slug) ||
                  (earned.slug === a.slug) ||
                  (earned.id === a.id)
                )
              ).length;
            } else { // locked
              tabCount = Math.max(0, Math.floor(availableAchievements.length * 0.3));
            }
            
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex flex-col items-center space-y-1 sm:flex-row sm:justify-center sm:space-y-0 sm:space-x-2">
                  <span className="truncate">{tab.label}</span>
                  <span className="bg-gray-100 text-gray-600 px-1.5 sm:px-2 py-0.5 rounded-full text-xs">
                    {tabCount}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Achievement Grid/List */}
        <div className="p-4 sm:p-6">
          {loading ? (
            <AchievementsSkeleton viewMode={viewMode} />
          ) : (
            <AchievementsGrid 
              achievements={getFilteredAchievements()}
              activeTab={activeTab}
              viewMode={viewMode}
              onBadgeClick={setSelectedBadge}
            />
          )}
        </div>
      </div>

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <BadgeDetailModal
          badge={selectedBadge}
          isEarned={activeTab === 'earned'}
          onClose={() => setSelectedBadge(null)}
        />
      )}
    </div>
  );
};

// Compact Badge Component
const CompactBadge = ({ achievement, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showSparkle, setShowSparkle] = useState(false);
  const RarityIcon = getRarityIcon(achievement.achievement_rarity);
  const rarity = achievement.achievement_rarity;
  
  // Show sparkle animation for rare+ achievements
  useEffect(() => {
    if (['rare', 'epic', 'legendary'].includes(rarity)) {
      const sparkleInterval = setInterval(() => {
        setShowSparkle(true);
        setTimeout(() => setShowSparkle(false), 1000);
      }, 3000 + Math.random() * 2000); // Random interval between 3-5 seconds
      
      return () => clearInterval(sparkleInterval);
    }
  }, [rarity]);

  const getBadgeAnimation = () => {
    const category = achievement.achievement_category || achievement.category || 'general';
    
    // Different animations based on category and rarity
    if (rarity === 'legendary') {
      switch (category) {
        case 'startup': return 'animate-pulse hover:animate-bounce'; // Rocket launch effect
        case 'social': return 'animate-pulse hover:animate-ping'; // Celebrity glow
        case 'content': return 'animate-pulse hover:animate-pulse'; // Thought leader pulse
        default: return 'animate-pulse hover:animate-bounce';
      }
    } else if (rarity === 'epic') {
      switch (category) {
        case 'startup': return 'hover:animate-bounce'; // Entrepreneur bounce
        case 'social': return 'hover:animate-pulse'; // Influencer pulse
        case 'content': return 'hover:animate-ping'; // Content creator ping
        case 'community': return 'hover:animate-pulse'; // Leader pulse
        default: return 'hover:animate-pulse';
      }
    } else if (rarity === 'rare') {
      switch (category) {
        case 'startup': return 'hover:animate-spin'; // Innovation spin
        case 'social': return 'hover:animate-ping'; // Network effect
        case 'content': return 'hover:animate-bounce'; // Creative bounce
        case 'special': return 'hover:animate-pulse'; // Special glow
        default: return 'hover:animate-spin';
      }
    } else if (rarity === 'uncommon') {
      switch (category) {
        case 'profile': return 'hover:animate-ping'; // Profile completion
        case 'social': return 'hover:animate-pulse'; // Social growth
        case 'community': return 'hover:animate-bounce'; // Helpful bounce
        default: return 'hover:animate-ping';
      }
    }
    
    return 'hover:scale-110'; // Default for common
  };

  const getGlowEffect = () => {
    switch (rarity) {
      case 'legendary': return 'shadow-yellow-400/50 hover:shadow-yellow-400/80';
      case 'epic': return 'shadow-purple-400/50 hover:shadow-purple-400/80';
      case 'rare': return 'shadow-blue-400/50 hover:shadow-blue-400/80';
      case 'uncommon': return 'shadow-green-400/50 hover:shadow-green-400/80';
      default: return 'shadow-gray-400/50 hover:shadow-gray-400/80';
    }
  };
  
  return (
    <div 
      onClick={() => onClick(achievement)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group cursor-pointer"
    >
      {/* Category and rarity-specific effects */}
      {showSparkle && ['rare', 'epic', 'legendary'].includes(rarity) && (
        <>
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping opacity-75 animation-delay-150"></div>
          <div className="absolute top-0 right-0 w-1 h-1 bg-white rounded-full animate-pulse opacity-90 animation-delay-300"></div>
        </>
      )}
      
      {/* Category-specific background effects */}
      {rarity === 'legendary' && (
        <div className={`absolute inset-0 rounded-full pointer-events-none ${
          achievement.achievement_category === 'startup' || achievement.category === 'startup' ? 'animate-rocket-launch' :
          achievement.achievement_category === 'social' || achievement.category === 'social' ? 'animate-social-glow' :
          achievement.achievement_category === 'content' || achievement.category === 'content' ? 'animate-content-wave' :
          'animate-legendary-aura'
        } opacity-50`}></div>
      )}
      
      {/* Main badge */}
      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getRarityColor(rarity)} p-1 shadow-lg 
        ${getBadgeAnimation()} ${getGlowEffect()} transition-all duration-300 
        ${isHovered ? 'scale-110 shadow-2xl' : 'scale-100'}`}>
        <div className="w-full h-full bg-white rounded-full flex items-center justify-center relative overflow-hidden">
          <div className={`text-lg transition-all duration-300 ${isHovered ? 'scale-110' : 'scale-100'}`}>
            {achievement.achievement_icon || '🏆'}
          </div>
          
          {/* Shimmer effect for legendary */}
          {rarity === 'legendary' && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-200 to-transparent 
              opacity-0 group-hover:opacity-100 animate-shimmer"></div>
          )}
        </div>
      </div>
      
      {/* Rarity indicator with pulsing effect */}
      <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center
        ${rarity === 'legendary' ? 'bg-gradient-to-r from-yellow-400 to-orange-500 animate-pulse' : 
          rarity === 'epic' ? 'bg-gradient-to-r from-purple-500 to-pink-600' :
          rarity === 'rare' ? 'bg-gradient-to-r from-blue-500 to-cyan-600' :
          rarity === 'uncommon' ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
          'bg-orange-500'}`}>
        <RarityIcon className="w-2 h-2 text-white" />
      </div>
      
      {/* Floating particles for legendary achievements */}
      {rarity === 'legendary' && isHovered && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-float-1 opacity-70"></div>
          <div className="absolute w-1 h-1 bg-orange-400 rounded-full animate-float-2 opacity-70"></div>
          <div className="absolute w-1 h-1 bg-yellow-300 rounded-full animate-float-3 opacity-70"></div>
        </div>
      )}
    </div>
  );
};

// Achievements Grid Component
const AchievementsGrid = ({ achievements, activeTab, viewMode, onBadgeClick }) => {
  if (achievements.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {activeTab === 'earned' ? 'No achievements yet' : 
           activeTab === 'available' ? 'No available achievements' : 
           'No locked achievements'}
        </h3>
        <p className="text-gray-600">
          {activeTab === 'earned' ? 'Start engaging with the platform to earn your first badge!' :
           activeTab === 'available' ? 'All available achievements have been earned!' :
           'All achievements are currently available to earn!'}
        </p>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {achievements.map((achievement) => (
          <AchievementListItem
            key={achievement.id}
            achievement={achievement}
            isEarned={activeTab === 'earned'}
            onClick={() => onBadgeClick(achievement)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {achievements.map((achievement) => (
        <AchievementCard
          key={achievement.id}
          achievement={achievement}
          isEarned={activeTab === 'earned'}
          onClick={() => onBadgeClick(achievement)}
        />
      ))}
    </div>
  );
};

// Achievement Card Component
const AchievementCard = ({ achievement, isEarned, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showGlow, setShowGlow] = useState(false);
  
  const name = isEarned ? achievement.achievement_name : achievement.name;
  const description = isEarned ? achievement.achievement_description : achievement.description;
  const rarity = isEarned ? achievement.achievement_rarity : achievement.rarity;
  const icon = isEarned ? achievement.achievement_icon : achievement.icon;
  const points = isEarned ? achievement.achievement_points : achievement.points;
  
  const RarityIcon = getRarityIcon(rarity);

  // Automatic glow effect for high rarity achievements
  useEffect(() => {
    if (isEarned && ['epic', 'legendary'].includes(rarity)) {
      const glowInterval = setInterval(() => {
        setShowGlow(true);
        setTimeout(() => setShowGlow(false), 2000);
      }, 4000 + Math.random() * 3000);
      
      return () => clearInterval(glowInterval);
    }
  }, [isEarned, rarity]);

  const getCardAnimation = () => {
    if (!isEarned) return '';
    switch (rarity) {
      case 'legendary': return 'hover:shadow-yellow-400/50 hover:-translate-y-2';
      case 'epic': return 'hover:shadow-purple-400/50 hover:-translate-y-1';
      case 'rare': return 'hover:shadow-blue-400/50';
      default: return '';
    }
  };

  const getIconAnimation = () => {
    if (!isEarned) return '';
    
    const category = isEarned ? 
      (achievement.achievement_category || achievement.category) : 
      achievement.category || 'general';
    
    // Icon-specific animations based on category and rarity
    if (rarity === 'legendary') {
      switch (category) {
        case 'startup': return 'group-hover:animate-bounce group-hover:scale-125'; // Rocket boost
        case 'social': return 'group-hover:animate-pulse group-hover:scale-110'; // Celebrity shine
        case 'content': return 'group-hover:animate-ping group-hover:scale-115'; // Thought waves
        default: return 'group-hover:animate-bounce group-hover:scale-125';
      }
    } else if (rarity === 'epic') {
      switch (category) {
        case 'startup': return 'group-hover:animate-spin group-hover:scale-110'; // Innovation rotation
        case 'social': return 'group-hover:animate-pulse group-hover:scale-115'; // Influence pulse
        case 'content': return 'group-hover:animate-bounce group-hover:scale-110'; // Creative bounce
        case 'community': return 'group-hover:animate-ping group-hover:scale-115'; // Leadership glow
        default: return 'group-hover:animate-pulse group-hover:scale-110';
      }
    } else if (rarity === 'rare') {
      switch (category) {
        case 'startup': return 'group-hover:animate-pulse group-hover:scale-110'; // Startup glow
        case 'social': return 'group-hover:animate-bounce group-hover:scale-105'; // Network bounce
        case 'content': return 'group-hover:animate-spin group-hover:scale-110'; // Creative spin
        case 'special': return 'group-hover:animate-ping group-hover:scale-115'; // Special effect
        default: return 'group-hover:animate-spin group-hover:scale-110';
      }
    } else if (rarity === 'uncommon') {
      switch (category) {
        case 'profile': return 'group-hover:animate-ping group-hover:scale-105'; // Profile complete
        case 'social': return 'group-hover:animate-pulse group-hover:scale-105'; // Social growth
        case 'community': return 'group-hover:animate-bounce group-hover:scale-105'; // Community help
        default: return 'group-hover:scale-125';
      }
    }
    
    return 'group-hover:scale-110'; // Default for common
  };

  return (
    <div 
      onClick={() => onClick(achievement)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 cursor-pointer 
        transition-all duration-300 group ${getCardAnimation()} ${showGlow ? 'shadow-2xl' : 'hover:shadow-xl'} 
        ${!isEarned ? 'opacity-75' : ''}`}
    >
      {/* Sparkle effects for earned high-rarity achievements */}
      {isEarned && showGlow && ['epic', 'legendary'].includes(rarity) && (
        <>
          <div className="absolute top-2 left-2 w-2 h-2 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
          <div className="absolute top-4 right-4 w-1 h-1 bg-white rounded-full animate-pulse opacity-90"></div>
          <div className="absolute bottom-4 left-4 w-1 h-1 bg-yellow-300 rounded-full animate-pulse opacity-90"></div>
        </>
      )}

      {/* Rarity indicator */}
      <div className="absolute top-3 right-3">
        <div className={`p-1 rounded-full bg-gradient-to-br ${getRarityColor(rarity)} 
          ${rarity === 'legendary' && isEarned ? 'animate-pulse' : ''}`}>
          <RarityIcon className="w-3 h-3 text-white" />
        </div>
      </div>

      {/* Achievement icon */}
      <div className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-gradient-to-br ${getRarityColor(rarity)} 
        p-1 shadow-lg transition-all duration-300 ${getIconAnimation()} 
        ${isHovered ? 'scale-110 shadow-2xl' : 'scale-100'}`}>
        <div className="w-full h-full bg-white rounded-full flex items-center justify-center relative overflow-hidden">
          <div className={`text-lg sm:text-2xl transition-all duration-300 ${isHovered ? 'scale-110' : 'scale-100'}`}>
            {icon || '🏆'}
          </div>
          
          {/* Shimmer effect for legendary earned achievements */}
          {isEarned && rarity === 'legendary' && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-200 to-transparent 
              opacity-0 group-hover:opacity-100 transform -skew-x-12 translate-x-full group-hover:translate-x-[-200%] 
              transition-transform duration-1000"></div>
          )}
        </div>
      </div>

      {/* Achievement info */}
      <div className="text-center">
        <h3 className={`text-sm sm:text-base font-bold text-gray-900 mb-1 transition-colors line-clamp-1 ${
          isEarned && rarity === 'legendary' ? 'group-hover:text-yellow-600' : ''
        }`}>
          {name || 'Achievement'}
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 line-clamp-2">{description || 'Achievement description'}</p>
        
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 text-xs">
          <span className={`px-2 py-1 rounded-full text-white bg-gradient-to-r ${getRarityColor(rarity)} 
            transition-all duration-300 ${isHovered ? 'scale-105 shadow-lg' : ''} truncate`}>
            {rarity}
          </span>
          <span className="text-gray-600 font-medium">{points} pts</span>
        </div>
        
        {isEarned && achievement.earned_at && (
          <p className="text-xs text-gray-500 mt-2 truncate">
            Earned {new Date(achievement.earned_at).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Lock overlay for unavailable achievements */}
      {!isEarned && !achievement.is_available && (
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-2xl flex items-center justify-center">
          <div className="text-center">
            <Lock className="w-8 h-8 text-white mx-auto mb-2" />
            <span className="text-white text-xs">Locked</span>
          </div>
        </div>
      )}

      {/* Achievement glow border for high rarity */}
      {isEarned && showGlow && rarity === 'legendary' && (
        <div className="absolute inset-0 rounded-2xl border-2 border-yellow-400 opacity-50 animate-pulse"></div>
      )}
    </div>
  );
};

// Achievement List Item Component
const AchievementListItem = ({ achievement, isEarned, onClick }) => {
  const name = isEarned ? achievement.achievement_name : achievement.name;
  const description = isEarned ? achievement.achievement_description : achievement.description;
  const rarity = isEarned ? achievement.achievement_rarity : achievement.rarity;
  const icon = isEarned ? achievement.achievement_icon : achievement.icon;
  const points = isEarned ? achievement.achievement_points : achievement.points;
  
  const RarityIcon = getRarityIcon(rarity);

  return (
    <div 
      onClick={() => onClick(achievement)}
      className={`flex items-center space-x-4 p-4 bg-white rounded-xl shadow-lg border border-gray-100 cursor-pointer hover:shadow-xl transition-all ${
        !isEarned ? 'opacity-75' : ''
      }`}
    >
      {/* Achievement icon */}
      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getRarityColor(rarity)} p-1 shadow-lg flex-shrink-0`}>
        <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
          <div className="text-lg">{icon}</div>
        </div>
      </div>

      {/* Achievement info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <h3 className="font-bold text-gray-900 truncate">{name}</h3>
          <RarityIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </div>
        <p className="text-sm text-gray-600 line-clamp-1">{description}</p>
        {isEarned && achievement.earned_at && (
          <p className="text-xs text-gray-500 mt-1">
            Earned {new Date(achievement.earned_at).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Points and rarity */}
      <div className="text-right flex-shrink-0">
        <div className={`px-2 py-1 rounded-full text-xs text-white bg-gradient-to-r ${getRarityColor(rarity)} mb-1`}>
          {rarity}
        </div>
        <div className="text-sm font-medium text-gray-600">{points} pts</div>
      </div>

      {!isEarned && !achievement.is_available && (
        <Lock className="w-5 h-5 text-gray-400" />
      )}
    </div>
  );
};

// Badge Detail Modal
const BadgeDetailModal = ({ badge, isEarned, onClose }) => {
  const name = isEarned ? badge.achievement_name : badge.name;
  const description = isEarned ? badge.achievement_description : badge.description;
  const rarity = isEarned ? badge.achievement_rarity : badge.rarity;
  const icon = isEarned ? badge.achievement_icon : badge.icon;
  const points = isEarned ? badge.achievement_points : badge.points;
  const requirements = isEarned ? badge.achievement_requirements : badge.requirements;
  
  const RarityIcon = getRarityIcon(rarity);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Achievement Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="text-center mb-6">
            {/* Large achievement icon */}
            <div className={`w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br ${getRarityColor(rarity)} p-1 shadow-xl`}>
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                <div className="text-4xl">{icon}</div>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-2">{name}</h3>
            <p className="text-gray-600 mb-4">{description}</p>

            <div className="flex items-center justify-center space-x-4">
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full bg-gradient-to-r ${getRarityColor(rarity)}`}>
                <RarityIcon className="w-4 h-4 text-white" />
                <span className="text-white font-medium capitalize">{rarity}</span>
              </div>
              <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-full">
                <Star className="w-4 h-4 text-gray-600" />
                <span className="text-gray-600 font-medium">{points} points</span>
              </div>
            </div>
          </div>

          {/* Requirements */}
          {requirements && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                <Target className="w-4 h-4" />
                <span>Requirements</span>
              </h4>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700">{requirements}</p>
              </div>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center justify-center">
            {isEarned ? (
              <div className="flex items-center space-x-2 text-green-600">
                <Trophy className="w-5 h-5" />
                <span className="font-medium">Achievement Unlocked!</span>
              </div>
            ) : badge.is_available ? (
              <div className="flex items-center space-x-2 text-blue-600">
                <Zap className="w-5 h-5" />
                <span className="font-medium">Available to Earn</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-gray-500">
                <Lock className="w-5 h-5" />
                <span className="font-medium">Locked</span>
              </div>
            )}
          </div>

          {isEarned && badge.earned_at && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                Earned on {new Date(badge.earned_at).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Loading Skeleton
const AchievementsSkeleton = ({ viewMode }) => (
  <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6' : 'space-y-4'}>
    {[...Array(8)].map((_, i) => (
      <div key={i} className={viewMode === 'grid' ? 'bg-white rounded-2xl shadow-lg border border-gray-100 p-6' : 'flex items-center space-x-4 p-4 bg-white rounded-xl shadow-lg border border-gray-100'}>
        {viewMode === 'grid' ? (
          <>
            <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse mx-auto mb-4"></div>
            <div className="space-y-2 text-center">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4 mx-auto"></div>
            </div>
          </>
        ) : (
          <>
            <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse flex-shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
            </div>
          </>
        )}
      </div>
    ))}
  </div>
);

// Helper functions (moved outside component to avoid redefinition)
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

export default AchievementBadges;