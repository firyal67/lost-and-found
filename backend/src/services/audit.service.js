'use strict';
const AuditLog = require('../models/AuditLog.model');
const logger   = require('../config/logger');

/**
 * writeAuditLog(entry)
 *
 * Persists a single audit log entry. Failures are logged but never throw —
 * the moderation action has already succeeded and we must not roll it back
 * just because the audit write failed.
 *
 * @param {object} entry
 * @param {string}         entry.action       — one of AUDIT_ACTIONS
 * @param {ObjectId}       entry.performedBy  — admin user _id
 * @param {ObjectId}       [entry.targetUser]
 * @param {ObjectId}       [entry.targetPost]
 * @param {ObjectId}       [entry.targetReport]
 * @param {object}         [entry.details]    — any extra context
 * @param {string}         [entry.ip]
 * @param {string}         [entry.userAgent]
 */
const writeAuditLog = async (entry) => {
  try {
    await AuditLog.create(entry);
  } catch (err) {
    // Never let audit failures break the main request flow
    logger.error({ err, entry }, 'Failed to write audit log entry');
  }
};

/**
 * extractRequestMeta(req)
 * Pulls IP and User-Agent from an Express request for audit context.
 */
const extractRequestMeta = (req) => ({
  ip:        req.ip ?? req.headers['x-forwarded-for'] ?? null,
  userAgent: req.headers['user-agent'] ?? null,
});

module.exports = { writeAuditLog, extractRequestMeta };
