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

module.exports = { createPost };
