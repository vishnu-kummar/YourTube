// src/services/apiService.js
// API Configuration
const API_BASE_URL = 'http://localhost:8000/api/v1';

// API Service
export const apiService = {
  // Auth
  register: async (formData) => {
    const response = await fetch(`${API_BASE_URL}/users/register`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Registration failed');
    return response.json();
  },

  login: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Login failed');
    return response.json();
  },

  logout: async () => {
    const response = await fetch(`${API_BASE_URL}/users/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Logout failed');
    return response.json();
  },

  getCurrentUser: async () => {
    const response = await fetch(`${API_BASE_URL}/users/current-user`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to get current user');
    return response.json();
  },

  // Videos
  getAllVideos: async (page = 1, limit = 10, query = '') => {
    const params = new URLSearchParams({ page, limit, query });
    const response = await fetch(`${API_BASE_URL}/videos?${params}`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch videos');
    return response.json();
  },

  getVideoById: async (videoId) => {
    const response = await fetch(`${API_BASE_URL}/videos/${videoId}`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch video');
    return response.json();
  },

  uploadVideo: async (formData) => {
    const response = await fetch(`${API_BASE_URL}/videos`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Video upload failed');
    return response.json();
  },

  // Likes
  toggleVideoLike: async (videoId) => {
    const response = await fetch(`${API_BASE_URL}/likes/toggle/v/${videoId}`, {
      method: 'POST',
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to toggle like');
    return response.json();
  },

  // Get like status for a video
  getVideoLikeStatus: async (videoId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/likes/status/v/${videoId}`, {
        credentials: 'include'
      });
      if (!response.ok) return { isLiked: false, likesCount: 0 };
      return response.json();
    } catch (error) {
      console.error('Failed to get like status:', error);
      return { isLiked: false, likesCount: 0 };
    }
  },

  // Comments
  getVideoComments: async (videoId, page = 1) => {
    const response = await fetch(`${API_BASE_URL}/comments/${videoId}?page=${page}`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch comments');
    return response.json();
  },

  addComment: async (videoId, content) => {
    const response = await fetch(`${API_BASE_URL}/comments/${videoId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to add comment');
    return response.json();
  },

  // Subscriptions
toggleSubscription: async (channelId) => {
  const response = await fetch(`${API_BASE_URL}/subscriptions/c/${channelId}`, {
    method: 'POST',
    credentials: 'include'
  });
  if (!response.ok) throw new Error('Failed to toggle subscription');
  return response.json();
},
  // Check subscription status
// Fix for apiService.js - Update checkSubscriptionStatus function
checkSubscriptionStatus: async (channelId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/subscriptions/status/c/${channelId}`, {
      credentials: 'include',
    });
    if (!response.ok) {
      console.warn('Subscription status check failed:', response.status, response.statusText);
      return { data: { isSubscribed: false } }; // Return consistent structure
    }
    const data = await response.json();
    return data; // This should be the full response with data property
  } catch (error) {
    console.error('Subscription status check failed:', error);
    return { data: { isSubscribed: false } }; // Return consistent structure
  }
},

  // Get user's subscriptions
getUserSubscriptions: async (userId) => {
  if (!userId) {
    console.error('getUserSubscriptions: userId is required');
    return { data: { subscribedChannels: [] } };
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/subscriptions/u/${userId}`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      console.error('Failed to fetch subscriptions:', response.status);
      return { data: { subscribedChannels: [] } };
    }
    
    const data = await response.json();
    console.log('Subscriptions loaded:', data);
    return data;
  } catch (error) {
    console.error('Failed to get user subscriptions:', error);
    return { data: { subscribedChannels: [] } };
  }
},
  // Dashboard
  getChannelStats: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch channel stats');
    return response.json();
  },

getChannelSubscribers: async (channelId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/subscriptions/c/${channelId}`, {
      credentials: 'include'
    });
    if (!response.ok) return { data: { subscribers: [] } };
    return response.json();
  } catch (error) {
    console.error('Failed to get channel subscribers:', error);
    return { data: { subscribers: [] } };
  }
},

  getChannelVideos: async (page = 1, limit = 10, sortBy = 'createdAt', sortType = 'desc') => {
    const params = new URLSearchParams({ page, limit, sortBy, sortType });
    const response = await fetch(`${API_BASE_URL}/dashboard/videos?${params}`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch channel videos');
    return response.json();
  },

  // Add these to your apiService object:

// Playlists
createPlaylist: async (playlistData) => {
  const response = await fetch(`${API_BASE_URL}/playlists`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(playlistData),
    credentials: 'include'
  });
  if (!response.ok) throw new Error('Failed to create playlist');
  return response.json();
},

getUserPlaylists: async (userId) => {
  const response = await fetch(`${API_BASE_URL}/playlists/user/${userId}`, {
    credentials: 'include'
  });
  if (!response.ok) throw new Error('Failed to fetch user playlists');
  return response.json();
},

getPlaylistById: async (playlistId) => {
  const response = await fetch(`${API_BASE_URL}/playlists/${playlistId}`, {
    credentials: 'include'
  });
  if (!response.ok) throw new Error('Failed to fetch playlist');
  return response.json();
},

addVideoToPlaylist: async (videoId, playlistId) => {
  const response = await fetch(`${API_BASE_URL}/playlists/add/${videoId}/${playlistId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}), // Send empty object
    credentials: 'include'
  });
  if (!response.ok) throw new Error('Failed to add video to playlist');
  return response.json();
},

removeVideoFromPlaylist: async (videoId, playlistId) => {
  const response = await fetch(`${API_BASE_URL}/playlists/remove/${videoId}/${playlistId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}), // Send empty object
    credentials: 'include'
  });
  if (!response.ok) throw new Error('Failed to remove video from playlist');
  return response.json();
},

updatePlaylist: async (playlistId, updateData) => {
  const response = await fetch(`${API_BASE_URL}/playlists/${playlistId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData),
    credentials: 'include'
  });
  if (!response.ok) throw new Error('Failed to update playlist');
  return response.json();
},

deletePlaylist: async (playlistId) => {
  const response = await fetch(`${API_BASE_URL}/playlists/${playlistId}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  if (!response.ok) throw new Error('Failed to delete playlist');
  return response.json();
},


  
};