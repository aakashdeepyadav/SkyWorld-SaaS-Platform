import Notification from '../models/Notification.js';

/**
 * @route   GET /api/v1/notifications
 * @desc    Get current user's notifications
 * @access  Private
 */
export const getNotifications = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
        const { unreadOnly } = req.query;
        const query = { userId: req.user._id };

        if (unreadOnly === 'true') {
            query.read = false;
        }

        const skip = (page - 1) * limit;

        const [notifications, total, unreadCount] = await Promise.all([
            Notification.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Notification.countDocuments(query),
            Notification.countDocuments({ userId: req.user._id, read: false }),
        ]);

        res.json({
            success: true,
            notifications,
            unreadCount,
            meta: {
                page,
                limit,
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   PUT /api/v1/notifications/:id/read
 * @desc    Mark a single notification as read
 * @access  Private
 */
export const markAsRead = async (req, res, next) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { read: true, readAt: new Date() },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        res.json({ success: true, notification });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   PUT /api/v1/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
export const markAllAsRead = async (req, res, next) => {
    try {
        const result = await Notification.updateMany(
            { userId: req.user._id, read: false },
            { read: true, readAt: new Date() }
        );

        res.json({
            success: true,
            message: `${result.modifiedCount} notifications marked as read`,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   DELETE /api/v1/notifications/:id
 * @desc    Delete a notification
 * @access  Private
 */
export const deleteNotification = async (req, res, next) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   GET /api/v1/notifications/unread-count
 * @desc    Get unread notification count (lightweight endpoint for polling fallback)
 * @access  Private
 */
export const getUnreadCount = async (req, res, next) => {
    try {
        const count = await Notification.countDocuments({
            userId: req.user._id,
            read: false,
        });

        res.json({ success: true, unreadCount: count });
    } catch (error) {
        next(error);
    }
};
