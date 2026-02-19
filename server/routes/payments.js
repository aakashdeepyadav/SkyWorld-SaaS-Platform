import express from 'express';
import {
  getPayments,
  getPayment,
  createPayment,
  updatePaymentStatus
} from '../controllers/paymentController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize, adminOnly } from '../middleware/rbac.js';
import { ROLES } from '../utils/constants.js';
import { apiRateLimiter } from '../middleware/rateLimiter.js';
import { validators, handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);
router.use(apiRateLimiter);

router.get('/', validators.pagination, handleValidationErrors, getPayments);
router.get('/:id', validators.mongoId, handleValidationErrors, getPayment);
router.post('/', authorize(ROLES.CLIENT, ROLES.ADMIN), createPayment);
router.put('/:id/status', adminOnly, validators.mongoId, handleValidationErrors, updatePaymentStatus);

export default router;

