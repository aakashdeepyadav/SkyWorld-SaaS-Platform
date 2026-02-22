import express from 'express';
import {
  getPayments,
  getPayment,
  createPayment,
  updatePaymentStatus,
  createRazorpayOrder,
  verifyRazorpayPayment,
  razorpayWebhook
} from '../controllers/paymentController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize, adminOnly } from '../middleware/rbac.js';
import { ROLES } from '../utils/constants.js';
import { apiRateLimiter } from '../middleware/rateLimiter.js';
import { validators, handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

router.post('/razorpay/webhook', razorpayWebhook);

// All routes require authentication
router.use(authenticate);
router.use(apiRateLimiter);

router.get('/', authorize(ROLES.CLIENT, ROLES.ADMIN), validators.pagination, handleValidationErrors, getPayments);
router.get('/:id', authorize(ROLES.CLIENT, ROLES.ADMIN), validators.mongoId, handleValidationErrors, getPayment);
router.post('/', authorize(ROLES.CLIENT, ROLES.ADMIN), createPayment);
router.post('/razorpay/order', authorize(ROLES.CLIENT, ROLES.ADMIN), createRazorpayOrder);
router.post('/razorpay/verify', authorize(ROLES.CLIENT, ROLES.ADMIN), verifyRazorpayPayment);
router.put('/:id/status', adminOnly, validators.mongoId, handleValidationErrors, updatePaymentStatus);

export default router;

