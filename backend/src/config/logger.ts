/**
 * Winston Logger Configuration
 *
 * Custom 4-line log format:
 * Line 1: [TIMESTAMP] [LEVEL] [REQUEST_ID]
 * Line 2: MESSAGE
 * Line 3: File: RELATIVE_PATH
 * Line 4: Additional metadata (if any)
 *
 * Features:
 * - Daily rotating log files
 * - Separate error log file
 * - Console output in development
 * - Configurable log levels
 * - 14-day retention for combined logs
 * - 30-day retention for error logs
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import * as fs from 'fs';

/**
 * Custom log format for console output with colors
 * Implements the 4-line format requirement with enhanced colors
 */
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.printf((info) => {
    const { timestamp, level, message, requestId, filePath, ...meta } = info;

    // ANSI color codes
    const colors = {
      reset: '\x1b[0m',
      bright: '\x1b[1m',
      dim: '\x1b[2m',

      // Text colors
      black: '\x1b[30m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m',
      white: '\x1b[37m',
      gray: '\x1b[90m',

      // Background colors
      bgRed: '\x1b[41m',
      bgGreen: '\x1b[42m',
      bgYellow: '\x1b[43m',
      bgBlue: '\x1b[44m',
    };

    // Determine level color
    let levelColor = colors.white;
    let levelIcon = '●';

    if (level.includes('error')) {
      levelColor = colors.red;
      levelIcon = '✖';
    } else if (level.includes('warn')) {
      levelColor = colors.yellow;
      levelIcon = '⚠';
    } else if (level.includes('info')) {
      levelColor = colors.green;
      levelIcon = '✓';
    } else if (level.includes('debug')) {
      levelColor = colors.blue;
      levelIcon = '◆';
    }

    // Line 1: Timestamp (cyan), Level (colored with icon), Request ID (magenta)
    let log = `${colors.cyan}[${timestamp}]${colors.reset} ${levelColor}${levelIcon} ${level.toUpperCase().replace(/\x1b\[[0-9;]*m/g, '')}${colors.reset}`;

    if (requestId) {
      log += ` ${colors.magenta}[${requestId}]${colors.reset}`;
    }

    // Line 2: Message (bright white for visibility)
    log += `\n${colors.bright}${message}${colors.reset}`;

    // Line 3: Additional metadata (yellow for key data)
    if (Object.keys(meta).length > 0) {
      // Remove service metadata (added by default)
      const { service, ...cleanMeta } = meta;
      if (Object.keys(cleanMeta).length > 0) {
        const metaString = JSON.stringify(cleanMeta, null, 2);
        log += `\n${colors.yellow}${metaString}${colors.reset}`;
      }
    }

    // Line 4: File path (gray, at the end)
    if (filePath) {
      log += `\n${colors.gray}📄 ${filePath}${colors.reset}`;
    }

    return log;
  })
);

/**
 * Format for file output (JSON for easy parsing and analysis)
 */
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Create logs directory if it doesn't exist
 */
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Transport: Console (development and when LOG_CONSOLE_ENABLED=true)
 */
const consoleTransport = new winston.transports.Console({
  format: consoleFormat,
  level: process.env.LOG_LEVEL || 'debug',
});

/**
 * Transport: Daily rotate file for all logs
 * Retention: 14 days
 * Max file size: 20MB
 */
const dailyRotateTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: fileFormat,
  level: 'debug',
});

/**
 * Transport: Daily rotate file for errors only
 * Retention: 30 days
 * Max file size: 20MB
 */
const errorRotateTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d',
  format: fileFormat,
  level: 'error',
});

/**
 * Create logger instance
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: fileFormat,
  defaultMeta: { service: 'tenmiye-backend' },
  transports: [],
});

/**
 * Add file transports if enabled (default: true)
 */
if (process.env.LOG_FILE_ENABLED !== 'false') {
  logger.add(dailyRotateTransport);
  logger.add(errorRotateTransport);
}

/**
 * Add console transport in development or when explicitly enabled
 */
if (process.env.NODE_ENV !== 'production' || process.env.LOG_CONSOLE_ENABLED === 'true') {
  logger.add(consoleTransport);
}

/**
 * Log rotation event handlers
 */
dailyRotateTransport.on('rotate', (oldFilename: string, newFilename: string) => {
  logger.info('Log file rotated', { oldFilename, newFilename });
});

errorRotateTransport.on('rotate', (oldFilename: string, newFilename: string) => {
  logger.info('Error log file rotated', { oldFilename, newFilename });
});

/**
 * Handle uncaught exceptions
 */
logger.exceptions.handle(
  new winston.transports.File({ filename: path.join(logsDir, 'exceptions.log') })
);

/**
 * Handle unhandled promise rejections
 */
logger.rejections.handle(
  new winston.transports.File({ filename: path.join(logsDir, 'rejections.log') })
);

/**
 * Export logger instance
 * Use this for manual logging throughout the application
 *
 * @example
 * import logger from '@config/logger';
 * logger.info('User logged in', { userId: '123', filePath: 'src/services/auth.service.ts' });
 */
export default logger;
