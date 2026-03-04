import Service from '../models/Service.js';
import { createAuditLog } from '../middleware/auth.js';
import { SERVICE_CATEGORIES } from '../utils/constants.js';
import { logger } from '../utils/logger.js';

const DEFAULT_SERVICES = [
  {
    name: 'Web Development',
    description: 'Professional websites that bring customers to your door.',
    category: SERVICE_CATEGORIES.WEB_DEVELOPMENT,
    basePrice: 3999,
    isActive: true
  },
  {
    name: 'App Development',
    description: 'Take your business mobile with apps customers love to use.',
    category: SERVICE_CATEGORIES.APP_DEVELOPMENT,
    basePrice: 18999,
    isActive: true
  },
  {
    name: 'Branding & Design',
    description: 'Stand out with a professional identity your customers remember.',
    category: SERVICE_CATEGORIES.BRANDING_CREATIVE,
    basePrice: 2499,
    isActive: true
  }
];

const ensureActiveServices = async () => {
  const activeCount = await Service.countDocuments({ isActive: true });
  if (activeCount > 0) return;

  const defaultNames = DEFAULT_SERVICES.map((service) => service.name);
  try {
    await Service.insertMany(DEFAULT_SERVICES, { ordered: false });
  } catch (error) {
    const duplicateOnly =
      error?.code === 11000 ||
      (Array.isArray(error?.writeErrors) && error.writeErrors.every((entry) => entry?.code === 11000));
    if (!duplicateOnly) throw error;
  }

  await Service.updateMany(
    { name: { $in: defaultNames } },
    { $set: { isActive: true } }
  );

  logger.warn('No active services were found. Default services were initialized or reactivated.');
};

/**
 * @route   GET /api/services
 * @desc    Get all services
 * @access  Public
 */
export const getServices = async (req, res, next) => {
  try {
    await ensureActiveServices();

    const { category, isActive = 'true' } = req.query;
    const query = {};

    // Allow admin to fetch all services with isActive=all
    if (isActive !== 'all') {
      query.isActive = isActive === 'true' || isActive === true;
    }

    if (category) query.category = category;

    const services = await Service.find(query).sort({ isActive: -1, name: 1 });

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
    const { name, description, features, pricing, category, isActive, icon, image } = req.body;
    const service = await Service.create({
      name, description, features, pricing, category, isActive, icon, image
    });

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
    const allowedFields = ['name', 'description', 'features', 'pricing', 'category', 'isActive', 'icon', 'image'];
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const service = await Service.findByIdAndUpdate(
      req.params.id,
      updates,
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

