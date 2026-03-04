import { google } from 'googleapis';
import { Resend } from 'resend';
import { logger } from '../utils/logger.js';
import Booking from '../models/Booking.js';
import IntegrationCredential from '../models/IntegrationCredential.js';

// ─── Constants ───────────────────────────────────────────────────────────────

const TIMEZONE = 'Asia/Kolkata';
const MEETING_DURATION_MINUTES = 30;
const MEET_CAPABILITY_CACHE_TTL_MS = 5 * 60 * 1000;

// Slot windows (24 h format): 09:00–12:00 and 13:00–17:00
const SLOT_WINDOWS = [
  { start: 9, end: 12 },  // 09:00 – 12:00
  { start: 13, end: 17 }, // 13:00 – 17:00
];

// ─── Google OAuth2 Auth ──────────────────────────────────────────────────────

let _meetCapabilityCache = { checkedAt: 0, result: null };

/**
 * Build an OAuth2 client using stored refresh token from IntegrationCredential.
 * Throws if no credential is connected.
 */
const getOAuth2Client = async () => {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth2 not configured (missing GOOGLE_OAUTH_CLIENT_ID / SECRET).');
  }

  const cred = await IntegrationCredential.getGoogle();
  if (!cred) {
    throw new Error('Google Calendar is not connected. An admin must connect via Settings → Google Integration.');
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  // Set the refresh token — the library will auto-refresh the access token
  oauth2Client.setCredentials({
    refresh_token: cred.getRefreshToken(),
  });

  // If we have a cached access token that is still valid, set it too
  if (cred.accessTokenEncrypted && cred.accessTokenExpiresAt && new Date(cred.accessTokenExpiresAt) > new Date()) {
    oauth2Client.setCredentials({
      refresh_token: cred.getRefreshToken(),
      access_token: cred.getAccessToken(),
      expiry_date: new Date(cred.accessTokenExpiresAt).getTime(),
    });
  }

  // Listen for token refresh events to persist new access tokens
  oauth2Client.on('tokens', async (tokens) => {
    try {
      const freshCred = await IntegrationCredential.getGoogle();
      if (freshCred && tokens.access_token) {
        freshCred.setAccessToken(
          tokens.access_token,
          tokens.expiry_date ? new Date(tokens.expiry_date) : null
        );
        if (tokens.refresh_token) {
          freshCred.setRefreshToken(tokens.refresh_token);
        }
        await freshCred.save();
        logger.info('OAuth2 access token refreshed and persisted.');
      }
    } catch (err) {
      logger.warn(`Failed to persist refreshed OAuth2 token: ${err.message}`);
    }
  });

  return oauth2Client;
};

const getCalendar = async () => {
  const auth = await getOAuth2Client();
  return google.calendar({ version: 'v3', auth });
};

const getSheets = async () => {
  const auth = await getOAuth2Client();
  return google.sheets({ version: 'v4', auth });
};

/**
 * Check if Google OAuth is connected (quick DB check, no API call).
 */
export const isGoogleConnected = async () => {
  const cred = await IntegrationCredential.getGoogle();
  return !!cred;
};

export const checkMeetGenerationCapability = async () => {
  const now = Date.now();
  if (
    _meetCapabilityCache.result &&
    now - _meetCapabilityCache.checkedAt < MEET_CAPABILITY_CACHE_TTL_MS
  ) {
    return _meetCapabilityCache.result;
  }

  // First check if OAuth is connected at all
  const connected = await isGoogleConnected();
  if (!connected) {
    const result = {
      ok: false,
      message: 'Google Calendar is not connected. An admin must connect via Settings → Google Integration.',
    };
    _meetCapabilityCache = { checkedAt: now, result };
    return result;
  }

  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
  let probeEventId = null;

  try {
    const calendar = await getCalendar();
    const probeStart = new Date(Date.now() + 10 * 60 * 1000);
    const probeEnd = new Date(Date.now() + 20 * 60 * 1000);

    const probeEvent = await calendar.events.insert({
      calendarId,
      conferenceDataVersion: 1,
      requestBody: {
        summary: 'SkyWorld Meet Capability Check',
        description: 'Temporary event to verify Google Meet link generation capability.',
        start: { dateTime: probeStart.toISOString(), timeZone: TIMEZONE },
        end: { dateTime: probeEnd.toISOString(), timeZone: TIMEZONE },
        conferenceData: {
          createRequest: {
            requestId: `skyworld-preflight-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
      },
    });

    probeEventId = probeEvent.data?.id || null;
    const meetLink =
      probeEvent.data?.conferenceData?.entryPoints?.find((ep) => ep.entryPointType === 'video')?.uri ||
      probeEvent.data?.hangoutLink ||
      null;

    if (!meetLink) {
      const result = {
        ok: false,
        message: 'Calendar event was created but Google Meet link was not returned. Ensure Google Meet is enabled for this account.',
      };
      _meetCapabilityCache = { checkedAt: now, result };
      return result;
    }

    const result = {
      ok: true,
      message: 'Google Meet link generation is available.',
    };
    _meetCapabilityCache = { checkedAt: now, result };
    return result;
  } catch (error) {
    const detail =
      error?.response?.data?.error?.message ||
      error?.errors?.[0]?.message ||
      error.message ||
      JSON.stringify(error);
    logger.error(`Meet capability check failed: ${detail}`);
    const result = {
      ok: false,
      message: `Google Meet check failed: ${detail}`,
    };
    _meetCapabilityCache = { checkedAt: now, result };
    return result;
  } finally {
    if (probeEventId) {
      try {
        const calendar = await getCalendar();
        await calendar.events.delete({
          calendarId: calendarId,
          eventId: probeEventId,
        });
      } catch (cleanupError) {
        logger.warn(`Meet capability probe cleanup failed: ${cleanupError?.message || 'Unknown error'}`);
      }
    }
  }
};

/**
 * Invalidate the cached Meet capability result (called after OAuth connect/disconnect).
 */
export const invalidateMeetCapabilityCache = () => {
  _meetCapabilityCache = { checkedAt: 0, result: null };
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
  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

  const startDateTime = `${date}T${startTime}:00`;
  const endDateTime = `${date}T${endTime}:00`;

  const baseEvent = {
    summary: `SkyWorld Meeting — ${clientName}`,
    description: `Meeting with ${clientName} (${clientEmail}).\nBooked via SkyWorld Platform.`,
    start: { dateTime: startDateTime, timeZone: TIMEZONE },
    end: { dateTime: endDateTime, timeZone: TIMEZONE },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 30 },
        { method: 'popup', minutes: 10 },
      ],
    },
  };

  try {
    const calendar = await getCalendar();
    const event = await calendar.events.insert({
      calendarId,
      conferenceDataVersion: 1,
      sendUpdates: 'none',
      requestBody: {
        ...baseEvent,
        conferenceData: {
          createRequest: {
            requestId: `skyworld-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
      },
    });

    const meetLink =
      event.data?.conferenceData?.entryPoints?.find((ep) => ep.entryPointType === 'video')?.uri ||
      event.data?.hangoutLink ||
      null;

    if (!meetLink) {
      const error = new Error('Google Meet link was not returned by Calendar API.');
      error.statusCode = 502;
      throw error;
    }

    logger.info('Calendar event created with Google Meet link');
    return { meetLink, eventId: event.data.id };
  } catch (error) {
    const detail = error?.response?.data?.error?.message || error?.errors?.[0]?.message || error.message || JSON.stringify(error);
    logger.error(`Google Calendar event creation failed: ${detail}`);
    const wrappedError = new Error(`Unable to generate Google Meet link: ${detail}`);
    wrappedError.statusCode = error.statusCode || 502;
    throw wrappedError;
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

    const toGoogleUtcStamp = (dateStr, timeStr) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      const [hour, minute] = timeStr.split(':').map(Number);
      const utcDate = new Date(Date.UTC(year, month - 1, day, hour - 5, minute - 30, 0));
      return utcDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    };

    const frontendBaseUrl = (process.env.FRONTEND_URL || 'https://skyworld.buzz').replace(/\/$/, '');
    const brandWordmarkUrl = `${frontendBaseUrl}/wordmark_logo_black_fullname.png`;
    const brandIconUrl = `${frontendBaseUrl}/icon_logo_coloured.png`;
    const brandHomeUrl = process.env.BRAND_WEBSITE_URL || frontendBaseUrl;

    const googleEventTitle = `SkyWorld Meeting — ${booking.clientName}`;
    const googleEventDetails = booking.meetLink
      ? `Meeting with SkyWorld Ventures.\n\nJoin Google Meet: ${booking.meetLink}`
      : 'Meeting with SkyWorld Ventures.';
    const googleEventLocation = booking.meetLink || 'Online meeting';
    const googleStart = toGoogleUtcStamp(booking.date, booking.startTime);
    const googleEnd = toGoogleUtcStamp(booking.date, booking.endTime);
    const addToCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(googleEventTitle)}&dates=${googleStart}%2F${googleEnd}&details=${encodeURIComponent(googleEventDetails)}&location=${encodeURIComponent(googleEventLocation)}`;

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
    <td style="background:linear-gradient(135deg,#0ea5e9,#6366f1);padding:36px 40px 34px;text-align:center;">
      <table cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 18px;background:#ffffff;border-radius:14px;">
        <tr>
          <td style="padding:10px 14px 10px 10px;text-align:center;">
            <a href="${brandHomeUrl}" target="_blank" style="text-decoration:none;display:inline-block;">
              <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  <td style="padding:0 10px 0 0;vertical-align:middle;">
                    <img src="${brandIconUrl}" alt="SkyWorld" width="28" style="display:block;width:28px;max-width:28px;height:auto;border:0;outline:none;text-decoration:none;" />
                  </td>
                  <td style="vertical-align:middle;">
                    <img src="${brandWordmarkUrl}" alt="SkyWorld Ventures" width="162" style="display:block;width:162px;max-width:162px;height:auto;border:0;outline:none;text-decoration:none;" />
                  </td>
                </tr>
              </table>
            </a>
          </td>
        </tr>
      </table>
      <p style="color:#ffffff;font-size:12px;letter-spacing:1.3px;font-weight:700;text-transform:uppercase;margin:0 0 10px;">SkyWorld Ventures</p>
      <h1 style="color:#ffffff;font-size:24px;font-weight:800;line-height:1.2;margin:0;">Meeting Confirmed</h1>
      <p style="color:rgba(255,255,255,0.88);font-size:14px;line-height:1.6;margin:10px 0 0;">Your session is locked in. We’re looking forward to meeting you.</p>
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

      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center" style="padding:0 0 24px;">
          <a href="${addToCalendarUrl}"
             style="display:inline-block;background:#0f172a;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px;">
            Add to Google Calendar
          </a>
        </td></tr>
      </table>

      <p style="color:#64748b;font-size:13px;line-height:1.6;margin:0;">
        This email contains your official meeting details and join link. Please keep it safe and join on time.<br/>
        If you need to reschedule, contact us at support@skyworld.buzz.
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

    logger.info(`Sending meeting confirmation email to ${booking.clientEmail} from ${fromEmail}`);

    const { data, error: resendError } = await resend.emails.send({
      from: `SkyWorld <${fromEmail}>`,
      to: [booking.clientEmail],
      subject: `Meeting Confirmed — ${formattedDate} at ${formatTime12(booking.startTime)} IST`,
      html,
    });

    if (resendError) {
      logger.error('Resend API returned error:', JSON.stringify(resendError));
      return;
    }

    logger.info(`Meeting confirmation email sent to ${booking.clientEmail} — id: ${data?.id}`);
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
  isGoogleConnected,
  invalidateMeetCapabilityCache,
};
