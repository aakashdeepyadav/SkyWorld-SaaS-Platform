import { registerUser, loginUser, verifyGoogleToken, generateTokens, setTokenCookies, clearTokenCookies, refreshAccessToken, changePassword } from '../services/authService.js';
import { createAuditLog } from '../middleware/auth.js';
import { OAuth2Client } from 'google-auth-library';
import { logger } from '../utils/logger.js';

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

    const user = await registerUser(email, password, name);
    const { accessToken, refreshToken } = generateTokens(user._id);
    setTokenCookies(res, accessToken, refreshToken);

    await createAuditLog(req, 'user_registered', 'user', user._id, { method: 'email' });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: user.toPublicJSON()
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
    const { sub: googleId, email, name, picture: avatar } = payload;

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
    logger.error('Google auth error:', error.message);
    await createAuditLog(req, 'user_login', 'auth', null, { method: 'google', success: false, error: error.message });

    // Return a more specific error message for known Google OAuth errors
    const googleError = error.response?.data?.error || error.message || 'Unknown error';
    const googleErrorDescription = error.response?.data?.error_description || '';

    res.status(401).json({
      success: false,
      message: 'Google authentication failed',
      error: process.env.NODE_ENV !== 'production' ? `${googleError}: ${googleErrorDescription}` : 'Google authentication failed. Please try again.'
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
    const { currentPassword, newPassword } = req.body;

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

