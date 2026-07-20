const rateLimit = require('express-rate-limit');

const isDev = process.env.NODE_ENV !== 'production';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 2000 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev, // désactivé complètement en développement
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 500 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev, // désactivé complètement en développement
  message: { success: false, message: 'Too many authentication attempts. Please try again later.' },
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 200 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,
  message: { success: false, message: 'Upload limit reached. Please try again later.' },
});

module.exports = { apiLimiter, authLimiter, uploadLimiter };
