const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const getOriginFromReferer = (referer) => {
  try {
    return new URL(referer).origin;
  } catch {
    return '';
  }
};

/**
 * Lightweight CSRF defense for cookie-auth APIs:
 * for non-safe methods, require Origin/Referer to match allowed origins.
 */
export const csrfProtection = (allowedOrigins = []) => (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();

  const path = req.path || '';

  // Webhook callbacks are server-to-server and rely on signature verification.
  if (path === '/api/payments/razorpay/webhook') return next();

  // Protect cookie-authenticated requests (same-site form/XHR CSRF).
  const hasAuthCookie = Boolean(req.cookies?.accessToken || req.cookies?.refreshToken);
  if (!hasAuthCookie) return next();

  const origin = req.get('origin') || '';
  const refererOrigin = getOriginFromReferer(req.get('referer') || '');

  if (origin && allowedOrigins.includes(origin)) return next();
  if (!origin && refererOrigin && allowedOrigins.includes(refererOrigin)) return next();

  return res.status(403).json({
    success: false,
    message: 'Request blocked by CSRF protection'
  });
};

