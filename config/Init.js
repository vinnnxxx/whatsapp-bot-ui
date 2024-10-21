const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');

const clients = {};
const messages = {};

const createClient = async (sessionId, res, io) => {
    const authFolderPath = path.join(__dirname, '.wwebjs_auth', `session-${sessionId}`);

    if (fs.existsSync(authFolderPath)) {
        console.log(`Using existing session for ${sessionId}`);
    } else {
        console.log(`Creating new session for ${sessionId}`);
    }

    const client = new Client({
        authStrategy: new LocalAuth({ clientId: sessionId })
    });

    clients[sessionId] = client;

    client.on('qr', async (qr) => {
        const qrCodeUrl = await qrcode.toDataURL(qr);
        io.emit('newQRCode', qrCodeUrl);
        res.render('index', { qrCodeUrl, sessionId, authenticated: false, error: null });
    });

    client.on('authenticated', () => {
        console.log(`Client ${sessionId} is authenticated!`);
		io.emit('redirectToDashboard', sessionId);
    });

    client.on('ready', () => {
        console.log(`Client ${sessionId} is ready!`);
        io.emit('redirectToDashboard', sessionId);
    });

    client.on('message', async (message) => {
        const senderNumber = message.from.split('@')[0];
        console.log(`Incoming message from ${senderNumber}: ${message.body}`);

        if (!message || !message.body) {
            console.error('Message or message body is undefined');
            return;
        }

        try {
            if (!messages[sessionId]) {
                messages[sessionId] = [];
            }

            messages[sessionId].push({ type: 'incoming', body: message.body, from: senderNumber });
            io.to(sessionId).emit('newMessage', { body: message.body, type: 'incoming', from: senderNumber });

            const response = await handleIncomingMessage(message, client);
            if (response === undefined) {
                console.log(`BOT: No response returned`);
                return;
            }

            if (response.type === 'media') {
                messages[sessionId].push({ type: 'bot', body: response.caption, mediaUrl: response.mediaUrl });
                io.to(sessionId).emit('newMessage', { body: response.caption, type: 'bot', mediaUrl: response.mediaUrl });
            } else {
                await message.reply(response);
                console.log(`BOT: ${response}`);
                messages[sessionId].push({ type: 'bot', body: response });
                io.to(sessionId).emit('newMessage', { body: response, type: 'bot' });
            }

        } catch (error) {
            console.error('Error handling message:', error);
            await message.react('⛔');
        }
    });

    client.on('logout', () => {
        console.log(`Client ${sessionId} has logged out.`);
        delete clients[sessionId];
        io.emit('clientLoggedOut', sessionId);
    });

	client.on('error', (error) => {
		console.error(`Error on session ${sessionId}:`, error);

		if (error.code === 'EBUSY') {
			console.log(`Resource busy or locked for session: ${sessionId}. Ignoring this error. Removing session: ${sessionId}`);
			delete clients[sessionId];
			fs.rm(authFolderPath, { recursive: true, force: true }, (err) => {
				if (err) {
					console.error(`Failed to delete auth folder: ${authFolderPath}`, err);
				} else {
					console.log(`Auth folder deleted: ${authFolderPath}`);
				}
			});
		} else {
			return;
		}
	});

    client.initialize();
};

const handleIncomingMessage = async (message, client) => {
    let response;

    try {
        if (message.body === '.reply') {
            await message.react('⏳');
            response = "Reply done!";
            await message.react('✅');
        } else if (message.body.startsWith('.media-local')) {
            const caption = 'Gambar local';
            const media = MessageMedia.fromFilePath('./public/images/default.png');
            response = { type: 'media', mediaUrl: 'http://localhost:3000/images/default.png', caption: caption };

            await message.react('⏳');
            await client.sendMessage(message.from, media, { caption: caption });
            await message.react('✅');
        } else if (message.body.startsWith('.media-url')) {
            const caption = 'Gambar url';
			const mediaUrl = 'https://via.placeholder.com/350x150.png';
			
			// Create the media object from the URL
			const media = await MessageMedia.fromUrl(mediaUrl);
			
			// Prepare the response
			response = { type: 'media', mediaUrl: mediaUrl, caption: caption };
			
			await message.react('⏳'); // Indicate that the bot is processing the request
			await client.sendMessage(message.from, media, { caption: caption });
			await message.react('✅'); // Indicate that the bot has completed the action
        }
    } catch (error) {
        await message.react('⛔');
        response = { type: 'error', message: "Failed to process the request." };
    }

    return response;
};

module.exports = { createClient, clients, messages };
