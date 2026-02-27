import { logger } from '../utils/logger.js';
import mongoose from 'mongoose';
import { AppError } from '../utils/AppError.js';
import { captureException } from '../config/sentry.js';

/**
 * Global error handler middleware
 *
 * Uses AppError.isOperational to decide whether to expose
 * the real message. Operational errors are expected business
 * errors; everything else gets a generic "Server Error".
 */
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = 'Server Error';
  let details = null;

  // ── Log (always full details server-side) ────────────────────────────────
  logger.error('Error:', {
    name: err.name,
    message: err.message,
    statusCode,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  // ── AppError — our custom class ──────────────────────────────────────────
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  }

  // ── Mongoose CastError (bad ObjectId) ────────────────────────────────────
  else if (err instanceof mongoose.Error.CastError) {
    statusCode = 404;
    message = 'Resource not found';
  }

  // ── Mongoose duplicate key ───────────────────────────────────────────────
  else if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    statusCode = 400;
    message = `Duplicate value for ${field}`;
  }

  // ── Mongoose validation ──────────────────────────────────────────────────
  else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = 'Validation failed';
    details = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
  }

  // ── JWT errors ───────────────────────────────────────────────────────────
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // ── Legacy app errors (statusCode attached manually) ─────────────────────
  else if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // ── Auth service errors (string matching — for backward compat) ──────────
  else if (
    statusCode < 500 ||
    (err.message && (
      err.message.includes('Invalid email') ||
      err.message.includes('already exists') ||
      err.message.includes('deactivated') ||
      err.message.includes('locked') ||
      err.message.includes('password') ||
      err.message.includes('Google') ||
      err.message.includes('refresh token') ||
      err.message.includes('Authorization code')
    ))
  ) {
    message = err.message;
    if (statusCode >= 500) statusCode = 400;
  }

  // ── Build response ──────────────────────────────────────────────────────
  const response = {
    success: false,
    message
  };

  if (details) response.errors = details;

  // Stack trace only in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.message = err.message || message;
  }

  // Report non-operational (5xx) errors to Sentry
  if (statusCode >= 500) {
    captureException(err, {
      user: req.user,
      tags: { path: req.path, method: req.method },
      extra: { statusCode },
    });
  }

  res.status(statusCode).json(response);
};
