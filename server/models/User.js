import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
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
    trim: true
  },
  avatar: {
    type: String,
    default: null
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
    select: false // Don't expose in queries by default
  },
  lockUntil: {
    type: Date,
    default: null,
    select: false
  }
}, {
  timestamps: true
});

// Indexes
// email and googleId indexes are auto-created by unique/sparse in schema
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// Hash password before saving (bcrypt cost factor 12 for stronger hashing)
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
  // If lock has expired, reset counter
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { failedLoginAttempts: 1, lockUntil: null }
    });
  }

  const updates = { $inc: { failedLoginAttempts: 1 } };
  const attempts = this.failedLoginAttempts + 1;

  // Lock account if max attempts reached
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

// Method to get public profile
userSchema.methods.toPublicJSON = function () {
  return {
    _id: this._id,
    email: this.email,
    name: this.name,
    phone: this.phone,
    avatar: this.avatar,
    role: this.role,
    emailVerified: this.emailVerified,
    createdAt: this.createdAt
  };
};

const User = mongoose.model('User', userSchema);

export default User;
