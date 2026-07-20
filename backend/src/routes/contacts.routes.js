const express = require('express');
const router  = express.Router();
const {
  createContactRequest,
  getMyContacts,
  getContactForPost,
  approveContact,
  rejectContact,
} = require('../controllers/contacts.controller');
const validate = require('../middleware/validate.middleware');
const { createContactValidator } = require('../validators/contacts.validators');
const { authenticateJWT } = require('../middleware/auth.middleware');

// POST /api/contacts — Envoyer une demande de contact
router.post('/', authenticateJWT, validate(createContactValidator), createContactRequest);

// GET /api/contacts — Mes demandes (owner ou requester)
router.get('/', authenticateJWT, getMyContacts);

// GET /api/contacts/post/:postId — Demande existante pour une annonce
router.get('/post/:postId', authenticateJWT, getContactForPost);

// PATCH /api/contacts/:id/approve — Approuver une demande
router.patch('/:id/approve', authenticateJWT, approveContact);

// PATCH /api/contacts/:id/reject — Rejeter une demande
router.patch('/:id/reject', authenticateJWT, rejectContact);

module.exports = router;
