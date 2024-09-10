const express = require('express');
const { google } = require('googleapis');
const fs = require('fs');
const router = express.Router();

const { GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REDIRECT_URI } = process.env;
const TOKEN_PATH = process.env.GOOGLE_OAUTH_TOKEN_PATH || 'token.json';

// Google OAuth2 client
const oAuth2Client = new google.auth.OAuth2(
    GOOGLE_OAUTH_CLIENT_ID,
    GOOGLE_OAUTH_CLIENT_SECRET,
    GOOGLE_OAUTH_REDIRECT_URI
);

// OAuth2 callback route
router.get('', async (req, res) => {
    const code = req.query.code;

    try {
        const { tokens } = await oAuth2Client.getToken(code);  // Get tokens
        oAuth2Client.setCredentials(tokens);

        // Optionally save the token for future use
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));

        // Store the token in the environment or as needed
        console.log('Token stored successfully:', tokens);
        res.send('Authentication successful! You can close this window.');
    } catch (err) {
        console.error('Error retrieving access token:', err);
        res.status(500).send('Authentication failed.');
    }
});

module.exports = router;
