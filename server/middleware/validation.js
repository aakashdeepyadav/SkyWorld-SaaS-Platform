import { body, param, query, validationResult } from 'express-validator';
import { PASSWORD_POLICY } from '../utils/constants.js';

/**
 * Handle validation errors
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
        // Don't expose `value` — it may contain sensitive input
      }))
    });
  }
  next();
};

/**
 * Password validation — enforces strong password policy
 */
const passwordValidation = (fieldName = 'password') => [
  body(fieldName)
    .trim()
    .isLength({ min: PASSWORD_POLICY.minLength })
    .withMessage(`Password must be at least ${PASSWORD_POLICY.minLength} characters`)
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('Password must contain at least one special character (!@#$%^&*)')
    .not()
    .matches(/\s/)
    .withMessage('Password must not contain spaces')
];

/**
 * Email validation
 */
const emailValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
    .isLength({ max: 254 })
    .withMessage('Email is too long')
];

/**
 * Validation rules
 */
export const validators = {
  // Auth validators
  register: [
    ...emailValidation,
    ...passwordValidation('password'),
    body('name')
      .trim()
      .escape() // Sanitize HTML entities to prevent stored XSS
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters')
  ],

  login: [
    ...emailValidation,
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],

  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Current password is required'),
    ...passwordValidation('newPassword')
  ],

  forgotPassword: [
    ...emailValidation
  ],

  resetPassword: [
    body('token')
      .notEmpty()
      .withMessage('Reset token is required')
      .isLength({ min: 32, max: 64 })
      .withMessage('Invalid reset token'),
    ...passwordValidation('password')
  ],

  // User validators
  updateProfile: [
    body('name')
      .optional()
      .trim()
      .escape()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    body('phone')
      .optional()
      .trim()
      .matches(/^\+?[1-9]\d{1,14}$/)
      .withMessage('Please provide a valid phone number')
  ],

  // Service Request validators
  createServiceRequest: [
    body('serviceId')
      .isMongoId()
      .withMessage('Valid service ID is required'),
    body('title')
      .trim()
      .escape()
      .isLength({ min: 5, max: 200 })
      .withMessage('Title must be between 5 and 200 characters'),
    body('description')
      .trim()
      .isLength({ min: 10, max: 5000 })
      .withMessage('Description must be between 10 and 5000 characters'),
    body('requirements')
      .optional()
      .trim()
      .isLength({ max: 10000 })
      .withMessage('Requirements cannot exceed 10000 characters')
  ],

  // Project validators
  updateProject: [
    body('status')
      .optional()
      .isIn(['planning', 'in-progress', 'review', 'completed', 'cancelled'])
      .withMessage('Invalid project status'),
    body('progress')
      .optional()
      .isInt({ min: 0, max: 100 })
      .withMessage('Progress must be between 0 and 100')
  ],

  // Message validators
  createMessage: [
    body('projectId')
      .isMongoId()
      .withMessage('Valid project ID is required'),
    body('content')
      .trim()
      .isLength({ min: 1, max: 5000 })
      .withMessage('Message content must be between 1 and 5000 characters')
  ],

  // ID parameter validation
  mongoId: [
    param('id')
      .isMongoId()
      .withMessage('Invalid ID format')
  ],

  // Query validators
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Page must be between 1 and 1000'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ]
};
