'use strict';
const mongoose = require('mongoose');

/**
 * AuditLog — immutable record of every moderation action performed by an admin.
 *
 * Actions tracked:
 *   user.ban          — admin banned a user account
 *   user.unban        — admin reactivated a banned account
 *   report.reviewed   — admin changed a report's status
 *   report.actioned   — admin took action on a report (archive/delete)
 *   report.dismissed  — admin dismissed a report
 *   post.deleted      — admin deleted a post via a report
 *   post.archived     — admin archived a post via a report
 */

const AUDIT_ACTIONS = [
  'user.ban',
  'user.unban',
  'user.deleted',
  'report.reviewed',
  'report.actioned',
  'report.dismissed',
  'post.deleted',
  'post.archived',
];

const auditLogSchema = new mongoose.Schema(
  {
    // ── Who performed the action ──────────────────────────────────────────
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'User',
      required: true,
      index: true,
    },

    // ── What action was taken ─────────────────────────────────────────────
    action: {
      type: String,
      enum: AUDIT_ACTIONS,
      required: true,
      index: true,
    },

    // ── Affected resources (all optional — set what's relevant) ───────────
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'User',
      default: null,
      index: true,
    },
    targetPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'Post',
      default: null,
    },
    targetReport: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'Report',
      default: null,
    },

    // ── Human-readable summary and extra context ──────────────────────────
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // ── Request metadata ──────────────────────────────────────────────────
    ip: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    // Audit logs must never be mutated
    strict: true,
  }
);

// Compound index for the admin dashboard query (action filter + date sort)
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

// Prevent any updates to audit log documents
auditLogSchema.pre(['updateOne', 'findOneAndUpdate', 'updateMany'], function () {
  throw new Error('AuditLog records are immutable.');
});

auditLogSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
module.exports.AUDIT_ACTIONS = AUDIT_ACTIONS;
