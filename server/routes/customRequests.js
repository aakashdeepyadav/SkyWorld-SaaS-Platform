import express from 'express';
import {
  getCustomRequests,
  getCustomRequest,
  createCustomRequest,
  updateCustomRequest
} from '../controllers/customRequestController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize, adminOnly } from '../middleware/rbac.js';
import { ROLES } from '../utils/constants.js';
import { apiRateLimiter } from '../middleware/rateLimiter.js';
import { validators, handleValidationErrors } from '../middleware/validation.js';
import { upload, checkFileSize } from '../middleware/upload.js';

const router = express.Router();

router.use(authenticate);
router.use(apiRateLimiter);

router.post(
  '/',
  authorize(ROLES.CLIENT, ROLES.ADMIN),
  upload.single('file'),
  checkFileSize,
  validators.createCustomRequest,
  handleValidationErrors,
  createCustomRequest
);

router.get('/', validators.pagination, handleValidationErrors, getCustomRequests);
router.get('/:id', validators.mongoId, handleValidationErrors, getCustomRequest);
router.put('/:id', adminOnly, validators.mongoId, handleValidationErrors, updateCustomRequest);

export default router;
