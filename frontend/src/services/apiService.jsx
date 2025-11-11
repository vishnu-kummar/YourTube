// src/services/apiService.jsx
// API Configuration - Environment-based URLs

const getApiBaseUrl = () => {
  // Check if we're in production
  if (import.meta.env.MODE === 'production') {
    return import.meta.env.VITE_API_BASE_URL || 'https://yourtube-backend.vercel.app/api/v1';
  }
  // Development - FIXED: Use port 8000 instead of 3000
  return 'http://localhost:8000/api/v1';  // Changed from 3000 to 8000
};

const API_BASE_URL = getApiBaseUrl();

console.log('API Base URL:', API_BASE_URL);
console.log('Environment Mode:', import.meta.env.MODE);

// Enhanced error handling wrapper
const makeRequest = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include' // Always include credentials
    });
    
    // Log response details for debugging
    console.log(`${options.method || 'GET'} ${url}:`, response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error(`Request failed for ${url}:`, error);
    throw error;
  }
};

// API Service
export const apiService = {
  // Auth
  register: async (formData) => {
    return makeRequest(`${API_BASE_URL}/users/register`, {
      method: 'POST',
      body: formData
    });
  },

  login: async (credentials) => {
    return makeRequest(`${API_BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
  },

  logout: async () => {
    return makeRequest(`${API_BASE_URL}/users/logout`, {
      method: 'POST'
    });
  },

  getCurrentUser: async () => {
    return makeRequest(`${API_BASE_URL}/users/current-user`);
  },

  // Videos
  getAllVideos: async (page = 1, limit = 10, query = '') => {
    const params = new URLSearchParams({ page, limit, query });
    return makeRequest(`${API_BASE_URL}/videos?${params}`);
  },

  getVideoById: async (videoId) => {
    return makeRequest(`${API_BASE_URL}/videos/${videoId}`);
  },

  uploadVideo: async (formData) => {
    return makeRequest(`${API_BASE_URL}/videos`, {
      method: 'POST',
      body: formData
    });
  },

  // Dashboard - THESE ARE THE MISSING ENDPOINTS FOR YOUR STATS
  getChannelStats: async () => {
    console.log('Fetching channel stats from:', `${API_BASE_URL}/dashboard/stats`);
    return makeRequest(`${API_BASE_URL}/dashboard/stats`);
  },

  getChannelVideos: async (page = 1, limit = 10, sortBy = 'createdAt', sortType = 'desc') => {
    const params = new URLSearchParams({ page, limit, sortBy, sortType });
    console.log('Fetching channel videos from:', `${API_BASE_URL}/dashboard/videos?${params}`);
    return makeRequest(`${API_BASE_URL}/dashboard/videos?${params}`);
  },

  // Subscriptions
  toggleSubscription: async (channelId) => {
    return makeRequest(`${API_BASE_URL}/subscriptions/c/${channelId}`, {
      method: 'POST'
    });
  },

  checkSubscriptionStatus: async (channelId) => {
    try {
      return await makeRequest(`${API_BASE_URL}/subscriptions/status/c/${channelId}`);
    } catch (error) {
      console.warn('Subscription status check failed:', error);
      return { data: { isSubscribed: false } };
    }
  },

  getUserSubscriptions: async (userId) => {
    if (!userId) {
      console.error('getUserSubscriptions: userId is required');
      return { data: { subscribedChannels: [] } };
    }
    
    try {
      return await makeRequest(`${API_BASE_URL}/subscriptions/u/${userId}`);
    } catch (error) {
      console.error('Failed to get user subscriptions:', error);
      return { data: { subscribedChannels: [] } };
    }
  },

  getChannelSubscribers: async (channelId) => {
    try {
      return await makeRequest(`${API_BASE_URL}/subscriptions/c/${channelId}`);
    } catch (error) {
      console.error('Failed to get channel subscribers:', error);
      return { data: { subscribers: [] } };
    }
  },

  // Likes
  toggleVideoLike: async (videoId) => {
    return makeRequest(`${API_BASE_URL}/likes/toggle/v/${videoId}`, {
      method: 'POST'
    });
  },

  getVideoLikeStatus: async (videoId) => {
    try {
      return await makeRequest(`${API_BASE_URL}/likes/status/v/${videoId}`);
    } catch (error) {
      console.error('Failed to get like status:', error);
      return { isLiked: false, likesCount: 0 };
    }
  },

  // Comments
  getVideoComments: async (videoId, page = 1) => {
    return makeRequest(`${API_BASE_URL}/comments/${videoId}?page=${page}`);
  },

  addComment: async (videoId, content) => {
    return makeRequest(`${API_BASE_URL}/comments/${videoId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
  },

  // Playlists
  createPlaylist: async (playlistData) => {
    return makeRequest(`${API_BASE_URL}/playlists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(playlistData)
    });
  },

  getUserPlaylists: async (userId) => {
    return makeRequest(`${API_BASE_URL}/playlists/user/${userId}`);
  },

  getPlaylistById: async (playlistId) => {
    return makeRequest(`${API_BASE_URL}/playlists/${playlistId}`);
  },

  addVideoToPlaylist: async (videoId, playlistId) => {
    return makeRequest(`${API_BASE_URL}/playlists/add/${videoId}/${playlistId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
  },

  removeVideoFromPlaylist: async (videoId, playlistId) => {
    return makeRequest(`${API_BASE_URL}/playlists/remove/${videoId}/${playlistId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
  },

  updatePlaylist: async (playlistId, updateData) => {
    return makeRequest(`${API_BASE_URL}/playlists/${playlistId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
  },

  deletePlaylist: async (playlistId) => {
    return makeRequest(`${API_BASE_URL}/playlists/${playlistId}`, {
      method: 'DELETE'
    });
  },

  // User profile
  getUserChannelProfile: async (username) => {
    return makeRequest(`${API_BASE_URL}/users/c/${username}`);
  },

  getWatchHistory: async () => {
    return makeRequest(`${API_BASE_URL}/users/history`);
  },

  updateUserAvatar: async (formData) => {
    return makeRequest(`${API_BASE_URL}/users/avatar`, {
      method: 'PATCH',
      body: formData
    });
  },

  updateUserCoverImage: async (formData) => {
    return makeRequest(`${API_BASE_URL}/users/cover-image`, {
      method: 'PATCH',
      body: formData
    });
  },

  updateAccountDetails: async (updateData) => {
    return makeRequest(`${API_BASE_URL}/users/update-account`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
  },

  changePassword: async (passwordData) => {
    return makeRequest(`${API_BASE_URL}/users/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(passwordData)
    });
  }
};

