const cors = require('cors');
const express = require('express');
const app = express();
const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes');
const oauthRoutes = require('./routes/oauthRoutes');

// Enable CORS for all routes
app.use(cors());

// Middleware to parse incoming requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/oauth2callback', oauthRoutes);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
