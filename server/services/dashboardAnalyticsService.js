import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';
import { google } from 'googleapis';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import ServiceRequest from '../models/ServiceRequest.js';
import CustomRequest from '../models/CustomRequest.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import DailySnapshot from '../models/DailySnapshot.js';
import IntegrationCredential from '../models/IntegrationCredential.js';
import { PAYMENT_STATUS } from '../utils/constants.js';

const TIMEZONE = 'Asia/Kolkata';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const todayIST = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE }); // YYYY-MM-DD

const startOfDayUTC = (dateStr) => new Date(`${dateStr}T00:00:00+05:30`);
const endOfDayUTC = (dateStr) => new Date(`${dateStr}T23:59:59.999+05:30`);

// ─── Health Checks ───────────────────────────────────────────────────────────

const pingUrl = async (url, timeoutMs = 8000) => {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    return res.ok ? 'up' : 'degraded';
  } catch {
    return 'down';
  }
};

const checkDatabaseHealth = async () => {
  try {
    const state = mongoose.connection.readyState;
    if (state === 1) return 'up';
    if (state === 2) return 'degraded';
    return 'down';
  } catch {
    return 'down';
  }
};

const checkGoogleOAuth = async () => {
  try {
    const cred = await IntegrationCredential.getGoogle();
    return cred ? 'connected' : 'disconnected';
  } catch {
    return 'error';
  }
};

// ─── Email Quota Checks ─────────────────────────────────────────────────────

const getBrevoQuota = async () => {
  const apiKey = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;
  if (!apiKey) return { sent: 0, limit: 300, remaining: 300 };
  try {
    const res = await fetch('https://api.brevo.com/v3/account', {
      headers: { 'api-key': apiKey, accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`Brevo API ${res.status}`);
    const data = await res.json();
    const plan = data.plan?.[0] || {};
    const limit = plan.credits ?? 300;
    const remaining = plan.creditsRemaining ?? plan.credits ?? 300;
    const sent = limit - remaining;
    return { sent: Math.max(sent, 0), limit, remaining: Math.max(remaining, 0) };
  } catch (err) {
    logger.warn('Brevo quota check failed:', err.message);
    return { sent: 0, limit: 300, remaining: 300 };
  }
};

const getResendQuota = async () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: 0, limit: 100, remaining: 100 };
  try {
    // Resend doesn't have a direct quota endpoint on free tier
    // We'll count emails sent today from our Booking + meeting flow logs
    const todayStr = todayIST();
    const start = startOfDayUTC(todayStr);
    const end = endOfDayUTC(todayStr);
    // Count bookings created today as proxy for resend emails (1 email per booking)
    const sentToday = await Booking.countDocuments({
      createdAt: { $gte: start, $lte: end },
    });
    const limit = 100; // Resend free tier daily limit
    return { sent: sentToday, limit, remaining: Math.max(limit - sentToday, 0) };
  } catch (err) {
    logger.warn('Resend quota check failed:', err.message);
    return { sent: 0, limit: 100, remaining: 100 };
  }
};

// ─── Collect Live Metrics ────────────────────────────────────────────────────

export const collectDailyMetrics = async () => {
  const dateStr = todayIST();
  const dayStart = startOfDayUTC(dateStr);
  const dayEnd = endOfDayUTC(dateStr);
  const createdToday = { createdAt: { $gte: dayStart, $lte: dayEnd } };

  // Run all queries in parallel for speed
  const [
    bookingsToday,
    paymentsToday,
    serviceReqsToday,
    customReqsToday,
    totalProjects,
    activeProjects,
    completedProjects,
    totalUsers,
    newUsersToday,
    brevoQuota,
    resendQuota,
    backendStatus,
    frontendStatus,
    googleOAuthStatus,
    dbStatusResult,
  ] = await Promise.all([
    // Meetings
    Booking.find({ date: dateStr }).lean(),
    // Payments
    Payment.find(createdToday).lean(),
    // Service requests today
    ServiceRequest.countDocuments(createdToday),
    // Custom requests today
    CustomRequest.countDocuments(createdToday),
    // Projects
    Project.countDocuments(),
    Project.countDocuments({ status: { $in: ['active', 'in-progress', 'in_progress'] } }),
    Project.countDocuments({ status: 'completed' }),
    // Users
    User.countDocuments(),
    User.countDocuments(createdToday),
    // Email quotas
    getBrevoQuota(),
    getResendQuota(),
    // Health
    pingUrl(`${process.env.BACKEND_URL || 'https://skyworld-backend.onrender.com'}/health`),
    pingUrl(`${process.env.FRONTEND_URL || 'https://skyworld.buzz'}`),
    checkGoogleOAuth(),
    checkDatabaseHealth(),
  ]);

  const dbStatus = dbStatusResult;

  // Aggregate payment stats
  const paymentStats = paymentsToday.reduce(
    (acc, p) => {
      acc.total++;
      if (p.status === PAYMENT_STATUS.COMPLETED) { acc.completed++; acc.revenue += p.amount || 0; }
      else if (p.status === PAYMENT_STATUS.FAILED) acc.failed++;
      else if (p.status === PAYMENT_STATUS.PENDING) acc.pending++;
      else if (p.status === 'refunded') acc.refunded++;
      return acc;
    },
    { total: 0, completed: 0, failed: 0, pending: 0, refunded: 0, revenue: 0 },
  );

  // Aggregate meeting stats
  const meetingList = bookingsToday.map((b) => ({
    clientName: b.clientName,
    clientEmail: b.clientEmail,
    startTime: b.startTime,
    endTime: b.endTime,
    meetLink: b.meetLink || '',
    status: b.status,
  }));
  const meetingStats = {
    total: bookingsToday.length,
    confirmed: bookingsToday.filter((b) => b.status === 'confirmed').length,
    cancelled: bookingsToday.filter((b) => b.status === 'cancelled').length,
    completed: bookingsToday.filter((b) => b.status === 'completed').length,
    list: meetingList,
  };

  // Pending service requests overall (not just today)
  const [pendingServiceReqs, approvedServiceReqs, pendingCustomReqs] = await Promise.all([
    ServiceRequest.countDocuments({ status: 'pending' }),
    ServiceRequest.countDocuments({ status: 'approved' }),
    CustomRequest.countDocuments({ status: 'pending' }),
  ]);

  return {
    date: dateStr,
    meetings: meetingStats,
    payments: paymentStats,
    emails: { brevo: brevoQuota, resend: resendQuota },
    health: {
      backend: backendStatus,
      frontend: frontendStatus,
      database: dbStatus,
      googleOAuth: googleOAuthStatus,
      lastCheckedAt: new Date(),
    },
    serviceRequests: { total: serviceReqsToday, pending: pendingServiceReqs, approved: approvedServiceReqs },
    customRequests: { total: customReqsToday, pending: pendingCustomReqs },
    projects: { total: totalProjects, active: activeProjects, completed: completedProjects },
    users: { total: totalUsers, newToday: newUsersToday },
  };
};

// ─── Upsert Today's Snapshot (with 5-min server-side cache) ──────────────────

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let _snapshotCache = { data: null, date: null, refreshedAt: 0 };

export const refreshTodaySnapshot = async ({ force = false } = {}) => {
  const dateStr = todayIST();
  const now = Date.now();

  // Serve cached snapshot if still fresh (avoids 14 DB queries)
  if (
    !force &&
    _snapshotCache.data &&
    _snapshotCache.date === dateStr &&
    now - _snapshotCache.refreshedAt < CACHE_TTL_MS
  ) {
    return _snapshotCache.data;
  }

  // Cache expired or date changed — refresh from live data
  const metrics = await collectDailyMetrics();
  const snapshot = await DailySnapshot.findOneAndUpdate(
    { date: metrics.date },
    { $set: metrics },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  _snapshotCache = { data: snapshot, date: dateStr, refreshedAt: now };
  return snapshot;
};

// ─── Flush to Google Sheets ──────────────────────────────────────────────────

/**
 * Service-account auth for Google Sheets.
 * Uses GOOGLE_SERVICE_ACCOUNT_KEY env var (JSON key file contents).
 * This is separate from the OAuth2 flow used for Calendar + Meet.
 */
const getSheetsAuth = () => {
  const keyJson = process.env.GOOGLE_PRIVATE_KEY;
  if (!keyJson) {
    throw new Error('GOOGLE_PRIVATE_KEY not set — cannot access Google Sheets.');
  }
  const key = JSON.parse(keyJson);
  return new google.auth.GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
};

export const flushSnapshotToSheet = async (snapshot) => {
  const spreadsheetId = process.env.GOOGLE_ANALYTICS_SHEET_ID || process.env.GOOGLE_SHEET_ID;
  if (!spreadsheetId) {
    logger.warn('No GOOGLE_ANALYTICS_SHEET_ID — skipping analytics sheet flush');
    return;
  }

  try {
    const auth = getSheetsAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    // Ensure header row exists
    const SHEET_NAME = 'DailyAnalytics';
    try {
      const existing = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${SHEET_NAME}!A1:V1`,
      });
      if (!existing.data.values || existing.data.values.length === 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${SHEET_NAME}!A1:V1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [[
              'Date',
              'Meetings Total', 'Meetings Confirmed', 'Meetings Cancelled', 'Meetings Completed',
              'Payments Total', 'Payments Completed', 'Payments Failed', 'Payments Pending', 'Revenue (₹)',
              'Brevo Sent', 'Brevo Remaining', 'Resend Sent', 'Resend Remaining',
              'Backend', 'Frontend', 'Database', 'Google OAuth',
              'Service Requests', 'Custom Requests', 'Projects Active', 'New Users',
            ]],
          },
        });
      }
    } catch (err) {
      // Sheet/tab might not exist — create it
      if (err.code === 400 || err.message?.includes('Unable to parse range')) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [{ addSheet: { properties: { title: SHEET_NAME } } }],
          },
        });
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${SHEET_NAME}!A1:V1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [[
              'Date',
              'Meetings Total', 'Meetings Confirmed', 'Meetings Cancelled', 'Meetings Completed',
              'Payments Total', 'Payments Completed', 'Payments Failed', 'Payments Pending', 'Revenue (₹)',
              'Brevo Sent', 'Brevo Remaining', 'Resend Sent', 'Resend Remaining',
              'Backend', 'Frontend', 'Database', 'Google OAuth',
              'Service Requests', 'Custom Requests', 'Projects Active', 'New Users',
            ]],
          },
        });
      }
    }

    // Append the day's row
    const m = snapshot.meetings || {};
    const p = snapshot.payments || {};
    const eb = snapshot.emails?.brevo || {};
    const er = snapshot.emails?.resend || {};
    const h = snapshot.health || {};

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${SHEET_NAME}!A:V`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          snapshot.date,
          m.total, m.confirmed, m.cancelled, m.completed,
          p.total, p.completed, p.failed, p.pending, p.revenue,
          eb.sent, eb.remaining, er.sent, er.remaining,
          h.backend, h.frontend, h.database, h.googleOAuth,
          snapshot.serviceRequests?.total || 0,
          snapshot.customRequests?.total || 0,
          snapshot.projects?.active || 0,
          snapshot.users?.newToday || 0,
        ]],
      },
    });

    logger.info(`Analytics snapshot for ${snapshot.date} flushed to Google Sheets`);
  } catch (error) {
    const detail = error?.response?.data?.error?.message || error.message || String(error);
    logger.error(`Analytics sheet flush failed: ${detail}`);
  }
};

// ─── Nightly Job: Flush + Reset ──────────────────────────────────────────────

export const nightlyFlushAndReset = async () => {
  const dateStr = todayIST();
  logger.info(`[CRON] Starting nightly analytics flush for ${dateStr}`);

  try {
    // Refresh one final time to ensure latest data (bypass cache)
    const snapshot = await refreshTodaySnapshot({ force: true });

    // Flush to Google Sheets
    await flushSnapshotToSheet(snapshot);

    // Mark as flushed (snapshots kept permanently — storage is negligible)
    await DailySnapshot.updateOne({ date: dateStr }, { $set: { flushedToSheet: true } });

    logger.info(`[CRON] Nightly analytics flush complete for ${dateStr}`);
  } catch (error) {
    logger.error('[CRON] Nightly analytics flush failed:', error.message);
  }
};

// ─── Fetch Snapshot History (from MongoDB) ───────────────────────────────────

export const getSnapshotHistory = async (startDate, endDate, { page = 1, limit = 30 } = {}) => {
  try {
    const filter = {};
    if (startDate) filter.date = { ...filter.date, $gte: startDate };
    if (endDate) filter.date = { ...filter.date, $lte: endDate };

    const skip = (page - 1) * limit;

    const [snapshots, total] = await Promise.all([
      DailySnapshot.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .select('-meetings.list -__v') // exclude per-meeting details for speed
        .lean(),
      DailySnapshot.countDocuments(filter),
    ]);

    return {
      rows: snapshots,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    logger.error('Failed to fetch snapshot history:', error.message);
    return { rows: [], total: 0, page: 1, totalPages: 0 };
  }
};
