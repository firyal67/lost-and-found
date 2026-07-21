'use strict';
const express = require('express');
const router  = express.Router();
const { getMessages, sendMessage, getUnreadCount } = require('../controllers/chat.controller');
const { authenticateJWT } = require('../middleware/auth.middleware');

// Toutes les routes chat nécessitent une authentification
router.use(authenticateJWT);

// GET  /api/chat/:contactId/messages  — historique de messages
router.get('/:contactId/messages', getMessages);

// POST /api/chat/:contactId/messages  — envoyer (fallback REST si Socket.IO indisponible)
router.post('/:contactId/messages', sendMessage);

// GET  /api/chat/:contactId/unread    — nombre de messages non lus
router.get('/:contactId/unread', getUnreadCount);

module.exports = router;
