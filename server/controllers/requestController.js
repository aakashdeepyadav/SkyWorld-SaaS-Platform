import ServiceRequest from '../models/ServiceRequest.js';
import Project from '../models/Project.js';
import { ROLES, REQUEST_STATUS } from '../utils/constants.js';
import { createAuditLog } from '../middleware/auth.js';

/**
 * @route   GET /api/requests
 * @desc    Get service requests
 * @access  Private
 */
export const getRequests = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};

    // Role-based filtering
    if (req.user.role === ROLES.CLIENT) {
      query.clientId = req.user._id;
    } else if (req.user.role === ROLES.DEVELOPER) {
      query.assignedDeveloperId = req.user._id;
    }
    // Admin sees all

    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const requests = await ServiceRequest.find(query)
      .populate('clientId', 'name email avatar')
      .populate('serviceId', 'name category')
      .populate('assignedDeveloperId', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ServiceRequest.countDocuments(query);

    res.json({
      success: true,
      count: requests.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      requests
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/requests/:id
 * @desc    Get service request by ID
 * @access  Private
 */
export const getRequest = async (req, res, next) => {
  try {
    const request = await ServiceRequest.findById(req.params.id)
      .populate('clientId', 'name email avatar')
      .populate('serviceId', 'name category basePrice')
      .populate('assignedDeveloperId', 'name email avatar');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found'
      });
    }

    // Check access
    if (req.user.role === ROLES.CLIENT && request.clientId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (req.user.role === ROLES.DEVELOPER &&
      request.assignedDeveloperId?._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      request
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/requests
 * @desc    Create service request (Client only)
 * @access  Private/Client
 */
export const createRequest = async (req, res, next) => {
  try {
    const request = await ServiceRequest.create({
      ...req.body,
      clientId: req.user._id
    });

    const populatedRequest = await ServiceRequest.findById(request._id)
      .populate('clientId', 'name email')
      .populate('serviceId', 'name category');

    await createAuditLog(req, 'service_request_created', 'serviceRequest', request._id);

    res.status(201).json({
      success: true,
      message: 'Service request created successfully',
      request: populatedRequest
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/requests/:id/assign
 * @desc    Assign developer to request (Admin only)
 * @access  Private/Admin
 */
export const assignDeveloper = async (req, res, next) => {
  try {
    const { developerId, estimatedPrice } = req.body;

    // Fetch the existing request first
    const existingRequest = await ServiceRequest.findById(req.params.id);
    if (!existingRequest) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found'
      });
    }

    const request = await ServiceRequest.findByIdAndUpdate(
      req.params.id,
      {
        assignedDeveloperId: developerId,
        estimatedPrice: estimatedPrice || existingRequest.estimatedPrice,
        status: REQUEST_STATUS.APPROVED,
        approvedAt: new Date()
      },
      { new: true, runValidators: true }
    )
      .populate('assignedDeveloperId', 'name email')
      .populate('clientId', 'name email');

    await createAuditLog(req, 'developer_assigned', 'serviceRequest', request._id, { developerId });

    res.json({
      success: true,
      message: 'Developer assigned successfully',
      request
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/requests/:id/status
 * @desc    Update request status
 * @access  Private
 */
export const updateRequestStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const request = await ServiceRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found'
      });
    }

    // Check permissions
    if (req.user.role === ROLES.CLIENT && request.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const updateData = { status };
    if (status === REQUEST_STATUS.COMPLETED) {
      updateData.completedAt = new Date();
    }

    const updatedRequest = await ServiceRequest.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    await createAuditLog(req, 'request_status_updated', 'serviceRequest', updatedRequest._id, { status });

    res.json({
      success: true,
      message: 'Request status updated',
      request: updatedRequest
    });
  } catch (error) {
    next(error);
  }
};

