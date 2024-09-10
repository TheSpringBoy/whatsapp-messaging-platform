const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const { validationResult } = require('express-validator');

const usersFile = './users.json';
const secretKey = 'your_secret_key';  // Use environment variables for production

// Load users from file
function loadUsers() {
    try {
        if (!fs.existsSync(usersFile)) {
            // If file doesn't exist, initialize it with an empty array
            fs.writeFileSync(usersFile, '[]');
        }

        const data = fs.readFileSync(usersFile, 'utf-8');

        // Handle empty or invalid JSON
        if (data.trim() === '') {
            return [];
        }

        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading users:', error);
        return [];  // Return an empty array if there's an error
    }
}

// Save users to file
function saveUsers(users) {
    try {
        fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
    } catch (error) {
        console.error('Error saving users:', error);
    }
}

// Register a new user
exports.register = async (req, res) => {
    const { username, password } = req.body;

    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // Check if user already exists
    const users = loadUsers();
    const userExists = users.find(user => user.username === username);
    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password and save user
    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ username, password: hashedPassword });
    saveUsers(users);

    res.status(201).json({ message: 'User registered successfully' });
};

// Login a user and return JWT token
exports.login = async (req, res) => {
    const { username, password } = req.body;

    const users = loadUsers();
    const user = users.find(user => user.username === username);

    if (!user) {
        return res.status(400).json({ message: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign({ username }, secretKey, { expiresIn: '7d' });
    res.status(200).json({ token });
};

// Middleware to verify JWT token
exports.verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1]; // Extract the token after 'Bearer'
    if (!token) {
        return res.status(401).json({ message: 'Access denied, no token provided' });
    }

    try {
        const decoded = jwt.verify(token, secretKey);
        req.user = decoded;
        next();
    } catch (ex) {
        res.status(400).json({ message: 'Invalid token' });
    }
};
