import express from 'express';
import {
  getUsers,
  getUser,
  getMyProfile,
  updateMyProfile,
  updateUserRole,
  updateUserStatus
} from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { adminOnly } from '../middleware/rbac.js';
import { apiRateLimiter } from '../middleware/rateLimiter.js';
import { validators, handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);
router.use(apiRateLimiter);

// Profile routes (all authenticated users)
router.get('/profile/me', getMyProfile);
router.put('/profile/me', validators.updateProfile, handleValidationErrors, updateMyProfile);

// Admin routes
router.get('/', adminOnly, validators.pagination, handleValidationErrors, getUsers);
router.get('/:id', adminOnly, validators.mongoId, handleValidationErrors, getUser);
router.put('/:id/role', adminOnly, validators.mongoId, handleValidationErrors, updateUserRole);
router.put('/:id/status', adminOnly, validators.mongoId, handleValidationErrors, updateUserStatus);

export default router;

