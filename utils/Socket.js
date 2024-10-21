const { Server } = require('socket.io');
const http = require('http');

const createSocketServer = (server) => {
    const io = new Server(server);

    io.on('connection', (socket) => {
        socket.on('joinRoom', (sessionId) => {
            socket.join(sessionId);
        });
    });

    return io;
};

module.exports = createSocketServer;
