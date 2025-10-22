import winston from 'winston';
import path from 'path';

/**
 * Enhanced Logger Utility
 *
 * Centralized logging system using Winston with enhanced features
 *
 * Features:
 * - Different log levels (error, warn, info, debug)
 * - File-based logging (error.log, combined.log)
 * - Console logging with colors and source tracking (development)
 * - Structured JSON format for production
 * - Source file location tracking from stack traces
 * - Scoped loggers with custom prefixes
 * - Automatic log rotation
 *
 * @example
 * ```typescript
 * import { logger, createLogger } from '@shared/utils/logger.util';
 *
 * // Basic usage
 * logger.info('Server started', { port: 3000 });
 * logger.error('Database error', { error: err.message });
 *
 * // Create scoped logger
 * const authLogger = createLogger('[AuthService]');
 * authLogger.info('User logged in', { userId: 123 });
 * ```
 */

const isDevelopment = process.env.NODE_ENV !== 'production';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

/**
 * Get source file location from stack trace
 * Extracts the calling file and line number, excluding internal logger files
 */
function getSourceLocation(): string | null {
  try {
    const stack = new Error().stack;
    if (!stack) return null;

    const lines = stack.split('\n');

    // Find the first line that's not from logger.util.ts or winston internals
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip lines from logger.util.ts
      if (line.includes('logger.util.ts')) continue;

      // Skip winston internal lines
      if (line.includes('node_modules/winston')) continue;

      // Skip Error constructor lines
      if (line.includes('Error')) continue;

      // Extract file path and line number
      // Format: "at ClassName.methodName (filepath:line:column)" or "at filepath:line:column"
      const parenMatch = line.match(/\(([^)]+):(\d+):\d+\)/);
      const directMatch = line.match(/at\s+([^:]+):(\d+):\d+/);
      const match = parenMatch || directMatch;

      if (match) {
        const filePath = match[1];
        const lineNum = match[2];

        // Clean up the file path to show relative path from backend root
        // Extract everything after /backend/ and prefix with ./
        let cleanPath = filePath;

        if (filePath.includes('/backend/')) {
          // Get path after backend/ and prefix with ./
          let afterBackend = filePath.replace(/.*\/backend\//, '');

          // If it's from dist/, convert to src/
          if (afterBackend.startsWith('dist/')) {
            afterBackend = afterBackend.replace('dist/', 'src/');
            // Also change .js to .ts
            afterBackend = afterBackend.replace(/\.js$/, '.ts');
          }

          cleanPath = `./${afterBackend}`;
        }
        // Fallback: if no backend in path, just use from src/
        else if (filePath.includes('/src/')) {
          cleanPath = filePath.replace(/.*\/(src\/.*)/, './$1');
        }
        // Handle dist/ paths
        else if (filePath.includes('/dist/')) {
          let afterDist = filePath.replace(/.*\/dist\//, '');
          afterDist = afterDist.replace(/\.js$/, '.ts');
          cleanPath = `./src/${afterDist}`;
        }

        return `${cleanPath}:${lineNum}`;
      }
    }

    return null;
  } catch (e) {
    return null;
  }
}

// Custom console transport that handles multi-line output
class MultiLineConsoleTransport extends winston.transports.Console {
  log(info: any, callback: () => void) {
    setImmediate(() => this.emit('logged', info));

    // Line 1: Timestamp + Level + Prefix
    let line1 = `${info.timestamp} [${info.level}]`;
    if (info.prefix) {
      line1 += ` ${info.prefix}`;
    }
    line1 += ':';

    // Line 2: Message + Metadata (with 4-space indentation)
    let line2 = `    ${info.message}`;

    // Add metadata if exists (excluding internal fields)
    const filteredMetadata = { ...info };
    delete filteredMetadata.timestamp;
    delete filteredMetadata.level;
    delete filteredMetadata.message;
    delete filteredMetadata.prefix;
    delete filteredMetadata.service;
    delete filteredMetadata.environment;
    delete filteredMetadata.sourceLocation;
    delete filteredMetadata[Symbol.for('level')];
    delete filteredMetadata[Symbol.for('splat')];
    delete filteredMetadata[Symbol.for('message')];

    if (Object.keys(filteredMetadata).length > 0) {
      line2 += ` ${JSON.stringify(filteredMetadata)}`;
    }

    // Line 3: Source location (in gray, with 4-space indentation)
    let line3 = '';
    if (isDevelopment && info.sourceLocation) {
      line3 = `    \x1b[90m[${info.sourceLocation}]\x1b[0m`;
    }

    // Output each line separately
    console.log(line1);
    console.log(line2);
    if (line3) {
      console.log(line3);
    }

    if (callback) {
      callback();
    }
  }
}

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');

// Create base logger instance
const baseLogger = winston.createLogger({
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

/**
 * Enhanced logger wrapper with source location tracking
 */
class EnhancedLogger {
  private prefix?: string;

  constructor(prefix?: string) {
    this.prefix = prefix;
  }

  private log(level: 'info' | 'warn' | 'error' | 'debug', message: string, metadata?: any): void {
    const sourceLocation = getSourceLocation();
    const logMeta = {
      ...metadata,
      ...(this.prefix && { prefix: this.prefix }),
      ...(sourceLocation && { sourceLocation })
    };

    baseLogger[level](message, logMeta);
  }

  info(message: string, metadata?: any): void {
    this.log('info', message, metadata);
  }

  warn(message: string, metadata?: any): void {
    this.log('warn', message, metadata);
  }

  error(message: string, metadata?: any): void {
    this.log('error', message, metadata);
  }

  debug(message: string, metadata?: any): void {
    this.log('debug', message, metadata);
  }
}

// Export enhanced logger instance
export const logger = new EnhancedLogger();

// Add console transport for development
if (isDevelopment) {
  baseLogger.add(
    new MultiLineConsoleTransport({
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.colorize()
      )
    })
  );
} else {
  // In production, use simple console logging
  baseLogger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  );
}

/**
 * Create a scoped logger with a custom prefix
 * Perfect for domain-specific logging (e.g., [AuthService], [UserRepository])
 *
 * @param prefix - Custom prefix to prepend to all log messages
 * @returns EnhancedLogger instance with the specified prefix
 *
 * @example
 * ```typescript
 * const authLogger = createLogger('[AuthService]');
 * authLogger.info('User logged in', { userId: 123 });
 * // Output: 2025-10-20 10:16:39 [info] [AuthService]: User logged in {"userId":123} [src/domains/auth/auth.service.ts:45]
 * ```
 */
export function createLogger(prefix: string): EnhancedLogger {
  return new EnhancedLogger(prefix);
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

/**
 * Utility function to enable/disable logging
 * Useful for testing or production optimization
 *
 * @param enabled - Whether logging should be enabled
 */
export function setLoggingEnabled(enabled: boolean): void {
  if (enabled) {
    baseLogger.silent = false;
  } else {
    baseLogger.silent = true;
  }
}
