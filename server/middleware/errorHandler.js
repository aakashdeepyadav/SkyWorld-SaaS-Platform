import { logger } from '../utils/logger.js';
import mongoose from 'mongoose';

/**
 * Global error handler middleware
 * 
 * Security: In production, never expose raw error messages to clients.
 * Only known/expected errors get their messages forwarded.
 */
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = 'Server Error';
  let isKnownError = false;

  // Log error (always log full details server-side)
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  // ─── Known Error Types (safe to expose message) ──────────────────────────

  // Mongoose bad ObjectId
  if (err instanceof mongoose.Error.CastError) {
    message = 'Resource not found';
    statusCode = 404;
    isKnownError = true;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    message = `Duplicate value for ${field}`;
    statusCode = 400;
    isKnownError = true;
  }

  // Mongoose validation error
  if (err instanceof mongoose.Error.ValidationError) {
    message = Object.values(err.errors).map(val => val.message).join(', ');
    statusCode = 400;
    isKnownError = true;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    message = 'Invalid token';
    statusCode = 401;
    isKnownError = true;
  }

  if (err.name === 'TokenExpiredError') {
    message = 'Token expired';
    statusCode = 401;
    isKnownError = true;
  }

  // Use statusCode from our app errors (e.g. authService.appError)
  if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
    statusCode = err.statusCode;
    message = err.message;
    isKnownError = true;
  }

  // Application-level errors (thrown with new Error('message'))
  // These are errors we explicitly throw in our code — safe to expose
  if (!isKnownError && statusCode < 500) {
    message = err.message;
    isKnownError = true;
  }

  // For auth service errors (login, register, etc.)
  if (!isKnownError && err.message && (
    err.message.includes('Invalid email') ||
    err.message.includes('already exists') ||
    err.message.includes('deactivated') ||
    err.message.includes('locked') ||
    err.message.includes('password') ||
    err.message.includes('Google') ||
    err.message.includes('refresh token') ||
    err.message.includes('Authorization code')
  )) {
    message = err.message;
    statusCode = 400;
    isKnownError = true;
  }

  // ─── Response ────────────────────────────────────────────────────────────

  const response = {
    success: false,
    message
  };

  // Only include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    // In development, always show the real message for debugging
    response.message = err.message || message;
  }

  res.status(statusCode).json(response);
};
