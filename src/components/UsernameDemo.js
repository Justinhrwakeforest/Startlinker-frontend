import React, { useState } from 'react';
import UsernameInput from './UsernameInput';
import api from '../services/api';

const UsernameDemo = () => {
  const [username, setUsername] = useState('');
  const [validationResult, setValidationResult] = useState({
    isValid: false,
    isAvailable: false,
    message: ''
  });

  const handleValidationChange = (isValid, isAvailable, message) => {
    setValidationResult({ isValid, isAvailable, message });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validationResult.isValid && validationResult.isAvailable) {
      alert(`Username "${username}" is ready to use!`);
    } else {
      alert('Please choose a valid and available username.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Username Setup Demo
          </h1>
          <p className="text-gray-600">
            Test the real-time username validation and suggestion system.
          </p>
          <div className="text-xs text-gray-500">
            API Base URL: {api.defaults.baseURL}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic username input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose your username
            </label>
            <UsernameInput
              value={username}
              onChange={setUsername}
              onValidationChange={handleValidationChange}
              placeholder="Enter your desired username..."
              showSuggestions={true}
            />
          </div>

          {/* Auto-generation examples */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Generate from name
              </label>
              <UsernameInput
                value={username}
                onChange={setUsername}
                onValidationChange={handleValidationChange}
                placeholder="Will auto-generate..."
                autoGenerateFrom="John Doe"
                showSuggestions={true}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Generate from email
              </label>
              <UsernameInput
                value={username}
                onChange={setUsername}
                onValidationChange={handleValidationChange}
                placeholder="Will auto-generate..."
                autoGenerateFrom="john.doe@example.com"
                showSuggestions={true}
              />
            </div>
          </div>

          {/* Current validation status */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Validation Status:</h3>
            <div className="space-y-1 text-sm">
              <div>Username: <span className="font-mono">{username || '(empty)'}</span></div>
              <div>Valid format: <span className={validationResult.isValid ? 'text-green-600' : 'text-red-600'}>{validationResult.isValid ? '✓' : '✗'}</span></div>
              <div>Available: <span className={validationResult.isAvailable ? 'text-green-600' : 'text-red-600'}>{validationResult.isAvailable ? '✓' : '✗'}</span></div>
              <div>Message: <span className="text-gray-600">{validationResult.message}</span></div>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={!validationResult.isValid || !validationResult.isAvailable}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {validationResult.isValid && validationResult.isAvailable 
              ? 'Use This Username' 
              : 'Choose a Valid Username'
            }
          </button>
        </form>

        {/* Test cases */}
        <div className="border-t pt-6">
          <h3 className="font-medium text-gray-900 mb-3">Quick Test Cases:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              'admin', // Reserved
              'ab', // Too short
              'test_user', // Valid
              'user__name', // Double underscore
              'user.name.', // Ends with dot
              '_username', // Starts with underscore
              'valid123', // Valid
              'hruthik', // Taken (if exists)
            ].map((testCase) => (
              <button
                key={testCase}
                type="button"
                onClick={() => setUsername(testCase)}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded border"
              >
                {testCase}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsernameDemo;