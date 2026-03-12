import mongoose from 'mongoose';
import { SERVICE_CATEGORIES } from '../utils/constants.js';

const serviceSchema = new mongoose.Schema({
  /* ── Common ────────────────────────────────────── */
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['plan', 'combo', 'monthly', 'addon'],
    required: true,
  },
  category: {
    type: String,
    enum: [...Object.values(SERVICE_CATEGORIES), null],
    default: null,
  },
  description: { type: String, trim: true },
  tagline: { type: String, trim: true },
  basePrice: { type: Number, min: 0, default: 0 },
  offerPercent: { type: Number, min: 0, max: 100, default: 0 },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },

  /* ── Plan / Monthly fields ─────────────────────── */
  delivery: String,
  bestFor: String,
  popular: { type: Boolean, default: false },
  highlights: [String],
  support: String,
  features: [String],
  excludes: [String],

  /* ── Combo fields ──────────────────────────────── */
  originalPrice: Number,
  discount: Number,
  includes: [{
    category: String,
    plan: String,
    label: String,
    addOn: { type: Boolean, default: false },
  }],
  color: String,
  gradient: String,

  /* ── Monthly fields ────────────────────────────── */
  responseTime: String,
  updates: String,
  notIncluded: [String],

  /* ── Add-on fields ─────────────────────────────── */
  unit: String,
}, {
  timestamps: true,
});

/* ── Indexes ─────────────────────────────────────── */
serviceSchema.index({ type: 1, category: 1, slug: 1 }, { unique: true });
serviceSchema.index({ type: 1, isActive: 1 });
serviceSchema.index({ category: 1 });

const Service = mongoose.model('Service', serviceSchema);

export default Service;

