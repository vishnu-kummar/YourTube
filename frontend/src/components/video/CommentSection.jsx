// src/components/video/CommentSection.jsx
import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { timeAgo } from '../../utils/helpers';

const CommentSection = ({ videoId, user, onCommentsUpdate }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(true);

  useEffect(() => {
    loadComments();
  }, [videoId]);

  const loadComments = async () => {
    try {
      setCommentsLoading(true);
      const response = await apiService.getVideoComments(videoId);
      const commentsData = response.data.docs || [];
      setComments(commentsData);
      
      // Notify parent component about comments count
      if (onCommentsUpdate) {
        onCommentsUpdate(commentsData.length);
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setLoading(true);
    try {
      const response = await apiService.addComment(videoId, newComment);
      
      // Add the new comment to the list immediately for better UX
      const newCommentObj = {
        _id: response.data._id || Date.now(), // Fallback ID
        content: newComment,
        owner: {
          username: user.username,
          avatar: user.avatar,
          _id: user._id
        },
        createdAt: new Date().toISOString()
      };
      
      setComments(prev => [newCommentObj, ...prev]); // Add to the beginning
      setNewComment('');
      
      // Notify parent component about new comment count
      if (onCommentsUpdate) {
        onCommentsUpdate(comments.length + 1);
      }
      
      // Optionally reload comments from server to ensure consistency
      // loadComments();
      
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('Failed to post comment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (commentsLoading) {
    return (
      <div className="comment-section">
        <h3>Comments</h3>
        <div className="comments-loading">
          <div className="loading-spinner"></div>
          <p>Loading comments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="comment-section">
      <h3>Comments ({comments.length})</h3>
      
      {user ? (
        <form onSubmit={handleSubmitComment} className="comment-form">
          <div className="comment-input-container">
            <img 
              src={user.avatar || 'https://via.placeholder.com/40'} 
              alt={user.username}
              className="comment-user-avatar"
            />
            <input
              type="text"
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="comment-input"
              disabled={loading}
            />
            <button 
              type="submit" 
              disabled={loading || !newComment.trim()}
              className={`comment-submit-btn ${loading ? 'loading' : ''}`}
            >
              {loading ? (
                <div className="comment-loading">
                  <div className="spinner"></div>
                </div>
              ) : (
                'Comment'
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="login-to-comment">
          <p>Please login to comment</p>
        </div>
      )}
      
      <div className="comments-list">
        {comments.length > 0 ? (
          comments.map(comment => (
            <div key={comment._id} className="comment-item">
              <img 
                src={comment.owner.avatar || 'https://via.placeholder.com/40'} 
                alt={comment.owner.username}
                className="comment-avatar"
              />
              <div className="comment-content">
                <div className="comment-header">
                  <span className="comment-username">{comment.owner.username}</span>
                  <span className="comment-time">{timeAgo(comment.createdAt)}</span>
                </div>
                <p className="comment-text">{comment.content}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="no-comments">
            <p>No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSection;