import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { formatViews, timeAgo, formatDuration } from '../../utils/helpers';
import { VideoIcon, EyeIcon, HeartIcon, UsersIcon, TrendingUpIcon, ActivityIcon, UserCheckIcon, AwardIcon, UploadIcon, BellIcon, ListIcon } from '../common/Icons';

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [videosLoading, setVideosLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(true);
  const [playlists, setPlaylists] = useState([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  // Add effect to listen for subscription and playlist changes from other components
  useEffect(() => {
    const handleSubscriptionChange = () => {
      console.log('Subscription changed, reloading...');
      loadSubscriptions();
    };

    const handlePlaylistChange = () => {
      console.log('Playlist changed, reloading...');
      loadPlaylists();
    };

    window.addEventListener('subscriptionChanged', handleSubscriptionChange);
    window.addEventListener('playlistChanged', handlePlaylistChange); // New event for playlists
    
    const handleFocus = () => {
      loadSubscriptions();
      loadPlaylists();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('subscriptionChanged', handleSubscriptionChange);
      window.removeEventListener('playlistChanged', handlePlaylistChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user]);

  const loadDashboardData = async () => {
    try {
      const [statsResponse, videosResponse] = await Promise.all([
        apiService.getChannelStats(),
        apiService.getChannelVideos(1, 6)
      ]);
      
      setStats(statsResponse.data);
      setVideos(videosResponse.data.docs || []);
      
      await Promise.all([loadSubscriptions(), loadPlaylists()]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
      setVideosLoading(false);
    }
  };

  const loadSubscriptions = async () => {
    if (!user?._id) return;
    
    try {
      setSubscriptionsLoading(true);
      const response = await apiService.getUserSubscriptions(user._id);
      const subscriptions = response.data?.subscribedChannels || [];
      const formattedSubscriptions = subscriptions.map(sub => ({
        _id: sub.channel._id,
        username: sub.channel.username,
        fullname: sub.channel.fullname,
        avatar: sub.channel.avatar,
        coverImage: sub.channel.coverImage,
        subscribersCount: sub.subscriberCount || 0,
        subscribedAt: sub.createdAt
      }));
      setSubscriptions(formattedSubscriptions);
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
      setSubscriptions([]);
    } finally {
      setSubscriptionsLoading(false);
    }
  };

  const loadPlaylists = async () => {
    if (!user?._id) return;
    
    try {
      setPlaylistsLoading(true);
      const response = await apiService.get(`/playlists/user/${user._id}`);
      setPlaylists(response.data.playlists || []);
    } catch (error) {
      console.error('Failed to load playlists:', error);
      setPlaylists([]);
    } finally {
      setPlaylistsLoading(false);
    }
  };

  const handleUnsubscribe = async (channelId) => {
    try {
      const response = await apiService.toggleSubscription(channelId);
      
      if (response.success && !response.data.subscribed) {
        setSubscriptions(prev => prev.filter(sub => sub._id !== channelId));
        if (stats) {
          setStats(prev => ({
            ...prev,
            totalSubscribedTo: (prev.totalSubscribedTo || 1) - 1
          }));
        }
      }
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      alert('Failed to unsubscribe. Please try again.');
    }
  };

  const navigateToChannel = (username) => {
    console.log(`Navigate to channel: ${username}`);
  };

  const navigateToPlaylists = () => {
    // Implement navigation to the Playlists page
    // For example: navigate('/playlists')
    console.log('Navigate to Playlists page');
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div className="dashboard-header">
          <div className="dashboard-user-info">
            <div className="dashboard-cover-photo">
              <img 
                src={user.coverImage || 'https://via.placeholder.com/400x150'} 
                alt={`${user.username}'s cover`}
                className="dashboard-cover-image"
              />
            </div>
            <img 
              src={user.avatar || 'https://via.placeholder.com/80'} 
              alt={user.username}
              className="dashboard-user-avatar"
            />
            <div className="dashboard-user-details">
              <h1>{user.fullname || user.username}'s Dashboard</h1>
              <p>@{user.username} • Joined {timeAgo(user.createdAt)}</p>
            </div>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon">
                <VideoIcon />
              </div>
              <div className="stat-values">
                <p className="stat-number">{stats?.totalVideos || 0}</p>
                <p className="stat-label">Total Videos</p>
              </div>
            </div>
            <div className="stat-trend">
              <TrendingUpIcon />
              <span>+{stats?.recentVideos || 0} this month</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon">
                <EyeIcon />
              </div>
              <div className="stat-values">
                <p className="stat-number">{formatViews(stats?.totalViews || 0)}</p>
                <p className="stat-label">Total Views</p>
              </div>
            </div>
            <div className="stat-trend">
              <ActivityIcon />
              <span>{formatViews(stats?.averageViews || 0)} avg per video</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon">
                <HeartIcon />
              </div>
              <div className="stat-values">
                <p className="stat-number">{formatViews(stats?.totalLikes || 0)}</p>
                <p className="stat-label">Total Likes</p>
              </div>
            </div>
            <div className="stat-trend">
              <TrendingUpIcon />
              <span>+{formatViews(stats?.recentLikes || 0)} this month</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon">
                <UsersIcon />
              </div>
              <div className="stat-values">
                <p className="stat-number">{formatViews(stats?.totalSubscribers || 0)}</p>
                <p className="stat-label">Subscribers</p>
              </div>
            </div>
            <div className="stat-trend">
              <UserCheckIcon />
              <span>Following {subscriptions.length}</span>
            </div>
          </div>
        </div>

        <div className="dashboard-details">
          {stats?.topVideo && (
            <div className="top-video-card">
              <div className="card-header">
                <div className="header-icon">
                  <AwardIcon />
                </div>
                <h3>Top Performing Video</h3>
              </div>
              
              <div className="top-video-content">
                <img 
                  src={stats.topVideo.thumbnail || 'https://via.placeholder.com/120x68'}
                  alt={stats.topVideo.Title}
                  className="top-video-thumbnail"
                />
                <div className="top-video-info">
                  <h4>{stats.topVideo.Title}</h4>
                  <div className="top-video-stats">
                    <span>
                      <EyeIcon />
                      <span>{formatViews(stats.topVideo.views)} views</span>
                    </span>
                    <span>{timeAgo(stats.topVideo.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="quick-stats-card">
            <div className="card-header">
              <div className="header-icon">
                <ActivityIcon />
              </div>
              <h3>Last 30 Days</h3>
            </div>
            
            <div className="quick-stats">
              <div className="quick-stat">
                <span>New Videos</span>
                <span className="stat-value">{stats?.recentVideos || 0}</span>
              </div>
              <div className="quick-stat">
                <span>Views Gained</span>
                <span className="stat-value">{formatViews(stats?.recentViews || 0)}</span>
              </div>
              <div className="quick-stat">
                <span>Likes Received</span>
                <span className="stat-value">{formatViews(stats?.recentLikes || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="subscriptions-section">
          <div className="card-header">
            <div className="header-icon">
              <BellIcon />
            </div>
            <h3>Your Subscriptions ({subscriptions.length})</h3>
            {subscriptions.length > 6 && (
              <button className="view-all-btn">
                View All ({subscriptions.length})
              </button>
            )}
          </div>
          
          {subscriptionsLoading ? (
            <div className="subscriptions-loading">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="subscription-skeleton">
                  <div className="avatar-skeleton"></div>
                  <div className="info-skeleton">
                    <div className="name-skeleton"></div>
                    <div className="details-skeleton"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : subscriptions.length > 0 ? (
            <div className="subscriptions-list">
              {subscriptions.slice(0, 6).map((channel) => (
                <div key={channel._id} className="subscription-item">
                  <img 
                    src={channel.avatar || 'https://via.placeholder.com/50'} 
                    alt={channel.username}
                    className="subscription-avatar"
                  />
                  <div className="subscription-info">
                    <h4>{channel.fullname || channel.username}</h4>
                    <p className="subscription-username">@{channel.username}</p>
                    <div className="subscription-stats">
                      <span>{formatViews(channel.subscribersCount || 0)} subscribers</span>
                    </div>
                    <p className="subscribed-date">Subscribed {timeAgo(channel.subscribedAt)}</p>
                  </div>
                  <div className="subscription-actions">
                    <button 
                      className="view-channel-btn"
                      onClick={() => navigateToChannel(channel.username)}
                    >
                      View Channel
                    </button>
                    <button 
                      className="unsubscribe-btn"
                      onClick={() => handleUnsubscribe(channel._id)}
                      title="Unsubscribe"
                    >
                      Unsubscribe
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-subscriptions">
              <div className="no-subscriptions-icon">
                <BellIcon />
              </div>
              <h4>No subscriptions yet</h4>
              <p>When you subscribe to channels, they'll appear here</p>
              <button className="browse-channels-btn">
                Browse Channels
              </button>
            </div>
          )}
        </div>

        <div className="playlists-section">
          <div className="card-header">
            <div className="header-icon">
              <ListIcon />
            </div>
            <h3>Your Playlists ({playlists.length})</h3>
            {playlists.length > 3 && (
              <button className="view-all-btn" onClick={navigateToPlaylists}>
                View All ({playlists.length})
              </button>
            )}
          </div>
          
          {playlistsLoading ? (
            <div className="playlists-loading">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="playlist-skeleton">
                  <div className="name-skeleton"></div>
                  <div className="details-skeleton"></div>
                </div>
              ))}
            </div>
          ) : playlists.length > 0 ? (
            <div className="playlists-list">
              {playlists.slice(0, 3).map((playlist) => (
                <div key={playlist._id} className="playlist-item">
                  <h4>{playlist.name}</h4>
                  <p>{playlist.description || 'No description'}</p>
                  <p>Videos: {playlist.videoCount || 0}</p>
                  <button
                    className="view-playlist-btn"
                    onClick={() => navigateToPlaylists()}
                  >
                    Manage
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-playlists">
              <div className="no-playlists-icon">
                <ListIcon />
              </div>
              <h4>No playlists yet</h4>
              <p>Create a playlist to organize your videos</p>
              <button className="create-playlist-btn" onClick={navigateToPlaylists}>
                Create Playlist
              </button>
            </div>
          )}
        </div>

        <div className="recent-videos-card">
          <div className="card-header">
            <h3>Your Recent Videos</h3>
            <button className="view-all-btn">
              View All
            </button>
          </div>

          {videosLoading ? (
            <div className="videos-loading">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="video-skeleton">
                  <div className="thumbnail-skeleton"></div>
                  <div className="title-skeleton"></div>
                  <div className="stats-skeleton"></div>
                </div>
              ))}
            </div>
          ) : videos.length > 0 ? (
            <div className="recent-videos-grid">
              {videos.map((video) => (
                <div key={video._id} className="recent-video-item">
                  <div className="recent-video-thumbnail">
                    <img 
                      src={video.thumbnail || 'https://via.placeholder.com/320x180'}
                      alt={video.Title}
                    />
                    <div className="recent-video-duration">
                      {formatDuration(video.duration || 0)}
                    </div>
                  </div>
                  <div className="recent-video-details">
                    <h4>{video.Title}</h4>
                    <div className="recent-video-stats">
                      <div className="recent-video-stat">
                        <EyeIcon />
                        <span>{formatViews(video.views || 0)}</span>
                      </div>
                      <div className="recent-video-stat">
                        <HeartIcon />
                        <span>{video.likesCount || 0}</span>
                      </div>
                      <div className="recent-video-date">
                        {timeAgo(video.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-videos">
              <VideoIcon />
              <p>No videos uploaded yet</p>
              <button className="upload-cta-btn">
                <UploadIcon />
                <span>Upload Your First Video</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;