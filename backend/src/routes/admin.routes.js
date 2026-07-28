'use strict';
const express = require('express');
const router  = express.Router();
const { getUsers, banUser, unbanUser, getMetrics } = require('../controllers/admin.controller');
const { getAuditLog } = require('../controllers/auditLog.controller');
const { authenticateJWT, authorizeRole } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { banUserValidator, unbanUserValidator, getUsersValidator } = require('../validators/admin.validators');
const { adminActionLimiter } = require('../config/rate-limiter');

// All admin routes require authentication + admin role
router.use(authenticateJWT, authorizeRole('admin'));

// GET  /api/admin/users          — paginated user list
router.get('/users', validate(getUsersValidator), getUsers);

// PATCH /api/admin/users/:id/ban   — ban a user
router.patch('/users/:id/ban', adminActionLimiter, validate(banUserValidator), banUser);

// PATCH /api/admin/users/:id/unban — reactivate a banned user
router.patch('/users/:id/unban', adminActionLimiter, validate(unbanUserValidator), unbanUser);

// GET  /api/admin/metrics        — platform usage metrics
router.get('/metrics', getMetrics);

// GET  /api/admin/audit-log      — moderation audit trail
router.get('/audit-log', getAuditLog);

module.exports = router;
