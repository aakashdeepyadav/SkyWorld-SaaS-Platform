/**
 * Sentry Integration — Bootstraps Sentry for error tracking and performance monitoring.
 *
 * Usage:
 *   1. Install:  npm install @sentry/node
 *   2. Set env:  SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/yyy
 *   3. Import early in index.js:  import './config/sentry.js';
 *
 * If SENTRY_DSN is not set, Sentry is silently disabled (no crash).
 */

let Sentry = null;

export async function initSentry() {
    const dsn = process.env.SENTRY_DSN;
    if (!dsn) {
        console.log('[Sentry] SENTRY_DSN not set — error tracking disabled');
        return;
    }

    try {
        Sentry = await import('@sentry/node');

        Sentry.init({
            dsn,
            environment: process.env.NODE_ENV || 'development',
            release: process.env.npm_package_version || '1.0.0',
            tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
            integrations: [],
            beforeSend(event) {
                // Scrub sensitive data
                if (event.request?.cookies) {
                    event.request.cookies = '[Redacted]';
                }
                return event;
            },
        });

        console.log(`[Sentry] Initialized (env: ${process.env.NODE_ENV})`);
    } catch (err) {
        console.warn('[Sentry] Failed to initialize — @sentry/node may not be installed.');
    }
}

/**
 * Capture an exception in Sentry (no-op if Sentry is not initialized).
 */
export function captureException(error, context = {}) {
    if (!Sentry) return;
    Sentry.withScope((scope) => {
        if (context.user) {
            scope.setUser({ id: context.user._id, email: context.user.email });
        }
        if (context.tags) {
            Object.entries(context.tags).forEach(([key, value]) => scope.setTag(key, value));
        }
        if (context.extra) {
            Object.entries(context.extra).forEach(([key, value]) => scope.setExtra(key, value));
        }
        Sentry.captureException(error);
    });
}

/**
 * Capture a breadcrumb message for debugging.
 */
export function captureMessage(message, level = 'info') {
    if (!Sentry) return;
    Sentry.captureMessage(message, level);
}

export { Sentry };
