import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Send, Image, Hash, AtSign, Smile, TrendingUp, Clock, Eye, Edit, Trash2, Flag, Lock, X, ChevronDown, ChevronRight, User, Link as LinkIcon, Zap, Users, List, Filter, RefreshCw, BarChart3, CheckCircle, ThumbsUp } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import UserHoverCard from './UserHoverCard';
import ReportForm from './ReportForm';
import api from '../services/api';
import { getAvatarUrl, getUserDisplayName } from '../utils/avatarUtils';

// API functions using real backend
const API = {
  getPosts: async (params) => {
    try {
      // Determine which endpoint to use based on feed type
      const feedType = params.feedType || 'intelligent';
      let data;
      
      switch (feedType) {
        case 'intelligent':
          data = await api.posts.rankedFeed(params);
          break;
        case 'smart':
          data = await api.posts.smartFeed(params);
          break;
        case 'following':
          data = await api.posts.following(params);
          break;
        case 'trending':
          data = await api.posts.trending(params);
          break;
        case 'latest':
        default:
          data = await api.posts.list(params);
          break;
      }
      
      return data;
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      // Return empty result on error
      return { results: [], count: 0, next: null };
    }
  },

  // Track post view for ranking algorithm
  trackView: async (postId) => {
    try {
      await api.posts.trackView(postId);
    } catch (error) {
      // Don't throw error for tracking failures
    }
  },
  
  createPost: async (data) => {
    try {
      const result = await api.posts.create(data);
      return result;
    } catch (error) {
      console.error('Failed to create post:', error);
      throw error;
    }
  },
  
  reactToPost: async (postId, reactionType) => {
    try {
      const result = await api.posts.react(postId, reactionType);
      return result;
    } catch (error) {
      console.error('Failed to react to post:', error);
      throw error;
    }
  },
  
  unreactToPost: async (postId, currentReactionType) => {
    try {
      // To unreact, send the same reaction_type again to toggle it off
      const result = await api.posts.react(postId, currentReactionType);
      return result;
    } catch (error) {
      console.error('Failed to unreact to post:', error);
      throw error;
    }
  },
  
  createComment: async (postId, data) => {
    try {
      const result = await api.posts.addComment(postId, data);
      return result;
    } catch (error) {
      console.error('Failed to create comment:', error);
      throw error;
    }
  },
  
  toggleBookmark: async (postId) => {
    try {
      const result = await api.posts.bookmark(postId);
      return result;
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
      throw error;
    }
  },

  sharePost: async (postId, platform) => {
    try {
      const result = await api.posts.share(postId, platform);
      return result;
    } catch (error) {
      console.error('Failed to share post:', error);
      throw error;
    }
  },

  getComments: async (postId) => {
    try {
      const result = await api.posts.getComments(postId);
      return result;
    } catch (error) {
      console.error('Failed to get comments:', error);
      throw error;
    }
  },

  likeComment: async (commentId) => {
    try {
      const result = await api.comments.like(commentId);
      return result;
    } catch (error) {
      console.error('Failed to like comment:', error);
      throw error;
    }
  },

  unlikeComment: async (commentId) => {
    try {
      const result = await api.comments.unlike(commentId);
      return result;
    } catch (error) {
      console.error('Failed to unlike comment:', error);
      throw error;
    }
  },

  replyToComment: async (postId, parentCommentId, content) => {
    try {
      const result = await api.comments.reply(postId, parentCommentId, content);
      return result;
    } catch (error) {
      console.error('Failed to reply to comment:', error);
      throw error;
    }
  },

  loadMoreReplies: async (commentId, offset, limit) => {
    try {
      const result = await api.comments.loadMoreReplies(commentId, offset, limit);
      return result;
    } catch (error) {
      console.error('Failed to load more replies:', error);
      throw error;
    }
  },

  voteInPoll: async (postId, optionId) => {
    try {
      const result = await api.posts.votePoll(postId, optionId);
      return result;
    } catch (error) {
      console.error('Failed to vote in poll:', error);
      throw error;
    }
  },

  removePollVote: async (postId, optionId) => {
    try {
      const result = await api.posts.removePollVote(postId, optionId);
      return result;
    } catch (error) {
      console.error('Failed to remove poll vote:', error);
      throw error;
    }
  },

  // Submit report (supports both user and post reports)
  submitReport: async (reportData, reportType = 'post') => {
    try {
      const endpoint = reportType === 'post' ? '/api/reports/posts/' : '/api/reports/users/';
      console.log('API submitReport called:', { endpoint, reportData, reportType });
      const response = await api.post(endpoint, reportData);
      console.log('API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to submit report:', error);
      console.error('API Error details:', error.response?.data);
      throw error;
    }
  },

  // Check if user already reported someone (for user reports)
  checkReportExists: async (userId) => {
    try {
      const response = await api.get(`/reports/users/check-exists/${userId}/`);
      return response.data;
    } catch (error) {
      console.error('Failed to check report status:', error);
      throw error;
    }
  }
};

// Reaction types
const REACTION_TYPES = [
  { type: 'like', emoji: '👍', label: 'Like' },
  { type: 'love', emoji: '❤️', label: 'Love' },
  { type: 'insightful', emoji: '💡', label: 'Insightful' },
  { type: 'celebrate', emoji: '🎉', label: 'Celebrate' },
  { type: 'support', emoji: '🤝', label: 'Support' },
  { type: 'curious', emoji: '🤔', label: 'Curious' }
];

// Poll Component
const Poll = ({ poll, postId, onUpdate }) => {
  const { user } = useContext(AuthContext);
  
  // Helper function to get user-specific localStorage key
  const getUserSpecificKey = (baseKey) => {
    return user?.id ? `${baseKey}_user_${user.id}` : baseKey;
  };
  
  // Get initial poll state from localStorage or poll data
  const getInitialPollState = () => {
    // User-specific votes
    const userPollVotes = JSON.parse(localStorage.getItem(getUserSpecificKey('userPollVotes')) || '{}');
    const pollKey = `${postId}`;
    const localOptions = userPollVotes[pollKey] || poll.user_votes || [];
    // Ensure all option IDs are numbers for consistent comparison
    return localOptions.map(id => typeof id === 'string' ? parseInt(id) : id);
  };
  
  const getInitialShowResults = () => {
    const userPollVotes = JSON.parse(localStorage.getItem(getUserSpecificKey('userPollVotes')) || '{}');
    const pollKey = `${postId}`;
    return userPollVotes[pollKey]?.length > 0 || poll.user_has_voted || poll.show_results_before_vote;
  };

  const [selectedOptions, setSelectedOptions] = useState(getInitialPollState());
  const [isVoting, setIsVoting] = useState(false);
  const [showResults, setShowResults] = useState(getInitialShowResults());
  const [voteCounts, setVoteCounts] = useState({});
  
  // Load global vote counts
  useEffect(() => {
    const globalPollResults = JSON.parse(localStorage.getItem('globalPollResults') || '{}');
    const pollKey = `${postId}`;
    if (globalPollResults[pollKey]) {
      setVoteCounts(globalPollResults[pollKey]);
    } else {
      // Initialize with server data
      const initialCounts = {};
      poll.options.forEach(opt => {
        initialCounts[opt.id] = opt.vote_count || 0;
      });
      setVoteCounts(initialCounts);
    }
  }, [postId, poll.options]);

  const handleVote = async (optionId) => {
    if (!user) {
      alert('Please log in to vote');
      return;
    }

    if (!poll.is_active) {
      alert('This poll has ended');
      return;
    }

    // Ensure optionId is the correct type (convert to number if needed)
    const normalizedOptionId = typeof optionId === 'string' ? parseInt(optionId) : optionId;

    // Optimistic update for better UX
    const previousSelectedOptions = [...selectedOptions];
    const previousShowResults = showResults;
    
    setIsVoting(true);
    
    let newSelectedOptions;
    
    if (poll.multiple_choice) {
      // Handle multiple choice polls
      if (selectedOptions.includes(normalizedOptionId)) {
        // Remove vote
        newSelectedOptions = selectedOptions.filter(id => id !== normalizedOptionId);
      } else {
        // Add vote
        if (selectedOptions.length >= poll.max_selections) {
          alert(`You can only vote for up to ${poll.max_selections} options`);
          setIsVoting(false);
          return;
        }
        newSelectedOptions = [...selectedOptions, normalizedOptionId];
      }
    } else {
      // Handle single choice polls - always allow changing vote
      newSelectedOptions = [normalizedOptionId];
    }

    // Apply optimistic update immediately
    setSelectedOptions(newSelectedOptions);
    setShowResults(true);
    
    // Save to localStorage for persistence
    // Save user-specific votes
    const userPollVotesKey = getUserSpecificKey('userPollVotes');
    const userPollVotes = JSON.parse(localStorage.getItem(userPollVotesKey) || '{}');
    const pollKey = `${postId}`;
    userPollVotes[pollKey] = newSelectedOptions;
    localStorage.setItem(userPollVotesKey, JSON.stringify(userPollVotes));
    
    // Update global poll results (for display purposes)
    const globalPollResults = JSON.parse(localStorage.getItem('globalPollResults') || '{}');
    if (!globalPollResults[pollKey]) {
      globalPollResults[pollKey] = {};
      poll.options.forEach(opt => {
        globalPollResults[pollKey][opt.id] = opt.vote_count || 0;
      });
    }
    
    // Update vote counts based on the change
    if (!poll.multiple_choice && previousSelectedOptions.length > 0) {
      // For single choice, remove previous vote
      const prevOption = previousSelectedOptions[0];
      if (globalPollResults[pollKey][prevOption] > 0) {
        globalPollResults[pollKey][prevOption]--;
      }
    }
    
    // Add new vote
    if (newSelectedOptions.includes(normalizedOptionId)) {
      globalPollResults[pollKey][normalizedOptionId] = (globalPollResults[pollKey][normalizedOptionId] || 0) + 1;
    }
    
    localStorage.setItem('globalPollResults', JSON.stringify(globalPollResults));
    
    // Update local vote counts state
    setVoteCounts(globalPollResults[pollKey]);

    try {
      if (poll.multiple_choice) {
        // Handle multiple choice polls
        if (previousSelectedOptions.includes(normalizedOptionId)) {
          // Remove vote
          await API.removePollVote(postId, normalizedOptionId);
        } else {
          // Add vote
          await API.voteInPoll(postId, normalizedOptionId);
        }
      } else {
        // Handle single choice polls
        // For single choice, we need to remove the old vote first if there was one
        if (previousSelectedOptions.length > 0 && previousSelectedOptions[0] !== normalizedOptionId) {
          await API.removePollVote(postId, previousSelectedOptions[0]);
        }
        // Then add the new vote
        await API.voteInPoll(postId, normalizedOptionId);
      }

      // Refresh post data to get updated poll results if backend works
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error voting:', error);
      // Keep the optimistic update since backend isn't implemented
      console.warn('Poll voting feature may not be fully implemented on the backend yet. Using localStorage for persistence.');
    } finally {
      setIsVoting(false);
    }
  };

  const formatTimeRemaining = (seconds) => {
    if (seconds <= 0) return 'Poll ended';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    if (minutes > 0) return `${minutes}m remaining`;
    return 'Less than 1m remaining';
  };

  const canShowResults = poll.allow_result_view_without_vote || poll.user_has_voted || poll.show_results_before_vote;

  return (
    <div className="mt-4 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200 w-full max-w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-3 min-w-0">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 flex-shrink-0" />
          <span className="font-medium text-gray-900 text-sm sm:text-base">Poll</span>
          {poll.multiple_choice && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded whitespace-nowrap">
              Choose up to {poll.max_selections}
            </span>
          )}
        </div>
        <div className="text-xs sm:text-sm text-gray-500 flex-shrink-0 ml-2">
          {Object.values(voteCounts).reduce((sum, count) => sum + count, 0) || poll.total_votes} vote{(Object.values(voteCounts).reduce((sum, count) => sum + count, 0) || poll.total_votes) !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="space-y-3">
        {poll.options.map((option) => {
          const normalizedOptionId = typeof option.id === 'string' ? parseInt(option.id) : option.id;
          const isSelected = selectedOptions.includes(normalizedOptionId);
          const currentVoteCount = voteCounts[normalizedOptionId] || option.vote_count || 0;
          const totalVotes = Object.values(voteCounts).reduce((sum, count) => sum + count, 0) || poll.total_votes;
          const percentage = totalVotes > 0 ? Math.round((currentVoteCount / totalVotes) * 100) : 0;
          const isWinning = poll.options.length > 1 && currentVoteCount > 0 && 
            currentVoteCount === Math.max(...Object.values(voteCounts));

          return (
            <div key={option.id} className="relative w-full">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleVote(normalizedOptionId);
                }}
                disabled={isVoting || !poll.is_active}
                className={`w-full text-left p-2 sm:p-3 rounded-lg border transition-all duration-50 min-w-0 ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                } ${
                  isVoting || !poll.is_active ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between min-w-0 gap-2">
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                    {isSelected && (
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 flex-shrink-0" />
                    )}
                    <span className="font-medium text-gray-900 text-sm sm:text-base break-words line-clamp-2 flex-1 min-w-0">
                      {option.text}
                    </span>
                    {isWinning && showResults && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded whitespace-nowrap flex-shrink-0">
                        Leading
                      </span>
                    )}
                  </div>
                  {showResults && canShowResults && (
                    <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                      <span className="text-xs sm:text-sm text-gray-600 font-medium">
                        {percentage}%
                      </span>
                      <span className="text-xs text-gray-500">
                        ({currentVoteCount})
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Progress bar */}
                {showResults && canShowResults && (
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                    <div
                      className={`h-1.5 sm:h-2 rounded-full transition-all duration-100 ${
                        isWinning ? 'bg-yellow-400' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Poll status */}
      <div className="mt-3 flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 text-xs sm:text-sm text-gray-500">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          {poll.time_remaining !== null && (
            <span className="whitespace-nowrap">{formatTimeRemaining(poll.time_remaining)}</span>
          )}
          {poll.anonymous_voting && (
            <span className="flex items-center space-x-1 whitespace-nowrap">
              <User className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Anonymous</span>
            </span>
          )}
        </div>
        {!showResults && canShowResults && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowResults(true);
            }}
            className="text-indigo-600 hover:text-indigo-700 underline text-xs sm:text-sm self-start sm:self-auto whitespace-nowrap"
          >
            View results
          </button>
        )}
      </div>
    </div>
  );
};

// Comment Component
const Comment = ({ comment, onReply, postId, isReply = false }) => {
  const { user } = useContext(AuthContext);
  
  // Helper function to get user-specific localStorage key
  const getUserSpecificKey = (baseKey) => {
    return user?.id ? `${baseKey}_user_${user.id}` : baseKey;
  };
  
  // Get initial like state from localStorage or comment data
  const getInitialLikeState = () => {
    // User-specific liked state
    const userLikedStates = JSON.parse(localStorage.getItem(getUserSpecificKey('commentLikedStates')) || '{}');
    return userLikedStates[comment.id] ?? comment.is_liked;
  };
  
  const getInitialLikeCount = () => {
    // Global like count (shared across all users)
    const globalLikeCounts = JSON.parse(localStorage.getItem('commentLikeCounts') || '{}');
    return globalLikeCounts[comment.id] ?? comment.like_count;
  };

  const [isLiked, setIsLiked] = useState(getInitialLikeState());
  const [likeCount, setLikeCount] = useState(getInitialLikeCount());
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  
  // Update like count when component mounts or comment changes
  useEffect(() => {
    const globalLikeCounts = JSON.parse(localStorage.getItem('commentLikeCounts') || '{}');
    const storedCount = globalLikeCounts[comment.id];
    if (storedCount !== undefined && storedCount !== likeCount) {
      setLikeCount(storedCount);
    }
  }, [comment.id]);
  const [replies, setReplies] = useState(comment.replies || []);
  const [hasMoreReplies, setHasMoreReplies] = useState(comment.has_more_replies || false);
  const [remainingRepliesCount, setRemainingRepliesCount] = useState(comment.remaining_replies_count || 0);
  const [loadingMoreReplies, setLoadingMoreReplies] = useState(false);

  const handleLike = async () => {
    // Optimistic update for better UX
    const previousIsLiked = isLiked;
    const previousLikeCount = likeCount;
    const newIsLiked = !previousIsLiked;
    const newLikeCount = previousIsLiked ? previousLikeCount - 1 : previousLikeCount + 1;
    
    // Apply optimistic update immediately
    setIsLiked(newIsLiked);
    setLikeCount(newLikeCount);
    
    // Save to localStorage for persistence until backend is ready
    // Save user-specific liked state
    const userLikedStatesKey = getUserSpecificKey('commentLikedStates');
    const userLikedStates = JSON.parse(localStorage.getItem(userLikedStatesKey) || '{}');
    userLikedStates[comment.id] = newIsLiked;
    localStorage.setItem(userLikedStatesKey, JSON.stringify(userLikedStates));
    
    // Save global like count
    const globalLikeCounts = JSON.parse(localStorage.getItem('commentLikeCounts') || '{}');
    globalLikeCounts[comment.id] = newLikeCount;
    localStorage.setItem('commentLikeCounts', JSON.stringify(globalLikeCounts));
    
    try {
      if (previousIsLiked) {
        const result = await API.unlikeComment(comment.id);
        const finalLikeCount = result.like_count !== undefined ? result.like_count : newLikeCount;
        setLikeCount(finalLikeCount);
        // Update global like count in localStorage
        globalLikeCounts[comment.id] = finalLikeCount;
        localStorage.setItem('commentLikeCounts', JSON.stringify(globalLikeCounts));
      } else {
        const result = await API.likeComment(comment.id);
        const finalLikeCount = result.like_count !== undefined ? result.like_count : newLikeCount;
        setLikeCount(finalLikeCount);
        // Update global like count in localStorage
        globalLikeCounts[comment.id] = finalLikeCount;
        localStorage.setItem('commentLikeCounts', JSON.stringify(globalLikeCounts));
      }
    } catch (error) {
      console.error('Error liking comment:', error);
      // Keep the optimistic update and localStorage since backend isn't implemented
      console.warn('Comment liking feature may not be fully implemented on the backend yet. Using localStorage for persistence.');
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    
    try {
      const newReply = await API.replyToComment(postId, comment.id, replyText);
      
      // Add the new reply to local state
      setReplies(prevReplies => [...prevReplies, newReply]);
      
      // Call the onReply callback to update the parent component
      if (onReply) {
        onReply(comment.id, newReply);
      }
      
      setReplyText('');
      setShowReplyInput(false);
    } catch (error) {
      console.error('Error creating reply:', error);
      alert('Failed to post reply. Please try again.');
    }
  };

  const handleLoadMoreReplies = async () => {
    if (loadingMoreReplies) return;
    
    setLoadingMoreReplies(true);
    try {
      const offset = replies.length; // Current replies count
      const result = await API.loadMoreReplies(comment.id, offset, 10);
      
      // Add new replies to existing ones
      setReplies(prevReplies => [...prevReplies, ...result.replies]);
      setHasMoreReplies(result.has_more);
      setRemainingRepliesCount(result.remaining_count);
    } catch (error) {
      console.error('Error loading more replies:', error);
      alert('Failed to load more replies. Please try again.');
    } finally {
      setLoadingMoreReplies(false);
    }
  };

  return (
    <div className="flex space-x-2 sm:space-x-3 w-full">
      <UserHoverCard user={comment.author} placement="right">
        {comment.author.avatar_url ? (
          <img
            src={comment.author.avatar_url}
            alt={comment.author.display_name}
            className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex-shrink-0"
            onError={(e) => {
              // On error, replace with initials div
              e.target.style.display = 'none';
              const initialsDiv = document.createElement('div');
              initialsDiv.className = 'w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0';
              const name = comment.author.display_name || comment.author.first_name || comment.author.username || 'User';
              const initials = name.trim().slice(0, 2).toUpperCase();
              initialsDiv.textContent = initials;
              e.target.parentNode.appendChild(initialsDiv);
            }}
          />
        ) : (
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
            {(() => {
              const name = comment.author.display_name || comment.author.first_name || comment.author.username || 'User';
              return name.trim().slice(0, 2).toUpperCase();
            })()}
          </div>
        )}
      </UserHoverCard>
      <div className="flex-1 min-w-0">
        <div className="bg-gray-50 rounded-lg px-3 sm:px-4 py-2 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
            <div className="flex items-center space-x-2 min-w-0">
              <UserHoverCard user={comment.author} placement="bottom">
                <span className="font-semibold text-gray-900 hover:text-blue-600 cursor-pointer text-sm sm:text-base truncate">
                  {comment.author.display_name}
                </span>
              </UserHoverCard>
              {comment.author.username && (
                <>
                  <UserHoverCard user={comment.author} placement="bottom">
                    <span className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 cursor-pointer truncate">
                      @{comment.author.username}
                    </span>
                  </UserHoverCard>
                  <span className="text-xs sm:text-sm text-gray-500 hidden sm:inline">·</span>
                </>
              )}
            </div>
            <span className="text-xs sm:text-sm text-gray-500 flex-shrink-0">{comment.time_since}</span>
          </div>
          <p className="text-gray-700 mt-1 text-sm sm:text-base break-words">{comment.content}</p>
        </div>
        <div className="flex items-center space-x-3 sm:space-x-4 mt-2 text-xs sm:text-sm">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleLike();
            }}
            className={`flex items-center space-x-1 px-2 py-1.5 rounded-lg transition-all duration-200 font-medium text-xs sm:text-sm ${
              isLiked
                ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
            }`}
          >
            <ThumbsUp className={`w-3 h-3 sm:w-4 sm:h-4 ${isLiked ? 'fill-current' : ''}`} />
            <span className="whitespace-nowrap">
              {isLiked ? 'Liked' : 'Like'} {likeCount > 0 && `(${likeCount})`}
            </span>
          </button>
          {!isReply && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowReplyInput(!showReplyInput);
              }}
              className="text-gray-500 hover:text-gray-700 font-medium whitespace-nowrap"
            >
              Reply
            </button>
          )}
        </div>

        {showReplyInput && (
          <div className="mt-3 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onFocus={(e) => e.stopPropagation()}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.stopPropagation();
                  handleReply();
                }
              }}
              placeholder="Write a reply..."
              className="flex-1 px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 w-full"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleReply();
              }}
              disabled={!replyText.trim()}
              className="px-3 py-2 bg-indigo-600 text-white text-xs sm:text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              Reply
            </button>
          </div>
        )}

        {replies && replies.length > 0 && (
          <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3 ml-2 sm:ml-4 w-full overflow-hidden">
            {replies.map(reply => (
              <Comment 
                key={reply.id} 
                comment={reply} 
                onReply={onReply}
                postId={postId}
                isReply={true}
              />
            ))}
            
            {hasMoreReplies && (
              <div className="ml-2 sm:ml-4">
                <button
                  onClick={handleLoadMoreReplies}
                  disabled={loadingMoreReplies}
                  className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingMoreReplies ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      <span>Load {remainingRepliesCount} more {remainingRepliesCount === 1 ? 'reply' : 'replies'}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Post Component
const Post = ({ post, onUpdate, feedType }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const commentsRef = useRef(null);
  const [showComments, setShowComments] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showReactionsSummary, setShowReactionsSummary] = useState(false);
  const [isLiked, setIsLiked] = useState(post.is_liked);
  const [likeCount, setLikeCount] = useState(post.like_count);

  // Function to handle comment navigation (show comments and scroll to them)
  const handleCommentClick = (e) => {
    e.stopPropagation();
    
    // Show comments if not already shown
    if (!showComments) {
      setShowComments(true);
      
      // Wait for the comments section to render, then scroll to it
      setTimeout(() => {
        if (commentsRef.current) {
          commentsRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }
      }, 100);
    } else {
      // If comments are already shown, just scroll to them
      if (commentsRef.current) {
        commentsRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }
    }
  };

  // Helper function to get user-specific localStorage key
  const getUserSpecificKey = (baseKey) => {
    return user?.id ? `${baseKey}_user_${user.id}` : baseKey;
  };
  
  // Get initial reaction state from localStorage or post data
  const getInitialReactionState = () => {
    const localReactions = JSON.parse(localStorage.getItem(getUserSpecificKey('postReactions')) || '{}');
    return localReactions[post.id] || post.user_reaction;
  };

  const [userReaction, setUserReaction] = useState(getInitialReactionState());
  
  // Get initial bookmark state from localStorage or post data
  const getInitialBookmarkState = () => {
    const userBookmarks = JSON.parse(localStorage.getItem(getUserSpecificKey('userBookmarks')) || '{}');
    return userBookmarks[post.id] ?? post.is_bookmarked;
  };
  
  const [isBookmarked, setIsBookmarked] = useState(getInitialBookmarkState());
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [reactionsSummary, setReactionsSummary] = useState(post.top_reactions || []);
  const [totalReactions, setTotalReactions] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEditHistory, setShowEditHistory] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isViewed, setIsViewed] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showFullPost, setShowFullPost] = useState(false);
  
  // Debug: Log when modal state changes
  useEffect(() => {
    console.log('Post modal state changed:', showFullPost);
  }, [showFullPost]);

  // Add keyboard event listener for Escape key when modal is open
  useEffect(() => {
    if (!showFullPost) return;
    
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        console.log('Escape key pressed, closing modal');
        setShowFullPost(false);
        setShowImageModal(false);
        setShowReactionsSummary(false);
        setShowEditModal(false);
        setShowEditHistory(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showFullPost]);
  const [showReportModal, setShowReportModal] = useState(false);
  const postRef = useRef(null);

  // Debug: Track showReportModal state changes
  useEffect(() => {
    console.log('showReportModal state changed:', showReportModal);
  }, [showReportModal]);

  // Mock comments data
  const mockComments = [
    {
      id: '1',
      author: {
        id: 10,
        display_name: 'David Kim',
        avatar_url: 'https://ui-avatars.com/?name=David+Kim&background=f59e0b&color=fff'
      },
      content: 'Great insights! The point about focusing on one core metric really resonates with me.',
      time_since: '1 hour ago',
      like_count: 5,
      is_liked: false,
      replies: []
    },
    {
      id: '2',
      author: {
        id: 11,
        display_name: 'Emily Watson',
        avatar_url: 'https://ui-avatars.com/?name=Emily+Watson&background=8b5cf6&color=fff'
      },
      content: 'Congratulations on hitting 1M users! Would love to hear more about your distribution strategy.',
      time_since: '30 minutes ago',
      like_count: 3,
      is_liked: true,
      replies: []
    }
  ];

  useEffect(() => {
    if (showComments) {
      loadComments();
    }
  }, [showComments]);

  useEffect(() => {
    // Calculate total reactions from summary
    const total = reactionsSummary.reduce((sum, reaction) => sum + (reaction.count || 0), 0);
    setTotalReactions(total);
  }, [reactionsSummary]);

  // Handle ESC key to close modals
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        if (showImageModal) {
          setShowImageModal(false);
        } else if (showFullPost) {
          setShowFullPost(false);
        }
      }
    };
    
    if (showImageModal || showFullPost) {
      document.addEventListener('keydown', handleEsc);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [showImageModal, showFullPost]);

  // Load comments when full post modal opens
  useEffect(() => {
    if (showFullPost && comments.length === 0) {
      loadComments();
    }
  }, [showFullPost]);

  // Track post view using Intersection Observer
  useEffect(() => {
    if (!postRef.current || isViewed) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isViewed) {
          // Post is visible, track the view
          setIsViewed(true);
          API.trackView(post.id);
        }
      },
      {
        threshold: 0.5, // Trigger when 50% of the post is visible
        rootMargin: '0px 0px -100px 0px' // Only trigger when post is well into viewport
      }
    );

    observer.observe(postRef.current);

    return () => {
      if (postRef.current) {
        observer.unobserve(postRef.current);
      }
    };
  }, [post.id, isViewed]);
  
  // Add loadComments to prevent ESLint warnings
  // eslint-disable-next-line react-hooks/exhaustive-deps

  const loadComments = async () => {
    try {
      const commentsData = await API.getComments(post.id);
      setComments(commentsData.results || commentsData || []);
    } catch (error) {
      console.error('Failed to load comments:', error);
      setComments([]);
    }
  };

  const loadReactionsSummary = async () => {
    try {
      const response = await API.posts.getReactionsSummary?.(post.id);
      if (response) {
        const summaryArray = Object.entries(response).map(([type, data]) => ({
          type,
          emoji: data.emoji,
          count: data.count,
          users: data.users
        }));
        setReactionsSummary(summaryArray);
      }
    } catch (error) {
      console.error('Failed to load reactions summary:', error);
    }
  };

  const updateReactionsSummary = (newReactionType, oldReactionType, isRemoving = false) => {
    setReactionsSummary(prev => {
      let updated = [...prev];
      
      // If removing a reaction
      if (isRemoving && oldReactionType) {
        updated = updated.map(r => 
          r.type === oldReactionType 
            ? { ...r, count: Math.max(0, r.count - 1) }
            : r
        ).filter(r => r.count > 0);
        return updated;
      }
      
      // If changing reaction type
      if (oldReactionType && oldReactionType !== newReactionType) {
        // Remove from old reaction
        updated = updated.map(r => 
          r.type === oldReactionType 
            ? { ...r, count: Math.max(0, r.count - 1) }
            : r
        ).filter(r => r.count > 0);
      }
      
      // Add to new reaction
      if (newReactionType) {
        const existingReaction = updated.find(r => r.type === newReactionType);
        if (existingReaction) {
          updated = updated.map(r => 
            r.type === newReactionType 
              ? { ...r, count: r.count + 1 }
              : r
          );
        } else {
          const reactionEmoji = REACTION_TYPES.find(r => r.type === newReactionType)?.emoji;
          updated.push({
            type: newReactionType,
            emoji: reactionEmoji,
            count: 1
          });
        }
      }
      
      return updated.sort((a, b) => b.count - a.count);
    });
  };

  const handleReaction = async (reactionType) => {
    try {
      const oldReactionType = userReaction?.type;
      
      if (userReaction?.type === reactionType) {
        // Remove reaction by sending the same type again
        const result = await API.unreactToPost(post.id, userReaction.type);
        
        // Update state immediately for UI responsiveness
        setUserReaction(null);
        setIsLiked(false);
        updateReactionsSummary(null, oldReactionType, true);
        
        // Save to localStorage
        const postReactionsKey = getUserSpecificKey('postReactions');
        const localReactions = JSON.parse(localStorage.getItem(postReactionsKey) || '{}');
        delete localReactions[post.id];
        localStorage.setItem(postReactionsKey, JSON.stringify(localReactions));
        
        if (result && typeof result.like_count === 'number') {
          setLikeCount(result.like_count);
        }
      } else {
        // Add/change reaction - this handles both new reactions and changing existing ones
        const result = await API.reactToPost(post.id, reactionType);
        
        // Update state immediately for UI responsiveness
        const reactionEmoji = REACTION_TYPES.find(r => r.type === reactionType)?.emoji;
        const newReaction = { type: reactionType, emoji: reactionEmoji };
        setUserReaction(newReaction);
        setIsLiked(reactionType === 'like');
        updateReactionsSummary(reactionType, oldReactionType);
        
        // Save to localStorage
        const postReactionsKey = getUserSpecificKey('postReactions');
        const localReactions = JSON.parse(localStorage.getItem(postReactionsKey) || '{}');
        localReactions[post.id] = newReaction;
        localStorage.setItem(postReactionsKey, JSON.stringify(localReactions));
        
        if (result && typeof result.like_count === 'number') {
          setLikeCount(result.like_count);
        }
      }
      // Don't automatically close the reactions picker - let the onClick handler do it
    } catch (error) {
      console.error('Error reacting to post:', error);
      console.warn('Reaction API may not be fully implemented yet. Using localStorage for persistence.');
      
      // Still update localStorage and UI for better UX even if API fails
      if (userReaction?.type === reactionType) {
        // Remove reaction
        setUserReaction(null);
        setIsLiked(false);
        const postReactionsKey = getUserSpecificKey('postReactions');
        const localReactions = JSON.parse(localStorage.getItem(postReactionsKey) || '{}');
        delete localReactions[post.id];
        localStorage.setItem(postReactionsKey, JSON.stringify(localReactions));
      } else {
        // Add/change reaction
        const reactionEmoji = REACTION_TYPES.find(r => r.type === reactionType)?.emoji;
        const newReaction = { type: reactionType, emoji: reactionEmoji };
        setUserReaction(newReaction);
        setIsLiked(reactionType === 'like');
        const postReactionsKey = getUserSpecificKey('postReactions');
        const localReactions = JSON.parse(localStorage.getItem(postReactionsKey) || '{}');
        localReactions[post.id] = newReaction;
        localStorage.setItem(postReactionsKey, JSON.stringify(localReactions));
      }
    }
  };

  const handleBookmark = async () => {
    // Optimistic update
    const newBookmarkState = !isBookmarked;
    setIsBookmarked(newBookmarkState);
    
    // Save to localStorage immediately
    const userBookmarksKey = getUserSpecificKey('userBookmarks');
    const userBookmarks = JSON.parse(localStorage.getItem(userBookmarksKey) || '{}');
    userBookmarks[post.id] = newBookmarkState;
    localStorage.setItem(userBookmarksKey, JSON.stringify(userBookmarks));
    
    try {
      const result = await API.toggleBookmark(post.id);
      if (result && typeof result.bookmarked === 'boolean') {
        // Update with server response if different
        if (result.bookmarked !== newBookmarkState) {
          setIsBookmarked(result.bookmarked);
          userBookmarks[post.id] = result.bookmarked;
          localStorage.setItem(userBookmarksKey, JSON.stringify(userBookmarks));
        }
      }
    } catch (error) {
      console.error('Error bookmarking post:', error);
      // Keep the optimistic update and localStorage state
      console.warn('Bookmark feature may not be fully implemented on the backend yet. Using localStorage for persistence.');
      // Don't show alert since we have a working fallback
    }
  };

  const handleReportSubmit = async (reportData) => {
    try {
      await API.submitReport(reportData, 'post');
      console.log('Post report submitted successfully');
    } catch (error) {
      console.error('Error submitting post report:', error);
      throw error; // Re-throw to let ReportForm handle the error
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const newComment = await API.createComment(post.id, { content: commentText });
      if (newComment) {
        setCommentText('');
        // Reload comments to show the new one
        await loadComments();
        // Update post comment count if possible
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment. Please try again.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleCommentReply = async (parentCommentId, newReply) => {
    try {
      
      // Add the new reply to the comments state
      setComments(prevComments => 
        prevComments.map(comment => {
          if (comment.id === parentCommentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), newReply]
            };
          }
          return comment;
        })
      );
      
      // Optionally reload all comments to get the most up-to-date data
      // await loadComments();
      
    } catch (error) {
      console.error('Error handling comment reply:', error);
    }
  };

  const handleShare = async (platform) => {
    try {
      if (platform === 'copy') {
        // Copy link to clipboard
        const url = `${window.location.origin}/posts/${post.id}`;
        await navigator.clipboard.writeText(url);
        // Link copied to clipboard
      } else {
        // Call the share API for other platforms
        await API.sharePost(post.id, platform);
        // Shared on platform
      }
      setShowShareMenu(false);
    } catch (error) {
      console.error('Error sharing post:', error);
      setShowShareMenu(false);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await api.posts.delete(post.id);
      // Notify parent component to refresh the posts list
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditPost = () => {
    setEditTitle(post.title || '');
    setEditContent(post.content || post.content_preview || '');
    setShowEditModal(true);
  };

  const handleProfileClick = (e) => {
    e.stopPropagation(); // Prevent post detail from opening
    if (!post.is_anonymous && post.author?.username) {
      navigate(`/profile/${post.author.username}`);
    }
  };

  const handleUpdatePost = async () => {
    if (!editContent.trim() || isUpdating) return;

    setIsUpdating(true);
    try {
      const updateData = {
        title: editTitle,
        content: editContent
      };
      
      await api.posts.update(post.id, updateData);
      setShowEditModal(false);
      
      // Notify parent component to refresh the posts list
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Failed to update post. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleShowEditHistory = () => {
    setShowEditHistory(true);
  };

  return (
    <div 
      ref={postRef}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 transition-all duration-100 hover:shadow-md cursor-pointer mx-2 sm:mx-0 ${post.is_pinned ? 'ring-2 ring-indigo-500' : ''} overflow-hidden`}
      onClick={(e) => {
        // Don't open modal if clicking on interactive elements
        if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input') || e.target.closest('textarea')) {
          return;
        }
        console.log('Post clicked, opening modal');
        setShowFullPost(true);
      }}
    >
      {/* Post Header */}
      <div className="p-3 sm:p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-2 sm:space-x-3 min-w-0 flex-1">
            {!post.is_anonymous ? (
              <UserHoverCard user={post.author} placement="bottom">
                <div className="relative cursor-pointer flex-shrink-0" onClick={handleProfileClick}>
                  {post.author.avatar_url ? (
                    <img
                      src={post.author.avatar_url}
                      alt={post.author.display_name}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full hover:ring-2 hover:ring-blue-300 transition-all"
                      onError={(e) => {
                        // On error, replace with initials div
                        e.target.style.display = 'none';
                        const initialsDiv = document.createElement('div');
                        initialsDiv.className = 'w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm hover:ring-2 hover:ring-blue-300 transition-all';
                        const name = post.author.display_name || post.author.first_name || post.author.username || 'User';
                        const initials = name.trim().slice(0, 2).toUpperCase();
                        initialsDiv.textContent = initials;
                        e.target.parentNode.appendChild(initialsDiv);
                      }}
                    />
                  ) : (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm hover:ring-2 hover:ring-blue-300 transition-all">
                      {(() => {
                        const name = post.author.display_name || post.author.first_name || post.author.username || 'User';
                        return name.trim().slice(0, 2).toUpperCase();
                      })()}
                    </div>
                  )}
                  {post.author.is_online && (
                    <div className="absolute bottom-0 right-0 w-2 h-2 sm:w-3 sm:h-3 bg-green-400 border-2 border-white rounded-full"></div>
                  )}
                </div>
              </UserHoverCard>
            ) : (
              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                  ?
                </div>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-1 sm:space-x-2 flex-wrap">
                {!post.is_anonymous ? (
                  <UserHoverCard user={post.author} placement="bottom">
                    <h3 className="font-semibold text-gray-900 hover:text-blue-600 cursor-pointer transition-colors text-sm sm:text-base truncate" onClick={handleProfileClick}>
                      {post.author.display_name}
                    </h3>
                  </UserHoverCard>
                ) : (
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Anonymous</h3>
                )}
                {!post.is_anonymous && post.author.username && (
                  <UserHoverCard user={post.author} placement="bottom">
                    <span className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 cursor-pointer transition-colors truncate" onClick={handleProfileClick}>
                      @{post.author.username}
                    </span>
                  </UserHoverCard>
                )}
                {post.author.is_verified && (
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                {post.is_pinned && (
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 sm:px-2 py-0.5 rounded flex-shrink-0">Pinned</span>
                )}
                {post.is_locked && (
                  <Lock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center space-x-1 sm:space-x-3 text-xs sm:text-sm text-gray-500 flex-wrap">
                <span className="flex-shrink-0">{post.time_since}</span>
                <span className="flex-shrink-0">·</span>
                <span className="flex-shrink-0">{post.read_time}</span>
                {!post.is_anonymous && post.author.headline && (
                  <>
                    <span className="hidden sm:inline flex-shrink-0">·</span>
                    <span className="hidden sm:inline truncate max-w-[120px] lg:max-w-xs">{post.author.headline}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowMoreMenu(!showMoreMenu);
              }}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            
            {showMoreMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                {/* User's own post options */}
                {user && post.author.id === user.id && (
                  <>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMoreMenu(false);
                        handleEditPost();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 flex items-center space-x-2"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit Post</span>
                    </button>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMoreMenu(false);
                        handleShowEditHistory();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <Clock className="w-4 h-4" />
                      <span>Edit History</span>
                    </button>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMoreMenu(false);
                        handleDeletePost();
                      }}
                      disabled={isDeleting}
                      className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>{isDeleting ? 'Deleting...' : 'Delete Post'}</span>
                    </button>
                    
                    <div className="border-t border-gray-100 my-1"></div>
                  </>
                )}
                
                {/* General options for all posts */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMoreMenu(false);
                    // TODO: Copy post link
                    const postUrl = `${window.location.origin}/posts/${post.id}`;
                    navigator.clipboard.writeText(postUrl);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                >
                  <LinkIcon className="w-4 h-4" />
                  <span>Copy Link</span>
                </button>
                
                {/* Follow option for other users' posts */}
                {user && post.author.id !== user.id && !post.author.is_following && !post.is_anonymous && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMoreMenu(false);
                      // TODO: Follow user
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <User className="w-4 h-4" />
                    <span>Follow {post.author.display_name}</span>
                  </button>
                )}
                
                {/* Report option for other users' posts */}
                {user && post.author.id !== user.id && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMoreMenu(false);
                      console.log('Report button clicked, opening modal...');
                      setShowReportModal(true);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Flag className="w-4 h-4" />
                    <span>Report Post</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Post Content */}
        <div className="mt-3 sm:mt-4 px-3 sm:px-4">
          {/* Clickable title and content */}
          <div 
            className="cursor-pointer" 
            onClick={(e) => {
              e.stopPropagation();
              console.log('Content area clicked, opening modal');
              setShowFullPost(true);
            }}
          >
            {/* Title - Always visible */}
            {post.title && (
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 hover:text-gray-700 transition-colors break-words">
                {post.title}
              </h2>
            )}
            
            {/* Content - Show full content when comments open, preview when closed */}
            <div className="text-sm sm:text-base text-gray-700 hover:text-gray-600 transition-colors break-words overflow-hidden">
              {showComments ? (
                <div className="space-y-2">
                  <p className="break-words whitespace-pre-wrap leading-relaxed">{post.content || post.content_preview || 'No content available'}</p>
                </div>
              ) : (
                <div>
                  <p className="break-words whitespace-pre-wrap leading-relaxed line-clamp-3">{post.content_preview || post.content || 'No content available'}</p>
                </div>
              )}
            </div>
            {/* Poll */}
            {post.poll && (
              <Poll 
                poll={post.poll} 
                postId={post.id} 
                onUpdate={() => onUpdate && onUpdate(post.id)}
              />
            )}

            {/* Post Images */}
            {post.first_image && (
              <div className="mt-4">
                <div className="relative group">
                  <img
                    src={post.first_image.image}
                    alt={post.first_image.caption || 'Post image'}
                    className="w-full h-auto max-h-96 object-cover rounded-lg cursor-pointer transition-all duration-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      // In post feed: clicking image opens post detail
                      setShowFullPost(true);
                    }}
                    onError={(e) => {
                      console.error('Image failed to load:', post.first_image);
                    }}
                  />
                  {/* Subtle indicator for clickable images */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 rounded-lg transition-all duration-50 flex items-end justify-end p-2">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-50 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      Click to view post
                    </div>
                  </div>
                  {post.first_image.caption && (
                    <p className="text-xs text-gray-600 mt-1">{post.first_image.caption}</p>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Show "Read more" link if content is truncated and comments not shown */}
          {!showComments && post.content_preview && post.content?.length > post.content_preview?.length && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowComments(true);
              }}
              className="text-indigo-600 hover:text-indigo-700 text-sm font-medium mt-2 underline"
            >
              Read more...
            </button>
          )}
          
          {/* Topics */}
          {post.topics.length > 0 && (
            <div className="flex flex-wrap gap-1 sm:gap-2 mt-3 mb-4">
              {post.topics.map(topic => (
                <span
                  key={topic.id}
                  className="text-blue-600 text-xs sm:text-sm hover:underline cursor-pointer bg-blue-50 px-2 py-1 rounded-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  {topic.icon && <span className="mr-1">{topic.icon}</span>}
                  #{topic.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Post Stats */}
        <div className="px-3 sm:px-6 pb-3 sm:pb-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 mb-3">
            <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto">
              {reactionsSummary.length > 0 ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowReactionsSummary(true);
                    loadReactionsSummary();
                  }}
                  className="flex items-center space-x-1 hover:bg-gray-50 rounded px-1 py-1 transition-colors flex-shrink-0"
                >
                  <ThumbsUp className="w-4 h-4 text-blue-500 fill-current" />
                  <span>{reactionsSummary.reduce((sum, r) => sum + r.count, 0)}</span>
                </button>
              ) : userReaction ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowReactionsSummary(true);
                    loadReactionsSummary();
                  }}
                  className="flex items-center space-x-1 hover:bg-gray-50 rounded px-1 py-1 transition-colors flex-shrink-0"
                >
                  <ThumbsUp className="w-4 h-4 text-blue-500 fill-current" />
                  <span>1</span>
                </button>
              ) : (
                <span className="flex-shrink-0 flex items-center space-x-1">
                  <ThumbsUp className="w-4 h-4 text-gray-400" />
                  <span>0</span>
                </span>
              )}
              <button 
                onClick={handleCommentClick}
                className="flex-shrink-0 hover:text-blue-600 hover:bg-blue-50 rounded px-2 py-1 transition-colors"
              >
                {comments.length > 0 ? comments.length : (post.comment_count || 0)} comments
              </button>
              <span className="flex-shrink-0">{post.share_count || 0} shares</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between border-t border-gray-100 pt-2 sm:pt-3">
            {/* Desktop Layout: Like, Share, Comment */}
            <div className="hidden sm:flex items-center space-x-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Direct click applies/removes like reaction
                  if (!userReaction || userReaction.type !== 'like') {
                    handleReaction('like');
                  } else {
                    // If already liked, remove the like
                    handleReaction('like');
                  }
                }}
                className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all duration-50 flex-shrink-0 font-medium ${
                  userReaction ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                <ThumbsUp className={`w-4 h-4 sm:w-5 sm:h-5 ${userReaction ? 'fill-current' : ''}`} />
                <span className="text-xs sm:text-sm font-medium">
                  {userReaction ? 'Liked' : 'Like'} {totalReactions > 0 && `(${totalReactions})`}
                </span>
              </button>
              
              <button
                onClick={handleCommentClick}
                disabled={post.is_locked}
                className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-colors flex-shrink-0 ${
                  post.is_locked 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : showComments 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="text-xs sm:text-sm font-medium">Comment</span>
              </button>
              
              <div className="relative">
                <button 
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  <span className="text-xs sm:text-sm font-medium">Share</span>
                </button>
                
                {showShareMenu && (
                  <div className="absolute left-0 bottom-full mb-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                    <button 
                      onClick={() => handleShare('copy')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Copy Link
                    </button>
                    <button 
                      onClick={() => handleShare('twitter')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Share on Twitter
                    </button>
                    <button 
                      onClick={() => handleShare('linkedin')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Share on LinkedIn
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Layout: Like, Comment, Share */}
            <div className="flex sm:hidden items-center justify-between flex-1 gap-1">
              <div className="flex-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Direct click applies/removes like reaction
                    if (!userReaction || userReaction.type !== 'like') {
                      handleReaction('like');
                    } else {
                      // If already liked, remove the like
                      handleReaction('like');
                    }
                  }}
                  className={`flex items-center justify-center space-x-1 px-2 py-1.5 rounded-lg transition-all duration-50 w-full font-medium ${
                    userReaction ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <ThumbsUp className={`w-4 h-4 ${userReaction ? 'fill-current' : ''}`} />
                  <span className="text-xs font-medium">
                    {userReaction ? 'Liked' : 'Like'} {totalReactions > 0 && `(${totalReactions})`}
                  </span>
                </button>
              </div>
              
              <div className="flex-1">
                <button
                  onClick={handleCommentClick}
                  disabled={post.is_locked}
                  className={`flex items-center justify-center space-x-1 px-2 py-1.5 rounded-lg transition-colors w-full ${
                    post.is_locked 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : showComments 
                        ? 'text-blue-600 bg-blue-50' 
                        : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="text-xs font-medium">Comment</span>
                </button>
              </div>

              <div className="relative flex-1">
                <button 
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="flex items-center justify-center space-x-1 px-2 py-1.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors w-full"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  <span className="text-xs font-medium">Share</span>
                </button>
                
                {showShareMenu && (
                  <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                    <button 
                      onClick={() => handleShare('copy')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Copy Link
                    </button>
                    <button 
                      onClick={() => handleShare('twitter')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Share on Twitter
                    </button>
                    <button 
                      onClick={() => handleShare('linkedin')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Share on LinkedIn
                    </button>
                  </div>
                )}
              </div>
            </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={(e) => e.stopPropagation()}
              className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm font-medium">{post.view_count.toLocaleString()}</span>
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleBookmark();
              }}
              className={`p-1 sm:p-1.5 rounded-lg transition-colors flex-shrink-0 ${
                isBookmarked ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Bookmark className={`w-4 h-4 sm:w-5 sm:h-5 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div ref={commentsRef} className="mt-4 pt-3 sm:pt-4 border-t border-gray-100 bg-gray-50 rounded-lg p-3 sm:p-4 w-full overflow-hidden">
            <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800">Comments</h4>
            
            {/* Comment Form - Always show unless locked */}
            <div className="bg-white rounded-lg p-3 sm:p-4 mb-3 sm:mb-4 shadow-sm border w-full">
              <div className="flex space-x-2 sm:space-x-3">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt="Your avatar"
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0"
                    onError={(e) => {
                      // On error, replace with initials div
                      e.target.style.display = 'none';
                      const initialsDiv = document.createElement('div');
                      initialsDiv.className = 'w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0';
                      const name = user?.first_name || user?.username || 'You';
                      const initials = name.trim().slice(0, 2).toUpperCase();
                      initialsDiv.textContent = initials;
                      e.target.parentNode.appendChild(initialsDiv);
                    }}
                  />
                ) : (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">
                    {(() => {
                      const name = user?.first_name || user?.username || 'You';
                      return name.trim().slice(0, 2).toUpperCase();
                    })()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                    placeholder={post.is_locked ? "Comments are locked for this post" : "Share your thoughts..."}
                    disabled={post.is_locked}
                    className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 disabled:bg-gray-100 disabled:text-gray-500 text-sm sm:text-base"
                    rows="3"
                  />
                  {!post.is_locked && (
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-2 sm:mt-3 space-y-2 sm:space-y-0">
                      <div className="flex space-x-1 sm:space-x-2 order-2 sm:order-1">
                        <button 
                          type="button" 
                          onClick={(e) => e.stopPropagation()}
                          className="text-gray-500 hover:text-gray-700 p-1"
                        >
                          <Image className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <button 
                          type="button" 
                          onClick={(e) => e.stopPropagation()}
                          className="text-gray-500 hover:text-gray-700 p-1"
                        >
                          <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleComment();
                        }}
                        disabled={!commentText.trim() || isSubmittingComment}
                        className="px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium text-sm sm:text-base order-1 sm:order-2 w-full sm:w-auto"
                      >
                        <Send className="w-4 h-4" />
                        <span>{isSubmittingComment ? 'Posting...' : 'Post Comment'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Comments List */}
            {post.is_locked && (
              <div className="flex items-center justify-center py-3 sm:py-4 text-gray-500 text-sm sm:text-base">
                <Lock className="w-4 h-4 mr-2" />
                <span>Comments are locked for this post</span>
              </div>
            )}
            
            <div className="space-y-3 sm:space-y-4 w-full overflow-hidden">
              {comments.map(comment => (
                <Comment 
                  key={comment.id} 
                  comment={comment} 
                  onReply={handleCommentReply}
                  postId={post.id}
                />
              ))}
            </div>
          </div>
        )}

        {/* Reactions Summary Modal */}
        {showReactionsSummary && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              e.stopPropagation();
              setShowReactionsSummary(false);
            }}
          >
            <div 
              className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Reactions</h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowReactionsSummary(false);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3">
                  {reactionsSummary.map(reaction => (
                    <div key={reaction.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <ThumbsUp className="w-6 h-6 text-blue-500 fill-current" />
                        <span className="font-medium capitalize text-gray-900">
                          Like
                        </span>
                      </div>
                      <span className="text-lg font-semibold text-gray-700">
                        {reaction.count}
                      </span>
                    </div>
                  ))}
                  {reactionsSummary.length === 0 && userReaction && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <ThumbsUp className="w-6 h-6 text-blue-500 fill-current" />
                        <span className="font-medium capitalize text-gray-900">
                          Your Like
                        </span>
                      </div>
                      <span className="text-lg font-semibold text-gray-700">
                        1
                      </span>
                    </div>
                  )}
                  {reactionsSummary.length === 0 && !userReaction && (
                    <div className="text-center py-8 text-gray-500">
                      No reactions yet
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Post Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Edit Post</h2>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      placeholder="Post title (optional)"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      rows="6"
                      placeholder="What's on your mind?"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdatePost}
                      disabled={!editContent.trim() || isUpdating}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUpdating ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit History Modal */}
        {showEditHistory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Edit History</h2>
                  <button
                    onClick={() => setShowEditHistory(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {/* Current Version */}
                  <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-800">Current Version</span>
                      <span className="text-xs text-green-600">{post.updated_at ? new Date(post.updated_at).toLocaleString() : 'Now'}</span>
                    </div>
                    <div className="text-sm">
                      <h3 className="font-semibold mb-1">{post.title}</h3>
                      <p className="text-gray-700">{post.content || post.content_preview}</p>
                    </div>
                  </div>
                  
                  {/* Mock Previous Versions */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Version 1</span>
                      <span className="text-xs text-gray-500">Original • {post.created_at ? new Date(post.created_at).toLocaleString() : 'Earlier'}</span>
                    </div>
                    <div className="text-sm">
                      <h3 className="font-semibold mb-1">{post.title}</h3>
                      <p className="text-gray-600 italic">Edit history will be available after the first edit of this post.</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Edit history shows when and what changes were made to this post. Only you can see this information.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Image Modal */}
        {showImageModal && post.first_image && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center p-4"
            style={{ zIndex: 99999 }}
            onClick={() => setShowImageModal(false)}
          >
            <div className="relative max-w-7xl w-full h-full flex items-center justify-center">
              {/* Close button - Enhanced visibility */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowImageModal(false);
                }}
                className="absolute top-4 right-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full p-3 transition-all duration-50 z-20 backdrop-blur-sm border border-white border-opacity-20"
                title="Close image"
              >
                <X className="w-6 h-6" />
              </button>
              
              {/* Image container */}
              <div 
                className="relative flex flex-col items-center"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={post.first_image.image}
                  alt={post.first_image.caption || 'Post image'}
                  className="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded-lg"
                  onError={(e) => {
                    console.error('Image failed to load in modal:', post.first_image);
                    setShowImageModal(false);
                  }}
                />
                
                {/* Caption */}
                {post.first_image.caption && (
                  <div className="mt-4 max-w-2xl text-center">
                    <p className="text-white text-sm bg-black bg-opacity-60 px-4 py-2 rounded-lg">
                      {post.first_image.caption}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Full Post View Modal */}
        {showFullPost && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm"
            style={{ zIndex: 9999 }}
            onClick={(e) => {
              console.log('Backdrop clicked');
              setShowFullPost(false);
            }}
          >
            <div 
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[98vh] sm:max-h-[95vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Enhanced Header - Always Visible */}
              <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white rounded-t-2xl flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-blue-600" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Post Details</h2>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('X button clicked');
                    setShowFullPost(false);
                  }}
                  className="text-gray-700 hover:text-gray-900 hover:bg-red-100 rounded-full p-3 transition-all duration-50 flex-shrink-0 bg-white border-2 border-gray-300 shadow-sm"
                  title="Close"
                  style={{ minWidth: '44px', minHeight: '44px' }}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto">
                {/* Enhanced Author Header */}
                <div className="px-6 py-4 bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-b border-gray-100">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <img
                        src={post.author.avatar_url}
                        alt={post.author.display_name}
                        className="w-14 h-14 rounded-full shadow-sm border-2 border-white"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const fallback = document.createElement('div');
                          fallback.className = 'w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-sm border-2 border-white';
                          const name = post.author.display_name || post.author.first_name || post.author.username || 'User';
                          const initials = name.trim().slice(0, 2).toUpperCase();
                          fallback.textContent = initials;
                          e.target.parentNode.appendChild(fallback);
                        }}
                      />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900">{post.author.display_name}</h3>
                      <p className="text-sm text-gray-600 flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {post.time_since}
                      </p>
                    </div>
                    {post.author.username && (
                      <div className="text-right">
                        <p className="text-sm text-gray-500">@{post.author.username}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="p-6">

                  {/* Post Content */}
                  <div className="mb-6">
                    {post.title && (
                      <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">{post.title}</h1>
                    )}
                    <div className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap break-words">
                      {post.content || post.content_preview || 'No content available'}
                    </div>

                  {/* Poll */}
                  {post.poll && (
                    <div className="mt-4">
                      <Poll 
                        poll={post.poll} 
                        postId={post.id} 
                        onUpdate={() => window.location.reload()}
                      />
                    </div>
                  )}

                  {/* Post Images */}
                  {post.first_image && (
                    <div className="mt-4 relative group">
                      <img
                        src={post.first_image.image}
                        alt={post.first_image.caption || 'Post image'}
                        className="w-full max-w-full h-auto max-h-80 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-all duration-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowImageModal(true);
                        }}
                        onError={(e) => {
                          console.error('Image failed to load:', post.first_image);
                        }}
                      />
                      {/* Click to expand indicator - pointer-events-none to allow clicks to pass through */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all duration-50 flex items-center justify-center pointer-events-none">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-50 bg-black bg-opacity-60 text-white text-sm px-3 py-2 rounded-lg backdrop-blur-sm">
                          <div className="flex items-center space-x-2">
                            <Eye className="w-4 h-4" />
                            <span>Click to view full size</span>
                          </div>
                        </div>
                      </div>
                      {post.first_image.caption && (
                        <p className="text-sm text-gray-600 mt-2">{post.first_image.caption}</p>
                      )}
                    </div>
                  )}

                  {/* Topics */}
                  {post.topics.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {post.topics.map(topic => (
                        <span
                          key={topic.id}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                        >
                          {topic.icon && <span className="mr-1">{topic.icon}</span>}
                          #{topic.name}
                        </span>
                      ))}
                    </div>
                  )}
                  </div>

                  {/* Post Stats */}
                  <div className="flex items-center space-x-4 text-sm text-gray-500 pb-4 border-b border-gray-200">
                  {reactionsSummary.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <ThumbsUp className="w-4 h-4 text-blue-500 fill-current" />
                      <span className="ml-1">{totalReactions} likes</span>
                    </div>
                  )}
                  <span>{post.comment_count} comments</span>
                  <span>{post.share_count} shares</span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between mt-4 pb-4 border-b border-gray-200">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Direct click applies/removes like reaction
                        if (!userReaction || userReaction.type !== 'like') {
                          handleReaction('like');
                        } else {
                          handleReaction('like');
                        }
                      }}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-50 font-medium ${
                        userReaction ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                      }`}
                    >
                      <ThumbsUp className={`w-5 h-5 ${userReaction ? 'fill-current' : ''}`} />
                      <span className="text-sm font-medium">
                        {userReaction ? 'Liked' : 'Like'} {totalReactions > 0 && `(${totalReactions})`}
                      </span>
                    </button>
                    
                    <button className="flex items-center space-x-2 px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded-lg">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span className="text-sm font-medium">Comment</span>
                    </button>
                    
                    <button className="flex items-center space-x-2 px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded-lg">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                      <span className="text-sm font-medium">Share</span>
                    </button>
                    
                    <button
                      onClick={() => handleBookmark(!isBookmarked)}
                      className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg ${
                        isBookmarked ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>
                </div>

                {/* Comments Section */}
                <div className="bg-gray-50 px-6 py-4">
                  <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
                    <MessageCircle className="w-5 h-5 mr-2 text-blue-600" />
                    Comments ({comments.length})
                  </h3>
                  
                  {/* Comment Input */}
                  <div className="mb-6">
                    <div className="flex space-x-3">
                      {user?.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt="Your avatar"
                          className="w-10 h-10 rounded-full"
                          onError={(e) => {
                            // On error, replace with initials div
                            e.target.style.display = 'none';
                            const initialsDiv = document.createElement('div');
                            initialsDiv.className = 'w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm';
                            const name = user?.first_name || user?.username || 'You';
                            const initials = name.trim().slice(0, 2).toUpperCase();
                            initialsDiv.textContent = initials;
                            e.target.parentNode.appendChild(initialsDiv);
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                          {(() => {
                            const name = user?.first_name || user?.username || 'You';
                            return name.trim().slice(0, 2).toUpperCase();
                          })()}
                        </div>
                      )}
                      <div className="flex-1">
                        <textarea
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onFocus={(e) => e.stopPropagation()}
                          placeholder="Write a comment..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                          rows="3"
                        />
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleComment();
                            }}
                            disabled={!commentText.trim() || isSubmittingComment}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                          >
                            {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Comments List */}
                  <div className="space-y-4">
                    {comments.length > 0 ? (
                      comments.map(comment => (
                        <Comment 
                          key={comment.id} 
                          comment={comment} 
                          postId={post.id}
                          onUpdate={loadComments}
                        />
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-8">
                        No comments yet. Be the first to comment!
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Report Form Modal */}
        <ReportForm
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          reportType="post"
          targetPost={post}
          onSubmit={handleReportSubmit}
        />
      </div>
    </div>
  );
};

// Create Post Component
const CreatePost = ({ onPostCreated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [postType, setPostType] = useState('discussion');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [topics, setTopics] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  
  // Poll-related state
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollMultipleChoice, setPollMultipleChoice] = useState(false);
  const [pollMaxSelections, setPollMaxSelections] = useState(1);

  // Image resizing configuration
  const MAX_IMAGE_WIDTH = 1920;
  const MAX_IMAGE_HEIGHT = 1080;
  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
  const JPEG_QUALITY = 0.85;

  // Function to resize image
  const resizeImage = (file) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        
        if (width > MAX_IMAGE_WIDTH || height > MAX_IMAGE_HEIGHT) {
          const widthRatio = MAX_IMAGE_WIDTH / width;
          const heightRatio = MAX_IMAGE_HEIGHT / height;
          const ratio = Math.min(widthRatio, heightRatio);
          
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw and resize image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with compression
        canvas.toBlob((blob) => {
          // Create a new file with resized image
          const resizedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          
          console.log(`Image resized: ${file.name}`);
          console.log(`Original: ${Math.round(file.size/1024)}KB (${img.naturalWidth}x${img.naturalHeight})`);
          console.log(`Resized: ${Math.round(resizedFile.size/1024)}KB (${width}x${height})`);
          
          resolve(resizedFile);
        }, 'image/jpeg', JPEG_QUALITY);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageSelect = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    // Limit to 10 images total
    const remainingSlots = 10 - selectedImages.length;
    const newFiles = files.slice(0, remainingSlots);

    console.log(`Processing ${newFiles.length} image(s)...`);
    setIsProcessingImages(true);

    // Process images (resize if needed)
    const processedFiles = [];
    const newPreviews = [];

    for (const file of newFiles) {
      try {
        // Check if file is an image
        if (!file.type.startsWith('image/')) {
          console.warn(`Skipping non-image file: ${file.name}`);
          continue;
        }

        // Resize image if it's too large
        let processedFile = file;
        if (file.size > MAX_FILE_SIZE || file.type !== 'image/jpeg') {
          console.log(`Resizing image: ${file.name} (${Math.round(file.size/1024)}KB)`);
          processedFile = await resizeImage(file);
        } else {
          // Check dimensions even for smaller files
          const img = new Image();
          img.src = URL.createObjectURL(file);
          
          await new Promise((resolve) => {
            img.onload = () => {
              if (img.naturalWidth > MAX_IMAGE_WIDTH || img.naturalHeight > MAX_IMAGE_HEIGHT) {
                console.log(`Image too large, resizing: ${file.name} (${img.naturalWidth}x${img.naturalHeight})`);
                resizeImage(file).then(resized => {
                  processedFile = resized;
                  resolve();
                });
              } else {
                resolve();
              }
            };
          });
        }

        processedFiles.push(processedFile);

        // Create preview for processed file
        const reader = new FileReader();
        reader.onload = (e) => {
          newPreviews.push({
            file: processedFile,
            url: e.target.result,
            id: Math.random().toString(36).substr(2, 9)
          });
          
          // Update previews when all files are processed
          if (newPreviews.length === processedFiles.length) {
            setImagePreviews(prev => [...prev, ...newPreviews]);
          }
        };
        reader.readAsDataURL(processedFile);
        
      } catch (error) {
        console.error(`Error processing image ${file.name}:`, error);
      }
    }

    // Update selected images with processed files
    setSelectedImages(prev => [...prev, ...processedFiles]);
    
    console.log(`Successfully processed ${processedFiles.length} image(s)`);
    setIsProcessingImages(false);
  };

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Poll management functions
  const addPollOption = () => {
    if (pollOptions.length < 5) {
      setPollOptions(prev => [...prev, '']);
    }
  };

  const removePollOption = (index) => {
    if (pollOptions.length > 2) {
      setPollOptions(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updatePollOption = (index, value) => {
    setPollOptions(prev => prev.map((option, i) => i === index ? value : option));
  };

  const clearPoll = () => {
    setPollOptions(['', '']);
    setPollMultipleChoice(false);
    setPollMaxSelections(1);
  };

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;

    // Validate poll if it's a poll post
    if (postType === 'poll') {
      const validPollOptions = pollOptions.filter(option => option.trim() !== '');
      if (validPollOptions.length < 2) {
        alert('Please provide at least 2 poll options');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const topicNames = topics.split(',').map(t => t.trim()).filter(Boolean);
      
      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      formData.append('post_type', postType);
      formData.append('is_anonymous', isAnonymous);
      
      // Add topic names
      topicNames.forEach(topic => {
        formData.append('topic_names', topic);
      });
      
      // Add images
      selectedImages.forEach((image, index) => {
        formData.append('images', image);
      });

      // Add poll options if it's a poll post
      if (postType === 'poll') {
        const validPollOptions = pollOptions.filter(option => option.trim() !== '');
        validPollOptions.forEach(option => {
          formData.append('poll_options', option.trim());
        });
      }

      await API.createPost(formData);
      
      // Reset form
      setTitle('');
      setContent('');
      setTopics('');
      setIsAnonymous(false);
      setSelectedImages([]);
      setImagePreviews([]);
      clearPoll();
      setPostType('discussion');
      setIsOpen(false);
      
      // Notify parent
      if (onPostCreated) onPostCreated();
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Create Post Button */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
        >
          What's on your mind? Share with the community...
        </button>
      </div>

      {/* Create Post Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Create Post</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Post Type Selector */}
              <div className="flex space-x-2 mb-4">
                {['discussion', 'question', 'announcement', 'resource', 'poll'].map(type => (
                  <button
                    key={type}
                    onClick={() => setPostType(type)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${
                      postType === type
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* Title (optional) */}
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add a title (optional)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
              />

              {/* Content */}
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  postType === 'question' 
                    ? "What would you like to know?" 
                    : "Share your thoughts..."
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                rows="6"
              />

              {/* Poll Creation */}
              {postType === 'poll' && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">Poll Options</h3>
                    <button
                      onClick={clearPoll}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Clear
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {pollOptions.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updatePollOption(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                        />
                        {pollOptions.length > 2 && (
                          <button
                            onClick={() => removePollOption(index)}
                            className="p-2 text-gray-400 hover:text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {pollOptions.length < 5 && (
                    <button
                      onClick={addPollOption}
                      className="mt-3 w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
                    >
                      + Add option ({pollOptions.length}/5)
                    </button>
                  )}
                  
                  {/* Poll Settings */}
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={pollMultipleChoice}
                        onChange={(e) => {
                          setPollMultipleChoice(e.target.checked);
                          if (!e.target.checked) {
                            setPollMaxSelections(1);
                          }
                        }}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">Allow multiple choices</span>
                    </label>
                    
                    {pollMultipleChoice && (
                      <div className="mt-2">
                        <label className="block text-sm text-gray-700 mb-1">
                          Maximum selections: {pollMaxSelections}
                        </label>
                        <input
                          type="range"
                          min="1"
                          max={Math.min(pollOptions.length, 5)}
                          value={pollMaxSelections}
                          onChange={(e) => setPollMaxSelections(parseInt(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Topics */}
              <div className="mt-4">
                <input
                  type="text"
                  value={topics}
                  onChange={(e) => setTopics(e.target.value)}
                  placeholder="Add topics (comma separated, e.g., startup, growth, hiring)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                />
              </div>

              {/* Image Previews */}
              {(imagePreviews.length > 0 || isProcessingImages) && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Images ({imagePreviews.length}/10)
                    {isProcessingImages && (
                      <span className="text-xs text-blue-600 ml-2">
                        🔄 Auto-resizing large images...
                      </span>
                    )}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {imagePreviews.map((preview, index) => (
                      <div key={preview.id} className="relative group">
                        <img
                          src={preview.url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Options */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-4">
                  <label 
                    className={`cursor-pointer flex items-center space-x-1 transition-colors ${
                      isProcessingImages 
                        ? 'text-blue-500' 
                        : selectedImages.length >= 10 
                          ? 'text-gray-400 cursor-not-allowed' 
                          : 'text-gray-500 hover:text-gray-700'
                    }`}
                    title={`Add images (max 1920x1080, auto-resized if larger). ${10 - selectedImages.length} slots remaining.`}
                  >
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      disabled={selectedImages.length >= 10 || isProcessingImages}
                    />
                    {isProcessingImages ? (
                      <div className="animate-spin">
                        <RefreshCw className="w-5 h-5" />
                      </div>
                    ) : (
                      <Image className="w-5 h-5" />
                    )}
                    {isProcessingImages && (
                      <span className="text-xs text-blue-600 ml-1">Processing...</span>
                    )}
                  </label>
                  <button type="button" className="text-gray-500 hover:text-gray-700">
                    <AtSign className="w-5 h-5" />
                  </button>
                  <button type="button" className="text-gray-500 hover:text-gray-700">
                    <Hash className="w-5 h-5" />
                  </button>
                </div>
                
                <label className="flex items-center space-x-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-gray-700">Post anonymously</span>
                </label>
              </div>

              {/* Submit */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!content.trim() || isSubmitting}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );
};

// Main Post Feed Component
export default function PostFeed({ 
  hideCreatePost = false,
  hideFilters = false,
  filter: initialFilter = 'new',
  feedType: propFeedType = null,
  enableSocialFeatures = false
} = {}) {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextUrl, setNextUrl] = useState(null);
  const [filter, setFilter] = useState(initialFilter);
  const [feedType, setFeedType] = useState(propFeedType || (user ? 'intelligent' : 'latest'));
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showFeedOptions, setShowFeedOptions] = useState(false);
  const [userAvatarUrl, setUserAvatarUrl] = useState(user?.avatar_url);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Trending topics
  const trendingTopics = [
    { id: 1, name: 'startup', icon: '🚀', count: 156 },
    { id: 2, name: 'fundraising', icon: '💰', count: 89 },
    { id: 3, name: 'growth', icon: '📈', count: 124 },
    { id: 4, name: 'hiring', icon: '👥', count: 67 },
    { id: 5, name: 'product', icon: '📱', count: 103 }
  ];

  // Sync filter and feedType state with prop changes
  useEffect(() => {
    setFilter(initialFilter);
  }, [initialFilter]);

  useEffect(() => {
    if (propFeedType) {
      setFeedType(propFeedType);
    }
  }, [propFeedType]);

  useEffect(() => {
    loadPosts(true); // true indicates this is a fresh load
  }, [filter, selectedTopic, feedType]);

  // Infinite scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight || loadingMore || !hasMore) {
        return;
      }
      loadMorePosts();
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadingMore, hasMore]);

  // Refresh posts when user avatar changes (to update comments with new avatar)
  useEffect(() => {
    if (user?.avatar_url !== userAvatarUrl) {
      setUserAvatarUrl(user?.avatar_url);
      loadPosts(true);
    }
  }, [user?.avatar_url, userAvatarUrl]);

  // Keyboard event listener will be handled at PostCard level instead

  const loadPosts = async (isRefresh = false) => {
    console.log('🔄 Loading posts with filter:', filter, 'feedType:', feedType);
    console.log('🔧 PostsFeed props - hideFilters:', hideFilters, 'initialFilter:', initialFilter);
    
    if (isRefresh) {
      setLoading(true);
      setHasMore(true);
      setNextUrl(null);
    }
    
    try {
      const params = { 
        sort: filter,
        feedType: feedType,
        feed: feedType === 'following' ? 'following' : 'all'
      };
      if (selectedTopic) {
        params.topic = selectedTopic;
        console.log('🔍 Loading posts with topic filter:', selectedTopic);
      }
      
      const response = await API.getPosts(params);
      let filteredPosts = response.results || [];
      
      // Client-side topic filtering as fallback if backend doesn't support it
      if (selectedTopic && filteredPosts.length > 0) {
        const originalCount = filteredPosts.length;
        filteredPosts = filteredPosts.filter(post => {
          // Check if post has topics and matches selected topic
          const hasMatchingTopic = post.topics?.some(topic => 
            topic.name?.toLowerCase() === selectedTopic.toLowerCase()
          );
          // Also check title and content for topic keywords
          const hasKeywordMatch = 
            post.title?.toLowerCase().includes(selectedTopic.toLowerCase()) ||
            post.content?.toLowerCase().includes(selectedTopic.toLowerCase()) ||
            post.content_preview?.toLowerCase().includes(selectedTopic.toLowerCase());
          
          return hasMatchingTopic || hasKeywordMatch;
        });
        console.log(`📊 Filtered ${originalCount} posts to ${filteredPosts.length} for topic: ${selectedTopic}`);
      }
      
      console.log(`📊 Loaded ${filteredPosts.length} posts for filter:`, filter);
      if (filteredPosts.length > 0) {
        console.log('First post date:', filteredPosts[0].created_at);
      }
      
      setPosts(filteredPosts);
      setNextUrl(response.next);
      setHasMore(!!response.next);
    } catch (error) {
      console.error('Error loading posts:', error);
      setPosts([]); // Ensure posts is always an array
      setHasMore(false);
    } finally {
      if (isRefresh) {
        setLoading(false);
      }
    }
  };

  const loadMorePosts = async () => {
    if (!nextUrl || loadingMore) return;
    
    setLoadingMore(true);
    try {
      // Extract pagination params from nextUrl
      const url = new URL(nextUrl);
      const params = { 
        sort: filter,
        feedType: feedType,
        feed: feedType === 'following' ? 'following' : 'all',
        page: url.searchParams.get('page') || url.searchParams.get('offset')
      };
      
      if (selectedTopic) {
        params.topic = selectedTopic;
      }
      
      const response = await API.getPosts(params);
      let newPosts = response.results || [];
      
      // Apply same client-side filtering
      if (selectedTopic && newPosts.length > 0) {
        newPosts = newPosts.filter(post => {
          const hasMatchingTopic = post.topics?.some(topic => 
            topic.name?.toLowerCase() === selectedTopic.toLowerCase()
          );
          const hasKeywordMatch = 
            post.title?.toLowerCase().includes(selectedTopic.toLowerCase()) ||
            post.content?.toLowerCase().includes(selectedTopic.toLowerCase()) ||
            post.content_preview?.toLowerCase().includes(selectedTopic.toLowerCase());
          
          return hasMatchingTopic || hasKeywordMatch;
        });
      }
      
      console.log(`📊 Loaded ${newPosts.length} more posts`);
      setPosts(prev => [...prev, ...newPosts]);
      setNextUrl(response.next);
      setHasMore(!!response.next);
    } catch (error) {
      console.error('Error loading more posts:', error);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadPosts(true);
    setIsRefreshing(false);
  };

  const handlePostCreated = () => {
    loadPosts(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Connect Feed</h1>
          <p className="text-gray-600 mt-1">Share ideas, ask questions, and connect with the startup community</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1 lg:max-w-2xl">
            {/* Create Post */}
            {!hideCreatePost && <CreatePost onPostCreated={handlePostCreated} />}


            {/* Filters - Only show if not hidden */}
            {!hideFilters && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 mb-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  {[
                    { value: 'new', label: 'New', icon: Clock },
                    { value: 'hot', label: 'Hot', icon: TrendingUp },
                    { value: 'top', label: 'Top', icon: Heart },
                    { value: 'discussed', label: 'Most Discussed', icon: MessageCircle }
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setFilter(value)}
                      className={`flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg transition-all duration-50 text-xs sm:text-sm font-medium ${
                        filter === value
                          ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-200 scale-95'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800 hover:scale-105'
                      }`}
                    >
                      <Icon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Posts */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-48"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Active Topic Filter Indicator */}
                {selectedTopic && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-indigo-100 p-2 rounded-full">
                        <Hash className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-indigo-900">Filtering by topic</h4>
                        <p className="text-sm text-indigo-700">Showing posts related to #{selectedTopic}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedTopic(null)}
                      className="bg-indigo-100 hover:bg-indigo-200 text-indigo-600 rounded-full p-2 transition-colors"
                      title="Clear topic filter"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                
                {posts && posts.length > 0 ? (
                  <>
                    {posts.map(post => (
                      <Post key={post.id} post={post} onUpdate={() => loadPosts(true)} feedType={feedType} />
                    ))}
                    
                    {/* Load More Indicator */}
                    {loadingMore && (
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                        <div className="flex items-center justify-center space-x-3">
                          <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
                          <span className="text-gray-600">Loading more posts...</span>
                        </div>
                      </div>
                    )}
                    
                    {/* End of Posts Indicator */}
                    {!hasMore && posts.length > 0 && (
                      <div className="text-center py-8">
                        <div className="inline-flex items-center px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          You've reached the end! No more posts to load.
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                    <div className="text-gray-500">
                      <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <h3 className="font-medium text-lg mb-2">No posts found</h3>
                      <p className="mb-4">
                        {feedType === 'following' 
                          ? "No posts from people you follow. Try switching to 'Intelligent Feed' or 'Latest Posts' to see more content!" 
                          : feedType === 'intelligent'
                          ? "No personalized posts available yet. Try 'Latest Posts' or follow some users to improve your feed!"
                          : "Be the first to share something with the community!"
                        }
                      </p>
                      <div className="text-sm text-gray-400 bg-gray-50 p-3 rounded">
                        <p><strong>Debug Info:</strong></p>
                        <p>Feed Type: {feedType}</p>
                        <p>Sort Filter: {filter}</p>
                        <p>Topic: {selectedTopic || 'All'}</p>
                        <p>Check browser console (F12) for API details</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-80 order-first lg:order-last">
            {/* Trending Topics */}
            <div className="bg-white rounded-xl p-6 mb-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                📈 Trending Topics
              </h3>
              <div className="space-y-3">
                {trendingTopics.map(topic => (
                  <button
                    key={topic.id}
                    onClick={() => setSelectedTopic(selectedTopic === topic.name ? null : topic.name)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-100 hover-lift ${
                      selectedTopic === topic.name
                        ? 'gradient-primary text-white shadow-lg'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-800 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{topic.icon}</span>
                      <span className="font-semibold text-base">#{topic.name}</span>
                    </div>
                    <span className={`text-sm font-bold px-2 py-1 rounded-full ${
                      selectedTopic === topic.name
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {topic.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Community Guidelines */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:block">
              <h3 className="font-semibold text-gray-900 mb-3">Community Guidelines</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 text-sm text-gray-600">
                <li className="flex items-center space-x-2">
                  <span className="text-green-500">•</span>
                  <span>Be respectful and constructive</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-blue-500">•</span>
                  <span>Share knowledge and experiences</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-red-500">•</span>
                  <span>No spam or self-promotion</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-purple-500">•</span>
                  <span>Help others in the community</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-yellow-500">•</span>
                  <span>Keep discussions relevant</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}