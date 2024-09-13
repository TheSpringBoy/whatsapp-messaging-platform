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
    
            // Find the database id using the WhatsApp message ID
            const result = await db.query('SELECT id FROM messages WHERE whatsapp_message_id = $1', [msg.id._serialized]);
            const dbMessageId = result.rows[0]?.id;
    
            if (dbMessageId) {
                try {
                    await db.query('UPDATE messages SET read_count = read_count + 1 WHERE id = $1', [dbMessageId]);
                    console.log(`Read count updated for message ID: ${dbMessageId}`);
                } catch (error) {
                    console.error('Failed to update read receipt in the database:', error);
                }
            }
        }
    });    

    client.on('message', async (msg) => {    
        console.log(`Reply received from ${msg.from}`);
    
        try {
            await db.query(
                `UPDATE messages 
                 SET reply_count = reply_count + 1 
                 WHERE whatsapp_message_id LIKE $1 
                 AND sent_at = (SELECT MAX(sent_at) FROM messages WHERE whatsapp_message_id LIKE $1)`,
                [`%${msg.from}%`]
            );
            console.log(`Reply count updated forhe last message to sender: ${msg.from}`);
        } catch (error) {
            console.error('Failed to update reply count in the database:', error);
        }
    });
    
    client.on('disconnected', (reason) => {
        console.log(`Client ${i} was logged out:`, reason);
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
const sendMessage = async (index, number, message, group, messageGroupId) => {
    try {
        const chatId = formatPhoneNumberToChatId(number);
        const client = clients[index - 1];
        console.log('Attempting to send message to ', chatId);
        const response = await client.sendMessage(chatId, message);

        // Save message to the database
        await db.query(
            "INSERT INTO messages (group_id, message_text, sent_at, read_count, reply_count, whatsapp_message_id, message_group_id) VALUES ($1, $2, NOW() AT TIME ZONE 'Asia/Jerusalem', 0, 0, $3, $4)",
            [group, message, response.id._serialized, messageGroupId]  // Store WhatsApp message ID
        );        

        console.log(`Message sent to ${chatId}`);
        return response;
    } catch (error) {
        console.error('Failed to send message:', error);
        throw error;
    }
};

// Function to send a media
const sendMedia = async (index, number, mediaPath, caption, group, messageGroupId) => {
    try {
        const chatId = formatPhoneNumberToChatId(number);
        const client = clients[index - 1];
        const media = MessageMedia.fromFilePath(mediaPath);

        // Extract the media file name
        const fileName = mediaPath.split('/').pop();  // Adjust for your file system

        // Send media with caption
        const response = await client.sendMessage(chatId, media, { caption });

        // Save media message to the database with the media_name
        await db.query(
            "INSERT INTO messages (group_id, message_text, media_name, sent_at, read_count, reply_count, whatsapp_message_id, message_group_id) VALUES ($1, $2, $3, NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jerusalem', 0, 0, $4, $5)",
            [group, caption, fileName, response.id._serialized, messageGroupId]  // Storing media file name
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
