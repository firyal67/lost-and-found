const express = require('express');
const router  = express.Router();
const {
  createReport,
  getMyReports,
  getReports,
  updateReportStatus,
  getReportForPost,
  deleteReportedPost,
} = require('../controllers/reports.controller');
const validate       = require('../middleware/validate.middleware');
const { authenticateJWT, authorizeRole } = require('../middleware/auth.middleware');
const {
  createReportValidator,
  updateReportStatusValidator,
} = require('../validators/reports.validators');
const { reportCreateLimiter, adminActionLimiter } = require('../config/rate-limiter');

// POST /api/reports — Signaler une annonce (authentifié)
router.post(
  '/',
  authenticateJWT,
  reportCreateLimiter,
  validate(createReportValidator),
  createReport
);

// GET /api/reports/mine — Mes signalements (authentifié)
// IMPORTANT: doit être AVANT /:id pour éviter que "mine" soit interprété comme un ID
router.get('/mine', authenticateJWT, getMyReports);

// GET /api/reports/post/:postId/mine — Signalement existant pour une annonce (authentifié)
router.get('/post/:postId/mine', authenticateJWT, getReportForPost);

// GET /api/reports — Tous les signalements (admin uniquement)
router.get('/', authenticateJWT, authorizeRole('admin'), getReports);

// PATCH /api/reports/:id/status — Mettre à jour le statut (admin uniquement)
router.patch(
  '/:id/status',
  authenticateJWT,
  authorizeRole('admin'),
  adminActionLimiter,
  validate(updateReportStatusValidator),
  updateReportStatus
);

// DELETE /api/reports/:id/post — Supprimer l'annonce signalée + clôturer tous ses signalements (admin uniquement)
router.delete(
  '/:id/post',
  authenticateJWT,
  authorizeRole('admin'),
  adminActionLimiter,
  deleteReportedPost
);

module.exports = router;
