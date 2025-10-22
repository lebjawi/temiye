/**
 * Authentication Middleware
 *
 * Verifies JWT tokens and extracts user/admin information
 * Attaches authenticated user to request object
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader, JwtPayload } from '../utils/jwt.utils';
import { createLogger } from '../utils/logger.utils';

const log = createLogger(__filename);

/**
 * Extended Express Request with authenticated user
 */
export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
  requestId?: string;
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user data to request
 *
 * Usage:
 * ```typescript
 * router.get('/protected', authenticate, (req: AuthenticatedRequest, res) => {
 *   const userId = req.user?.sub;
 *   // ...
 * });
 * ```
 *
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const requestId = req.requestId || 'unknown';

  log.debug('Authenticating request', {
    requestId,
    url: req.url,
    method: req.method,
  });

  // Extract token from Authorization header
  const token = extractTokenFromHeader(req.headers.authorization);

  if (!token) {
    log.warn('Authentication failed - no token provided', {
      requestId,
      url: req.url,
    });

    res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: {
        code: 'NO_TOKEN',
        message: 'No authentication token provided',
      },
      timestamp: Date.now(),
    });
    return;
  }

  try {
    // Verify token
    const payload = verifyToken(token);

    // Attach user data to request
    req.user = payload;

    log.debug('Authentication successful', {
      requestId,
      userId: payload.sub,
      userType: payload.type,
    });

    next();
  } catch (error) {
    log.warn('Authentication failed - invalid token', {
      requestId,
      error: (error as Error).message,
    });

    res.status(401).json({
      success: false,
      message: 'Authentication failed',
      error: {
        code: 'INVALID_TOKEN',
        message: (error as Error).message,
      },
      timestamp: Date.now(),
    });
  }
}

/**
 * Optional authentication middleware
 * Attaches user if token is present, but doesn't require it
 *
 * Useful for endpoints that behave differently for authenticated vs anonymous users
 *
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
export function optionalAuthenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  const token = extractTokenFromHeader(req.headers.authorization);

  if (!token) {
    // No token provided, continue without authentication
    next();
    return;
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;

    log.debug('Optional authentication successful', {
      requestId: req.requestId,
      userId: payload.sub,
    });
  } catch (error) {
    // Invalid token, but we don't block the request
    log.debug('Optional authentication failed, continuing without auth', {
      requestId: req.requestId,
      error: (error as Error).message,
    });
  }

  next();
}

/**
 * Authenticate user only (reject if admin token)
 *
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
export function authenticateUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  // First authenticate
  authenticate(req, res, (_) => {
    // Check if user type is 'user'
    if (req.user?.type !== 'user') {
      log.warn('User authentication required but admin token provided', {
        requestId: req.requestId,
        userType: req.user?.type,
      });

      res.status(403).json({
        success: false,
        message: 'User authentication required',
        error: {
          code: 'USER_ONLY',
          message: 'This endpoint is only accessible by users',
        },
        timestamp: Date.now(),
      });
      return;
    }

    next();
  });
}

/**
 * Authenticate admin only (reject if user token)
 *
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
export function authenticateAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  // First authenticate
  authenticate(req, res, (_) => {
    // Check if user type is 'admin'
    if (req.user?.type !== 'admin') {
      log.warn('Admin authentication required but user token provided', {
        requestId: req.requestId,
        userType: req.user?.type,
      });

      res.status(403).json({
        success: false,
        message: 'Admin authentication required',
        error: {
          code: 'ADMIN_ONLY',
          message: 'This endpoint is only accessible by administrators',
        },
        timestamp: Date.now(),
      });
      return;
    }

    next();
  });
}
