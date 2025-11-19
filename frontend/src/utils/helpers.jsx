// utils/helpers.js - Add these if not already present

/**
 * Format duration in seconds to readable format (HH:MM:SS or MM:SS)
 */
export const formatDuration = (seconds) => {
  if (!seconds || seconds < 0) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Format view count to readable format (1.2K, 1.5M, etc.)
 */
export const formatViews = (views) => {
  if (!views) return '0';
  
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`;
  }
  
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`;
  }
  
  return views.toString();
};

/**
 * Convert date to "time ago" format (2 hours ago, 3 days ago, etc.)
 */
export const timeAgo = (date) => {
  if (!date) return 'Unknown';
  
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now - past) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} ${diffInYears === 1 ? 'year' : 'years'} ago`;
};

/**
 * Format date to readable string
 */
export const formatDate = (date) => {
  if (!date) return 'Unknown';
  
  const d = new Date(date);
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return d.toLocaleDateString('en-US', options);
};