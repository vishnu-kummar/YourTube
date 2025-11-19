import React, { useRef, useEffect, useState } from 'react';
import { EyeIcon, ClockIcon } from '../common/Icons';
import { formatViews, timeAgo } from '../../utils/helpers';
import { apiService } from '../../services/apiService';

const VideoPlayer = ({ video, onClose, user }) => {
  const videoRef = useRef(null);
  const intervalRef = useRef(null);
  const lastSavedTimeRef = useRef(0);
  const [isTracking, setIsTracking] = useState(false);

  // Constants for tracking
  const TRACKING_INTERVAL = 10000; // Update every 10 seconds
  const MIN_TIME_DIFFERENCE = 5; // Only save if 5+ seconds difference

  useEffect(() => {
    // Only track if user is logged in
    if (!user || !video) {
      return;
    }

    setIsTracking(true);

    // Function to save watch progress
    const saveWatchProgress = async () => {
      const videoElement = videoRef.current;
      if (!videoElement) return;

      const currentTime = Math.floor(videoElement.currentTime);
      
      // Only save if significant time difference
      if (Math.abs(currentTime - lastSavedTimeRef.current) < MIN_TIME_DIFFERENCE) {
        return;
      }

      try {
        await apiService.updateWatchHistory(video._id, currentTime);
        lastSavedTimeRef.current = currentTime;
        console.log(`📊 Watch progress saved: ${currentTime}s`);
      } catch (error) {
        console.error('Failed to update watch history:', error);
      }
    };

    // Save progress periodically
    intervalRef.current = setInterval(saveWatchProgress, TRACKING_INTERVAL);

    // Save on video events
    const handleTimeUpdate = () => {
      const videoElement = videoRef.current;
      if (!videoElement) return;
      
      const currentTime = Math.floor(videoElement.currentTime);
      const duration = Math.floor(videoElement.duration);
      
      // Auto-save when reaching 25%, 50%, 75%, and 90% completion
      const percentage = (currentTime / duration) * 100;
      if ([25, 50, 75, 90].some(p => Math.abs(percentage - p) < 1)) {
        saveWatchProgress();
      }
    };

    const handlePause = () => {
      saveWatchProgress();
    };

    const handleEnded = () => {
      saveWatchProgress();
    };

    const videoElement = videoRef.current;
    if (videoElement) {
      videoElement.addEventListener('timeupdate', handleTimeUpdate);
      videoElement.addEventListener('pause', handlePause);
      videoElement.addEventListener('ended', handleEnded);
    }

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // Final save on unmount
      saveWatchProgress();
      
      if (videoElement) {
        videoElement.removeEventListener('timeupdate', handleTimeUpdate);
        videoElement.removeEventListener('pause', handlePause);
        videoElement.removeEventListener('ended', handleEnded);
      }
      
      setIsTracking(false);
    };
  }, [video, user]);

  if (!video) return null;

  return (
    <div className="video-player-overlay">
      <div className="video-player-container">
        <div className="video-player-header">
          <h3>{video.Title}</h3>
          <div className="header-actions">
            {isTracking && user && (
              <span className="tracking-indicator" title="Watch history is being tracked">
                📊 Tracking
              </span>
            )}
            <button onClick={onClose} className="close-btn">✕</button>
          </div>
        </div>
        <div className="video-player-content">
          <video 
            ref={videoRef}
            controls 
            autoPlay 
            className="video-element"
            poster={video.thumbnail}
          >
            <source src={video.videoFile} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <div className="video-player-details">
            <div className="video-info">
              <p className="video-description">{video.description}</p>
              <div className="video-stats">
                <span><EyeIcon /> {formatViews(video.views || 0)} views</span>
                <span><ClockIcon /> {timeAgo(video.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;