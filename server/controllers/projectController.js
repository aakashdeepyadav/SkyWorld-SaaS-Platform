import Project from '../models/Project.js';
import ServiceRequest from '../models/ServiceRequest.js';
import { ROLES, PROJECT_STATUS, REQUEST_STATUS } from '../utils/constants.js';
import { createAuditLog } from '../middleware/auth.js';

/**
 * @route   GET /api/projects
 * @desc    Get projects
 * @access  Private
 */
export const getProjects = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};

    // Role-based filtering
    if (req.user.role === ROLES.CLIENT) {
      query.clientId = req.user._id;
    } else if (req.user.role === ROLES.DEVELOPER) {
      query.developerIds = req.user._id;
    }
    // Admin sees all

    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const projects = await Project.find(query)
      .populate('clientId', 'name email avatar')
      .populate('developerIds', 'name email avatar')
      .populate('serviceRequestId', 'title description')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Project.countDocuments(query);

    res.json({
      success: true,
      count: projects.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      projects
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/projects/:id
 * @desc    Get project by ID
 * @access  Private
 */
export const getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('clientId', 'name email avatar')
      .populate('developerIds', 'name email avatar')
      .populate('serviceRequestId', 'title description requirements');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check access
    if (req.user.role === ROLES.CLIENT && project.clientId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (req.user.role === ROLES.DEVELOPER &&
      !project.developerIds.some(dev => dev._id.toString() === req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      project
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/projects
 * @desc    Create project from service request (Admin only)
 * @access  Private/Admin
 */
export const createProject = async (req, res, next) => {
  try {
    const { serviceRequestId, developerIds, startDate, endDate, budget } = req.body;

    // Check if service request exists and is approved
    const serviceRequest = await ServiceRequest.findById(serviceRequestId);
    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found'
      });
    }

    if (serviceRequest.status !== REQUEST_STATUS.APPROVED) {
      return res.status(400).json({
        success: false,
        message: 'Service request must be approved before creating a project'
      });
    }

    // Check if project already exists
    const existingProject = await Project.findOne({ serviceRequestId });
    if (existingProject) {
      return res.status(400).json({
        success: false,
        message: 'Project already exists for this service request'
      });
    }

    const project = await Project.create({
      serviceRequestId,
      title: serviceRequest.title,
      description: serviceRequest.description,
      clientId: serviceRequest.clientId,
      developerIds: developerIds || [serviceRequest.assignedDeveloperId],
      startDate,
      endDate,
      budget: budget || serviceRequest.estimatedPrice,
      status: PROJECT_STATUS.PLANNING
    });

    const populatedProject = await Project.findById(project._id)
      .populate('clientId', 'name email')
      .populate('developerIds', 'name email')
      .populate('serviceRequestId', 'title');

    await createAuditLog(req, 'project_created', 'project', project._id);

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project: populatedProject
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/projects/:id
 * @desc    Update project
 * @access  Private
 */
export const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check permissions
    const isClient = project.clientId.toString() === req.user._id.toString();
    const isDeveloper = project.developerIds.some(dev => dev.toString() === req.user._id.toString());
    const isAdmin = req.user.role === ROLES.ADMIN;

    if (!isClient && !isDeveloper && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (isClient && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Clients cannot update projects directly'
      });
    }

    // Developers can only update status and progress
    if (isDeveloper && !isAdmin) {
      const allowedFields = ['status', 'progress', 'milestones'];
      const updates = {};
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });
      req.body = updates;
    }

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('clientId', 'name email')
      .populate('developerIds', 'name email');

    await createAuditLog(req, 'project_updated', 'project', updatedProject._id, { updates: req.body });

    res.json({
      success: true,
      message: 'Project updated successfully',
      project: updatedProject
    });
  } catch (error) {
    next(error);
  }
};

