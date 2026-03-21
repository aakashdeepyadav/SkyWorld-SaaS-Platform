import { Router } from 'express';
import crypto from 'crypto';
import { google } from 'googleapis';
import IntegrationCredential from '../models/IntegrationCredential.js';
import { authenticate } from '../middleware/auth.js';
import { adminOnly } from '../middleware/rbac.js';
import { apiRateLimiter } from '../middleware/rateLimiter.js';
import {
  GOOGLE_INTEGRATION_SCOPES,
  upsertGoogleCredential,
} from '../services/googleIntegrationService.js';
import { logger } from '../utils/logger.js';
import { invalidateMeetCapabilityCache } from '../services/meetingService.js';

const router = Router();

const SCOPES = GOOGLE_INTEGRATION_SCOPES;

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
router.get('/google/status', apiRateLimiter, async (req, res, next) => {
  try {
    const cred = await IntegrationCredential.getGoogle();
    if (!cred) {
      return res.json({ connected: false });
    }
    return res.json({
      connected: true,
      email: cred.email,
      calendarId: cred.calendarId,
      connectedAt: cred.connectedAt,
    });
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/v1/oauth/google/url ──────────────────────────────────────────
// Admin only — generate the Google OAuth consent URL.
// Temporary in-memory store for OAuth CSRF state tokens (TTL: 10 min)
const oauthStateTokens = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [key, state] of oauthStateTokens) {
    if (!state?.createdAt || now - state.createdAt > 10 * 60 * 1000) {
      oauthStateTokens.delete(key);
    }
  }
}, 60_000);

router.get('/google/url', authenticate, adminOnly, apiRateLimiter, async (req, res, next) => {
  try {
    const oauth2Client = getOAuth2Client();
    const stateNonce = crypto.randomBytes(16).toString('hex');
    oauthStateTokens.set(stateNonce, {
      createdAt: Date.now(),
      adminUserId: String(req.user._id),
    });

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: SCOPES,
      state: stateNonce,
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

    // Validate CSRF state nonce
    if (!state || !oauthStateTokens.has(state)) {
      logger.warn('OAuth callback with invalid or missing state parameter');
      return res.redirect(`${frontendUrl}/admin/settings?oauth=error&reason=invalid_state`);
    }
    const stateRecord = oauthStateTokens.get(state);
    oauthStateTokens.delete(state);
    if (!stateRecord?.adminUserId) {
      logger.warn('OAuth callback state did not include admin identity');
      return res.redirect(`${frontendUrl}/admin/settings?oauth=error&reason=invalid_state`);
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

    await upsertGoogleCredential({
      tokens,
      ownerUserId: stateRecord.adminUserId,
      email,
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      connectedAt: new Date(),
    });

    invalidateMeetCapabilityCache();

    logger.info(
      `Google OAuth connected successfully for ${email} by admin ${stateRecord.adminUserId}`
    );

    // Redirect back to admin settings with success
    return res.redirect(`${frontendUrl}/admin/settings?oauth=success`);
  } catch (error) {
    logger.error(`Google OAuth callback error: ${error.message}`);
    return res.redirect(`${frontendUrl}/admin/settings?oauth=error&reason=${encodeURIComponent(error.message)}`);
  }
});

// ─── DELETE /api/v1/oauth/google/disconnect ────────────────────────────────
// Admin only — remove stored Google OAuth credential.
router.delete('/google/disconnect', authenticate, adminOnly, apiRateLimiter, async (req, res, next) => {
  try {

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
    invalidateMeetCapabilityCache();
    logger.info(`Google OAuth disconnected by admin ${req.user._id}`);

    return res.json({ success: true, message: 'Google integration disconnected.' });
  } catch (error) {
    next(error);
  }
});

export default router;
