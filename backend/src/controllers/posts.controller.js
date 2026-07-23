const Post = require('../models/Post.model');
const { calculateMatchScore } = require('../utils/matchScore');

/**
 * POST /api/posts
 * Crée une nouvelle annonce (objet perdu ou trouvé).
 * Requiert authenticateJWT.
 */
const createPost = async (req, res, next) => {
  try {
    const {
      type,
      objectType,
      title,
      description,
      city,
      delegation,
      date,
      maskedDocNumber,
      reward,
      contactPreferences,
      contactEmail,
      contactPhone,
      photo,
    } = req.body;

    const post = await Post.create({
      type,
      objectType,
      title,
      description,
      city,
      delegation: delegation || '',
      date,
      maskedDocNumber: maskedDocNumber || null,
      reward: reward != null ? Number(reward) : null,
      photo: photo || null,
      contactPreferences: {
        phone:    contactPreferences?.phone    ?? false,
        email:    contactPreferences?.email    ?? true,
        platform: contactPreferences?.platform ?? true,
      },
      contactEmail:  contactEmail  || null,
      contactPhone:  contactPhone  || null,
      author: req.user._id,
      status: 'active',
    });

    // Populate author pour la réponse (sans données sensibles)
    await post.populate('author', 'name email');

    return res.status(201).json({
      success: true,
      message: 'Annonce créée avec succès.',
      data: { post },
    });
  } catch (error) {
    // Erreurs de validation Mongoose (ex: SENSITIVE_DOC_REGEX sur description)
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((e) => ({
        field:   e.path,
        message: e.message,
      }));
      return res.status(422).json({
        success: false,
        message: 'Validation échouée',
        errors,
      });
    }
    next(error);
  }
};

/**
 * GET /api/posts
 * Liste des annonces avec filtres et pagination.
 * Public (pas d'auth requise).
 */
const getPosts = async (req, res, next) => {
  try {
    const {
      type,        // "lost" | "found"
      objectType,  // "cin" | "passport" | ...
      city,
      dateFrom,
      dateTo,
      q,           // recherche texte
      sort = '-date', // ex: "date" | "-date"
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    // Default: show only active posts unless a specific status is requested
    if (req.query.status === 'resolved') {
      filter.status = 'resolved';
    } else if (req.query.status === 'matched') {
      filter.status = 'matched';
    } else if (req.query.status === 'archived') {
      filter.status = 'archived';
    } else if (req.query.status === 'closed') {
      // matched + resolved together
      filter.status = { $in: ['matched', 'resolved'] };
    } else if (req.query.status === 'all') {
      // no status filter — show everything (admin use)
    } else {
      filter.status = 'active'; // default
    }

    if (type) filter.type = type;
    if (objectType) filter.objectType = objectType;
    if (city) filter.city = city;
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo)   filter.date.$lte = new Date(dateTo);
    }
    if (q) filter.$text = { $search: q };

    const skip = (Number(page) - 1) * Number(limit);
    const sortObj = sort.startsWith('-') ? { [sort.slice(1)]: -1 } : { [sort]: 1 };

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(Number(limit))
        .populate('author', 'name')
        .lean(),
      Post.countDocuments(filter),
    ]);

    return res
      .set('Cache-Control', 'public, max-age=60, s-maxage=120')
      .status(200)
      .json({
        success: true,
        data: {
          posts,
          pagination: {
            total,
            page: Number(page),
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
 * GET /api/posts/:id
 * Détail d'une annonce par ID.
 * Public.
 */
const getPostById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id).populate('author', 'name email');
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Annonce introuvable.',
      });
    }

    return res.status(200).json({
      success: true,
      data: { post },
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID invalide.',
      });
    }
    next(error);
  }
};

/**
 * DELETE /api/posts/:id
 * Supprime une annonce. Réservé à l'auteur ou à un admin.
 * Requiert authenticateJWT.
 */
const deletePost = async (req, res, next) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Annonce introuvable.' });
    }

    const isOwner = post.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Accès refusé.' });
    }

    await post.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Annonce supprimée avec succès.',
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'ID invalide.' });
    }
    next(error);
  }
};

/**
 * PATCH /api/posts/:id/resolve
 * Clôture une annonce en la marquant comme résolue.
 * Réservé à l'auteur ou à un admin.
 * Requiert authenticateJWT.
 */
const resolvePost = async (req, res, next) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Annonce introuvable.' });
    }

    const isOwner = post.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Accès refusé.' });
    }

    if (post.status === 'resolved') {
      return res.status(409).json({ success: false, message: 'Cette annonce est déjà clôturée.' });
    }

    post.status = 'resolved';
    // resolvedAt est défini automatiquement par le hook pre('save') dans Post.model.js
    await post.save();
    await post.populate('author', 'name email');

    return res.status(200).json({
      success: true,
      message: 'Annonce clôturée avec succès.',
      data: { post },
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'ID invalide.' });
    }
    next(error);
  }
};

/**
 * PATCH /api/posts/:id/match
 * Marque une annonce comme "mise en correspondance" (status = matched).
 * Optionnellement lie l'annonce à celle qui a permis la correspondance (matchedWith).
 *
 * Body (JSON, optionnel):
 *   matchedWith  — ID de l'annonce correspondante
 *
 * Réservé à l'auteur ou à un admin.
 * Requiert authenticateJWT.
 */
const matchPost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { matchedWith } = req.body;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Annonce introuvable.' });
    }

    const isOwner = post.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Accès refusé.' });
    }

    if (post.status === 'matched') {
      return res.status(409).json({ success: false, message: 'Cette annonce est déjà marquée comme mise en correspondance.' });
    }
    if (post.status === 'resolved') {
      return res.status(409).json({ success: false, message: 'Cette annonce est déjà clôturée.' });
    }

    // Si matchedWith est fourni, vérifier qu'il existe
    if (matchedWith) {
      const linkedPost = await Post.findById(matchedWith).lean();
      if (!linkedPost) {
        return res.status(404).json({ success: false, message: 'Annonce liée introuvable.' });
      }
      post.matchedWith = matchedWith;
    }

    post.status = 'matched';
    await post.save();
    await post.populate('author', 'name email');
    // Populate aussi l'annonce liée si elle existe
    if (post.matchedWith) await post.populate('matchedWith', 'title type city objectType');

    return res.status(200).json({
      success: true,
      message: 'Annonce marquée comme mise en correspondance.',
      data: { post },
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'ID invalide.' });
    }
    next(error);
  }
};

/**
 * PATCH /api/posts/:id
 * Modifie une annonce existante.
 * Réservé à l'auteur ou à un admin.
 * Seules les annonces actives peuvent être modifiées.
 * Requiert authenticateJWT.
 */
const updatePost = async (req, res, next) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Annonce introuvable.' });
    }

    const isOwner = post.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Accès refusé.' });
    }

    if (post.status !== 'active') {
      return res.status(409).json({
        success: false,
        message: 'Seules les annonces actives peuvent être modifiées.',
      });
    }

    const ALLOWED = [
      'objectType', 'title', 'description', 'city', 'delegation',
      'date', 'maskedDocNumber', 'reward', 'photo',
      'contactEmail', 'contactPhone', 'contactPreferences',
    ];

    ALLOWED.forEach((field) => {
      if (field in req.body) {
        if (field === 'contactPreferences') {
          post.contactPreferences = {
            ...(post.contactPreferences?.toObject?.() ?? post.contactPreferences),
            ...req.body.contactPreferences,
          };
        } else if (field === 'reward') {
          post.reward = req.body.reward != null ? Number(req.body.reward) : null;
        } else if (['maskedDocNumber','contactEmail','contactPhone','photo'].includes(field)) {
          post[field] = req.body[field] || null;
        } else {
          post[field] = req.body[field];
        }
      }
    });

    await post.save();
    await post.populate('author', 'name email');

    return res.status(200).json({
      success: true,
      message: 'Annonce mise à jour avec succès.',
      data: { post },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((e) => ({ field: e.path, message: e.message }));
      return res.status(422).json({ success: false, message: 'Validation échouée', errors });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'ID invalide.' });
    }
    next(error);
  }
};

/**
 * PATCH /api/posts/:id/archive
 * Archive une annonce — la retire de la liste publique mais la conserve en base.
 * Peut être appliqué à n'importe quel statut (active, resolved, matched).
 * Réservé à l'auteur ou à un admin.
 * Requiert authenticateJWT.
 */
const archivePost = async (req, res, next) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Annonce introuvable.' });
    }

    const isOwner = post.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Accès refusé.' });
    }

    if (post.status === 'archived') {
      return res.status(409).json({ success: false, message: 'Cette annonce est déjà archivée.' });
    }

    post.status = 'archived';
    // archivedAt est défini automatiquement par le hook pre('save') dans Post.model.js
    await post.save();
    await post.populate('author', 'name email');

    return res.status(200).json({
      success: true,
      message: 'Annonce archivée avec succès.',
      data: { post },
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'ID invalide.' });
    }
    next(error);
  }
};

/**
 * Retourne les annonces potentiellement correspondantes avec un score de compatibilité.
 * Utilisé lors de la création d'une annonce pour suggérer des correspondances.
 *
 * Query params:
 *   type        — "lost" | "found"
 *   objectType  — type d'objet
 *   city        — ville
 *   delegation  — délégation / quartier (optionnel)
 *   date        — date de l'événement (ISO string)
 *   title       — titre (pour similarité mots-clés, optionnel)
 *   description — description (pour similarité mots-clés, optionnel)
 *
 * Score 0–100 via calculateMatchScore() :
 *   objectType  → 40 pts
 *   city        → 25 pts
 *   delegation  → 10 pts
 *   date        → 0–15 pts (proximité temporelle)
 *   keywords    → 0–10 pts (Jaccard titre+description)
 *
 * Public — pas d'auth requise.
 */
const getMatchingSuggestions = async (req, res, next) => {
  try {
    const { type, objectType, city, delegation, date, title, description } = req.query;

    // On cherche le type opposé (lost ↔ found)
    const oppositeType = type === 'lost' ? 'found' : 'lost';

    // ── Filtre MongoDB — large pour laisser le scoring affiner ───────────────
    const filter = { status: 'active', type: oppositeType };

    // On filtre uniquement sur objectType (critère principal)
    // La ville et la date sont laissées au scoring pour ne pas être trop restrictif
    if (objectType) filter.objectType = objectType;

    // Fenêtre temporelle élargie : ±90 jours
    if (date) {
      const d    = new Date(date);
      const from = new Date(d); from.setDate(from.getDate() - 90);
      const to   = new Date(d); to.setDate(to.getDate()   + 90);
      filter.date = { $gte: from, $lte: to };
    }

    const candidates = await Post.find(filter)
      .sort({ date: -1 })
      .limit(50)
      .populate('author', 'name')
      .lean();

    // ── Source virtuelle (les champs du formulaire en cours) ─────────────────
    const source = { type, objectType, city, delegation, date, title, description };

    // ── Calcul du score pour chaque candidat ─────────────────────────────────
    const scored = candidates
      .map((candidate) => {
        const { total, breakdown, details } = calculateMatchScore(source, candidate);
        return { ...candidate, matchScore: total, matchBreakdown: breakdown, matchDetails: details };
      })
      .filter((p) => p.matchScore >= 15)            // seuil minimum
      .sort((a, b) => b.matchScore - a.matchScore)  // meilleurs en premier
      .slice(0, 5);                                  // max 5 suggestions

    return res.status(200).json({
      success: true,
      data: { suggestions: scored },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/posts/:id/matches
 * Retourne les annonces correspondantes pour une annonce existante.
 * Utilisé sur la page de détail d'une annonce.
 * Public — pas d'auth requise.
 */
const getPostMatches = async (req, res, next) => {
  try {
    const { id } = req.params;

    const source = await Post.findById(id).lean();
    if (!source) {
      return res.status(404).json({ success: false, message: 'Annonce introuvable.' });
    }

    // On cherche le type opposé
    const oppositeType = source.type === 'lost' ? 'found' : 'lost';

    // Filtre large : même objectType, fenêtre ±90 jours
    const filter = {
      status: 'active',
      type:   oppositeType,
      _id:    { $ne: source._id },
    };

    if (source.objectType) filter.objectType = source.objectType;

    if (source.date) {
      const d    = new Date(source.date);
      const from = new Date(d); from.setDate(from.getDate() - 90);
      const to   = new Date(d); to.setDate(to.getDate()   + 90);
      filter.date = { $gte: from, $lte: to };
    }

    const candidates = await Post.find(filter)
      .sort({ date: -1 })
      .limit(50)
      .populate('author', 'name')
      .lean();

    // Score chaque candidat vs l'annonce source
    const scored = candidates
      .map((candidate) => {
        const { total, breakdown, details } = calculateMatchScore(source, candidate);
        return { ...candidate, matchScore: total, matchBreakdown: breakdown, matchDetails: details };
      })
      .filter((p) => p.matchScore >= 15)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5);

    return res.status(200).json({
      success: true,
      data: {
        source: {
          _id:        source._id,
          type:       source.type,
          objectType: source.objectType,
          city:       source.city,
          date:       source.date,
        },
        matches: scored,
      },
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'ID invalide.' });
    }
    next(error);
  }
};

module.exports = {
  createPost, getPosts, getPostById,
  deletePost, resolvePost, matchPost, updatePost, archivePost,
  getMatchingSuggestions, getPostMatches,
};