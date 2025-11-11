import React, { useState } from 'react';
import WatchHistory from '../components/history/WatchHistory';
import VideoPlayer from '../components/video/VideoPlayer';
import { apiService } from '../services/apiService';

const HistoryPage = ({ user }) => {
  const [selectedVideo, setSelectedVideo] = useState(null);

  // when user clicks a history video
  const handleVideoSelect = async (videoId) => {
    try {
      const response = await apiService.getVideoById(videoId);
      setSelectedVideo(response.data);
    } catch (error) {
      console.error('Failed to load video details:', error);
      alert('Could not load this video. Please try again later.');
    }
  };

  return (
    <div className="history-page">
      <WatchHistory onVideoSelect={handleVideoSelect} />

      {selectedVideo && (
        <VideoPlayer 
          video={selectedVideo} 
          onClose={() => setSelectedVideo(null)} 
          user={user} 
        />
      )}
    </div>
  );
};

export default HistoryPage;
