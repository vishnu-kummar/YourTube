// src/components/video/VideoWatchPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../../services/apiService';
import CommentSection from './CommentSection';
import { 
  EyeIcon, ClockIcon, ThumbsUpIcon, ShareIcon, 
  PlayCircleIcon, UserIcon 
} from '../common/Icons';
import { formatViews, timeAgo, formatDuration } from '../../utils/helpers';

const VideoWatchPage = ({ video, user, onClose }) => {
  // Current video being watched (can change when clicking suggested videos)
  const [currentVideo, setCurrentVideo] = useState(video);
  const [allVideos, setAllVideos] = useState([]);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [videoKey, setVideoKey] = useState(0); // Force video element to remount
  
  // Watch history tracking refs
  const videoRef = useRef(null);
  const intervalRef = useRef(null);
  const lastSavedTimeRef = useRef(0);

  // Load video details when currentVideo changes
  useEffect(() => {
    if (currentVideo?._id) {
      loadVideoDetails(currentVideo._id);
      loadSuggestedVideos(currentVideo._id);
    }
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentVideo?._id]);

  // Watch history tracking
  useEffect(() => {
    if (!user || !currentVideo) return;

    const saveProgress = async () => {
      const el = videoRef.current;
      if (!el) return;
      const t = Math.floor(el.currentTime);
      if (Math.abs(t - lastSavedTimeRef.current) < 5) return;
      try {
        await apiService.updateWatchHistory(currentVideo._id, t);
        lastSavedTimeRef.current = t;
        console.log(`📊 Watch progress saved: ${t}s`);
      } catch (e) { 
        console.error('Watch history error:', e); 
      }
    };

    intervalRef.current = setInterval(saveProgress, 10000);
    
    const el = videoRef.current;
    if (el) {
      el.addEventListener('pause', saveProgress);
      el.addEventListener('ended', saveProgress);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      saveProgress();
      if (el) {
        el.removeEventListener('pause', saveProgress);
        el.removeEventListener('ended', saveProgress);
      }
    };
  }, [currentVideo?._id, user]);

  const loadVideoDetails = async (videoId) => {
    try {
      const res = await apiService.getVideoById(videoId);
      const videoData = res.data;
      
      setCurrentVideo(videoData);
      setLikesCount(videoData.likesCount || 0);
      setIsLiked(videoData.isLiked || false);
      
      // Check subscription status
      if (videoData.owner?._id && user) {
        try {
          const subRes = await apiService.checkSubscriptionStatus(videoData.owner._id);
          setIsSubscribed(subRes.data?.isSubscribed || false);
        } catch (e) {
          console.error('Subscription check error:', e);
        }
      }
    } catch (e) { 
      console.error('Error loading video:', e); 
    }
  };

  const loadSuggestedVideos = async (excludeVideoId) => {
    try {
      setLoading(true);
      const res = await apiService.getAllVideos(1, 25);
      const filtered = (res.data.docs || []).filter(v => v._id !== excludeVideoId);
      setAllVideos(filtered);
    } catch (e) { 
      console.error('Error loading suggestions:', e); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleLike = async () => {
    if (!user) { 
      alert('Please login to like videos'); 
      return; 
    }
    try {
      await apiService.toggleVideoLike(currentVideo._id);
      setIsLiked(!isLiked);
      setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    } catch (e) { 
      console.error('Like error:', e); 
    }
  };

  const handleSubscribe = async () => {
    if (!user) { 
      alert('Please login to subscribe'); 
      return; 
    }
    if (!currentVideo?.owner?._id) return;
    try {
      await apiService.toggleSubscription(currentVideo.owner._id);
      setIsSubscribed(!isSubscribed);
      setSubscriberCount(prev => isSubscribed ? prev - 1 : prev + 1);
    } catch (e) { 
      console.error('Subscribe error:', e); 
    }
  };

  // Handle clicking on a suggested video
  const handleSuggestedVideoClick = (newVideo) => {
    console.log('Switching to video:', newVideo.Title);
    
    // Reset tracking
    lastSavedTimeRef.current = 0;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Update state to new video
    setCurrentVideo(newVideo);
    setVideoKey(prev => prev + 1); // Force video element to remount
    
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!currentVideo) return null;

  return (
    <div className="video-watch-page">
      {/* Back Button */}
      <button className="back-to-home-btn" onClick={onClose}>
        ← Back to Home
      </button>

      <div className="watch-page-content">
        {/* Left Section - Video + Info + Comments */}
        <div className="watch-main-section">
          {/* Video Player - key prop forces remount when video changes */}
          <div className="watch-video-container">
            <video
              key={videoKey}
              ref={videoRef}
              controls
              autoPlay
              className="watch-video-player"
              poster={currentVideo?.thumbnail}
            >
              <source src={currentVideo?.videoFile} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>

          {/* Video Info */}
          <div className="watch-video-info">
            <h1 className="watch-video-title">{currentVideo?.Title}</h1>
            
            <div className="watch-video-meta">
              <div className="watch-meta-left">
                <span className="watch-views">
                  <EyeIcon /> {formatViews(currentVideo?.views || 0)} views
                </span>
                <span className="watch-date">
                  <ClockIcon /> {timeAgo(currentVideo?.createdAt)}
                </span>
              </div>
              
              <div className="watch-meta-right">
                <button 
                  className={`watch-like-btn ${isLiked ? 'liked' : ''}`}
                  onClick={handleLike}
                >
                  <ThumbsUpIcon /> {likesCount}
                </button>
                <button className="watch-share-btn">
                  <ShareIcon /> Share
                </button>
              </div>
            </div>

            {/* Channel Info */}
            <div className="watch-channel-section">
              <div className="watch-channel-info">
                <img 
                  src={currentVideo?.owner?.avatar || 'https://via.placeholder.com/48'} 
                  alt={currentVideo?.owner?.username}
                  className="watch-channel-avatar"
                />
                <div className="watch-channel-details">
                  <h3>{currentVideo?.owner?.username || 'Unknown Channel'}</h3>
                  <span>{subscriberCount} subscribers</span>
                </div>
              </div>
              
              {user && currentVideo?.owner?._id !== user._id && (
                <button 
                  className={`watch-subscribe-btn ${isSubscribed ? 'subscribed' : ''}`}
                  onClick={handleSubscribe}
                >
                  {isSubscribed ? '✓ Subscribed' : 'Subscribe'}
                </button>
              )}
            </div>

            {/* Description */}
            <div className="watch-description">
              <p>{currentVideo?.description}</p>
            </div>
          </div>

          {/* Comments Section - key forces remount when video changes */}
          <div className="watch-comments-section">
            <CommentSection 
              key={currentVideo._id} 
              videoId={currentVideo._id} 
              user={user} 
            />
          </div>
        </div>

        {/* Right Sidebar - Suggested Videos */}
        <div className="watch-sidebar">
          <h3 className="sidebar-title">Suggested Videos</h3>
          
          {loading ? (
            <div className="sidebar-loading">
              <div className="loading-spinner"></div>
            </div>
          ) : (
            <div className="suggested-videos-list">
              {allVideos.map((v) => (
                <div 
                  key={v._id} 
                  className="suggested-video-card"
                  onClick={() => handleSuggestedVideoClick(v)}
                >
                  <div className="suggested-thumbnail">
                    <img src={v.thumbnail} alt={v.Title} />
                    <span className="suggested-duration">
                      {formatDuration(v.duration)}
                    </span>
                  </div>
                  <div className="suggested-info">
                    <h4>{v.Title}</h4>
                    <p className="suggested-channel">{v.owner?.username}</p>
                    <div className="suggested-stats">
                      <span>{formatViews(v.views)} views</span>
                      <span>•</span>
                      <span>{timeAgo(v.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoWatchPage;