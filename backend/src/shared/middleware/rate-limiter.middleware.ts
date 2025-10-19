import rateLimit from 'express-rate-limit';

/**
 * Rate Limiter Middleware
 *
 * Protects API endpoints from abuse and brute force attacks
 */

/**
 * General API rate limiter
 *
 * Limits: 100 requests per 15 minutes per IP
 * Applied to all /api/* routes
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again later',
      statusCode: 429
    }
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers

  // Skip rate limiting for successful requests (optional)
  skipSuccessfulRequests: false,

  // Custom key generator (defaults to IP)
  keyGenerator: (req) => {
    return req.ip || req.socket.remoteAddress || 'unknown';
  }
});

/**
 * Strict rate limiter for authentication endpoints
 *
 * Limits: 5 requests per 15 minutes per IP
 * Applied to /api/users/login, /api/users/register
 *
 * Purpose: Prevent brute force attacks on authentication
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts, please try again after 15 minutes',
      statusCode: 429
    }
  },
  standardHeaders: true,
  legacyHeaders: false,

  // Skip counting successful requests (only count failed attempts)
  skipSuccessfulRequests: true,

  keyGenerator: (req) => {
    // For auth, we can also use phone number if provided
    const phone = req.body?.phone;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return phone ? `${ip}-${phone}` : ip;
  }
});

/**
 * Password reset rate limiter
 *
 * Limits: 3 requests per hour per IP
 * Applied to /api/password-reset/*
 *
 * Purpose: Prevent password reset spam/abuse
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 requests per hour
  message: {
    success: false,
    error: {
      message: 'Too many password reset requests, please try again after 1 hour',
      statusCode: 429
    }
  },
  standardHeaders: true,
  legacyHeaders: false,

  keyGenerator: (req) => {
    const phone = req.body?.phone;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return phone ? `${ip}-${phone}` : ip;
  }
});

/**
 * File upload rate limiter
 *
 * Limits: 20 uploads per 15 minutes per IP
 * Applied to /api/storage/upload, /api/storage/upload-url
 *
 * Purpose: Prevent storage abuse
 */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 uploads per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many upload requests, please try again later',
      statusCode: 429
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Admin operations rate limiter
 *
 * Limits: 50 requests per 15 minutes per IP
 * Applied to /api/admins/*
 *
 * Purpose: Protect admin endpoints
 */
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many admin requests, please try again later',
      statusCode: 429
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});
