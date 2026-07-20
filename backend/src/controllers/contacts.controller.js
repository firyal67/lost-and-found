const Contact = require('../models/Contact.model');
const Post    = require('../models/Post.model');
const User    = require('../models/User.model');

/**
 * POST /api/contacts
 * Envoyer une demande de contact pour une annonce.
 * Requiert authenticateJWT.
 */
const createContactRequest = async (req, res, next) => {
  try {
    const { postId, message } = req.body;
    const requesterId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Annonce introuvable.' });
    }
    if (post.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Cette annonce n\'est plus active.' });
    }
    if (post.author.toString() === requesterId.toString()) {
      return res.status(400).json({ success: false, message: 'Vous ne pouvez pas contacter votre propre annonce.' });
    }

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
      { path: 'post',      select: 'title type city objectType' },
      { path: 'requester', select: 'name email' },
    ]);

    return res.status(201).json({
      success: true,
      message: 'Demande de contact envoyée avec succès.',
      data: { contact },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Demande de contact déjà envoyée.' });
    }
    next(error);
  }
};

/**
 * GET /api/contacts
 * Retourne les demandes de contact de l'utilisateur connecté.
 * - En tant que owner  : les demandes reçues sur ses annonces
 * - En tant que requester : les demandes qu'il a envoyées
 * Query: ?role=owner | ?role=requester (défaut: les deux)
 */
const getMyContacts = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { role, status } = req.query;

    let filter = {};
    if (role === 'owner')     filter = { owner:     userId };
    else if (role === 'requester') filter = { requester: userId };
    else filter = { $or: [{ owner: userId }, { requester: userId }] };

    if (status) filter.status = status;

    const contacts = await Contact.find(filter)
      .sort({ createdAt: -1 })
      .populate({ path: 'post',      select: 'title type city objectType status _id' })
      .populate({ path: 'requester', select: 'name email' })
      .populate({ path: 'owner',     select: 'name email' })
      .lean();

    // Masquer revealedEmail/revealedPhone au requester si status != approved
    const sanitized = contacts.map((c) => {
      const isOwner = c.owner._id.toString() === userId.toString();
      if (!isOwner && c.status !== 'approved') {
        return { ...c, revealedEmail: null, revealedPhone: null };
      }
      return c;
    });

    return res.status(200).json({
      success: true,
      data: { contacts: sanitized, total: sanitized.length },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/contacts/post/:postId
 * Retourne la demande de contact de l'utilisateur connecté pour une annonce donnée.
 * Utilisé par le ContactModal pour savoir si une demande existe déjà.
 */
const getContactForPost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const contact = await Contact.findOne({ post: postId, requester: userId })
      .populate({ path: 'post', select: 'title type _id' })
      .lean();

    if (!contact) {
      return res.status(200).json({ success: true, data: { contact: null } });
    }

    // Masquer les coordonnées si pas encore approuvé
    const safe = contact.status !== 'approved'
      ? { ...contact, revealedEmail: null, revealedPhone: null }
      : contact;

    return res.status(200).json({ success: true, data: { contact: safe } });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'ID invalide.' });
    }
    next(error);
  }
};

/**
 * PATCH /api/contacts/:id/approve
 * Approuve une demande de contact et révèle les coordonnées du propriétaire.
 * Réservé au owner de l'annonce.
 */
const approveContact = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const contact = await Contact.findById(id).populate('post', 'contactEmail contactPhone');
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Demande introuvable.' });
    }
    if (contact.owner.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Accès refusé.' });
    }
    if (contact.status === 'approved') {
      return res.status(409).json({ success: false, message: 'Cette demande est déjà approuvée.' });
    }

    contact.status = 'approved';

    // Révéler les coordonnées de l'auteur de l'annonce
    const owner = await User.findById(contact.owner).select('email phone');
    contact.revealedEmail = contact.post?.contactEmail || owner?.email || null;
    contact.revealedPhone = contact.post?.contactPhone || owner?.phone || null;

    await contact.save();
    await contact.populate([
      { path: 'post',      select: 'title type city objectType _id' },
      { path: 'requester', select: 'name email' },
      { path: 'owner',     select: 'name email' },
    ]);

    return res.status(200).json({
      success: true,
      message: 'Demande approuvée. Les coordonnées ont été partagées.',
      data: { contact },
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'ID invalide.' });
    }
    next(error);
  }
};

/**
 * PATCH /api/contacts/:id/reject
 * Rejette une demande de contact.
 * Réservé au owner de l'annonce.
 */
const rejectContact = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const contact = await Contact.findById(id);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Demande introuvable.' });
    }
    if (contact.owner.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Accès refusé.' });
    }
    if (contact.status === 'rejected') {
      return res.status(409).json({ success: false, message: 'Cette demande est déjà rejetée.' });
    }

    contact.status = 'rejected';
    contact.revealedEmail = null;
    contact.revealedPhone = null;
    await contact.save();

    await contact.populate([
      { path: 'post',      select: 'title type city objectType _id' },
      { path: 'requester', select: 'name email' },
      { path: 'owner',     select: 'name email' },
    ]);

    return res.status(200).json({
      success: true,
      message: 'Demande rejetée.',
      data: { contact },
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'ID invalide.' });
    }
    next(error);
  }
};

module.exports = {
  createContactRequest,
  getMyContacts,
  getContactForPost,
  approveContact,
  rejectContact,
};
