import { cloudinary } from '../config/cloudinary.js';
import { logger } from '../utils/logger.js';

/**
 * Upload file buffer to Cloudinary
 * 
 * @param {Buffer} fileBuffer - The file buffer from multer memoryStorage
 * @param {Object} options - Upload options
 * @param {string} options.folder - Cloudinary folder to store in
 * @param {string} options.resourceType - 'image', 'video', 'raw', or 'auto'
 * @param {string} [options.publicId] - Optional custom public_id
 * @returns {Object} Cloudinary upload result
 */
export const uploadToCloudinary = (fileBuffer, options = {}) => {
    return new Promise((resolve, reject) => {
        const {
            folder = 'skyworld',
            resourceType = 'auto',
            publicId = undefined,
        } = options;

        const uploadOptions = {
            folder,
            resource_type: resourceType,
            // Security: restrict file types on Cloudinary side too
            allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'mp4', 'webm', 'mp3', 'wav'],
            // Optimize images automatically
            transformation: resourceType === 'image' ? [
                { quality: 'auto', fetch_format: 'auto' }
            ] : undefined,
            // Max file size 10MB on Cloudinary side
            max_bytes: 10 * 1024 * 1024,
        };

        if (publicId) {
            uploadOptions.public_id = publicId;
        }

        // Upload via stream from buffer
        const uploadStream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
                if (error) {
                    logger.error('Cloudinary upload error:', error);
                    reject(new Error('File upload failed. Please try again.'));
                } else {
                    resolve({
                        publicId: result.public_id,
                        url: result.secure_url,
                        format: result.format,
                        bytes: result.bytes,
                        width: result.width,
                        height: result.height,
                        resourceType: result.resource_type,
                    });
                }
            }
        );

        uploadStream.end(fileBuffer);
    });
};

/**
 * Delete file from Cloudinary
 * 
 * @param {string} publicId - The public_id of the file to delete
 * @param {string} resourceType - 'image', 'video', or 'raw'
 */
export const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
    try {
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType
        });
        logger.info(`Cloudinary file deleted: ${publicId}`);
        return result;
    } catch (error) {
        logger.error('Cloudinary delete error:', error);
        throw new Error('File deletion failed');
    }
};

/**
 * Generate a secure URL for an existing Cloudinary asset
 * 
 * @param {string} publicId - The public_id
 * @param {Object} transformations - Cloudinary transformations
 * @returns {string} Secure URL
 */
export const getCloudinaryUrl = (publicId, transformations = {}) => {
    return cloudinary.url(publicId, {
        secure: true,
        ...transformations
    });
};

/**
 * Upload user avatar with specific optimizations
 * Avatars are small, square-cropped, and heavily optimized
 */
export const uploadAvatar = async (fileBuffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'skyworld/avatars',
                resource_type: 'image',
                allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
                transformation: [
                    { width: 256, height: 256, crop: 'fill', gravity: 'face' },
                    { quality: 'auto', fetch_format: 'auto' }
                ],
                max_bytes: 5 * 1024 * 1024, // 5MB max for avatars
            },
            (error, result) => {
                if (error) {
                    logger.error('Avatar upload error:', error);
                    reject(new Error('Avatar upload failed'));
                } else {
                    resolve({
                        publicId: result.public_id,
                        url: result.secure_url,
                    });
                }
            }
        );

        uploadStream.end(fileBuffer);
    });
};
