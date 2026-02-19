import Message from '../models/Message.js';
import Project from '../models/Project.js';
import { ROLES } from '../utils/constants.js';
import { createAuditLog } from '../middleware/auth.js';

/**
 * @route   GET /api/messages
 * @desc    Get messages for a project
 * @access  Private
 */
export const getMessages = async (req, res, next) => {
  try {
    const { projectId, page = 1, limit = 50 } = req.query;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }

    // Verify user has access to project
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

    const messages = await Message.find({ projectId })
      .populate('senderId', 'name email avatar')
      .populate('recipientId', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Message.countDocuments({ projectId });

    res.json({
      success: true,
      count: messages.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      messages: messages.reverse() // Return in chronological order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/messages
 * @desc    Create message
 * @access  Private
 */
export const createMessage = async (req, res, next) => {
  try {
    const { projectId, content, recipientId, attachments } = req.body;

    // Verify user has access to project
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

    const message = await Message.create({
      projectId,
      senderId: req.user._id,
      recipientId,
      content,
      attachments: attachments || []
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'name email avatar')
      .populate('recipientId', 'name email avatar');

    await createAuditLog(req, 'message_created', 'message', message._id, { projectId });

    res.status(201).json({
      success: true,
      message: populatedMessage
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/messages/:id/read
 * @desc    Mark message as read
 * @access  Private
 */
export const markAsRead = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is recipient
    if (message.recipientId && message.recipientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (!message.isRead) {
      message.isRead = true;
      message.readAt = new Date();
      await message.save();
    }

    res.json({
      success: true,
      message: 'Message marked as read'
    });
  } catch (error) {
    next(error);
  }
};

