// src/components/profile/ProfileAchievements.js - Profile achievements and points display
import React, { useState, useEffect } from 'react';
import { 
  Trophy, Star, Crown, Shield, Award, TrendingUp, 
  Target, Zap, Users, Calendar, ArrowUp
} from 'lucide-react';
import axios from '../../config/axios';
import { useBadgeDisplay } from '../../hooks/useAchievementRefresh';
import '../../styles/achievement-animations.css';

const ProfileAchievements = ({ userId, currentUser, isOwnProfile = false }) => {
  const [userPoints, setUserPoints] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [pointsHistory, setPointsHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllAchievements, setShowAllAchievements] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);
  
  const { badgeCount, recentBadges } = useBadgeDisplay(userId);

  useEffect(() => {
    if (userId) {
      fetchProfileData();
    }
  }, [userId]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      
      console.log('Fetching profile data for user:', userId);
      console.log('Current user:', currentUser);
      
      const [pointsRes, achievementsRes, historyRes] = await Promise.all([
        axios.get(`/auth/${userId}/points/`),
        axios.get(`/auth/${userId}/achievements/?limit=20`),
        axios.get(`/auth/${userId}/points/history/?limit=10`)
      ]);

      console.log('Points response:', pointsRes.data);
      console.log('Achievements response:', achievementsRes.data);
      console.log('History response:', historyRes.data);

      setUserPoints(pointsRes.data);
      setAchievements(achievementsRes.data.results || achievementsRes.data);
      setPointsHistory(historyRes.data.results || historyRes.data);
    } catch (error) {
      console.error('Error fetching profile data:', error);
      console.error('Error details:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get('/api/auth/leaderboard/?limit=10');
      setLeaderboardData(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
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

  const formatPoints = (points) => {
    if (points >= 1000000) return `${(points / 1000000).toFixed(1)}M`;
    if (points >= 1000) return `${(points / 1000).toFixed(1)}K`;
    return points.toString();
  };

  const getActivityCategory = (reason) => {
    if (reason.startsWith('milestone_') || reason.startsWith('first_') || reason.includes('streak') || reason === 'early_adopter' || reason === 'platform_anniversary') {
      return 'milestone';
    } else if (reason.includes('post') || reason.includes('story') || reason.includes('comment') || reason === 'quality_content') {
      return 'content';
    } else if (reason.includes('startup')) {
      return 'startup';
    } else if (reason.includes('job') || reason.includes('resume')) {
      return 'job';
    } else if (reason.includes('follow') || reason.includes('like') || reason.includes('share') || reason.includes('message') || reason.includes('profile') || reason.includes('social') || reason.includes('login')) {
      return 'social';
    } else {
      return 'general';
    }
  };

  const getPointsReasonIcon = (reason) => {
    switch (reason) {
      // Achievements
      case 'achievement': return Trophy;
      
      // Onboarding & Profile
      case 'signup_bonus': return Star;
      case 'email_verify': case 'phone_verify': return Shield;
      case 'profile_picture_upload': case 'profile_bio_complete': 
      case 'profile_location_add': case 'profile_website_add': 
      case 'profile_complete': case 'first_interests_select': return Target;
      
      // Engagement & Login
      case 'daily_login': case 'login_streak_3': case 'login_streak_7': 
      case 'login_streak_30': case 'first_session': return Calendar;
      
      // Content Creation
      case 'first_post': case 'post_create': case 'post_with_image': 
      case 'post_with_video': case 'first_story': case 'story_create': 
      case 'story_with_media': case 'comment_create': case 'first_comment': return Target;
      
      // Startup Activities
      case 'first_startup_submit': case 'startup_submit': case 'startup_claim': 
      case 'startup_verify': case 'startup_update': case 'startup_logo_upload': return TrendingUp;
      
      // Job Activities
      case 'first_job_post': case 'job_post': case 'job_apply': 
      case 'job_bookmark': case 'resume_upload': case 'resume_update': return Users;
      
      // Social Activities
      case 'first_follow': case 'follow_user': case 'get_followed': 
      case 'like_post': case 'share_post': case 'bookmark_post': 
      case 'join_community': case 'message_send': case 'first_message': return Users;
      
      // Milestones & Special
      case 'milestone_10_posts': case 'milestone_50_posts': case 'milestone_100_followers': 
      case 'milestone_verified': case 'early_adopter': case 'platform_anniversary': return Crown;
      
      // Bonuses
      case 'weekly_bonus': case 'monthly_bonus': case 'referral': return Award;
      
      default: return Star;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Points and Level Overview */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <Trophy className="w-6 h-6 text-orange-500" />
            <span>Points & Level</span>
          </h3>
          {isOwnProfile && (
            <button 
              onClick={() => {
                setShowLeaderboard(!showLeaderboard);
                if (!showLeaderboard && leaderboardData.length === 0) {
                  fetchLeaderboard();
                }
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {showLeaderboard ? 'Hide Leaderboard' : 'View Leaderboard'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Total Points */}
          <div className="text-center p-4 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl text-white">
            <div className="text-2xl font-bold">{formatPoints(userPoints?.total_points || 0)}</div>
            <div className="text-sm opacity-90">Total Points</div>
          </div>

          {/* Level */}
          <div className="text-center p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-white">
            <div className="text-2xl font-bold">Level {userPoints?.level || 1}</div>
            <div className="text-sm opacity-90">Current Level</div>
          </div>

          {/* Achievements */}
          <div className="text-center p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white">
            <div className="text-2xl font-bold">{badgeCount || achievements.length}</div>
            <div className="text-sm opacity-90">Achievements</div>
          </div>

          {/* This Month */}
          <div className="text-center p-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl text-white">
            <div className="text-2xl font-bold">{formatPoints(userPoints?.points_this_month || 0)}</div>
            <div className="text-sm opacity-90">This Month</div>
          </div>
        </div>

        {/* Level Progress */}
        {userPoints && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Level {userPoints.level} Progress
              </span>
              <span className="text-sm text-gray-500">
                {userPoints.level_progress?.toFixed(1) || 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${userPoints.level_progress || 0}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Points Breakdown */}
        {userPoints && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
            <div className="text-center">
              <div className="font-semibold text-orange-600">{userPoints.achievement_points || 0}</div>
              <div className="text-gray-500">Achievements</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-blue-600">{userPoints.content_points || 0}</div>
              <div className="text-gray-500">Content</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-green-600">{userPoints.social_points || 0}</div>
              <div className="text-gray-500">Social</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-purple-600">{userPoints.startup_points || 0}</div>
              <div className="text-gray-500">Startups</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-indigo-600">{userPoints.job_points || 0}</div>
              <div className="text-gray-500">Jobs</div>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        {showLeaderboard && (
          <div className="mt-6 bg-gray-50 rounded-xl p-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              <span>Top Players</span>
            </h4>
            {leaderboardData.length > 0 ? (
              <div className="space-y-2">
                {leaderboardData.map((player, index) => (
                  <div 
                    key={player.user_id} 
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      player.user_id === parseInt(userId) ? 'bg-blue-100 border-2 border-blue-300' : 'bg-white'
                    } ${index < 3 ? 'border-l-4 ' + (index === 0 ? 'border-yellow-400' : index === 1 ? 'border-gray-400' : 'border-orange-400') : ''}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {index < 3 ? (index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉') : player.rank}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {player.display_name}
                          {player.user_id === parseInt(userId) && (
                            <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded">You</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">Level {player.level}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">{formatPoints(player.total_points)}</div>
                      <div className="text-xs text-gray-500">{player.achievements_count} achievements</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">Loading leaderboard...</div>
            )}
          </div>
        )}
      </div>

      {/* Recent Achievements */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <Star className="w-6 h-6 text-yellow-500" />
            <span>Recent Achievements</span>
          </h3>
          <button 
            onClick={() => setShowAllAchievements(!showAllAchievements)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {showAllAchievements ? 'Show Less' : `View All ${badgeCount}`}
          </button>
        </div>

        {achievements.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No achievements yet</p>
            {isOwnProfile && (
              <p className="text-sm text-gray-400 mt-2">
                Start engaging with the platform to earn your first badges!
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {(showAllAchievements ? achievements : achievements.slice(0, 6)).map((achievement) => (
              <ProfileAchievementBadge 
                key={achievement.id} 
                achievement={achievement} 
              />
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity (Points History) */}
      {isOwnProfile && pointsHistory.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
            <TrendingUp className="w-6 h-6 text-green-500" />
            <span>Recent Activity</span>
          </h3>

          <div className="space-y-3">
            {pointsHistory.slice(0, 8).map((entry) => {
              const IconComponent = getPointsReasonIcon(entry.reason);
              const activityCategory = getActivityCategory(entry.reason);
              const isHighValue = entry.points >= 50;
              const isMilestone = entry.reason.startsWith('milestone_') || entry.reason.startsWith('first_');
              
              return (
                <div key={entry.id} className={`flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors ${
                  isMilestone ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200' : ''
                }`}>
                  <div className={`p-2 rounded-full ${
                    activityCategory === 'milestone' ? 'bg-yellow-100' :
                    activityCategory === 'content' ? 'bg-blue-100' :
                    activityCategory === 'social' ? 'bg-green-100' :
                    activityCategory === 'startup' ? 'bg-purple-100' :
                    activityCategory === 'job' ? 'bg-indigo-100' :
                    'bg-gray-100'
                  }`}>
                    <IconComponent className={`w-4 h-4 ${
                      activityCategory === 'milestone' ? 'text-yellow-600' :
                      activityCategory === 'content' ? 'text-blue-600' :
                      activityCategory === 'social' ? 'text-green-600' :
                      activityCategory === 'startup' ? 'text-purple-600' :
                      activityCategory === 'job' ? 'text-indigo-600' :
                      'text-gray-600'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {entry.description}
                      </p>
                      {isMilestone && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Milestone
                        </span>
                      )}
                      {isHighValue && !isMilestone && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Bonus
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-xs text-gray-500">
                        {new Date(entry.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        activityCategory === 'milestone' ? 'bg-yellow-100 text-yellow-700' :
                        activityCategory === 'content' ? 'bg-blue-100 text-blue-700' :
                        activityCategory === 'social' ? 'bg-green-100 text-green-700' :
                        activityCategory === 'startup' ? 'bg-purple-100 text-purple-700' :
                        activityCategory === 'job' ? 'bg-indigo-100 text-indigo-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {activityCategory}
                      </span>
                    </div>
                  </div>
                  <div className={`text-sm font-bold flex items-center space-x-1 ${
                    entry.points > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {entry.points > 0 && <ArrowUp className={`w-3 h-3 ${isHighValue ? 'text-yellow-500' : ''}`} />}
                    <span className={isHighValue ? 'text-lg' : ''}>{entry.points > 0 ? '+' : ''}{entry.points}</span>
                  </div>
                </div>
              );
            })}
          </div>
          
          {pointsHistory.length > 8 && (
            <div className="mt-4 text-center">
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View All Activity History
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Individual Achievement Badge Component
const ProfileAchievementBadge = ({ achievement }) => {
  const [isHovered, setIsHovered] = useState(false);
  const rarity = achievement.achievement_rarity || achievement.rarity;
  const icon = achievement.achievement_icon || achievement.icon;
  const name = achievement.achievement_name || achievement.name;
  const RarityIcon = getRarityIcon(rarity);

  return (
    <div 
      className="relative group cursor-pointer transform transition-all duration-300 hover:scale-110"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={name}
    >
      {/* Achievement Badge */}
      <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getRarityColor(rarity)} 
        p-1 shadow-lg mx-auto relative overflow-hidden
        ${rarity === 'legendary' ? 'animate-pulse' : ''}`}>
        <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
          <div className={`text-xl transition-all duration-300 ${isHovered ? 'scale-110' : 'scale-100'}`}>
            {icon || '🏆'}
          </div>
        </div>
        
        {/* Rarity indicator */}
        <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center
          ${rarity === 'legendary' ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 
            rarity === 'epic' ? 'bg-gradient-to-r from-purple-500 to-pink-600' :
            rarity === 'rare' ? 'bg-gradient-to-r from-blue-500 to-cyan-600' :
            rarity === 'uncommon' ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
            'bg-orange-500'}`}>
          <RarityIcon className="w-2 h-2 text-white" />
        </div>
        
        {/* Shimmer effect for legendary */}
        {rarity === 'legendary' && isHovered && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-200 to-transparent 
            opacity-100 animate-shimmer"></div>
        )}
      </div>
      
      {/* Achievement Name */}
      <p className="text-xs text-center text-gray-700 mt-2 truncate font-medium">
        {name}
      </p>
    </div>
  );
};

// Helper functions
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

export default ProfileAchievements;