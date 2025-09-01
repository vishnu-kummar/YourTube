// src/utils/videoStateManager.js
// Simple state manager to cache video interactions

class VideoStateManager {
  constructor() {
    this.likes = new Map();
    this.subscriptions = new Map();
    this.comments = new Map();
  }

  // Like management
  setLikeState(videoId, isLiked, likesCount) {
    this.likes.set(videoId, { isLiked, likesCount, timestamp: Date.now() });
  }

  getLikeState(videoId) {
    const state = this.likes.get(videoId);
    if (!state) return null;
    
    // Cache for 5 minutes
    if (Date.now() - state.timestamp > 5 * 60 * 1000) {
      this.likes.delete(videoId);
      return null;
    }
    
    return state;
  }

  // Subscription management
  setSubscriptionState(channelId, isSubscribed) {
    this.subscriptions.set(channelId, { isSubscribed, timestamp: Date.now() });
  }

  getSubscriptionState(channelId) {
    const state = this.subscriptions.get(channelId);
    if (!state) return null;
    
    // Cache for 10 minutes
    if (Date.now() - state.timestamp > 10 * 60 * 1000) {
      this.subscriptions.delete(channelId);
      return null;
    }
    
    return state;
  }

  // Comment management
  setCommentsCount(videoId, count) {
    this.comments.set(videoId, { count, timestamp: Date.now() });
  }

  getCommentsCount(videoId) {
    const state = this.comments.get(videoId);
    if (!state) return null;
    
    // Cache for 2 minutes
    if (Date.now() - state.timestamp > 2 * 60 * 1000) {
      this.comments.delete(videoId);
      return null;
    }
    
    return state.count;
  }

  // Clear all cache
  clearCache() {
    this.likes.clear();
    this.subscriptions.clear();
    this.comments.clear();
  }

  // Clear cache for specific user (on logout)
  clearUserCache() {
    this.clearCache();
  }
}

// Export singleton instance
export const videoStateManager = new VideoStateManager();