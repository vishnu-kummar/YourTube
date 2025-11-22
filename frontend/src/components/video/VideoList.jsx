// src/components/video/VideoList.jsx - Updated with Recommendations
import React, { useState, useEffect } from 'react';
import VideoCard from './VideoCard';
import OnboardingModal from '../common/OnboardingModal';
import { apiService } from '../../services/apiService';
import { SearchIcon, VideoIcon } from '../common/Icons';

const VideoList = ({ onLike, onPlay, user, onComment }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedInfo, setFeedInfo] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    loadVideos();
  }, [searchQuery, user]);

  const loadVideos = async () => {
    try {
      setLoading(true);
      
      let response;
      
      if (searchQuery) {
        // If searching, use regular video search
        response = await apiService.getAllVideos(1, 20, searchQuery);
        setFeedInfo({ feedType: 'search', isPersonalized: false });
      } else {
        // Use recommendation feed
        response = await apiService.getRecommendedVideos(1, 20);
        setFeedInfo({
          feedType: response.data.feedType,
          isPersonalized: response.data.isPersonalized,
          userTopTags: response.data.userTopTags,
          needsOnboarding: response.data.needsOnboarding
        });
        
        // Show onboarding for new logged-in users
        if (user && response.data.needsOnboarding) {
          setShowOnboarding(true);
        }
      }
      
      setVideos(response.data.docs || []);
    } catch (error) {
      console.error('Failed to load videos:', error);
      // Fallback to regular video list
      try {
        const fallback = await apiService.getAllVideos(1, 20, searchQuery);
        setVideos(fallback.data.docs || []);
      } catch (e) {
        console.error('Fallback also failed:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (videoId) => {
    if (!user) {
      alert('Please login to like videos');
      return;
    }

    try {
      await apiService.toggleVideoLike(videoId);
      setVideos(prevVideos => 
        prevVideos.map(video => {
          if (video._id === videoId) {
            const currentLikes = video.likesCount || 0;
            const isCurrentlyLiked = video.isLikedByUser || false;
            return {
              ...video,
              likesCount: isCurrentlyLiked ? currentLikes - 1 : currentLikes + 1,
              isLikedByUser: !isCurrentlyLiked
            };
          }
          return video;
        })
      );
    } catch (error) {
      console.error('Failed to like video:', error);
    }
  };

  const updateVideoData = (videoId, updates) => {
    setVideos(prevVideos =>
      prevVideos.map(video =>
        video._id === videoId ? { ...video, ...updates } : video
      )
    );
  };

  const handleOnboardingComplete = (selectedTags) => {
    setShowOnboarding(false);
    // Reload videos with personalized feed
    loadVideos();
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
  };

  // Get feed title based on type
  const getFeedTitle = () => {
    if (searchQuery) return `Results for "${searchQuery}"`;
    if (!feedInfo) return 'Trending Videos';
    
    switch (feedInfo.feedType) {
      case 'content_based':
        return '🎯 Recommended For You';
      case 'preference_based':
        return '✨ Based on Your Interests';
      case 'trending_popular':
        return '🔥 Trending & Popular';
      case 'popular':
        return '📈 Popular Videos';
      default:
        return 'Trending Videos';
    }
  };

  if (loading) {
    return (
      <div className="video-list-loading">
        <div className="loading-spinner"></div>
        <p>Loading amazing videos...</p>
      </div>
    );
  }

  return (
    <div className="video-list-container">
      {/* Onboarding Modal for New Users */}
      {showOnboarding && (
        <OnboardingModal 
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}

      <div className="video-list-header">
        <div className="search-container">
          <h1>Discover Amazing Videos</h1>
          <div className="search-box">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search for videos, channels, or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="video-list-content">
        {videos.length === 0 ? (
          <div className="no-videos-found">
            <div className="no-videos-icon">
              <VideoIcon />
            </div>
            <h3>No videos found</h3>
            <p>Try adjusting your search terms or explore different topics</p>
          </div>
        ) : (
          <>
            <div className="video-list-header-info">
              <div className="feed-title-section">
                <h2>{getFeedTitle()}</h2>
                {feedInfo?.isPersonalized && feedInfo?.userTopTags && (
                  <div className="user-interests">
                    <span>Based on: </span>
                    {feedInfo.userTopTags.slice(0, 3).map(item => (
                      <span key={item.tag} className="interest-tag">
                        #{item.tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="video-count">
                <span>{videos.length} videos</span>
                {feedInfo?.isPersonalized && (
                  <span className="personalized-badge">✨ Personalized</span>
                )}
              </div>
            </div>

            <div className="video-grid">
              {videos.map((video) => (
                <VideoCard
                  key={video._id}
                  video={video}
                  onLike={handleLike}
                  onPlay={onPlay}
                  onComment={onComment}
                  onVideoUpdate={updateVideoData}
                  user={user}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VideoList;



//_______________________________________________________________________________________________________
// // src/components/video/VideoList.jsx
// import React, { useState, useEffect } from 'react';
// import VideoCard from './VideoCard';
// import { apiService } from '../../services/apiService';
// import { SearchIcon, VideoIcon } from '../common/Icons';

// const VideoList = ({ onLike, onPlay, user, onComment }) => {
//   const [videos, setVideos] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [searchQuery, setSearchQuery] = useState('');

//   useEffect(() => {
//     loadVideos();
//   }, [searchQuery]);

//   const loadVideos = async () => {
//     try {
//       setLoading(true);
//       const response = await apiService.getAllVideos(1, 50, searchQuery);
//       setVideos(response.data.docs || []);
//     } catch (error) {
//       console.error('Failed to load videos:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleLike = async (videoId) => {
//     if (!user) {
//       alert('Please login to like videos');
//       return;
//     }

//     try {
//       await apiService.toggleVideoLike(videoId);
      
//       // Update the video in the local state
//       setVideos(prevVideos => 
//         prevVideos.map(video => {
//           if (video._id === videoId) {
//             const currentLikes = video.likesCount || 0;
//             const isCurrentlyLiked = video.isLikedByUser || false;
            
//             return {
//               ...video,
//               likesCount: isCurrentlyLiked ? currentLikes - 1 : currentLikes + 1,
//               isLikedByUser: !isCurrentlyLiked
//             };
//           }
//           return video;
//         })
//       );
      
//     } catch (error) {
//       console.error('Failed to like video:', error);
//       alert('Failed to like video. Please try again.');
//     }
//   };

//   // Function to update video data from child components
//   const updateVideoData = (videoId, updates) => {
//     setVideos(prevVideos =>
//       prevVideos.map(video =>
//         video._id === videoId ? { ...video, ...updates } : video
//       )
//     );
//   };

//   if (loading) {
//     return (
//       <div className="video-list-loading">
//         <div className="loading-spinner"></div>
//         <p>Loading amazing videos...</p>
//       </div>
//     );
//   }

//   return (
//     <div className="video-list-container">
//       <div className="video-list-header">
//         <div className="search-container">
//           <h1>Discover Amazing Videos</h1>
//           <div className="search-box">
//             <SearchIcon />
//             <input
//               type="text"
//               placeholder="Search for videos, channels, or topics..."
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//             />
//           </div>
//         </div>
//       </div>

//       <div className="video-list-content">
//         {videos.length === 0 ? (
//           <div className="no-videos-found">
//             <div className="no-videos-icon">
//               <VideoIcon />
//             </div>
//             <h3>No videos found</h3>
//             <p>Try adjusting your search terms or explore different topics</p>
//           </div>
//         ) : (
//           <>
//             <div className="video-list-header-info">
//               <h2>{searchQuery ? `Results for "${searchQuery}"` : 'Trending Videos'}</h2>
//               <div className="video-count">
//                 <span>{videos.length} videos</span>
//                 <div className="online-indicator"></div>
//               </div>
//             </div>

//             <div className="video-grid">
//               {videos.map((video) => (
//                 <VideoCard
//                   key={video._id}
//                   video={video}
//                   onLike={handleLike}
//                   onPlay={onPlay}
//                   onComment={onComment}
//                   onVideoUpdate={updateVideoData}
//                   user={user}
//                 />
//               ))}
//             </div>
//           </>
//         )}
//       </div>
//     </div>
//   );
// };

// export default VideoList;