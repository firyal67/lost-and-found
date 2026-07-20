const express = require('express');
const router = express.Router();
const { createPost, getPosts, getPostById, deletePost, resolvePost, matchPost, getMatchingSuggestions, getPostMatches } = require('../controllers/posts.controller');
const validate = require('../middleware/validate.middleware');
const { createPostValidator } = require('../validators/posts.validators');
const { authenticateJWT } = require('../middleware/auth.middleware');

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
router.post('/', authenticateJWT, validate(createPostValidator), createPost);

// DELETE /api/posts/:id — Supprimer une annonce (owner ou admin)
router.delete('/:id', authenticateJWT, deletePost);

// PATCH /api/posts/:id/resolve — Clôturer une annonce (owner ou admin)
router.patch('/:id/resolve', authenticateJWT, resolvePost);

// PATCH /api/posts/:id/match — Marquer comme mise en correspondance (owner ou admin)
router.patch('/:id/match', authenticateJWT, matchPost);

module.exports = router;
