import mongoose from 'mongoose';

/**
 * Stores one day's aggregated analytics, flushed to Google Sheets at 11:59 PM IST.
 * Only the current day's document lives here; older snapshots are archived in the sheet.
 */
const dailySnapshotSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, // YYYY-MM-DD

  // ── Meetings ────────────────────────────────────────────────────────────────
  meetings: {
    total:     { type: Number, default: 0 },
    confirmed: { type: Number, default: 0 },
    cancelled: { type: Number, default: 0 },
    completed: { type: Number, default: 0 },
    list: [{
      clientName:  String,
      clientEmail: String,
      startTime:   String,
      endTime:     String,
      meetLink:    String,
      status:      String,
    }],
  },

  // ── Payments ────────────────────────────────────────────────────────────────
  payments: {
    total:     { type: Number, default: 0 },
    completed: { type: Number, default: 0 },
    failed:    { type: Number, default: 0 },
    pending:   { type: Number, default: 0 },
    refunded:  { type: Number, default: 0 },
    revenue:   { type: Number, default: 0 },       // sum of completed amounts
  },

  // ── Emails ──────────────────────────────────────────────────────────────────
  emails: {
    brevo:  { sent: { type: Number, default: 0 }, limit: { type: Number, default: 300 }, remaining: { type: Number, default: 300 } },
    resend: { sent: { type: Number, default: 0 }, limit: { type: Number, default: 100 }, remaining: { type: Number, default: 100 } },
  },

  // ── System Health ───────────────────────────────────────────────────────────
  health: {
    backend:       { type: String, enum: ['up', 'down', 'degraded'], default: 'up' },
    frontend:      { type: String, enum: ['up', 'down', 'degraded'], default: 'up' },
    database:      { type: String, enum: ['up', 'down', 'degraded'], default: 'up' },
    googleOAuth:   { type: String, enum: ['connected', 'disconnected', 'error'], default: 'disconnected' },
    lastCheckedAt: { type: Date, default: null },
  },

  // ── Requests / Projects ─────────────────────────────────────────────────────
  serviceRequests: {
    total:   { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
    approved:{ type: Number, default: 0 },
  },
  customRequests: {
    total:   { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
  },
  projects: {
    total:      { type: Number, default: 0 },
    active:     { type: Number, default: 0 },
    completed:  { type: Number, default: 0 },
  },
  users: {
    total:       { type: Number, default: 0 },
    newToday:    { type: Number, default: 0 },
  },

  // ── Flags ───────────────────────────────────────────────────────────────────
  flushedToSheet: { type: Boolean, default: false },
}, { timestamps: true });

dailySnapshotSchema.index({ flushedToSheet: 1 });

const DailySnapshot = mongoose.model('DailySnapshot', dailySnapshotSchema);
export default DailySnapshot;
