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
  deleteAccount,
  restoreAccount,
  verifyAuthOtp,
  resendAuthOtp
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import {
  setup2FA,
  verifySetup2FA,
  disable2FA,
  verify2FALogin,
} from '../controllers/twoFactorController.js';
import {
  authRateLimiter,
  apiRateLimiter,
  sensitiveRateLimiter,
  registerIpRateLimiter,
  registerEmailRateLimiter,
  forgotPasswordIpRateLimiter,
  forgotPasswordEmailRateLimiter,
  resetPasswordRateLimiter,
  otpSendIpRateLimiter,
  otpSendEmailRateLimiter,
  otpVerifyIpRateLimiter,
  otpVerifyEmailRateLimiter
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
router.post('/verify-otp', otpVerifyIpRateLimiter, otpVerifyEmailRateLimiter, validators.verifyAuthOtp, handleValidationErrors, verifyAuthOtp);
router.post('/resend-otp', otpSendIpRateLimiter, otpSendEmailRateLimiter, validators.resendAuthOtp, handleValidationErrors, resendAuthOtp);
router.post('/refresh', apiRateLimiter, refresh);
router.post('/forgot-password', forgotPasswordIpRateLimiter, forgotPasswordEmailRateLimiter, validators.forgotPassword, handleValidationErrors, forgotPassword);
router.post('/reset-password', resetPasswordRateLimiter, validators.resetPassword, handleValidationErrors, resetUserPassword);

// 2FA — public (completes login)
router.post('/2fa/verify', authRateLimiter, verify2FALogin);

// Protected routes
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.post('/change-password', authenticate, sensitiveRateLimiter, validators.changePassword, handleValidationErrors, changeUserPassword);
router.delete('/account', authenticate, sensitiveRateLimiter, deleteAccount);
router.post('/restore-account', authenticate, restoreAccount);

// 2FA — authenticated (setup/manage)
router.post('/2fa/setup', authenticate, sensitiveRateLimiter, setup2FA);
router.post('/2fa/verify-setup', authenticate, sensitiveRateLimiter, verifySetup2FA);
router.post('/2fa/disable', authenticate, sensitiveRateLimiter, disable2FA);

export default router;
