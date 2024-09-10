import React, { useState } from 'react';
import { Tabs, Tab, Box, Button, AppBar } from '@mui/material';
import MessageForm from './MessageForm';
import GroupStatistics from './GroupStatistics';
import MessageStatistics from './MessageStatistics';

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
    <Box sx={{ maxWidth: '1000px', minWidth: '60%' }}>
      <AppBar position="static" color="default">
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="שלח הודעה" />
          <Tab label="סטטיסטיקות (לפי קבוצות)" />
          <Tab label="סטטיסטיקות (לפי הודעות)" />
        </Tabs>
      </AppBar>
      <Box p={3}>
        {selectedTab === 0 && <MessageForm token={token} />}
        {selectedTab === 1 && <GroupStatistics token={token} />}
        {selectedTab === 2 && <MessageStatistics token={token} />}
      </Box>
      <Button variant="contained" color="secondary" onClick={handleLogout} fullWidth>
        התנתק
      </Button>
    </Box>
  );
};

export default MainApp;
