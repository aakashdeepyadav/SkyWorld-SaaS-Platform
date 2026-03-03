import { Router } from 'express';
import { getAvailableSlots, bookMeeting } from '../services/meetingService.js';
import { authenticate } from '../middleware/auth.js';
import Booking from '../models/Booking.js';
import { logger } from '../utils/logger.js';

const router = Router();

// ─── GET /api/v1/meetings/slots?date=YYYY-MM-DD ─────────────────────────────
// Public — no auth required so users can check availability before login.
router.get('/slots', async (req, res, next) => {
  try {
    const { date } = req.query;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter "date" is required in YYYY-MM-DD format.',
      });
    }

    // Don't allow dates in the past
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    if (date < today) {
      return res.status(400).json({
        success: false,
        message: 'Cannot query slots for a past date.',
      });
    }

    const slots = await getAvailableSlots(date);

    return res.json({
      success: true,
      date,
      slots,
    });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/v1/meetings/book ─────────────────────────────────────────────
// Requires authentication.
router.post('/book', authenticate, async (req, res, next) => {
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

    // Don't allow past dates
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    if (date < today) {
      return res.status(400).json({ success: false, message: 'Cannot book a meeting in the past.' });
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
    next(error);
  }
});

// ─── GET /api/v1/meetings/admin/bookings ────────────────────────────────────
// Admin only — list all bookings with optional date filter.
router.get('/admin/bookings', authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }

    const { date, status, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) filter.date = date;
    if (status && ['confirmed', 'cancelled', 'completed'].includes(status)) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .sort({ date: -1, startTime: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('userId', 'name email'),
      Booking.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      bookings,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    next(error);
  }
});

// ─── PATCH /api/v1/meetings/admin/bookings/:id/cancel ───────────────────────
// Admin only — cancel a booking.
router.patch('/admin/bookings/:id/cancel', authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }

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
