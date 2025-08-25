// src/components/EnhancedPostsFeed.js - Posts feed with social features
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { StoriesBar, PostCreationWithMentions, MentionRenderer } from './social';
import { getAvatarUrl, getUserDisplayName } from '../utils/avatarUtils';
import PostsFeed from './PostsFeed';

const EnhancedPostsFeed = () => {
  const { user } = useAuth();
  const [showCreatePost, setShowCreatePost] = useState(false);

  return (
    <div className="space-y-6">
      {/* Stories Bar */}
      <StoriesBar currentUser={user} />

      {/* Create Post Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <img
            src={getAvatarUrl(user, 40)}
            alt={user?.username}
            className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 shadow-sm"
            onError={(e) => {
              e.target.src = getAvatarUrl(user, 40);
            }}
          />
          <button
            onClick={() => setShowCreatePost(true)}
            className="flex-1 text-left px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
          >
            What's on your mind, {user?.first_name || user?.username}?
          </button>
        </div>
        
        {showCreatePost && (
          <div className="mt-4">
            <PostCreationWithMentions
              onSubmit={async (postData) => {
                // Handle post creation
                try {
                  const response = await fetch('/posts/', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(postData)
                  });
                  
                  if (response.ok) {
                    setShowCreatePost(false);
                    // Refresh the feed
                    window.location.reload();
                  }
                } catch (error) {
                  console.error('Error creating post:', error);
                  throw error;
                }
              }}
              placeholder="Share something with your network..."
            />
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowCreatePost(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Posts Feed */}
      <PostsFeed 
        enableSocialFeatures={true}
        MentionRenderer={MentionRenderer}
      />
    </div>
  );
};

export default EnhancedPostsFeed;