// src/App.jsx
import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import Navbar from './components/common/Navbar';
import AuthForm from './components/auth/AuthForm';
import VideoList from './components/video/VideoList';
import VideoWatchPage from './components/video/VideoWatchPage';
import VideoUpload from './components/video/VideoUpload';
import Dashboard from './components/dashboard/Dashboard';
import Playlists from './components/video/Playlists';
import WatchHistory from './components/video/WatchHistory';
import { PlayCircleIcon, UploadIcon } from './components/common/Icons';
import './App.css';

const App = () => {
  const { user, loading, login, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isWatchingVideo, setIsWatchingVideo] = useState(false);

  // Handle video selection - opens YouTube-style watch page
  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
    setIsWatchingVideo(true);
    window.scrollTo(0, 0);
  };

  // Handle closing watch page - returns to previous view
  const handleCloseWatchPage = () => {
    setIsWatchingVideo(false);
    setSelectedVideo(null);
  };

  // Handle selecting another video from suggestions
  const handleVideoChange = (newVideo) => {
    setSelectedVideo(newVideo);
    window.scrollTo(0, 0);
  };

  // Handle tab change - also closes watch page
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (isWatchingVideo) {
      handleCloseWatchPage();
    }
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading-icon">
          <PlayCircleIcon />
        </div>
        <div className="app-loading-spinner"></div>
        <p>Loading VideoTube...</p>
      </div>
    );
  }

  if (!user && activeTab === 'auth') {
    return <AuthForm onLogin={login} />;
  }

  // If watching a video, show the YouTube-style watch page
  if (isWatchingVideo && selectedVideo) {
    return (
      <div className="app">
        <Navbar 
          user={user} 
          onLogout={logout} 
          activeTab={activeTab} 
          setActiveTab={handleTabChange}
        />
        <VideoWatchPage 
          video={selectedVideo}
          user={user}
          onClose={handleCloseWatchPage}
          onVideoSelect={handleVideoChange}
        />
      </div>
    );
  }

  return (
    <div className="app">
      <Navbar 
        user={user} 
        onLogout={logout} 
        activeTab={activeTab} 
        setActiveTab={handleTabChange}
      />
      
      <main className="app-main">
        {activeTab === 'home' && (
          <VideoList 
            onLike={(videoId) => console.log('Like video:', videoId)}
            onPlay={handleVideoSelect}
            onComment={() => {}}
            user={user}
          />
        )}
        
        {activeTab === 'history' && user && (
          <WatchHistory onVideoSelect={handleVideoSelect} />
        )}
        
        {activeTab === 'upload' && user && <VideoUpload />}
       
        {activeTab === 'playlists' && user && <Playlists user={user} />} 

        {activeTab === 'dashboard' && user && <Dashboard user={user} />}
        
        {['upload', 'dashboard', 'playlists', 'history'].includes(activeTab) && !user && (
          <div className="auth-required">
            <div className="auth-required-content">
              <div className="auth-required-icon">
                <UploadIcon />
              </div>
              <h3>Authentication Required</h3>
              <p>
                Please login to access {activeTab === 'history' ? 'your watch history' : 'this feature'}
              </p>
              <button
                onClick={() => setActiveTab('auth')}
                className="auth-required-btn"
              >
                🚀 Login Now
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;