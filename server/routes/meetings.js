import { Router } from 'express';
import {
  getAvailableSlots,
  bookMeeting,
  checkMeetGenerationCapability,
  isGoogleConnected,
} from '../services/meetingService.js';
import { authenticate } from '../middleware/auth.js';
import { adminOnly } from '../middleware/rbac.js';
import { apiRateLimiter, sensitiveRateLimiter } from '../middleware/rateLimiter.js';
import Booking from '../models/Booking.js';
import { logger } from '../utils/logger.js';

const router = Router();
const BOOKING_WINDOW_DAYS = 15;

const getTodayInIST = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

const getMaxBookableDateInIST = () => {
  const date = new Date();
  date.setDate(date.getDate() + BOOKING_WINDOW_DAYS);
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
};

// ─── GET /api/v1/meetings/status ────────────────────────────────────────────
// Public preflight check: verifies if Google Meet links can be generated right now.
router.get('/status', apiRateLimiter, async (req, res, next) => {
  try {
    const capability = await checkMeetGenerationCapability();
    return res.json({
      success: true,
      meetReady: capability.ok,
      message: capability.message,
    });
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/v1/meetings/slots?date=YYYY-MM-DD ─────────────────────────────
// Public — no auth required so users can check availability before login.
router.get('/slots', apiRateLimiter, async (req, res, next) => {
  try {
    const { date } = req.query;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter "date" is required in YYYY-MM-DD format.',
      });
    }

    // Date must be within booking window (today to today + 15 days)
    const today = getTodayInIST();
    const maxDate = getMaxBookableDateInIST();
    if (date < today) {
      return res.status(400).json({
        success: false,
        message: 'Cannot query slots for a past date.',
      });
    }

    if (date > maxDate) {
      return res.status(400).json({
        success: false,
        message: `Slots are available only for the next ${BOOKING_WINDOW_DAYS} days.`,
      });
    }

    const capability = await checkMeetGenerationCapability();
    if (!capability.ok) {
      return res.json({
        success: true,
        date,
        slots: [],
        meetReady: false,
        message: capability.message,
      });
    }

    const slots = await getAvailableSlots(date);

    return res.json({
      success: true,
      date,
      slots,
      meetReady: true,
    });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/v1/meetings/book ─────────────────────────────────────────────
// Requires authentication.
router.post('/book', authenticate, sensitiveRateLimiter, async (req, res, next) => {
  try {
    const { clientName, clientEmail, date, startTime } = req.body;

    // Basic validation
    const errors = [];
    if (!clientName?.trim()) errors.push('clientName is required');
    if (!clientEmail?.trim()) errors.push('clientEmail is required');
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.push('date must be YYYY-MM-DD');
    if (!startTime || !/^\d{2}:\d{2}$/.test(startTime)) errors.push('startTime must be HH:mm');

    if (errors.length) {
      return res.status(400).json({ success: false, message: errors.join('; ') });
    }

    // Date must be within booking window (today to today + 15 days)
    const today = getTodayInIST();
    const maxDate = getMaxBookableDateInIST();
    if (date < today) {
      return res.status(400).json({ success: false, message: 'Cannot book a meeting in the past.' });
    }

    if (date > maxDate) {
      return res.status(400).json({
        success: false,
        message: `Meetings can be booked only within the next ${BOOKING_WINDOW_DAYS} days.`,
      });
    }

    const booking = await bookMeeting({
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim().toLowerCase(),
      date,
      startTime,
      userId: req.user?._id || null,
    });

    logger.info(`Meeting booked: ${booking._id} for ${clientEmail} on ${date} at ${startTime}`);

    return res.status(201).json({
      success: true,
      message: 'Meeting booked successfully!',
      booking: {
        _id: booking._id,
        clientName: booking.clientName,
        clientEmail: booking.clientEmail,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        meetLink: booking.meetLink,
        status: booking.status,
        createdAt: booking.createdAt,
      },
    });
  } catch (error) {
    if (error.statusCode === 409) {
      return res.status(409).json({ success: false, message: error.message });
    }
    if (error.statusCode === 500 || error.statusCode === 502) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
});

// ─── GET /api/v1/meetings/admin/bookings ────────────────────────────────────
// Admin only — list all bookings with optional date filter.
router.get('/admin/bookings', authenticate, adminOnly, apiRateLimiter, async (req, res, next) => {
  try {
    const { date, status, page = 1, limit = 50 } = req.query;

    // Cap limit to prevent abuse
    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
    const safePage = Math.max(Number(page) || 1, 1);

    const filter = {};
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) filter.date = date;
    if (status && ['confirmed', 'cancelled', 'completed'].includes(status)) filter.status = status;

    const skip = (safePage - 1) * safeLimit;
    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .sort({ date: -1, startTime: -1 })
        .skip(skip)
        .limit(safeLimit)
        .populate('userId', 'name email'),
      Booking.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      bookings,
      total,
      page: safePage,
      totalPages: Math.ceil(total / safeLimit),
    });
  } catch (error) {
    next(error);
  }
});

// ─── PATCH /api/v1/meetings/admin/bookings/:id/cancel ───────────────────────
// Admin only — cancel a booking.
router.patch('/admin/bookings/:id/cancel', authenticate, adminOnly, async (req, res, next) => {
  try {

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    booking.status = 'cancelled';
    await booking.save();

    return res.json({ success: true, message: 'Booking cancelled.', booking });
  } catch (error) {
    next(error);
  }
});

export default router;
