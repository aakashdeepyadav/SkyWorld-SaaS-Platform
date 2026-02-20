import express from 'express';
import { getAdminStats } from '../controllers/statsController.js';
import { authenticate } from '../middleware/auth.js';
import { adminOnly } from '../middleware/rbac.js';
import { apiRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All routes require authentication + admin role
router.use(authenticate);
router.use(adminOnly);
router.use(apiRateLimiter);

router.get('/stats', getAdminStats);

export default router;
