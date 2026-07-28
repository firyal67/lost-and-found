'use strict';
/**
 * Ownership middleware — RBAC resource-level access control.
 *
 * Provides middleware factories that verify a requesting user owns
 * the target resource, or has an elevated role (admin) that bypasses
 * the check. These middlewares are meant to be composed AFTER
 * `authenticateJWT`, which sets `req.user`.
 *
 * Usage (route file):
 *   const { checkPostOwner, checkContactOwner } = require('../middleware/ownership.middleware');
 *
 *   router.patch('/:id', authenticateJWT, checkPostOwner(), updatePost);
 *   router.patch('/:id/approve', authenticateJWT, checkContactOwner(), approveContact);
 */

const Post    = require('../models/Post.model');
const Contact = require('../models/Contact.model');

/* ── helpers ─────────────────────────────────────────────────────────────── */

/**
 * Returns true when the requesting user should bypass ownership checks.
 * Currently only admins bypass; extend this as needed (e.g. 'moderator').
 */
const isPrivileged = (user) => user?.role === 'admin';

/* ── Post ownership ──────────────────────────────────────────────────────── */

/**
 * checkPostOwner()
 *
 * Loads the Post identified by `req.params.id` and checks that
 * `req.user` is the author. Admins bypass the ownership check.
 *
 * Attaches `req.post` so downstream handlers can reuse the loaded document.
 *
 * @param {object} [options]
 * @param {string} [options.paramName='id']  — name of the route param holding the post ID
 * @param {boolean} [options.allowAdmin=true] — whether admins bypass ownership
 */
const checkPostOwner = ({ paramName = 'id', allowAdmin = true } = {}) =>
  async (req, res, next) => {
    try {
      const { [paramName]: postId } = req.params;

      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({ success: false, message: 'Annonce introuvable.' });
      }

      const isOwner = post.author.toString() === req.user._id.toString();
      if (!isOwner && !(allowAdmin && isPrivileged(req.user))) {
        return res.status(403).json({ success: false, message: 'Accès refusé. Vous n\'êtes pas l\'auteur de cette annonce.' });
      }

      // Attach to request so the next handler doesn't need to re-fetch
      req.post = post;
      next();
    } catch (err) {
      if (err.name === 'CastError') {
        return res.status(400).json({ success: false, message: 'ID invalide.' });
      }
      next(err);
    }
  };

/* ── Contact ownership ───────────────────────────────────────────────────── */

/**
 * checkContactOwner()
 *
 * Loads the Contact identified by `req.params.id` and checks that
 * `req.user` is the **owner** (the person who posted the original ad).
 * Only the owner of an ad can approve or reject a contact request.
 * Admins bypass the check.
 *
 * Attaches `req.contact` so downstream handlers can reuse the loaded document.
 *
 * @param {object} [options]
 * @param {string} [options.paramName='id']   — route param holding the contact ID
 * @param {boolean} [options.allowAdmin=true] — whether admins bypass ownership
 */
const checkContactOwner = ({ paramName = 'id', allowAdmin = true } = {}) =>
  async (req, res, next) => {
    try {
      const { [paramName]: contactId } = req.params;

      const contact = await Contact.findById(contactId);
      if (!contact) {
        return res.status(404).json({ success: false, message: 'Demande de contact introuvable.' });
      }

      const isOwner = contact.owner.toString() === req.user._id.toString();
      if (!isOwner && !(allowAdmin && isPrivileged(req.user))) {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé. Seul le propriétaire de l\'annonce peut effectuer cette action.',
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

/* ── Generic / extensible ────────────────────────────────────────────────── */

/**
 * checkOwnerOf(Model, ownerField)
 *
 * Generic ownership middleware factory for any Mongoose model.
 * Loads the document and verifies that `doc[ownerField]` equals `req.user._id`.
 *
 * @param {import('mongoose').Model} Model
 * @param {string} ownerField        — the field on the document that stores the owner ObjectId
 * @param {object} [options]
 * @param {string} [options.paramName='id']
 * @param {boolean} [options.allowAdmin=true]
 * @param {string} [options.docKey]         — key under which to attach the doc to req (defaults to model name lowercased)
 */
const checkOwnerOf = (Model, ownerField, { paramName = 'id', allowAdmin = true, docKey } = {}) =>
  async (req, res, next) => {
    try {
      const { [paramName]: docId } = req.params;

      const doc = await Model.findById(docId);
      if (!doc) {
        return res.status(404).json({ success: false, message: 'Ressource introuvable.' });
      }

      const isOwner = doc[ownerField]?.toString() === req.user._id.toString();
      if (!isOwner && !(allowAdmin && isPrivileged(req.user))) {
        return res.status(403).json({ success: false, message: 'Accès refusé.' });
      }

      const key = docKey ?? Model.modelName.toLowerCase();
      req[key] = doc;
      next();
    } catch (err) {
      if (err.name === 'CastError') {
        return res.status(400).json({ success: false, message: 'ID invalide.' });
      }
      next(err);
    }
  };

module.exports = { checkPostOwner, checkContactOwner, checkOwnerOf, isPrivileged };
