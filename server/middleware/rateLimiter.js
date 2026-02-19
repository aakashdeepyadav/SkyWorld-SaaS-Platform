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
