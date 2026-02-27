import Payment from '../models/Payment.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import ServiceRequest from '../models/ServiceRequest.js';
import { generateInvoicePDF } from '../services/invoiceService.js';
import { AppError } from '../utils/AppError.js';

/**
 * @route   GET /api/v1/payments/:id/invoice
 * @desc    Download a PDF invoice for a completed payment
 * @access  Private (client owner or admin)
 */
export const downloadInvoice = async (req, res, next) => {
    try {
        const payment = await Payment.findById(req.params.id)
            .populate('clientId', 'name email')
            .populate('projectId', 'title');

        if (!payment) {
            throw AppError.notFound('Payment not found');
        }

        // Only owner or admin can download
        const isOwner = payment.clientId?._id?.toString() === req.user._id.toString();
        if (!isOwner && req.user.role !== 'admin') {
            throw AppError.forbidden('Not authorized to download this invoice');
        }

        const pdfBuffer = await generateInvoicePDF(payment);

        const invoiceNumber = (payment.razorpayPaymentId || payment._id)
            .toString().slice(-8).toUpperCase();

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="SkyWorld-Invoice-${invoiceNumber}.pdf"`,
            'Content-Length': pdfBuffer.length,
        });

        res.send(pdfBuffer);
    } catch (error) {
        next(error);
    }
};

/**
 * @route   GET /api/v1/admin/analytics
 * @desc    Advanced analytics dashboard data
 * @access  Admin only
 */
export const getAnalytics = async (req, res, next) => {
    try {
        const { period = '30d' } = req.query;

        // Calculate date range
        const days = period === '7d' ? 7 : period === '90d' ? 90 : period === '1y' ? 365 : 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Run all aggregations in parallel
        const [
            revenueByMonth,
            userGrowth,
            projectsByStatus,
            requestsByStatus,
            topServices,
            paymentSummary,
            totalCounts,
        ] = await Promise.all([
            // Revenue trend (monthly)
            Payment.aggregate([
                { $match: { status: 'completed', createdAt: { $gte: startDate } } },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' },
                        },
                        revenue: { $sum: '$amount' },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } },
            ]),

            // User signups over time
            User.aggregate([
                { $match: { createdAt: { $gte: startDate } } },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' },
                            day: { $dayOfMonth: '$createdAt' },
                        },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
            ]),

            // Projects by status
            Project.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                    },
                },
            ]),

            // Requests by status
            ServiceRequest.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                    },
                },
            ]),

            // Top services by request count
            ServiceRequest.aggregate([
                {
                    $lookup: {
                        from: 'services',
                        localField: 'serviceId',
                        foreignField: '_id',
                        as: 'service',
                    },
                },
                { $unwind: { path: '$service', preserveNullAndEmptyArrays: true } },
                {
                    $group: {
                        _id: '$serviceId',
                        name: { $first: '$service.name' },
                        count: { $sum: 1 },
                        totalBudget: { $sum: '$budget' },
                    },
                },
                { $sort: { count: -1 } },
                { $limit: 5 },
            ]),

            // Payment summary
            Payment.aggregate([
                {
                    $group: {
                        _id: '$status',
                        total: { $sum: '$amount' },
                        count: { $sum: 1 },
                    },
                },
            ]),

            // Total counts
            Promise.all([
                User.countDocuments(),
                User.countDocuments({ createdAt: { $gte: startDate } }),
                Project.countDocuments(),
                Payment.countDocuments({ status: 'completed' }),
                Payment.aggregate([
                    { $match: { status: 'completed' } },
                    { $group: { _id: null, total: { $sum: '$amount' } } },
                ]),
            ]),
        ]);

        // Format total counts
        const [totalUsers, newUsers, totalProjects, completedPayments, totalRevenueAgg] = totalCounts;
        const totalRevenue = totalRevenueAgg[0]?.total || 0;

        res.json({
            success: true,
            data: {
                overview: {
                    totalUsers,
                    newUsers,
                    totalProjects,
                    completedPayments,
                    totalRevenue,
                },
                revenueByMonth: revenueByMonth.map(r => ({
                    month: `${r._id.year}-${String(r._id.month).padStart(2, '0')}`,
                    revenue: r.revenue,
                    count: r.count,
                })),
                userGrowth: userGrowth.map(u => ({
                    date: `${u._id.year}-${String(u._id.month).padStart(2, '0')}-${String(u._id.day).padStart(2, '0')}`,
                    count: u.count,
                })),
                projectsByStatus: Object.fromEntries(projectsByStatus.map(p => [p._id, p.count])),
                requestsByStatus: Object.fromEntries(requestsByStatus.map(r => [r._id, r.count])),
                topServices,
                paymentSummary: Object.fromEntries(paymentSummary.map(p => [p._id, { total: p.total, count: p.count }])),
            },
            meta: { period, startDate, endDate: new Date() },
        });
    } catch (error) {
        next(error);
    }
};
