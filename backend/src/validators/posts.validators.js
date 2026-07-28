'use strict';
const { body } = require('express-validator');
const { stripTags } = require('../middleware/validate.middleware');

// Regex that blocks any complete document number in free-text fields
const SENSITIVE_DOC_REGEX = /\b\d{8}\b|\b[A-Z]\d{7}\b/;

// Fields allowed in a PATCH /api/posts/:id (update) request
// Photo and reward are intentionally excluded here (separate upload flow / own validation)
const UPDATABLE_FIELDS = [
  'objectType', 'title', 'description', 'city',
  'delegation', 'date', 'maskedDocNumber',
  'reward', 'photo', 'contactEmail', 'contactPhone', 'contactPreferences',
];

/* ── Shared field validators ─────────────────────────────────────────────── */

const typeValidator = body('type')
  .notEmpty().withMessage('Le type d\'annonce est requis')
  .isIn(['lost', 'found']).withMessage('Le type doit être "lost" ou "found"');

const objectTypeValidator = body('objectType')
  .notEmpty().withMessage('Le type d\'objet est requis')
  .isIn(['cin', 'passport', 'permis', 'carte_bancaire', 'telephone', 'cles', 'autre'])
  .withMessage('Type d\'objet invalide');

const titleValidator = body('title')
  .trim()
  .customSanitizer(stripTags)
  .notEmpty().withMessage('Le titre est requis')
  .isLength({ min: 5, max: 100 })
  .withMessage('Le titre doit contenir entre 5 et 100 caractères');

const descriptionValidator = body('description')
  .trim()
  .customSanitizer(stripTags)
  .notEmpty().withMessage('La description est requise')
  .isLength({ min: 10, max: 1000 })
  .withMessage('La description doit contenir entre 10 et 1000 caractères')
  .custom((value) => {
    if (SENSITIVE_DOC_REGEX.test(value)) {
      throw new Error(
        'La description ne doit pas contenir de numéro de document complet. Utilisez le format masqué ex: ****1234'
      );
    }
    return true;
  });

const cityValidator = body('city')
  .trim()
  .customSanitizer(stripTags)
  .notEmpty().withMessage('La ville est requise')
  .isLength({ max: 100 }).withMessage('La ville ne doit pas dépasser 100 caractères');

const delegationValidator = body('delegation')
  .optional({ checkFalsy: true })
  .trim()
  .customSanitizer(stripTags)
  .isLength({ max: 100 }).withMessage('La délégation ne doit pas dépasser 100 caractères');

const dateValidator = body('date')
  .notEmpty().withMessage('La date est requise')
  .isISO8601().withMessage('Format de date invalide')
  .custom((value) => {
    if (new Date(value) > new Date()) throw new Error('La date ne peut pas être dans le futur');
    return true;
  });

const maskedDocNumberValidator = body('maskedDocNumber')
  .optional({ checkFalsy: true })
  .trim()
  .matches(/^\*{4}\d{4}$/)
  .withMessage('Le numéro masqué doit être au format ****XXXX (ex: ****1234)');

const photoValidator = body('photo')
  .optional({ checkFalsy: true })
  .custom((value) => {
    if (!value) return true;
    if (!/^data:image\/(jpeg|jpg|png|webp|gif);base64,/.test(value)) {
      throw new Error('Format d\'image invalide. Formats acceptés : JPEG, PNG, WebP, GIF');
    }
    // ~5 MB limit (base64 ≈ 4/3 raw size → 5 MB * 4/3 ≈ 6.9 M chars)
    if (value.length > 7_000_000) {
      throw new Error('L\'image ne doit pas dépasser 5 Mo');
    }
    return true;
  });

const rewardValidator = body('reward')
  .optional({ checkFalsy: true })
  .isFloat({ min: 0 }).withMessage('La récompense doit être un nombre positif');

const contactPrefsValidator = [
  body('contactPreferences.phone')
    .optional()
    .isBoolean().withMessage('contactPreferences.phone doit être un booléen'),
  body('contactPreferences.email')
    .optional()
    .isBoolean().withMessage('contactPreferences.email doit être un booléen'),
  body('contactPreferences.platform')
    .optional()
    .isBoolean().withMessage('contactPreferences.platform doit être un booléen'),
];

const contactEmailValidator = body('contactEmail')
  .optional({ checkFalsy: true })
  .trim()
  .isEmail().withMessage('Email de contact invalide');

const contactPhoneValidator = body('contactPhone')
  .optional({ checkFalsy: true })
  .trim()
  .customSanitizer(stripTags)
  .matches(/^[\d\s+\-()]{6,20}$/)
  .withMessage('Numéro de téléphone invalide (6-20 chiffres)');

/* ── POST /api/posts — full creation validator ───────────────────────────── */
const createPostValidator = [
  typeValidator,
  objectTypeValidator,
  titleValidator,
  descriptionValidator,
  cityValidator,
  delegationValidator,
  dateValidator,
  maskedDocNumberValidator,
  photoValidator,
  rewardValidator,
  ...contactPrefsValidator,
  contactEmailValidator,
  contactPhoneValidator,
];

/* ── PATCH /api/posts/:id — partial update validator ─────────────────────── */
// All fields are optional — only validate the ones actually present in the body.
const updatePostValidator = [
  body('objectType')
    .optional()
    .isIn(['cin', 'passport', 'permis', 'carte_bancaire', 'telephone', 'cles', 'autre'])
    .withMessage('Type d\'objet invalide'),

  body('title')
    .optional()
    .trim()
    .customSanitizer(stripTags)
    .isLength({ min: 5, max: 100 })
    .withMessage('Le titre doit contenir entre 5 et 100 caractères'),

  body('description')
    .optional()
    .trim()
    .customSanitizer(stripTags)
    .isLength({ min: 10, max: 1000 })
    .withMessage('La description doit contenir entre 10 et 1000 caractères')
    .custom((value) => {
      if (value && SENSITIVE_DOC_REGEX.test(value)) {
        throw new Error(
          'La description ne doit pas contenir de numéro de document complet. Utilisez le format masqué ex: ****1234'
        );
      }
      return true;
    }),

  body('city')
    .optional()
    .trim()
    .customSanitizer(stripTags)
    .notEmpty().withMessage('La ville ne peut pas être vide')
    .isLength({ max: 100 }).withMessage('La ville ne doit pas dépasser 100 caractères'),

  delegationValidator,

  body('date')
    .optional()
    .isISO8601().withMessage('Format de date invalide')
    .custom((value) => {
      if (value && new Date(value) > new Date()) throw new Error('La date ne peut pas être dans le futur');
      return true;
    }),

  maskedDocNumberValidator,
  photoValidator,
  rewardValidator,
  ...contactPrefsValidator,
  contactEmailValidator,
  contactPhoneValidator,
];

module.exports = { createPostValidator, updatePostValidator };
