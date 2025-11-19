import React, { useState } from 'react';
// Corrected paths for better project structure compatibility
 import { apiService } from '../../services/apiService';
 import { UploadIcon } from '../common/Icons';

const VideoUpload = () => {
  const [formData, setFormData] = useState({
    // Corrected to 'title' (lowercase) to match the backend schema
    title: '', 
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const form = new FormData();
      // Appending with lowercase 'title'
      form.append('title', formData.title); 
      form.append('description', formData.description);
      
      const videoFile = document.getElementById('videoFile').files[0];
      const thumbnail = document.getElementById('thumbnail').files[0];
      
      if (!videoFile || !thumbnail) {
        // Updated error handling for file selection
        throw new Error('Please select both a video file and a thumbnail image.');
      }
      
      // File keys 'videoFile' and 'thumbnail' are correct and match the backend
      form.append('videoFile', videoFile);
      form.append('thumbnail', thumbnail);

      await apiService.uploadVideo(form);
      setSuccess('Video uploaded successfully!');
      // Resetting state
      setFormData({ title: '', description: '' }); 
      // Clear file inputs
      document.getElementById('videoFile').value = '';
      document.getElementById('thumbnail').value = '';
    } catch (err) {
      // Improved error message extraction
      const errorMessage = err.response?.data?.message || err.message || "An unknown error occurred during upload.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-container">
      <div className="upload-form-container">
        <div className="upload-header">
          <div className="upload-icon">
            <UploadIcon />
          </div>
          <h2>Upload Your Video</h2>
          <p>Share your creativity with the world</p>
        </div>
        
        {error && (
          <div className="error-message">
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="success-message">
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="upload-form">
          <div className="form-group">
            <label>Video Title</label>
            <input
              type="text"
              placeholder="Enter an engaging title for your video"
              value={formData.title} 
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              placeholder="Describe your video content, what viewers can expect..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows="4"
              required
            />
          </div>

          <div className="form-group">
            <label>Video File</label>
            <input
              type="file"
              id="videoFile"
              accept="video/*"
              required
            />
          </div>

          <div className="form-group">
            <label>Thumbnail</label>
            <input
              type="file"
              id="thumbnail"
              accept="image/*"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="upload-submit-btn"
          >
            {loading ? (
              <div className="upload-loading">
                <div className="spinner"></div>
                <span>Uploading...</span>
              </div>
            ) : (
              <span>🚀 Upload Video</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};


export default VideoUpload;
//------------------------------------------------------------------
// import React, { useState } from 'react';
// import { apiService } from '../../services/apiService';
// import { UploadIcon } from '../common/Icons';

// const VideoUpload = () => {
//   const [formData, setFormData] = useState({
//     title: '',
//     description: ''
//   });
//   const [loading, setLoading] = useState(false);
//   const [success, setSuccess] = useState('');
//   const [error, setError] = useState('');

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError('');
//     setSuccess('');

//     try {
//       const form = new FormData();
//       form.append('title', formData.title);
//       form.append('description', formData.description);
      
//       const videoFile = document.getElementById('videoFile').files[0];
//       const thumbnail = document.getElementById('thumbnail').files[0];
      
//       if (!videoFile || !thumbnail) {
//         throw new Error('Video file and thumbnail are required');
//       }
      
//       form.append('videoFile', videoFile);
//       form.append('thumbnail', thumbnail);

//       await apiService.uploadVideo(form);
//       setSuccess('Video uploaded successfully!');
//       setFormData({ Title: '', description: '' });
//       document.getElementById('videoFile').value = '';
//       document.getElementById('thumbnail').value = '';
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="upload-container">
//       <div className="upload-form-container">
//         <div className="upload-header">
//           <div className="upload-icon">
//             <UploadIcon />
//           </div>
//           <h2>Upload Your Video</h2>
//           <p>Share your creativity with the world</p>
//         </div>
        
//         {error && (
//           <div className="error-message">
//             <span>{error}</span>
//           </div>
//         )}
        
//         {success && (
//           <div className="success-message">
//             <span>{success}</span>
//           </div>
//         )}

//         <form onSubmit={handleSubmit} className="upload-form">
//           <div className="form-group">
//             <label>Video Title</label>
//             <input
//               type="text"
//               placeholder="Enter an engaging title for your video"
//               value={formData.Title}
//               onChange={(e) => setFormData({...formData, Title: e.target.value})}
//               required
//             />
//           </div>

//           <div className="form-group">
//             <label>Description</label>
//             <textarea
//               placeholder="Describe your video content, what viewers can expect..."
//               value={formData.description}
//               onChange={(e) => setFormData({...formData, description: e.target.value})}
//               rows="4"
//               required
//             />
//           </div>

//           <div className="form-group">
//             <label>Video File</label>
//             <input
//               type="file"
//               id="videoFile"
//               accept="video/*"
//               required
//             />
//           </div>

//           <div className="form-group">
//             <label>Thumbnail</label>
//             <input
//               type="file"
//               id="thumbnail"
//               accept="image/*"
//               required
//             />
//           </div>

//           <button
//             type="submit"
//             disabled={loading}
//             className="upload-submit-btn"
//           >
//             {loading ? (
//               <div className="upload-loading">
//                 <div className="spinner"></div>
//                 <span>Uploading...</span>
//               </div>
//             ) : (
//               <span>🚀 Upload Video</span>
//             )}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// };


// export default VideoUpload;