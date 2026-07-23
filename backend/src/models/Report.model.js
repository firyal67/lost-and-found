const mongoose = require('mongoose');

/**
 * Report — signalement d'une annonce par un utilisateur.
 *
 * Un utilisateur ne peut signaler une même annonce qu'une seule fois
 * (index unique sur post + reporter).
 *
 * Statuts du modération :
 *   pending   → signalement reçu, en attente de traitement (défaut)
 *   reviewed  → examiné par un admin, aucune action requise
 *   actioned  → signalement confirmé, action prise (ex: annonce archivée/supprimée)
 *   dismissed → signalement rejeté par l'admin (infondé)
 */

const REASONS = [
  'spam',           // contenu répétitif / publicitaire
  'scam',           // arnaque / tentative de fraude
  'misleading',     // informations fausses ou trompeuses
  'inappropriate',  // contenu offensant ou hors-sujet
  'duplicate',      // annonce en double
  'other',          // autre
];

const reportSchema = new mongoose.Schema(
  {
    // ── Annonce signalée ──────────────────────────────────────────────────────
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: [true, 'Post is required'],
    },

    // ── Utilisateur qui signale ───────────────────────────────────────────────
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter is required'],
    },

    // ── Raison du signalement ─────────────────────────────────────────────────
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      enum: {
        values: REASONS,
        message: 'Invalid reason',
      },
    },

    // ── Commentaire libre (optionnel) ─────────────────────────────────────────
    comment: {
      type: String,
      trim: true,
      maxlength: [500, 'Comment must not exceed 500 characters'],
      default: '',
    },

    // ── Statut de modération ──────────────────────────────────────────────────
    status: {
      type: String,
      enum: {
        values: ['pending', 'reviewed', 'actioned', 'dismissed'],
        message: 'Invalid status',
      },
      default: 'pending',
    },

    // ── Note interne de l'admin (optionnelle) ─────────────────────────────────
    adminNote: {
      type: String,
      trim: true,
      maxlength: [500, 'Admin note must not exceed 500 characters'],
      default: '',
    },

    // ── Admin qui a traité le signalement ─────────────────────────────────────
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // ── Date de traitement ────────────────────────────────────────────────────
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// ── Un utilisateur ne peut signaler une annonce qu'une seule fois ─────────────
reportSchema.index({ post: 1, reporter: 1 }, { unique: true });
// Index pour les requêtes admin (tri par date, filtre par statut)
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ post: 1, status: 1 });

// ── Marque reviewedAt automatiquement quand le statut change ─────────────────
reportSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status !== 'pending' && !this.reviewedAt) {
    this.reviewedAt = new Date();
  }
  next();
});

reportSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Report', reportSchema);
