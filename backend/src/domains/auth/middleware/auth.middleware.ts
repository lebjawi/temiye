import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import { UnauthorizedError } from '../../../shared/errors/UnauthorizedError';
import { ForbiddenError } from '../../../shared/errors/ForbiddenError';
import { verifyToken, JwtPayload } from '../../../shared/utils/jwt.util';
import { UserRepository } from '../../user/repositories/user.repository';
import { AdminRepository } from '../../admin/repositories/admin.repository';
import { getDb } from '../../../shared/config/firebase.config';

// Extend Express Request type to include user data
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & { isAdmin?: boolean };
    }
  }
}

/**
 * JWT Authentication Middleware
 * Validates JWT token and injects user data into req.user
 * Used for protecting community user routes
 */
export const authenticateJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authorization token required');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify and decode JWT
    const decoded = verifyToken(token);

    // Attach user data to request
    req.user = decoded;

    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      next(new UnauthorizedError('Invalid token'));
    } else if (error.name === 'TokenExpiredError') {
      next(new UnauthorizedError('Token expired'));
    } else {
      next(error);
    }
  }
};

/**
 * Firebase Token Authentication Middleware
 * Validates Firebase OAuth token and injects admin data into req.user
 * Used for protecting admin routes
 */
export const authenticateFirebase = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authorization token required');
    }

    const token = authHeader.substring(7);

    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Find admin by Firebase UID
    const db = getDb();
    const adminRepository = new AdminRepository(db);
    const adminUser = await adminRepository.findByFirebaseUid(decodedToken.uid);

    if (!adminUser) {
      throw new ForbiddenError('Admin account not found');
    }

    if (adminUser.status !== 'approved') {
      throw new ForbiddenError('Admin account not approved');
    }

    // Inject admin data into request
    req.user = {
      userId: adminUser.id,
      phone: adminUser.email,
      role: 'admin',
      tier: 'admin',
      status: adminUser.status,
      isAdmin: true
    };

    next();
  } catch (error: any) {
    if (error.code === 'auth/id-token-expired') {
      next(new UnauthorizedError('Firebase token expired'));
    } else if (error.code?.startsWith('auth/')) {
      next(new UnauthorizedError('Invalid Firebase token'));
    } else {
      next(error);
    }
  }
};

/**
 * Generic Authentication Middleware
 * Accepts both JWT and Firebase tokens
 * Tries JWT first, then Firebase if JWT fails
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Authorization token required'));
  }

  const token = authHeader.substring(7);

  // Try JWT first
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    return next();
  } catch (jwtError) {
    // If JWT fails, try Firebase token
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      const db = getDb();
      const adminRepository = new AdminRepository(db);
      const adminUser = await adminRepository.findByFirebaseUid(decodedToken.uid);

      if (!adminUser || adminUser.status !== 'approved') {
        throw new ForbiddenError('Admin account not found or not approved');
      }

      req.user = {
        userId: adminUser.id,
        phone: adminUser.email,
        role: 'admin',
        tier: 'admin',
        status: adminUser.status,
        isAdmin: true
      };

      return next();
    } catch (firebaseError) {
      return next(new UnauthorizedError('Invalid or expired token'));
    }
  }
};

/**
 * Role-Based Authorization Middleware
 * Requires user to have one of the specified roles
 *
 * @param roles - Array of allowed role names
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    const userRole = req.user.role;

    if (!roles.includes(userRole)) {
      return next(
        new ForbiddenError(`Access denied. Required roles: ${roles.join(', ')}`)
      );
    }

    next();
  };
};

/**
 * Require Active User Status
 * Ensures user is active (not pending/banned/inactive)
 */
export const requireActive = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required'));
  }

  if (req.user.status !== 'active' && req.user.status !== 'approved') {
    return next(new ForbiddenError('Account is not active'));
  }

  next();
};

/**
 * Require Admin Access
 * Shortcut for requireRole(['admin'])
 */
export const requireAdmin = requireRole(['admin']);

/**
 * Optional Authentication Middleware
 * Injects user data if token is present, but doesn't fail if missing
 * Useful for endpoints that have different behavior for authenticated users
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // No token, continue without user data
  }

  const token = authHeader.substring(7);

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
  } catch (error) {
    // Ignore errors, just don't inject user data
  }

  next();
};
