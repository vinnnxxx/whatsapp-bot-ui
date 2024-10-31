const express = require('express');
const { WebSocketServer } = require('ws');
const { WaBot } = require('fhy-wabot');
const QRCode = require('qrcode');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { exec, spawn } = require('child_process');
const AdvancedResponse = require('./messages/advancedResponse');
const AutoResponse = require('./settings/auto_response.json');
const configPath = path.join(__dirname, './settings/config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
const configAutoResponsePath = path.join(__dirname, './settings/auto_response.json');
const configAutoResponse = JSON.parse(fs.readFileSync(configAutoResponsePath, 'utf-8'));

const app = express();
const PORT = process.env.PORT || 3000;

let qrCodeUrl;
let messages = [];

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

const QRCustom = async (qr) => {
    try {
        qrCodeUrl = await QRCode.toDataURL(qr);
        console.log('Custom QRCode URL:', qrCodeUrl);
        if (wss) {
            wss.clients.forEach(client => {
                if (client.readyState === client.OPEN) {
                    client.send(JSON.stringify({ qrCodeUrl }));
                }
            });
        }
    } catch (err) {
        console.error('Failed to generate QR URL:', err);
    }
};

const ManualResponse = {};

(async () => {
    const sock = await WaBot(QRUrl = config.settings.QR_URL, QRCustom, AutoResponse, ManualResponse, self = config.settings.SELF);

    sock.ev.on('messages.upsert', async (messageUpdate) => {
        const message = messageUpdate.messages[0];
        const sender = message.key.remoteJid;
        const messageContent = message.message.conversation || message.message.extendedTextMessage?.text || 'Not detected!';
		const key = message.key;
		
        let jsonResponse;

        if (message.key.fromMe) {
            jsonResponse = {
                sender: 'Bot',
                senderId: sender,
                message: messageContent,
            };
        } else if (message.key.remoteJid.endsWith('@g.us')) {
            const groupMetadata = await sock.groupMetadata(sender);
            const groupTitle = groupMetadata.subject;
            const participantId = message.key.participant;

            const participantInfo = groupMetadata.participants.find(p => p.id === participantId);
            const participantName = participantInfo ? participantInfo.notify || participantId.split('@')[0] : participantId.split('@')[0];

            jsonResponse = {
                group: groupTitle,
                groupId: sender,
                participant: participantName,
                participantId: participantId,
                message: messageContent,
            };
        } else {
            jsonResponse = {
                sender: sender.split('@')[0],
                senderId: sender,
                message: messageContent,
            };
        }

        console.log(JSON.stringify(jsonResponse, null, 2));
		
		if (messageContent !== 'Not detected!') {
			messages.push(jsonResponse);

			if (wss) {
				wss.clients.forEach(client => {
					if (client.readyState === client.OPEN) {
						client.send(JSON.stringify({ messageData: jsonResponse }));
					}
				});
			}
		}

        await AdvancedResponse(messageContent, sender, sock, message, key );
		
    });
})();

const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (ws) => {
    console.log('New client connected');
    if (qrCodeUrl) {
        ws.send(JSON.stringify({ qrCodeUrl }));
    }

    messages.forEach(message => {
        ws.send(JSON.stringify({ messageData: message }));
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

const saveMessageToHistory = (messageData, filePath, res) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading history file:', err);
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }

        let history = [];
        if (data) {
            try {
                history = JSON.parse(data);
            } catch (parseErr) {
                console.error('Error parsing history JSON:', parseErr);
                return res.status(500).json({ success: false, message: 'Internal Server Error' });
            }
        }

        history.push(messageData);

        fs.writeFile(filePath, JSON.stringify(history, null, 2), (writeErr) => {
            if (writeErr) {
                console.error('Error writing history file:', writeErr);
                return res.status(500).json({ success: false, message: 'Internal Server Error' });
            }

            res.json({ success: true, message: 'Message history saved' });
        });
    });
};

app.get('/', (req, res) => {
    const sessionPath = path.join(__dirname, 'auth_info', 'session-');
    fs.readdir(path.join(__dirname, 'auth_info'), (err, files) => {
        if (err) {
            console.error('Error reading directory:', err);
            return res.status(500).send('Internal Server Error');
        }
        const sessionExists = files.some(file => file.startsWith('session-'));
        if (sessionExists) {
            return res.redirect('/dashboard');
        }
        res.render('qr');
    });
});

app.get('/dashboard', (req, res) => {
    const authInfoPath = path.join(__dirname, 'auth_info');
    const sessionPath = path.join(authInfoPath, 'session-');
    if (!fs.existsSync(authInfoPath)) {
        return res.redirect('/');
    }
    const sessionFiles = fs.readdirSync(authInfoPath).filter(file => file.startsWith('session-'));
    if (sessionFiles.length === 0) {
        return res.redirect('/');
    }
    res.render('dashboard');
});

app.get('/settings', (req, res) => {
    const authInfoPath = path.join(__dirname, 'auth_info');
    const sessionPath = path.join(authInfoPath, 'session-');
    if (!fs.existsSync(authInfoPath)) {
        return res.redirect('/');
    }
    const sessionFiles = fs.readdirSync(authInfoPath).filter(file => file.startsWith('session-'));
    if (sessionFiles.length === 0) {
        return res.redirect('/');
    }
    fs.readFile(configPath, 'utf8', (err, configData) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read config file' });
        }
        fs.readFile(configAutoResponsePath, 'utf8', (err, autoResponseData) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to read auto response file' });
            }
            const config = JSON.parse(configData);
            const autoResponse = JSON.parse(autoResponseData);
            res.render('settings', { config, autoResponse });
        });
    });
});

app.post('/settings/update', (req, res) => {
    const updatedAutoResponse = req.body.autoCommand;
    fs.writeFile(configAutoResponsePath, updatedAutoResponse, 'utf8', (err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to save auto response file' });
        }
        res.redirect('/settings');
    });
});

app.post('/settings', (req, res) => {
    const newCommands = {
        CMD_GEMINI: req.body.CMD_GEMINI,
        CMD_GEMINI_IMG: req.body.CMD_GEMINI_IMG,
        CMD_STICKER: req.body.CMD_STICKER,
        CMD_TO_VOICE: req.body.CMD_TO_VOICE,
        CMD_COUNTRY: req.body.CMD_COUNTRY,
        CMD_TRANSLATE: req.body.CMD_TRANSLATE,
        CMD_WEATHER: req.body.CMD_WEATHER,
        CMD_SEO: req.body.CMD_SEO,
        CMD_WIKIPEDIA_SEARCH: req.body.CMD_WIKIPEDIA_SEARCH,
        CMD_WIKIPEDIA_IMG: req.body.CMD_WIKIPEDIA_IMG,
        CMD_WIKIPEDIA_AI: req.body.CMD_WIKIPEDIA_AI,
        CMD_TWDLMP4: req.body.CMD_TWDLMP4,
        CMD_TWDLMP3: req.body.CMD_TWDLMP3,
        CMD_IGDLMP4: req.body.CMD_IGDLMP4,
        CMD_IGDLMP3: req.body.CMD_IGDLMP3,
        CMD_TKDLMP4: req.body.CMD_TKDLMP4,
        CMD_TKDLMP3: req.body.CMD_TKDLMP3,
        CMD_VMDLMP4: req.body.CMD_VMDLMP4,
        CMD_VMDLMP3: req.body.CMD_VMDLMP3,
        CMD_VMDLMP3: req.body.CMD_FBDLMP4,
        CMD_VMDLMP3: req.body.CMD_FBDLMP3,
        CMD_VMDLMP3: req.body.CMD_YTDLMP4,
        CMD_VMDLMP3: req.body.CMD_YTDLMP3,
    };

    fs.readFile(configPath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read config file' });
        }
        const config = JSON.parse(data);
        config.cmd = { ...config.cmd, ...newCommands };
        fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8', (err) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to write config file' });
            }
            res.redirect('/settings');
        });
    });
});

app.post('/settings-utl', (req, res) => {
    const newCommands = {
        QR_URL: req.body.QR_URL,
        SELF: req.body.SELF,
        GEMINI_API: req.body.GEMINI_API,
        GEMINI_PROMPT: req.body.GEMINI_PROMPT,
        TO_VOICE: req.body.TO_VOICE,
    };

    fs.readFile(configPath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read config file' });
        }
        const config = JSON.parse(data);
        config.settings = { ...config.settings, ...newCommands };
        fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8', (err) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to write config file' });
            }
            res.redirect('/settings');
        });
    });
});

app.put('/restart-server', (req, res) => {
    res.json({ success: true, message: 'Server is restarting...' });
    setTimeout(() => {
        process.exit(0);
    }, 1000);
});

app.delete('/delete-auth-info', (req, res) => {
    const authInfoPath = path.join(__dirname, 'auth_info');
    fs.rm(authInfoPath, { recursive: true, force: true }, (err) => {
        if (err) {
            console.error('Failed to delete Auth:', err);
            return res.status(500).json({ success: false, message: 'Failed to delete Auth' });
        }
        console.log('Auth deleted successfully');
        
        res.json({ success: true, message: 'Auth deleted, restarting server...' });
        setTimeout(() => {
            process.exit(0);
        }, 1000);
    });
});
