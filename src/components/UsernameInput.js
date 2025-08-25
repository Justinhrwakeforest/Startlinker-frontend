import React, { useState, useEffect, useCallback } from 'react';
import { Check, X, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import api from '../services/api';
import validateUserInput from '../utils/profanityFilter';

const UsernameInput = ({ 
  value, 
  onChange, 
  onValidationChange,
  className = "",
  placeholder = "Enter username...",
  showSuggestions = true,
  autoGenerateFrom = null, // Can be "John Doe" or "john@example.com"
}) => {
  const [validationState, setValidationState] = useState({
    isValid: null,
    isAvailable: null,
    isChecking: false,
    message: '',
    suggestions: []
  });

  // Debounced validation
  const [debounceTimer, setDebounceTimer] = useState(null);

  const checkUsername = useCallback(async (username) => {
    if (!username || username.length < 3) {
      setValidationState({
        isValid: false,
        isAvailable: false,
        isChecking: false,
        message: username ? 'Username must be at least 3 characters' : '',
        suggestions: []
      });
      onValidationChange?.(false, false, '');
      return;
    }

    // Check for profanity first (client-side)
    const profanityCheck = validateUserInput(username, 'username');
    if (!profanityCheck.isValid) {
      setValidationState({
        isValid: false,
        isAvailable: false,
        isChecking: false,
        message: profanityCheck.error,
        suggestions: []
      });
      onValidationChange?.(false, false, profanityCheck.error);
      return;
    }

    setValidationState(prev => ({ ...prev, isChecking: true }));

    try {
      console.log('Checking username:', username);
      const data = await api.auth.checkUsername(username);
      console.log('Username check response:', data);

      // Extract message properly (it might be in array format)
      let message = data.message;
      if (typeof message === 'string' && message.startsWith('[') && message.endsWith(']')) {
        try {
          const parsed = JSON.parse(message);
          message = Array.isArray(parsed) ? parsed[0] : message;
        } catch (e) {
          // Keep original message if parsing fails
        }
      }

      const newState = {
        isValid: data.valid,
        isAvailable: data.available,
        isChecking: false,
        message: message,
        suggestions: data.suggestions || []
      };

      setValidationState(newState);
      onValidationChange?.(data.valid, data.available, message);
    } catch (error) {
      console.error('Error checking username:', error);
      
      // Handle different types of errors
      let errorMessage = 'Error checking username availability';
      
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMessage = 'Connection timeout - using offline validation';
      } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        errorMessage = 'Backend unavailable - using offline validation only';
      }
      
      // For now, if backend is unavailable, just validate format locally
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error') || error.code === 'ECONNABORTED') {
        // Basic client-side validation
        const isValidFormat = /^[a-zA-Z0-9_.]+$/.test(username) && 
                            !username.startsWith('_') && !username.startsWith('.') &&
                            !username.endsWith('_') && !username.endsWith('.') &&
                            !username.includes('__') && !username.includes('..');
        
        setValidationState({
          isValid: isValidFormat,
          isAvailable: isValidFormat, // Assume available if format is valid
          isChecking: false,
          message: isValidFormat ? 'Username format is valid (server verification disabled)' : 'Invalid username format',
          suggestions: []
        });
        onValidationChange?.(isValidFormat, isValidFormat, isValidFormat ? 'Username format is valid (server verification disabled)' : 'Invalid username format');
      } else {
        setValidationState({
          isValid: false,
          isAvailable: false,
          isChecking: false,
          message: errorMessage,
          suggestions: []
        });
        onValidationChange?.(false, false, errorMessage);
      }
    }
  }, [onValidationChange]);

  // Debounced effect for real-time validation
  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      if (value) {
        checkUsername(value);
      }
    }, 500); // 500ms debounce

    setDebounceTimer(timer);

    return () => clearTimeout(timer);
  }, [value, checkUsername]);

  const generateUsernameFromName = async () => {
    if (!autoGenerateFrom) return;

    try {
      const isEmail = autoGenerateFrom.includes('@');
      const requestData = isEmail 
        ? { email: autoGenerateFrom }
        : { name: autoGenerateFrom };

      const data = await api.auth.generateUsername(requestData);
      
      if (data.suggestions && data.suggestions.length > 0) {
        onChange(data.suggestions[0]); // Use the first suggestion
      }
    } catch (error) {
      console.error('Error generating username:', error);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    onChange(suggestion);
  };

  const getValidationIcon = () => {
    if (validationState.isChecking) {
      return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    }
    
    if (validationState.isValid === null) {
      return null;
    }
    
    if (validationState.isValid && validationState.isAvailable) {
      return <Check className="w-5 h-5 text-green-500" />;
    }
    
    if (!validationState.isValid || !validationState.isAvailable) {
      return <X className="w-5 h-5 text-red-500" />;
    }
    
    return <AlertCircle className="w-5 h-5 text-yellow-500" />;
  };

  const getInputBorderClass = () => {
    if (validationState.isChecking || validationState.isValid === null) {
      return 'border-gray-300 focus:border-blue-500';
    }
    
    if (validationState.isValid && validationState.isAvailable) {
      return 'border-green-500 focus:border-green-500';
    }
    
    return 'border-red-500 focus:border-red-500';
  };

  const getMessageClass = () => {
    if (validationState.isValid && validationState.isAvailable) {
      return 'text-green-600';
    }
    return 'text-red-600';
  };

  return (
    <div className="space-y-2">
      {/* Input field */}
      <div className="relative">
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 pr-12 text-gray-900 ${getInputBorderClass()} ${className}`}
          maxLength={20}
        />
        
        {/* Validation icon */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {getValidationIcon()}
        </div>
        
        {/* Auto-generate button */}
        {autoGenerateFrom && (
          <button
            type="button"
            onClick={generateUsernameFromName}
            className="absolute right-10 top-1/2 transform -translate-y-1/2 text-blue-500 hover:text-blue-700"
            title="Generate username"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Character count */}
      <div className="flex justify-between text-sm text-gray-500">
        <span>3-20 characters • Letters, numbers, _, .</span>
        <span>{(value || '').length}/20</span>
      </div>

      {/* Validation message */}
      {validationState.message && (
        <div className={`text-sm ${getMessageClass()}`}>
          {validationState.message}
        </div>
      )}

      {/* Username suggestions */}
      {showSuggestions && validationState.suggestions.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm text-gray-600">
            Suggestions:
          </div>
          <div className="flex flex-wrap gap-2">
            {validationState.suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Validation rules */}
      <div className="text-xs text-gray-400 space-y-1">
        <div>Username rules:</div>
        <ul className="list-disc list-inside space-y-1">
          <li>3-20 characters long</li>
          <li>Letters, numbers, underscores (_), and dots (.) only</li>
          <li>Cannot start or end with _ or .</li>
          <li>No consecutive __ or ..</li>
          <li>Reserved names not allowed</li>
        </ul>
      </div>
    </div>
  );
};

export default UsernameInput;