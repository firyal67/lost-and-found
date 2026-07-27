'use strict';
const express = require('express');
const router  = express.Router();
const { getUsers, banUser, unbanUser, getMetrics } = require('../controllers/admin.controller');
const { authenticateJWT, authorizeRole } = require('../middleware/auth.middleware');

// All admin routes require authentication + admin role
router.use(authenticateJWT, authorizeRole('admin'));

// GET  /api/admin/users          — paginated user list
router.get('/users',              getUsers);

// PATCH /api/admin/users/:id/ban   — ban a user
router.patch('/users/:id/ban',    banUser);

// PATCH /api/admin/users/:id/unban — reactivate a banned user
router.patch('/users/:id/unban',  unbanUser);

// GET  /api/admin/metrics        — platform usage metrics
router.get('/metrics',            getMetrics);

module.exports = router;
