const Post = require('../models/Post.model');

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

    const filter = { status: 'active' }; // afficher uniquement les annonces actives

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

    return res.status(200).json({
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

module.exports = { createPost, getPosts, getPostById };
