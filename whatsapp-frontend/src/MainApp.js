import React, { useState } from 'react';
import { Tabs, Tab, Box, Button, AppBar } from '@mui/material';
import MessageForm from './MessageForm';
import Statistics from './Statistics';  // New component to display statistics

const MainApp = ({ token }) => {
  const [selectedTab, setSelectedTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();  // Reload to trigger the login page
  };

  return (
    <Box sx={{ width: '40%' }}>
      <AppBar position="static" color="default">
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="שלח הודעה" />
          <Tab label="סטטיסטיקות" />
        </Tabs>
      </AppBar>
      <Box p={3}>
        {selectedTab === 0 && <MessageForm token={token} />}
        {selectedTab === 1 && <Statistics token={token} />}
      </Box>
      <Button variant="contained" color="secondary" onClick={handleLogout} fullWidth>
        התנתק
      </Button>
    </Box>
  );
};

export default MainApp;
