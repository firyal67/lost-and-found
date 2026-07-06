const express = require('express');
const router = express.Router();
const { register, login, refresh, logout, getMe } = require('../controllers/auth.controller');
const validate = require('../middleware/validate.middleware');
const { registerValidator, loginValidator } = require('../validators/auth.validators');
const { authenticateJWT } = require('../middleware/auth.middleware');

// US-01 — Inscription
router.post('/register', validate(registerValidator), register);

// US-02 — Connexion
router.post('/login', validate(loginValidator), login);

// Rafraîchir l'access token via cookie refresh token
router.post('/refresh', refresh);

// Déconnexion (invalide le refresh token)
router.post('/logout', logout);

// Profil de l'utilisateur connecté
router.get('/me', authenticateJWT, getMe);

module.exports = router;
