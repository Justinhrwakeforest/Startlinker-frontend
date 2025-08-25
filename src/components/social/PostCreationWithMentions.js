// src/components/social/PostCreationWithMentions.js - Enhanced post creation with all features
import React, { useState, useRef } from 'react';
import { 
  Image, Hash, AtSign, BarChart3, X, Plus, Trash2, 
  Upload, Smile, MapPin, Globe, Users, Lock 
} from 'lucide-react';
import UserMentions from './UserMentions';
import { useNotifications } from '../NotificationSystem';

const PostCreationWithMentions = ({ 
  onSubmit, 
  placeholder = "What's on your mind?",
  className = "" 
}) => {
  const { addNotification } = useNotifications();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [selectedHashtags, setSelectedHashtags] = useState([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [showHashtagSuggestions, setShowHashtagSuggestions] = useState(false);
  const [showPoll, setShowPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollDuration, setPollDuration] = useState('24');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [privacy, setPrivacy] = useState('public');
  
  const fileInputRef = useRef(null);

  // Suggested hashtags
  const suggestedHashtags = [
    'startup', 'innovation', 'tech', 'entrepreneurship', 'business',
    'funding', 'growth', 'product', 'marketing', 'leadership',
    'ai', 'saas', 'fintech', 'healthtech', 'edtech',
    'networking', 'pitch', 'mvp', 'scalability', 'disruption',
    'venture', 'angel', 'seed', 'series', 'ipo',
    'founder', 'ceo', 'cto', 'team', 'hiring'
  ];

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        addNotification({
          type: 'error',
          title: 'File Too Large',
          message: 'File size must be less than 10MB. Please choose a smaller image.',
          duration: 3000
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImages(prev => [...prev, {
          file,
          preview: e.target.result,
          id: Date.now() + Math.random()
        }]);
      };
      reader.readAsDataURL(file);
    });
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (imageId) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
  };

  const addHashtag = (tag) => {
    const cleanTag = tag.replace('#', '').toLowerCase();
    if (!selectedHashtags.includes(cleanTag) && selectedHashtags.length < 10) {
      setSelectedHashtags(prev => [...prev, cleanTag]);
    }
    setHashtagInput('');
    setShowHashtagSuggestions(false);
  };

  const removeHashtag = (tagToRemove) => {
    setSelectedHashtags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleHashtagInputChange = (value) => {
    setHashtagInput(value);
    setShowHashtagSuggestions(value.length > 0);
  };

  const handleHashtagInputKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === ',') {
      e.preventDefault();
      if (hashtagInput.trim()) {
        addHashtag(hashtagInput.trim());
      }
    }
  };

  const filteredSuggestions = suggestedHashtags.filter(tag => 
    tag.toLowerCase().includes(hashtagInput.toLowerCase()) && 
    !selectedHashtags.includes(tag)
  );

  const addPollOption = () => {
    if (pollOptions.length < 4) {
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

  const handleSubmit = async () => {
    if (!content.trim() && images.length === 0) {
      addNotification({
        type: 'warning',
        title: 'Content Required',
        message: 'Please enter some content or upload an image to create a post.',
        duration: 3000
      });
      return;
    }

    // Backend validation: content must be at least 10 characters
    if (content.trim().length < 10) {
      addNotification({
        type: 'warning',
        title: 'Content Too Short',
        message: 'Content must be at least 10 characters long. Please add more details to your post.',
        duration: 3000
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      if (title.trim()) {
        formData.append('title', title.trim());
      }
      formData.append('content', content);
      
      // Add topic names (hashtags) - backend expects topic_names as list
      if (selectedHashtags.length > 0) {
        selectedHashtags.forEach(tag => {
          formData.append('topic_names', tag);
        });
      }
      
      // Add images
      images.forEach((image, index) => {
        formData.append(`images`, image.file);
      });
      
      // Add poll data if poll is enabled
      if (showPoll && pollOptions.filter(opt => opt.trim()).length >= 2) {
        formData.append('post_type', 'poll');
        // Add poll options as individual entries
        pollOptions.filter(opt => opt.trim()).forEach(option => {
          formData.append('poll_options', option.trim());
        });
      }
      
      await onSubmit(formData);
      
      // Reset form
      setTitle('');
      setContent('');
      setImages([]);
      setSelectedHashtags([]);
      setHashtagInput('');
      setShowHashtagSuggestions(false);
      setShowPoll(false);
      setPollOptions(['', '']);
      setPollDuration('24');
      setPrivacy('public');
      
    } catch (error) {
      console.error('Error creating post:', error);
      addNotification({
        type: 'error',
        title: 'Post Creation Failed',
        message: 'There was an error creating your post. Please check your content and try again.',
        duration: 5000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Title Input */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a title (optional)"
        maxLength={100}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
      />
      
      {/* Main Content Input with Mentions */}
      <UserMentions
        value={content}
        onChange={setContent}
        placeholder={placeholder}
        rows={4}
        maxLength={2000}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900"
      />
      
      {/* Character Count */}
      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>{content.length}/2000 characters</span>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <Globe className="w-4 h-4" />
            <select
              value={privacy}
              onChange={(e) => setPrivacy(e.target.value)}
              className="text-sm border-none bg-transparent focus:ring-0 text-gray-600"
            >
              <option value="public">Public</option>
              <option value="followers">Followers</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>
      </div>

      {/* Enhanced Hashtags System */}
      <div className="space-y-3">
        {/* Selected Hashtags */}
        {selectedHashtags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedHashtags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-200"
              >
                #{tag}
                <button
                  onClick={() => removeHashtag(tag)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        
        {/* Hashtag Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Hash className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={hashtagInput}
            onChange={(e) => handleHashtagInputChange(e.target.value)}
            onKeyDown={handleHashtagInputKeyDown}
            placeholder={selectedHashtags.length === 0 ? "Add hashtags (e.g., startup, innovation, tech)" : "Add more hashtags..."}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
          
          {/* Hashtag Suggestions */}
          {showHashtagSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              <div className="p-2">
                <div className="text-xs text-gray-500 mb-2 font-medium">Suggested hashtags:</div>
                <div className="flex flex-wrap gap-1">
                  {filteredSuggestions.slice(0, 15).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => addHashtag(tag)}
                      className="px-2 py-1 text-xs bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 rounded-lg transition-colors"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Popular Hashtags (always visible) */}
        {selectedHashtags.length === 0 && (
          <div className="space-y-2">
            <div className="text-xs text-gray-500 font-medium">Popular hashtags:</div>
            <div className="flex flex-wrap gap-1">
              {suggestedHashtags.slice(0, 8).map((tag) => (
                <button
                  key={tag}
                  onClick={() => addHashtag(tag)}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-700 rounded-lg transition-colors"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {selectedHashtags.length > 0 && selectedHashtags.length < 10 && (
          <div className="text-xs text-gray-500">
            {10 - selectedHashtags.length} more hashtags allowed
          </div>
        )}
      </div>

      {/* Images Preview */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {images.map((image) => (
            <div key={image.id} className="relative group">
              <img
                src={image.preview}
                alt="Preview"
                className="w-full h-32 object-cover rounded-lg"
              />
              <button
                onClick={() => removeImage(image.id)}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Poll Section */}
      {showPoll && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900 flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              Create Poll
            </h4>
            <button
              onClick={() => setShowPoll(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
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
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
                {pollOptions.length > 2 && (
                  <button
                    onClick={() => removePollOption(index)}
                    className="p-2 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            
            {pollOptions.length < 4 && (
              <button
                onClick={addPollOption}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span>Add option</span>
              </button>
            )}
            
            <div className="flex items-center space-x-4 pt-2">
              <label className="text-sm text-gray-600">Poll duration:</label>
              <select
                value={pollDuration}
                onChange={(e) => setPollDuration(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
              >
                <option value="1">1 hour</option>
                <option value="6">6 hours</option>
                <option value="12">12 hours</option>
                <option value="24">1 day</option>
                <option value="168">1 week</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          {/* Image Upload */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Upload images"
          >
            <Image className="w-5 h-5" />
            <span className="text-sm">Photo</span>
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />

          {/* Poll Toggle */}
          <button
            onClick={() => setShowPoll(!showPoll)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              showPoll 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
            }`}
            title="Create poll"
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-sm">Poll</span>
          </button>

          {/* Mentions Help */}
          <div className="flex items-center space-x-2 px-3 py-2 text-gray-500">
            <AtSign className="w-5 h-5" />
            <span className="text-sm">@ to mention</span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || (!content.trim() && images.length === 0)}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isSubmitting ? 'Posting...' : 'Post'}
        </button>
      </div>
    </div>
  );
};

export default PostCreationWithMentions;