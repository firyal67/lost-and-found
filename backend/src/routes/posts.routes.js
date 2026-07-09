const express = require('express');
const router = express.Router();
const { createPost } = require('../controllers/posts.controller');
const validate = require('../middleware/validate.middleware');
const { createPostValidator } = require('../validators/posts.validators');
const { authenticateJWT } = require('../middleware/auth.middleware');

// US-03 — Créer une annonce (objet perdu ou trouvé)
router.post('/', authenticateJWT, validate(createPostValidator), createPost);

module.exports = router;
