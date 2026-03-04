import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { adminOnly } from '../middleware/rbac.js';
import { getLiveDashboard, getDashboardHistory, pushToSheet } from '../controllers/dashboardController.js';

const router = Router();

router.use(authenticate);
router.use(adminOnly);

// Live daily dashboard
router.get('/', getLiveDashboard);

// Historical snapshots from MongoDB
router.get('/history', getDashboardHistory);

// Manual push to Google Sheets
router.post('/push-to-sheet', pushToSheet);

export default router;
