// src/components/Auth.js - Updated to handle redirects from welcome page
import React, { useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import UsernameInput from "./UsernameInput";
import Logo from "./Logo";
import api from "../services/api";
import validateUserInput from "../utils/profanityFilter";
import { 
  Mail, Lock, User, Eye, EyeOff, 
  CheckCircle, X, AlertCircle
} from "lucide-react";

export default function Auth() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if user came from sign up action
  const shouldShowSignUp = location.state?.showSignUp || false;
  const [isLogin, setIsLogin] = useState(!shouldShowSignUp); // Start with signup if requested
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    firstName: "",
    lastName: "",
    confirmPassword: "",
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [usernameValid, setUsernameValid] = useState(false);
  
  // Get redirect information from location state
  const redirectTo = location.state?.redirectTo || '/';
  const searchTerm = location.state?.searchTerm || '';
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Handle both frontend field names and backend error names
    const errorFieldMap = {
      'firstName': 'first_name',
      'lastName': 'last_name'
    };
    
    const errorFieldName = errorFieldMap[name] || name;
    
    // Real-time profanity validation for name fields
    if (name === 'firstName' || name === 'lastName') {
      const validationType = name === 'firstName' ? 'first_name' : 'last_name';
      const validation = validateUserInput(value, validationType);
      
      if (!validation.isValid && value.trim() !== '') {
        // Show profanity error immediately
        setErrors(prev => ({
          ...prev,
          [errorFieldName]: validation.error
        }));
      } else {
        // Clear error if input is valid or empty
        setErrors(prev => ({
          ...prev,
          [name]: "",
          [errorFieldName]: ""
        }));
      }
    } else {
      // For non-name fields, just clear errors when user starts typing
      if (errors[name] || errors[errorFieldName]) {
        setErrors(prev => ({
          ...prev,
          [name]: "",
          [errorFieldName]: ""
        }));
      }
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email address is invalid";
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    
    // Registration-specific validations
    if (!isLogin) {
      if (!formData.username) {
        newErrors.username = "Username is required";
      } else if (formData.username.length < 3) {
        newErrors.username = "Username must be at least 3 characters";
      } else if (formData.username.length > 20) {
        newErrors.username = "Username must be 20 characters or less";
      } else if (!/^[a-zA-Z0-9_.]+$/.test(formData.username)) {
        newErrors.username = "Username can only contain letters, numbers, underscores, and dots";
      } else if (formData.username.startsWith('_') || formData.username.startsWith('.') || 
                 formData.username.endsWith('_') || formData.username.endsWith('.')) {
        newErrors.username = "Username cannot start or end with underscores or dots";
      } else if (formData.username.includes('__') || formData.username.includes('..')) {
        newErrors.username = "Username cannot contain consecutive underscores or dots";
      } else if (!usernameValid) {
        newErrors.username = "Please choose a valid and available username";
      }
      
      // Real-time profanity validation for first name
      if (formData.firstName.trim()) {
        const firstNameValidation = validateUserInput(formData.firstName, 'first_name');
        if (!firstNameValidation.isValid) {
          newErrors.first_name = firstNameValidation.error;
        }
      }
      
      // Real-time profanity validation for last name
      if (formData.lastName.trim()) {
        const lastNameValidation = validateUserInput(formData.lastName, 'last_name');
        if (!lastNameValidation.isValid) {
          newErrors.last_name = lastNameValidation.error;
        }
      }
      
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setErrors({});
    
    try {
      if (isLogin) {
        // Login API call using api service
        const response = await api.auth.login({
          email: formData.email,
          password: formData.password,
          remember_me: formData.rememberMe
        });
        
        const data = response;
        
        // Check if email verification is required
        if (data.email_verified === false) {
          // Redirect to email verification pending page
          navigate('/verify-email-pending', {
            state: {
              email: formData.email,
              message: 'Please verify your email address before logging in.'
            }
          });
          return;
        }
        
        // Use context login function
        login(data.token, data.user);
        
        // Handle remember me functionality
        if (formData.rememberMe) {
          // Store token in localStorage for persistent login
          localStorage.setItem('authToken', data.token);
          localStorage.setItem('userData', JSON.stringify(data.user));
        } else {
          // Remove from localStorage if remember me is unchecked
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
        }
        
        // Show success and redirect
        setShowSuccess(true);
        setTimeout(() => {
          // Navigate to the intended destination with search term if provided
          if (searchTerm && redirectTo === '/startups') {
            navigate(redirectTo, { state: { searchTerm } });
          } else {
            navigate(redirectTo);
          }
        }, 1500);
        
      } else {
        // Registration API call using api service
        const response = await api.auth.register({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          password_confirm: formData.confirmPassword,
          first_name: formData.firstName,
          last_name: formData.lastName
        });
        
        const data = response;
        
        // Check if email verification is required
        if (data.email_verification_required || data.email_verification_sent) {
          // Always redirect to email verification pending page for new signups
          navigate('/verify-email-pending', {
            state: {
              email: formData.email,
              userName: formData.firstName || formData.username,
              message: data.verification_message || 'Please check your email to verify your account.'
            }
          });
        } else if (data.token) {
          // Only auto-login if token is provided (development mode)
          login(data.token, data.user);
          
          // Show success and redirect
          setShowSuccess(true);
          setTimeout(() => {
            // Navigate to the intended destination with search term if provided
            if (searchTerm && redirectTo === '/startups') {
              navigate(redirectTo, { state: { searchTerm } });
            } else {
              navigate(redirectTo);
            }
          }, 1500);
        } else {
          // No token provided - must verify email first
          navigate('/verify-email-pending', {
            state: {
              email: formData.email,
              userName: formData.firstName || formData.username,
              message: 'Please check your email to verify your account before logging in.'
            }
          });
        }
      }
      
    } catch (error) {
      console.error('Auth error:', error);
      
      if (error.response?.data) {
        // Handle field-specific errors from backend
        const backendErrors = error.response.data;
        
        // Check if it's an email verification error
        if (error.response.status === 403 && backendErrors.error === 'Email not verified') {
          navigate('/verify-email-pending', {
            state: {
              email: backendErrors.email || formData.email,
              message: backendErrors.message || 'Please verify your email address before logging in.'
            }
          });
          return;
        }
        
        if (typeof backendErrors === 'object') {
          setErrors(backendErrors);
        } else if (typeof backendErrors === 'string') {
          setErrors({ general: backendErrors });
        } else {
          setErrors({ general: 'Authentication failed. Please try again.' });
        }
      } else if (error.message) {
        setErrors({ general: error.message });
      } else {
        setErrors({ general: 'Network error. Please check your connection.' });
      }
    } finally {
      setLoading(false);
    }
  };
  
  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setErrors({});
    setUsernameValid(false);
    setFormData({
      email: "",
      password: "",
      username: "",
      firstName: "",
      lastName: "",
      confirmPassword: "",
      rememberMe: false
    });
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 relative">
        {/* Background decorative elements */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-blue-400 rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-purple-400 rounded-full opacity-10 animate-pulse" style={{ animationDelay: "1s" }}></div>
        
        {/* Success Message */}
        {showSuccess && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-white bg-opacity-90 rounded-xl animate-fadeIn">
            <div className="text-center p-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {isLogin ? "Login Successful!" : "Registration Complete!"}
              </h3>
              <p className="text-gray-600">
                {redirectTo === '/startups' ? 'Taking you to explore startups...' :
                 redirectTo === '/jobs' ? 'Taking you to browse jobs...' :
                 'Redirecting you to your dashboard...'}
              </p>
            </div>
          </div>
        )}
        
        <div className="bg-white rounded-xl shadow-xl overflow-hidden transition-all duration-300 transform hover:shadow-2xl">
          <div className="px-6 py-8 sm:px-10">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
                <Logo className="w-16 h-16" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-1">
                {isLogin ? "Sign in to your account" : "Create your account"}
              </h2>
              <p className="text-sm text-gray-600">
                {isLogin ? "Access all the features of StartLinker" : "Join thousands of startup enthusiasts"}
              </p>
              
              {/* Show redirect information */}
              {redirectTo !== '/' && (
                <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    {redirectTo === '/startups' && searchTerm ? 
                      `After signing in, we'll search for "${searchTerm}" in startups` :
                      redirectTo === '/startups' ? 'After signing in, you can explore startups' :
                      redirectTo === '/jobs' ? 'After signing in, you can browse job opportunities' :
                      'Complete your sign in to continue'
                    }
                  </p>
                </div>
              )}
            </div>
            
            {/* General Error Message */}
            {errors.general && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-start">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>{errors.general}</span>
              </div>
            )}
            
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Common Fields */}
              <div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email address"
                    className={`appearance-none block w-full pl-10 pr-3 py-3 border ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    } rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.email}
                  </p>
                )}
              </div>
              
              {/* Registration-only fields */}
              {!isLogin && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Choose your username
                    </label>
                    <UsernameInput
                      value={formData.username}
                      onChange={(value) => setFormData(prev => ({ ...prev, username: value }))}
                      onValidationChange={(isValid, isAvailable) => {
                        setUsernameValid(isValid && isAvailable);
                        // Clear username error when validation changes
                        if (errors.username && isValid && isAvailable) {
                          setErrors(prev => ({ ...prev, username: "" }));
                        }
                      }}
                      placeholder="Enter your desired username..."
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      showSuggestions={true}
                      autoGenerateFrom={`${formData.firstName} ${formData.lastName}`.trim() || formData.email}
                    />
                    {errors.username && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.username}
                      </p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        autoComplete="given-name"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="First name"
                        className={`appearance-none block w-full px-3 py-3 border ${
                          errors.first_name ? 'border-red-300' : 'border-gray-300'
                        } rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      />
                      {errors.first_name && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.first_name}
                        </p>
                      )}
                    </div>
                    <div>
                      <input
                        id="lastName"
                        name="lastName"
                        type="text"
                        autoComplete="family-name"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Last name"
                        className={`appearance-none block w-full px-3 py-3 border ${
                          errors.last_name ? 'border-red-300' : 'border-gray-300'
                        } rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      />
                      {errors.last_name && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.last_name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Password Field */}
              <div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Password"
                    className={`appearance-none block w-full pl-10 pr-10 py-3 border ${
                      errors.password ? 'border-red-300' : 'border-gray-300'
                    } rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.password}
                  </p>
                )}
              </div>
              
              {/* Confirm Password (Registration only) */}
              {!isLogin && (
                <div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm password"
                      className={`appearance-none block w-full pl-10 pr-3 py-3 border ${
                        errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                      } rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              )}
              
              {/* Remember Me & Forgot Password (Login only) */}
              {isLogin && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember_me"
                      name="rememberMe"
                      type="checkbox"
                      checked={formData.rememberMe}
                      onChange={(e) => setFormData(prev => ({ ...prev, rememberMe: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="remember_me" className="ml-2 block text-sm text-gray-700">
                      Remember me
                    </label>
                  </div>

                  <div className="text-sm">
                    <button
                      type="button"
                      onClick={() => navigate('/forgot-password')}
                      className="font-medium text-blue-600 hover:text-blue-500"
                    >
                      Forgot your password?
                    </button>
                  </div>
                </div>
              )}
              
              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : null}
                  {isLogin ? 'Sign in' : 'Create account'}
                </button>
              </div>
            </form>
            
          </div>
          
          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                type="button"
                onClick={toggleAuthMode}
                className="ml-1 font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
        
        {/* Terms and Privacy */}
        <div className="text-center mt-4">
          <p className="text-xs text-gray-500">
            By {isLogin ? "signing in" : "signing up"}, you agree to our{" "}
            <a href="/terms" className="underline">Terms of Service</a> and{" "}
            <a href="/privacy" className="underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}