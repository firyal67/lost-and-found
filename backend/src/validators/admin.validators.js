'use strict';
const { body, param, query } = require('express-validator');
const { stripTags } = require('../middleware/validate.middleware');

/* ── PATCH /api/admin/users/:id/ban ─────────────────────────────────────── */
const banUserValidator = [
  param('id')
    .isMongoId().withMessage('ID utilisateur invalide'),

  body('reason')
    .optional({ checkFalsy: true })
    .trim()
    .customSanitizer(stripTags)
    .isLength({ max: 300 }).withMessage('La raison ne doit pas dépasser 300 caractères'),
];

/* ── PATCH /api/admin/users/:id/unban ───────────────────────────────────── */
const unbanUserValidator = [
  param('id')
    .isMongoId().withMessage('ID utilisateur invalide'),
];

/* ── GET /api/admin/users ───────────────────────────────────────────────── */
const getUsersValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page doit être un entier positif')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit doit être entre 1 et 100')
    .toInt(),

  query('role')
    .optional()
    .isIn(['user', 'admin']).withMessage('Rôle invalide'),

  query('status')
    .optional()
    .isIn(['active', 'banned']).withMessage('Statut invalide'),

  query('q')
    .optional()
    .trim()
    .customSanitizer(stripTags)
    .isLength({ max: 100 }).withMessage('La recherche ne doit pas dépasser 100 caractères'),
];

module.exports = { banUserValidator, unbanUserValidator, getUsersValidator };
