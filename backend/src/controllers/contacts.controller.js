const Contact = require('../models/Contact.model');
const Post    = require('../models/Post.model');

/**
 * POST /api/contacts
 * Envoyer une demande de contact pour une annonce.
 * Requiert authenticateJWT.
 */
const createContactRequest = async (req, res, next) => {
  try {
    const { postId, message } = req.body;
    const requesterId = req.user._id;

    // Vérifier que le post existe et est actif
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Annonce introuvable.' });
    }
    if (post.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Cette annonce n\'est plus active.' });
    }

    // Empêcher l'auteur de se contacter lui-même
    if (post.author.toString() === requesterId.toString()) {
      return res.status(400).json({ success: false, message: 'Vous ne pouvez pas contacter votre propre annonce.' });
    }

    // Vérifier si une demande existe déjà
    const existing = await Contact.findOne({ post: postId, requester: requesterId });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Vous avez déjà envoyé une demande de contact pour cette annonce.' });
    }

    const contact = await Contact.create({
      post:      postId,
      requester: requesterId,
      owner:     post.author,
      message:   message || '',
    });

    await contact.populate([
      { path: 'post',      select: 'title type' },
      { path: 'requester', select: 'name email' },
    ]);

    return res.status(201).json({
      success: true,
      message: 'Demande de contact envoyée avec succès.',
      data: { contact },
    });
  } catch (error) {
    if (error.code === 11000) {
      // Index unique — doublon race condition
      return res.status(409).json({ success: false, message: 'Demande de contact déjà envoyée.' });
    }
    next(error);
  }
};

module.exports = { createContactRequest };
