import express from 'express';
import {
  getProjects,
  getProject,
  createProject,
  updateProject
} from '../controllers/projectController.js';
import { authenticate } from '../middleware/auth.js';
import { adminOnly, authorize } from '../middleware/rbac.js';
import { ROLES } from '../utils/constants.js';
import { apiRateLimiter } from '../middleware/rateLimiter.js';
import { validators, handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);
router.use(apiRateLimiter);

router.get('/', validators.pagination, handleValidationErrors, getProjects);
router.get('/:id', validators.mongoId, handleValidationErrors, getProject);
router.post('/', adminOnly, createProject);
router.put('/:id', authorize(ROLES.ADMIN, ROLES.DEVELOPER), validators.mongoId, validators.updateProject, handleValidationErrors, updateProject);

export default router;

