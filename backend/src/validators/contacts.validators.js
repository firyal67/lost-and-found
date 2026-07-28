'use strict';
const { body } = require('express-validator');
const { stripTags } = require('../middleware/validate.middleware');

const createContactValidator = [
  body('postId')
    .notEmpty().withMessage('L\'ID de l\'annonce est requis')
    .isMongoId().withMessage('ID d\'annonce invalide'),

  body('message')
    .optional({ checkFalsy: true })
    .trim()
    .customSanitizer(stripTags)
    .isLength({ max: 500 }).withMessage('Le message ne doit pas dépasser 500 caractères'),
];

module.exports = { createContactValidator };
