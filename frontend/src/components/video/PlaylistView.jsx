import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { PlayCircleIcon, ClockIcon, EyeIcon, TrashIcon } from '../common/Icons';
import { formatDuration, formatViews, timeAgo } from '../../utils/helpers';

const PlaylistView = ({ playlistId, onBack }) => {
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPlaylist();
  }, [playlistId]);

  const fetchPlaylist = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPlaylistById(playlistId);
      setPlaylist(response.data);
    } catch (err) {
      setError('Failed to fetch playlist: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveVideo = async (videoId) => {
    try {
      const response = await apiService.removeVideoFromPlaylist(videoId, playlistId);
      setPlaylist(response.data);
    } catch (err) {
      setError('Failed to remove video: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading playlist...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <span>{error}</span>
        <button onClick={onBack} className="back-btn">Go Back</button>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="error-message">
        <span>Playlist not found</span>
        <button onClick={onBack} className="back-btn">Go Back</button>
      </div>
    );
  }

  return (
    <div className="playlist-view">
      <div className="playlist-header">
        <button onClick={onBack} className="back-btn">
          ← Back to Playlists
        </button>
        <h1>{playlist.name}</h1>
        <p>{playlist.description}</p>
        <div className="playlist-stats">
          <span>{playlist.videoCount || 0} videos</span>
          <span>•</span>
          <span>{formatDuration(playlist.totalDuration || 0)} total</span>
        </div>
      </div>

      {playlist.videos && playlist.videos.length > 0 ? (
        <div className="playlist-videos-grid">
          {playlist.videos.map((video) => (
            <div key={video._id} className="playlist-video-card">
              <div className="video-thumbnail">
                <img src={video.thumbnail} alt={video.Title} />
                <div className="video-duration">{formatDuration(video.duration)}</div>
                <button className="play-btn">
                  <PlayCircleIcon />
                </button>
              </div>
              
              <div className="video-info">
                <h4>{video.Title}</h4>
                <p className="channel-name">{video.owner?.username}</p>
                
                <div className="video-stats">
                  <span><EyeIcon /> {formatViews(video.views || 0)}</span>
                  <span><ClockIcon /> {timeAgo(video.createdAt)}</span>
                </div>
                
                <div className="video-actions">
                  <button
                    onClick={() => handleRemoveVideo(video._id)}
                    className="remove-btn"
                    title="Remove from playlist"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-playlist">
          <div className="empty-icon">🎬</div>
          <h3>This playlist is empty</h3>
          <p>Add some videos to get started!</p>
        </div>
      )}
    </div>
  );
};

export default PlaylistView;