import { v2 as cloudinary } from 'cloudinary';
import { logger } from '../utils/logger.js';

/**
 * Configure Cloudinary
 * Free tier: 25 credits/month (~25GB storage + 25GB bandwidth)
 */
let cloudinaryConfigured = false;

const cleanEnvValue = (value) => {
    if (typeof value !== 'string') return value;
    return value.trim().replace(/^['"]|['"]$/g, '');
};

const parseCloudinaryUrl = (cloudinaryUrl) => {
    try {
        const parsed = new URL(cloudinaryUrl);
        if (parsed.protocol !== 'cloudinary:') return null;
        return {
            cloudName: parsed.hostname,
            apiKey: decodeURIComponent(parsed.username || ''),
            apiSecret: decodeURIComponent(parsed.password || '')
        };
    } catch {
        return null;
    }
};

const configureCloudinary = () => {
    let cloudName = cleanEnvValue(process.env.CLOUDINARY_CLOUD_NAME);
    let apiKey = cleanEnvValue(process.env.CLOUDINARY_API_KEY);
    let apiSecret = cleanEnvValue(process.env.CLOUDINARY_API_SECRET);
    const cloudinaryUrl = cleanEnvValue(process.env.CLOUDINARY_URL);

    if ((!cloudName || !apiKey || !apiSecret) && cloudinaryUrl) {
        const parsed = parseCloudinaryUrl(cloudinaryUrl);
        if (parsed) {
            cloudName = cloudName || parsed.cloudName;
            apiKey = apiKey || parsed.apiKey;
            apiSecret = apiSecret || parsed.apiSecret;
        } else {
            logger.warn('CLOUDINARY_URL is present but invalid. Expected: cloudinary://<api_key>:<api_secret>@<cloud_name>');
        }
    }

    if (!cloudName || !apiKey || !apiSecret) {
        logger.warn('Cloudinary credentials not configured. Set CLOUDINARY_CLOUD_NAME/CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET or CLOUDINARY_URL.');
        cloudinaryConfigured = false;
        return false;
    }

    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true // Always use HTTPS
    });

    logger.info('Cloudinary configured successfully');
    cloudinaryConfigured = true;
    return true;
};

const isCloudinaryConfigured = () => cloudinaryConfigured;

export { cloudinary, configureCloudinary, isCloudinaryConfigured };
