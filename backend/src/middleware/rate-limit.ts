/**
 * Rate Limiting Middleware
 *
 * Protects API from abuse by limiting request frequency
 * Configurable windows and limits per endpoint
 *
 * Default: 100 requests per 15 minutes
 */

import rateLimit from 'express-rate-limit';
import { createLogger } from '../utils/logger.utils';

const log = createLogger(__filename);

/**
 * Get rate limit configuration from environment
 */
function getRateLimitConfig() {
  return {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  };
}

/**
 * Standard rate limiter
 * 100 requests per 15 minutes (configurable via environment)
 *
 * @example
 * app.use('/api', standardRateLimiter);
 */
export const standardRateLimiter = rateLimit({
  windowMs: getRateLimitConfig().windowMs,
  max: getRateLimitConfig().maxRequests,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: `Maximum ${getRateLimitConfig().maxRequests} requests per ${getRateLimitConfig().windowMs / 60000} minutes`,
    },
    timestamp: Date.now(),
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: (req, res) => {
    log.warn('Rate limit exceeded', {
      ip: req.ip,
      url: req.url,
      method: req.method,
    });

    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later',
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Maximum ${getRateLimitConfig().maxRequests} requests per ${getRateLimitConfig().windowMs / 60000} minutes`,
      },
      timestamp: Date.now(),
    });
  },
});

/**
 * Strict rate limiter for authentication endpoints
 * 5 attempts per 15 minutes
 *
 * Prevents brute force attacks on login/register
 *
 * @example
 * router.post('/login', authRateLimiter, login);
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Maximum 5 authentication attempts per 15 minutes',
    },
    timestamp: Date.now(),
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful auth attempts
  handler: (req, res) => {
    log.warn('Authentication rate limit exceeded', {
      ip: req.ip,
      url: req.url,
    });

    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts',
      error: {
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        message: 'Too many failed authentication attempts. Please try again in 15 minutes.',
      },
      timestamp: Date.now(),
    });
  },
});

/**
 * Lenient rate limiter for public endpoints
 * 300 requests per 15 minutes
 *
 * @example
 * router.get('/announcements/public', publicRateLimiter, getPublicAnnouncements);
 */
export const publicRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Maximum 300 requests per 15 minutes',
    },
    timestamp: Date.now(),
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Aggressive rate limiter for sensitive operations
 * 10 requests per hour
 *
 * Use for password resets, account changes, etc.
 *
 * @example
 * router.post('/auth/reset-password', sensitiveRateLimiter, resetPassword);
 */
export const sensitiveRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    success: false,
    message: 'Too many sensitive operations, please try again later',
    error: {
      code: 'SENSITIVE_RATE_LIMIT_EXCEEDED',
      message: 'Maximum 10 sensitive operations per hour',
    },
    timestamp: Date.now(),
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    log.warn('Sensitive operation rate limit exceeded', {
      ip: req.ip,
      url: req.url,
    });

    res.status(429).json({
      success: false,
      message: 'Too many sensitive operations',
      error: {
        code: 'SENSITIVE_RATE_LIMIT_EXCEEDED',
        message: 'You have exceeded the limit for sensitive operations. Please try again in 1 hour.',
      },
      timestamp: Date.now(),
    });
  },
});

/**
 * Create custom rate limiter
 *
 * @param windowMinutes - Time window in minutes
 * @param maxRequests - Maximum requests in window
 * @param message - Custom error message
 * @returns Rate limiter middleware
 *
 * @example
 * const customLimiter = createRateLimiter(30, 50, 'Custom limit exceeded');
 * router.use('/custom-endpoint', customLimiter);
 */
export function createRateLimiter(
  windowMinutes: number,
  maxRequests: number,
  message: string = 'Rate limit exceeded'
) {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max: maxRequests,
    message: {
      success: false,
      message,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Maximum ${maxRequests} requests per ${windowMinutes} minutes`,
      },
      timestamp: Date.now(),
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      log.warn('Custom rate limit exceeded', {
        ip: req.ip,
        url: req.url,
        limit: maxRequests,
        window: `${windowMinutes} minutes`,
      });

      res.status(429).json({
        success: false,
        message,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Maximum ${maxRequests} requests per ${windowMinutes} minutes`,
        },
        timestamp: Date.now(),
      });
    },
  });
}
