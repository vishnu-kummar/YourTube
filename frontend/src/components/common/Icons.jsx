import React from 'react';

const HomeIcon = () => <span>🏠</span>;
const UploadIcon = () => <span>📤</span>;
const BarChartIcon = () => <span>📊</span>;
const LogOutIcon = () => <span>🚪</span>;
const UserIcon = () => <span>👤</span>;
const PlayCircleIcon = () => <span>▶️</span>;
const PlayIcon = () => <span>▶️</span>;
const EyeIcon = () => <span>👁️</span>;
const ClockIcon = () => <span>⏰</span>;
const BellIcon = () => <span>⏰</span>;
const HeartIcon = () => <span>❤️</span>;
const MessageCircleIcon = () => <span>💬</span>;
const StarIcon = () => <span>⭐</span>;
const VideoIcon = () => <span>📹</span>;
const ListIcon = () => <span>📹</span>;
const TrendingUpIcon = () => <span>📈</span>;
const ActivityIcon = () => <span>🔔</span>;
const UsersIcon = () => <span>👥</span>;
const UserCheckIcon = () => <span>✅</span>;
const AwardIcon = () => <span>🏆</span>;
const SearchIcon = () => <span>🔍</span>;

// New SVG-based icons for Playlists
const PencilIcon = ({ className = "", size = 16 }) => (
  <svg 
    className={className}
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
  </svg>
);

 const TrashIcon = ({ className = "", size = 16 }) => (
  <svg 
    className={className}
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M3 6h18M8 6V4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2m-6 0v12m-4-12h8M5 10l1.5 10c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2L15 10"/>
  </svg>
);

const PlusIcon = ({ className = "", size = 16 }) => (
  <svg 
    className={className}
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M12 5v14M5 12h14"/>
  </svg>
);

const MinusIcon = ({ className = "", size = 16 }) => (
  <svg 
    className={className}
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M5 12h14"/>
  </svg>
);

// Existing SVG-based icon
 const UserPlusIcon = ({ className = "", size = 16 }) => (
  <svg 
    className={className}
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="8.5" cy="7" r="4"></circle>
    <line x1="20" y1="8" x2="20" y2="14"></line>
    <line x1="23" y1="11" x2="17" y2="11"></line>
  </svg>
);

// Export all icons
export {
  HomeIcon,
  UploadIcon,
  BarChartIcon,
  LogOutIcon,
  UserIcon,
  PlayCircleIcon,
  PlayIcon,
  EyeIcon,
  ClockIcon,
  BellIcon,
  HeartIcon,
  MessageCircleIcon,
  StarIcon,
  VideoIcon,
  TrendingUpIcon,
  ActivityIcon,
  UsersIcon,
  UserCheckIcon,
  AwardIcon,
  SearchIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  MinusIcon,
  UserPlusIcon,
  ListIcon
};