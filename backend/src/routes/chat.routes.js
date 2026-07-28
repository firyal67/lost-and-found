'use strict';
const express = require('express');
const router  = express.Router();
const { getMessages, sendMessage, getUnreadCount } = require('../controllers/chat.controller');
const { authenticateJWT } = require('../middleware/auth.middleware');
const { sendMessageValidator, getMessagesValidator } = require('../validators/chat.validators');
const validate = require('../middleware/validate.middleware');
const Contact = require('../models/Contact.model');

// All chat routes require authentication
router.use(authenticateJWT);

/**
 * Inline participant middleware — verifies the requesting user is one of the
 * two participants of an approved contact conversation before reaching the
 * controller. Attaches `req.contact` for downstream use.
 *
 * Returns 403 if the contact doesn't exist, isn't approved, or the user is
 * not a participant. This replaces the duplicated resolveConversation() call
 * inside each controller action.
 */
const requireConversationAccess = async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const userId = req.user._id;

    const contact = await Contact.findById(contactId).lean();

    if (!contact || contact.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Conversation introuvable ou accès refusé.',
      });
    }

    const isParticipant =
      contact.owner.toString()     === userId.toString() ||
      contact.requester.toString() === userId.toString();

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas participant de cette conversation.',
      });
    }

    req.contact = contact;
    next();
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'ID invalide.' });
    }
    next(err);
  }
};

// GET  /api/chat/:contactId/messages  — historique de messages
router.get('/:contactId/messages', validate(getMessagesValidator), requireConversationAccess, getMessages);

// POST /api/chat/:contactId/messages  — envoyer (fallback REST si Socket.IO indisponible)
router.post('/:contactId/messages', validate(sendMessageValidator), requireConversationAccess, sendMessage);

// GET  /api/chat/:contactId/unread    — nombre de messages non lus
router.get('/:contactId/unread', requireConversationAccess, getUnreadCount);

module.exports = router;
