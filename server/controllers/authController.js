import {
  registerUser,
  loginUser,
  verifyGoogleToken,
  generateTokens,
  setTokenCookies,
  clearTokenCookies,
  refreshAccessToken,
  changePassword,
  requestPasswordReset,
  resetPassword,
  sendEmailOtpChallenge,
  verifyEmailOtpChallenge,
  getUserForOtp
} from '../services/authService.js';
import { createAuditLog } from '../middleware/auth.js';
import { OAuth2Client } from 'google-auth-library';
import { logger } from '../utils/logger.js';
import User from '../models/User.js';
import { ROLES } from '../utils/constants.js';

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
export const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    let user = await getUserForOtp(email);

    if (user?.googleId && !user.password) {
      return res.status(400).json({
        success: false,
        message: 'This account uses Google login. Please continue with Google.'
      });
    }

    if (user?.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    if (!user) {
      user = await registerUser(email, password, name);
    } else {
      user.name = name;
      user.password = password;
      user.role = ROLES.CLIENT;
      user.isActive = true;
      await user.save();
    }

    const challenge = await sendEmailOtpChallenge(user, 'register');
    await createAuditLog(req, 'email_otp_sent', 'auth', user._id, { purpose: 'register' });

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email. Verify to complete registration.',
      requiresOtp: true,
      ...challenge
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await loginUser(email, password);

    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Email not verified. Complete signup OTP verification first.'
      });
    }

    // ── 2FA Challenge ────────────────────────────────────────────────────
    if (user.twoFactorEnabled) {
      // Don't issue tokens yet — return a temp token for the 2FA verify step
      const tempToken = Buffer.from(
        JSON.stringify({ uid: user._id.toString(), ts: Date.now() })
      ).toString('base64');

      return res.json({
        success: true,
        twoFactorRequired: true,
        tempToken,
        message: 'Two-factor authentication required',
      });
    }

    // ── Standard login (no 2FA) ──────────────────────────────────────────
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const { accessToken, refreshToken } = generateTokens(user._id);
    setTokenCookies(res, accessToken, refreshToken);

    await createAuditLog(req, 'user_login', 'auth', user._id, { method: 'email', success: true });

    res.json({
      success: true,
      message: 'Login successful',
      user: user.toPublicJSON()
    });
  } catch (error) {
    await createAuditLog(req, 'user_login', 'auth', null, { method: 'email', success: false, error: error.message });
    next(error);
  }
};

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify signup OTP and complete registration
 * @access  Public
 */
export const verifyAuthOtp = async (req, res, next) => {
  try {
    const { email, otp, purpose } = req.body;
    if (purpose !== 'register') {
      return res.status(400).json({
        success: false,
        message: 'OTP verification is only available for signup'
      });
    }

    const user = await verifyEmailOtpChallenge(email, otp, purpose);

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const { accessToken, refreshToken } = generateTokens(user._id);
    setTokenCookies(res, accessToken, refreshToken);

    if (purpose === 'register') {
      await createAuditLog(req, 'user_registered', 'user', user._id, { method: 'email_otp' });
    }
    await createAuditLog(req, 'user_login', 'auth', user._id, { method: 'email_otp', success: true });

    res.json({
      success: true,
      message: 'Registration successful',
      user: user.toPublicJSON()
    });
  } catch (error) {
    await createAuditLog(req, 'email_otp_verify', 'auth', null, { success: false, error: error.message });
    next(error);
  }
};

/**
 * @route   POST /api/auth/resend-otp
 * @desc    Resend OTP for signup verification
 * @access  Public
 */
export const resendAuthOtp = async (req, res, next) => {
  try {
    const { email, purpose } = req.body;
    if (purpose && purpose !== 'register') {
      return res.status(400).json({
        success: false,
        message: 'OTP resend is only available for signup verification'
      });
    }

    const user = await getUserForOtp(email);

    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists, OTP has been sent.'
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Account already verified. You can log in directly.'
      });
    }

    const challenge = await sendEmailOtpChallenge(user, 'register');
    await createAuditLog(req, 'email_otp_sent', 'auth', user._id, { purpose: 'register', resend: true });

    res.json({
      success: true,
      message: 'OTP resent successfully',
      requiresOtp: true,
      ...challenge
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/google
 * @desc    Google OAuth login
 * @access  Public
 */
export const googleAuth = async (req, res, next) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code is required'
      });
    }

    // Exchange code for tokens
    const { tokens } = await googleClient.getToken(code);
    googleClient.setCredentials(tokens);

    // Get user info from Google
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture: avatar, email_verified: emailVerified } = payload;

    if (!emailVerified) {
      return res.status(401).json({
        success: false,
        message: 'Google account email is not verified'
      });
    }

    // Verify and get/create user
    const user = await verifyGoogleToken(googleId, email, name, avatar);
    const { accessToken, refreshToken } = generateTokens(user._id);
    setTokenCookies(res, accessToken, refreshToken);

    await createAuditLog(req, 'user_login', 'auth', user._id, { method: 'google', success: true });

    res.json({
      success: true,
      message: 'Google login successful',
      user: user.toPublicJSON()
    });
  } catch (error) {
    // Log comprehensive error details for debugging
    const errMsg = error.message || 'No message';
    const errData = error.response?.data ? JSON.stringify(error.response.data) : 'No response data';
    const errStatus = error.response?.status || 'No status';
    logger.error(`Google auth error: ${errMsg} | Status: ${errStatus} | Data: ${errData}`);
    await createAuditLog(req, 'user_login', 'auth', null, { method: 'google', success: false, error: errMsg });

    // Return a more specific error message for known Google OAuth errors
    const googleError = error.response?.data?.error || error.message || 'Unknown error';
    const googleErrorDescription = error.response?.data?.error_description || '';

    res.status(401).json({
      success: false,
      message: 'Google authentication failed',
      error: `${googleError}: ${googleErrorDescription}`.trim()
    });
  }
};

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
export const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not found'
      });
    }

    const { accessToken, user } = await refreshAccessToken(refreshToken);

    // Set new access token cookie
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000
    });

    res.json({
      success: true,
      message: 'Token refreshed',
      user: user.toPublicJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
export const logout = async (req, res, next) => {
  try {
    await createAuditLog(req, 'user_logout', 'auth', req.user?._id);
    clearTokenCookies(res);

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
export const getMe = async (req, res, next) => {
  try {
    res.json({
      success: true,
      user: req.user.toPublicJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/change-password
 * @desc    Change password
 * @access  Private
 */
export const changeUserPassword = async (req, res, next) => {
  try {
    const currentPassword = req.body.currentPassword != null ? String(req.body.currentPassword).trim() : '';
    const newPassword = req.body.newPassword != null ? String(req.body.newPassword).trim() : '';

    await changePassword(req.user._id, currentPassword, newPassword);
    await createAuditLog(req, 'password_changed', 'user', req.user._id);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
export const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  try {
    const result = await requestPasswordReset(email);
    await createAuditLog(req, 'password_reset_requested', 'auth', null, { email });

    res.json(result);
  } catch (error) {
    await createAuditLog(req, 'password_reset_requested', 'auth', null, { email, success: false, error: error.message });
    next(error);
  }
};

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
export const resetUserPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const result = await resetPassword(token, password);
    await createAuditLog(req, 'password_reset_completed', 'auth', null, { success: true });

    res.json(result);
  } catch (error) {
    await createAuditLog(req, 'password_reset_completed', 'auth', null, { success: false, error: error.message });
    next(error);
  }
};

/**
 * @route   DELETE /api/auth/account
 * @desc    Soft-delete user account (deactivate)
 * @access  Private
 */
export const deleteAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Soft-delete: deactivate instead of removing to preserve data integrity
    user.isActive = false;
    await user.save();

    await createAuditLog(req, 'account_deleted', 'user', user._id, { email: user.email });

    clearTokenCookies(res);

    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    logger.error('Delete account error:', error);
    next(error);
  }
};
