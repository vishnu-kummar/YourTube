import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { PlayCircleIcon, TrashIcon, PencilIcon, PlusIcon, MinusIcon, SearchIcon, EyeIcon } from '../common/Icons';
import { formatDuration } from '../../utils/helpers';
import PlaylistView from './PlaylistView'; 

const Playlists = ({ user }) => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newPlaylist, setNewPlaylist] = useState({ name: '', description: '' });
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [viewingPlaylistId, setViewingPlaylistId] = useState(null); // ADD THIS STATE

  
  useEffect(() => {
    fetchUserPlaylists();
  }, [user, ]);

  const fetchUserPlaylists = async () => {
    try {
      setLoading(true);
      const response = await apiService.getUserPlaylists(user._id);
      setPlaylists(response.data.playlists || []);
    } catch (err) {
      setError('Failed to fetch playlists');
    } finally {
      setLoading(false);
    }
  };

  // If viewing a specific playlist, show the PlaylistView component
  if (viewingPlaylistId) {
    return (
      <PlaylistView 
        playlistId={viewingPlaylistId} 
        onBack={() => setViewingPlaylistId(null)}
      />
    );
  }

  const searchVideos = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const response = await apiService.getAllVideos(1, 20, query);
      setSearchResults(response.data.docs || []);
    } catch (err) {
      setError('Failed to search videos');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    try {
      const response = await apiService.createPlaylist(newPlaylist);
      setPlaylists([response.data, ...playlists]);
      setNewPlaylist({ name: '', description: '' });
      setError('');
    } catch (err) {
      setError('Failed to create playlist: ' + err.message);
    }
  };

  const handleAddVideo = async (playlistId, videoId) => {
    try {
      console.log('Adding video:', videoId, 'to playlist:', playlistId);
      const response = await apiService.addVideoToPlaylist(videoId, playlistId);
      console.log('Response:', response);
      setPlaylists(playlists.map(p => p._id === playlistId ? response.data : p));
      setSelectedVideo(null);
      setSearchQuery('');
      setSearchResults([]);
      setError('');
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to add video to playlist: ' + err.message);
    }
  };

  const handleDeletePlaylist = async (playlistId) => {
    try {
      await apiService.deletePlaylist(playlistId);
      setPlaylists(playlists.filter(p => p._id !== playlistId));
      setError('');
    } catch (err) {
      setError('Failed to delete playlist: ' + err.message);
    }
  };

  const handleUpdatePlaylist = async (playlistId) => {
    try {
      const response = await apiService.updatePlaylist(playlistId, selectedPlaylist);
      setPlaylists(playlists.map(p => p._id === playlistId ? response.data : p));
      setSelectedPlaylist(null);
      setError('');
    } catch (err) {
      setError('Failed to update playlist: ' + err.message);
    }
  };

  if (loading) {
    return <div className="loading-spinner"></div>;
  }

  return (
    <div className="playlists-container">
      <div className="playlists-header">
        <h2>Your Playlists</h2>
        <form onSubmit={handleCreatePlaylist} className="playlist-create-form">
          <input
            type="text"
            value={newPlaylist.name}
            onChange={(e) => setNewPlaylist({ ...newPlaylist, name: e.target.value })}
            placeholder="Playlist Name"
            required
          />
          <textarea
            value={newPlaylist.description}
            onChange={(e) => setNewPlaylist({ ...newPlaylist, description: e.target.value })}
            placeholder="Description"
            required
          />
          <button type="submit" className="playlist-submit-btn">Create Playlist</button>
        </form>
      </div>
      
      {error && <div className="error-message"><span>{error}</span></div>}
      
      {/* SEARCH SECTION */}
      <div className="playlist-search-section">
        <h3>Add Videos to Playlists</h3>
        <div className="search-box">
          <SearchIcon />
          <input
            type="text"
            placeholder="Search for videos to add to playlists..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              searchVideos(e.target.value);
            }}
          />
          {isSearching && <div className="search-loading">Searching...</div>}
        </div>

        {searchResults.length > 0 && (
          <div className="search-results">
            <h4>Search Results</h4>
            {searchResults.map((video) => (
              <div key={video._id} className="search-video-item">
                <img src={video.thumbnail} alt={video.Title} className="search-video-thumb" />
                <div className="search-video-info">
                  <h5>{video.Title}</h5>
                  <p>{video.owner?.username}</p>
                  <span>{formatDuration(video.duration)}</span>
                </div>
                <div className="search-video-actions">
                  <select
                    value=""
                    onChange={(e) => handleAddVideo(e.target.value, video._id)}
                    className="add-to-playlist-select"
                  >
                    <option value="">Add to playlist...</option>
                    {playlists.map(playlist => (
                      <option key={playlist._id} value={playlist._id}>
                        {playlist.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PLAYLISTS GRID */}
      <div className="playlists-grid">
        {playlists.map((playlist) => (
          <div 
            key={playlist._id} 
            className="playlist-card"
            onClick={() => setViewingPlaylistId(playlist._id)}
          >
            <div className="playlist-card-header">
              <div className="playlist-thumbnail">
                {playlist.firstVideoThumbnail ? (
                  <img src={playlist.firstVideoThumbnail} alt={playlist.name} />
                ) : (
                  <div className="playlist-placeholder">
                    <PlayCircleIcon />
                  </div>
                )}
                <div className="video-count-badge">
                  {playlist.videoCount || 0}
                </div>
              </div>
              
              <div className="playlist-info">
                <h3>{playlist.name}</h3>
                <p>{playlist.description}</p>
                <div className="playlist-stats">
                  <span>{formatDuration(playlist.totalDuration || 0)}</span>
                  <span>•</span>
                  <span>{playlist.videoCount || 0} videos</span>
                </div>
              </div>
            </div>

            <div className="playlist-actions">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPlaylist({ 
                    _id: playlist._id, 
                    name: playlist.name, 
                    description: playlist.description 
                  });
                }}
                className="playlist-edit-btn"
                title="Edit playlist"
              >
                <PencilIcon />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePlaylist(playlist._id);
                }}
                className="playlist-delete-btn"
                title="Delete playlist"
              >
                <TrashIcon />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setViewingPlaylistId(playlist._id);
                }}
                className="playlist-view-btn"
                title="View playlist"
              >
                <EyeIcon />
              </button>
            </div>

            {selectedPlaylist?._id === playlist._id && (
              <form onSubmit={(e) => { e.preventDefault(); handleUpdatePlaylist(playlist._id); }} className="playlist-edit-form">
                <input
                  type="text"
                  value={selectedPlaylist.name}
                  onChange={(e) => setSelectedPlaylist({ ...selectedPlaylist, name: e.target.value })}
                  placeholder="New Name"
                  required
                />
                <textarea
                  value={selectedPlaylist.description}
                  onChange={(e) => setSelectedPlaylist({ ...selectedPlaylist, description: e.target.value })}
                  placeholder="New Description"
                  required
                />
                <button type="submit" className="playlist-update-btn">Update</button>
                <button onClick={() => setSelectedPlaylist(null)} className="playlist-cancel-btn">Cancel</button>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Playlists;