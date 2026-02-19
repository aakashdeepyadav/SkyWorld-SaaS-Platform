import { ROLES } from '../utils/constants.js';
import { createAuditLog } from './auth.js';

/**
 * Role-Based Access Control middleware
 * @param {...string} allowedRoles - Roles that can access the route
 */
export const authorize = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        await createAuditLog(
          req,
          'unauthorized_access_attempt',
          req.path,
          null,
          { attemptedRole: req.user.role, requiredRoles: allowedRoles }
        );

        return res.status(403).json({
          success: false,
          message: 'Access denied. Insufficient permissions.'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Authorization check failed'
      });
    }
  };
};

/**
 * Admin only access
 */
export const adminOnly = authorize(ROLES.ADMIN);

/**
 * Admin or Developer access
 */
export const adminOrDeveloper = authorize(ROLES.ADMIN, ROLES.DEVELOPER);

/**
 * Admin or Client access
 */
export const adminOrClient = authorize(ROLES.ADMIN, ROLES.CLIENT);

/**
 * Check if user owns the resource or is admin
 */
export const ownerOrAdmin = (resourceUserIdField = 'userId') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Admin can access everything
      if (req.user.role === ROLES.ADMIN) {
        return next();
      }

      // Get resource from request (should be populated by previous middleware)
      const resource = req.resource || req.project || req.serviceRequest || req.payment;
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }

      const resourceUserId = resource[resourceUserIdField] || resource.clientId || resource.uploadedBy;
      
      // Check if user owns the resource
      if (resourceUserId && resourceUserId.toString() === req.user._id.toString()) {
        return next();
      }

      // For projects, check if user is assigned developer
      if (resource.developerIds && Array.isArray(resource.developerIds)) {
        const isDeveloper = resource.developerIds.some(
          devId => devId.toString() === req.user._id.toString()
        );
        if (isDeveloper) {
          return next();
        }
      }

      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to access this resource.'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Authorization check failed'
      });
    }
  };
};

