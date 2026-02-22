import express from 'express';
import {
  register,
  login,
  googleAuth,
  refresh,
  logout,
  getMe,
  changeUserPassword,
  forgotPassword,
  resetUserPassword,
  deleteAccount
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import {
  authRateLimiter,
  apiRateLimiter,
  sensitiveRateLimiter,
  registerIpRateLimiter,
  registerEmailRateLimiter,
  forgotPasswordIpRateLimiter,
  forgotPasswordEmailRateLimiter,
  resetPasswordRateLimiter
} from '../middleware/rateLimiter.js';
import { validators, handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.post(
  '/register',
  registerIpRateLimiter,
  registerEmailRateLimiter,
  validators.register,
  handleValidationErrors,
  register
);
router.post('/login', authRateLimiter, validators.login, handleValidationErrors, login);
router.post('/google', authRateLimiter, googleAuth);
router.post('/refresh', apiRateLimiter, refresh);
router.post('/forgot-password', forgotPasswordIpRateLimiter, forgotPasswordEmailRateLimiter, validators.forgotPassword, handleValidationErrors, forgotPassword);
router.post('/reset-password', resetPasswordRateLimiter, validators.resetPassword, handleValidationErrors, resetUserPassword);

// Protected routes
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.post('/change-password', authenticate, sensitiveRateLimiter, validators.changePassword, handleValidationErrors, changeUserPassword);
router.delete('/account', authenticate, sensitiveRateLimiter, deleteAccount);

export default router;

