import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: [
                'request_status',     // Service request approved / rejected
                'project_update',     // Project status / milestone change
                'payment_received',   // Payment completed
                'message_received',   // New message in project
                'developer_assigned', // Developer assigned to project
                'custom_request',     // Custom request quoted / approved
                'system',             // Platform announcements
            ],
            required: true,
        },
        title: {
            type: String,
            required: true,
            maxlength: 200,
        },
        message: {
            type: String,
            required: true,
            maxlength: 500,
        },
        link: {
            type: String,         // Frontend route, e.g. "/projects/abc123"
            default: null,
        },
        read: {
            type: Boolean,
            default: false,
            index: true,
        },
        readAt: {
            type: Date,
            default: null,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for fetching user notifications sorted by newest
notificationSchema.index({ userId: 1, createdAt: -1 });

// Auto-delete notifications older than 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default mongoose.model('Notification', notificationSchema);
