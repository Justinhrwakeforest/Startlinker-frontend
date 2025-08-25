// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('auth_token') || localStorage.getItem('authToken'));
  const [loading, setLoading] = useState(true);

  // Fetch user data when token is available
  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      // Check if there's stored user data from remember me
      const storedUser = localStorage.getItem('userData');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          localStorage.removeItem('userData');
        }
      }
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      // Use API service instead of fetch
      const data = await api.auth.getCurrentUser();
      setUser(data);
    } catch (error) {
      console.error('Error fetching user:', error);
      if (error.response?.status === 401) {
        logout();
      }
      // Don't logout on network errors
    } finally {
      setLoading(false);
    }
  };

  const login = (authToken, userData) => {
    localStorage.setItem('auth_token', authToken);
    setToken(authToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setToken(null);
    setUser(null);
  };

  const updateUser = async (userData) => {
    if (userData) {
      setUser(userData);
    } else {
      // If no userData provided, fetch fresh user data
      await fetchUser();
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!token && !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};