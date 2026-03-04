import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.join(__dirname, '..', 'uploads');

const getBaseUrl = () =>
    process.env.BACKEND_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    `http://localhost:${process.env.PORT || 5000}`;

const normalizeFolder = (folder = 'skyworld') => {
    const trimmed = folder.replace(/^skyworld\/?/, '').replace(/^\/+/, '');
    return trimmed.replace(/\.\.+/g, '').replace(/[^a-zA-Z0-9/_-]/g, '');
};

const getExtension = (mimetype, originalName) => {
    if (originalName && originalName.includes('.')) {
        const ext = path.extname(originalName).replace('.', '');
        if (ext) return ext.toLowerCase();
    }
    const map = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'application/pdf': 'pdf',
        'application/msword': 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
        'application/vnd.ms-excel': 'xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
        'video/mp4': 'mp4',
        'video/webm': 'webm',
        'audio/mpeg': 'mp3',
        'audio/wav': 'wav'
    };
    return map[mimetype] || 'bin';
};

const saveLocalFile = async (fileBuffer, options = {}) => {
    const {
        folder = 'skyworld',
        resourceType = 'auto',
        mimetype,
        originalName
    } = options;

    const safeFolder = normalizeFolder(folder);
    const targetDir = path.join(uploadsRoot, safeFolder);
    await fs.promises.mkdir(targetDir, { recursive: true });

    const ext = getExtension(mimetype, originalName);
    const fileName = `${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
    const filePath = path.join(targetDir, fileName);
    await fs.promises.writeFile(filePath, fileBuffer);

    const publicId = path.posix.join(safeFolder.replace(/\\/g, '/'), fileName);
    const url = `${getBaseUrl()}/uploads/${publicId}`;

    return {
        publicId,
        url,
        format: ext,
        bytes: fileBuffer.length,
        width: undefined,
        height: undefined,
        resourceType
    };
};

export const getCloudinaryErrorResponse = (error) => {
    const reason = error?.details || error?.message || '';
    const lower = reason.toLowerCase();
    const isNetworkIssue = lower.includes('timeout') || lower.includes('econnreset') || lower.includes('enotfound') || lower.includes('socket hang up');
    const statusCode = error?.http_code || error?.statusCode || (isNetworkIssue ? 503 : 502);

    if (lower.includes('invalid signature')) {
        return { statusCode, message: 'Cloudinary credentials rejected. Check CLOUDINARY_API_SECRET and CLOUDINARY_API_KEY.' };
    }
    if (lower.includes('api_key') || lower.includes('api key')) {
        return { statusCode, message: 'Cloudinary API key is invalid or missing. Check CLOUDINARY_API_KEY.' };
    }
    if (lower.includes('cloud name') || lower.includes('cloud_name')) {
        return { statusCode, message: 'Cloudinary cloud name is invalid or missing. Check CLOUDINARY_CLOUD_NAME.' };
    }
    if (lower.includes('timeout') || lower.includes('econnreset') || lower.includes('enotfound')) {
        return { statusCode, message: 'Unable to reach Cloudinary from server. Check network or Cloudinary status.' };
    }

    return { statusCode, message: 'Cloudinary upload failed. Verify credentials and account status.' };
};

const isTemporaryCloudinaryError = (error) => {
    const reason = (error?.details || error?.message || '').toLowerCase();
    const statusCode = Number(error?.http_code || error?.statusCode || 0);
    if (statusCode >= 500) return true;
    return (
        reason.includes('timeout') ||
        reason.includes('econnreset') ||
        reason.includes('enotfound') ||
        reason.includes('socket hang up') ||
        reason.includes('service unavailable')
    );
};

export const uploadToCloudinary = async (fileBuffer, options = {}) => {
    if (!isCloudinaryConfigured()) {
        return saveLocalFile(fileBuffer, options);
    }

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
                    const err = new Error(error?.message || 'Cloudinary upload failed');
                    err.http_code = error?.http_code;
                    err.details = error?.message;
                    reject(err);
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
        if (!isCloudinaryConfigured()) {
            const resolved = path.resolve(uploadsRoot, publicId);
            if (!resolved.startsWith(uploadsRoot)) {
                throw new Error('Invalid file path');
            }
            if (fs.existsSync(resolved)) {
                await fs.promises.unlink(resolved);
            }
            return { result: 'ok' };
        }
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
    if (!isCloudinaryConfigured()) {
        return `${getBaseUrl()}/uploads/${publicId}`;
    }
    return cloudinary.url(publicId, {
        secure: true,
        ...transformations
    });
};

/**
 * Upload user avatar with specific optimizations
 * Avatars are small, square-cropped, and heavily optimized
 */
export const uploadAvatar = async (fileBuffer, options = {}) => {
    const fallbackOptions = {
        folder: 'skyworld/avatars',
        resourceType: 'image',
        mimetype: options.mimetype,
        originalName: options.originalName
    };

    if (!isCloudinaryConfigured()) {
        return saveLocalFile(fileBuffer, fallbackOptions);
    }

    try {
        return await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'skyworld/avatars',
                    resource_type: 'image',
                    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
                    transformation: [
                        { width: 256, height: 256, crop: 'fill', gravity: 'auto' },
                        { quality: 'auto', fetch_format: 'auto' }
                    ],
                    max_bytes: 5 * 1024 * 1024, // 5MB max for avatars
                },
                (error, result) => {
                    if (error) {
                        logger.error('Avatar upload error:', error);
                        const err = new Error(error?.message || 'Cloudinary upload failed');
                        err.http_code = error?.http_code;
                        err.details = error?.message;
                        reject(err);
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
    } catch (error) {
        if (isTemporaryCloudinaryError(error)) {
            logger.warn(`Cloudinary avatar upload unavailable, falling back to local storage: ${error?.details || error?.message}`);
            return saveLocalFile(fileBuffer, fallbackOptions);
        }
        throw error;
    }
};
