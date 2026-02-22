import express from 'express';
import {
  getRequests,
  getRequest,
  createRequest,
  assignDeveloper,
  updateRequestStatus
} from '../controllers/requestController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize, adminOnly } from '../middleware/rbac.js';
import { ROLES } from '../utils/constants.js';
import { apiRateLimiter } from '../middleware/rateLimiter.js';
import { validators, handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);
router.use(apiRateLimiter);

// Admin can manually create direct requests
router.post('/', adminOnly, validators.createServiceRequest, handleValidationErrors, createRequest);

// All authenticated users can view their requests
router.get('/', validators.pagination, handleValidationErrors, getRequests);
router.get('/:id', validators.mongoId, handleValidationErrors, getRequest);

// Admin can assign developers
router.put('/:id/assign', adminOnly, validators.mongoId, handleValidationErrors, assignDeveloper);

// Update status (admin or assigned developer)
router.put('/:id/status', authorize(ROLES.ADMIN, ROLES.DEVELOPER), validators.mongoId, handleValidationErrors, updateRequestStatus);

export default router;

