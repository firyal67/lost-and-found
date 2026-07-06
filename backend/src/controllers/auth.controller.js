const User = require('../models/User.model');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt.utils');

const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

/**
 * POST /api/auth/register
 * US-01: Create user account with email & password
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {//on empeche l'utilisateur qui a deja un compte
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const user = await User.create({ name, email, password });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    await User.findByIdAndUpdate(user._id, { $push: { refreshTokens: refreshToken } });

    setRefreshCookie(res, refreshToken);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: { user, accessToken },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * US-02: Sign in with email & password
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been suspended.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    await User.findByIdAndUpdate(user._id, { $push: { refreshTokens: refreshToken } });

    setRefreshCookie(res, refreshToken);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      data: { user, accessToken },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login };