import winston from 'winston';
import path from 'path';

/**
 * Logger Utility
 *
 * Centralized logging system using Winston
 *
 * Features:
 * - Different log levels (error, warn, info, debug)
 * - File-based logging (error.log, combined.log)
 * - Console logging with colors (development)
 * - Structured JSON format for production
 * - Automatic log rotation (to be configured)
 */

const isDevelopment = process.env.NODE_ENV !== 'production';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development (human-readable)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;

    // Add metadata if exists
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }

    return msg;
  })
);

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');

// Create logger instance
export const logger = winston.createLogger({
  level: isDevelopment ? 'debug' : 'info',
  format: logFormat,
  defaultMeta: {
    service: 'tenmiye-backend',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Write all errors to error.log
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),

    // Write all logs to combined.log
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],

  // Handle exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log')
    })
  ],

  // Handle promise rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log')
    })
  ]
});

// Add console transport for development
if (isDevelopment) {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat
    })
  );
} else {
  // In production, use simple console logging
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  );
}

/**
 * HTTP Request Logger
 *
 * Logs HTTP requests with timing
 */
export const logHttpRequest = (req: any, res: any, responseTime?: number) => {
  const logData = {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
    responseTime: responseTime ? `${responseTime}ms` : undefined
  };

  if (res.statusCode >= 500) {
    logger.error('HTTP Error', logData);
  } else if (res.statusCode >= 400) {
    logger.warn('HTTP Client Error', logData);
  } else {
    logger.info('HTTP Request', logData);
  }
};

/**
 * Database Query Logger
 */
export const logDatabaseQuery = (collection: string, operation: string, duration?: number) => {
  logger.debug('Database Query', {
    collection,
    operation,
    duration: duration ? `${duration}ms` : undefined
  });
};

/**
 * Security Event Logger
 */
export const logSecurityEvent = (
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  details?: any
) => {
  const logLevel = severity === 'critical' || severity === 'high' ? 'error' : 'warn';

  logger[logLevel]('Security Event', {
    event,
    severity,
    ...details
  });
};

/**
 * Business Event Logger
 */
export const logBusinessEvent = (event: string, details?: any) => {
  logger.info('Business Event', {
    event,
    ...details
  });
};

/**
 * Performance Logger
 */
export const logPerformance = (operation: string, duration: number, threshold: number = 1000) => {
  const logData = {
    operation,
    duration: `${duration}ms`,
    threshold: `${threshold}ms`,
    exceeded: duration > threshold
  };

  if (duration > threshold) {
    logger.warn('Slow Operation', logData);
  } else {
    logger.debug('Performance', logData);
  }
};

// Export logger instance as default
export default logger;
