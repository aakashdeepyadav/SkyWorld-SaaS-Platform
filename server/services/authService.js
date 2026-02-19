import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ROLES, LOCKOUT_POLICY } from '../utils/constants.js';
import { logger } from '../utils/logger.js';

/**
 * Generate JWT tokens
 */
export const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
  );

  return { accessToken, refreshToken };
};

/**
 * Cookie options — centralized for consistency
 */
const getCookieOptions = (maxAge) => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,          // Not accessible via JavaScript
    secure: isProduction,    // HTTPS only in production
    sameSite: isProduction ? 'none' : 'lax',  // Cross-origin in production
    path: '/',               // Explicit path for reliable clearing
    maxAge
  };
};

/**
 * Set token cookies
 */
export const setTokenCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, getCookieOptions(15 * 60 * 1000)); // 15 min
  res.cookie('refreshToken', refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000)); // 7 days
};

/**
 * Clear token cookies — MUST use same options as set (except maxAge)
 * Browsers silently ignore clearCookie if options don't match
 */
export const clearTokenCookies = (res) => {
  const clearOptions = getCookieOptions(0);
  delete clearOptions.maxAge; // clearCookie doesn't need maxAge
  res.clearCookie('accessToken', clearOptions);
  res.clearCookie('refreshToken', clearOptions);
};

/**
 * Register new user with email/password
 */
export const registerUser = async (email, password, name) => {
  try {
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Create user with CLIENT role (default)
    const user = await User.create({
      email,
      password,
      name,
      role: ROLES.CLIENT,
      emailVerified: false
    });

    return user;
  } catch (error) {
    logger.error('Registration error:', error);
    throw error;
  }
};

/**
 * Login user with email/password — includes account lockout
 */
export const loginUser = async (email, password) => {
  try {
    // Select password AND lockout fields (they are select: false)
    const user = await User.findOne({ email })
      .select('+password +failedLoginAttempts +lockUntil');

    if (!user) {
      // Use generic message to prevent user enumeration
      throw new Error('Invalid email or password');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated. Contact support.');
    }

    // Check if account is locked
    if (user.isLocked) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
      throw new Error(`Account is locked. Try again in ${minutesLeft} minutes.`);
    }

    if (!user.password) {
      throw new Error('Please login with Google or reset your password');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Increment failed attempts
      await user.incrementFailedAttempts(LOCKOUT_POLICY.lockDurationMs);

      const attemptsLeft = LOCKOUT_POLICY.maxAttempts - (user.failedLoginAttempts + 1);
      if (attemptsLeft <= 0) {
        throw new Error(`Account locked for ${LOCKOUT_POLICY.lockDurationMs / (60 * 1000)} minutes due to too many failed attempts.`);
      }
      throw new Error('Invalid email or password');
    }

    // Successful login — reset failed attempts
    await user.resetFailedAttempts();

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    return user;
  } catch (error) {
    logger.error('Login error:', error);
    throw error;
  }
};

/**
 * Verify Google OAuth token and get/create user
 */
export const verifyGoogleToken = async (googleId, email, name, avatar) => {
  try {
    // Check if user exists with Google ID
    let user = await User.findOne({ googleId });

    if (user) {
      // Update last login
      user.lastLogin = new Date();
      if (avatar && !user.avatar) {
        user.avatar = avatar;
      }
      await user.save();
      return user;
    }

    // Check if user exists with email (account linking)
    user = await User.findOne({ email });
    if (user) {
      // Link Google account
      user.googleId = googleId;
      if (avatar) user.avatar = avatar;
      user.lastLogin = new Date();
      await user.save();
      return user;
    }

    // Create new user with CLIENT role
    user = await User.create({
      email,
      googleId,
      name,
      avatar,
      role: ROLES.CLIENT,
      emailVerified: true // Google emails are verified
    });

    return user;
  } catch (error) {
    logger.error('Google OAuth error:', error);
    throw error;
  }
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      throw new Error('Invalid refresh token');
    }

    const { accessToken } = generateTokens(user._id);
    return { accessToken, user };
  } catch (error) {
    logger.error('Token refresh error:', error);
    throw new Error('Invalid or expired refresh token');
  }
};

/**
 * Change password
 */
export const changePassword = async (userId, currentPassword, newPassword) => {
  try {
    const user = await User.findById(userId).select('+password');

    if (!user || !user.password) {
      throw new Error('Password change not available for this account');
    }

    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Prevent reusing the same password
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      throw new Error('New password must be different from current password');
    }

    user.password = newPassword;
    await user.save();

    return user;
  } catch (error) {
    logger.error('Password change error:', error);
    throw error;
  }
};
