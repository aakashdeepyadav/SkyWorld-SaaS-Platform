import User from '../models/User.js';
import { ROLES } from '../utils/constants.js';
import { createAuditLog } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

/**
 * @route   GET /api/users
 * @desc    Get all users (Admin only)
 * @access  Private/Admin
 */
export const getUsers = async (req, res, next) => {
  try {
    const { role, isActive, page = 1, limit = 10 } = req.query;
    const query = {};

    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    await createAuditLog(req, 'view_users', 'user', null, { filters: query });

    res.json({
      success: true,
      count: users.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      users
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/users/profile/me
 * @desc    Get current user profile
 * @access  Private
 */
export const getMyProfile = async (req, res, next) => {
  try {
    res.json({
      success: true,
      user: req.user.toPublicJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/users/profile/me
 * @desc    Update current user profile
 * @access  Private
 */
export const updateMyProfile = async (req, res, next) => {
  try {
    const { name, phone, avatar, company, notificationPreferences } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (avatar !== undefined) updates.avatar = avatar;
    if (company !== undefined) updates.company = company;
    if (notificationPreferences !== undefined) {
      const allowed = ['email', 'projectUpdates', 'marketing'];
      const sanitized = {};
      allowed.forEach(key => {
        if (typeof notificationPreferences[key] === 'boolean') {
          sanitized[key] = notificationPreferences[key];
        }
      });
      updates.notificationPreferences = sanitized;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    await createAuditLog(req, 'profile_updated', 'user', user._id);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: user.toPublicJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/users/:id/role
 * @desc    Update user role (Admin only)
 * @access  Private/Admin
 */
export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const userId = req.params.id;

    if (!Object.values(ROLES).includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    // Prevent admin from changing their own role
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own role'
      });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    await createAuditLog(req, 'role_updated', 'user', user._id, { newRole: role, updatedBy: req.user._id });

    res.json({
      success: true,
      message: 'User role updated successfully',
      user: user.toPublicJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/users/:id/status
 * @desc    Update user status (Admin only)
 * @access  Private/Admin
 */
export const updateUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const userId = req.params.id;

    // Prevent deactivating yourself
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account'
      });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    targetUser.isActive = isActive;
    await targetUser.save({ validateBeforeSave: false });

    await createAuditLog(req, 'user_status_updated', 'user', targetUser._id, { isActive, updatedBy: req.user._id });

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: targetUser.toPublicJSON()
    });
  } catch (error) {
    next(error);
  }
};

