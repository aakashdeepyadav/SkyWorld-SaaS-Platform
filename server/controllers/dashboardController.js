import { refreshTodaySnapshot, getSnapshotHistory, flushSnapshotToSheet } from '../services/dashboardAnalyticsService.js';
import { setupSpreadsheetDashboard } from '../services/sheetDashboardService.js';
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
 * GET /api/v1/admin/dashboard/history?start=YYYY-MM-DD&end=YYYY-MM-DD&page=1&limit=30
 * Returns historical analytics from MongoDB snapshots.
 */
export const getDashboardHistory = async (req, res, next) => {
  try {
    const { start, end, page, limit } = req.query;
    const result = await getSnapshotHistory(
      start || null,
      end || null,
      { page: parseInt(page) || 1, limit: Math.min(parseInt(limit) || 30, 100) },
    );
    res.json({ success: true, data: result });
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

/**
 * POST /api/v1/admin/dashboard/setup-sheet-dashboard
 * Creates Dashboard + Monthly Summary tabs with charts, formatting & filters.
 */
export const setupSheetDashboard = async (req, res, next) => {
  try {
    const result = await setupSpreadsheetDashboard();
    res.json(result);
  } catch (error) {
    logger.error('Sheet dashboard setup failed:', error.message);
    next(error);
  }
};
