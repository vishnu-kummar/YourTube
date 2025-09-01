import React from 'react';
import { EyeIcon, ClockIcon } from '../common/Icons';
import { formatViews, timeAgo } from '../../utils/helpers';

const VideoPlayer = ({ video, onClose }) => {
  if (!video) return null;

  return (
    <div className="video-player-overlay">
      <div className="video-player-container">
        <div className="video-player-header">
          <h3>{video.Title}</h3>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>
        <div className="video-player-content">
          <video 
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