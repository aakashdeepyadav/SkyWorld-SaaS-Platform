import { refreshTodaySnapshot, getSheetHistory, flushSnapshotToSheet } from '../services/dashboardAnalyticsService.js';
import DailySnapshot from '../models/DailySnapshot.js';
import { logger } from '../utils/logger.js';

/**
 * GET /api/v1/admin/dashboard
 * Returns live analytics for the current day.
 */
export const getLiveDashboard = async (req, res, next) => {
  try {
    const snapshot = await refreshTodaySnapshot();
    res.json({ success: true, data: snapshot });
  } catch (error) {
    logger.error('Dashboard fetch failed:', error.message);
    next(error);
  }
};

/**
 * GET /api/v1/admin/dashboard/history?start=YYYY-MM-DD&end=YYYY-MM-DD
 * Returns historical analytics from Google Sheets.
 */
export const getDashboardHistory = async (req, res, next) => {
  try {
    const { start, end } = req.query;
    const rows = await getSheetHistory(start || null, end || null);
    res.json({ success: true, data: rows });
  } catch (error) {
    logger.error('Dashboard history fetch failed:', error.message);
    next(error);
  }
};

/**
 * POST /api/v1/admin/dashboard/push-to-sheet
 * Manually flush today's snapshot to Google Sheets. Uses cached data to avoid extra DB queries.
 */
export const pushToSheet = async (req, res, next) => {
  try {
    // Use cached snapshot — no extra DB reads
    const snapshot = await refreshTodaySnapshot();
    await flushSnapshotToSheet(snapshot);
    await DailySnapshot.updateOne({ date: snapshot.date }, { $set: { flushedToSheet: true } });
    res.json({ success: true, message: `Snapshot for ${snapshot.date} pushed to Google Sheets` });
  } catch (error) {
    logger.error('Manual sheet push failed:', error.message);
    next(error);
  }
};
