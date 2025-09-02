import React, { useState } from 'react';
import { FaLock, FaUser } from 'react-icons/fa'; // Icons for the form inputs
import { AiOutlineMail } from 'react-icons/ai'; // Email icon

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  const toggleForm = () => {
    setIsLogin(!isLogin);
  };

  const formTitle = isLogin ? 'Login to Your Account' : 'Create a New Account';
  const buttonText = isLogin ? 'Sign In' : 'Sign Up';
  const toggleText = isLogin ? "Don't have an account?" : 'Already have an account?';
  const toggleLinkText = isLogin ? 'Sign Up' : 'Sign In';

  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <div className="auth-header">
          <div className="auth-icon-wrapper">
            <FaLock className="auth-icon" />
          </div>
          <h2>{formTitle}</h2>
        </div>
        <form className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <div className="input-with-icon">
                <FaUser className="input-icon" />
                <input type="text" id="username" placeholder="Enter your username" />
              </div>
            </div>
          )}
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-with-icon">
              <AiOutlineMail className="input-icon" />
              <input type="email" id="email" placeholder="Enter your email" />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-with-icon">
              <FaLock className="input-icon" />
              <input type="password" id="password" placeholder="Enter your password" />
            </div>
          </div>
          <button type="submit" className="auth-submit-btn">
            {buttonText}
          </button>
        </form>
        <div className="toggle-form-text">
          <span>{toggleText} </span>
          <button onClick={toggleForm} className="toggle-btn">
            {toggleLinkText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;  // fixed this time