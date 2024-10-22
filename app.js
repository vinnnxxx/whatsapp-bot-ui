const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');
const createSocketServer = require('./utils/Socket');
const { createClient, clients, messages } = require('./config/Init');

const app = express();
const server = http.createServer(app);
const io = createSocketServer(server);
const port = 3000;

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', (req, res) => {
    const existingSessions = Object.keys(clients);
    const sessionIdFromCookie = req.cookies.sessionId;
	if (sessionIdFromCookie && clients[sessionIdFromCookie]) {
        return res.redirect(`/dashboard/${sessionIdFromCookie}`);
    }
    if (existingSessions.length > 0) {
        return res.redirect(`/dashboard/${existingSessions[0]}`);
    }
    res.render('index', { qrCodeUrl: null, sessionId: null, authenticated: false, error: null });
});

app.post('/register', (req, res) => {
    const { phoneNumber } = req.body;
    const sessionId = phoneNumber;
    const authFilePath = path.join(__dirname, `.wwebjs_auth/session-${sessionId}`);

    fs.access(authFilePath, fs.constants.F_OK, (err) => {
        if (!err) {
            const client = clients[phoneNumber];
            if (client) {
                client.getState().then(state => {
                    if (state === 'CONNECTED') {
                        return res.redirect(`/dashboard/${phoneNumber}`);
                    } else {
                        createClient(phoneNumber, res, io);
                    }
                }).catch(() => {
                    createClient(phoneNumber, res, io);
                });
            } else {
                createClient(phoneNumber, res, io);
            }
        } else {
            createClient(phoneNumber, res, io);
        }
    });
});

app.get('/dashboard/:sessionId', (req, res) => {
    const sessionId = req.params.sessionId;

    if (clients[sessionId]) {
        const sessionMessages = messages[sessionId] || [];
        res.render('dashboard', { sessionId, messages: sessionMessages });
    } else {
        if (req.query.delete === 'true') {
            const authFolderPath = path.join(__dirname, '.wwebjs_auth', `session-${sessionId}`);
            fs.rm(authFolderPath, { recursive: true, force: true }, (err) => {
                if (err) {
                    console.error(`Failed to delete auth folder: ${authFolderPath}`, err);
                } else {
                    console.log(`Auth folder deleted: ${authFolderPath}`);
                }
                res.redirect('/');
            });
        } else {
            res.render('confirm-delete', { sessionId });
        }
    }
});

app.get('/docs/:sessionId', (req, res) => {
    const sessionId = req.params.sessionId;
    const filePath = path.join(__dirname, 'database', 'docs.txt');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading docs.txt:', err);
            return res.status(500).send('Internal Server Error');
        }
        if (clients[sessionId]) {
            res.render('docs', { sessionId, DocsContent: data });
        } else {
            if (req.query.delete === 'true') {
                const authFolderPath = path.join(__dirname, '.wwebjs_auth', `session-${sessionId}`);
                fs.rm(authFolderPath, { recursive: true, force: true }, (err) => {
                    if (err) {
                        console.error(`Failed to delete auth folder: ${authFolderPath}`, err);
                    } else {
                        console.log(`Auth folder deleted: ${authFolderPath}`);
                    }
                    res.redirect('/');
                });
            } else {
                res.render('confirm-delete', { sessionId });
            }
        }
    });
});

app.post('/logout/:sessionId', (req, res) => {
    const sessionId = req.params.sessionId;
    const client = clients[sessionId];

    if (client) {
        client.logout().then(() => {
            delete clients[sessionId];
            console.log(`Client ${sessionId} has logged out.`);
			res.clearCookie('sessionId');
            res.redirect('/');
        }).catch((error) => {
            console.error('Logout error:', error);
            res.status(500).send('Error logging out.');
        });
    } else {
        const authFolderPath = path.join(__dirname, '.wwebjs_auth', `session-${sessionId}`);
        fs.rm(authFolderPath, { recursive: true, force: true }, (err) => {
            if (err) {
                console.error(`Failed to delete auth folder: ${authFolderPath}`, err);
            } else {
                console.log(`Auth folder deleted: ${authFolderPath}`);
            }
            res.redirect('/');
        });
    }
});

const initExistingClients = (existingSessionIds = []) => {
    existingSessionIds.forEach(sessionId => {
        if (!clients[sessionId]) {
            createClient(sessionId, { render: () => {} });
        }
    });
};

initExistingClients();

server.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

module.exports = { io };
