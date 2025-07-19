// utils/logger.js - Logging utilities

const { LOG_LEVEL, NODE_ENV } = require('../config/env');

/**
 * Log levels in order of severity
 */
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

/**
 * Get current log level number
 */
const getCurrentLogLevel = () => {
  return LOG_LEVELS[LOG_LEVEL] || LOG_LEVELS.info;
};

/**
 * Format log message with timestamp
 * @param {String} level - Log level
 * @param {String} message - Log message
 * @param {Object} meta - Additional metadata
 * @returns {String} Formatted message
 */
const formatMessage = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const metaStr = Object.keys(meta).length > 0 ? ` | ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
};

/**
 * Check if message should be logged based on current log level
 * @param {String} level - Message log level
 * @returns {Boolean} Should log
 */
const shouldLog = (level) => {
  return LOG_LEVELS[level] <= getCurrentLogLevel();
};

/**
 * Logger class
 */
class Logger {
  /**
   * Log error message
   * @param {String} message - Error message
   * @param {Object} meta - Additional metadata
   */
  error(message, meta = {}) {
    if (shouldLog('error')) {
      console.error(formatMessage('error', message, meta));
    }
  }

  /**
   * Log warning message
   * @param {String} message - Warning message
   * @param {Object} meta - Additional metadata
   */
  warn(message, meta = {}) {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', message, meta));
    }
  }

  /**
   * Log info message
   * @param {String} message - Info message
   * @param {Object} meta - Additional metadata
   */
  info(message, meta = {}) {
    if (shouldLog('info')) {
      console.log(formatMessage('info', message, meta));
    }
  }

  /**
   * Log debug message
   * @param {String} message - Debug message
   * @param {Object} meta - Additional metadata
   */
  debug(message, meta = {}) {
    if (shouldLog('debug') && NODE_ENV === 'development') {
      console.log(formatMessage('debug', message, meta));
    }
  }

  /**
   * Log HTTP request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Number} duration - Request duration in ms
   */
  logRequest(req, res, duration) {
    const meta = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
    };

    if (res.statusCode >= 400) {
      this.warn(`HTTP ${res.statusCode}`, meta);
    } else {
      this.info(`HTTP ${res.statusCode}`, meta);
    }
  }

  /**
   * Log database operation
   * @param {String} operation - Database operation
   * @param {String} collection - Collection name
   * @param {Number} duration - Operation duration in ms
   * @param {Object} meta - Additional metadata
   */
  logDatabase(operation, collection, duration, meta = {}) {
    const logMeta = {
      operation,
      collection,
      duration: `${duration}ms`,
      ...meta,
    };

    this.debug(`Database operation completed`, logMeta);
  }
}

// Create singleton instance
const logger = new Logger();

module.exports = logger;
