// middleware/auth.js - Authentication middleware

const User = require('../models/User');
const { verifyToken, extractToken, hasRole } = require('../utils/auth');
const logger = require('../utils/logger');

/**
 * Middleware to authenticate user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticateToken = async (req, res, next) => {
  try {
    const token = extractToken(req.headers.authorization);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required',
      });
    }

    const decoded = verifyToken(token);
    
    // Find user and attach to request
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication failed', { error: error.message });
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

/**
 * Middleware to check if user has required role
 * @param {String} requiredRole - Required role
 * @returns {Function} Middleware function
 */
const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!hasRole(req.user.role, requiredRole)) {
      logger.warn('Access denied - insufficient permissions', {
        userId: req.user._id,
        userRole: req.user.role,
        requiredRole,
      });

      return res.status(403).json({
        success: false,
        message: 'Access denied - insufficient permissions',
      });
    }

    next();
  };
};

/**
 * Middleware to check if user owns the resource
 * @param {String} resourceField - Field name that contains the user ID
 * @returns {Function} Middleware function
 */
const requireOwnership = (resourceField = 'author') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // Check ownership based on resource
    const resourceUserId = req.resource && req.resource[resourceField];
    if (!resourceUserId || resourceUserId.toString() !== req.user._id.toString()) {
      logger.warn('Access denied - not resource owner', {
        userId: req.user._id,
        resourceUserId,
        resourceField,
      });

      return res.status(403).json({
        success: false,
        message: 'Access denied - you can only access your own resources',
      });
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token provided
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req.headers.authorization);
    
    if (token) {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Ignore authentication errors for optional auth
    next();
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  requireOwnership,
  optionalAuth,
};
