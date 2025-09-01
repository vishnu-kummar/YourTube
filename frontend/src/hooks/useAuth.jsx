// src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { videoStateManager } from '../utils/videoStateManager';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const response = await apiService.getCurrentUser();
      setUser(response.data);
    } catch (error) {
      console.log('Not authenticated');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = (userData) => {
    setUser(userData);
    // Clear any old cache when user logs in
    videoStateManager.clearCache();
  };

  const logout = async () => {
    try {
      await apiService.logout();
      setUser(null);
      // Clear all cached states on logout
      videoStateManager.clearUserCache();
      console.log('Logged out successfully');
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails, clear local state
      setUser(null);
      videoStateManager.clearUserCache();
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return { user, loading, login, logout, checkAuth };
};