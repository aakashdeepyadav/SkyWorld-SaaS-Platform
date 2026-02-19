import { logger } from '../utils/logger.js';

/**
 * Validate all required environment variables exist at startup.
 * Fails fast with clear error messages instead of cryptic runtime crashes.
 */
export const validateEnv = () => {
    const required = [
        'MONGODB_URI',
        'JWT_ACCESS_SECRET',
        'JWT_REFRESH_SECRET',
    ];

    const recommended = [
        'FRONTEND_URL',
        'NODE_ENV',
    ];

    const missing = required.filter(key => !process.env[key]);
    const missingRecommended = recommended.filter(key => !process.env[key]);

    if (missing.length > 0) {
        logger.error(`FATAL: Missing required environment variables: ${missing.join(', ')}`);
        logger.error('Please check your .env file or environment configuration.');
        process.exit(1);
    }

    if (missingRecommended.length > 0) {
        logger.warn(`Warning: Missing recommended environment variables: ${missingRecommended.join(', ')}`);
    }

    // Validate JWT secrets are strong enough (at least 32 chars)
    if (process.env.JWT_ACCESS_SECRET.length < 32) {
        logger.warn('Warning: JWT_ACCESS_SECRET should be at least 32 characters for security');
    }
    if (process.env.JWT_REFRESH_SECRET.length < 32) {
        logger.warn('Warning: JWT_REFRESH_SECRET should be at least 32 characters for security');
    }

    // Ensure JWT secrets are different
    if (process.env.JWT_ACCESS_SECRET === process.env.JWT_REFRESH_SECRET) {
        logger.error('FATAL: JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different');
        process.exit(1);
    }

    logger.info('Environment variables validated successfully');
};
