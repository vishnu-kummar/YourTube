// src/components/video/VideoList.jsx - Fixed search with debouncing
import React, { useState, useEffect, useRef } from 'react';
import VideoCard from './VideoCard';
import { apiService } from '../../services/apiService';
import { SearchIcon, VideoIcon } from '../common/Icons';

const VideoList = ({ onLike, onPlay, user, onComment }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [feedInfo, setFeedInfo] = useState(null);
  
  // Debounce timer ref
  const debounceTimer = useRef(null);

  // Debounce search query - only update after user stops typing for 500ms
  useEffect(() => {
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer
    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500); // Wait 500ms after user stops typing

    // Cleanup on unmount
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery]);

  // Load videos when debounced query or user changes
  useEffect(() => {
    loadVideos();
  }, [debouncedQuery, user]);

  const loadVideos = async () => {
    try {
      setLoading(true);
      
      let response;
      
      if (debouncedQuery) {
        // If searching, use regular search
        response = await apiService.getAllVideos(1, 20, debouncedQuery);
        setFeedInfo({ feedType: 'search', isPersonalized: false });
        setVideos(response.data.docs || []);
      } else {
        // Use recommendation endpoint
        try {
          response = await apiService.getRecommendedVideos(1, 20);
          console.log("Recommendation response:", response);
          
          setFeedInfo({
            feedType: response.data?.feedType || 'unknown',
            isPersonalized: response.data?.isPersonalized || false,
            userTopTags: response.data?.userTopTags || [],
            needsOnboarding: response.data?.needsOnboarding || false
          });
          setVideos(response.data?.docs || []);
        } catch (recError) {
          console.error("Recommendation failed, falling back:", recError);
          // Fallback to regular videos
          response = await apiService.getAllVideos(1, 20);
          setFeedInfo({ feedType: 'popular', isPersonalized: false });
          setVideos(response.data.docs || []);
        }
      }
    } catch (error) {
      console.error('Failed to load videos:', error);
      setVideos([]);
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
            return {
              ...video,
              likesCount: video.isLikedByUser ? (video.likesCount || 1) - 1 : (video.likesCount || 0) + 1,
              isLikedByUser: !video.isLikedByUser
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

  // Get feed title based on type
  const getFeedTitle = () => {
    if (debouncedQuery) return `Results for "${debouncedQuery}"`;
    if (!feedInfo) return 'Trending Videos';
    
    switch (feedInfo.feedType) {
      case 'content_based':
        return '🎯 Recommended For You';
      case 'popular_new_user':
        return '🔥 Popular Videos';
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
            {searchQuery && searchQuery !== debouncedQuery && (
              <span className="search-loading-indicator">
                <div className="mini-spinner"></div>
              </span>
            )}
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
                {feedInfo?.isPersonalized && feedInfo?.userTopTags?.length > 0 && (
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



// // src/components/video/VideoList.jsx
// import React, { useState, useEffect } from 'react';
// import VideoCard from './VideoCard';
// import { apiService } from '../../services/apiService';
// import { SearchIcon, VideoIcon } from '../common/Icons';

// const VideoList = ({ onLike, onPlay, user, onComment }) => {
//   const [videos, setVideos] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [feedInfo, setFeedInfo] = useState(null);

//   useEffect(() => {
//     loadVideos();
//   }, [searchQuery, user]);

//   const loadVideos = async () => {
//     try {
//       setLoading(true);
      
//       let response;
      
//       if (searchQuery) {
//         // If searching, use regular search
//         response = await apiService.getAllVideos(1, 20, searchQuery);
//         setFeedInfo({ feedType: 'search', isPersonalized: false });
//         setVideos(response.data.docs || []);
//       } else {
//         // Use recommendation endpoint
//         try {
//           response = await apiService.getRecommendedVideos(1, 20);
//           console.log("Recommendation response:", response);
          
//           setFeedInfo({
//             feedType: response.data?.feedType || 'unknown',
//             isPersonalized: response.data?.isPersonalized || false,
//             userTopTags: response.data?.userTopTags || [],
//             needsOnboarding: response.data?.needsOnboarding || false
//           });
//           setVideos(response.data?.docs || []);
//         } catch (recError) {
//           console.error("Recommendation failed, falling back:", recError);
//           // Fallback to regular videos
//           response = await apiService.getAllVideos(1, 20);
//           setFeedInfo({ feedType: 'popular', isPersonalized: false });
//           setVideos(response.data.docs || []);
//         }
//       }
//     } catch (error) {
//       console.error('Failed to load videos:', error);
//       setVideos([]);
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
//       setVideos(prevVideos => 
//         prevVideos.map(video => {
//           if (video._id === videoId) {
//             return {
//               ...video,
//               likesCount: video.isLikedByUser ? (video.likesCount || 1) - 1 : (video.likesCount || 0) + 1,
//               isLikedByUser: !video.isLikedByUser
//             };
//           }
//           return video;
//         })
//       );
//     } catch (error) {
//       console.error('Failed to like video:', error);
//     }
//   };

//   const updateVideoData = (videoId, updates) => {
//     setVideos(prevVideos =>
//       prevVideos.map(video =>
//         video._id === videoId ? { ...video, ...updates } : video
//       )
//     );
//   };

//   // Get feed title based on type
//   const getFeedTitle = () => {
//     if (searchQuery) return `Results for "${searchQuery}"`;
//     if (!feedInfo) return 'Trending Videos';
    
//     switch (feedInfo.feedType) {
//       case 'content_based':
//         return '🎯 Recommended For You';
//       case 'popular_new_user':
//         return '🔥 Popular Videos';
//       case 'popular':
//         return '📈 Popular Videos';
//       default:
//         return 'Trending Videos';
//     }
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
//               <div className="feed-title-section">
//                 <h2>{getFeedTitle()}</h2>
//                 {feedInfo?.isPersonalized && feedInfo?.userTopTags?.length > 0 && (
//                   <div className="user-interests">
//                     <span>Based on: </span>
//                     {feedInfo.userTopTags.slice(0, 3).map(item => (
//                       <span key={item.tag} className="interest-tag">
//                         #{item.tag}
//                       </span>
//                     ))}
//                   </div>
//                 )}
//               </div>
//               <div className="video-count">
//                 <span>{videos.length} videos</span>
//                 {feedInfo?.isPersonalized && (
//                   <span className="personalized-badge">✨ Personalized</span>
//                 )}
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



