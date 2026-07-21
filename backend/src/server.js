'use strict';
require('dotenv').config();

const http       = require('http');
const { Server } = require('socket.io');
const jwt        = require('jsonwebtoken');

const app        = require('./app');
const connectDB  = require('./config/db');
const logger     = require('./config/logger');
const Message    = require('./models/Message.model');
const Contact    = require('./models/Contact.model');

const PORT = process.env.PORT || 5000;

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((s) => s.trim());

// ── HTTP server ──────────────────────────────────────────────────────────────
const server = http.createServer(app);

// ── Socket.IO server ─────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin:      ALLOWED_ORIGINS,
    credentials: true,
  },
  // Ping every 25 s, disconnect after 60 s of silence
  pingInterval: 25000,
  pingTimeout:  60000,
});

// ── Socket.IO JWT auth middleware ─────────────────────────────────────────────
io.use((socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Support both {user:{id,role}} and {userId} payloads
    socket.userId =
      decoded?.user?.id   ||
      decoded?.user?._id  ||
      decoded?.userId     ||
      decoded?.id;

    if (!socket.userId) {
      return next(new Error('Invalid token payload'));
    }

    next();
  } catch {
    next(new Error('Invalid or expired token'));
  }
});

// ── Socket.IO connection handler ──────────────────────────────────────────────
io.on('connection', (socket) => {
  logger.info({ socketId: socket.id, userId: socket.userId }, 'Socket connected');

  /* ── Join conversation room ──────────────────────────────────────────────
   * Client emits: join_conversation  { contactId }
   * Server joins: room = `conv:${contactId}`
   * Only allowed if the user is owner or requester of an approved contact.
   */
  socket.on('join_conversation', async ({ contactId }) => {
    try {
      if (!contactId) return;

      const contact = await Contact.findById(contactId).lean();
      if (!contact || contact.status !== 'approved') return;

      const isParticipant =
        contact.owner.toString()     === String(socket.userId) ||
        contact.requester.toString() === String(socket.userId);

      if (!isParticipant) return;

      const room = `conv:${contactId}`;
      socket.join(room);
      logger.info({ socketId: socket.id, room }, 'Joined conversation room');
    } catch (err) {
      logger.error({ err }, 'join_conversation error');
    }
  });

  /* ── Leave conversation room ─────────────────────────────────────────────
   * Client emits: leave_conversation  { contactId }
   */
  socket.on('leave_conversation', ({ contactId }) => {
    const room = `conv:${contactId}`;
    socket.leave(room);
  });

  /* ── Send message ────────────────────────────────────────────────────────
   * Client emits: send_message  { contactId, content, tempId }
   * Server saves to DB, broadcasts to room:
   *   - new_message  → all clients in conv room (including sender)
   *   - message_error → only the sending socket (on failure)
   */
  socket.on('send_message', async ({ contactId, content, tempId }) => {
    try {
      if (!contactId || !content?.trim()) return;

      // Security: re-verify participation
      const contact = await Contact.findById(contactId).lean();
      if (!contact || contact.status !== 'approved') return;

      const isParticipant =
        contact.owner.toString()     === String(socket.userId) ||
        contact.requester.toString() === String(socket.userId);
      if (!isParticipant) return;

      // Persist
      const message = await Message.create({
        contact: contactId,
        sender:  socket.userId,
        content: content.trim(),
      });
      await message.populate('sender', 'name');

      const room = `conv:${contactId}`;
      // Broadcast to everyone in the room (sender included via socket.to + emit)
      io.to(room).emit('new_message', {
        ...message.toJSON(),
        tempId, // lets the sender reconcile their optimistic message
      });
    } catch (err) {
      logger.error({ err }, 'send_message error');
      socket.emit('message_error', { tempId, error: 'Échec de l\'envoi du message.' });
    }
  });

  /* ── Typing indicators ───────────────────────────────────────────────────
   * Client emits: typing  { contactId, isTyping }
   * Server relays to other participants only.
   */
  socket.on('typing', ({ contactId, isTyping }) => {
    const room = `conv:${contactId}`;
    socket.to(room).emit('typing', { userId: socket.userId, isTyping });
  });

  socket.on('disconnect', (reason) => {
    logger.info({ socketId: socket.id, reason }, 'Socket disconnected');
  });

  socket.on('error', (err) => {
    logger.error({ err, socketId: socket.id }, 'Socket error');
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
connectDB().then(() => {
  server.listen(PORT, () => {
    logger.info({ port: PORT }, 'Server started');
  });
});
