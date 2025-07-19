// utils/auth.js - Authentication utilities

const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRE } = require('../config/env');

/**
 * Generate JWT token for user
 * @param {Object} user - User object
 * @returns {String} JWT token
 */
const generateToken = (user) => {
  const payload = {
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRE,
  });
};

/**
 * Verify JWT token
 * @param {String} token - JWT token
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

/**
 * Extract token from Authorization header
 * @param {String} authHeader - Authorization header value
 * @returns {String|null} Token or null
 */
const extractToken = (authHeader) => {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
};

/**
 * Generate password reset token
 * @param {String} userId - User ID
 * @returns {String} Reset token
 */
const generateResetToken = (userId) => {
  return jwt.sign({ userId, type: 'reset' }, JWT_SECRET, {
    expiresIn: '1h',
  });
};

/**
 * Verify password reset token
 * @param {String} token - Reset token
 * @returns {Object} Token payload
 */
const verifyResetToken = (token) => {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.type !== 'reset') {
      throw new Error('Invalid token type');
    }
    return payload;
  } catch (error) {
    throw new Error('Invalid or expired reset token');
  }
};

/**
 * Check if user has required role
 * @param {String} userRole - User's role
 * @param {String} requiredRole - Required role
 * @returns {Boolean} Has permission
 */
const hasRole = (userRole, requiredRole) => {
  const roleHierarchy = {
    'user': 1,
    'admin': 2,
  };
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

module.exports = {
  generateToken,
  verifyToken,
  extractToken,
  generateResetToken,
  verifyResetToken,
  hasRole,
};
