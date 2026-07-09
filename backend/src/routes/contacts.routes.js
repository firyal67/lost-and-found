const express = require('express');
const router  = express.Router();
const { createContactRequest } = require('../controllers/contacts.controller');
const validate = require('../middleware/validate.middleware');
const { createContactValidator } = require('../validators/contacts.validators');
const { authenticateJWT } = require('../middleware/auth.middleware');

// POST /api/contacts — Envoyer une demande de contact
router.post('/', authenticateJWT, validate(createContactValidator), createContactRequest);

module.exports = router;
