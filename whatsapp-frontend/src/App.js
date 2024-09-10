import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import MessageForm from './MessageForm';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

// Helper function to decode JWT token
const decodeToken = (token) => {
  if (!token) return null;
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
  return JSON.parse(jsonPayload);
};

const App = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);  // Toggle password visibility

  // Server URL from environment variables
  const serverUrl = process.env.REACT_APP_SERVER_URL;

  // Check if token exists in localStorage on app load
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      const decoded = decodeToken(savedToken);
      const currentTime = Math.floor(Date.now() / 1000);  // Current time in seconds
      if (decoded && decoded.exp > currentTime) {
        setToken(savedToken);
        setIsLoggedIn(true);
      } else {
        localStorage.removeItem('token');
      }
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${serverUrl}/api/auth/login`, {
        username,
        password,
      });
      setToken(response.data.token);
      setIsLoggedIn(true);
      localStorage.setItem('token', response.data.token);
    } catch (error) {
      //alert(error);
      alert('Login failed! Please check your credentials.');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="App">
      {!isLoggedIn ? (
        <form onSubmit={handleLogin} className="login-form">
          <h2>התחברות</h2>
          <div className="input-container">
            <input
              type="text"
              placeholder="שם משתמש"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="input-container password-container">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="סיסמא"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span className="password-toggle" onClick={togglePasswordVisibility}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          <button type="submit" className="login-button">התחבר/י</button>
        </form>
      ) : (
        <div>
          <MessageForm token={token} />
        </div>
      )}
    </div>
  );
};

export default App;
