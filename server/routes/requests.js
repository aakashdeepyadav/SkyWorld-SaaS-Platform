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

// Client can create requests
router.post('/', authorize(ROLES.CLIENT, ROLES.ADMIN), validators.createServiceRequest, handleValidationErrors, createRequest);

// All authenticated users can view their requests
router.get('/', validators.pagination, handleValidationErrors, getRequests);
router.get('/:id', validators.mongoId, handleValidationErrors, getRequest);

// Admin can assign developers
router.put('/:id/assign', adminOnly, validators.mongoId, handleValidationErrors, assignDeveloper);

// Update status
router.put('/:id/status', validators.mongoId, handleValidationErrors, updateRequestStatus);

export default router;

