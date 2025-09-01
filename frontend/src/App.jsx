
import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import Navbar from './components/common/Navbar';
import AuthForm from './components/auth/AuthForm';
import VideoList from './components/video/VideoList';
import VideoPlayer from './components/video/VideoPlayer';
import VideoUpload from './components/video/VideoUpload';
import Dashboard from './components/dashboard/Dashboard';
import CommentSection from './components/video/CommentSection';
import Playlists from './components/video/Playlists'; // Added Playlists component
import { PlayCircleIcon, UploadIcon } from './components/common/Icons';
import './App.css';

const App = () => {
  const { user, loading, login, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [showCommentSection, setShowCommentSection] = useState(false);
  const [commentVideo, setCommentVideo] = useState(null);
  const [commentUpdateCallback, setCommentUpdateCallback] = useState(null);

  const handleComment = (video, updateCallback) => {
    setCommentVideo(video);
    setCommentUpdateCallback(() => updateCallback); // Store the callback
    setShowCommentSection(true);
  };

  const handleCommentsUpdate = (newCommentsCount) => {
    // Update the comment count in the video card
    if (commentUpdateCallback) {
      commentUpdateCallback(newCommentsCount);
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

  return (
    <div className="app">
      <Navbar 
        user={user} 
        onLogout={logout} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
      />
      
      <main className="app-main">
        {activeTab === 'home' && (
          <VideoList 
            onLike={(videoId) => console.log('Like video:', videoId)}
            onPlay={(video) => {
              setSelectedVideo(video);
              setShowVideoPlayer(true);
            }}
            onComment={handleComment}
            user={user}
          />
        )}
        
        {activeTab === 'upload' && user && <VideoUpload />}
       
        {activeTab === 'playlists' && user && <Playlists user={user} />} 

         {activeTab === 'dashboard' && user && <Dashboard user={user} />}
        
        {(activeTab === 'upload' || activeTab === 'dashboard' || activeTab === 'playlists') && !user && (
          <div className="auth-required">
            <div className="auth-required-content">
              <div className="auth-required-icon">
                <UploadIcon />
              </div>
              <h3>Ready to Share?</h3>
              <p>
                Join our community to upload, manage playlists, and share your amazing videos with the world
              </p>
              <button
                onClick={() => setActiveTab('auth')}
                className="auth-required-btn"
              >
                🚀 Get Started
              </button>
            </div>
          </div>
        )}
      </main>
      
      {showVideoPlayer && (
        <VideoPlayer 
          video={selectedVideo} 
          onClose={() => setShowVideoPlayer(false)} 
        />
      )}
      
      {showCommentSection && (
        <div className="comment-section-overlay">
          <div className="comment-section-modal">
            <div className="comment-section-header">
              <h3>Comments for {commentVideo?.Title}</h3>
              <button 
                onClick={() => {
                  setShowCommentSection(false);
                  setCommentUpdateCallback(null);
                }} 
                className="close-comments-btn"
              >
                ✕
              </button>
            </div>
            <CommentSection 
              videoId={commentVideo?._id} 
              user={user}
              onCommentsUpdate={handleCommentsUpdate}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;