import { logger } from '../utils/logger.js';

/**
 * Validate all required environment variables exist at startup.
 * Fails fast with clear error messages instead of cryptic runtime crashes.
 */
export const validateEnv = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    const required = [
        'MONGODB_URI',
        'JWT_ACCESS_SECRET',
        'JWT_REFRESH_SECRET',
        'RAZORPAY_KEY_ID',
        'RAZORPAY_KEY_SECRET',
    ];

    const recommended = [
        'FRONTEND_URL',
        'NODE_ENV',
        'RAZORPAY_WEBHOOK_SECRET',
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
        const message = 'JWT_ACCESS_SECRET should be at least 32 characters for security';
        if (isProduction) {
            logger.error(`FATAL: ${message}`);
            process.exit(1);
        }
        logger.warn(`Warning: ${message}`);
    }
    if (process.env.JWT_REFRESH_SECRET.length < 32) {
        const message = 'JWT_REFRESH_SECRET should be at least 32 characters for security';
        if (isProduction) {
            logger.error(`FATAL: ${message}`);
            process.exit(1);
        }
        logger.warn(`Warning: ${message}`);
    }

    // Ensure JWT secrets are different
    if (process.env.JWT_ACCESS_SECRET === process.env.JWT_REFRESH_SECRET) {
        logger.error('FATAL: JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different');
        process.exit(1);
    }

    if (isProduction && process.env.FRONTEND_URL && !/^https:\/\//i.test(process.env.FRONTEND_URL)) {
        logger.error('FATAL: FRONTEND_URL must use HTTPS in production');
        process.exit(1);
    }

    const hasBrevo = Boolean(
        process.env.BREVO_SMTP_HOST &&
        process.env.BREVO_SMTP_USER &&
        process.env.BREVO_SMTP_PASS
    );
    const hasGenericSmtp = Boolean(
        process.env.SMTP_HOST &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS
    );

    if (isProduction && !hasBrevo && !hasGenericSmtp) {
        logger.error('FATAL: Configure BREVO_SMTP_* or SMTP_* variables for OTP and password reset emails');
        process.exit(1);
    }

    if (!isProduction && !hasBrevo && !hasGenericSmtp && !(process.env.ETHEREAL_USER && process.env.ETHEREAL_PASS)) {
        logger.warn('Warning: No email provider configured. OTP/password reset emails will fail.');
    }

    logger.info('Environment variables validated successfully');
};
