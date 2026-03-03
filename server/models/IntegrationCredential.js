import mongoose from 'mongoose';
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Get the 32-byte encryption key from env.
 * GOOGLE_OAUTH_ENCRYPTION_KEY must be a 64-char hex string.
 */
const getEncryptionKey = () => {
  const hex = process.env.GOOGLE_OAUTH_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error('GOOGLE_OAUTH_ENCRYPTION_KEY must be a 64-character hex string (32 bytes).');
  }
  return Buffer.from(hex, 'hex');
};

/**
 * Encrypt a plaintext string → "iv:authTag:ciphertext" (all hex).
 */
const encrypt = (plaintext) => {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

/**
 * Decrypt an "iv:authTag:ciphertext" string → plaintext.
 */
const decrypt = (encryptedStr) => {
  const key = getEncryptionKey();
  const [ivHex, authTagHex, ciphertext] = encryptedStr.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

// ─── Schema ──────────────────────────────────────────────────────────────────

const integrationCredentialSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ['google'],
      required: true,
      default: 'google',
    },
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    refreshTokenEncrypted: {
      type: String,
      required: true,
    },
    accessTokenEncrypted: {
      type: String,
      default: null,
    },
    accessTokenExpiresAt: {
      type: Date,
      default: null,
    },
    calendarId: {
      type: String,
      default: null,
    },
    email: {
      type: String,
      default: null,
    },
    scopes: {
      type: [String],
      default: [],
    },
    connectedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Only one credential per provider (singleton for google)
integrationCredentialSchema.index({ provider: 1 }, { unique: true });

// ─── Instance Methods ────────────────────────────────────────────────────────

integrationCredentialSchema.methods.getRefreshToken = function () {
  return decrypt(this.refreshTokenEncrypted);
};

integrationCredentialSchema.methods.setRefreshToken = function (plainToken) {
  this.refreshTokenEncrypted = encrypt(plainToken);
};

integrationCredentialSchema.methods.getAccessToken = function () {
  if (!this.accessTokenEncrypted) return null;
  return decrypt(this.accessTokenEncrypted);
};

integrationCredentialSchema.methods.setAccessToken = function (plainToken, expiresAt) {
  this.accessTokenEncrypted = encrypt(plainToken);
  this.accessTokenExpiresAt = expiresAt;
};

// ─── Static Methods ──────────────────────────────────────────────────────────

/**
 * Get the active Google credential (singleton).
 */
integrationCredentialSchema.statics.getGoogle = function () {
  return this.findOne({ provider: 'google' });
};

const IntegrationCredential = mongoose.model('IntegrationCredential', integrationCredentialSchema);
export default IntegrationCredential;
