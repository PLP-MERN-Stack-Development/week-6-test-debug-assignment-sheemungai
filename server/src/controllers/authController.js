// controllers/authController.js - Authentication controller

const User = require('../models/User');
const { generateToken } = require('../utils/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * Register new user
 */
const register = asyncHandler(async (req, res) => {
  const { username, email, password, firstName, lastName } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (existingUser) {
    const field = existingUser.email === email ? 'email' : 'username';
    throw new AppError(`User with this ${field} already exists`, 400);
  }

  // Create new user
  const user = await User.create({
    username,
    email,
    password,
    firstName,
    lastName,
  });

  // Generate token
  const token = generateToken(user);

  // Update last login
  await user.updateLastLogin();

  logger.info('User registered successfully', { userId: user._id, username });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        role: user.role,
      },
    },
  });
});

/**
 * Login user
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user with password field
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', 401);
  }

  // Check if account is active
  if (!user.isActive) {
    throw new AppError('Account is deactivated', 401);
  }

  // Generate token
  const token = generateToken(user);

  // Update last login
  await user.updateLastLogin();

  logger.info('User logged in successfully', { userId: user._id, username: user.username });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        role: user.role,
        lastLogin: user.lastLogin,
      },
    },
  });
});

/**
 * Get current user profile
 */
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User profile retrieved successfully',
    data: {
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        fullName: req.user.fullName,
        role: req.user.role,
        isActive: req.user.isActive,
        lastLogin: req.user.lastLogin,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt,
      },
    },
  });
});

/**
 * Update user profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ['firstName', 'lastName', 'profileImage'];
  const updates = {};

  // Filter allowed fields
  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updates,
    {
      new: true,
      runValidators: true,
    }
  );

  logger.info('User profile updated', { userId: user._id, updates: Object.keys(updates) });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        profileImage: user.profileImage,
        role: user.role,
        updatedAt: user.updatedAt,
      },
    },
  });
});

/**
 * Logout user (for client-side token cleanup)
 */
const logout = asyncHandler(async (req, res) => {
  logger.info('User logged out', { userId: req.user._id });

  res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
});

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  logout,
};
