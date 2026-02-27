import Notification from '../models/Notification.js';
import { emitToUser } from '../socket.js';
import { logger } from '../utils/logger.js';

/**
 * Create a notification and push it in real-time via Socket.IO.
 *
 * @param {object} opts
 * @param {string} opts.userId   — Recipient user ID
 * @param {string} opts.type     — Notification type enum
 * @param {string} opts.title    — Short headline
 * @param {string} opts.message  — Description body
 * @param {string} [opts.link]   — Frontend route to navigate to
 * @param {object} [opts.metadata] — Additional data
 */
export async function createNotification({ userId, type, title, message, link = null, metadata = {} }) {
    try {
        const notification = await Notification.create({
            userId,
            type,
            title,
            message,
            link,
            metadata,
        });

        // Push via Socket.IO to user's room (all connected devices)
        emitToUser(userId.toString(), 'notification:new', {
            _id: notification._id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            link: notification.link,
            read: false,
            createdAt: notification.createdAt,
        });

        return notification;
    } catch (error) {
        logger.error('Failed to create notification:', error);
        // Don't throw — notification failures shouldn't break business logic
        return null;
    }
}
