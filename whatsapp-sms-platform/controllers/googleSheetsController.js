const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Path to the credentials file
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
const TOKEN_PATH = path.join(__dirname, 'token.json');

// Scopes required to read Google Sheets
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

// Load client secrets
const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));

// Authorize the client
async function authorize() {
    const { client_secret, client_id, redirect_uris } = credentials.web;  // Change from 'installed' to 'web'
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token
    if (fs.existsSync(TOKEN_PATH)) {
        const token = fs.readFileSync(TOKEN_PATH);
        oAuth2Client.setCredentials(JSON.parse(token));
    } else {
        // If no token, generate a new one
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
        });
        console.log('Authorize this app by visiting this URL:', authUrl);
        const rl = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        rl.question('Enter the code from that page here: ', (code) => {
            rl.close();
            oAuth2Client.getToken(code, (err, token) => {
                if (err) return console.error('Error retrieving access token', err);
                oAuth2Client.setCredentials(token);
                // Store the token for future use
                fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
            });
        });
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
