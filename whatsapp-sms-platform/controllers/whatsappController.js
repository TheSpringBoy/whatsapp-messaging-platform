const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Array to store multiple WhatsApp clients (for 10 different numbers)
const clients = [];

for (let i = 1; i <= 10; i++) {
    const client = new Client({
        puppeteer: {
            executablePath: process.env.CHROME_PATH,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
        authStrategy: new LocalAuth({
            clientId: `whatsappClient${i}`,  // Unique ID for each number
            dataPath: `./sessions/whatsapp_sessions_${i}`  // Custom session storage path
        }),
        qrMaxRetries: 1  // Maximum number of retries to generate the QR code
    });

    client.on('qr', (qr) => {
        console.log(`QR Code received for client ${i}, scan it with your phone!`);
        qrcode.generate(qr, { small: true });
    });

    client.on('ready', () => {
        console.log(`WhatsApp client ${i} is ready!`);
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

// Function to send a text message
const sendMessage = async (index, number, message) => {
    try {
        const chatId = formatPhoneNumberToChatId(number);  // Convert phone number to WhatsApp chat ID
        const client = clients[index - 1];  // Get the correct client based on index
        const response = await client.sendMessage(chatId, message);
        console.log(`Message sent to ${chatId}: ${message}`);
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
        const client = clients[index - 1];  // Get the correct client based on index
        const media = MessageMedia.fromFilePath(mediaPath);
        const response = await client.sendMessage(chatId, media, { caption: caption });
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
