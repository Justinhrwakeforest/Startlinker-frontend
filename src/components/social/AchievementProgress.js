// src/components/social/AchievementProgress.js - Achievement progress tracking component
import React, { useState, useEffect } from 'react';
import { Progress, Target, TrendingUp, Clock, Star, Trophy, Award } from 'lucide-react';
import axios from 'axios';

const AchievementProgress = ({ currentUser, compact = false }) => {
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active'); // active, all, category

  useEffect(() => {
    if (currentUser?.id) {
      fetchProgressData();
    }
  }, [currentUser]);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/social/achievements/progress/');
      setProgressData(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredProgress = () => {
    if (filter === 'active') {
      return progressData.filter(p => p.progress_percentage > 0 && p.progress_percentage < 100);
    }
    return progressData;
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

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-blue-500';
    return 'bg-gray-400';
  };

  if (compact) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Achievement Progress</h3>
          <span className="text-sm text-gray-600">
            {getFilteredProgress().length} in progress
          </span>
        </div>
        
        <div className="space-y-3">
          {getFilteredProgress().slice(0, 3).map((progress) => (
            <CompactProgressItem key={progress.id} progress={progress} />
          ))}
        </div>
        
        {getFilteredProgress().length > 3 && (
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            View all progress ({getFilteredProgress().length})
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Achievement Progress</h2>
              <p className="text-gray-600 text-sm">Track your progress toward earning badges</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {getFilteredProgress().length}
            </div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
        </div>

        {/* Filter */}
        <div className="mt-6">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'active'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Active Progress
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              All Achievements
            </button>
          </div>
        </div>
      </div>

      {/* Progress List */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6">
          {loading ? (
            <ProgressSkeleton />
          ) : getFilteredProgress().length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No active progress
              </h3>
              <p className="text-gray-600">
                Start engaging with the platform to make progress on achievements!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {getFilteredProgress().map((progress) => (
                <ProgressItem key={progress.id} progress={progress} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Compact Progress Item Component
const CompactProgressItem = ({ progress }) => {
  const percentage = Math.round(progress.progress_percentage);
  
  return (
    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
      <div className="text-2xl">{progress.achievement_icon}</div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 text-sm truncate">
          {progress.achievement_name}
        </h4>
        <div className="flex items-center space-x-2 mt-1">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(percentage)}`}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          <span className="text-xs font-medium text-gray-600">{percentage}%</span>
        </div>
      </div>
    </div>
  );
};

// Full Progress Item Component
const ProgressItem = ({ progress }) => {
  const percentage = Math.round(progress.progress_percentage);
  const isCompleted = percentage >= 100;
  
  return (
    <div className={`p-4 rounded-xl border-2 transition-all ${
      isCompleted 
        ? 'border-green-200 bg-green-50' 
        : 'border-gray-100 bg-white hover:border-gray-200'
    }`}>
      <div className="flex items-start space-x-4">
        {/* Achievement Icon */}
        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getRarityColor(progress.achievement_rarity)} p-1 shadow-lg flex-shrink-0`}>
          <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
            <div className="text-xl">{progress.achievement_icon}</div>
          </div>
        </div>

        {/* Achievement Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-gray-900">{progress.achievement_name}</h3>
            <div className="flex items-center space-x-2">
              {isCompleted && <Trophy className="w-4 h-4 text-green-600" />}
              <span className={`text-sm font-medium ${
                isCompleted ? 'text-green-600' : 'text-gray-600'
              }`}>
                {percentage}%
              </span>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mb-3">{progress.achievement_description}</p>
          
          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Progress</span>
              <span className="text-xs text-gray-500">
                {isCompleted ? 'Complete!' : `${percentage}% complete`}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  isCompleted ? 'bg-green-500' : getProgressColor(percentage)
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Current Progress Details */}
          {progress.current_progress && Object.keys(progress.current_progress).length > 0 && (
            <div className="grid grid-cols-2 gap-3 text-xs">
              {Object.entries(progress.current_progress).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-gray-500 capitalize">{key.replace('_', ' ')}:</span>
                  <span className="font-medium text-gray-700">{value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Requirements */}
          {progress.achievement_requirements && (
            <div className="mt-3 p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-1 mb-1">
                <Target className="w-3 h-3 text-gray-400" />
                <span className="text-xs font-medium text-gray-600">Requirements</span>
              </div>
              <p className="text-xs text-gray-500">{progress.achievement_requirements}</p>
            </div>
          )}

          {/* Estimated Time */}
          {!isCompleted && percentage > 0 && (
            <div className="mt-3 flex items-center space-x-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>
                {percentage >= 75 ? 'Almost there!' :
                 percentage >= 50 ? 'Halfway complete' :
                 percentage >= 25 ? 'Good progress' :
                 'Just getting started'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Loading Skeleton
const ProgressSkeleton = () => (
  <div className="space-y-4">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="p-4 rounded-xl border border-gray-100 bg-white">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse flex-shrink-0"></div>
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-12"></div>
            </div>
            <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
            <div className="w-full h-3 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Helper function
const getProgressColor = (percentage) => {
  if (percentage >= 80) return 'bg-green-500';
  if (percentage >= 50) return 'bg-yellow-500';
  if (percentage >= 25) return 'bg-blue-500';
  return 'bg-gray-400';
};

// Helper function
const getRarityColor = (rarity) => {
  switch (rarity) {
    case 'legendary': return 'from-yellow-400 to-orange-500';
    case 'epic': return 'from-purple-500 to-pink-600';
    case 'rare': return 'from-blue-500 to-cyan-600';
    case 'uncommon': return 'from-green-500 to-emerald-600';
    default: return 'from-gray-400 to-gray-600';
  }
};

export default AchievementProgress;