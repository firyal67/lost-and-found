const mongoose = require('mongoose');

// Regex qui bloque un numéro CIN tunisien (8 chiffres) ou passeport (lettre + 7 chiffres)
// pour éviter de stocker des données sensibles en clair dans la description
const SENSITIVE_DOC_REGEX = /\b\d{8}\b|\b[A-Z]\d{7}\b/;

const postSchema = new mongoose.Schema(
  {
    // ── Type d'annonce ───────────────────────────────────────────────────────
    type: {
      type: String,
      required: [true, 'Post type is required'],
      enum: {
        values: ['lost', 'found'],
        message: 'Type must be "lost" or "found"',
      },
    },

    // ── Type d'objet ─────────────────────────────────────────────────────────
    objectType: {
      type: String,
      required: [true, 'Object type is required'],
      enum: {
        values: ['cin', 'passport', 'permis', 'carte_bancaire', 'telephone', 'cles', 'autre'],
        message: 'Invalid object type',
      },
    },

    // ── Contenu textuel ──────────────────────────────────────────────────────
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [100, 'Title must not exceed 100 characters'],
    },

    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [1000, 'Description must not exceed 1000 characters'],
      validate: {
        validator: function (value) {
          // Bloque tout numéro de document complet dans la description
          return !SENSITIVE_DOC_REGEX.test(value);
        },
        message:
          'Description must not contain complete document numbers (CIN, passport). Use masked format like ****1234.',
      },
    },

    // ── Localisation ─────────────────────────────────────────────────────────
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: [100, 'City must not exceed 100 characters'],
    },

    delegation: {
      type: String,
      trim: true,
      maxlength: [100, 'Delegation must not exceed 100 characters'],
      default: '',
    },

    // ── Date de l'événement (perte ou découverte) ────────────────────────────
    date: {
      type: Date,
      required: [true, 'Date is required'],
      validate: {
        validator: function (value) {
          return value <= new Date();
        },
        message: 'Date cannot be in the future',
      },
    },

    // ── Photo (URL stockée après upload) ─────────────────────────────────────
    photo: {
      type: String,
      trim: true,
      default: null,
    },

    // ── Récompense (optionnel, uniquement pour les objets perdus) ─────────────
    reward: {
      type: Number,
      min: [0, 'Reward cannot be negative'],
      default: null,
    },

    // ── Préférences de contact ────────────────────────────────────────────────
    contactPreferences: {
      phone:    { type: Boolean, default: false },
      email:    { type: Boolean, default: true  },
      platform: { type: Boolean, default: true  },
    },

    // ── Coordonnées de contact visibles aux autres utilisateurs ──────────────
    // Renseignées par l'auteur lors de la publication de l'annonce
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
      match: [/^\S+@\S+\.\S+$/, 'Email de contact invalide'],
    },
    contactPhone: {
      type: String,
      trim: true,
      default: null,
      match: [/^[\d\s\+\-\(\)]{6,20}$/, 'Numéro de téléphone invalide'],
    },

    // ── Numéro de document masqué (ex: ****5678) ─────────────────────────────
    // Jamais le numéro complet — uniquement les 4 derniers chiffres préfixés par ****
    maskedDocNumber: {
      type: String,
      trim: true,
      default: null,
      validate: {
        validator: function (value) {
          if (!value) return true; // optionnel
          return /^\*{4}\d{4}$/.test(value);
        },
        message: 'maskedDocNumber must be in format ****XXXX (e.g. ****1234)',
      },
    },

    // ── Statut de l'annonce ───────────────────────────────────────────────────
    status: {
      type: String,
      enum: {
        values: ['active', 'matched', 'resolved', 'archived'],
        message: 'Invalid status',
      },
      default: 'active',
    },

    // ── Auteur (référence à users) ────────────────────────────────────────────
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
    },

    // ── Date de résolution ────────────────────────────────────────────────────
    resolvedAt: {
      type: Date,
      default: null,
    },

    // ── Lien vers l'annonce correspondante (quand status = 'matched') ─────────
    matchedWith: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'Post',
      default: null,
    },

    // ── Date de mise en correspondance ────────────────────────────────────────
    matchedAt: {
      type: Date,
      default: null,
    },

    // ── Date d'archivage ──────────────────────────────────────────────────────
    archivedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// ── Index ─────────────────────────────────────────────────────────────────────
postSchema.index({ city: 1 });
postSchema.index({ objectType: 1 });
postSchema.index({ date: -1 });
postSchema.index({ status: 1 });
postSchema.index({ author: 1 });
// Index composé pour les recherches/filtres combinés (ville + type d'objet + date)
postSchema.index({ city: 1, objectType: 1, date: -1 });
// Index texte pour la recherche full-text sur titre et description
postSchema.index({ title: 'text', description: 'text' });

// ── Hook : marque resolvedAt / matchedAt / archivedAt automatiquement ─────────
postSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    if (this.status === 'resolved' && !this.resolvedAt) {
      this.resolvedAt = new Date();
    }
    if (this.status === 'matched' && !this.matchedAt) {
      this.matchedAt = new Date();
    }
    if (this.status === 'archived' && !this.archivedAt) {
      this.archivedAt = new Date();
    }
  }
  next();
});

// ── Sérialisation publique ────────────────────────────────────────────────────
postSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Post', postSchema);
