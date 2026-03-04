import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { adminOnly } from '../middleware/rbac.js';
import { getLiveDashboard, getDashboardHistory } from '../controllers/dashboardController.js';

const router = Router();

router.use(authenticate);
router.use(adminOnly);

// Live daily dashboard
router.get('/', getLiveDashboard);

// Historical data from Google Sheets
router.get('/history', getDashboardHistory);

export default router;
