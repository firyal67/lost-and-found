const express = require('express');
const router = express.Router();
const { createPost, getPosts, getPostById, deletePost, resolvePost } = require('../controllers/posts.controller');
const validate = require('../middleware/validate.middleware');
const { createPostValidator } = require('../validators/posts.validators');
const { authenticateJWT } = require('../middleware/auth.middleware');

// GET /api/posts — Lister les annonces (public)
router.get('/', getPosts);

// GET /api/posts/:id — Détail d'une annonce (public)
router.get('/:id', getPostById);

// POST /api/posts — Créer une annonce (authentifié)
router.post('/', authenticateJWT, validate(createPostValidator), createPost);

// DELETE /api/posts/:id — Supprimer une annonce (owner ou admin)
router.delete('/:id', authenticateJWT, deletePost);

// PATCH /api/posts/:id/resolve — Clôturer une annonce résolue (owner ou admin)
router.patch('/:id/resolve', authenticateJWT, resolvePost);

module.exports = router;
