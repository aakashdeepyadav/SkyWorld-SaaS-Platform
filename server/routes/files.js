import express from 'express';
import {
    uploadFile,
    uploadUserAvatar,
    getFiles,
    deleteFile
} from '../controllers/fileController.js';
import { authenticate } from '../middleware/auth.js';
import { apiRateLimiter } from '../middleware/rateLimiter.js';
import { upload, checkFileSize } from '../middleware/upload.js';
import { validators, handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);
router.use(apiRateLimiter);

// Upload file (single file, field name 'file')
router.post('/upload', upload.single('file'), checkFileSize, uploadFile);

// Upload avatar (single image, field name 'avatar')
router.post('/avatar', upload.single('avatar'), checkFileSize, uploadUserAvatar);

// Get files for a project
router.get('/', validators.pagination, handleValidationErrors, getFiles);

// Delete file
router.delete('/:id', validators.mongoId, handleValidationErrors, deleteFile);

export default router;
