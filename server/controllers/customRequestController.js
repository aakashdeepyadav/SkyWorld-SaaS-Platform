import CustomRequest from '../models/CustomRequest.js';
import { CUSTOM_REQUEST_STATUS, ROLES } from '../utils/constants.js';
import { uploadToCloudinary, getCloudinaryErrorResponse } from '../services/cloudinaryService.js';
import { createAuditLog } from '../middleware/auth.js';

export const getCustomRequests = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};

    if (req.user.role === ROLES.CLIENT) {
      query.clientId = req.user._id;
    }

    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const requests = await CustomRequest.find(query)
      .populate('clientId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await CustomRequest.countDocuments(query);

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

export const getCustomRequest = async (req, res, next) => {
  try {
    const request = await CustomRequest.findById(req.params.id)
      .populate('clientId', 'name email');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Custom request not found'
      });
    }

    if (req.user.role === ROLES.CLIENT && request.clientId.toString() !== req.user._id.toString()) {
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

export const createCustomRequest = async (req, res, next) => {
  try {
    const {
      serviceType,
      fullName,
      email,
      phone,
      businessName,
      projectDescription,
      requiredFeatures,
      deadline,
      budgetRange
    } = req.body;

    let fileData = {};
    if (req.file) {
      let uploadResult;
      try {
        uploadResult = await uploadToCloudinary(req.file.buffer, {
          folder: 'skyworld/custom-requests',
          resourceType: 'auto',
          mimetype: req.file.mimetype,
          originalName: req.file.originalname
        });
      } catch (cloudinaryError) {
        const { statusCode, message } = getCloudinaryErrorResponse(cloudinaryError);
        return res.status(statusCode).json({
          success: false,
          message
        });
      }
      fileData = {
        fileUrl: uploadResult.url,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size
      };
    }

    const request = await CustomRequest.create({
      clientId: req.user._id,
      serviceType,
      fullName,
      email,
      phone,
      businessName,
      projectDescription,
      requiredFeatures,
      deadline,
      budgetRange,
      ...fileData
    });

    await createAuditLog(req, 'custom_request_created', 'customRequest', request._id);

    res.status(201).json({
      success: true,
      message: 'Custom request submitted',
      request
    });
  } catch (error) {
    next(error);
  }
};

export const updateCustomRequest = async (req, res, next) => {
  try {
    const { status, quotedPrice } = req.body;
    const request = await CustomRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Custom request not found'
      });
    }

    const updateData = {};

    if (quotedPrice !== undefined) {
      updateData.quotedPrice = quotedPrice;
      updateData.status = CUSTOM_REQUEST_STATUS.QUOTED;
      updateData.quotedAt = new Date();
    }

    if (status) {
      updateData.status = status;
      if (status === CUSTOM_REQUEST_STATUS.APPROVED) {
        updateData.approvedAt = new Date();
      }
    }

    const updatedRequest = await CustomRequest.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    await createAuditLog(req, 'custom_request_updated', 'customRequest', updatedRequest._id, { updates: updateData });

    res.json({
      success: true,
      message: 'Custom request updated',
      request: updatedRequest
    });
  } catch (error) {
    next(error);
  }
};
