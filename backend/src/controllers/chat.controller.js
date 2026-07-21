'use strict';
const Contact = require('../models/Contact.model');
const Message = require('../models/Message.model');

/**
 * Vérifie que l'utilisateur est bien l'un des deux participants
 * d'une conversation approuvée. Retourne le contact ou null.
 */
async function resolveConversation(contactId, userId) {
  const contact = await Contact.findById(contactId).lean();
  if (!contact) return null;
  if (contact.status !== 'approved') return null;
  const isParticipant =
    contact.owner.toString()     === userId.toString() ||
    contact.requester.toString() === userId.toString();
  if (!isParticipant) return null;
  return contact;
}

/* ─── GET /api/chat/:contactId/messages ──────────────────────────────────── */
const getMessages = async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const userId = req.user._id;

    const contact = await resolveConversation(contactId, userId);
    if (!contact) {
      return res.status(403).json({
        success: false,
        message: 'Conversation introuvable ou accès refusé.',
      });
    }

    const { before, limit = 50 } = req.query;
    const filter = { contact: contactId };
    if (before) filter.createdAt = { $lt: new Date(before) };

    const messages = await Message.find(filter)
      .sort({ createdAt: 1 })
      .limit(Math.min(Number(limit), 100))
      .populate('sender', 'name')
      .lean();

    // Marquer les messages non lus reçus par cet utilisateur comme lus
    await Message.updateMany(
      { contact: contactId, sender: { $ne: userId }, read: false },
      { $set: { read: true } }
    );

    return res.status(200).json({
      success: true,
      data: { messages, contactId },
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'ID invalide.' });
    }
    next(err);
  }
};

/* ─── POST /api/chat/:contactId/messages (REST fallback) ─────────────────── */
const sendMessage = async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const userId = req.user._id;
    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ success: false, message: 'Le message est vide.' });
    }

    const contact = await resolveConversation(contactId, userId);
    if (!contact) {
      return res.status(403).json({
        success: false,
        message: 'Conversation introuvable ou accès refusé.',
      });
    }

    const message = await Message.create({
      contact: contactId,
      sender:  userId,
      content: content.trim(),
    });
    await message.populate('sender', 'name');

    return res.status(201).json({
      success: true,
      data: { message },
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'ID invalide.' });
    }
    next(err);
  }
};

/* ─── GET /api/chat/:contactId/unread ────────────────────────────────────── */
const getUnreadCount = async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const userId = req.user._id;

    const contact = await resolveConversation(contactId, userId);
    if (!contact) {
      return res.status(403).json({ success: false, message: 'Accès refusé.' });
    }

    const count = await Message.countDocuments({
      contact: contactId,
      sender:  { $ne: userId },
      read:    false,
    });

    return res.status(200).json({ success: true, data: { unread: count } });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMessages, sendMessage, getUnreadCount };
