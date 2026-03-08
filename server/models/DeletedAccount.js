import mongoose from 'mongoose';

/**
 * DeletedAccount — archive of permanently deleted user accounts.
 *
 * After the 7-day grace period, the nightly cron snapshots the user record
 * and all related data here, then hard-deletes from the main collections.
 * This data is kept for internal records and is NOT recoverable by the user.
 */
const deletedAccountSchema = new mongoose.Schema({
    originalUserId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        index: true
    },
    deletedAt: {
        type: Date,
        default: Date.now
    },

    // ─── Snapshots ─────────────────────────────────────────────────────────
    userData: { type: mongoose.Schema.Types.Mixed, default: {} },
    projects: { type: [mongoose.Schema.Types.Mixed], default: [] },
    payments: { type: [mongoose.Schema.Types.Mixed], default: [] },
    serviceRequests: { type: [mongoose.Schema.Types.Mixed], default: [] },
    customRequests: { type: [mongoose.Schema.Types.Mixed], default: [] },
    bookings: { type: [mongoose.Schema.Types.Mixed], default: [] },
    messages: { type: [mongoose.Schema.Types.Mixed], default: [] },
    files: { type: [mongoose.Schema.Types.Mixed], default: [] },
    notifications: { type: [mongoose.Schema.Types.Mixed], default: [] }
}, {
    timestamps: true
});

const DeletedAccount = mongoose.model('DeletedAccount', deletedAccountSchema);

export default DeletedAccount;
