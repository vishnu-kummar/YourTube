import React, { useState } from 'react';
import { apiService } from '../../services/apiService';
import { PlayCircleIcon } from '../common/Icons';

const AuthForm = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullname: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const response = await apiService.login({
          username: formData.username || formData.email,
          email: formData.email,
          password: formData.password
        });
        onLogin(response.data.user);
      } else {
        const form = new FormData();
        form.append('username', formData.username);
        form.append('email', formData.email);
        form.append('password', formData.password);
        form.append('fullname', formData.fullname);
       
        const avatarInput = document.getElementById('avatar');
        if (avatarInput?.files[0]) {
          form.append('avatar', avatarInput.files[0]);
        }
       
        const coverImageInput = document.getElementById('coverImage');
        if (coverImageInput?.files[0]) {
          form.append('coverImage', coverImageInput.files[0]);
        }

        await apiService.register(form);
        setIsLogin(true);
        setError('Registration successful! Please login.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-container">
      <div className="upload-form-container">
        <div className="upload-header">
          <div className="upload-icon">
            <PlayCircleIcon className="h-8 w-8 text-white" />
          </div>
          <h2>{isLogin ? 'Welcome Back!' : 'Join YourTube'}</h2>
          <p>{isLogin ? 'Sign in to continue your journey' : 'Create your account to get started'}</p>
        </div>

        {error && (
          <div className={`error-message ${error.includes('successful') ? 'success-message' : ''}`}>
            <span>{error}</span>
          </div>
        )}

        <form className="upload-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="fullname">Full Name</label>
              <input
                id="fullname"
                type="text"
                placeholder="Enter your full name"
                value={formData.fullname}
                onChange={(e) => setFormData({...formData, fullname: e.target.value})}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
          </div>

          {!isLogin && (
            <>
              <div className="form-group">
                <label htmlFor="avatar">Profile Picture</label>
                <input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="coverImage">Cover Image (Optional)</label>
                <input
                  id="coverImage"
                  type="file"
                  accept="image/*"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            className="upload-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <div className="upload-loading">
                <div className="spinner"></div>
                Please wait...
              </div>
            ) : (
              <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
            )}
          </button>
        </form>

        <div className="auth-footer" style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              style={{
                background: 'none',
                border: 'none',
                color: '#9333ea',
                fontWeight: '600',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;