import File from '../models/File.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import { uploadToCloudinary, deleteFromCloudinary, uploadAvatar } from '../services/cloudinaryService.js';
import { isCloudinaryConfigured } from '../config/cloudinary.js';
import { getFileType } from '../middleware/upload.js';
import { createAuditLog } from '../middleware/auth.js';
import { ROLES } from '../utils/constants.js';
import { logger } from '../utils/logger.js';

/**
 * @route   POST /api/files/upload
 * @desc    Upload file to Cloudinary (project file)
 * @access  Private
 */
export const uploadFile = async (req, res, next) => {
    try {
        if (!isCloudinaryConfigured()) {
            return res.status(503).json({
                success: false,
                message: 'File upload service unavailable. Please try again later.'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file provided'
            });
        }

        const { projectId } = req.body;

        // Verify project access if projectId is provided
        if (projectId) {
            const project = await Project.findById(projectId);
            if (!project) {
                return res.status(404).json({
                    success: false,
                    message: 'Project not found'
                });
            }

            // Check access
            const isClient = project.clientId.toString() === req.user._id.toString();
            const isDeveloper = project.developerIds.some(dev => dev.toString() === req.user._id.toString());
            const isAdmin = req.user.role === ROLES.ADMIN;

            if (!isClient && !isDeveloper && !isAdmin) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
        }

        const fileType = getFileType(req.file.mimetype);
        const folder = projectId ? `skyworld/projects/${projectId}` : 'skyworld/general';

        // Upload to Cloudinary
        const result = await uploadToCloudinary(req.file.buffer, {
            folder,
            resourceType: fileType === 'document' ? 'raw' : 'auto',
        });

        // Save file record to database
        const file = await File.create({
            projectId: projectId || null,
            uploadedBy: req.user._id,
            fileName: result.publicId,
            originalName: req.file.originalname,
            fileType,
            fileSize: req.file.size,
            fileUrl: result.url,
            cloudinaryPublicId: result.publicId,
            storageProvider: 'cloudinary',
            mimeType: req.file.mimetype,
            isPublic: false
        });

        const populatedFile = await File.findById(file._id)
            .populate('uploadedBy', 'name email');

        await createAuditLog(req, 'file_uploaded', 'file', file._id, {
            fileName: req.file.originalname,
            fileType,
            fileSize: req.file.size,
            projectId
        });

        res.status(201).json({
            success: true,
            message: 'File uploaded successfully',
            file: populatedFile
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   POST /api/files/avatar
 * @desc    Upload user avatar
 * @access  Private
 */
export const uploadUserAvatar = async (req, res, next) => {
    try {
        if (!isCloudinaryConfigured()) {
            return res.status(503).json({
                success: false,
                message: 'Image upload service unavailable. Please try again later.'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image provided'
            });
        }

        // Validate it's an image
        if (!req.file.mimetype.startsWith('image/')) {
            return res.status(400).json({
                success: false,
                message: 'Only image files are allowed for avatars'
            });
        }

        // Upload to Cloudinary with avatar-specific optimizations
        let result;
        try {
            result = await uploadAvatar(req.file.buffer);
        } catch (cloudinaryError) {
            logger.error('Cloudinary avatar upload failed:', cloudinaryError);
            return res.status(502).json({
                success: false,
                message: 'Image upload service unavailable. Please try again later.'
            });
        }

        // Update user avatar URL in MongoDB
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { avatar: result.url },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        await createAuditLog(req, 'avatar_uploaded', 'user', req.user._id);

        res.json({
            success: true,
            message: 'Avatar uploaded successfully',
            avatar: result.url,
            user: user.toPublicJSON()
        });
    } catch (error) {
        logger.error('Avatar upload error:', error);
        next(error);
    }
};

/**
 * @route   GET /api/files
 * @desc    Get files (filtered by project)
 * @access  Private
 */
export const getFiles = async (req, res, next) => {
    try {
        const { projectId, page = 1, limit = 20 } = req.query;

        if (!projectId) {
            return res.status(400).json({
                success: false,
                message: 'Project ID is required'
            });
        }

        // Verify project access
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        const isClient = project.clientId.toString() === req.user._id.toString();
        const isDeveloper = project.developerIds.some(dev => dev.toString() === req.user._id.toString());
        const isAdmin = req.user.role === ROLES.ADMIN;

        if (!isClient && !isDeveloper && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const files = await File.find({ projectId })
            .populate('uploadedBy', 'name email avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await File.countDocuments({ projectId });

        res.json({
            success: true,
            count: files.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            files
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   DELETE /api/files/:id
 * @desc    Delete file
 * @access  Private (owner or admin)
 */
export const deleteFile = async (req, res, next) => {
    try {
        const file = await File.findById(req.params.id);

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        // Only uploader or admin can delete
        const isOwner = file.uploadedBy.toString() === req.user._id.toString();
        const isAdmin = req.user.role === ROLES.ADMIN;

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Delete from Cloudinary
        if (file.cloudinaryPublicId) {
            const resourceType = file.fileType === 'image' ? 'image' :
                file.fileType === 'video' ? 'video' : 'raw';
            await deleteFromCloudinary(file.cloudinaryPublicId, resourceType);
        }

        // Delete from database
        await File.findByIdAndDelete(req.params.id);

        await createAuditLog(req, 'file_deleted', 'file', file._id, {
            fileName: file.originalName,
            projectId: file.projectId
        });

        res.json({
            success: true,
            message: 'File deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};
