import rateLimit from 'express-rate-limit';
import { RATE_LIMITS } from '../utils/constants.js';

/**
 * Global rate limiter — applied to ALL routes
 * Catches bot scraping and DDoS attempts
 */
export const globalRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.global.windowMs,
  max: RATE_LIMITS.global.max,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for health checks
  skip: (req) => req.path === '/health'
});

/**
 * Rate limiter for authentication endpoints (login, register, google)
 */
export const authRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.auth.windowMs,
  max: RATE_LIMITS.auth.max,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

const normalizeEmail = (value) => (
  typeof value === 'string'
    ? value.trim().toLowerCase()
    : ''
);

/**
 * Dedicated signup limiter by IP.
 * Counts all responses (including successful registration) to prevent mass signups.
 */
export const registerIpRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.register.windowMs,
  max: RATE_LIMITS.register.max,
  message: {
    success: false,
    message: 'Too many signup attempts from this IP. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Signup limiter by email (additional guard).
 * Protects a single email from repeated signup abuse across retries.
 */
export const registerEmailRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.registerEmail.windowMs,
  max: RATE_LIMITS.registerEmail.max,
  keyGenerator: (req) => {
    const email = normalizeEmail(req.body?.email);
    return email ? `register-email:${email}` : `register-email-ip:${req.ip}`;
  },
  message: {
    success: false,
    message: 'Too many signup attempts for this email. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Forgot password limiter by IP.
 */
export const forgotPasswordIpRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.forgotPassword.windowMs,
  max: RATE_LIMITS.forgotPassword.max,
  message: {
    success: false,
    message: 'Too many password reset requests from this IP. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Forgot password limiter by email.
 */
export const forgotPasswordEmailRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.forgotPasswordEmail.windowMs,
  max: RATE_LIMITS.forgotPasswordEmail.max,
  keyGenerator: (req) => {
    const email = normalizeEmail(req.body?.email);
    return email ? `forgot-email:${email}` : `forgot-email-ip:${req.ip}`;
  },
  message: {
    success: false,
    message: 'Too many password reset requests for this email. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Reset password limiter by IP.
 */
export const resetPasswordRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.resetPassword.windowMs,
  max: RATE_LIMITS.resetPassword.max,
  message: {
    success: false,
    message: 'Too many password reset attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter for sensitive operations (password change, etc.)
 */
export const sensitiveRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.sensitive.windowMs,
  max: RATE_LIMITS.sensitive.max,
  message: {
    success: false,
    message: 'Too many attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * General API rate limiter — applied per-route group
 */
export const apiRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.api.windowMs,
  max: RATE_LIMITS.api.max,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
