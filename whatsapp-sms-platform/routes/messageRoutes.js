const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');
const googleSheetsController = require('../controllers/googleSheetsController');
const authController = require('../controllers/authController');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Route to send a WhatsApp message
router.post('/send-message', authController.verifyToken, async (req, res) => {
    const { index, number, message } = req.body;

    // Ensure required fields are provided
    if (!index || !number || !message) {
        return res.status(400).json({ success: false, error: 'Missing required fields: index, number, or message' });
    }

    try {
        const response = await whatsappController.sendMessage(index, number, message);
        res.status(200).json({ success: true, message: 'Message sent successfully!', data: response });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to send message', details: error.message });
    }
});

// Route to send a WhatsApp media
router.post('/send-media', authController.verifyToken, async (req, res) => {
    const { index, number, mediaPath, caption } = req.body;

    // Ensure required fields are provided
    if (!index || !number || !mediaPath) {
        return res.status(400).json({ success: false, error: 'Missing required fields: index, number, or mediaPath' });
    }

    try {
        const response = await whatsappController.sendMedia(index, number, mediaPath, caption || '');
        res.status(200).json({ success: true, message: 'Media sent successfully!', data: response });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to send media', details: error.message });
    }
});

// Configure storage with custom filename
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');  // Directory to save the file
    },
    filename: (req, file, cb) => {
        // Extract the original extension and append it to the file name
        const ext = path.extname(file.originalname);
        const originalName = path.basename(file.originalname, ext);
        cb(null, `${originalName}${ext}`);  // Save file as originalName-timestamp.extension
    }
});

const upload = multer({ storage: storage });

// Google Sheets ID and range
const SPREADSHEET_ID = '1MTVc3UpEpMlOPof8EigQUNv3WRKBba9KanHuhUfjyC8';
const RANGE = 'גיליון1!A2:E';  // Adjust according to your sheet structure

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

router.post('/send-to-group', authController.verifyToken, upload.single('media'), async (req, res) => {
    const { index, message } = req.body;
    const groups = JSON.parse(req.body.groups);
    const mediaFile = req.file;

    try {
        const sheetData = await googleSheetsController.fetchDataFromSheet(SPREADSHEET_ID, RANGE);

        const messageGroupId = uuidv4();

        // Filter recipients based on the selected groups
        let recipients = [];
        if (groups.includes('0')) {
            // If '0' is present, send to all recipients
            recipients = sheetData;
        } else {
            // Otherwise, filter by selected groups
            recipients = sheetData.filter(row => groups.includes(row[0]));
        }

        // Use for...of loop for sequential message sending with delay
        for (const recipient of recipients) {
            let number = recipient[4];  // Assuming phone number is in column 5 (index 4)
            let group_n = recipient[0];
            if (number) {
                number = convertPhoneNumber(number);
                try {
                    if (mediaFile) {
                        const mediaPath = mediaFile.path;  // Use the uploaded file's path
                        // Send media with the message as caption
                        await whatsappController.sendMedia(index, number, mediaPath, message, group_n, messageGroupId);
                    } else {
                        // Otherwise, send a text message
                        await whatsappController.sendMessage(index, number, message, group_n, messageGroupId);
                    }
                } catch (error) {
                    // Pass silently or do nothing since logging is handled in sendMedia/sendMessage
                }
                // Add a delay between each message
                await delay(500);  // Delay for 0.5 seconds
            }
        }

        // After all messages are sent, delete the media file
        if (mediaFile) {
            fs.unlink(mediaFile.path, (err) => {
                if (err) {
                    console.error('Error deleting the file:', err);
                } else {
                    console.log('Media file deleted successfully');
                }
            });
        }

        res.status(200).json({ success: true, message: 'Messages sent successfully!' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to send messages', details: error.message });
    }
});


function convertPhoneNumber(phoneNumber) {
    // Remove the hyphen and leading zero
    return phoneNumber.replace(/-/g, '').substring(1);
}

module.exports = router;