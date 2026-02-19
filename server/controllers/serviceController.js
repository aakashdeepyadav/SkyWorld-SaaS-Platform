import Service from '../models/Service.js';
import { createAuditLog } from '../middleware/auth.js';

/**
 * @route   GET /api/services
 * @desc    Get all services
 * @access  Public
 */
export const getServices = async (req, res, next) => {
  try {
    const { category, isActive = true } = req.query;
    const query = { isActive: isActive === 'true' || isActive === true };

    if (category) query.category = category;

    const services = await Service.find(query).sort({ name: 1 });

    res.json({
      success: true,
      count: services.length,
      services
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/services/:id
 * @desc    Get service by ID
 * @access  Public
 */
export const getService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.json({
      success: true,
      service
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/services
 * @desc    Create service (Admin only)
 * @access  Private/Admin
 */
export const createService = async (req, res, next) => {
  try {
    const service = await Service.create(req.body);

    await createAuditLog(req, 'service_created', 'service', service._id);

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      service
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/services/:id
 * @desc    Update service (Admin only)
 * @access  Private/Admin
 */
export const updateService = async (req, res, next) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    await createAuditLog(req, 'service_updated', 'service', service._id);

    res.json({
      success: true,
      message: 'Service updated successfully',
      service
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/services/:id
 * @desc    Delete service (Admin only)
 * @access  Private/Admin
 */
export const deleteService = async (req, res, next) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    await createAuditLog(req, 'service_deleted', 'service', service._id);

    res.json({
      success: true,
      message: 'Service deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
};

