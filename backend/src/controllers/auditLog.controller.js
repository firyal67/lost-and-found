'use strict';
const AuditLog = require('../models/AuditLog.model');

/**
 * GET /api/admin/audit-log
 *
 * Returns a paginated, filterable list of audit log entries.
 *
 * Query params:
 *   action   — filter by action type (e.g. "user.ban")
 *   adminId  — filter by the admin who performed the action
 *   page     — default 1
 *   limit    — default 20, max 100
 */
const getAuditLog = async (req, res, next) => {
  try {
    const { action, adminId, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (action)  filter.action      = action;
    if (adminId) filter.performedBy = adminId;

    const skip     = (Number(page) - 1) * Math.min(Number(limit), 100);
    const cappedLimit = Math.min(Number(limit), 100);

    const [entries, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(cappedLimit)
        .populate('performedBy', 'name email')
        .populate('targetUser',  'name email')
        .populate('targetPost',  'title type _id')
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        entries,
        pagination: {
          total,
          page:  Number(page),
          limit: cappedLimit,
          pages: Math.ceil(total / cappedLimit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAuditLog };
