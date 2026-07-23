const Report = require('../models/Report.model');
const Post   = require('../models/Post.model');

/**
 * POST /api/reports
 * Signaler une annonce (spam, arnaque, etc.).
 * Requiert authenticateJWT.
 *
 * Body: { postId, reason, comment? }
 */
const createReport = async (req, res, next) => {
  try {
    const { postId, reason, comment } = req.body;
    const reporterId = req.user._id;

    // Vérifier que l'annonce existe
    const post = await Post.findById(postId).lean();
    if (!post) {
      return res.status(404).json({ success: false, message: 'Annonce introuvable.' });
    }

    // Un auteur ne peut pas signaler sa propre annonce
    if (post.author.toString() === reporterId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas signaler votre propre annonce.',
      });
    }

    const report = await Report.create({
      post:     postId,
      reporter: reporterId,
      reason,
      comment:  comment || '',
    });

    await report.populate([
      { path: 'post',     select: 'title type city _id' },
      { path: 'reporter', select: 'name email' },
    ]);

    return res.status(201).json({
      success: true,
      message: 'Signalement envoyé. Notre équipe va examiner cette annonce.',
      data: { report },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Vous avez déjà signalé cette annonce.',
      });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'ID invalide.' });
    }
    next(error);
  }
};

/**
 * GET /api/reports/mine
 * Retourne les signalements envoyés par l'utilisateur connecté.
 * Requiert authenticateJWT.
 */
const getMyReports = async (req, res, next) => {
  try {
    const reports = await Report.find({ reporter: req.user._id })
      .sort({ createdAt: -1 })
      .populate({ path: 'post', select: 'title type city objectType status _id' })
      .lean();

    return res.status(200).json({
      success: true,
      data: { reports, total: reports.length },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports
 * Liste tous les signalements (admin uniquement).
 *
 * Query:
 *   status  — "pending" | "reviewed" | "actioned" | "dismissed" (défaut: "pending")
 *   page    — numéro de page (défaut: 1)
 *   limit   — résultats par page (défaut: 20)
 */
const getReports = async (req, res, next) => {
  try {
    const {
      status = 'pending',
      page   = 1,
      limit  = 20,
    } = req.query;

    const filter = {};
    const VALID_STATUSES = ['pending', 'reviewed', 'actioned', 'dismissed', 'all'];
    if (status !== 'all' && VALID_STATUSES.includes(status)) {
      filter.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate({ path: 'post',       select: 'title type city objectType status author _id' })
        .populate({ path: 'reporter',   select: 'name email' })
        .populate({ path: 'reviewedBy', select: 'name email' })
        .lean(),
      Report.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        reports,
        pagination: {
          total,
          page:  Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/reports/:id/status
 * Met à jour le statut d'un signalement (admin uniquement).
 *
 * Body: { status, adminNote? }
 */
const updateReportStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Signalement introuvable.' });
    }

    report.status     = status;
    report.reviewedBy = req.user._id;
    if (adminNote !== undefined) report.adminNote = adminNote;
    // reviewedAt est défini automatiquement par le hook pre('save')
    await report.save();

    await report.populate([
      { path: 'post',       select: 'title type city objectType status _id' },
      { path: 'reporter',   select: 'name email' },
      { path: 'reviewedBy', select: 'name email' },
    ]);

    return res.status(200).json({
      success: true,
      message: 'Statut du signalement mis à jour.',
      data: { report },
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'ID invalide.' });
    }
    next(error);
  }
};

/**
 * GET /api/reports/post/:postId/mine
 * Vérifie si l'utilisateur connecté a déjà signalé une annonce donnée.
 * Retourne { reported: bool, report: Report|null }.
 * Requiert authenticateJWT.
 */
const getReportForPost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const report = await Report.findOne({
      post:     postId,
      reporter: req.user._id,
    }).lean();

    return res.status(200).json({
      success: true,
      data: { reported: !!report, report: report ?? null },
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'ID invalide.' });
    }
    next(error);
  }
};

/**
 * DELETE /api/reports/:id/post
 * Supprime l'annonce liée à un signalement et clôture tous les signalements
 * relatifs à cette annonce (status → actioned).
 * Admin uniquement. Requiert authenticateJWT.
 */
const deleteReportedPost = async (req, res, next) => {
  try {
    const { id } = req.params; // ID du signalement

    // Charger le signalement pour récupérer le post lié
    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Signalement introuvable.' });
    }

    const postId = report.post;
    if (!postId) {
      return res.status(400).json({ success: false, message: "Ce signalement n'est lié à aucune annonce." });
    }

    // Vérifier que l'annonce existe encore
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Annonce introuvable ou déjà supprimée.' });
    }

    // Supprimer l'annonce
    await post.deleteOne();

    // Clôturer tous les signalements liés à cette annonce en une seule requête
    await Report.updateMany(
      { post: postId },
      {
        $set: {
          status:     'actioned',
          adminNote:  'Annonce supprimée par un administrateur suite à un signalement.',
          reviewedBy: req.user._id,
          reviewedAt: new Date(),
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Annonce supprimée et signalements clôturés.',
      data: { postId },
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'ID invalide.' });
    }
    next(error);
  }
};

module.exports = {
  createReport,
  getMyReports,
  getReports,
  updateReportStatus,
  getReportForPost,
  deleteReportedPost,
};
