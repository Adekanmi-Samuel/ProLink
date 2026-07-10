const app = require('../server.js');

// Socket.IO for Vercel — attach to the Express app so polling requests work
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

// Create a Socket.IO instance attached to the Express app
const io = new Server(app, {
  cors: {
    origin: [
      'http://localhost:3000',
      'https://prolink-eight.vercel.app',
      process.env.FRONTEND_ORIGIN,
    ].filter(Boolean),
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['polling'],
  allowEIO3: true,
});

// Socket.IO auth middleware
io.use((socket, next) => {
  let token = socket.handshake.auth?.token;
  if (!token) {
    const cookieHeader = socket.handshake.headers?.cookie;
    if (cookieHeader) {
      const match = cookieHeader.match(/(?:^|;\s*)token=([^;]*)/);
      if (match) token = match[1];
    }
  }
  if (!token) return next(new Error('Authentication required'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.user.id;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

// Initialize socket handlers
try {
  const { initializeSocketHandlers } = require('../src/socket/handlers');
  initializeSocketHandlers(io);
} catch (e) {
  console.error('Socket.IO init failed:', e.message);
}

module.exports = app;
