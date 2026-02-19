import multer from 'multer';
import path from 'path';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZES } from '../utils/constants.js';
import { logger } from '../utils/logger.js';

// Configure storage
const storage = multer.memoryStorage(); // Use memory storage for cloud uploads

// File filter
const fileFilter = (req, file, cb) => {
  const fileType = file.mimetype.split('/')[0]; // 'image', 'video', 'application', etc.
  
  // Check if file type is allowed
  let allowed = false;
  let maxSize = MAX_FILE_SIZES.other;

  if (fileType === 'image' && ALLOWED_MIME_TYPES.image.includes(file.mimetype)) {
    allowed = true;
    maxSize = MAX_FILE_SIZES.image;
  } else if (fileType === 'application' && ALLOWED_MIME_TYPES.document.includes(file.mimetype)) {
    allowed = true;
    maxSize = MAX_FILE_SIZES.document;
  } else if (fileType === 'video' && ALLOWED_MIME_TYPES.video.includes(file.mimetype)) {
    allowed = true;
    maxSize = MAX_FILE_SIZES.video;
  } else if (fileType === 'audio' && ALLOWED_MIME_TYPES.audio.includes(file.mimetype)) {
    allowed = true;
    maxSize = MAX_FILE_SIZES.audio;
  }

  if (allowed) {
    req.fileMaxSize = maxSize;
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
};

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: Math.max(...Object.values(MAX_FILE_SIZES)) // Use max size as limit
  }
});

// Middleware to check file size after upload
export const checkFileSize = (req, res, next) => {
  if (req.files) {
    for (const file of req.files) {
      if (file.size > req.fileMaxSize) {
        return res.status(400).json({
          success: false,
          message: `File ${file.originalname} exceeds maximum size limit`
        });
      }
    }
  } else if (req.file) {
    if (req.file.size > req.fileMaxSize) {
      return res.status(400).json({
        success: false,
        message: `File ${req.file.originalname} exceeds maximum size limit`
      });
    }
  }
  next();
};

// Helper to determine file type
export const getFileType = (mimetype) => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  if (mimetype.includes('pdf') || mimetype.includes('document') || mimetype.includes('sheet')) {
    return 'document';
  }
  return 'other';
};

