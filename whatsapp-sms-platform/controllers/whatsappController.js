const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const db = require('../db.js');

// Array to store multiple WhatsApp clients (for 10 different numbers)
const clients = [];
for (let i = 1; i <= process.env.SESSIONS_NUM; i++) {
    const client = new Client({
        puppeteer: {
            executablePath: process.env.CHROME_PATH,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
        authStrategy: new LocalAuth({
            clientId: `whatsappClient${i}`,  // Unique ID for each number
            dataPath: `./sessions/whatsapp_sessions_${i}`  // Custom session storage path
        }),
        qrMaxRetries: 10  // Maximum number of retries to generate the QR code
    });

    client.on('qr', (qr) => {
        console.log(`QR Code received for client ${i}, scan it with your phone!`);
        qrcode.generate(qr, { small: true });
    });

    client.on('ready', () => {
        console.log(`WhatsApp client ${i} is ready!`);
    });

    client.on('message_ack', async (msg, ack) => {
        if (ack === 3) {  // 3 means the message was read
            console.log(`Message read by ${msg.to}`);
    
            // Save the read receipt to the database
            try {
                await db.query('UPDATE messages SET read_count = read_count + 1 WHERE id = $1', [msg.id._serialized]);
                console.log(`Read count updated for message ID: ${msg.id._serialized}`);
            } catch (error) {
                console.error('Failed to update read receipt in the database:', error);
            }
        }
    });

    client.on('message', async (msg) => {    
        console.log(`Reply received from ${msg.from}`);
    
        try {
            await db.query('UPDATE messages SET reply_count = reply_count + 1 WHERE whatsapp_message_id = $1', [msg.id._serialized]);
            console.log(`Reply count updated for message ID: ${msg.id._serialized}`);
        } catch (error) {
            console.error('Failed to update reply count in the database:', error);
        }
    });
    
    // Error handling to prevent server from crashing
    client.on('error', (err) => {
        console.error(`Error on client ${i}: ${err.message}`);
    });
    
    client.initialize();
    clients.push(client);
}

// Function to convert phone number to WhatsApp Chat ID
function formatPhoneNumberToChatId(phoneNumber, countryCode = '972') {
    // Ensure the number starts with the country code and format it as a WhatsApp chat ID
    const formattedNumber = `${countryCode}${phoneNumber}@c.us`;
    return formattedNumber;
}

// Function to send a text message and log to DB
const sendMessage = async (index, number, message) => {
    try {
        const chatId = formatPhoneNumberToChatId(number);
        const client = clients[index - 1];
        const response = await client.sendMessage(chatId, message);

        // Save message to the database
        await db.query(
            'INSERT INTO messages (group_id, message_text, sent_at, read_count, reply_count, whatsapp_message_id) VALUES ($1, $2, NOW(), 0, 0, $3) RETURNING id',
            [index, message, response.id._serialized]  // Store WhatsApp message ID
        );        

        console.log(`Message sent to ${chatId}`);
        return response;
    } catch (error) {
        console.error('Failed to send message:', error);
        throw error;
    }
};

// Function to send a media
const sendMedia = async (index, number, mediaPath, caption) => {
    try {
        const chatId = formatPhoneNumberToChatId(number);
        const client = clients[index - 1];
        const media = MessageMedia.fromFilePath(mediaPath);
        const response = await client.sendMessage(chatId, media, { caption: caption });

        // Save media message to the database
        await db.query(
            'INSERT INTO messages (group_id, message_text, sent_at, read_count, reply_count, whatsapp_message_id) VALUES ($1, $2, NOW(), 0, 0, $3) RETURNING id',
            [index, caption || 'Media message', response.id._serialized]  // Store WhatsApp message ID
        );
        
        console.log(`Media sent to ${chatId}`);
        return response;
    } catch (error) {
        console.error('Failed to send media:', error);
        throw error;
    }
};

// Export the functions and clients array
module.exports = { 
    clients,
    sendMessage,
    sendMedia
};
