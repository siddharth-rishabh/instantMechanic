const jwt = require('jsonwebtoken');
const { env } = require('../config/env');

let socketServer;

function initializeSocketServer(io) {
  socketServer = io;
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token || !env.jwtSecret) return next(new Error('Authentication required.'));
    try {
      socket.user = jwt.verify(token, env.jwtSecret);
      return next();
    } catch {
      return next(new Error('Invalid or expired authentication token.'));
    }
  });
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}

function emitEvent(event, payload) {
  if (socketServer) {
    socketServer.emit(event, payload);
  }
}

module.exports = { emitEvent, initializeSocketServer };
