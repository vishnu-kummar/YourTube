import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

export const useVideos = (searchQuery = '') => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadVideos = async () => {
    try {
      const response = await apiService.getAllVideos(1, 20, searchQuery);
      setVideos(response.data.docs || []);
    } catch (error) {
      console.error('Failed to load videos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, [searchQuery]);

  return { videos, loading, loadVideos };
};