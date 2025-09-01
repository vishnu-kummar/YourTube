import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { formatViews, formatDuration, timeAgo } from '../../utils/helpers';
import { videoStateManager } from '../../utils/videoStateManager';
import { EyeIcon, ClockIcon, HeartIcon, MessageCircleIcon, PlayIcon, StarIcon, BellIcon } from '../common/Icons';

const VideoCard = ({ video, onLike, onPlay, onSubscribe, user, onComment, onVideoUpdate }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(video.likesCount || 0);
  const [commentsCount, setCommentsCount] = useState(video.commentsCount || 0);
  const [viewsCount, setViewsCount] = useState(video.views || 0);
  const [subscriberCount, setSubscriberCount] = useState(0); // New state for subscriber count
  const [isLoading, setIsLoading] = useState(false);

// Fix for VideoCard.jsx - Update the checkSubscriptionStatus function
const checkSubscriptionStatus = async () => {
  if (!user || !video.owner?._id || video.owner._id === user._id) return;
  try {
    const response = await apiService.checkSubscriptionStatus(video.owner._id);
    // Fix: Access the data property from the response
    setIsSubscribed(response.data?.isSubscribed || false);
    videoStateManager.setSubscriptionState(video.owner._id, response.data?.isSubscribed || false);
  } catch (error) {
    console.error('Failed to check subscription status:', error);
    setIsSubscribed(false); // Set default value on error
  }
};

  const fetchSubscriberCount = async () => {
    if (!video.owner?._id) return;
    try {
      const response = await apiService.getChannelSubscribers(video.owner._id);
      setSubscriberCount(response.data.totalSubscribers || 0);
    } catch (error) {
      console.error('Failed to fetch subscriber count:', error);
    }
  };

  useEffect(() => {
    // Initialize state from props
    setLikesCount(video.likesCount || 0);
    setCommentsCount(video.commentsCount || 0);
    setViewsCount(video.views || 0);
    setSubscriberCount(video.owner?.subscriberCount || 0);

    // Load cached states
    const cachedLike = videoStateManager.getLikeState(video._id);
    const cachedSubscription = videoStateManager.getSubscriptionState(video.owner?._id);
    const cachedComments = videoStateManager.getCommentsCount(video._id);

    if (cachedLike) {
      setIsLiked(cachedLike.isLiked);
      setLikesCount(cachedLike.likesCount);
    }
    if (cachedSubscription) {
      setIsSubscribed(cachedSubscription.isSubscribed);
    }
    if (cachedComments !== null) {
      setCommentsCount(cachedComments);
    }

    // Fetch initial data
    checkSubscriptionStatus();
    fetchSubscriberCount();

    // Set up polling for real-time updates
    const pollingInterval = setInterval(() => {
      checkSubscriptionStatus();
      fetchSubscriberCount();
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(pollingInterval); // Cleanup on unmount
  }, [video, user]);

  const handlePlayClick = async (e) => {
    e.stopPropagation();
    onPlay(video);
    try {
      const res = await apiService.getVideoById(video._id);
      if (res?.data?.views !== undefined) {
        setViewsCount(res.data.views);
        if (onVideoUpdate) {
          onVideoUpdate(video._id, { views: res.data.views });
        }
      }
    } catch (error) {
      console.error("Failed to update views:", error);
    }
  };

  const handleLikeClick = async (e) => {
    e.stopPropagation();
    if (!user) {
      alert('Please login to like videos');
      return;
    }
    setIsLoading(true);
    const originalLiked = isLiked;
    const originalCount = likesCount;
    const newIsLiked = !isLiked;
    const newCount = newIsLiked ? likesCount + 1 : likesCount - 1;

    setIsLiked(newIsLiked);
    setLikesCount(newCount);
    videoStateManager.setLikeState(video._id, newIsLiked, newCount);

    try {
      await apiService.toggleVideoLike(video._id);
      if (onVideoUpdate) {
        onVideoUpdate(video._id, {
          likesCount: newCount,
          isLikedByUser: newIsLiked,
        });
      }
    } catch (error) {
      setIsLiked(originalLiked);
      setLikesCount(originalCount);
      videoStateManager.setLikeState(video._id, originalLiked, originalCount);
      console.error('Failed to like video:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribeClick = async (e) => {
    e.stopPropagation();
    if (!user) {
      alert('Please login to subscribe to channels');
      return;
    }
    if (!video.owner?._id) {
      alert('Invalid channel');
      return;
    }
    setIsLoading(true);
    const originalState = isSubscribed;
    const newState = !isSubscribed;
    setIsSubscribed(newState);
    setSubscriberCount((prev) => (newState ? prev + 1 : prev - 1)); // Optimistic update
    videoStateManager.setSubscriptionState(video.owner._id, newState);

    try {
      const response = await apiService.toggleSubscription(video.owner._id);
      if (!response.data.subscribed) throw new Error('Subscription toggle failed');
      await fetchSubscriberCount(); // Fetch updated count after toggle
      if (onSubscribe) {
        onSubscribe(video.owner._id, newState);
      }
    } catch (error) {
      setIsSubscribed(originalState);
      setSubscriberCount((prev) => (newState ? prev - 1 : prev + 1)); // Revert optimistic update
      videoStateManager.setSubscriptionState(video.owner._id, originalState);
      console.error('Failed to toggle subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommentClick = (e) => {
    e.stopPropagation();
    if (!user) {
      alert('Please login to comment on videos');
      return;
    }
    onComment(video, (newCommentsCount) => {
      setCommentsCount(newCommentsCount);
      videoStateManager.setCommentsCount(video._id, newCommentsCount);
      if (onVideoUpdate) {
        onVideoUpdate(video._id, { commentsCount: newCommentsCount });
      }
    });
  };

  return (
    <div
      className="video-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="video-thumbnail-container">
        <img
          src={video.thumbnail || 'https://via.placeholder.com/320x180'}
          alt={video.Title}
          className="video-thumbnail"
        />
        <div className={`video-overlay ${isHovered ? 'visible' : ''}`}>
          <div className="video-play-btn" onClick={handlePlayClick}>
            <PlayIcon />
            <span>Watch Now</span>
          </div>
        </div>
        <div className="video-duration">{formatDuration(video.duration || 0)}</div>
      </div>

      <div className="video-content">
        <div className="video-channel">
          <div className="channel-avatar">
            <img
              src={video.owner?.avatar || 'https://via.placeholder.com/40'}
              alt={video.owner?.username}
              className="avatar-img"
            />
            <div className="online-indicator"></div>
          </div>
          <div className="channel-info">
            <h4>{video.owner?.username}</h4>
            <p>{video.owner?.fullname}</p>
            <p className="subscriber-count">{formatViews(subscriberCount)} subscribers</p>
          </div>
          {user && video.owner?._id !== user._id && (
            <button
              onClick={handleSubscribeClick}
              className={`subscribe-btn ${isSubscribed ? 'subscribed' : ''} ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              <BellIcon />
              <span>{isSubscribed ? 'Unsubscribe' : 'Subscribe'}</span>
            </button>
          )}
        </div>

        <h3 className="video-title" onClick={handlePlayClick}>
          {video.Title}
        </h3>

        <p className="video-description">{video.description}</p>

        <div className="video-stats">
          <div className="stat">
            <EyeIcon />
            <span>{formatViews(viewsCount)} views</span>
          </div>
          <div className="stat">
            <ClockIcon />
            <span>{timeAgo(video.createdAt)}</span>
          </div>
        </div>

        <div className="video-actions">
          <div className="action-buttons">
            <button
              onClick={handleLikeClick}
              className={`like-btn ${isLiked ? 'liked' : ''} ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              <HeartIcon />
              <span>{formatViews(likesCount)}</span>
            </button>
            <button className="comment-btn" onClick={handleCommentClick}>
              <MessageCircleIcon />
              <span>{commentsCount}</span>
            </button>
          </div>

          <div className="video-rating">
            {[...Array(5)].map((_, i) => (
              <StarIcon key={i} />
            ))}
            <span>4.8</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;