import React, { useState } from 'react';
import { FaUser, FaLock } from 'react-icons/fa';


const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  const toggleForm = () => {
    setIsLogin(!isLogin);
  };

  const formTitle = isLogin ? 'Sign In to Your Account' : 'Create an Account';
  const buttonText = isLogin ? 'Sign In' : 'Sign Up';

  return (
    <div className="upload-container">
      <div className="upload-form-container">
        <div className="upload-header">
          <div className="upload-icon">
            <FaUser size={30} color="white" />
          </div>
          <h2>{formTitle}</h2>
          <p>{isLogin ? 'Welcome back! Please enter your details.' : 'Join the community and start uploading videos.'}</p>
        </div>
        
        <form className="upload-form">
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input type="text" id="username" placeholder="Enter your username" />
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input type="email" id="email" placeholder="Enter your email" />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" placeholder="Enter your password" />
          </div>
          
          <button type="submit" className="upload-submit-btn">
            {buttonText}
          </button>
        </form>

        <div className="text-center mt-6">
          <span className="text-gray-600">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
          </span>
          <button
            onClick={toggleForm}
            className="text-purple-600 hover:text-purple-800 font-semibold ml-2"
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;  // fixed 