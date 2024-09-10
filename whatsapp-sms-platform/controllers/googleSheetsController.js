const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Path to the credentials file
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
const TOKEN_PATH = 'token.json';

// Scopes required to read Google Sheets
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

// Authorize the client using environment variables
async function authorize(req, res) {
    const { GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REDIRECT_URI } = process.env;

    const oAuth2Client = new google.auth.OAuth2(
        GOOGLE_OAUTH_CLIENT_ID,
        GOOGLE_OAUTH_CLIENT_SECRET,
        GOOGLE_OAUTH_REDIRECT_URI
    );

    // Check if a token is already available (either from env or file)
    if (process.env.GOOGLE_OAUTH_TOKEN) {
        oAuth2Client.setCredentials(JSON.parse(process.env.GOOGLE_OAUTH_TOKEN));
    } else if (fs.existsSync(TOKEN_PATH)) {
        const token = fs.readFileSync(TOKEN_PATH);
        oAuth2Client.setCredentials(JSON.parse(token));
    } else {
        // If no token, generate the authorization URL and redirect the user
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
        });
        console.log('Redirecting to Google OAuth...');
        return res.redirect(authUrl); // Redirect to Google's OAuth 2.0 consent page
    }

    return oAuth2Client;
}

// Fetch data from the Google Sheet
async function fetchDataFromSheet(spreadsheetId, range) {
    const auth = await authorize();
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
    });

    return response.data.values;  // This will return the sheet data
}

module.exports = { fetchDataFromSheet };