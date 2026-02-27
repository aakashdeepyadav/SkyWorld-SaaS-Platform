import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getAnalytics } from '../controllers/analyticsController.js';

const router = Router();

// All routes require auth + admin role
router.use(authenticate);

// GET /api/v1/admin/analytics?period=30d
router.get('/analytics', getAnalytics);

export default router;
