const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const pinoHttp = require('pino-http');
const logger = require('./config/logger');
const { apiLimiter, authLimiter } = require('./config/rate-limiter');
const authRoutes    = require('./routes/auth.routes');
const postRoutes    = require('./routes/posts.routes');
const contactRoutes = require('./routes/contacts.routes');
const uploadRoutes  = require('./routes/upload.routes');
const reportRoutes  = require('./routes/reports.routes');

const app = express();

// ── Security headers ─────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((s) => s.trim());

app.use(cors({
  origin(origin, callback) {
    // allow requests with no origin (curl, server-to-server)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// ── Body parsing ────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// ── Request logging (Pino) ──────────────────────────────────────────────
app.use(pinoHttp({ logger }));

// ── Global rate limiter ─────────────────────────────────────────────────
app.use('/api/', apiLimiter);

// ── Auth rate limiter (stricter) ────────────────────────────────────────
app.use('/api/auth/', authLimiter);

// ── Static files (uploaded images) ──────────────────────────────────────
app.use('/uploads', express.static('uploads'));

// ── Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/posts',    postRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/upload',   uploadRoutes);
app.use('/api/chat',     require('./routes/chat.routes'));
app.use('/api/reports',  reportRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ── 404 handler ─────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global error handler ────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error({ err, reqId: req.id }, err.message);
  const status = err.status || (err.name === 'CorsError' ? 403 : 500);
  res.status(status).json({
    success: false,
    message: status === 500 ? 'Internal Server Error' : err.message,
  });
});

module.exports = app;
