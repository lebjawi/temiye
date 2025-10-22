import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../../../shared/errors/UnauthorizedError';
import { verifyToken, JwtPayload } from '../../../shared/utils/jwt.util';

/**
 * Extend Express Request to include user property
 * Note: Using the same type as in auth middleware to avoid conflicts
 */
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & { isAdmin?: boolean };
    }
  }
}

/**
 * JWT Authentication Middleware
 *
 * Verifies JWT token from Authorization header
 * Attaches decoded user to req.user
 */
export function authenticateJWT(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedError('No authorization header');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedError('Invalid authorization format. Expected: Bearer <token>');
    }

    const token = parts[1];
    const payload = verifyToken(token);

    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else {
      next(new UnauthorizedError('Invalid token'));
    }
  }
}
