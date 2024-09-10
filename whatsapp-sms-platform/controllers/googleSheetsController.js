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
        // If no token, generate the authorization URL and log it to the console for manual copying
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
        });
        
        // Print the URL to the console
        console.log('Please visit this URL to authorize the app:');
        console.log(authUrl);

        // Optionally, you can also return this link in the response (useful if you want to show it in a UI):
        return res.status(200).send(`Please visit this URL to authorize the app: <a href="${authUrl}" target="_blank">${authUrl}</a>`);
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