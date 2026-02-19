import Payment from '../models/Payment.js';
import { ROLES, PAYMENT_STATUS } from '../utils/constants.js';
import { createAuditLog } from '../middleware/auth.js';

/**
 * @route   GET /api/payments
 * @desc    Get payments
 * @access  Private
 */
export const getPayments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};

    // Role-based filtering
    if (req.user.role === ROLES.CLIENT) {
      query.clientId = req.user._id;
    }
    // Admin and Developer see all

    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const payments = await Payment.find(query)
      .populate('clientId', 'name email')
      .populate('projectId', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      count: payments.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      payments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/payments/:id
 * @desc    Get payment by ID
 * @access  Private
 */
export const getPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('clientId', 'name email')
      .populate('projectId', 'title')
      .populate('serviceRequestId', 'title');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check access
    if (req.user.role === ROLES.CLIENT && payment.clientId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      payment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/payments
 * @desc    Create payment (Client only)
 * @access  Private/Client
 */
export const createPayment = async (req, res, next) => {
  try {
    const { projectId, serviceRequestId, amount, paymentMethod } = req.body;

    // TODO: Integrate with Stripe
    // For now, create payment record
    const payment = await Payment.create({
      clientId: req.user._id,
      projectId,
      serviceRequestId,
      amount,
      paymentMethod: paymentMethod || 'card',
      status: PAYMENT_STATUS.PENDING
    });

    const populatedPayment = await Payment.findById(payment._id)
      .populate('clientId', 'name email')
      .populate('projectId', 'title');

    await createAuditLog(req, 'payment_created', 'payment', payment._id, { amount });

    res.status(201).json({
      success: true,
      message: 'Payment initiated',
      payment: populatedPayment,
      // TODO: Return Stripe client secret for payment confirmation
      clientSecret: null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/payments/:id/status
 * @desc    Update payment status (Admin only or webhook)
 * @access  Private/Admin
 */
export const updatePaymentStatus = async (req, res, next) => {
  try {
    const { status, transactionId, stripePaymentIntentId } = req.body;

    const updateData = { status };
    if (transactionId) updateData.transactionId = transactionId;
    if (stripePaymentIntentId) updateData.stripePaymentIntentId = stripePaymentIntentId;
    if (status === PAYMENT_STATUS.COMPLETED) {
      updateData.paidAt = new Date();
    }

    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    await createAuditLog(req, 'payment_status_updated', 'payment', payment._id, { status, updatedBy: req.user._id });

    res.json({
      success: true,
      message: 'Payment status updated',
      payment
    });
  } catch (error) {
    next(error);
  }
};

