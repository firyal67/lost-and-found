'use strict';
const { body, param, query } = require('express-validator');
const { stripTags } = require('../middleware/validate.middleware');

/* ── POST /api/chat/:contactId/messages ─────────────────────────────────── */
const sendMessageValidator = [
  param('contactId')
    .isMongoId().withMessage('ID de conversation invalide'),

  body('content')
    .trim()
    .customSanitizer(stripTags)
    .notEmpty().withMessage('Le message ne peut pas être vide')
    .isLength({ max: 2000 }).withMessage('Le message ne doit pas dépasser 2000 caractères'),
];

/* ── GET /api/chat/:contactId/messages ──────────────────────────────────── */
const getMessagesValidator = [
  param('contactId')
    .isMongoId().withMessage('ID de conversation invalide'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit doit être entre 1 et 100')
    .toInt(),

  query('before')
    .optional()
    .isISO8601().withMessage('Format de date invalide pour "before"'),
];

module.exports = { sendMessageValidator, getMessagesValidator };
