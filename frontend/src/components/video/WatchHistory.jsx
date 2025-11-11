
import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { ClockIcon, EyeIcon, PlayCircleIcon, CheckCircleIcon } from '../common/Icons';
import { formatViews, timeAgo, formatDuration } from '../../utils/helpers';

// History Icon Component
const HistoryIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);





// Individual History Video Card
const HistoryVideoCard = ({ historyItem, onVideoSelect }) => {
  const { 
    _id, 
    title, 
    thumbnail, 
    duration, 
    owner, 
    watchDurationSeconds, 
    isCompleted, 
    lastWatchedAt 
  } = historyItem;

  // Calculate watch progress percentage
  const watchProgress = duration > 0 
    ? Math.min((watchDurationSeconds / duration) * 100, 100) 
    : 0;

  return (
    <div className="history-video-card">
      <div className="history-thumbnail-container">
        <img 
          src={thumbnail || 'https://via.placeholder.com/320x180'} 
          alt={title}
          className="history-thumbnail"
        />
        {/* Progress Bar */}
        <div className="watch-progress-bar">
          <div 
            className="watch-progress-fill" 
            style={{ width: `${watchProgress}%` }}
          />
        </div>
        {/* Completion Badge */}
        {isCompleted && (
          <div className="completion-badge">
            <CheckCircleIcon className="w-5 h-5" />
            Completed
          </div>
        )}
        {/* Watch Duration Badge */}
        {!isCompleted && watchDurationSeconds > 0 && (
          <div className="duration-badge">
            {formatDuration(watchDurationSeconds)} / {formatDuration(duration)}
          </div>
        )}
      </div>
      
      <div className="history-video-info">
        <h3 className="history-video-title">{title}</h3>
        
        {/* Channel Info */}
        {owner && (
          <div className="history-channel-info">
            <img 
              src={owner.avatar || 'https://via.placeholder.com/32'} 
              alt={owner.username}
              className="channel-avatar"
            />
            <span className="channel-name">{owner.username}</span>
          </div>
        )}
        
        {/* Video Stats */}
        <div className="history-stats">
          <span className="stat-item">
            <ClockIcon className="w-4 h-4" />
            Watched {timeAgo(lastWatchedAt)}
          </span>
          <span className="stat-item">
            <PlayCircleIcon className="w-4 h-4" />
            {Math.round(watchProgress)}% watched
          </span>
        </div>

        {/* Action Button */}
        <button 
          onClick={() => onVideoSelect({ _id, title, thumbnail, duration, owner })}
          className="watch-again-btn"
        >
          <PlayCircleIcon className="w-5 h-5" />
          {isCompleted ? 'Watch Again' : 'Continue Watching'}
        </button>
      </div>
    </div>
  );
};

// Main Watch History Component
const WatchHistory = ({ onVideoSelect }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiService.getWatchHistory();
        console.log('Watch history response:', response);
        
        // Handle different response structures
        const historyData = response.data || response || [];
        setHistory(Array.isArray(historyData) ? historyData : []);
      } catch (err) {
        console.error("Failed to fetch watch history:", err);
        setError("Could not load watch history. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="watch-history-loading">
        <div className="loading-spinner"></div>
        <p>Loading your watch history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="watch-history-error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="watch-history-empty">
        <HistoryIcon className="w-20 h-20 empty-icon" />
        <h3>No Watch History</h3>
        <p>
          Start watching videos from the Home page. 
          Your progress will be saved automatically!
        </p>
      </div>
    );
  }

  return (
    <div className="watch-history-container">
      <div className="watch-history-header">
        <h2>
          <HistoryIcon className="w-8 h-8" />
          Your Watch History
        </h2>
        <p className="history-count">
          {history.length} {history.length === 1 ? 'video' : 'videos'} watched
        </p>
      </div>
      
      <div className="history-video-grid">
        {history.map(item => (
          <HistoryVideoCard 
            key={item._id} 
            historyItem={item} 
            onVideoSelect={onVideoSelect} 
          />
        ))}
      </div>
    </div>
  );
};

export default WatchHistory;