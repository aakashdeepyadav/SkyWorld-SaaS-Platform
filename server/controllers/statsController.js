import User from '../models/User.js';
import Project from '../models/Project.js';
import ServiceRequest from '../models/ServiceRequest.js';
import CustomRequest from '../models/CustomRequest.js';
import Payment from '../models/Payment.js';
import { PAYMENT_STATUS } from '../utils/constants.js';

/**
 * @route   GET /api/admin/stats
 * @desc    Get aggregated platform statistics
 * @access  Private/Admin
 */
export const getAdminStats = async (req, res, next) => {
    try {
        const [
            totalUsers,
            totalProjects,
            totalRequests,
            pendingRequests,
            totalCustomRequests,
            pendingCustomRequests,
            recentUsers,
            recentProjects,
            revenueAgg
        ] = await Promise.all([
            User.countDocuments(),
            Project.countDocuments(),
            ServiceRequest.countDocuments(),
            ServiceRequest.countDocuments({ status: 'pending' }),
            CustomRequest.countDocuments(),
            CustomRequest.countDocuments({ status: 'pending' }),
            User.find()
                .select('-password')
                .sort({ createdAt: -1 })
                .limit(5)
                .lean(),
            Project.find()
                .populate('clientId', 'name email')
                .sort({ createdAt: -1 })
                .limit(5)
                .lean(),
            Payment.aggregate([
                { $match: { status: PAYMENT_STATUS.COMPLETED } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ])
        ]);

        const totalRevenue = revenueAgg[0]?.total || 0;

        res.json({
            success: true,
            stats: {
                totalUsers,
                totalProjects,
                totalRequests,
                pendingRequests,
                totalCustomRequests,
                pendingCustomRequests,
                totalRevenue,
                recentUsers,
                recentProjects
            }
        });
    } catch (error) {
        next(error);
    }
};
