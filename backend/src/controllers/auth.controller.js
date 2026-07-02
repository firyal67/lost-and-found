const User = require('../models/User.model');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt.utils');

/**
 * POST /api/auth/register
 * US-01: Create user account with email & password
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const user = await User.create({ name, email, password });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    await User.findByIdAndUpdate(user._id, {
      $push: { refreshTokens: refreshToken },
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: { user, accessToken },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register };
