// src/components/social/StoriesBar.js - Instagram-style stories bar
import React, { useState, useEffect, useRef } from 'react';
import { getAvatarUrl, getUserDisplayName } from '../../utils/avatarUtils';
import { 
  Plus, Play, Eye, Clock, User, X, ChevronLeft, ChevronRight,
  Image, Type, Link as LinkIcon, Trophy, Camera, Video, Edit2, Check
} from 'lucide-react';
import axios from '../../config/axios';
import VideoEditor from './VideoEditor';
import ImageEditor from './ImageEditor';

const StoriesBar = ({ currentUser }) => {
  const [stories, setStories] = useState([]);
  const [myStories, setMyStories] = useState([]);
  const [groupedStories, setGroupedStories] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextUrl, setNextUrl] = useState(null);
  const [selectedStory, setSelectedStory] = useState(null);
  const [storyIndex, setStoryIndex] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [progress, setProgress] = useState(0);
  const scrollRef = useRef(null);
  const progressTimer = useRef(null);

  useEffect(() => {
    fetchStories();
    
    // Listen for global follow state changes to refresh stories
    const handleFollowStateChange = (event) => {
      const { userId, isFollowing, action } = event.detail;
      
      if (action === 'follow') {
        // When following someone, refresh stories to show their stories
        console.log('User followed someone, refreshing stories...');
        setTimeout(() => {
          fetchStories(true);
        }, 500); // Small delay to ensure backend is updated
      } else if (action === 'unfollow') {
        // When unfollowing someone, remove their stories immediately
        console.log('User unfollowed someone, removing their stories...');
        setStories(prev => prev.filter(story => story.author !== userId));
        setGroupedStories(prev => {
          const updated = { ...prev };
          delete updated[userId];
          return updated;
        });
        
        // Also refresh after a delay to ensure consistency
        setTimeout(() => {
          fetchStories(true);
        }, 500);
      }
    };
    
    window.addEventListener('followStateChanged', handleFollowStateChange);
    
    // Set up periodic refresh to handle story expiration (every 5 minutes)
    const expiredStoryCheck = setInterval(() => {
      console.log('Checking for expired stories...');
      fetchStories(true);
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => {
      window.removeEventListener('followStateChanged', handleFollowStateChange);
      clearInterval(expiredStoryCheck);
    };
  }, []);

  // Add infinite scroll for horizontal scrolling
  useEffect(() => {
    const handleScroll = (e) => {
      const container = e.target;
      if (container === scrollRef.current && hasMore && !loadingMore) {
        const { scrollLeft, scrollWidth, clientWidth } = container;
        // Load more when scrolled to 80% of the way
        if (scrollLeft + clientWidth >= scrollWidth * 0.8) {
          loadMoreStories();
        }
      }
    };

    const container = scrollRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [hasMore, loadingMore]);

  useEffect(() => {
    if (selectedStory) {
      startProgressTimer();
    } else {
      stopProgressTimer();
    }
    
    return () => stopProgressTimer();
  }, [selectedStory]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!selectedStory) return;
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevStory();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextStory();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeStoryViewer();
      }
    };

    if (selectedStory) {
      document.addEventListener('keydown', handleKeyPress);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [selectedStory, storyIndex]);

  const fetchStories = async (isRefresh = true) => {
    try {
      if (isRefresh) {
        setLoading(true);
        setHasMore(true);
        setNextUrl(null);
      }
      
      console.log('Fetching stories from /social/stories/feed/');
      console.log('Current axios baseURL:', axios.defaults.baseURL);
      console.log('Auth token:', localStorage.getItem('auth_token') ? 'Present' : 'Missing');
      const response = await axios.get('/api/social/stories/feed/');
      console.log('Stories API response status:', response.status);
      console.log('Stories API response:', response.data);
      const storiesData = response.data.results || response.data;
      console.log('Stories data length:', Array.isArray(storiesData) ? storiesData.length : 'Not array');
      console.log('Stories data:', storiesData);
      console.log('Current user object:', currentUser);
      
      // Filter out expired stories on the client side as well
      const now = new Date();
      const activeStories = storiesData.filter(story => {
        if (!story.expires_at) return true; // Keep if no expiration date
        const expiresAt = new Date(story.expires_at);
        const isExpired = now > expiresAt;
        if (isExpired) {
          console.log(`Filtering out expired story from ${story.author_username}:`, {
            now: now.toISOString(),
            expires_at: story.expires_at,
            expired: isExpired
          });
        }
        return !isExpired;
      });
      
      console.log(`Filtered stories: ${storiesData.length} -> ${activeStories.length} (removed ${storiesData.length - activeStories.length} expired)`);
      
      // Separate user's own stories from others
      const myStories = [];
      const othersGrouped = {};
      
      activeStories.forEach(story => {
        const authorId = story.author;
        const currentUserId = currentUser?.id;
        const isMyStory = currentUser && (authorId === currentUserId || authorId === currentUser.id || story.author_username === currentUser.username);
        
        console.log('Story check:', {
          authorId,
          currentUserId,
          author_username: story.author_username,
          currentUserUsername: currentUser?.username,
          isMyStory
        });
        
        if (isMyStory) {
          myStories.push(story);
        } else {
          if (!othersGrouped[authorId]) {
            othersGrouped[authorId] = {
              author: {
                id: authorId,
                username: story.author_username,
                avatar: story.author_avatar,
                display_name: story.author_display_name
              },
              stories: [],
              hasViewed: false
            };
          }
          othersGrouped[authorId].stories.push(story);
          if (!story.has_viewed) {
            othersGrouped[authorId].hasViewed = false;
          }
        }
      });
      
      console.log('My stories count:', myStories.length);
      console.log('My stories:', myStories);
      console.log('Others grouped stories:', othersGrouped);
      console.log('Total stories processed:', storiesData.length);
      
      if (isRefresh) {
        setGroupedStories(othersGrouped);
        setStories(activeStories);
        setMyStories(myStories);
      } else {
        // Merge new stories for infinite scroll
        setStories(prev => [...prev, ...activeStories]);
        setGroupedStories(prev => ({ ...prev, ...othersGrouped }));
      }
      
      // Set pagination info
      setNextUrl(response.data.next);
      setHasMore(!!response.data.next);
      
      console.log('MyStories state updated with:', myStories.length, 'stories');
      console.log('Total active stories set:', activeStories.length);
    } catch (error) {
      console.error('Error fetching stories:', error);
      console.error('Error details:', error.response?.data);
      setHasMore(false);
    } finally {
      if (isRefresh) {
        setLoading(false);
      }
    }
  };

  const loadMoreStories = async () => {
    if (!nextUrl || loadingMore) return;
    
    setLoadingMore(true);
    try {
      console.log('Loading more stories from:', nextUrl);
      const response = await axios.get(nextUrl);
      const newStoriesData = response.data.results || response.data;
      
      // Filter expired stories
      const now = new Date();
      const activeStories = newStoriesData.filter(story => {
        if (!story.expires_at) return true;
        const expiresAt = new Date(story.expires_at);
        return now <= expiresAt;
      });
      
      // Group new stories (excluding user's own stories for pagination)
      const newGrouped = {};
      activeStories.forEach(story => {
        const authorId = story.author;
        const currentUserId = currentUser?.id;
        const isMyStory = currentUser && (authorId === currentUserId || authorId === currentUser.id || story.author_username === currentUser.username);
        
        if (!isMyStory) {
          if (!newGrouped[authorId]) {
            newGrouped[authorId] = {
              author: {
                id: authorId,
                username: story.author_username,
                avatar: story.author_avatar,
                display_name: story.author_display_name
              },
              stories: [],
              hasViewed: false
            };
          }
          newGrouped[authorId].stories.push(story);
          if (!story.has_viewed) {
            newGrouped[authorId].hasViewed = false;
          }
        }
      });
      
      // Merge with existing grouped stories
      setGroupedStories(prev => ({ ...prev, ...newGrouped }));
      setStories(prev => [...prev, ...activeStories]);
      setNextUrl(response.data.next);
      setHasMore(!!response.data.next);
      
      console.log(`📊 Loaded ${activeStories.length} more stories`);
    } catch (error) {
      console.error('Error loading more stories:', error);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  const startProgressTimer = () => {
    setProgress(0);
    const duration = 5000; // 5 seconds per story
    const interval = 50; // Update every 50ms
    const increment = (interval / duration) * 100;
    
    progressTimer.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          nextStory();
          return 0;
        }
        return prev + increment;
      });
    }, interval);
  };

  const stopProgressTimer = () => {
    if (progressTimer.current) {
      clearInterval(progressTimer.current);
      progressTimer.current = null;
    }
  };

  const viewStory = async (authorStories, index = 0) => {
    setSelectedStory(authorStories);
    setStoryIndex(index);
    setProgress(0);
    
    // Mark story as viewed
    const story = authorStories.stories[index];
    if (!story.has_viewed) {
      try {
        await axios.post(`/social/stories/${story.id}/view_story/`);
      } catch (error) {
        console.error('Error marking story as viewed:', error);
      }
    }
  };

  const viewMyStories = (index = 0) => {
    if (myStories.length === 0) return;
    
    const myStoriesGroup = {
      author: {
        id: currentUser?.id,
        username: currentUser?.username,
        avatar: currentUser?.avatar,
        display_name: currentUser?.display_name || currentUser?.username
      },
      stories: myStories,
      hasViewed: true // User's own stories are always "viewed"
    };
    
    viewStory(myStoriesGroup, index);
  };

  const nextStory = () => {
    if (!selectedStory) return;
    
    const currentStories = selectedStory.stories;
    if (storyIndex < currentStories.length - 1) {
      const newIndex = storyIndex + 1;
      setStoryIndex(newIndex);
      setProgress(0);
      
      // Mark new story as viewed
      const story = currentStories[newIndex];
      if (!story.has_viewed) {
        axios.post(`/social/stories/${story.id}/view_story/`).catch(console.error);
      }
    } else {
      // Move to next author's stories
      const isCurrentUserStory = currentUser && selectedStory.author.id === currentUser.id;
      
      if (isCurrentUserStory) {
        // If viewing my stories, move to first other person's stories
        const authorIds = Object.keys(groupedStories);
        if (authorIds.length > 0) {
          const nextAuthor = groupedStories[authorIds[0]];
          viewStory(nextAuthor, 0);
        } else {
          closeStoryViewer();
        }
      } else {
        // Move to next person's stories
        const authorIds = Object.keys(groupedStories);
        const currentAuthorIndex = authorIds.indexOf(selectedStory.author.id.toString());
        if (currentAuthorIndex < authorIds.length - 1) {
          const nextAuthor = groupedStories[authorIds[currentAuthorIndex + 1]];
          viewStory(nextAuthor, 0);
        } else {
          closeStoryViewer();
        }
      }
    }
  };

  const prevStory = () => {
    if (!selectedStory) return;
    
    if (storyIndex > 0) {
      setStoryIndex(storyIndex - 1);
      setProgress(0);
    } else {
      // Move to previous author's stories
      const isCurrentUserStory = currentUser && selectedStory.author.id === currentUser.id;
      const authorIds = Object.keys(groupedStories);
      
      if (isCurrentUserStory) {
        // Can't go back from my stories (it's first)
        return;
      } else {
        const currentAuthorIndex = authorIds.indexOf(selectedStory.author.id.toString());
        if (currentAuthorIndex > 0) {
          const prevAuthor = groupedStories[authorIds[currentAuthorIndex - 1]];
          viewStory(prevAuthor, prevAuthor.stories.length - 1);
        } else if (myStories.length > 0) {
          // Go back to my stories
          viewMyStories(myStories.length - 1);
        }
      }
    }
  };

  const closeStoryViewer = () => {
    console.log('Closing story viewer');
    setSelectedStory(null);
    setStoryIndex(0);
    setProgress(0);
    stopProgressTimer();
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const getStoryTypeIcon = (type) => {
    switch (type) {
      case 'image': return <Image className="w-3 h-3" />;
      case 'video': return <Video className="w-3 h-3" />;
      case 'link': return <LinkIcon className="w-3 h-3" />;
      case 'achievement': return <Trophy className="w-3 h-3" />;
      default: return <Type className="w-3 h-3" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 mb-6">
        <div className="flex items-center space-x-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex flex-col items-center space-y-2">
              <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="w-12 h-3 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Stories Bar */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 mb-6">
        <div className="relative">
          {/* Scroll buttons */}
          {(Object.keys(groupedStories).length + (myStories.length > 0 ? 1 : 0)) > 4 && (
            <>
              <button
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </>
          )}
          
          {/* Stories container */}
          <div
            ref={scrollRef}
            className="flex items-center space-x-4 overflow-x-auto scrollbar-hide pb-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* Create Story Button */}
            <div className="flex flex-col items-center space-y-2 cursor-pointer group flex-shrink-0">
              <div
                onClick={() => setShowCreateModal(true)}
                className="relative w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white group-hover:scale-105 transition-transform shadow-lg"
              >
                <Plus className="w-6 h-6" />
              </div>
              <span className="text-xs font-medium text-gray-600 text-center">Your Story</span>
            </div>
            
            {/* My Stories Section - Debug Mode */}
            {(console.log('Rendering stories bar. MyStories length:', myStories.length, 'CurrentUser:', currentUser?.username) || true) && (myStories.length > 0 || true) && (
              <div
                className="flex flex-col items-center space-y-2 cursor-pointer group flex-shrink-0 relative"
                onClick={() => viewMyStories()}
              >
                {/* Glowing effect */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-400 via-cyan-400 to-blue-500 opacity-0 group-hover:opacity-30 blur-xl transition-all duration-500 transform group-hover:scale-110"></div>
                
                <div className="relative w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-emerald-400 via-cyan-400 to-blue-500 group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-cyan-500/50">
                  {/* Animated ring */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-400 via-cyan-400 to-blue-500 animate-pulse opacity-75"></div>
                  
                  <div className="relative w-full h-full rounded-full bg-white p-0.5">
                    {currentUser?.avatar || currentUser?.profile_picture ? (
                      <img
                        src={currentUser.avatar || currentUser.profile_picture}
                        alt={currentUser?.display_name || currentUser?.username}
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => {
                          // On error, replace with initials div
                          e.target.style.display = 'none';
                          const initialsDiv = document.createElement('div');
                          initialsDiv.className = 'w-full h-full rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg';
                          const name = currentUser?.display_name || currentUser?.username || 'User';
                          const initials = name.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase();
                          initialsDiv.textContent = initials;
                          e.target.parentNode.appendChild(initialsDiv);
                        }}
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
                        {(() => {
                          const name = currentUser?.display_name || currentUser?.username || 'User';
                          return name.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase();
                        })()}
                      </div>
                    )}
                  </div>
                  
                  {/* Enhanced story count indicator */}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center text-xs text-white font-bold border-2 border-white shadow-lg transform group-hover:scale-110 transition-transform duration-200">
                    <span className="drop-shadow-sm">{myStories.length || 'X'}</span>
                  </div>
                  
                  {/* Sparkle effect */}
                  <div className="absolute -top-1 -right-1 w-3 h-3 text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-bounce">
                    ✨
                  </div>
                </div>
                
                <span className="text-xs font-bold text-transparent bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-center group-hover:scale-105 transition-transform duration-200">
                  My Story
                </span>
              </div>
            )}
            
            {/* Others' Story Rings */}
            {Object.values(groupedStories).map((authorStories) => (
              <div
                key={authorStories.author.id}
                className="flex flex-col items-center space-y-2 cursor-pointer group flex-shrink-0"
                onClick={() => viewStory(authorStories)}
              >
                <div className={`relative w-16 h-16 rounded-full p-0.5 ${
                  authorStories.hasViewed 
                    ? 'bg-gray-300' 
                    : 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600'
                } group-hover:scale-105 transition-transform`}>
                  <div className="w-full h-full rounded-full bg-white p-0.5">
                    <img
                      src={getAvatarUrl(authorStories.author, 64)}
                      alt={authorStories.author.display_name}
                      className="w-full h-full rounded-full object-cover"
                      onError={(e) => {
                        e.target.src = getAvatarUrl(authorStories.author, 64);
                      }}
                    />
                  </div>
                  {/* Story count indicator */}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white font-bold border-2 border-white">
                    {authorStories.stories.length}
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-600 text-center max-w-16 truncate">
                  {authorStories.author.display_name}
                </span>
              </div>
            ))}
            
            {/* Load More Indicator for horizontal scroll */}
            {loadingMore && (
              <div className="flex flex-col items-center space-y-2 flex-shrink-0 px-4">
                <div className="relative w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center animate-pulse">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <span className="text-xs text-gray-500">Loading...</span>
              </div>
            )}
            
            {/* End of stories indicator */}
            {!hasMore && Object.keys(groupedStories).length > 0 && (
              <div className="flex flex-col items-center space-y-2 flex-shrink-0 px-4">
                <div className="relative w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                  <div className="w-6 h-6 text-gray-400">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                </div>
                <span className="text-xs text-gray-500">All caught up!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Story Viewer Modal */}
      {selectedStory && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center backdrop-blur-sm"
          onClick={closeStoryViewer}
        >
          <div 
            className="relative w-full max-w-md mx-4 transform transition-all duration-300 ease-out"
            onClick={(e) => e.stopPropagation()}
            style={{
              animation: 'slideInUp 0.3s ease-out'
            }}
          >
            {/* Header */}
            <div className="absolute top-4 left-4 right-4 z-30">
              {/* Enhanced Progress bars */}
              <div className="flex space-x-1 mb-4">
                {selectedStory.stories.map((_, index) => (
                  <div key={index} className="flex-1 h-1.5 bg-white bg-opacity-20 rounded-full overflow-hidden backdrop-blur-sm">
                    <div
                      className={`h-full transition-all duration-100 rounded-full ${
                        index < storyIndex ? 'bg-gradient-to-r from-white to-gray-200 w-full' :
                        index === storyIndex ? 'bg-gradient-to-r from-cyan-400 to-blue-400' : 'w-0'
                      }`}
                      style={index === storyIndex ? { width: `${progress}%` } : {}}
                    />
                  </div>
                ))}
              </div>
              
              {/* Enhanced Author info */}
              <div className="flex items-center justify-between bg-black bg-opacity-30 backdrop-blur-md rounded-2xl p-3">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={getAvatarUrl(selectedStory.author, 32)}
                      alt={selectedStory.author.display_name}
                      className="w-9 h-9 rounded-full border-2 border-white shadow-lg"
                      onError={(e) => {
                        e.target.src = getAvatarUrl(selectedStory.author, 32);
                      }}
                    />
                    {/* Online indicator for own stories */}
                    {selectedStory.author.id === currentUser?.id && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm drop-shadow-sm">
                      {selectedStory.author.display_name}
                      {selectedStory.author.id === currentUser?.id && (
                        <span className="ml-1 text-xs text-cyan-300">• You</span>
                      )}
                    </p>
                    <p className="text-white text-opacity-75 text-xs">
                      {new Date(selectedStory.stories[storyIndex]?.created_at).toLocaleTimeString()} • Story {storyIndex + 1}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {/* Enhanced Story counter */}
                  <div className="text-white text-opacity-90 text-xs font-medium bg-white bg-opacity-20 px-2 py-1 rounded-full backdrop-blur-sm">
                    {storyIndex + 1} of {selectedStory.stories.length}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      console.log('Close button clicked');
                      closeStoryViewer();
                    }}
                    className="text-white hover:text-red-400 transition-all duration-200 p-3 hover:bg-red-500 hover:bg-opacity-20 rounded-full backdrop-blur-sm hover:scale-110 relative z-40 cursor-pointer min-w-[2.5rem] min-h-[2.5rem] flex items-center justify-center"
                    title="Close stories"
                    type="button"
                  >
                    <X className="w-6 h-6 pointer-events-none" />
                  </button>
                </div>
              </div>
            </div>

            {/* Story Content */}
            <div
              className="relative aspect-[9/16] bg-gray-900 rounded-2xl overflow-hidden"
              style={{
                backgroundColor: selectedStory.stories[storyIndex]?.background_color || '#1F2937'
              }}
            >
              {/* Story content based on type */}
              {selectedStory.stories[storyIndex] && (
                <StoryContent story={selectedStory.stories[storyIndex]} />
              )}
              
              {/* Enhanced Navigation buttons */}
              <div className="absolute inset-0 flex items-center justify-between p-4 z-10">
                {/* Previous button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevStory();
                  }}
                  className="w-12 h-12 bg-gradient-to-r from-black/40 to-black/60 backdrop-blur-md hover:from-black/60 hover:to-black/80 rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-110 shadow-lg border border-white/20"
                  style={{ 
                    opacity: (storyIndex > 0 || (currentUser && selectedStory.author.id !== currentUser.id)) ? 1 : 0.3 
                  }}
                >
                  <ChevronLeft className="w-6 h-6 drop-shadow-sm" />
                </button>
                
                {/* Next button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextStory();
                  }}
                  className="w-12 h-12 bg-gradient-to-r from-black/40 to-black/60 backdrop-blur-md hover:from-black/60 hover:to-black/80 rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-110 shadow-lg border border-white/20"
                >
                  <ChevronRight className="w-6 h-6 drop-shadow-sm" />
                </button>
              </div>
              
              {/* Click areas for mobile/touch navigation */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevStory();
                }}
                className="absolute left-0 top-0 w-1/3 h-full z-10 md:hidden"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextStory();
                }}
                className="absolute right-0 top-0 w-1/3 h-full z-10 md:hidden"
              />
            </div>

            {/* Story viewers count (if own story) */}
            {selectedStory.author.id === currentUser?.id && (
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-black bg-opacity-50 rounded-lg p-3 text-white">
                  <div className="flex items-center space-x-2">
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">
                      {selectedStory.stories[storyIndex]?.view_count || 0} views
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Story Modal */}
      {showCreateModal && (
        <CreateStoryModal
          onClose={() => setShowCreateModal(false)}
          onStoryCreated={() => fetchStories(true)}
        />
      )}
    </>
  );
};

// Enhanced Story Content Component with Video Editing Support
const StoryContent = ({ story }) => {
  const textColor = story.text_color || '#FFFFFF';
  const videoRef = useRef(null);
  
  // Parse video metadata if it exists
  const videoMetadata = story.video_metadata ? 
    (typeof story.video_metadata === 'string' ? 
      JSON.parse(story.video_metadata) : story.video_metadata) : null;
  
  // Parse image metadata if it exists
  const imageMetadata = story.image_metadata ? 
    (typeof story.image_metadata === 'string' ? 
      JSON.parse(story.image_metadata) : story.image_metadata) : null;
  
  useEffect(() => {
    if (story.story_type === 'video' && videoRef.current && videoMetadata) {
      const video = videoRef.current;
      
      // Apply trim settings
      if (videoMetadata.trimStart !== undefined) {
        video.currentTime = videoMetadata.trimStart;
      }
      
      // Apply audio settings
      if (videoMetadata.isMuted !== undefined) {
        video.muted = videoMetadata.isMuted;
      }
      
      if (videoMetadata.volume !== undefined && !videoMetadata.isMuted) {
        video.volume = videoMetadata.volume;
      }
      
      // Handle trim end during playback
      const handleTimeUpdate = () => {
        if (videoMetadata.trimEnd && video.currentTime >= videoMetadata.trimEnd) {
          video.currentTime = videoMetadata.trimStart || 0;
        }
      };
      
      video.addEventListener('timeupdate', handleTimeUpdate);
      
      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, [story, videoMetadata]);
  
  // Generate CSS filter string from metadata
  const getVideoFilterStyle = () => {
    if (!videoMetadata?.filters) return 'none';
    
    let filters = [];
    const { filters: filterData } = videoMetadata;
    
    // Apply manual adjustments
    if (filterData.brightness !== 100) {
      filters.push(`brightness(${filterData.brightness}%)`);
    }
    
    if (filterData.contrast !== 100) {
      filters.push(`contrast(${filterData.contrast}%)`);
    }
    
    if (filterData.saturation !== 100) {
      filters.push(`saturate(${filterData.saturation}%)`);
    }
    
    if (filterData.blur > 0) {
      filters.push(`blur(${filterData.blur}px)`);
    }
    
    // Apply preset filters
    switch (filterData.preset) {
      case 'vintage':
        filters.push('sepia(0.5) contrast(1.2) brightness(0.9)');
        break;
      case 'blackwhite':
        filters.push('grayscale(1)');
        break;
      case 'cold':
        filters.push('hue-rotate(180deg) saturate(0.8)');
        break;
      case 'warm':
        filters.push('hue-rotate(-30deg) saturate(1.2) brightness(1.1)');
        break;
      case 'dramatic':
        filters.push('contrast(1.4) brightness(0.9) saturate(1.2)');
        break;
      default:
        break;
    }
    
    return filters.length > 0 ? filters.join(' ') : 'none';
  };
  
  // Generate CSS filter string for images from metadata
  const getImageFilterStyle = () => {
    if (!imageMetadata?.filters) return 'none';
    
    let filters = [];
    const { filters: filterData } = imageMetadata;
    
    // Apply manual adjustments
    if (filterData.brightness !== 100) {
      filters.push(`brightness(${filterData.brightness}%)`);
    }
    
    if (filterData.contrast !== 100) {
      filters.push(`contrast(${filterData.contrast}%)`);
    }
    
    if (filterData.saturation !== 100) {
      filters.push(`saturate(${filterData.saturation}%)`);
    }
    
    if (filterData.blur > 0) {
      filters.push(`blur(${filterData.blur}px)`);
    }
    
    if (filterData.hue !== 0) {
      filters.push(`hue-rotate(${filterData.hue}deg)`);
    }
    
    if (filterData.sepia > 0) {
      filters.push(`sepia(${filterData.sepia}%)`);
    }
    
    if (filterData.grayscale > 0) {
      filters.push(`grayscale(${filterData.grayscale}%)`);
    }
    
    // Apply preset filters
    switch (filterData.preset) {
      case 'vintage':
        filters.push('sepia(0.5) contrast(1.2) brightness(0.9)');
        break;
      case 'blackwhite':
        filters.push('grayscale(1)');
        break;
      case 'cold':
        filters.push('hue-rotate(180deg) saturate(0.8)');
        break;
      case 'warm':
        filters.push('hue-rotate(-30deg) saturate(1.2) brightness(1.1)');
        break;
      case 'dramatic':
        filters.push('contrast(1.4) brightness(0.9) saturate(1.2)');
        break;
      case 'soft':
        filters.push('blur(0.5px) brightness(1.1) saturate(0.8)');
        break;
      default:
        break;
    }
    
    return filters.length > 0 ? filters.join(' ') : 'none';
  };
  
  // Generate transform string for images
  const getImageTransformStyle = () => {
    if (!imageMetadata?.transforms) return 'none';
    
    let transforms = [];
    const { transforms: transformData } = imageMetadata;
    
    if (transformData.rotation !== 0) {
      transforms.push(`rotate(${transformData.rotation}deg)`);
    }
    
    if (transformData.zoom !== 1) {
      transforms.push(`scale(${transformData.zoom})`);
    }
    
    if (transformData.flipHorizontal) {
      transforms.push('scaleX(-1)');
    }
    
    if (transformData.flipVertical) {
      transforms.push('scaleY(-1)');
    }
    
    return transforms.length > 0 ? transforms.join(' ') : 'none';
  };
  
  switch (story.story_type) {
    case 'image':
      return (
        <div className="relative w-full h-full">
          <img
            src={story.image}
            alt="Story"
            className="w-full h-full object-cover transition-all duration-300"
            style={{ 
              filter: getImageFilterStyle(),
              transform: getImageTransformStyle()
            }}
          />
          
          {/* Image Text Overlay */}
          {imageMetadata?.textOverlay && (
            <div 
              className={`absolute inset-0 flex items-${
                imageMetadata.textOverlay.position === 'top' ? 'start' : 
                imageMetadata.textOverlay.position === 'bottom' ? 'end' : 'center'
              } justify-center p-6 pointer-events-none`}
            >
              <p 
                className="font-bold drop-shadow-lg text-center"
                style={{ 
                  color: imageMetadata.textOverlay.color,
                  fontSize: `${imageMetadata.textOverlay.size || 24}px`
                }}
              >
                {imageMetadata.textOverlay.text}
              </p>
            </div>
          )}
          
          {/* Story Text Content (separate from image text overlay) */}
          {story.text_content && !imageMetadata?.textOverlay && (
            <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none">
              <p
                className="text-center font-medium text-lg drop-shadow-lg"
                style={{ color: textColor }}
              >
                {story.text_content}
              </p>
            </div>
          )}
        </div>
      );
      
    case 'video':
      return (
        <div className="relative w-full h-full">
          <video
            ref={videoRef}
            src={story.video}
            className="w-full h-full object-cover"
            style={{ filter: getVideoFilterStyle() }}
            autoPlay
            muted={videoMetadata?.isMuted !== false} // Default to muted unless explicitly set to false
            loop
            playsInline
          />
          
          {/* Video Text Overlay */}
          {videoMetadata?.textOverlay && (
            <div 
              className={`absolute inset-0 flex items-${
                videoMetadata.textOverlay.position === 'top' ? 'start' : 
                videoMetadata.textOverlay.position === 'bottom' ? 'end' : 'center'
              } justify-center p-6 pointer-events-none`}
            >
              <p 
                className="text-2xl font-bold drop-shadow-lg text-center"
                style={{ color: videoMetadata.textOverlay.color }}
              >
                {videoMetadata.textOverlay.text}
              </p>
            </div>
          )}
          
          {/* Story Text Content (separate from video text overlay) */}
          {story.text_content && !videoMetadata?.textOverlay && (
            <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none">
              <p
                className="text-center font-medium text-lg drop-shadow-lg"
                style={{ color: textColor }}
              >
                {story.text_content}
              </p>
            </div>
          )}
        </div>
      );
      
    case 'link':
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6 max-w-sm">
            <LinkIcon className="w-12 h-12 text-white mx-auto mb-4" />
            <h3 className="text-white font-bold text-lg mb-2">
              {story.link_title}
            </h3>
            <p className="text-white text-opacity-75 text-sm mb-4">
              {story.link_description}
            </p>
            <a
              href={story.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-white text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              View Link
            </a>
          </div>
        </div>
      );
      
    case 'achievement':
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full p-6 mb-6">
            <Trophy className="w-16 h-16 text-white" />
          </div>
          <h3 className="text-white font-bold text-2xl mb-2">
            Achievement Unlocked!
          </h3>
          <p
            className="text-center font-medium text-lg"
            style={{ color: textColor }}
          >
            {story.text_content}
          </p>
        </div>
      );
      
    default: // text
      return (
        <div className="flex items-center justify-center h-full p-6">
          <p
            className="text-center font-medium text-xl leading-relaxed"
            style={{ color: textColor }}
          >
            {story.text_content}
          </p>
        </div>
      );
  }
};

// Create Story Modal Component
const CreateStoryModal = ({ onClose, onStoryCreated }) => {
  const [storyType, setStoryType] = useState('text');
  const [textContent, setTextContent] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#3B82F6');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [image, setImage] = useState(null);
  const [video, setVideo] = useState(null);
  const [processedVideo, setProcessedVideo] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [showVideoEditor, setShowVideoEditor] = useState(false);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkDescription, setLinkDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const backgroundColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
    '#FFFFFF', '#000000'
  ];

  const handleBackgroundColorChange = (color) => {
    setBackgroundColor(color);
    // Auto-adjust text color for better contrast
    if (color === '#FFFFFF') {
      setTextColor('#000000'); // White background needs black text
    } else if (color === '#000000') {
      setTextColor('#FFFFFF'); // Black background needs white text
    }
  };

  const handleVideoEditSave = (editedVideoData) => {
    setProcessedVideo(editedVideoData);
    setShowVideoEditor(false);
  };

  const handleVideoEditCancel = () => {
    setShowVideoEditor(false);
  };

  const handleImageEditSave = (editedImageData) => {
    setProcessedImage(editedImageData);
    setShowImageEditor(false);
  };

  const handleImageEditCancel = () => {
    setShowImageEditor(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('story_type', storyType);
      formData.append('text_content', textContent);
      formData.append('background_color', backgroundColor);
      formData.append('text_color', textColor);

      if (storyType === 'image' && image) {
        formData.append('image', image);
        
        // Add image editing metadata if image was processed
        if (processedImage) {
          formData.append('image_metadata', JSON.stringify({
            filters: processedImage.filters,
            transforms: processedImage.transforms,
            textOverlay: processedImage.textOverlay,
            cropArea: processedImage.cropArea
          }));
        }
      } else if (storyType === 'video' && video) {
        formData.append('video', video);
        
        // Add video editing metadata if video was processed
        if (processedVideo) {
          formData.append('video_metadata', JSON.stringify({
            trimStart: processedVideo.trimStart,
            trimEnd: processedVideo.trimEnd,
            filters: processedVideo.filters,
            textOverlay: processedVideo.textOverlay,
            volume: processedVideo.volume,
            isMuted: processedVideo.isMuted
          }));
        }
      } else if (storyType === 'link') {
        formData.append('link_url', linkUrl);
        formData.append('link_title', linkTitle);
        formData.append('link_description', linkDescription);
      }

      await axios.post('/api/social/stories/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      onStoryCreated();
      onClose();
    } catch (error) {
      console.error('Error creating story:', error);
      alert('Failed to create story. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Create Story</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Story Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Story Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'text', icon: Type, label: 'Text' },
                  { value: 'image', icon: Image, label: 'Image' },
                  { value: 'video', icon: Video, label: 'Video' },
                  { value: 'link', icon: LinkIcon, label: 'Link' }
                ].map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStoryType(value)}
                    className={`p-3 rounded-lg border-2 flex flex-col items-center space-y-2 transition-colors ${
                      storyType === value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400 text-gray-700 bg-white'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Text Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Text Content
              </label>
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                rows={3}
                maxLength={500}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-500 bg-white"
                placeholder="What's happening?"
              />
              <p className="text-xs text-gray-500 mt-1">
                {textContent.length}/500 characters
              </p>
            </div>

            {/* Media Upload */}
            {(storyType === 'image' || storyType === 'video') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {storyType === 'image' ? 'Upload Image' : 'Upload Video'}
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept={storyType === 'image' ? 'image/*' : 'video/*'}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (storyType === 'image') {
                        setImage(file);
                        setProcessedImage(null); // Reset processed image when new file is selected
                      } else {
                        setVideo(file);
                        setProcessedVideo(null); // Reset processed video when new file is selected
                      }
                    }}
                    className="sr-only"
                    id="media-upload"
                  />
                  <label
                    htmlFor="media-upload"
                    className="flex items-center justify-between w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors bg-white"
                  >
                    <div className="flex items-center space-x-2">
                      <Camera className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {(storyType === 'image' && image) || (storyType === 'video' && video) 
                          ? (storyType === 'image' ? image.name : video.name)
                          : `Choose ${storyType === 'image' ? 'image' : 'video'} file`}
                      </span>
                    </div>
                    <span className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                      Browse...
                    </span>
                  </label>
                </div>
                {/* File info display */}
                {((storyType === 'image' && image) || (storyType === 'video' && video)) && (
                  <div className="mt-2 p-2 bg-gray-50 rounded-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        {storyType === 'image' ? 
                          <Image className="w-4 h-4 text-gray-500 flex-shrink-0" /> : 
                          <Video className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        }
                        <span className="text-sm text-gray-700 truncate">
                          {storyType === 'image' ? image.name : video.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {storyType === 'image' && (
                          <button
                            type="button"
                            onClick={() => setShowImageEditor(true)}
                            className="px-2 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                          >
                            <Edit2 className="w-3 h-3 mr-1" />
                            Edit
                          </button>
                        )}
                        {storyType === 'video' && (
                          <button
                            type="button"
                            onClick={() => setShowVideoEditor(true)}
                            className="px-2 py-1 text-xs bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center"
                          >
                            <Edit2 className="w-3 h-3 mr-1" />
                            Edit
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (storyType === 'image') {
                              setImage(null);
                              setProcessedImage(null);
                            } else {
                              setVideo(null);
                              setProcessedVideo(null);
                            }
                          }}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Size: {((storyType === 'image' ? image.size : video.size) / 1024 / 1024).toFixed(2)} MB
                    </div>
                    {processedImage && storyType === 'image' && (
                      <div className="text-xs text-green-600 mt-1 flex items-center">
                        <Check className="w-3 h-3 mr-1" />
                        Image edited ({processedImage.filters.preset !== 'none' ? 'Filtered' : 'Adjusted'})
                      </div>
                    )}
                    {processedVideo && storyType === 'video' && (
                      <div className="text-xs text-green-600 mt-1 flex items-center">
                        <Check className="w-3 h-3 mr-1" />
                        Video edited (Duration: {processedVideo.duration.toFixed(1)}s)
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Link Fields */}
            {storyType === 'link' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Link URL
                  </label>
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={linkTitle}
                    onChange={(e) => setLinkTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Link title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={linkDescription}
                    onChange={(e) => setLinkDescription(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Brief description"
                  />
                </div>
              </div>
            )}

            {/* Color Customization */}
            {(storyType === 'text' || storyType === 'link') && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Background Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {backgroundColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleBackgroundColorChange(color)}
                        className={`w-8 h-8 rounded-full border-3 transition-all ${
                          backgroundColor === color 
                            ? 'border-gray-900 ring-2 ring-blue-500 scale-110' 
                            : 'border-gray-400 hover:border-gray-600'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Text Color
                  </label>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setTextColor('#FFFFFF')}
                      disabled={backgroundColor === '#FFFFFF'}
                      className={`px-3 py-1 rounded text-sm transition-all ${
                        backgroundColor === '#FFFFFF' 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                          : textColor === '#FFFFFF' 
                            ? 'bg-gray-900 text-white' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      White
                    </button>
                    <button
                      type="button"
                      onClick={() => setTextColor('#000000')}
                      disabled={backgroundColor === '#000000'}
                      className={`px-3 py-1 rounded text-sm transition-all ${
                        backgroundColor === '#000000'
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                          : textColor === '#000000' 
                            ? 'bg-gray-900 text-white' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Black
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !textContent.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating...' : 'Create Story'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Video Editor Modal */}
      {showVideoEditor && video && (
        <VideoEditor
          videoFile={video}
          onSave={handleVideoEditSave}
          onCancel={handleVideoEditCancel}
        />
      )}
      
      {/* Image Editor Modal */}
      {showImageEditor && image && (
        <ImageEditor
          imageFile={image}
          onSave={handleImageEditSave}
          onCancel={handleImageEditCancel}
        />
      )}
    </div>
  );
};

// Add custom CSS animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes slideInUp {
    from {
      transform: translateY(100px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  @keyframes shimmer {
    0% {
      background-position: -200px 0;
    }
    100% {
      background-position: calc(200px + 100%) 0;
    }
  }
  
  .shimmer {
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
    background-size: 200px 100%;
    animation: shimmer 2s infinite;
  }
`;

if (!document.head.querySelector('style[data-stories-animations]')) {
  styleSheet.setAttribute('data-stories-animations', 'true');
  document.head.appendChild(styleSheet);
}

export default StoriesBar;