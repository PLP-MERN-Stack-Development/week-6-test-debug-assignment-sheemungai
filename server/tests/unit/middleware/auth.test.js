// tests/unit/middleware/auth.test.js - Unit tests for authentication middleware

const {
  authenticateToken,
  requireRole,
  requireOwnership,
  optionalAuth,
} = require('../../../src/middleware/auth');
const User = require('../../../src/models/User');
const { generateToken } = require('../../../src/utils/auth');

// Mock User model
jest.mock('../../../src/models/User');

describe('Auth Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      headers: {},
      user: null,
      resource: null,
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    
    mockNext = jest.fn();
    
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      username: 'testuser',
      email: 'test@example.com',
      role: 'user',
      isActive: true,
    };

    it('should authenticate valid token and attach user to request', async () => {
      const token = generateToken(mockUser);
      mockReq.headers.authorization = `Bearer ${token}`;

      // Mock User.findById to return the user
      User.findById = jest.fn().mockResolvedValue(mockUser);

      await authenticateToken(mockReq, mockRes, mockNext);

      expect(User.findById).toHaveBeenCalledWith(mockUser._id);
      expect(mockReq.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should reject request without authorization header', async () => {
      await authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access token is required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token format', async () => {
      mockReq.headers.authorization = 'InvalidToken';

      await authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access token is required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request when user not found', async () => {
      const token = generateToken(mockUser);
      mockReq.headers.authorization = `Bearer ${token}`;

      // Mock User.findById to return null
      User.findById = jest.fn().mockResolvedValue(null);

      await authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request when user is inactive', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      const token = generateToken(inactiveUser);
      mockReq.headers.authorization = `Bearer ${token}`;

      User.findById = jest.fn().mockResolvedValue(inactiveUser);

      await authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Account is deactivated',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle invalid token error', async () => {
      mockReq.headers.authorization = 'Bearer invalid.jwt.token';

      await authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired token',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    it('should allow access when user has required role', () => {
      mockReq.user = { role: 'admin' };
      const middleware = requireRole('admin');

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should allow access when user has higher role', () => {
      mockReq.user = { role: 'admin' };
      const middleware = requireRole('user');

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should deny access when user has insufficient role', () => {
      mockReq.user = { _id: '123', role: 'user' };
      const middleware = requireRole('admin');

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied - insufficient permissions',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny access when user is not authenticated', () => {
      const middleware = requireRole('user');

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireOwnership', () => {
    it('should allow admin to access any resource', () => {
      mockReq.user = { role: 'admin' };
      mockReq.resource = { author: 'different-user-id' };
      const middleware = requireOwnership();

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should allow user to access own resource', () => {
      const userId = '507f1f77bcf86cd799439011';
      mockReq.user = { _id: userId, role: 'user' };
      mockReq.resource = { author: userId };
      const middleware = requireOwnership();

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should deny user access to other users resource', () => {
      mockReq.user = { _id: 'user1', role: 'user' };
      mockReq.resource = { author: 'user2' };
      const middleware = requireOwnership();

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied - you can only access your own resources',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should work with custom resource field', () => {
      const userId = '507f1f77bcf86cd799439011';
      mockReq.user = { _id: userId, role: 'user' };
      mockReq.resource = { owner: userId };
      const middleware = requireOwnership('owner');

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('optionalAuth', () => {
    it('should attach user when valid token provided', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        isActive: true,
      };
      const token = generateToken(mockUser);
      mockReq.headers.authorization = `Bearer ${token}`;

      User.findById = jest.fn().mockResolvedValue(mockUser);

      await optionalAuth(mockReq, mockRes, mockNext);

      expect(mockReq.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should continue without user when no token provided', async () => {
      await optionalAuth(mockReq, mockRes, mockNext);

      expect(mockReq.user).toBeNull();
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should continue without user when invalid token provided', async () => {
      mockReq.headers.authorization = 'Bearer invalid.token';

      await optionalAuth(mockReq, mockRes, mockNext);

      expect(mockReq.user).toBeNull();
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });
});
