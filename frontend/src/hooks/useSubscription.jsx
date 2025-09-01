// hooks/useSubscription.js
import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';
import { videoStateManager } from '../utils/videoStateManager';

export const useSubscription = (channelId, initialState = null) => {
  const [isSubscribed, setIsSubscribed] = useState(initialState?.isSubscribed || false);
  const [subscribersCount, setSubscribersCount] = useState(initialState?.subscribersCount || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load subscription state from cache or API
  useEffect(() => {
    if (!channelId) return;

    const loadSubscriptionState = async () => {
      // First check cache
      const cachedState = videoStateManager.getSubscriptionState(channelId);
      if (cachedState) {
        setIsSubscribed(cachedState.isSubscribed);
        if (cachedState.subscribersCount !== null) {
          setSubscribersCount(cachedState.subscribersCount);
        }
        return;
      }

      // If not in cache, fetch from API
      try {
        setIsLoading(true);
        const response = await apiService.checkSubscriptionStatus(channelId);
        if (response.success) {
          setIsSubscribed(response.data.isSubscribed);
          setSubscribersCount(response.data.subscribersCount);
          
          // Cache the result
          videoStateManager.setSubscriptionState(
            channelId,
            response.data.isSubscribed,
            response.data.subscribersCount
          );
        }
      } catch (err) {
        setError(err.message);
        console.error('Failed to load subscription state:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSubscriptionState();
  }, [channelId]);

  // Toggle subscription
  const toggleSubscription = useCallback(async () => {
    if (!channelId || isLoading) return;

    setIsLoading(true);
    setError(null);

    const originalSubscribed = isSubscribed;
    const originalCount = subscribersCount;
    const newSubscribed = !isSubscribed;
    const newCount = newSubscribed ? subscribersCount + 1 : subscribersCount - 1;

    // Optimistic update
    setIsSubscribed(newSubscribed);
    setSubscribersCount(newCount);

    // Update cache
    videoStateManager.setSubscriptionState(channelId, newSubscribed, newCount);

    try {
      const response = await apiService.toggleSubscription(channelId);
      if (!response.success) {
        throw new Error('Subscription toggle failed');
      }

      // Optionally fetch updated subscriber count from server
      setTimeout(async () => {
        try {
          const statusResponse = await apiService.checkSubscriptionStatus(channelId);
          if (statusResponse.success) {
            setSubscribersCount(statusResponse.data.subscribersCount);
            videoStateManager.setSubscriptionState(
              channelId,
              newSubscribed,
              statusResponse.data.subscribersCount
            );
          }
        } catch (err) {
          console.error('Failed to update subscriber count:', err);
        }
      }, 1000);

    } catch (err) {
      // Revert on error
      setIsSubscribed(originalSubscribed);
      setSubscribersCount(originalCount);
      videoStateManager.setSubscriptionState(channelId, originalSubscribed, originalCount);
      setError(err.message);
      console.error('Failed to toggle subscription:', err);
    } finally {
      setIsLoading(false);
    }
  }, [channelId, isSubscribed, subscribersCount, isLoading]);

  // Manual refresh
  const refreshSubscriptionState = useCallback(async () => {
    if (!channelId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.checkSubscriptionStatus(channelId);
      if (response.success) {
        setIsSubscribed(response.data.isSubscribed);
        setSubscribersCount(response.data.subscribersCount);
        
        // Update cache
        videoStateManager.setSubscriptionState(
          channelId,
          response.data.isSubscribed,
          response.data.subscribersCount
        );
      }
    } catch (err) {
      setError(err.message);
      console.error('Failed to refresh subscription state:', err);
    } finally {
      setIsLoading(false);
    }
  }, [channelId]);

  return {
    isSubscribed,
    subscribersCount,
    isLoading,
    error,
    toggleSubscription,
    refreshSubscriptionState
  };
};

// Hook for managing multiple subscriptions
export const useBulkSubscriptions = (channelIds = []) => {
  const [subscriptions, setSubscriptions] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (channelIds.length === 0) return;

    const loadSubscriptions = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Check cache first
        const cachedStates = videoStateManager.getMultipleSubscriptionStates(channelIds);
        const uncachedChannelIds = channelIds.filter(id => !cachedStates[id]);

        // Set cached states
        if (Object.keys(cachedStates).length > 0) {
          setSubscriptions(prev => ({ ...prev, ...cachedStates }));
        }

        // Fetch uncached states
        if (uncachedChannelIds.length > 0) {
          const response = await apiService.bulkCheckSubscriptionStatus(uncachedChannelIds);
          if (response.success) {
            setSubscriptions(prev => ({ ...prev, ...response.data }));
            
            // Cache the results
            Object.entries(response.data).forEach(([channelId, state]) => {
              videoStateManager.setSubscriptionState(
                channelId,
                state.isSubscribed,
                state.subscribersCount
              );
            });
          }
        }
      } catch (err) {
        setError(err.message);
        console.error('Failed to load bulk subscriptions:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSubscriptions();
  }, [channelIds.join(',')]);

  const updateSubscription = useCallback((channelId, isSubscribed, subscribersCount) => {
    setSubscriptions(prev => ({
      ...prev,
      [channelId]: { isSubscribed, subscribersCount }
    }));
    
    // Update cache
    videoStateManager.setSubscriptionState(channelId, isSubscribed, subscribersCount);
  }, []);

  return {
    subscriptions,
    isLoading,
    error,
    updateSubscription
  };
};

// Hook for subscription statistics
export const useSubscriptionStats = (userId) => {
  const [stats, setStats] = useState({
    subscribedTo: 0,
    subscribers: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadStats = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.getUserSubscriptionStats(userId);
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      setError(err.message);
      console.error('Failed to load subscription stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    isLoading,
    error,
    refreshStats: loadStats
  };
};