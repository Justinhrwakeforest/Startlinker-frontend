// frontend/src/components/UserHoverCard.js
import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAvatarUrl, getUserDisplayName } from '../utils/avatarUtils';
import { 
  MessageCircle, UserPlus, UserMinus, Shield, Award, 
  MapPin, Calendar, ExternalLink, Users, Star, Loader2
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const UserHoverCard = ({ 
  user, 
  children, 
  placement = 'top',
  delay = 500,
  showOnClick = false 
}) => {
  const { user: currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showCard, setShowCard] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(user?.is_following || false);
  const [followLoading, setFollowLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);
  const [messageStatus, setMessageStatus] = useState('');
  const [error, setError] = useState('');
  const [conversationCache, setConversationCache] = useState(null);
  
  const hoverTimeoutRef = useRef(null);
  const cardRef = useRef(null);
  const triggerRef = useRef(null);

  // Cleanup effect - must be called before any conditional returns
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Don't show hover card for current user or anonymous posts
  if (!user || !user.id || user.id === currentUser?.id || !currentUser) {
    console.log('UserHoverCard: Blocked - user:', !!user, 'user.id:', !!user?.id, 'isCurrentUser:', user?.id === currentUser?.id, 'hasCurrentUser:', !!currentUser);
    return children;
  }

  const handleMouseEnter = () => {
    if (showOnClick) return;
    
    console.log('UserHoverCard: Mouse enter detected for user:', user?.display_name || user?.username);
    clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      console.log('UserHoverCard: Showing card after delay for user:', user?.display_name || user?.username);
      setShowCard(true);
      loadUserDetails();
    }, delay);
  };

  const handleMouseLeave = () => {
    if (showOnClick) return;
    
    clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setShowCard(false);
    }, 200);
  };

  const handleClick = () => {
    if (showOnClick) {
      setShowCard(!showCard);
      if (!showCard) {
        loadUserDetails();
      }
    }
  };

  const loadUserDetails = async () => {
    if (userDetails || loading) return;

    setLoading(true);
    try {
      // Get user profile data
      const userData = await api.auth.getUserProfile(user.id);
      setUserDetails(userData);
      
      // Check follow status separately
      try {
        const followStatus = await api.auth.checkFollowStatus(user.id);
        setIsFollowing(followStatus.is_following);
      } catch (followError) {
        console.error('Error checking follow status:', followError);
        // Fallback to user data or false
        setIsFollowing(userData.is_following || user.is_following || false);
      }
    } catch (error) {
      console.error('Error loading user details:', error);
      // Use basic user info if detailed info fails
      setUserDetails(user);
      setIsFollowing(user.is_following || false);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (e) => {
    e.stopPropagation(); // Prevent parent click events
    if (followLoading) return;

    // Store original state for rollback in case of error
    const originalFollowState = isFollowing;
    
    // Optimistic UI update - immediately update the UI
    setIsFollowing(!isFollowing);
    setFollowLoading(true);
    setError(''); // Clear any previous errors

    try {
      let response;
      if (originalFollowState) {
        // User was following, so unfollow
        response = await api.auth.unfollowUser(user.id);
        console.log('✅ Successfully unfollowed user:', user.username || user.display_name);
      } else {
        // User was not following, so follow
        response = await api.auth.followUser(user.id);
        console.log('✅ Successfully followed user:', user.username || user.display_name);
      }

      // Update user details if we have them (follower count, etc.)
      if (userDetails) {
        setUserDetails(prev => ({
          ...prev,
          is_following: !originalFollowState,
          // Update follower count if provided in response, otherwise calculate it
          follower_count: response?.follower_count !== undefined 
            ? response.follower_count 
            : (prev.follower_count !== undefined 
                ? (originalFollowState ? prev.follower_count - 1 : prev.follower_count + 1)
                : prev.follower_count)
        }));
      }

      // Trigger a global refresh of follow state by dispatching a custom event
      window.dispatchEvent(new CustomEvent('followStateChanged', {
        detail: {
          userId: user.id,
          isFollowing: !originalFollowState,
          action: originalFollowState ? 'unfollow' : 'follow'
        }
      }));

    } catch (error) {
      console.error('❌ Error toggling follow:', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
        user_id: user.id,
        user_name: user.username || user.display_name,
        action: originalFollowState ? 'unfollow' : 'follow'
      });

      // Rollback optimistic update on error
      setIsFollowing(originalFollowState);

      // Set user-friendly error message
      if (error.response?.status === 401) {
        setError('Please log in to follow users');
      } else if (error.response?.status === 403) {
        setError('You cannot follow this user');
      } else if (error.response?.status === 404) {
        setError('User not found');
      } else if (error.response?.status >= 500) {
        setError('Server error. Please try again.');
      } else if (!navigator.onLine) {
        setError('No internet connection');
      } else {
        setError(originalFollowState ? 'Failed to unfollow' : 'Failed to follow');
      }

      // Clear error message after 3 seconds
      setTimeout(() => {
        setError('');
      }, 3000);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleMessage = async (e) => {
    e.stopPropagation(); // Prevent parent click events
    if (messageLoading) return;

    setMessageLoading(true);
    setMessageStatus('Looking for existing conversation...');
    setError('');
    
    try {
      console.log(`[UserHoverCard] Starting conversation with user ${user.id} (${user.username || user.display_name})`);
      
      // First, check if we have a cached conversation for this user
      // Cache expires after 5 minutes to ensure freshness
      const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
      let conversationId = null;
      
      if (conversationCache?.userId === user.id && 
          conversationCache?.timestamp && 
          (Date.now() - conversationCache.timestamp) < CACHE_DURATION) {
        conversationId = conversationCache.id;
        console.log(`[UserHoverCard] Using cached conversation: ${conversationId}`);
        setMessageStatus('Using existing conversation!');
      } else {
        // Clear expired cache
        if (conversationCache?.userId === user.id) {
          console.log('[UserHoverCard] Cache expired, clearing...');
          setConversationCache(null);
        }
        
        // Try to find existing conversation
        try {
          const existingConversationsResponse = await api.get('/api/messaging/conversations/');
          const existingConversation = existingConversationsResponse.data.results?.find(conv => 
            !conv.is_group && 
            conv.participants?.some(p => p.id === user.id) &&
            conv.participants?.length === 2
          );
          
          if (existingConversation) {
            conversationId = existingConversation.id;
            console.log(`[UserHoverCard] Found existing conversation: ${conversationId}`);
            setMessageStatus('Found existing conversation!');
            // Cache the conversation for future use
            setConversationCache({
              id: conversationId,
              userId: user.id,
              timestamp: Date.now()
            });
          }
        } catch (findError) {
          console.warn('[UserHoverCard] Could not fetch existing conversations:', {
            error: findError.message,
            status: findError.response?.status,
            data: findError.response?.data
          });
          // Continue to create new conversation
        }
      }

      // If no existing conversation found, create a new one
      if (!conversationId) {
        setMessageStatus('Creating new conversation...');
        try {
          console.log('[UserHoverCard] Creating new conversation...');
          const createResponse = await api.post('/api/messaging/conversations/', {
            participant_ids: [user.id],
            is_group: false
          });
          
          conversationId = createResponse.data.id;
          console.log(`[UserHoverCard] Created new conversation: ${conversationId}`);
          setMessageStatus('Conversation created!');
          // Cache the newly created conversation
          setConversationCache({
            id: conversationId,
            userId: user.id,
            timestamp: Date.now()
          });
        } catch (createError) {
          console.error('[UserHoverCard] Failed to create conversation:', {
            error: createError.message,
            status: createError.response?.status,
            data: createError.response?.data,
            user_id: user.id,
            user_name: user.username || user.display_name
          });
          
          // If creation fails, try one more time with a slight delay
          setMessageStatus('Retrying...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          try {
            console.log('[UserHoverCard] Retrying conversation creation...');
            const retryResponse = await api.post('/api/messaging/conversations/', {
              participant_ids: [user.id],
              is_group: false
            });
            conversationId = retryResponse.data.id;
            console.log(`[UserHoverCard] Retry successful: ${conversationId}`);
            setMessageStatus('Success!');
            // Cache the retry-created conversation
            setConversationCache({
              id: conversationId,
              userId: user.id,
              timestamp: Date.now()
            });
          } catch (retryError) {
            console.error('[UserHoverCard] Retry failed:', {
              error: retryError.message,
              status: retryError.response?.status,
              data: retryError.response?.data
            });
            throw retryError;
          }
        }
      }

      // Navigate to the conversation
      if (conversationId) {
        setMessageStatus('Opening conversation...');
        console.log(`[UserHoverCard] Navigating to conversation: ${conversationId}`);
        navigate(`/messages/${conversationId}`);
        setShowCard(false);
      } else {
        throw new Error('No conversation ID available');
      }
      
    } catch (error) {
      console.error('[UserHoverCard] Complete failure in message handling:', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
        user_id: user.id,
        user_name: user.username || user.display_name,
        stack: error.stack
      });
      
      // Show user-friendly error message
      if (error.response?.status === 401) {
        setError('Please log in to send messages');
      } else if (error.response?.status === 403) {
        setError('You cannot message this user');
      } else if (error.response?.status >= 500) {
        setError('Server error. Redirecting to messages...');
      } else if (!navigator.onLine) {
        setError('No internet connection');
      } else {
        setError('Could not create conversation. Redirecting...');
      }
      
      // For most errors, still try to navigate to messages page as fallback
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        console.log('[UserHoverCard] Falling back to messages page navigation');
        setTimeout(() => {
          setMessageStatus('Opening messages...');
          navigate('/messages', { 
            state: { 
              createConversationWith: {
                id: user.id,
                username: user.username,
                display_name: user.display_name,
                avatar_url: user.avatar_url
              }
            }
          });
          setShowCard(false);
        }, 1500); // Show error message for a bit before redirecting
      } else {
        // For auth errors, don't redirect
        setTimeout(() => {
          setError('');
        }, 3000);
      }
    } finally {
      setMessageLoading(false);
      setMessageStatus('');
    }
  };

  const handleVisitProfile = (e) => {
    e.stopPropagation(); // Prevent parent click events
    // If there's a profile route, navigate to it
    navigate(`/profile/${user.username || user.id}`);
    setShowCard(false);
  };

  const getCardPosition = () => {
    if (!triggerRef.current) {
      return 'top-full left-0 mt-2';
    }
    
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const cardWidth = 320; // Approximate card width
    const cardHeight = 400; // Approximate card height
    
    // Determine horizontal positioning
    const shouldAlignRight = (rect.left + cardWidth) > viewportWidth - 20;
    const horizontalClass = shouldAlignRight ? 'right-0' : 'left-0';
    
    // Determine vertical positioning based on available space
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    // Prefer bottom placement for posts unless there's not enough space
    const shouldPlaceAbove = spaceBelow < cardHeight + 20 && spaceAbove > cardHeight + 20;
    
    if (shouldPlaceAbove) {
      return `bottom-full ${horizontalClass} mb-2`;
    } else {
      return `top-full ${horizontalClass} mt-2`;
    }
  };

  const displayUser = userDetails || user;

  return (
    <div className="relative inline-block">
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className="cursor-pointer"
      >
        {children}
      </div>

      {showCard && (
        <>
          {/* Backdrop for mobile */}
          {showOnClick && (
            <div 
              className="fixed inset-0 z-40 md:hidden" 
              onClick={() => setShowCard(false)} 
            />
          )}
          
          {/* Hover Card */}
          <div
            ref={cardRef}
            className={`absolute z-[99999] ${getCardPosition()}`}
            onMouseEnter={() => clearTimeout(hoverTimeoutRef.current)}
            onMouseLeave={handleMouseLeave}
            onClick={(e) => e.stopPropagation()} // Prevent all clicks from bubbling up
            style={{
              maxWidth: '20rem',
              minWidth: '16rem',
              width: 'max-content',
              zIndex: 999999
            }}
          >
            <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4" style={{
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              maxWidth: '20rem'
            }}>
              {loading ? (
                // Loading state
                <div className="animate-pulse">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-300 rounded w-full"></div>
                    <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                  </div>
                </div>
              ) : (
                // Card content
                <div>
                  {/* User Header */}
                  <div className="flex items-start space-x-3 mb-3">
                    <div className="relative">
                      <img
                        src={getAvatarUrl(displayUser, 48)}
                        alt={displayUser.display_name || displayUser.username}
                        className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
                      />
                      {displayUser.is_online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {displayUser.display_name || displayUser.username}
                        </h3>
                        {displayUser.is_verified && (
                          <Shield className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        )}
                        {displayUser.is_premium && (
                          <Award className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        )}
                      </div>
                      
                      {displayUser.username && (
                        <p className="text-sm text-blue-600">@{displayUser.username}</p>
                      )}
                      
                      {displayUser.headline && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {displayUser.headline}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* User Stats */}
                  {(displayUser.follower_count !== undefined || displayUser.following_count !== undefined) && (
                    <div className="flex items-center space-x-4 mb-3 text-sm text-gray-600">
                      {displayUser.following_count !== undefined && (
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{displayUser.following_count} following</span>
                        </div>
                      )}
                      {displayUser.follower_count !== undefined && (
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{displayUser.follower_count} followers</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* User Info */}
                  <div className="space-y-2 mb-4 text-sm text-gray-600">
                    {displayUser.location && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span>{displayUser.location}</span>
                      </div>
                    )}
                    
                    {displayUser.date_joined && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>Joined {new Date(displayUser.date_joined).toLocaleDateString('en-US', { 
                          month: 'long', 
                          year: 'numeric' 
                        })}</span>
                      </div>
                    )}

                    {displayUser.reputation_score && (
                      <div className="flex items-center space-x-2">
                        <Star className="w-4 h-4" />
                        <span>{displayUser.reputation_score} reputation</span>
                      </div>
                    )}
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600 text-center">{error}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-2 sm:space-x-3">
                    <button
                      onClick={handleMessage}
                      disabled={messageLoading || !!error}
                      className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {messageLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <MessageCircle className="w-4 h-4" />
                      )}
                      <span className="text-sm">
                        {messageLoading ? (messageStatus || 'Loading...') : 'Message'}
                      </span>
                    </button>
                    
                    <button
                      onClick={handleFollow}
                      disabled={followLoading || !!error}
                      className={`group flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 font-medium text-sm ${
                        isFollowing
                          ? 'bg-gray-200 text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-gray-300'
                          : 'bg-blue-600 text-white hover:bg-blue-700 border border-blue-600'
                      } disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95`}
                      title={isFollowing ? 'Click to unfollow' : 'Click to follow'}
                    >
                      {followLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{isFollowing ? 'Unfollowing...' : 'Following...'}</span>
                        </>
                      ) : isFollowing ? (
                        <>
                          <UserMinus className="w-4 h-4" />
                          <span className="hidden group-hover:inline">Unfollow</span>
                          <span className="group-hover:hidden">Following</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          <span>Follow</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Visit Profile Link */}
                  <button
                    onClick={handleVisitProfile}
                    className="w-full mt-2 flex items-center justify-center space-x-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>View full profile</span>
                  </button>
                </div>
              )}
            </div>
            
            {/* Arrow pointer */}
            <div className="absolute w-3 h-3 bg-white border-l border-t border-gray-200 transform rotate-45 -top-1.5 left-6"></div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserHoverCard;