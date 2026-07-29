'use strict';
const User    = require('../models/User.model');
const Post    = require('../models/Post.model');
const Report  = require('../models/Report.model');
const Contact = require('../models/Contact.model');
const Message = require('../models/Message.model');
const { writeAuditLog, extractRequestMeta } = require('../services/audit.service');

/* ─────────────────────────────────────────────────────────────────────────
   GET /api/admin/users
   Liste paginée des utilisateurs (admin uniquement).

   Query:
     q       — recherche sur nom ou email (optionnel)
     role    — "user" | "admin" (optionnel)
     status  — "active" | "banned" (optionnel, filtre sur isActive)
     page    — défaut 1
     limit   — défaut 20
───────────────────────────────────────────────────────────────────────── */
const getUsers = async (req, res, next) => {
  try {
    const { q, role, status, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (q) {
      filter.$or = [
        { name:  { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ];
    }
    if (role === 'user' || role === 'admin') filter.role = role;
    if (status === 'active') filter.isActive = true;
    if (status === 'banned') filter.isActive = false;

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page:  Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/* ─────────────────────────────────────────────────────────────────────────
   PATCH /api/admin/users/:id/ban
   Bannit un utilisateur (isActive → false) + révoque ses sessions.
   Body: { reason? }  — note interne optionnelle (loggée, non stockée)
───────────────────────────────────────────────────────────────────────── */
const banUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Vous ne pouvez pas vous bannir vous-même.' });
    }

    const user = await User.findById(id).select('+refreshTokens');
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });

    if (!user.isActive) {
      return res.status(409).json({ success: false, message: 'Cet utilisateur est déjà banni.' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Impossible de bannir un autre administrateur.' });
    }

    // Désactiver le compte et révoquer toutes les sessions
    user.isActive      = false;
    user.refreshTokens = [];
    await user.save();

    // ── Audit log ────────────────────────────────────────────────────────
    await writeAuditLog({
      action:      'user.ban',
      performedBy: req.user._id,
      targetUser:  user._id,
      details: {
        userName:  user.name,
        userEmail: user.email,
        reason:    req.body.reason ?? null,
      },
      ...extractRequestMeta(req),
    });

    return res.status(200).json({
      success: true,
      message: `Utilisateur ${user.name} banni avec succès.`,
      data: { user: { _id: user._id, name: user.name, email: user.email, isActive: false } },
    });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ success: false, message: 'ID invalide.' });
    next(err);
  }
};

/* ─────────────────────────────────────────────────────────────────────────
   PATCH /api/admin/users/:id/unban
   Réactive un utilisateur banni (isActive → true).
───────────────────────────────────────────────────────────────────────── */
const unbanUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });

    if (user.isActive) {
      return res.status(409).json({ success: false, message: 'Cet utilisateur n\'est pas banni.' });
    }

    user.isActive = true;
    await user.save();

    // ── Audit log ────────────────────────────────────────────────────────
    await writeAuditLog({
      action:      'user.unban',
      performedBy: req.user._id,
      targetUser:  user._id,
      details: { userName: user.name, userEmail: user.email },
      ...extractRequestMeta(req),
    });

    return res.status(200).json({
      success: true,
      message: `Compte de ${user.name} réactivé.`,
      data: { user: { _id: user._id, name: user.name, email: user.email, isActive: true } },
    });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ success: false, message: 'ID invalide.' });
    next(err);
  }
};

/* ─────────────────────────────────────────────────────────────────────────
   GET /api/admin/metrics
   Métriques globales de la plateforme (admin uniquement).

   Retourne :
     users    — total, actifs, bannis, nouveaux (7j / 30j)
     posts    — total par statut, nouveaux (7j / 30j)
     reports  — total par statut
     contacts — total, approuvés, en attente
     activity — 7 derniers jours : nouveaux utilisateurs + annonces (sparkline)
───────────────────────────────────────────────────────────────────────── */
const getMetrics = async (req, res, next) => {
  try {
    const now   = new Date();
    const day7  = new Date(now - 7  * 24 * 60 * 60 * 1000);
    const day30 = new Date(now - 30 * 24 * 60 * 60 * 1000);

    // ── Parallel aggregations ────────────────────────────────────────────
    const [
      totalUsers, activeUsers, bannedUsers, newUsers7, newUsers30,
      totalPosts, activePosts, archivedPosts, resolvedPosts, matchedPosts, newPosts7, newPosts30,
      totalReports, pendingReports, actionedReports, dismissedReports,
      totalContacts, approvedContacts, pendingContacts,
      userActivity, postActivity,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      User.countDocuments({ createdAt: { $gte: day7 } }),
      User.countDocuments({ createdAt: { $gte: day30 } }),

      Post.countDocuments({}),
      Post.countDocuments({ status: 'active' }),
      Post.countDocuments({ status: 'archived' }),
      Post.countDocuments({ status: 'resolved' }),
      Post.countDocuments({ status: 'matched' }),
      Post.countDocuments({ createdAt: { $gte: day7 } }),
      Post.countDocuments({ createdAt: { $gte: day30 } }),

      Report.countDocuments({}),
      Report.countDocuments({ status: 'pending' }),
      Report.countDocuments({ status: 'actioned' }),
      Report.countDocuments({ status: 'dismissed' }),

      Contact.countDocuments({}),
      Contact.countDocuments({ status: 'approved' }),
      Contact.countDocuments({ status: 'pending' }),

      // Daily new users for last 7 days
      User.aggregate([
        { $match: { createdAt: { $gte: day7 } } },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        }},
        { $sort: { _id: 1 } },
      ]),

      // Daily new posts for last 7 days
      Post.aggregate([
        { $match: { createdAt: { $gte: day7 } } },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        }},
        { $sort: { _id: 1 } },
      ]),
    ]);

    // ── Build 7-day activity timeline (fill gaps with 0) ─────────────────
    const timeline = [];
    for (let i = 6; i >= 0; i--) {
      const d   = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('fr-TN', { weekday: 'short', day: 'numeric', month: 'short' });
      timeline.push({
        date:  key,
        label,
        users: userActivity.find((x) => x._id === key)?.count ?? 0,
        posts: postActivity.find((x) => x._id === key)?.count ?? 0,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers, active: activeUsers, banned: bannedUsers,
          new7: newUsers7, new30: newUsers30,
        },
        posts: {
          total: totalPosts, active: activePosts, archived: archivedPosts,
          resolved: resolvedPosts, matched: matchedPosts,
          new7: newPosts7, new30: newPosts30,
        },
        reports: {
          total: totalReports, pending: pendingReports,
          actioned: actionedReports, dismissed: dismissedReports,
        },
        contacts: {
          total: totalContacts, approved: approvedContacts, pending: pendingContacts,
        },
        activity: timeline,
      },
    });
  } catch (err) {
    next(err);
  }
};

/* ─────────────────────────────────────────────────────────────────────────
   DELETE /api/admin/users/:id
   Supprime définitivement un compte utilisateur + toutes ses données.
   Les posts, contacts, messages et signalements sont également supprimés.
───────────────────────────────────────────────────────────────────────── */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Vous ne pouvez pas supprimer votre propre compte.' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });

    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Impossible de supprimer un autre administrateur.' });
    }

    // Supprimer les messages liés aux contacts de l'utilisateur
    const userContactIds = await Contact.find({
      $or: [{ requester: id }, { owner: id }],
    }).distinct('_id');
    await Message.deleteMany({ contact: { $in: userContactIds } });

    // Supprimer les contacts
    await Contact.deleteMany({ $or: [{ requester: id }, { owner: id }] });

    // Supprimer les signalements
    await Report.deleteMany({ reporter: id });

    // Supprimer les posts
    await Post.deleteMany({ author: id });

    // Supprimer l'utilisateur
    await User.findByIdAndDelete(id);

    // ── Audit log ────────────────────────────────────────────────────────
    await writeAuditLog({
      action:      'user.deleted',
      performedBy: req.user._id,
      targetUser:  user._id,
      details: {
        userName:  user.name,
        userEmail: user.email,
        reason:    req.body.reason ?? null,
      },
      ...extractRequestMeta(req),
    });

    return res.status(200).json({
      success: true,
      message: `Compte de ${user.name} supprimé définitivement avec toutes ses données.`,
    });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ success: false, message: 'ID invalide.' });
    next(err);
  }
};

module.exports = { getUsers, banUser, unbanUser, deleteUser, getMetrics };
