import { v2 as cloudinary } from 'cloudinary';
import { logger } from '../utils/logger.js';

/**
 * Configure Cloudinary
 * Free tier: 25 credits/month (~25GB storage + 25GB bandwidth)
 */
const configureCloudinary = () => {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
        logger.warn('Cloudinary credentials not configured. File uploads will be disabled.');
        return false;
    }

    cloudinary.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET,
        secure: true // Always use HTTPS
    });

    logger.info('Cloudinary configured successfully');
    return true;
};

export { cloudinary, configureCloudinary };
