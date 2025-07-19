// tests/unit/utils/auth.test.js - Unit tests for auth utilities

const {
  generateToken,
  verifyToken,
  extractToken,
  hasRole,
} = require('../../../src/utils/auth');

describe('Auth Utils', () => {
  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    username: 'testuser',
    email: 'test@example.com',
    role: 'user',
  };

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken(mockUser);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include user information in token payload', () => {
      const token = generateToken(mockUser);
      const decoded = verifyToken(token);
      
      expect(decoded.id).toBe(mockUser._id);
      expect(decoded.username).toBe(mockUser.username);
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.role).toBe(mockUser.role);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = generateToken(mockUser);
      const decoded = verifyToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded.id).toBe(mockUser._id);
      expect(decoded.username).toBe(mockUser.username);
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(() => {
        verifyToken(invalidToken);
      }).toThrow('Invalid token');
    });

    it('should throw error for malformed token', () => {
      const malformedToken = 'not-a-token';
      
      expect(() => {
        verifyToken(malformedToken);
      }).toThrow('Invalid token');
    });
  });

  describe('extractToken', () => {
    it('should extract token from valid Bearer header', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      const authHeader = `Bearer ${token}`;
      
      const extracted = extractToken(authHeader);
      expect(extracted).toBe(token);
    });

    it('should return null for missing header', () => {
      const extracted = extractToken(null);
      expect(extracted).toBeNull();
    });

    it('should return null for invalid header format', () => {
      const invalidHeader = 'InvalidFormat token';
      const extracted = extractToken(invalidHeader);
      expect(extracted).toBeNull();
    });

    it('should return null for missing Bearer prefix', () => {
      const headerWithoutBearer = 'token123';
      const extracted = extractToken(headerWithoutBearer);
      expect(extracted).toBeNull();
    });

    it('should return null for header with only Bearer', () => {
      const incompleteHeader = 'Bearer';
      const extracted = extractToken(incompleteHeader);
      expect(extracted).toBeNull();
    });
  });

  describe('hasRole', () => {
    it('should return true when user has exact required role', () => {
      expect(hasRole('user', 'user')).toBe(true);
      expect(hasRole('admin', 'admin')).toBe(true);
    });

    it('should return true when user has higher role', () => {
      expect(hasRole('admin', 'user')).toBe(true);
    });

    it('should return false when user has lower role', () => {
      expect(hasRole('user', 'admin')).toBe(false);
    });

    it('should handle undefined roles gracefully', () => {
      expect(hasRole(undefined, 'user')).toBe(false);
      expect(hasRole('user', undefined)).toBe(false);
    });

    it('should handle invalid roles gracefully', () => {
      expect(hasRole('invalid', 'user')).toBe(false);
      expect(hasRole('user', 'invalid')).toBe(false);
    });
  });
});
