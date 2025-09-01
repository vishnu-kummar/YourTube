// src/components/common/LoadingSpinner.jsx
import React from 'react';

const LoadingSpinner = ({ message = "Loading...", size = "medium" }) => {
  return (
    <div className="loading-container">
      <div className={`loading-spinner ${size}`}></div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
};

// App Loading Component (for the main app loading)
export const AppLoadingSpinner = () => {
  return (
    <div className="app-loading">
      <div className="app-loading-icon">
        <span>▶️</span> {/* PlayCircleIcon equivalent */}
      </div>
      <div className="app-loading-spinner"></div>
      <p>Loading VideoTube...</p>
    </div>
  );
};

// Dashboard Loading Component
export const DashboardLoadingSpinner = () => {
  return (
    <div className="dashboard-loading">
      <div className="loading-spinner"></div>
      <p>Loading your dashboard...</p>
    </div>
  );
};

// Video List Loading Component
export const VideoListLoadingSpinner = () => {
  return (
    <div className="video-list-loading">
      <div className="loading-spinner"></div>
      <p>Loading amazing videos...</p>
    </div>
  );
};

// Video Skeleton Loading (for video grid)
export const VideoSkeletonLoader = ({ count = 6 }) => {
  return (
    <div className="videos-loading">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="video-skeleton">
          <div className="thumbnail-skeleton"></div>
          <div className="title-skeleton"></div>
          <div className="stats-skeleton"></div>
        </div>
      ))}
    </div>
  );
};

export default LoadingSpinner;