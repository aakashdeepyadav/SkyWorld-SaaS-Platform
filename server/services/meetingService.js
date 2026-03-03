import { google } from 'googleapis';
import { Resend } from 'resend';
import { logger } from '../utils/logger.js';
import Booking from '../models/Booking.js';

// ─── Constants ───────────────────────────────────────────────────────────────

const TIMEZONE = 'Asia/Kolkata';
const MEETING_DURATION_MINUTES = 30;

// Slot windows (24 h format): 09:00–12:00 and 13:00–17:00
const SLOT_WINDOWS = [
  { start: 9, end: 12 },  // 09:00 – 12:00
  { start: 13, end: 17 }, // 13:00 – 17:00
];

// ─── Google Auth (Service Account) ───────────────────────────────────────────

let _authClient = null;

const getGoogleAuth = async () => {
  // Reuse authorized client across calls
  if (_authClient) return _authClient;

  const email = process.env.GOOGLE_SERVICE_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  logger.info(`Google Auth init — email: ${email || '(not set)'}, raw key length: ${privateKey ? privateKey.length : 0}`);

  if (!email || !privateKey) {
    throw new Error('Missing GOOGLE_SERVICE_EMAIL or GOOGLE_PRIVATE_KEY environment variables');
  }

  // Strip surrounding quotes (common when copy-pasted with quotes)
  privateKey = privateKey.trim().replace(/^["']|["']$/g, '');

  // Replace literal \n sequences with real newlines
  privateKey = privateKey.replace(/\\n/g, '\n');

  logger.info(`Google Auth — processed key length: ${privateKey.length}, has BEGIN: ${privateKey.includes('-----BEGIN')}`);

  // Use GoogleAuth with credentials object (more robust than JWT for env vars)
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: email,
      private_key: privateKey,
    },
    scopes: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/spreadsheets',
    ],
  });

  _authClient = await auth.getClient();
  logger.info('Google Auth — authorized successfully');
  return _authClient;
};

const getCalendar = async () => {
  const auth = await getGoogleAuth();
  return google.calendar({ version: 'v3', auth });
};

const getSheets = async () => {
  const auth = await getGoogleAuth();
  return google.sheets({ version: 'v4', auth });
};

// ─── Resend ──────────────────────────────────────────────────────────────────

let _resend = null;

const getResend = () => {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error('Missing RESEND_API_KEY environment variable');
    _resend = new Resend(apiKey);
  }
  return _resend;
};

// ─── Slot Generation ─────────────────────────────────────────────────────────

/**
 * Generate all possible 30-min slots for a given date string (YYYY-MM-DD).
 * Returns array of { startTime: 'HH:mm', endTime: 'HH:mm' }.
 */
export const generateSlots = (dateStr) => {
  const slots = [];
  for (const window of SLOT_WINDOWS) {
    for (let hour = window.start; hour < window.end; hour++) {
      for (let min = 0; min < 60; min += MEETING_DURATION_MINUTES) {
        const sh = String(hour).padStart(2, '0');
        const sm = String(min).padStart(2, '0');
        const endTotal = hour * 60 + min + MEETING_DURATION_MINUTES;
        if (endTotal > window.end * 60) continue; // don't overflow window
        const eh = String(Math.floor(endTotal / 60)).padStart(2, '0');
        const em = String(endTotal % 60).padStart(2, '0');
        slots.push({ startTime: `${sh}:${sm}`, endTime: `${eh}:${em}` });
      }
    }
  }
  return slots;
};

/**
 * Get available slots for a date — subtract already booked ones.
 */
export const getAvailableSlots = async (dateStr) => {
  const allSlots = generateSlots(dateStr);

  // Fetch confirmed bookings for this date
  const bookedSlots = await Booking.find({
    date: dateStr,
    status: { $ne: 'cancelled' },
  }).select('startTime endTime');

  const bookedSet = new Set(bookedSlots.map((b) => b.startTime));

  // Also filter out past slots if the date is today
  const now = new Date();
  const todayStr = now.toLocaleDateString('en-CA', { timeZone: TIMEZONE }); // YYYY-MM-DD
  const isPastSlot = (startTime) => {
    if (dateStr !== todayStr) return false;
    const [h, m] = startTime.split(':').map(Number);
    const nowIndia = new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE }));
    const slotMinutes = h * 60 + m;
    const currentMinutes = nowIndia.getHours() * 60 + nowIndia.getMinutes();
    return slotMinutes <= currentMinutes;
  };

  return allSlots.filter((s) => !bookedSet.has(s.startTime) && !isPastSlot(s.startTime));
};

// ─── Google Calendar ─────────────────────────────────────────────────────────

/**
 * Create Google Calendar event with Google Meet link.
 */
const createCalendarEvent = async ({ clientName, clientEmail, date, startTime, endTime }) => {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!calendarId) {
    logger.warn('GOOGLE_CALENDAR_ID not set — skipping calendar event creation');
    return { meetLink: null, eventId: null };
  }

  const startDateTime = `${date}T${startTime}:00`;
  const endDateTime = `${date}T${endTime}:00`;

  try {
    const calendar = await getCalendar();
    const event = await calendar.events.insert({
      calendarId,
      conferenceDataVersion: 1,
      requestBody: {
        summary: `SkyWorld Meeting — ${clientName}`,
        description: `Meeting with ${clientName} (${clientEmail}).\nBooked via SkyWorld Platform.`,
        start: { dateTime: startDateTime, timeZone: TIMEZONE },
        end: { dateTime: endDateTime, timeZone: TIMEZONE },
        // NOTE: attendees removed — service accounts cannot invite without Domain-Wide Delegation.
        // The client receives the Meet link via the Resend confirmation email instead.
        conferenceData: {
          createRequest: {
            requestId: `skyworld-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 30 },
            { method: 'popup', minutes: 10 },
          ],
        },
      },
    });

    const meetLink =
      event.data?.conferenceData?.entryPoints?.find((ep) => ep.entryPointType === 'video')?.uri ||
      event.data?.hangoutLink ||
      null;

    return { meetLink, eventId: event.data.id };
  } catch (error) {
    const detail = error?.response?.data?.error?.message || error?.errors?.[0]?.message || error.message || JSON.stringify(error);
    logger.error(`Google Calendar event creation failed: ${detail}`);
    return { meetLink: null, eventId: null };
  }
};

// ─── Google Sheets Log ───────────────────────────────────────────────────────

const logToSheet = async (booking) => {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  if (!spreadsheetId) {
    logger.warn('GOOGLE_SHEET_ID not set — skipping sheet logging');
    return;
  }

  try {
    const sheets = await getSheets();
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A:H',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          [
            booking.clientName,
            booking.clientEmail,
            booking.date,
            booking.startTime,
            booking.endTime,
            booking.meetLink || 'N/A',
            booking.status,
            new Date().toLocaleString('en-IN', { timeZone: TIMEZONE }),
          ],
        ],
      },
    });
  } catch (error) {
    const detail = error?.response?.data?.error?.message || error?.errors?.[0]?.message || error.message || JSON.stringify(error);
    logger.error(`Google Sheets logging failed: ${detail}`);
    // Non-blocking — don't throw
  }
};

// ─── Resend Confirmation Email ───────────────────────────────────────────────

const sendConfirmationEmail = async (booking) => {
  const fromEmail = process.env.FROM_RESEND_EMAIL || process.env.FROM_EMAIL || 'noreply@skyworld.com';

  try {
    const resend = getResend();

    const formattedDate = new Date(`${booking.date}T00:00:00`).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const formatTime12 = (time24) => {
      const [h, m] = time24.split(':').map(Number);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hour12 = h % 12 || 12;
      return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
    };

    const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 20px;">
<tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

  <!-- Header -->
  <tr>
    <td style="background:linear-gradient(135deg,#0ea5e9,#6366f1);padding:32px 40px;text-align:center;">
      <img src="https://res.cloudinary.com/dkkzhqs3z/image/upload/v1749316338/wordmark_logo_coloured_fullname_bpnbml.png"
           alt="SkyWorld" width="160" style="display:block;margin:0 auto 16px;" />
      <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0;">Meeting Confirmed</h1>
      <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:8px 0 0;">Your meeting has been booked successfully.</p>
    </td>
  </tr>

  <!-- Body -->
  <tr>
    <td style="padding:32px 40px;">
      <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 20px;">
        Hi <strong>${booking.clientName}</strong>,
      </p>
      <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Your meeting with the SkyWorld team has been scheduled. Here are the details:
      </p>

      <!-- Details box -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:20px;margin-bottom:24px;">
        <tr><td style="padding:20px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:6px 0;color:#64748b;font-size:13px;width:120px;">Date</td>
              <td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:600;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#64748b;font-size:13px;">Time</td>
              <td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:600;">${formatTime12(booking.startTime)} - ${formatTime12(booking.endTime)} IST</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#64748b;font-size:13px;">Duration</td>
              <td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:600;">30 minutes</td>
            </tr>
            ${booking.meetLink ? `
            <tr>
              <td style="padding:6px 0;color:#64748b;font-size:13px;">Meeting Link</td>
              <td style="padding:6px 0;"><a href="${booking.meetLink}" style="color:#0ea5e9;font-size:14px;font-weight:600;text-decoration:none;">Join Google Meet</a></td>
            </tr>` : ''}
          </table>
        </td></tr>
      </table>

      ${booking.meetLink ? `
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center" style="padding:0 0 24px;">
          <a href="${booking.meetLink}"
             style="display:inline-block;background:linear-gradient(135deg,#0ea5e9,#6366f1);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 40px;border-radius:8px;">
            Join Meeting
          </a>
        </td></tr>
      </table>` : ''}

      <p style="color:#64748b;font-size:13px;line-height:1.6;margin:0;">
        A calendar invitation has been sent to your email. Please make sure to join on time.<br/>
        If you need to reschedule, please contact us at support@skyworld.buzz.
      </p>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
      <p style="color:#94a3b8;font-size:12px;margin:0;">
        SkyWorld Ventures &middot; This is an automated confirmation email.
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;

    await resend.emails.send({
      from: `SkyWorld <${fromEmail}>`,
      to: [booking.clientEmail],
      subject: `Meeting Confirmed — ${formattedDate} at ${formatTime12(booking.startTime)} IST`,
      html,
    });

    logger.info(`Meeting confirmation email sent to ${booking.clientEmail}`);
  } catch (error) {
    logger.error('Meeting confirmation email failed:', error.message);
    // Non-blocking
  }
};

// ─── Main Booking Function ───────────────────────────────────────────────────

/**
 * Book a meeting:
 *  1. Check for conflicts
 *  2. Create Google Calendar event with Meet link
 *  3. Save booking to MongoDB
 *  4. Log to Google Sheets
 *  5. Send confirmation email via Resend
 *
 * @param {{ clientName: string, clientEmail: string, date: string, startTime: string, userId?: string }} params
 * @returns {Promise<Object>} booking document
 */
export const bookMeeting = async ({ clientName, clientEmail, date, startTime, userId = null }) => {
  // Calculate end time
  const [h, m] = startTime.split(':').map(Number);
  const endTotal = h * 60 + m + MEETING_DURATION_MINUTES;
  const endTime = `${String(Math.floor(endTotal / 60)).padStart(2, '0')}:${String(endTotal % 60).padStart(2, '0')}`;

  // 1 — Conflict check
  const conflict = await Booking.findOne({
    date,
    startTime,
    status: { $ne: 'cancelled' },
  });

  if (conflict) {
    const err = new Error('This time slot is already booked. Please choose another slot.');
    err.statusCode = 409;
    throw err;
  }

  // 2 — Google Calendar event
  const { meetLink, eventId } = await createCalendarEvent({
    clientName,
    clientEmail,
    date,
    startTime,
    endTime,
  });

  // 3 — Save to database
  const booking = await Booking.create({
    clientName,
    clientEmail,
    date,
    startTime,
    endTime,
    meetLink,
    eventId,
    status: 'confirmed',
    userId,
  });

  // 4 — Log to Google Sheets (fire-and-forget)
  logToSheet(booking).catch(() => {});

  // 5 — Send confirmation email (fire-and-forget)
  sendConfirmationEmail(booking).catch(() => {});

  return booking;
};

export default {
  generateSlots,
  getAvailableSlots,
  bookMeeting,
};
