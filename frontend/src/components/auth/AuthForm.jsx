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

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      {/* Background with subtle gradient and pattern overlay for visual depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-950 via-gray-900 to-black opacity-90"></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/clean-gray-paper.png')] opacity-[0.03]"></div>
      
      {/* Glassmorphism Card Container */}
      <div className="relative max-w-lg w-full bg-[rgba(255,255,255,0.05)] backdrop-blur-xl rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] p-10 border border-[rgba(255,255,255,0.1)] z-10">
        
        {/* Animated border on top for a modern touch */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-t-3xl animate-pulse-slow"></div>

        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="w-fit mx-auto mb-4 p-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 shadow-xl">
            <PlayCircleIcon className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-4xl font-extrabold text-white mb-2">
            {isLogin ? 'Welcome Back' : 'Create Your Account'}
          </h2>
          <p className="mt-2 text-base text-gray-300">
            {isLogin ? 'Sign in to access your videos' : 'Join our community to get started'}
          </p>
        </div>

        {/* Error/Success Message */}
        {error && (
          <div className={`rounded-lg p-4 mb-6 text-sm font-semibold transition-all duration-300 ease-in-out border ${error.includes('successful') ? 'bg-green-600/20 text-green-300 border-green-500/30' : 'bg-red-600/20 text-red-300 border-red-500/30'}`}>
            <span>{error}</span>
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="fullname" className="block text-sm font-medium text-gray-300">
                Full Name
              </label>
              <input
                id="fullname"
                type="text"
                placeholder="Enter your full name"
                value={formData.fullname}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-4 py-3 border border-gray-700 rounded-xl shadow-inner text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-gray-800/50 transition-colors"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username" className="block text-sm font-medium text-gray-300">
              Username
            </label>
            <input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={formData.username}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-4 py-3 border border-gray-700 rounded-xl shadow-inner text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-gray-800/50 transition-colors"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-4 py-3 border border-gray-700 rounded-xl shadow-inner text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-gray-800/50 transition-colors"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-4 py-3 border border-gray-700 rounded-xl shadow-inner text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-gray-800/50 transition-colors"
            />
          </div>

          {!isLogin && (
            <>
              <div className="form-group">
                <label htmlFor="avatar" className="block text-sm font-medium text-gray-300">
                  Profile Picture
                </label>
                <input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  required
                  className="mt-1 block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-800/80 file:text-purple-400 hover:file:bg-gray-700 transition"
                />
              </div>

              <div className="form-group">
                <label htmlFor="coverImage" className="block text-sm font-medium text-gray-300">
                  Cover Image (Optional)
                </label>
                <input
                  id="coverImage"
                  type="file"
                  accept="image/*"
                  className="mt-1 block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-800/80 file:text-purple-400 hover:file:bg-gray-700 transition"
                />
              </div>
            </>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-xl text-lg font-medium text-white transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 ${
              loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900`}
          >
            {loading ? (
              <div className="flex items-center">
                <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Please wait...
              </div>
            ) : (
              <span>{isLogin ? '🚀 Sign In' : '✨ Create Account'}</span>
            )}
          </button>
        </form>

        {/* Footer with switch option */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-400">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {isLogin ? 'Register here' : 'Login here'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;