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
const { checkContactOwner } = require('../middleware/ownership.middleware');
const { contactCreateLimiter } = require('../config/rate-limiter');

// POST /api/contacts — Envoyer une demande de contact (authentifié)
router.post('/', authenticateJWT, contactCreateLimiter, validate(createContactValidator), createContactRequest);

// GET /api/contacts — Mes demandes (owner ou requester)
router.get('/', authenticateJWT, getMyContacts);

// GET /api/contacts/post/:postId — Demande existante pour une annonce
// IMPORTANT: must be BEFORE /:id to prevent "post" being treated as an ID
router.get('/post/:postId', authenticateJWT, getContactForPost);

// PATCH /api/contacts/:id/approve — Approuver une demande (owner de l'annonce ou admin)
router.patch('/:id/approve', authenticateJWT, checkContactOwner(), approveContact);

// PATCH /api/contacts/:id/reject — Rejeter une demande (owner de l'annonce ou admin)
router.patch('/:id/reject', authenticateJWT, checkContactOwner(), rejectContact);

module.exports = router;
