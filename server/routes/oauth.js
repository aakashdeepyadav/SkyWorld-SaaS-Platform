import { Router } from 'express';
import { google } from 'googleapis';
import IntegrationCredential from '../models/IntegrationCredential.js';
import { authenticate } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = Router();

const SCOPES = [
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/spreadsheets',
];

/**
 * Build an OAuth2 client from env vars.
 */
const getOAuth2Client = () => {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Missing GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, or GOOGLE_OAUTH_REDIRECT_URI');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
};

// ─── GET /api/v1/oauth/google/status ───────────────────────────────────────
// Public — check if Google Calendar OAuth is connected.
router.get('/google/status', async (req, res, next) => {
  try {
    const cred = await IntegrationCredential.getGoogle();
    if (!cred) {
      return res.json({ connected: false });
    }
    return res.json({
      connected: true,
      email: cred.email || null,
      calendarId: cred.calendarId || null,
      connectedAt: cred.connectedAt,
    });
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/v1/oauth/google/url ──────────────────────────────────────────
// Admin only — generate the Google OAuth consent URL.
router.get('/google/url', authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }

    const oauth2Client = getOAuth2Client();
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent', // Force consent to always get refresh_token
      scope: SCOPES,
      state: req.user._id.toString(), // Pass admin user ID as state
    });

    return res.json({ success: true, url });
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/v1/oauth/google/callback ─────────────────────────────────────
// Google redirects here after user grants consent.
// This is NOT an API call — it's a browser redirect, so we redirect to the frontend.
router.get('/google/callback', async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  try {
    const { code, state, error: oauthError } = req.query;

    if (oauthError) {
      logger.error(`Google OAuth error: ${oauthError}`);
      return res.redirect(`${frontendUrl}/admin/settings?oauth=error&reason=${encodeURIComponent(oauthError)}`);
    }

    if (!code) {
      return res.redirect(`${frontendUrl}/admin/settings?oauth=error&reason=no_code`);
    }

    const oauth2Client = getOAuth2Client();

    logger.info(`OAuth callback — exchanging code (length: ${code.length}), redirect_uri: ${process.env.GOOGLE_OAUTH_REDIRECT_URI}`);

    let tokens;
    try {
      const tokenResponse = await oauth2Client.getToken(code);
      tokens = tokenResponse.tokens;
    } catch (tokenErr) {
      const detail = tokenErr?.response?.data?.error_description
        || tokenErr?.response?.data?.error
        || tokenErr.message;
      logger.error(`OAuth getToken failed: ${detail}`);
      logger.error(`OAuth getToken full error: ${JSON.stringify(tokenErr?.response?.data || tokenErr.message)}`);
      return res.redirect(`${frontendUrl}/admin/settings?oauth=error&reason=${encodeURIComponent(detail)}`);
    }

    logger.info(`OAuth tokens received — has refresh_token: ${!!tokens.refresh_token}, has access_token: ${!!tokens.access_token}, has id_token: ${!!tokens.id_token}`);

    if (!tokens.refresh_token) {
      logger.error('Google OAuth: No refresh_token received. Was prompt=consent used?');
      return res.redirect(`${frontendUrl}/admin/settings?oauth=error&reason=no_refresh_token`);
    }

    // Extract email from the id_token (avoids a separate API call)
    let email = 'unknown';
    if (tokens.id_token) {
      try {
        // Decode the JWT payload (base64url)
        const payload = JSON.parse(
          Buffer.from(tokens.id_token.split('.')[1], 'base64url').toString()
        );
        email = payload.email || 'unknown';
      } catch (decodeErr) {
        logger.warn(`Failed to decode id_token: ${decodeErr.message}`);
      }
    }

    // Fallback: if id_token didn't have email, try userinfo API
    if (email === 'unknown') {
      try {
        oauth2Client.setCredentials(tokens);
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const userInfo = await oauth2.userinfo.get();
        email = userInfo.data.email || 'unknown';
      } catch (infoErr) {
        logger.warn(`userinfo fallback failed: ${infoErr.message}`);
      }
    }

    // Upsert the credential (singleton per provider)
    let cred = await IntegrationCredential.getGoogle();
    if (cred) {
      cred.setRefreshToken(tokens.refresh_token);
      if (tokens.access_token) {
        cred.setAccessToken(
          tokens.access_token,
          tokens.expiry_date ? new Date(tokens.expiry_date) : null
        );
      }
      cred.email = email;
      cred.calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
      cred.scopes = SCOPES;
      cred.ownerUserId = state; // admin who connected
      cred.connectedAt = new Date();
      await cred.save();
    } else {
      cred = new IntegrationCredential({
        provider: 'google',
        ownerUserId: state,
        calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
        email,
        scopes: SCOPES,
        connectedAt: new Date(),
      });
      cred.setRefreshToken(tokens.refresh_token);
      if (tokens.access_token) {
        cred.setAccessToken(
          tokens.access_token,
          tokens.expiry_date ? new Date(tokens.expiry_date) : null
        );
      }
      await cred.save();
    }

    logger.info(`Google OAuth connected successfully for ${email} by admin ${state}`);

    // Redirect back to admin settings with success
    return res.redirect(`${frontendUrl}/admin/settings?oauth=success`);
  } catch (error) {
    logger.error(`Google OAuth callback error: ${error.message}`);
    return res.redirect(`${frontendUrl}/admin/settings?oauth=error&reason=${encodeURIComponent(error.message)}`);
  }
});

// ─── DELETE /api/v1/oauth/google/disconnect ────────────────────────────────
// Admin only — remove stored Google OAuth credential.
router.delete('/google/disconnect', authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }

    const cred = await IntegrationCredential.getGoogle();
    if (!cred) {
      return res.json({ success: true, message: 'No Google integration to disconnect.' });
    }

    // Optionally revoke the token at Google
    try {
      const oauth2Client = getOAuth2Client();
      oauth2Client.setCredentials({ refresh_token: cred.getRefreshToken() });
      await oauth2Client.revokeCredentials();
    } catch (revokeErr) {
      logger.warn(`Failed to revoke Google token: ${revokeErr.message}`);
    }

    await IntegrationCredential.deleteOne({ _id: cred._id });
    logger.info(`Google OAuth disconnected by admin ${req.user._id}`);

    return res.json({ success: true, message: 'Google integration disconnected.' });
  } catch (error) {
    next(error);
  }
});

export default router;
