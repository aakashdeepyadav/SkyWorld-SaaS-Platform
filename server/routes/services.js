import express from 'express';
import {
  getServices,
  getService,
  getCatalog,
  createService,
  updateService,
  deleteService,
  reseedCatalog
} from '../controllers/serviceController.js';
import { authenticate } from '../middleware/auth.js';
import { adminOnly } from '../middleware/rbac.js';
import { apiRateLimiter } from '../middleware/rateLimiter.js';
import { validators, handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.get('/catalog', getCatalog);
router.get('/', getServices);
router.get('/:id', validators.mongoId, handleValidationErrors, getService);

// Admin routes
router.use(authenticate);
router.use(adminOnly);
router.use(apiRateLimiter);

router.post('/reseed', reseedCatalog);
router.post('/', createService);
router.put('/:id', validators.mongoId, handleValidationErrors, updateService);
router.delete('/:id', validators.mongoId, handleValidationErrors, deleteService);

export default router;

