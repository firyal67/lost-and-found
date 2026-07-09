const { body } = require('express-validator');

// Regex qui bloque tout numéro de document complet dans la description
const SENSITIVE_DOC_REGEX = /\b\d{8}\b|\b[A-Z]\d{7}\b/;

const createPostValidator = [
  // ── Type d'annonce ─────────────────────────────────────────────────────────
  body('type')
    .notEmpty().withMessage('Le type d\'annonce est requis')
    .isIn(['lost', 'found']).withMessage('Le type doit être "lost" ou "found"'),

  // ── Type d'objet ───────────────────────────────────────────────────────────
  body('objectType')
    .notEmpty().withMessage('Le type d\'objet est requis')
    .isIn(['cin', 'passport', 'permis', 'carte_bancaire', 'telephone', 'cles', 'autre'])
    .withMessage('Type d\'objet invalide'),

  // ── Titre ──────────────────────────────────────────────────────────────────
  body('title')
    .trim()
    .notEmpty().withMessage('Le titre est requis')
    .isLength({ min: 5, max: 100 })
    .withMessage('Le titre doit contenir entre 5 et 100 caractères'),

  // ── Description ────────────────────────────────────────────────────────────
  body('description')
    .trim()
    .notEmpty().withMessage('La description est requise')
    .isLength({ min: 10, max: 1000 })
    .withMessage('La description doit contenir entre 10 et 1000 caractères')
    .custom((value) => {
      if (SENSITIVE_DOC_REGEX.test(value)) {
        throw new Error(
          'La description ne doit pas contenir de numéro de document complet (CIN, passeport). Utilisez le format masqué ex: ****1234'
        );
      }
      return true;
    }),

  // ── Ville ──────────────────────────────────────────────────────────────────
  body('city')
    .trim()
    .notEmpty().withMessage('La ville est requise')
    .isLength({ max: 100 }).withMessage('La ville ne doit pas dépasser 100 caractères'),

  // ── Délégation (optionnelle) ───────────────────────────────────────────────
  body('delegation')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 }).withMessage('La délégation ne doit pas dépasser 100 caractères'),

  // ── Date ───────────────────────────────────────────────────────────────────
  body('date')
    .notEmpty().withMessage('La date est requise')
    .isISO8601().withMessage('Format de date invalide')
    .custom((value) => {
      if (new Date(value) > new Date()) {
        throw new Error('La date ne peut pas être dans le futur');
      }
      return true;
    }),

  // ── Numéro masqué (optionnel) ──────────────────────────────────────────────
  body('maskedDocNumber')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^\*{4}\d{4}$/)
    .withMessage('Le numéro masqué doit être au format ****XXXX (ex: ****1234)'),

  // ── Photo (optionnelle, base64) ───────────────────────────────────────────
  body('photo')
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (!value) return true;
      // Accepte uniquement les data-URI image/* en base64
      if (!/^data:image\/(jpeg|jpg|png|webp|gif);base64,/.test(value)) {
        throw new Error('Format d\'image invalide. Formats acceptés : JPEG, PNG, WebP, GIF');
      }
      // Limite à ~5 MB (base64 ~ 4/3 taille originale, 5MB * 4/3 ≈ 6.9M chars)
      if (value.length > 7_000_000) {
        throw new Error('L\'image ne doit pas dépasser 5 Mo');
      }
      return true;
    }),

  // ── Récompense (optionnelle, uniquement pour lost) ─────────────────────────
  body('reward')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 }).withMessage('La récompense doit être un nombre positif'),

  // ── Préférences de contact ─────────────────────────────────────────────────
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

module.exports = { createPostValidator };
