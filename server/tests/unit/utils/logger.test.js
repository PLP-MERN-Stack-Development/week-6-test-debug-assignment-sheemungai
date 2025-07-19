// tests/unit/utils/logger.test.js - Unit tests for logger utilities

const logger = require('../../../src/utils/logger');

// Mock console methods to capture log output
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
};

describe('Logger Utils', () => {
  let mockConsole = {};

  beforeEach(() => {
    // Mock console methods
    mockConsole.log = jest.fn();
    mockConsole.error = jest.fn();
    mockConsole.warn = jest.fn();
    
    console.log = mockConsole.log;
    console.error = mockConsole.error;
    console.warn = mockConsole.warn;
  });

  afterEach(() => {
    // Restore console methods
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
    
    jest.clearAllMocks();
  });

  describe('error logging', () => {
    it('should log error messages', () => {
      const message = 'Test error message';
      logger.error(message);
      
      expect(mockConsole.error).toHaveBeenCalledTimes(1);
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('ERROR: Test error message')
      );
    });

    it('should log error messages with metadata', () => {
      const message = 'Test error';
      const meta = { userId: '123', action: 'login' };
      
      logger.error(message, meta);
      
      expect(mockConsole.error).toHaveBeenCalledTimes(1);
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('ERROR: Test error')
      );
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining(JSON.stringify(meta))
      );
    });
  });

  describe('warn logging', () => {
    it('should log warning messages', () => {
      const message = 'Test warning message';
      logger.warn(message);
      
      expect(mockConsole.warn).toHaveBeenCalledTimes(1);
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('WARN: Test warning message')
      );
    });

    it('should log warning messages with metadata', () => {
      const message = 'Test warning';
      const meta = { attempt: 3, maxAttempts: 5 };
      
      logger.warn(message, meta);
      
      expect(mockConsole.warn).toHaveBeenCalledTimes(1);
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('WARN: Test warning')
      );
    });
  });

  describe('info logging', () => {
    it('should log info messages', () => {
      const message = 'Test info message';
      logger.info(message);
      
      expect(mockConsole.log).toHaveBeenCalledTimes(1);
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('INFO: Test info message')
      );
    });

    it('should log info messages with metadata', () => {
      const message = 'User action';
      const meta = { userId: '456', action: 'create_post' };
      
      logger.info(message, meta);
      
      expect(mockConsole.log).toHaveBeenCalledTimes(1);
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('INFO: User action')
      );
    });
  });

  describe('debug logging', () => {
    it('should log debug messages in development', () => {
      // Mock NODE_ENV to development
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const message = 'Debug message';
      logger.debug(message);
      
      expect(mockConsole.log).toHaveBeenCalledTimes(1);
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('DEBUG: Debug message')
      );
      
      // Restore original NODE_ENV
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('logRequest', () => {
    it('should log HTTP requests', () => {
      const mockReq = {
        method: 'GET',
        originalUrl: '/api/users',
        get: jest.fn().mockReturnValue('Mozilla/5.0'),
        ip: '127.0.0.1',
      };
      
      const mockRes = {
        statusCode: 200,
      };
      
      const duration = 150;
      
      logger.logRequest(mockReq, mockRes, duration);
      
      expect(mockConsole.log).toHaveBeenCalledTimes(1);
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('INFO: HTTP 200')
      );
    });

    it('should log error status codes as warnings', () => {
      const mockReq = {
        method: 'POST',
        originalUrl: '/api/auth/login',
        get: jest.fn().mockReturnValue('Mozilla/5.0'),
        ip: '192.168.1.1',
      };
      
      const mockRes = {
        statusCode: 401,
      };
      
      const duration = 50;
      
      logger.logRequest(mockReq, mockRes, duration);
      
      expect(mockConsole.warn).toHaveBeenCalledTimes(1);
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('WARN: HTTP 401')
      );
    });
  });

  describe('logDatabase', () => {
    it('should log database operations', () => {
      const operation = 'find';
      const collection = 'users';
      const duration = 25;
      const meta = { filter: { active: true } };
      
      logger.logDatabase(operation, collection, duration, meta);
      
      expect(mockConsole.log).toHaveBeenCalledTimes(1);
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('DEBUG: Database operation completed')
      );
    });
  });
});
