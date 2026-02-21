import crypto from 'crypto';
import Razorpay from 'razorpay';
import Payment from '../models/Payment.js';
import Project from '../models/Project.js';
import ServiceRequest from '../models/ServiceRequest.js';
import CustomRequest from '../models/CustomRequest.js';
import { CUSTOM_REQUEST_STATUS, DELIVERY_STATUS, PAYMENT_STATUS, PROJECT_STATUS, ROLES, SERVICE_CATEGORIES } from '../utils/constants.js';
import { createAuditLog } from '../middleware/auth.js';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const getSignature = (orderId, paymentId) => {
  return crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
};

const isSignatureValid = (expected, provided) => {
  if (!expected || !provided) return false;
  if (expected.length !== provided.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
};

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
      .populate('customRequestId', 'serviceType fullName')
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

export const createRazorpayOrder = async (req, res, next) => {
  try {
    const { projectId, serviceRequestId, customRequestId, serviceType, plan, amount, currency } = req.body;

    let project = null;
    let serviceRequest = null;
    let customRequest = null;
    let resolvedServiceType = serviceType;
    let resolvedPlan = plan;

    if (projectId) {
      project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }
      if (req.user.role === ROLES.CLIENT && project.clientId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    if (serviceRequestId) {
      serviceRequest = await ServiceRequest.findById(serviceRequestId);
      if (!serviceRequest) {
        return res.status(404).json({
          success: false,
          message: 'Service request not found'
        });
      }
      if (req.user.role === ROLES.CLIENT && serviceRequest.clientId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    if (customRequestId) {
      customRequest = await CustomRequest.findById(customRequestId);
      if (!customRequest) {
        return res.status(404).json({
          success: false,
          message: 'Custom request not found'
        });
      }
      if (req.user.role === ROLES.CLIENT && customRequest.clientId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      if (customRequest.status !== CUSTOM_REQUEST_STATUS.QUOTED || !customRequest.quotedPrice) {
        return res.status(400).json({
          success: false,
          message: 'Custom request is not ready for payment'
        });
      }
      resolvedServiceType = customRequest.serviceType;
      resolvedPlan = 'custom';
    }

    const starterPrices = {
      [SERVICE_CATEGORIES.WEB_DEVELOPMENT]: 1499,
      [SERVICE_CATEGORIES.APP_DEVELOPMENT]: 2999,
      [SERVICE_CATEGORIES.BRANDING_CREATIVE]: 799
    };

    let derivedAmount = amount ?? project?.budget ?? serviceRequest?.estimatedPrice;
    if (resolvedPlan === 'starter' && resolvedServiceType) {
      derivedAmount = starterPrices[resolvedServiceType];
    } else if (customRequest) {
      derivedAmount = customRequest.quotedPrice;
    }

    const normalizedAmount = Number(derivedAmount);

    if (!normalizedAmount || Number.isNaN(normalizedAmount) || normalizedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    const normalizedCurrency = (currency || 'INR').toUpperCase();

    const payment = await Payment.create({
      clientId: project?.clientId || serviceRequest?.clientId || req.user._id,
      projectId,
      serviceRequestId,
      customRequestId,
      serviceType: resolvedServiceType,
      plan: resolvedPlan,
      amount: normalizedAmount,
      currency: normalizedCurrency,
      paymentMethod: 'razorpay',
      status: PAYMENT_STATUS.PROCESSING
    });

    const order = await razorpay.orders.create({
      amount: Math.round(normalizedAmount * 100),
      currency: normalizedCurrency,
      receipt: payment._id.toString(),
      notes: {
        paymentId: payment._id.toString(),
        projectId: projectId || '',
        serviceRequestId: serviceRequestId || '',
        customRequestId: customRequestId || '',
        serviceType: resolvedServiceType || '',
        plan: resolvedPlan || ''
      }
    });

    payment.razorpayOrderId = order.id;
    await payment.save();

    await createAuditLog(req, 'payment_created', 'payment', payment._id, { amount: normalizedAmount });

    res.status(201).json({
      success: true,
      order,
      keyId: process.env.RAZORPAY_KEY_ID,
      payment
    });
  } catch (error) {
    next(error);
  }
};

export const verifyRazorpayPayment = async (req, res, next) => {
  try {
    const { paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!paymentId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment verification data'
      });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (req.user.role === ROLES.CLIENT && payment.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const expectedSignature = getSignature(razorpayOrderId, razorpayPaymentId);
    const verified = isSignatureValid(expectedSignature, razorpaySignature);

    payment.razorpayOrderId = razorpayOrderId;
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.transactionId = razorpayPaymentId;
    payment.paymentMethod = 'razorpay';
    payment.status = verified ? PAYMENT_STATUS.COMPLETED : PAYMENT_STATUS.FAILED;
    if (verified) {
      payment.paidAt = new Date();
    }
    await payment.save();

    await createAuditLog(req, 'payment_status_updated', 'payment', payment._id, { status: payment.status, updatedBy: req.user._id });

    if (!verified) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    if (verified) {
      let projectIdToAttach = payment.projectId;

      if (!projectIdToAttach && payment.serviceRequestId) {
        const serviceRequest = await ServiceRequest.findById(payment.serviceRequestId);
        if (serviceRequest) {
          const existingProject = await Project.findOne({ serviceRequestId: serviceRequest._id });
          if (existingProject) {
            projectIdToAttach = existingProject._id;
          } else {
            const project = await Project.create({
              serviceRequestId: serviceRequest._id,
              title: serviceRequest.title,
              description: serviceRequest.description,
              clientId: serviceRequest.clientId,
              status: PROJECT_STATUS.PLANNING,
              deliveryStatus: DELIVERY_STATUS.PENDING,
              paymentStatus: PAYMENT_STATUS.COMPLETED,
              serviceType: payment.serviceType,
              plan: payment.plan,
              budget: payment.amount
            });
            projectIdToAttach = project._id;
          }
        }
      }

      if (!projectIdToAttach && payment.customRequestId) {
        const customRequest = await CustomRequest.findById(payment.customRequestId);
        if (customRequest) {
          const existingProject = await Project.findOne({ customRequestId: customRequest._id });
          if (existingProject) {
            projectIdToAttach = existingProject._id;
          } else {
            const project = await Project.create({
              customRequestId: customRequest._id,
              title: `${customRequest.serviceType.replace('-', ' ')} custom project`,
              description: customRequest.projectDescription,
              clientId: customRequest.clientId,
              status: PROJECT_STATUS.PLANNING,
              deliveryStatus: DELIVERY_STATUS.PENDING,
              paymentStatus: PAYMENT_STATUS.COMPLETED,
              serviceType: customRequest.serviceType,
              plan: 'custom',
              budget: payment.amount
            });
            projectIdToAttach = project._id;
            await CustomRequest.findByIdAndUpdate(customRequest._id, {
              status: CUSTOM_REQUEST_STATUS.APPROVED,
              approvedAt: new Date()
            });
          }
        }
      }

      if (!projectIdToAttach && payment.serviceType && payment.plan === 'starter') {
        const title = `${payment.serviceType.replace('-', ' ')} starter plan`;
        const project = await Project.create({
          title,
          description: 'Starter plan purchase',
          clientId: payment.clientId,
          status: PROJECT_STATUS.PLANNING,
          deliveryStatus: DELIVERY_STATUS.PENDING,
          paymentStatus: PAYMENT_STATUS.COMPLETED,
          serviceType: payment.serviceType,
          plan: payment.plan,
          budget: payment.amount
        });
        projectIdToAttach = project._id;
      }

      if (projectIdToAttach) {
        payment.projectId = projectIdToAttach;
        await payment.save();
        await Project.findByIdAndUpdate(projectIdToAttach, { paymentStatus: PAYMENT_STATUS.COMPLETED });
      }
    }

    res.json({
      success: true,
      message: 'Payment verified',
      payment
    });
  } catch (error) {
    next(error);
  }
};

export const razorpayWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
      return res.status(400).json({
        success: false,
        message: 'Webhook secret not configured'
      });
    }

    const rawBody = req.rawBody;
    if (!rawBody) {
      return res.status(400).json({
        success: false,
        message: 'Webhook body unavailable'
      });
    }

    const payload = typeof req.body === 'string'
      ? JSON.parse(req.body)
      : req.body;

    const expectedSignature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    if (!isSignatureValid(expectedSignature, signature)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }

    const event = payload?.event;
    const paymentEntity = payload?.payload?.payment?.entity;

    if (paymentEntity) {
      const update = {
        razorpayOrderId: paymentEntity.order_id,
        razorpayPaymentId: paymentEntity.id,
        transactionId: paymentEntity.id,
        paymentMethod: 'razorpay'
      };

      if (event === 'payment.captured') {
        update.status = PAYMENT_STATUS.COMPLETED;
        update.paidAt = new Date();
      } else if (event === 'payment.failed') {
        update.status = PAYMENT_STATUS.FAILED;
      }

      if (update.status) {
        await Payment.findOneAndUpdate({ razorpayOrderId: paymentEntity.order_id }, update, { new: true });
      }
    }

    res.json({ success: true });
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
