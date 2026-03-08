import User from '../models/User.js';
import DeletedAccount from '../models/DeletedAccount.js';
import Project from '../models/Project.js';
import Payment from '../models/Payment.js';
import ServiceRequest from '../models/ServiceRequest.js';
import CustomRequest from '../models/CustomRequest.js';
import Booking from '../models/Booking.js';
import Message from '../models/Message.js';
import File from '../models/File.js';
import Notification from '../models/Notification.js';
import { logger } from '../utils/logger.js';

/**
 * Permanently archives and deletes user accounts whose 7-day grace period
 * has expired. Called by the nightly cron job in index.js.
 *
 * For each expired account:
 *   1. Snapshots the user and all related data into DeletedAccount
 *   2. Hard-deletes the user and related records from main collections
 *   3. AuditLogs & DocumentEmailLogs are kept for compliance
 */
export async function purgeExpiredAccounts() {
    const now = new Date();

    const expiredUsers = await User.find({
        isActive: false,
        scheduledDeletionAt: { $lte: now }
    }).select('+password +twoFactorSecret +twoFactorBackupCodes');

    if (expiredUsers.length === 0) {
        logger.info('[PURGE] No expired accounts to process');
        return;
    }

    logger.info(`[PURGE] Found ${expiredUsers.length} expired account(s) to archive & delete`);

    for (const user of expiredUsers) {
        const userId = user._id;

        try {
            // ── 1. Gather all related data ───────────────────────────────────────
            const [projects, payments, serviceRequests, customRequests, bookings, messages, files, notifications] =
                await Promise.all([
                    Project.find({ $or: [{ clientId: userId }, { developerIds: userId }] }).lean(),
                    Payment.find({ clientId: userId }).lean(),
                    ServiceRequest.find({ $or: [{ clientId: userId }, { assignedDeveloperId: userId }] }).lean(),
                    CustomRequest.find({ clientId: userId }).lean(),
                    Booking.find({ userId }).lean(),
                    Message.find({ $or: [{ senderId: userId }, { recipientId: userId }] }).lean(),
                    File.find({ uploadedBy: userId }).lean(),
                    Notification.find({ userId }).lean(),
                ]);

            // ── 2. Archive into DeletedAccount ───────────────────────────────────
            await DeletedAccount.create({
                originalUserId: userId,
                email: user.email,
                deletedAt: now,
                userData: user.toObject(),
                projects,
                payments,
                serviceRequests,
                customRequests,
                bookings,
                messages,
                files,
                notifications,
            });

            // ── 3. Hard-delete from main collections ─────────────────────────────
            await Promise.all([
                Project.deleteMany({ $or: [{ clientId: userId }, { developerIds: userId }] }),
                Payment.deleteMany({ clientId: userId }),
                ServiceRequest.deleteMany({ $or: [{ clientId: userId }, { assignedDeveloperId: userId }] }),
                CustomRequest.deleteMany({ clientId: userId }),
                Booking.deleteMany({ userId }),
                Message.deleteMany({ $or: [{ senderId: userId }, { recipientId: userId }] }),
                File.deleteMany({ uploadedBy: userId }),
                Notification.deleteMany({ userId }),
                User.deleteOne({ _id: userId }),
            ]);

            logger.info(`[PURGE] Archived & deleted user ${user.email} (${userId})`);
        } catch (err) {
            // Log but don't throw — continue with other users
            logger.error(`[PURGE] Failed to process user ${user.email} (${userId}):`, err.message);
        }
    }

    logger.info(`[PURGE] Finished processing ${expiredUsers.length} account(s)`);
}
