const express = require('express');
const { createClient, clients } = require('../config/Init');
const router = express.Router();

router.get('/', (req, res) => {
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

module.exports = router