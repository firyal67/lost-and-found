'use strict';
const rateLimit = require('express-rate-limit');

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Standard 429 response body used by all limiters.
 * `retryAfter` is in seconds (from the Retry-After header).
 */
const message429 = (msg) => (_req, res) => {
  const retryAfter = Math.ceil(
    Number(res.getHeader('Retry-After') ?? 0)
  );
  res.status(429).json({
    success: false,
    message: msg,
    retryAfter,
  });
};

// ── Global API limiter ────────────────────────────────────────────────────────
// Applied to every /api/* route in app.js
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,          // 15 min
  max:      isDev ? 2000 : 200,
  standardHeaders: true,
  legacyHeaders:   false,
  handler: message429('Too many requests. Please try again later.'),
});

// ── Auth limiter ──────────────────────────────────────────────────────────────
// Applied to /api/auth/* (login, register, forgot-password, reset-password)
// Stricter to prevent brute-force and credential stuffing.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,          // 15 min
  max:      isDev ? 100 : 20,         // in dev: 100 attempts before blocking
  standardHeaders: true,
  legacyHeaders:   false,
  handler: message429('Too many authentication attempts. Please try again in 15 minutes.'),
});

// ── Post creation limiter ─────────────────────────────────────────────────────
// Prevents spam posting.
const postCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,          // 1 hour
  max:      isDev ? 200 : 10,         // 10 posts per hour in prod
  standardHeaders: true,
  legacyHeaders:   false,
  handler: message429('You have created too many posts. Please wait before posting again.'),
});

// ── Report creation limiter ───────────────────────────────────────────────────
// Prevents report flooding.
const reportCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,          // 1 hour
  max:      isDev ? 200 : 20,         // 20 reports per hour in prod
  standardHeaders: true,
  legacyHeaders:   false,
  handler: message429('You have submitted too many reports. Please wait before reporting again.'),
});

// ── Contact request limiter ───────────────────────────────────────────────────
// Prevents spam contact requests.
const contactCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,          // 1 hour
  max:      isDev ? 200 : 15,         // 15 contact requests per hour in prod
  standardHeaders: true,
  legacyHeaders:   false,
  handler: message429('You have sent too many contact requests. Please wait before sending more.'),
});

// ── Admin action limiter ──────────────────────────────────────────────────────
// Applied to destructive admin actions (ban, unban, delete post).
const adminActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,          // 15 min
  max:      isDev ? 500 : 60,         // 60 admin actions per 15 min in prod
  standardHeaders: true,
  legacyHeaders:   false,
  handler: message429('Too many admin actions in a short period. Please slow down.'),
});

// ── Upload limiter ────────────────────────────────────────────────────────────
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,          // 1 hour
  max:      isDev ? 200 : 10,
  standardHeaders: true,
  legacyHeaders:   false,
  handler: message429('Upload limit reached. Please try again later.'),
});

module.exports = {
  apiLimiter,
  authLimiter,
  uploadLimiter,
  postCreateLimiter,
  reportCreateLimiter,
  contactCreateLimiter,
  adminActionLimiter,
};
