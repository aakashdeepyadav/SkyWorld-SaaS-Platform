import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { adminOnly } from '../middleware/rbac.js';
import { apiRateLimiter } from '../middleware/rateLimiter.js';
import { getAnalytics } from '../controllers/analyticsController.js';
import { getDocumentRecipients, getUserProjects, sendDocumentsToUser } from '../controllers/documentController.js';
import { validators, handleValidationErrors } from '../middleware/validation.js';

const router = Router();

router.use(authenticate);
router.use(adminOnly);
router.use(apiRateLimiter);

// GET /api/v1/admin/analytics?period=30d
router.get('/analytics', getAnalytics);
router.get('/documents/recipients', validators.pagination, handleValidationErrors, getDocumentRecipients);
router.get('/documents/user-projects/:userId', getUserProjects);
router.post('/documents/send', validators.sendAdminDocuments, handleValidationErrors, sendDocumentsToUser);

export default router;
