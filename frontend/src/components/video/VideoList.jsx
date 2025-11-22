// src/components/video/VideoList.jsx
import React, { useState, useEffect } from 'react';
import VideoCard from './VideoCard';
import { apiService } from '../../services/apiService';
import { SearchIcon, VideoIcon } from '../common/Icons';

const VideoList = ({ onLike, onPlay, user, onComment }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadVideos();
  }, [searchQuery]);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAllVideos(1, 50, searchQuery);
      setVideos(response.data.docs || []);
    } catch (error) {
      console.error('Failed to load videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (videoId) => {
    if (!user) {
      alert('Please login to like videos');
      return;
    }

    try {
      await apiService.toggleVideoLike(videoId);
      
      // Update the video in the local state
      setVideos(prevVideos => 
        prevVideos.map(video => {
          if (video._id === videoId) {
            const currentLikes = video.likesCount || 0;
            const isCurrentlyLiked = video.isLikedByUser || false;
            
            return {
              ...video,
              likesCount: isCurrentlyLiked ? currentLikes - 1 : currentLikes + 1,
              isLikedByUser: !isCurrentlyLiked
            };
          }
          return video;
        })
      );
      
    } catch (error) {
      console.error('Failed to like video:', error);
      alert('Failed to like video. Please try again.');
    }
  };

  // Function to update video data from child components
  const updateVideoData = (videoId, updates) => {
    setVideos(prevVideos =>
      prevVideos.map(video =>
        video._id === videoId ? { ...video, ...updates } : video
      )
    );
  };

  if (loading) {
    return (
      <div className="video-list-loading">
        <div className="loading-spinner"></div>
        <p>Loading amazing videos...</p>
      </div>
    );
  }

  return (
    <div className="video-list-container">
      <div className="video-list-header">
        <div className="search-container">
          <h1>Discover Amazing Videos</h1>
          <div className="search-box">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search for videos, channels, or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="video-list-content">
        {videos.length === 0 ? (
          <div className="no-videos-found">
            <div className="no-videos-icon">
              <VideoIcon />
            </div>
            <h3>No videos found</h3>
            <p>Try adjusting your search terms or explore different topics</p>
          </div>
        ) : (
          <>
            <div className="video-list-header-info">
              <h2>{searchQuery ? `Results for "${searchQuery}"` : 'Trending Videos'}</h2>
              <div className="video-count">
                <span>{videos.length} videos</span>
                <div className="online-indicator"></div>
              </div>
            </div>

            <div className="video-grid">
              {videos.map((video) => (
                <VideoCard
                  key={video._id}
                  video={video}
                  onLike={handleLike}
                  onPlay={onPlay}
                  onComment={onComment}
                  onVideoUpdate={updateVideoData}
                  user={user}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VideoList;