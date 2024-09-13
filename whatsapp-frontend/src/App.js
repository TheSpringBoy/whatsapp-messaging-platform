import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import MainApp from './MainApp';
import {
  Button,
  TextField,
  IconButton,
  InputAdornment,
  OutlinedInput,
  InputLabel,
  FormControl,
  Container,
  Box
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

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
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
    setLoginError(false); // Reset error state before login attempt
    try {
      const response = await axios.post(`${serverUrl}/api/auth/login`, {
        username,
        password,
      });
      setToken(response.data.token);
      setIsLoggedIn(true);
      localStorage.setItem('token', response.data.token);
    } catch (error) {
      setLoginError(true); // Set error state to true when login fails
      setErrorMessage('Login failed! Please check your credentials.');
    }
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };
  
  return (
    <div className="App">
      {!isLoggedIn ? (
        <Container dir="ltr" maxWidth="sm">
          <Box
            component="form"
            onSubmit={handleLogin}
            className="login-form"
          >
            <h2>התחברות</h2>

            {/* Username Field */}
            <TextField
              label="שם משתמש"
              variant="outlined"
              fullWidth
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              error={loginError} // Shows error styling when login fails
              helperText={loginError ? errorMessage : ''}
              style={{ marginBottom: '20px' }}
            />

            {/* Password Field */}
            <FormControl fullWidth variant="outlined" style={{ marginBottom: '20px' }}>
              <InputLabel htmlFor="outlined-adornment-password">סיסמא</InputLabel>
              <OutlinedInput
                id="outlined-adornment-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                }
                label="Password"
                error={loginError} // Shows error styling when login fails
              />
            </FormControl>

            {/* Submit Button */}
            <Button variant="contained" color="primary" type="submit" fullWidth>
              התחבר/י
            </Button>
          </Box>
        </Container>
      ) : (
        <MainApp token={token} />
      )}
    </div>
  );
  
};

export default App;
