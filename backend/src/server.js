const http = require('http');
const { Server } = require('socket.io');
const { app } = require('./app');
const { env } = require('./config/env');
const { connectToDatabase } = require('./config/database');
const { initializeSocketServer } = require('./sockets');

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: env.clientUrl,
    credentials: true,
  },
});

initializeSocketServer(io);

async function startServer() {
  try {
    await connectToDatabase();
  } catch (error) {
    console.error('MongoDB connection failed. The API will start without database access.', error.message);
  }

  httpServer.listen(env.port, () => {
    console.log(`Instant Mechanic API listening on port ${env.port}`);
  });
}

startServer();
