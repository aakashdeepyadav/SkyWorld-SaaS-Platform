import { refreshTodaySnapshot, getSheetHistory } from '../services/dashboardAnalyticsService.js';
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
