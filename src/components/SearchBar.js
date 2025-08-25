// src/components/SearchBar.js - Enhanced Production-Ready Version
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, X, Clock, TrendingUp, Command, ArrowUp } from 'lucide-react';

const SearchBar = ({ 
  value = '', 
  onChange, 
  onClear, 
  onSearch,
  placeholder = 'Search...', 
  suggestions = [],
  loading = false,
  className = '',
  showRecentSearches = true,
  showTrendingSearches = true,
  maxRecentSearches = 5
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Trending searches - could be fetched from API
  const trendingSearches = useMemo(() => [
    'AI startups', 'FinTech', 'Remote jobs', 'Series A', 'Healthcare AI',
    'E-commerce', 'Machine Learning', 'Blockchain', 'SaaS', 'GreenTech'
  ], []);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('startup_recent_searches');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.slice(0, maxRecentSearches));
        }
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
      setRecentSearches([]);
    }
  }, [maxRecentSearches]);

  // Sync input value with prop value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Determine what to show in dropdown
  const shouldShowDropdown = useMemo(() => {
    if (!isFocused) return false;
    
    // Show suggestions if we have input and suggestions
    if (inputValue.length > 0 && suggestions.length > 0) return true;
    
    // Show recent/trending if no input and we have items to show
    if (inputValue.length === 0) {
      return (showRecentSearches && recentSearches.length > 0) || 
             (showTrendingSearches && trendingSearches.length > 0);
    }
    
    return false;
  }, [isFocused, inputValue, suggestions, showRecentSearches, recentSearches, showTrendingSearches, trendingSearches]);

  // Update dropdown state
  useEffect(() => {
    setIsOpen(shouldShowDropdown);
    setHighlightedIndex(-1);
  }, [shouldShowDropdown]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && 
          searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Save search to recent searches
  const saveRecentSearch = useCallback((searchTerm) => {
    if (!searchTerm.trim()) return;
    
    try {
      const updatedRecents = [
        searchTerm.trim(),
        ...recentSearches.filter(item => item !== searchTerm.trim())
      ].slice(0, maxRecentSearches);
      
      setRecentSearches(updatedRecents);
      localStorage.setItem('startup_recent_searches', JSON.stringify(updatedRecents));
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  }, [recentSearches, maxRecentSearches]);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('startup_recent_searches');
    } catch (error) {
      console.error('Error clearing recent searches:', error);
    }
  }, []);

  const executeSearch = useCallback((searchTerm) => {
    if (!searchTerm.trim()) return;
    
    const trimmedTerm = searchTerm.trim();
    
    // Save to recent searches
    saveRecentSearch(trimmedTerm);
    
    // Close dropdown
    setIsOpen(false);
    setIsFocused(false);
    setHighlightedIndex(-1);
    
    // Update input value
    setInputValue(trimmedTerm);
    
    // Execute search
    if (onChange) {
      onChange(trimmedTerm);
    }
    
    if (onSearch) {
      onSearch(trimmedTerm);
    }
    
    // Blur input to hide mobile keyboard
    if (inputRef.current) {
      inputRef.current.blur();
    }
  }, [onChange, onSearch, saveRecentSearch]);

  const handleInputChange = useCallback((e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  }, [onChange]);

  const handleInputFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleInputBlur = useCallback((e) => {
    // Only blur if not clicking within the dropdown
    if (!dropdownRef.current?.contains(e.relatedTarget)) {
      setIsFocused(false);
      setIsOpen(false);
    }
  }, []);

  const handleClear = useCallback(() => {
    setInputValue('');
    setIsOpen(false);
    setIsFocused(false);
    if (onClear) {
      onClear();
    }
    if (onChange) {
      onChange('');
    }
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [onClear, onChange]);

  // Get all items for keyboard navigation
  const allItems = useMemo(() => {
    if (inputValue.length > 0 && suggestions.length > 0) {
      return suggestions;
    }
    
    if (inputValue.length === 0) {
      return [
        ...(showRecentSearches ? recentSearches : []),
        ...(showTrendingSearches ? trendingSearches : [])
      ];
    }
    
    return [];
  }, [inputValue, suggestions, showRecentSearches, recentSearches, showTrendingSearches, trendingSearches]);

  const handleKeyDown = useCallback((e) => {
    if (!isOpen || allItems.length === 0) {
      if (e.key === 'Enter' && inputValue.trim()) {
        e.preventDefault();
        executeSearch(inputValue);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < allItems.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : allItems.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < allItems.length) {
          executeSearch(allItems[highlightedIndex]);
        } else if (inputValue.trim()) {
          executeSearch(inputValue);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setIsFocused(false);
        setHighlightedIndex(-1);
        if (inputRef.current) {
          inputRef.current.blur();
        }
        break;
    }
  }, [isOpen, allItems, highlightedIndex, inputValue, executeSearch]);

  const handleItemClick = useCallback((searchTerm, e) => {
    e.preventDefault();
    e.stopPropagation();
    executeSearch(searchTerm);
  }, [executeSearch]);

  const renderDropdownContent = () => {
    if (inputValue.length > 0 && suggestions.length > 0) {
      // Show suggestions when typing
      return (
        <div>
          <div className="px-4 py-3 text-xs font-semibold text-gray-500 border-b border-gray-100 bg-gray-50">
            Search Suggestions
          </div>
          {suggestions.map((suggestion, index) => (
            <div
              key={`suggestion-${index}`}
              className={`cursor-pointer select-none relative py-3 px-4 hover:bg-blue-50 transition-colors ${
                index === highlightedIndex ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
              }`}
              onMouseDown={(e) => handleItemClick(suggestion, e)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <div className="flex items-center">
                <Search className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" />
                <span className="block truncate font-medium">{suggestion}</span>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (inputValue.length === 0) {
      // Show recent and trending when no input
      return (
        <div>
          {/* Recent Searches */}
          {showRecentSearches && recentSearches.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                <span className="text-xs font-semibold text-gray-500">Recent Searches</span>
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    clearRecentSearches();
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Clear
                </button>
              </div>
              {recentSearches.map((search, index) => {
                const adjustedIndex = index;
                return (
                  <div
                    key={`recent-${index}`}
                    className={`cursor-pointer select-none relative py-3 px-4 hover:bg-blue-50 transition-colors ${
                      adjustedIndex === highlightedIndex ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                    }`}
                    onMouseDown={(e) => handleItemClick(search, e)}
                    onMouseEnter={() => setHighlightedIndex(adjustedIndex)}
                  >
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" />
                      <span className="block truncate font-medium">{search}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Trending Searches */}
          {showTrendingSearches && trendingSearches.length > 0 && (
            <div>
              <div className="px-4 py-3 text-xs font-semibold text-gray-500 border-b border-gray-100 bg-gray-50">
                Trending Searches
              </div>
              {trendingSearches.map((trending, index) => {
                const adjustedIndex = index + recentSearches.length;
                return (
                  <div
                    key={`trending-${index}`}
                    className={`cursor-pointer select-none relative py-3 px-4 hover:bg-blue-50 transition-colors ${
                      adjustedIndex === highlightedIndex ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                    }`}
                    onMouseDown={(e) => handleItemClick(trending, e)}
                    onMouseEnter={() => setHighlightedIndex(adjustedIndex)}
                  >
                    <div className="flex items-center">
                      <TrendingUp className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" />
                      <span className="block truncate font-medium">{trending}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative" ref={searchRef}>
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-600"></div>
          ) : (
            <Search className="h-5 w-5 text-gray-400" />
          )}
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className="block w-full pl-12 pr-12 py-4 border border-gray-300 rounded-2xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-lg text-base text-gray-900"
          autoComplete="off"
          spellCheck="false"
        />
        
        {inputValue && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
            <button
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* Enhanced Dropdown */}
      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute z-20 mt-2 w-full bg-white shadow-2xl max-h-80 rounded-2xl py-2 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none border border-gray-100"
        >
          {renderDropdownContent()}
          
          {/* Quick Search Action */}
          {inputValue.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  executeSearch(inputValue);
                }}
                className="flex items-center w-full text-left py-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors rounded-lg hover:bg-blue-50 px-3"
              >
                <Search className="w-4 h-4 mr-2" />
                <span>Search for "{inputValue}"</span>
                <div className="ml-auto flex items-center space-x-1 text-xs text-gray-400">
                  <ArrowUp className="w-3 h-3" />
                  <span>Enter</span>
                </div>
              </button>
            </div>
          )}

          {/* Keyboard shortcuts hint */}
          {inputValue.length === 0 && (recentSearches.length > 0 || trendingSearches.length > 0) && (
            <div className="border-t border-gray-100 px-4 py-2 bg-gray-50">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Use ↑↓ to navigate, Enter to select, Esc to close</span>
                <div className="flex items-center space-x-1">
                  <Command className="w-3 h-3" />
                  <span>K</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;