const express = require('express');
const router = express.Router();
const {
  createPost, getPosts, getPostById,
  deletePost, resolvePost, matchPost, updatePost, archivePost,
  getMatchingSuggestions, getPostMatches,
} = require('../controllers/posts.controller');
const validate = require('../middleware/validate.middleware');
const { createPostValidator, updatePostValidator } = require('../validators/posts.validators');
const { authenticateJWT } = require('../middleware/auth.middleware');
const { checkPostOwner } = require('../middleware/ownership.middleware');
const { postCreateLimiter } = require('../config/rate-limiter');

// GET /api/posts — Lister les annonces (public)
router.get('/', getPosts);

// GET /api/posts/matches — Suggestions lors de la création (public)
// IMPORTANT: doit être AVANT /:id pour éviter que "matches" soit interprété comme un ID
router.get('/matches', getMatchingSuggestions);

// GET /api/posts/:id — Détail d'une annonce (public)
router.get('/:id', getPostById);

// GET /api/posts/:id/matches — Correspondances d'une annonce existante (public)
router.get('/:id/matches', getPostMatches);

// POST /api/posts — Créer une annonce (authentifié)
router.post('/', authenticateJWT, postCreateLimiter, validate(createPostValidator), createPost);

// DELETE /api/posts/:id — Supprimer une annonce (owner ou admin)
router.delete('/:id', authenticateJWT, checkPostOwner(), deletePost);

// PATCH /api/posts/:id — Modifier une annonce (owner ou admin)
router.patch('/:id', authenticateJWT, checkPostOwner(), validate(updatePostValidator), updatePost);

// PATCH /api/posts/:id/resolve — Clôturer une annonce (owner ou admin)
router.patch('/:id/resolve', authenticateJWT, checkPostOwner(), resolvePost);

// PATCH /api/posts/:id/archive — Archiver une annonce (owner ou admin)
router.patch('/:id/archive', authenticateJWT, checkPostOwner(), archivePost);

// PATCH /api/posts/:id/match — Marquer comme mise en correspondance (owner ou admin)
router.patch('/:id/match', authenticateJWT, checkPostOwner(), matchPost);

module.exports = router;
