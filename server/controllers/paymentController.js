import crypto from 'crypto';
import Razorpay from 'razorpay';
import Payment from '../models/Payment.js';
import Project from '../models/Project.js';
import ServiceRequest from '../models/ServiceRequest.js';
import CustomRequest from '../models/CustomRequest.js';
import Service from '../models/Service.js';
import { CUSTOM_REQUEST_STATUS, DELIVERY_STATUS, FULL_PAYMENT_TYPES, PAYMENT_PHASE, PAYMENT_STATUS, PLAN_PRICES, PROJECT_STATUS, ROLES, VIRTUAL_SERVICE_TYPES } from '../utils/constants.js';
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

const isMongoObjectId = (value) => typeof value === 'string' && /^[a-fA-F0-9]{24}$/.test(value);

const sanitizeProjectRefs = (payload) => {
  const sanitized = { ...payload };
  if (sanitized.serviceRequestId == null) delete sanitized.serviceRequestId;
  if (sanitized.customRequestId == null) delete sanitized.customRequestId;
  return sanitized;
};

const isServiceRequestDuplicateError = (error) => {
  if (!error || error.code !== 11000) return false;
  if (error?.keyPattern?.serviceRequestId) return true;
  if (Object.prototype.hasOwnProperty.call(error?.keyValue ?? {}, 'serviceRequestId')) return true;
  return /serviceRequestId/i.test(error?.message || '');
};

/**
 * @route   GET /api/payments
 * @desc    Get payments
 * @access  Private
 */
export const getPayments = async (req, res, next) => {
  try {
    const { status, projectId, page = 1, limit = 10 } = req.query;
    const query = {};

    // Role-based filtering
    if (req.user.role === ROLES.CLIENT) {
      query.clientId = req.user._id;
    }
    // Admin and Developer see all

    if (status) query.status = status;
    if (projectId && isMongoObjectId(projectId)) query.projectId = projectId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const payments = await Payment.find(query)
      .populate('clientId', 'name email userCode')
      .populate('projectId', 'title projectCode')
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
      .populate('clientId', 'name email userCode')
      .populate('projectId', 'title projectCode')
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
    const { projectId, serviceRequestId, customRequestId, serviceType, serviceId, plan, amount, currency } = req.body;

    let project = null;
    let serviceRequest = null;
    let customRequest = null;
    let starterService = null;
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

    let derivedAmount = amount ?? project?.budget ?? serviceRequest?.estimatedPrice;
    if (resolvedPlan && resolvedPlan !== 'custom' && !resolvedServiceType) {
      return res.status(400).json({
        success: false,
        message: 'Service selection is required for plan checkout'
      });
    }

    // ── Plan price validation (covers all tiers, not just 'starter') ──
    if (resolvedPlan && resolvedPlan !== 'custom' && resolvedServiceType) {
      const categoryPrices = PLAN_PRICES[resolvedServiceType];
      if (!categoryPrices || categoryPrices[resolvedPlan] === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Invalid plan for selected service category'
        });
      }

      // Virtual service types (combo, monthly, addon) have no Service document in DB
      const isVirtual = VIRTUAL_SERVICE_TYPES.includes(resolvedServiceType);

      if (!isVirtual) {
        // Verify the service category is active in DB
        if (serviceId) {
          if (!isMongoObjectId(serviceId)) {
            return res.status(400).json({
              success: false,
              message: 'Invalid service ID'
            });
          }
          starterService = await Service.findOne({
            _id: serviceId,
            isActive: true
          }).select('category basePrice offerPercent slug type');

          if (!starterService) {
            return res.status(404).json({
              success: false,
              message: 'Selected service is unavailable'
            });
          }

          if (resolvedServiceType && starterService.category !== resolvedServiceType) {
            return res.status(400).json({
              success: false,
              message: 'Service does not match selected category'
            });
          }

          resolvedServiceType = starterService.category;
        } else {
          // Look up plan by type + category + slug in expanded model
          starterService = await Service.findOne({
            type: 'plan',
            category: resolvedServiceType,
            slug: resolvedPlan,
            isActive: true
          }).select('category basePrice offerPercent slug type');

          // Fallback: any active service in category (backwards compat)
          if (!starterService) {
            starterService = await Service.findOne({
              category: resolvedServiceType,
              isActive: true
            })
              .sort({ updatedAt: -1, _id: -1 })
              .select('category basePrice offerPercent slug type');
          }

          if (!starterService) {
            return res.status(404).json({
              success: false,
              message: 'Selected service is unavailable'
            });
          }
        }
      } else {
        // Virtual types: look up by type + slug in expanded model
        const typeMap = { combo: 'combo', monthly: 'monthly', addon: 'addon' };
        const dbType = typeMap[resolvedServiceType] || resolvedServiceType;
        starterService = await Service.findOne({
          type: dbType,
          slug: resolvedPlan,
          isActive: true,
        }).select('basePrice offerPercent slug type');
      }

      // Use DB price with offer discount applied (falls back to PLAN_PRICES for safety)
      const dbBasePrice = starterService?.basePrice;
      const dbOffer = starterService?.offerPercent || 0;
      const dbDiscountedPrice = dbBasePrice != null && dbOffer > 0
        ? Math.round(dbBasePrice * (1 - dbOffer / 100))
        : dbBasePrice;
      derivedAmount = dbDiscountedPrice ?? categoryPrices[resolvedPlan];
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

    // ── Split payment: 50% advance for projects, full for monthly/addon ──
    const isCustom = resolvedPlan === 'custom';
    const isFullPaymentType = FULL_PAYMENT_TYPES.includes(resolvedServiceType);
    const paymentPhase = (isCustom || isFullPaymentType) ? PAYMENT_PHASE.FULL : PAYMENT_PHASE.ADVANCE;
    const chargeAmount = (isCustom || isFullPaymentType) ? normalizedAmount : Math.ceil(normalizedAmount / 2);

    const normalizedCurrency = (currency || 'INR').toUpperCase();

    const payment = await Payment.create({
      clientId: project?.clientId || serviceRequest?.clientId || req.user._id,
      projectId,
      serviceRequestId,
      customRequestId,
      serviceType: resolvedServiceType,
      plan: resolvedPlan,
      paymentPhase,
      totalPlanPrice: normalizedAmount,
      amount: chargeAmount,
      currency: normalizedCurrency,
      paymentMethod: 'razorpay',
      status: PAYMENT_STATUS.PROCESSING
    });

    const order = await razorpay.orders.create({
      amount: Math.round(chargeAmount * 100),
      currency: normalizedCurrency,
      receipt: payment._id.toString(),
      notes: {
        paymentId: payment._id.toString(),
        projectId: projectId || '',
        serviceRequestId: serviceRequestId || '',
        customRequestId: customRequestId || '',
        serviceId: serviceId || starterService?._id?.toString() || '',
        serviceType: resolvedServiceType || '',
        plan: resolvedPlan || '',
        paymentPhase
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
      const isAdvance = payment.paymentPhase === PAYMENT_PHASE.ADVANCE;
      const isFinal = payment.paymentPhase === PAYMENT_PHASE.FINAL;

      // ── Handle FINAL payment — project already exists ──
      if (isFinal && projectIdToAttach) {
        await Project.findByIdAndUpdate(projectIdToAttach, {
          finalPaid: true,
          paymentStatus: PAYMENT_STATUS.COMPLETED,
        });
        payment.projectId = projectIdToAttach;
        await payment.save();

        res.json({ success: true, message: 'Final payment verified', payment });
        return;
      }

      // ── Handle ADVANCE or FULL — create project if needed ──
      if (!projectIdToAttach && payment.serviceRequestId) {
        const serviceRequest = await ServiceRequest.findById(payment.serviceRequestId);
        if (serviceRequest) {
          const existingProject = await Project.findOne({ serviceRequestId: serviceRequest._id });
          if (existingProject) {
            projectIdToAttach = existingProject._id;
          } else {
            try {
              const project = await Project.create(sanitizeProjectRefs({
                serviceRequestId: serviceRequest._id,
                title: serviceRequest.title,
                description: serviceRequest.description,
                clientId: serviceRequest.clientId,
                status: PROJECT_STATUS.PLANNING,
                deliveryStatus: DELIVERY_STATUS.PENDING,
                paymentStatus: isAdvance ? PAYMENT_STATUS.PROCESSING : PAYMENT_STATUS.COMPLETED,
                serviceType: payment.serviceType,
                plan: payment.plan,
                totalPlanPrice: payment.totalPlanPrice || payment.amount,
                advancePaid: true,
                finalPaid: !isAdvance,
                budget: payment.totalPlanPrice || payment.amount
              }));
              projectIdToAttach = project._id;
            } catch (projectCreateError) {
              // Concurrent verification calls can race on unique serviceRequestId index.
              if (!isServiceRequestDuplicateError(projectCreateError)) {
                throw projectCreateError;
              }
              const duplicateProject = await Project.findOne({ serviceRequestId: serviceRequest._id });
              if (!duplicateProject) {
                throw projectCreateError;
              }
              projectIdToAttach = duplicateProject._id;
            }
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
            const project = await Project.create(sanitizeProjectRefs({
              customRequestId: customRequest._id,
              title: `${customRequest.serviceType.replace('-', ' ')} custom project`,
              description: customRequest.projectDescription,
              clientId: customRequest.clientId,
              status: PROJECT_STATUS.PLANNING,
              deliveryStatus: DELIVERY_STATUS.PENDING,
              paymentStatus: PAYMENT_STATUS.COMPLETED,
              serviceType: customRequest.serviceType,
              plan: 'custom',
              totalPlanPrice: payment.totalPlanPrice || payment.amount,
              advancePaid: true,
              finalPaid: true,
              budget: payment.totalPlanPrice || payment.amount
            }));
            projectIdToAttach = project._id;
            await CustomRequest.findByIdAndUpdate(customRequest._id, {
              status: CUSTOM_REQUEST_STATUS.APPROVED,
              approvedAt: new Date()
            });
          }
        }
      }

      if (!projectIdToAttach && payment.serviceType && payment.plan) {
        const planLabel = payment.plan.replace(/-/g, ' ');
        const svcLabel = payment.serviceType.replace(/-/g, ' ');
        const title = `${svcLabel} — ${planLabel} plan`;
        const project = await Project.create(sanitizeProjectRefs({
          title,
          description: `${planLabel} plan purchase`,
          clientId: payment.clientId,
          status: PROJECT_STATUS.PLANNING,
          deliveryStatus: DELIVERY_STATUS.PENDING,
          paymentStatus: isAdvance ? PAYMENT_STATUS.PROCESSING : PAYMENT_STATUS.COMPLETED,
          serviceType: payment.serviceType,
          plan: payment.plan,
          totalPlanPrice: payment.totalPlanPrice || payment.amount,
          advancePaid: true,
          finalPaid: !isAdvance,
          budget: payment.totalPlanPrice || payment.amount
        }));
        projectIdToAttach = project._id;
      }

      if (projectIdToAttach) {
        payment.projectId = projectIdToAttach;
        await payment.save();

        // If advance payment on existing project, mark advancePaid
        if (isAdvance) {
          await Project.findByIdAndUpdate(projectIdToAttach, {
            advancePaid: true,
            paymentStatus: PAYMENT_STATUS.PROCESSING, // awaiting final
          });
        } else {
          await Project.findByIdAndUpdate(projectIdToAttach, {
            advancePaid: true,
            finalPaid: true,
            paymentStatus: PAYMENT_STATUS.COMPLETED,
          });
        }
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
 * @route   POST /api/payments/razorpay/final-order
 * @desc    Create Razorpay order for the remaining 50 % (final payment)
 * @access  Private/Client
 */
export const createFinalPaymentOrder = async (req, res, next) => {
  try {
    const { projectId } = req.body;

    if (!projectId || !isMongoObjectId(projectId)) {
      return res.status(400).json({ success: false, message: 'Valid project ID is required' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (req.user.role === ROLES.CLIENT && project.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (!project.advancePaid) {
      return res.status(400).json({ success: false, message: 'Advance payment has not been completed yet' });
    }

    if (project.finalPaid) {
      return res.status(400).json({ success: false, message: 'Final payment has already been completed' });
    }

    // Calculate remaining amount (total - advance already paid)
    const advancePayment = await Payment.findOne({
      projectId: project._id,
      paymentPhase: PAYMENT_PHASE.ADVANCE,
      status: PAYMENT_STATUS.COMPLETED,
    });

    if (!advancePayment) {
      return res.status(400).json({ success: false, message: 'No completed advance payment found for this project' });
    }

    const totalPrice = project.totalPlanPrice || advancePayment.totalPlanPrice || (advancePayment.amount * 2);
    const finalAmount = totalPrice - advancePayment.amount;

    if (finalAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Nothing remaining to pay' });
    }

    const currency = advancePayment.currency || 'INR';

    const payment = await Payment.create({
      clientId: project.clientId,
      projectId: project._id,
      serviceType: project.serviceType,
      plan: project.plan,
      paymentPhase: PAYMENT_PHASE.FINAL,
      totalPlanPrice: totalPrice,
      amount: finalAmount,
      currency,
      paymentMethod: 'razorpay',
      status: PAYMENT_STATUS.PROCESSING,
    });

    const order = await razorpay.orders.create({
      amount: Math.round(finalAmount * 100),
      currency,
      receipt: payment._id.toString(),
      notes: {
        paymentId: payment._id.toString(),
        projectId: project._id.toString(),
        serviceType: project.serviceType || '',
        plan: project.plan || '',
        paymentPhase: PAYMENT_PHASE.FINAL,
      },
    });

    payment.razorpayOrderId = order.id;
    await payment.save();

    await createAuditLog(req, 'final_payment_created', 'payment', payment._id, { amount: finalAmount, projectId: project._id });

    res.status(201).json({
      success: true,
      order,
      keyId: process.env.RAZORPAY_KEY_ID,
      payment,
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
