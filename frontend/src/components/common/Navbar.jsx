import React from 'react';
import { HomeIcon, UploadIcon, BarChartIcon, LogOutIcon, UserIcon, PlayCircleIcon, ListIcon } from './Icons';

// Add History Icon
const HistoryIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const Navbar = ({ user, onLogout, activeTab, setActiveTab }) => (
  <nav className="navbar">
    <div className="nav-container">
      <div className="nav-left">
        <div className="logo">
          <div className="logo-icon">
            <PlayCircleIcon />
          </div>
          <h1>YourTube</h1>
        </div>
        
        <div className="nav-links">
          <button 
            onClick={() => setActiveTab('home')}
            className={activeTab === 'home' ? 'nav-btn active' : 'nav-btn'}
          >
            <HomeIcon />
            <span>Home</span>
          </button>
          
          {user && (
            <>
              <button 
                onClick={() => setActiveTab('history')}
                className={activeTab === 'history' ? 'nav-btn active' : 'nav-btn'}
              >
                <HistoryIcon />
                <span>History</span>
              </button>

              <button 
                onClick={() => setActiveTab('playlists')}
                className={activeTab === 'playlists' ? 'nav-btn active' : 'nav-btn'}
              >
                <ListIcon />
                <span>Playlists</span>
              </button>

              <button 
                onClick={() => setActiveTab('upload')}
                className={activeTab === 'upload' ? 'nav-btn active' : 'nav-btn'}
              >
                <UploadIcon />
                <span>Upload</span>
              </button>

              <button 
                onClick={() => setActiveTab('dashboard')}
                className={activeTab === 'dashboard' ? 'nav-btn active' : 'nav-btn'}
              >
                <BarChartIcon />
                <span>Dashboard</span>
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="nav-right">
        {user ? (
          <div className="user-info">
            <div className="user-details">
              <img 
                src={user.avatar || 'https://via.placeholder.com/32'} 
                alt={user.username}
                className="user-avatar"
              />
              <div className="user-text">
                <p className="username">{user.username}</p>
                <p className="user-fullname">{user.fullname}</p>
              </div>
            </div>
            <button 
              onClick={onLogout}
              className="logout-btn"
            >
              <LogOutIcon />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setActiveTab('auth')}
            className="login-btn"
          >
            <UserIcon />
            <span>Login</span>
          </button>
        )}
      </div>
    </div>
  </nav>
);

export default Navbar;