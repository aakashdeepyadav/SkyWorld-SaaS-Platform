import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { ROLES, LOCKOUT_POLICY } from '../utils/constants.js';
import { logger } from '../utils/logger.js';
import { emailService } from './emailService.js';

const AUTH_OTP_EXPIRY_MS = 10 * 60 * 1000;
const AUTH_OTP_MAX_ATTEMPTS = 5;
const AUTH_OTP_RESEND_COOLDOWN_MS = 30 * 1000;
const AUTH_OTP_EMAIL_SEND_TIMEOUT_MS = 20 * 1000;

/**
 * Normalize an email address:
 * - lowercase + trim
 * - For Gmail/Googlemail: strip dots from the local part
 *   (Gmail treats play.w@gmail.com and playw@gmail.com as identical)
 */
export const normalizeEmail = (email) => {
  if (!email || typeof email !== 'string') return email;
  const trimmed = email.trim().toLowerCase();
  const atIdx = trimmed.lastIndexOf('@');
  if (atIdx === -1) return trimmed;
  const local = trimmed.slice(0, atIdx);
  const domain = trimmed.slice(atIdx + 1);
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    return `${local.replace(/\./g, '')}@${domain}`;
  }
  return trimmed;
};

/**
 * Generate JWT tokens
 */
export const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_ACCESS_SECRET,
    { algorithm: 'HS256', expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { algorithm: 'HS256', expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
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
    const normalized = normalizeEmail(email);
    // Check if user exists
    const existingUser = await User.findOne({ email: normalized });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Create user with CLIENT role (default)
    const user = await User.create({
      email: normalized,
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
    const normalized = normalizeEmail(email);
    // Select password AND lockout fields (they are select: false)
    const user = await User.findOne({ email: normalized })
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
    const normalizedEmail = normalizeEmail(email);
    user = await User.findOne({ email: normalizedEmail });
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
      email: normalizedEmail,
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
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, { algorithms: ['HS256'] });
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
 * Attach status code to error for HTTP response
 */
function appError(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

const generateSixDigitOtp = () => String(crypto.randomInt(100000, 999999));

const hashOtp = (otp) => crypto.createHash('sha256').update(String(otp)).digest('hex');

const isHashEqual = (expected, provided) => {
  if (!expected || !provided || expected.length !== provided.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
};

const withTimeout = (promise, timeoutMs, timeoutMessage) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(appError(timeoutMessage, 503)), timeoutMs);
    })
  ]);
};

export const sendEmailOtpChallenge = async (user, purpose) => {
  if (!user) throw appError('User not found', 404);
  if (purpose !== 'register') throw appError('Invalid OTP purpose', 400);
  if (!user.isActive) throw appError('Account is deactivated. Contact support.', 403);

  const now = Date.now();
  const lastSentAt = user.emailOtpLastSentAt ? new Date(user.emailOtpLastSentAt).getTime() : 0;
  if (lastSentAt && now - lastSentAt < AUTH_OTP_RESEND_COOLDOWN_MS) {
    const seconds = Math.ceil((AUTH_OTP_RESEND_COOLDOWN_MS - (now - lastSentAt)) / 1000);
    throw appError(`Please wait ${seconds}s before requesting another OTP`, 429);
  }

  const otp = generateSixDigitOtp();
  user.emailOtpCodeHash = hashOtp(otp);
  user.emailOtpPurpose = purpose;
  user.emailOtpExpiresAt = new Date(now + AUTH_OTP_EXPIRY_MS);
  user.emailOtpAttempts = 0;
  await user.save({ validateBeforeSave: false });

  try {
    const sent = await withTimeout(
      emailService.sendAuthOtpEmail(user, otp, purpose),
      AUTH_OTP_EMAIL_SEND_TIMEOUT_MS,
      'OTP email service timed out. Please try again shortly.'
    );
    if (!sent) {
      throw appError('Failed to send OTP email. Please try again.', 503);
    }
  } catch (error) {
    // Reset OTP challenge state if delivery failed, so users can retry immediately.
    user.emailOtpCodeHash = undefined;
    user.emailOtpPurpose = undefined;
    user.emailOtpExpiresAt = undefined;
    user.emailOtpAttempts = 0;
    user.emailOtpLastSentAt = undefined;
    await user.save({ validateBeforeSave: false });
    throw error;
  }

  // Cooldown starts only after successful delivery.
  user.emailOtpLastSentAt = new Date(now);
  await user.save({ validateBeforeSave: false });

  return {
    email: user.email,
    purpose,
    expiresInSeconds: Math.floor(AUTH_OTP_EXPIRY_MS / 1000)
  };
};

export const verifyEmailOtpChallenge = async (email, otp, purpose) => {
  if (purpose !== 'register') {
    throw appError('Invalid OTP purpose', 400);
  }

  const normalized = normalizeEmail(email);
  const user = await User.findOne({ email: normalized })
    .select('+emailOtpCodeHash +emailOtpPurpose +emailOtpExpiresAt +emailOtpAttempts +emailOtpLastSentAt');

  if (!user) {
    throw appError('Invalid or expired OTP', 400);
  }

  if (!user.isActive) {
    throw appError('Account is deactivated. Contact support.', 403);
  }

  if (!user.emailOtpCodeHash || !user.emailOtpPurpose || !user.emailOtpExpiresAt) {
    throw appError('No OTP challenge found. Please request a new OTP.', 400);
  }

  if (user.emailOtpPurpose !== purpose) {
    throw appError('OTP purpose mismatch. Please request a new OTP.', 400);
  }

  if (new Date(user.emailOtpExpiresAt).getTime() < Date.now()) {
    throw appError('OTP expired. Please request a new OTP.', 400);
  }

  if ((user.emailOtpAttempts || 0) >= AUTH_OTP_MAX_ATTEMPTS) {
    throw appError('Too many invalid OTP attempts. Please request a new OTP.', 429);
  }

  const providedOtpHash = hashOtp(String(otp).trim());
  const valid = isHashEqual(user.emailOtpCodeHash, providedOtpHash);

  if (!valid) {
    user.emailOtpAttempts = (user.emailOtpAttempts || 0) + 1;
    await user.save({ validateBeforeSave: false });
    throw appError('Invalid OTP', 400);
  }

  user.emailOtpCodeHash = undefined;
  user.emailOtpPurpose = undefined;
  user.emailOtpExpiresAt = undefined;
  user.emailOtpAttempts = 0;
  user.emailOtpLastSentAt = undefined;

  if (purpose === 'register') {
    user.emailVerified = true;
  }

  await user.save({ validateBeforeSave: false });
  return user;
};

export const getUserForOtp = async (email) => {
  const normalized = normalizeEmail(email);
  return User.findOne({ email: normalized })
    .select('+password +emailOtpCodeHash +emailOtpPurpose +emailOtpExpiresAt +emailOtpAttempts +emailOtpLastSentAt');
};

/**
 * Change password — production-grade: trim input, validate, hash, audit, optional email.
 */
export const changePassword = async (userId, currentPassword, newPassword) => {
  const cur = typeof currentPassword === 'string' ? currentPassword.trim() : '';
  const neu = typeof newPassword === 'string' ? newPassword.trim() : '';

  if (!cur || !neu) {
    throw appError('Current password and new password are required', 400);
  }

  const user = await User.findById(userId).select('+password');
  if (!user || !user.password) {
    throw appError('Password change not available for this account', 403);
  }

  const isPasswordValid = await user.comparePassword(cur);
  if (!isPasswordValid) {
    throw appError('Current password is incorrect', 400);
  }

  const isSamePassword = await user.comparePassword(neu);
  if (isSamePassword) {
    throw appError('New password must be different from current password', 400);
  }

  user.password = neu;
  await user.save();

  // Send confirmation email (non-blocking: do not fail password change if email fails)
  emailService.sendPasswordChangeEmail(user).catch((err) => {
    logger.warn('Password change confirmation email failed:', err.message);
  });

  return user;
};

/**
 * Request password reset
 */
export const requestPasswordReset = async (email) => {
  try {
    const normalized = normalizeEmail(email);

    // Find user with password reset fields
    const user = await User.findOne({ email: normalized })
      .select('+password +passwordResetToken +passwordResetExpires +passwordResetAttempts');

    if (!user) {
      throw appError('No account found with this email address.', 404);
    }

    if (!user.isActive) {
      throw appError('This account has been deactivated. Contact support.', 403);
    }

    // Check if password reset is locked
    if (user.passwordResetExpires && user.passwordResetExpires > Date.now()) {
      if (user.passwordResetAttempts >= 2) {
        const minutesLeft = Math.ceil((user.passwordResetExpires - Date.now()) / (60 * 1000));
        throw new Error(`Too many reset attempts. Try again in ${minutesLeft} minutes.`);
      }
    } else if (user.passwordResetAttempts >= 2) {
      // Lockout expired — reset counter
      user.passwordResetAttempts = 0;
      await user.save({ validateBeforeSave: false });
    }

    // Generate reset token (works for both email/password AND Google OAuth users)
    const resetToken = user.createPasswordResetToken();
    await user.save();

    // Send reset email
    const emailSent = await emailService.sendPasswordResetEmail(user, resetToken);

    if (!emailSent) {
      throw new Error('Failed to send reset email. Please try again.');
    }

    logger.info(`Password reset requested for email: ${normalized}`);

    return { success: true, message: 'Password reset link sent to your email', emailSent: true };
  } catch (error) {
    logger.error('Password reset request error:', error);
    throw error;
  }
};

/**
 * Reset password with token
 */
export const resetPassword = async (token, newPassword) => {
  try {
    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    }).select('+passwordResetToken +passwordResetExpires +passwordResetAttempts');

    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    // Check reset attempts
    if (user.passwordResetAttempts >= 2) {
      throw new Error('Too many reset attempts. Please request a new reset link tomorrow.');
    }

    // Validate new password
    if (newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Update password (and ensure email is verified so user can log in with email+password)
    user.password = newPassword;
    if (!user.emailVerified) user.emailVerified = true;
    user.clearPasswordResetFields();
    await user.save();

    // Send confirmation email
    await emailService.sendPasswordChangeEmail(user);

    logger.info(`Password reset completed for user: ${user.email}`);

    return { success: true, message: 'Password reset successful' };
  } catch (error) {
    logger.error('Password reset error:', error);

    // Increment reset attempts on failure
    if (error.message.includes('Invalid or expired') || error.message.includes('Too many reset')) {
      try {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        await User.findOneAndUpdate(
          { passwordResetToken: hashedToken },
          { $inc: { passwordResetAttempts: 1 } }
        );
      } catch (updateError) {
        logger.error('Failed to increment reset attempts:', updateError);
      }
    }

    throw error;
  }
};
