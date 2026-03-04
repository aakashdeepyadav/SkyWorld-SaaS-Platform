import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { apiRateLimiter } from '../middleware/rateLimiter.js';
import { validators, handleValidationErrors } from '../middleware/validation.js';
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getUnreadCount,
} from '../controllers/notificationController.js';

const router = express.Router();

// All notification routes require authentication
router.use(authenticate);
router.use(apiRateLimiter);

router.get('/', validators.pagination, handleValidationErrors, getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', validators.mongoId, handleValidationErrors, markAsRead);
router.delete('/:id', validators.mongoId, handleValidationErrors, deleteNotification);

export default router;
