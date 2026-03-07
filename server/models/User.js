import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { ROLES } from '../utils/constants.js';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Don't return password by default
  },
  googleId: {
    type: String,
    sparse: true,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [20, 'Phone number cannot exceed 20 characters'],
    match: [/^\+?[1-9]\d{1,14}$/, 'Please provide a valid phone number']
  },
  company: {
    type: String,
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  avatar: {
    type: String,
    default: null,
    maxlength: [2048, 'Avatar URL is too long']
  },
  role: {
    type: String,
    enum: Object.values(ROLES),
    default: ROLES.CLIENT,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date
  },
  // ─── Account Lockout Fields ──────────────────────────────────────────────
  failedLoginAttempts: {
    type: Number,
    default: 0,
    select: false
  },
  lockUntil: {
    type: Date,
    default: null,
    select: false
  },
  // ─── Password Reset Fields ───────────────────────────────────────────────
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  passwordResetAttempts: {
    type: Number,
    default: 0,
    select: false
  },
  emailOtpCodeHash: {
    type: String,
    select: false
  },
  emailOtpPurpose: {
    type: String,
    enum: ['register', 'login'],
    select: false
  },
  emailOtpExpiresAt: {
    type: Date,
    select: false
  },
  emailOtpAttempts: {
    type: Number,
    default: 0,
    select: false
  },
  emailOtpLastSentAt: {
    type: Date,
    select: false
  },
  notificationPreferences: {
    email: { type: Boolean, default: true },
    projectUpdates: { type: Boolean, default: true },
    marketing: { type: Boolean, default: false }
  },
  // ─── Two-Factor Authentication ──────────────────────────────────────────
  twoFactorSecret: {
    type: String,
    select: false
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorBackupCodes: {
    type: [String],
    select: false
  },
  // ─── Onboarding Tracking ───────────────────────────────────────────────
  onboarding: {
    started: {
      type: Date,
      default: null
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date,
      default: null
    },
    currentStep: {
      type: String,
      enum: ['overview', 'account', 'services', 'workflow', 'projects', 'payments', 'security'],
      default: 'overview'
    },
    completedSteps: {
      type: [String],
      default: []
    },
    skipCount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// Normalize Gmail dots before password hashing
userSchema.pre('save', function (next) {
  if (this.isModified('email') || this.isNew) {
    const email = (this.email || '').trim().toLowerCase();
    const atIdx = email.lastIndexOf('@');
    if (atIdx !== -1) {
      const local = email.slice(0, atIdx);
      const domain = email.slice(atIdx + 1);
      if (domain === 'gmail.com' || domain === 'googlemail.com') {
        this.email = `${local.replace(/\./g, '')}@${domain}`;
      }
    }
  }
  next();
});

// Hash password before saving (bcrypt cost factor 12)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Virtual: check if account is currently locked
userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to increment failed login attempts
userSchema.methods.incrementFailedAttempts = async function (lockDurationMs) {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { failedLoginAttempts: 1, lockUntil: null }
    });
  }

  const updates = { $inc: { failedLoginAttempts: 1 } };
  const attempts = this.failedLoginAttempts + 1;

  if (attempts >= 5) {
    updates.$set = { lockUntil: new Date(Date.now() + lockDurationMs) };
  }

  return this.updateOne(updates);
};

// Method to reset failed login attempts on successful login
userSchema.methods.resetFailedAttempts = async function () {
  if (this.failedLoginAttempts > 0 || this.lockUntil) {
    return this.updateOne({
      $set: { failedLoginAttempts: 0, lockUntil: null }
    });
  }
};

// Method to generate password reset token
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  this.passwordResetAttempts = 0;

  return resetToken;
};

// Method to clear password reset fields
userSchema.methods.clearPasswordResetFields = function () {
  this.passwordResetToken = undefined;
  this.passwordResetExpires = undefined;
  this.passwordResetAttempts = 0;
};

// Method to increment password reset attempts
userSchema.methods.incrementPasswordResetAttempts = async function () {
  this.passwordResetAttempts += 1;

  if (this.passwordResetAttempts >= 2) {
    this.passwordResetExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  }

  return this.save();
};

// Method to get public profile
userSchema.methods.toPublicJSON = function () {
  return {
    _id: this._id,
    email: this.email,
    name: this.name,
    phone: this.phone,
    company: this.company,
    avatar: this.avatar,
    role: this.role,
    isActive: this.isActive,
    authMethod: this.googleId ? 'google' : 'email',
    emailVerified: this.emailVerified,
    twoFactorEnabled: this.twoFactorEnabled || false,
    notificationPreferences: this.notificationPreferences,
    createdAt: this.createdAt
  };
};

const User = mongoose.model('User', userSchema);

export default User;
