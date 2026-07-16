const crypto = require('crypto');
const User = require('../models/User.model');
const logger = require('../config/logger');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../utils/jwt.utils');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/email.service');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, COOKIE_OPTIONS);
};

const clearRefreshCookie = (res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
};

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

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

    await User.findByIdAndUpdate(user._id, {
      emailVerificationToken: hashedToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    // En développement, on envoie l'email et on récupère le previewUrl pour l'afficher côté client
    let emailPreviewUrl = null;
    try {
      const result = await sendVerificationEmail({ to: user.email, name: user.name, token: verificationToken });
      emailPreviewUrl = result.previewUrl || null;
      if (emailPreviewUrl) logger.info({ previewUrl: emailPreviewUrl }, 'Email preview available');
    } catch (err) {
      logger.error({ err }, 'Failed to send verification email');
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshTokens = user.refreshTokens ?? [];
    user.refreshTokens.push(refreshToken);
    await user.save();

    setRefreshCookie(res, refreshToken);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully. Please check your email to verify your account.',
      data: {
        user,
        accessToken,
        ...(emailPreviewUrl && { emailPreviewUrl }),
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password +refreshTokens');
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

    user.refreshTokens.push(refreshToken);
    await user.save();

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

const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ success: false, message: 'No refresh token provided.' });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      clearRefreshCookie(res);
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
    }

    const user = await User.findById(decoded.id).select('+refreshTokens');
    if (!user) {
      clearRefreshCookie(res);
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    if (!user.isActive) {
      clearRefreshCookie(res);
      return res.status(401).json({ success: false, message: 'Your account has been suspended.' });
    }

    const tokenIndex = user.refreshTokens.indexOf(token);

    // ── Refresh token reuse detection ────────────────────────────────────
    // If the presented token exists but is NOT the last one (most recent),
    // it indicates token theft — revoke ALL sessions immediately.
    if (tokenIndex === -1) {
      clearRefreshCookie(res);
      return res.status(401).json({ success: false, message: 'Refresh token revoked.' });
    }

    if (tokenIndex !== user.refreshTokens.length - 1) {
      logger.warn({ userId: user._id.toString() }, 'Refresh token reuse detected — revoking all sessions');
      user.refreshTokens = [];
      await user.save();
      clearRefreshCookie(res);
      return res.status(401).json({
        success: false,
        message: 'Session terminated due to security concern. Please log in again.',
      });
    }

    const newRefreshToken = generateRefreshToken(user._id);
    user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
    user.refreshTokens.push(newRefreshToken);
    await user.save();

    const accessToken = generateAccessToken(user._id);
    setRefreshCookie(res, newRefreshToken);

    return res.status(200).json({
      success: true,
      data: { accessToken },
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;

    if (token) {
      try {
        const decoded = verifyRefreshToken(token);
        await User.findByIdAndUpdate(decoded.id, {
          $pull: { refreshTokens: token },
        });
      } catch {
        // token already expired, clear cookie anyway
      }
    }

    clearRefreshCookie(res);
    return res.status(200).json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res) => {
  return res.status(200).json({ success: true, data: { user: req.user } });
};

const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification link.',
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully.',
    });
  } catch (error) {
    next(error);
  }
};

const resendVerification = async (req, res, next) => {  try {
    if (req.user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified.',
      });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

    await User.findByIdAndUpdate(req.user._id, {
      emailVerificationToken: hashedToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    sendVerificationEmail({
      to: req.user.email,
      name: req.user.name,
      token: verificationToken,
    }).catch((err) => logger.error({ err }, 'Failed to resend verification email'));

    return res.status(200).json({
      success: true,
      message: 'Verification email sent. Please check your inbox.',
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Always return 200 to avoid email enumeration
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a reset link has been sent.',
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    await User.findByIdAndUpdate(user._id, {
      passwordResetToken: hashedToken,
      passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });

    sendPasswordResetEmail({ to: user.email, name: user.name, token: resetToken })
      .catch((err) => logger.error({ err }, 'Failed to send password reset email'));

    return res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a reset link has been sent.',
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset link.',
      });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    // Invalidate all existing sessions
    user.refreshTokens = [];
    await user.save();

    clearRefreshCookie(res);

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully. Please log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, refresh, logout, getMe, verifyEmail, resendVerification, forgotPassword, resetPassword };
