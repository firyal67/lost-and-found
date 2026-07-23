const { body, param, query } = require('express-validator');

const VALID_REASONS = ['spam', 'scam', 'misleading', 'inappropriate', 'duplicate', 'other'];
const VALID_STATUSES = ['pending', 'reviewed', 'actioned', 'dismissed'];

const createReportValidator = [
  body('postId')
    .notEmpty().withMessage("L'ID de l'annonce est requis")
    .isMongoId().withMessage("ID d'annonce invalide"),

  body('reason')
    .notEmpty().withMessage('La raison du signalement est requise')
    .isIn(VALID_REASONS).withMessage(`Raison invalide. Valeurs acceptées : ${VALID_REASONS.join(', ')}`),

  body('comment')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 }).withMessage('Le commentaire ne doit pas dépasser 500 caractères'),
];

const updateReportStatusValidator = [
  param('id')
    .isMongoId().withMessage('ID de signalement invalide'),

  body('status')
    .notEmpty().withMessage('Le statut est requis')
    .isIn(VALID_STATUSES).withMessage(`Statut invalide. Valeurs acceptées : ${VALID_STATUSES.join(', ')}`),

  body('adminNote')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 }).withMessage('La note admin ne doit pas dépasser 500 caractères'),
];

module.exports = { createReportValidator, updateReportStatusValidator };
