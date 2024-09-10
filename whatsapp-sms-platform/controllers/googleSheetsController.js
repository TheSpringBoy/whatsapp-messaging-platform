const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = process.env.GOOGLE_OAUTH_TOKEN_PATH || 'token.json';
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

// Authorize the client
async function authorize() {
    const { GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REDIRECT_URI } = process.env;
    
    const oAuth2Client = new google.auth.OAuth2(
        GOOGLE_OAUTH_CLIENT_ID,
        GOOGLE_OAUTH_CLIENT_SECRET,
        GOOGLE_OAUTH_REDIRECT_URI
    );

    if (fs.existsSync(TOKEN_PATH)) {
        const token = fs.readFileSync(TOKEN_PATH);
        oAuth2Client.setCredentials(JSON.parse(token));

        // Check if access token has expired
        if (oAuth2Client.isTokenExpiring()) {
            console.log('Token expired, attempting to refresh...');
            try {
                const newToken = await oAuth2Client.refreshAccessToken();
                oAuth2Client.setCredentials(newToken.credentials);
                fs.writeFileSync(TOKEN_PATH, JSON.stringify(newToken.credentials));
                console.log('Token refreshed successfully.');
            } catch (error) {
                console.log('Failed to refresh token:', error);
                return startOAuthFlow(oAuth2Client);
            }
        }
    } else {
        return startOAuthFlow(oAuth2Client);  // Start OAuth flow if no token exists
    }

    return oAuth2Client;
}

function startOAuthFlow(oAuth2Client) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',  // Important to get a refresh token
        scope: SCOPES,
        prompt: 'consent' // Ensures user is prompted and a new refresh token is generated
    });
    console.log('Please visit this URL to authorize the app:', authUrl);
    return authUrl;  // Return this URL in case you want to show it in the UI
}

async function fetchDataFromSheet(spreadsheetId, range) {
    const auth = await authorize();
    const sheets = google.sheets({ version: 'v4', auth });
    
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
    });

    return response.data.values;  // Return the sheet data
}

module.exports = { fetchDataFromSheet };
