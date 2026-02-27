/**
 * Custom application error class.
 *
 * Extends native Error with an HTTP status code and an `isOperational`
 * flag so the centralized error handler can distinguish expected
 * business errors from unexpected crashes.
 */
export class AppError extends Error {
    /**
     * @param {string}  message    — Human-readable error message
     * @param {number}  statusCode — HTTP status code (default 400)
     * @param {object}  [options]
     * @param {boolean} [options.isOperational=true] — true = expected business error
     * @param {object}  [options.details]            — Extra context (validation errors, etc.)
     */
    constructor(message, statusCode = 400, { isOperational = true, details = null } = {}) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }

    /* ── Convenience factories ── */

    static badRequest(message = 'Bad request', details) {
        return new AppError(message, 400, { details });
    }

    static unauthorized(message = 'Authentication required') {
        return new AppError(message, 401);
    }

    static forbidden(message = 'Access denied') {
        return new AppError(message, 403);
    }

    static notFound(message = 'Resource not found') {
        return new AppError(message, 404);
    }

    static conflict(message = 'Resource already exists') {
        return new AppError(message, 409);
    }

    static tooMany(message = 'Too many requests') {
        return new AppError(message, 429);
    }

    static internal(message = 'Internal server error') {
        return new AppError(message, 500, { isOperational: false });
    }
}

export default AppError;
