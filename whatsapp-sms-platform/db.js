const { Pool } = require('pg');
require('dotenv').config();  // Make sure to load env variables

// Create a pool of connections
const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // DATABASE_URL from environment variables
    ssl: {
        rejectUnauthorized: false  // If you're using SSL, especially on DigitalOcean
    }
});

// Function to run queries
const query = (text, params) => pool.query(text, params);

module.exports = {
    query
};
