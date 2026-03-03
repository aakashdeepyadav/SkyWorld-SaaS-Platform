// User Roles
export const ROLES = {
  ADMIN: 'admin',
  DEVELOPER: 'developer',
  CLIENT: 'client'
};

// Service Categories
export const SERVICE_CATEGORIES = {
  APP_DEVELOPMENT: 'app-development',
  WEB_DEVELOPMENT: 'web-development',
  BRANDING_CREATIVE: 'branding-creative'
};

// Plan prices (server-side price validation — must match frontend planCatalog.js)
export const PLAN_PRICES = {
  'web-development': {
    launch: 3999,
    starter: 7499,
    growth: 11999,
  },
  'app-development': {
    mini: 18999,
    lite: 34999,
  },
  'branding-creative': {
    starter: 2499,
    plus: 4999,
  },
  // Combo package prices
  'combo': {
    'restaurant-starter': 10099,
    'medical-growth': 17508,
    'premium-business': 33205,
  },
  // Monthly maintenance plan prices
  'monthly': {
    'care-lite': 1499,
    'growth': 3499,
    'growth-plus': 6999,
  },
};

// Combo prices (for reference — combos flow through custom requests)
export const COMBO_PRICES = {
  'restaurant-starter': 10099,
  'medical-growth': 17508,
  'premium-business': 33205,
};

// Service types that are virtual (no Service document in DB)
export const VIRTUAL_SERVICE_TYPES = ['combo', 'monthly', 'addon'];

// Service types that charge full amount (not 50/50 split)
export const FULL_PAYMENT_TYPES = ['monthly', 'addon'];

// Service Request Status
export const REQUEST_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Project Status
export const PROJECT_STATUS = {
  PLANNING: 'planning',
  IN_PROGRESS: 'in-progress',
  REVIEW: 'review',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const DELIVERY_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  DELIVERED: 'delivered'
};

export const CUSTOM_REQUEST_STATUS = {
  PENDING: 'pending',
  QUOTED: 'quoted',
  APPROVED: 'approved',
  CANCELLED: 'cancelled'
};

// Payment Phase (split-payment model — every plan is 50 / 50)
export const PAYMENT_PHASE = {
  ADVANCE: 'advance',   // First 50 %
  FINAL: 'final',       // Remaining 50 %
  FULL: 'full',         // Legacy one-shot (custom / admin override)
};

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

// File Types
export const FILE_TYPES = {
  IMAGE: 'image',
  DOCUMENT: 'document',
  VIDEO: 'video',
  AUDIO: 'audio',
  OTHER: 'other'
};

// Allowed File MIME Types
// NOTE: SVG removed intentionally — SVGs can contain <script> tags (XSS vector)
export const ALLOWED_MIME_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  video: ['video/mp4', 'video/webm', 'video/ogg'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg']
};

// Max File Sizes (in bytes)
export const MAX_FILE_SIZES = {
  image: 5 * 1024 * 1024, // 5MB
  document: 10 * 1024 * 1024, // 10MB
  video: 100 * 1024 * 1024, // 100MB
  audio: 10 * 1024 * 1024 // 10MB
};

// Password Policy
export const PASSWORD_POLICY = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true // Strengthened — was false
};

// Account Lockout Policy
export const LOCKOUT_POLICY = {
  maxAttempts: 5,           // Lock after 5 failed attempts
  lockDurationMs: 30 * 60 * 1000  // 30 minutes lockout
};

// Rate Limiting
export const RATE_LIMITS = {
  global: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200 // 200 requests per window per IP
  },
  register: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5 // 5 signup attempts per IP per hour
  },
  registerEmail: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3 // 3 signup attempts per email per hour
  },
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5 // 5 requests per window (login/register)
  },
  forgotPassword: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5 // 5 forgot-password attempts per IP per hour
  },
  forgotPasswordEmail: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3 // 3 forgot-password attempts per email per hour
  },
  resetPassword: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10 // 10 reset-password attempts per IP per hour
  },
  otpSend: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5 // 5 OTP send/resend attempts per IP
  },
  otpSendEmail: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5 // 5 OTP send/resend attempts per email
  },
  otpVerify: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10 // 10 OTP verification attempts per IP
  },
  otpVerifyEmail: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10 // 10 OTP verification attempts per email
  },
  sensitive: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3 // 3 requests per window (password change)
  },
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // 100 requests per window
  }
};
