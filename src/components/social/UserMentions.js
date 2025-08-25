// src/components/social/UserMentions.js - User mentions with autocomplete
import React, { useState, useEffect, useRef } from 'react';
import { AtSign, User, Search, X } from 'lucide-react';
import axios from 'axios';
import '../../styles/datetime-input-fix.css';

const UserMentions = ({ 
  value = '', 
  onChange, 
  placeholder = "What's on your mind?",
  className = "",
  maxLength = 500,
  rows = 4 
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [currentMention, setCurrentMention] = useState('');
  const [mentionStart, setMentionStart] = useState(-1);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  
  const textareaRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchUsers = async (query) => {
    // Show suggestions even for single character to be more responsive
    if (!query || query.length < 1) {
      // Show popular/recent users when no query
      try {
        const response = await axios.get('/api/social/follows/search_users/?popular=true&limit=8');
        setSuggestions(response.data.results || response.data);
      } catch (error) {
        setSuggestions([]);
      }
      return;
    }

    setLoading(true);
    try {
      // Enhanced search with better parameters
      const response = await axios.get(`/api/social/follows/search_users/?q=${encodeURIComponent(query)}&limit=10`);
      const users = response.data.results || response.data;
      
      // Sort users by relevance - exact username matches first, then display name matches
      const sortedUsers = users.sort((a, b) => {
        const aUsernameMatch = a.username.toLowerCase().startsWith(query.toLowerCase());
        const bUsernameMatch = b.username.toLowerCase().startsWith(query.toLowerCase());
        
        if (aUsernameMatch && !bUsernameMatch) return -1;
        if (!aUsernameMatch && bUsernameMatch) return 1;
        
        // Then sort by display name relevance
        const aDisplayMatch = a.display_name.toLowerCase().includes(query.toLowerCase());
        const bDisplayMatch = b.display_name.toLowerCase().includes(query.toLowerCase());
        
        if (aDisplayMatch && !bDisplayMatch) return -1;
        if (!aDisplayMatch && bDisplayMatch) return 1;
        
        return 0;
      });
      
      setSuggestions(sortedUsers);
    } catch (error) {
      console.error('Error searching users:', error);
      // Fallback to empty suggestions instead of breaking
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = (query) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    // Faster debouncing for better UX - 150ms instead of 300ms
    debounceRef.current = setTimeout(() => {
      searchUsers(query);
    }, 150);
  };

  const handleTextChange = (e) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    onChange(newValue);

    // Check for @ mention
    const textBeforeCursor = newValue.substring(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@([a-zA-Z0-9_]*)$/);
    
    if (mentionMatch) {
      const mention = mentionMatch[1];
      const start = textBeforeCursor.lastIndexOf('@');
      
      setCurrentMention(mention);
      setMentionStart(start);
      setShowSuggestions(true);
      setSelectedIndex(-1);
      
      // If mention is empty (just @), show popular users immediately
      if (mention === '') {
        searchUsers(''); // This will show popular users
      } else {
        debouncedSearch(mention);
      }
    } else {
      setShowSuggestions(false);
      setCurrentMention('');
      setMentionStart(-1);
      setSuggestions([]);
    }
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
        
      case 'Enter':
      case 'Tab':
        if (selectedIndex >= 0) {
          e.preventDefault();
          insertMention(suggestions[selectedIndex]);
        }
        break;
        
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  const insertMention = (user) => {
    const textarea = textareaRef.current;
    const beforeMention = value.substring(0, mentionStart);
    const afterMention = value.substring(textarea.selectionStart);
    const mentionText = `@${user.username} `;
    
    const newValue = beforeMention + mentionText + afterMention;
    const newCursorPos = mentionStart + mentionText.length;
    
    onChange(newValue);
    setShowSuggestions(false);
    
    // Set cursor position after mention
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const extractMentions = (text) => {
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    const mentions = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push({
        username: match[1],
        start: match.index,
        end: match.index + match[0].length
      });
    }
    
    return mentions;
  };

  const getSuggestionPosition = () => {
    if (!textareaRef.current || mentionStart === -1) return { top: 0, left: 0 };
    
    const textarea = textareaRef.current;
    const style = window.getComputedStyle(textarea);
    const fontSize = parseFloat(style.fontSize);
    const lineHeight = parseFloat(style.lineHeight) || fontSize * 1.2;
    
    // Create a hidden div to measure text
    const div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.height = 'auto';
    div.style.width = textarea.offsetWidth + 'px';
    div.style.fontSize = style.fontSize;
    div.style.fontFamily = style.fontFamily;
    div.style.lineHeight = style.lineHeight;
    div.style.padding = style.padding;
    div.style.border = style.border;
    div.style.whiteSpace = 'pre-wrap';
    div.style.wordWrap = 'break-word';
    
    const textBeforeMention = value.substring(0, mentionStart);
    div.textContent = textBeforeMention;
    
    document.body.appendChild(div);
    const rect = textarea.getBoundingClientRect();
    
    const lines = Math.floor(div.offsetHeight / lineHeight);
    const top = rect.top + (lines * lineHeight) + lineHeight + 5;
    const left = rect.left;
    
    document.body.removeChild(div);
    
    return { top, left };
  };

  const position = showSuggestions ? getSuggestionPosition() : { top: 0, left: 0 };

  return (
    <div className="relative">
      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
        className={`w-full px-3 py-2 text-gray-900 placeholder-gray-500 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${className}`}
        style={{
          color: '#111827 !important',
          backgroundColor: '#ffffff !important'
        }}
      />
      
      {/* Character count */}
      <div className="flex justify-between items-center mt-2">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <AtSign className="w-4 h-4" />
          <span>Use @ to mention users</span>
        </div>
        <div className="text-sm text-gray-500">
          {value.length}/{maxLength}
        </div>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-48 overflow-y-auto"
          style={{
            top: position.top + 'px',
            left: position.left + 'px',
            minWidth: '200px',
            maxWidth: '300px'
          }}
        >
          {loading ? (
            <div className="px-4 py-2 text-center text-gray-500">
              <Search className="w-4 h-4 animate-spin mx-auto mb-1" />
              <span className="text-sm">Searching users...</span>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="px-4 py-2 text-center text-gray-500">
              <User className="w-4 h-4 mx-auto mb-1" />
              <span className="text-sm">
                {currentMention ? 'No users found' : 'Start typing to find users'}
              </span>
            </div>
          ) : (
            <>
              {currentMention === '' && (
                <div className="px-4 py-1 text-xs text-gray-400 border-b border-gray-100">
                  Popular users
                </div>
              )}
              {currentMention !== '' && (
                <div className="px-4 py-1 text-xs text-gray-400 border-b border-gray-100">
                  Search results for "{currentMention}"
                </div>
              )}
              {suggestions.map((user, index) => (
              <button
                key={user.id}
                onClick={() => insertMention(user)}
                className={`w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
                  index === selectedIndex ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                }`}
              >
                <img
                  src={user.avatar}
                  alt={user.display_name}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {user.display_name}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    @{user.username}
                    {currentMention && user.username.toLowerCase().startsWith(currentMention.toLowerCase()) && (
                      <span className="ml-1 text-xs text-blue-500">• exact match</span>
                    )}
                  </div>
                </div>
              </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

// Enhanced Post Creation Component with Mentions
export const PostCreationWithMentions = ({ onSubmit, placeholder = "What's on your mind?" }) => {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      // Extract mentions from content
      const mentionRegex = /@([a-zA-Z0-9_]+)/g;
      const mentions = [];
      let match;
      
      while ((match = mentionRegex.exec(content)) !== null) {
        mentions.push(match[1]);
      }

      await onSubmit({
        title: title.trim(),
        content: content.trim(),
        mentions: [...new Set(mentions)] // Remove duplicates
      });

      setContent('');
      setTitle('');
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <div className="space-y-4">
        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Post title (optional)"
          className="w-full px-3 py-2 text-gray-900 placeholder-gray-500 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          style={{
            color: '#111827 !important',
            backgroundColor: '#ffffff !important'
          }}
        />

        {/* Content with mentions */}
        <UserMentions
          value={content}
          onChange={setContent}
          placeholder={placeholder}
          rows={4}
          maxLength={1000}
        />

        {/* Actions */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {content.includes('@') && (
              <span className="flex items-center space-x-1">
                <AtSign className="w-4 h-4" />
                <span>Mentions will be notified</span>
              </span>
            )}
          </div>
          
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
    </form>
  );
};

// Mention Display Component for showing mentions in posts
export const MentionRenderer = ({ text, className = "" }) => {
  const renderWithMentions = (text) => {
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push(
          <span key={lastIndex}>
            {text.substring(lastIndex, match.index)}
          </span>
        );
      }

      // Add mention
      parts.push(
        <span
          key={match.index}
          className="text-blue-600 hover:text-blue-700 cursor-pointer font-medium"
          onClick={() => {
            // Navigate to user profile
            window.location.href = `/profile/${match[1]}`;
          }}
        >
          @{match[1]}
        </span>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(
        <span key={lastIndex}>
          {text.substring(lastIndex)}
        </span>
      );
    }

    return parts;
  };

  return (
    <div className={className}>
      {renderWithMentions(text)}
    </div>
  );
};

export default UserMentions;