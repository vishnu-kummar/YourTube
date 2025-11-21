// src/components/video/VideoWatchPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../../services/apiService';
import CommentSection from './CommentSection';
import { 
  EyeIcon, ClockIcon, ThumbsUpIcon, ShareIcon, 
  PlayCircleIcon, UserIcon 
} from '../common/Icons';
import { formatViews, timeAgo, formatDuration } from '../../utils/helpers';

const VideoWatchPage = ({ video, user, onClose, onVideoSelect }) => {
  const [allVideos, setAllVideos] = useState([]);
  const [videoDetails, setVideoDetails] = useState(video);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Watch history tracking
  const videoRef = useRef(null);
  const intervalRef = useRef(null);
  const lastSavedTimeRef = useRef(0);

  useEffect(() => {
    loadVideoDetails();
    loadSuggestedVideos();
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [video._id]);

  // Watch history tracking
  useEffect(() => {
    if (!user || !video) return;

    const saveProgress = async () => {
      const el = videoRef.current;
      if (!el) return;
      const t = Math.floor(el.currentTime);
      if (Math.abs(t - lastSavedTimeRef.current) < 5) return;
      try {
        await apiService.updateWatchHistory(video._id, t);
        lastSavedTimeRef.current = t;
      } catch (e) { console.error('Watch history error:', e); }
    };

    intervalRef.current = setInterval(saveProgress, 10000);
    const el = videoRef.current;
    if (el) {
      el.addEventListener('pause', saveProgress);
      el.addEventListener('ended', saveProgress);
    }

    return () => {
      clearInterval(intervalRef.current);
      saveProgress();
      if (el) {
        el.removeEventListener('pause', saveProgress);
        el.removeEventListener('ended', saveProgress);
      }
    };
  }, [video, user]);

  const loadVideoDetails = async () => {
    try {
      const res = await apiService.getVideoById(video._id);
      setVideoDetails(res.data);
      setLikesCount(res.data.likesCount || 0);
      setIsLiked(res.data.isLiked || false);
      
      if (res.data.owner?._id && user) {
        const subRes = await apiService.checkSubscriptionStatus(res.data.owner._id);
        setIsSubscribed(subRes.data?.isSubscribed || false);
      }
    } catch (e) { console.error('Error loading video:', e); }
  };

  const loadSuggestedVideos = async () => {
    try {
      setLoading(true);
      const res = await apiService.getAllVideos(1, 15);
      const filtered = (res.data.docs || []).filter(v => v._id !== video._id);
      setAllVideos(filtered);
    } catch (e) { console.error('Error loading suggestions:', e); }
    finally { setLoading(false); }
  };

  const handleLike = async () => {
    if (!user) { alert('Please login to like videos'); return; }
    try {
      await apiService.toggleVideoLike(video._id);
      setIsLiked(!isLiked);
      setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    } catch (e) { console.error('Like error:', e); }
  };

  const handleSubscribe = async () => {
    if (!user) { alert('Please login to subscribe'); return; }
    if (!videoDetails?.owner?._id) return;
    try {
      await apiService.toggleSubscription(videoDetails.owner._id);
      setIsSubscribed(!isSubscribed);
      setSubscriberCount(prev => isSubscribed ? prev - 1 : prev + 1);
    } catch (e) { console.error('Subscribe error:', e); }
  };

  const handleVideoClick = (newVideo) => {
    if (onVideoSelect) onVideoSelect(newVideo);
  };

  return (
    <div className="video-watch-page">
      {/* Back Button */}
      <button className="back-to-home-btn" onClick={onClose}>
        ← Back to Home
      </button>

      <div className="watch-page-content">
        {/* Left Section - Video + Info + Comments */}
        <div className="watch-main-section">
          {/* Video Player */}
          <div className="watch-video-container">
            <video
              ref={videoRef}
              controls
              autoPlay
              className="watch-video-player"
              poster={videoDetails?.thumbnail}
            >
              <source src={videoDetails?.videoFile} type="video/mp4" />
            </video>
          </div>

          {/* Video Info */}
          <div className="watch-video-info">
            <h1 className="watch-video-title">{videoDetails?.Title}</h1>
            
            <div className="watch-video-meta">
              <div className="watch-meta-left">
                <span className="watch-views">
                  <EyeIcon /> {formatViews(videoDetails?.views || 0)} views
                </span>
                <span className="watch-date">
                  <ClockIcon /> {timeAgo(videoDetails?.createdAt)}
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
                  src={videoDetails?.owner?.avatar || 'https://via.placeholder.com/48'} 
                  alt={videoDetails?.owner?.username}
                  className="watch-channel-avatar"
                />
                <div className="watch-channel-details">
                  <h3>{videoDetails?.owner?.username || 'Unknown Channel'}</h3>
                  <span>{subscriberCount} subscribers</span>
                </div>
              </div>
              
              {user && videoDetails?.owner?._id !== user._id && (
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
              <p>{videoDetails?.description}</p>
            </div>
          </div>

          {/* Comments Section */}
          <div className="watch-comments-section">
            <CommentSection videoId={video._id} user={user} />
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
                  onClick={() => handleVideoClick(v)}
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