import express from 'express';
import {
  register,
  login,
  googleAuth,
  refresh,
  logout,
  getMe,
  changeUserPassword
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { authRateLimiter, apiRateLimiter, sensitiveRateLimiter } from '../middleware/rateLimiter.js';
import { validators, handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.post('/register', authRateLimiter, validators.register, handleValidationErrors, register);
router.post('/login', authRateLimiter, validators.login, handleValidationErrors, login);
router.post('/google', authRateLimiter, googleAuth);
router.post('/refresh', apiRateLimiter, refresh);

// Protected routes
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.post('/change-password', authenticate, sensitiveRateLimiter, validators.changePassword, handleValidationErrors, changeUserPassword);

export default router;

