import express from 'express';
import {
  getMessages,
  createMessage,
  markAsRead
} from '../controllers/messageController.js';
import { authenticate } from '../middleware/auth.js';
import { apiRateLimiter } from '../middleware/rateLimiter.js';
import { validators, handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);
router.use(apiRateLimiter);

router.get('/', validators.pagination, handleValidationErrors, getMessages);
router.post('/', validators.createMessage, handleValidationErrors, createMessage);
router.put('/:id/read', validators.mongoId, handleValidationErrors, markAsRead);

export default router;

