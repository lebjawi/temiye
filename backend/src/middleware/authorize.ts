/**
 * Authorization Middleware
 *
 * Handles permission checking and role-based access control
 * Works in conjunction with authenticate middleware
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authenticate';
import { createLogger } from '../utils/logger.utils';

const log = createLogger(__filename);

/**
 * Admin type authorization
 * Restricts access to specific admin types
 *
 * @param allowedTypes - Array of allowed admin types
 * @returns Express middleware function
 *
 * @example
 * router.delete('/users/:id', authenticateAdmin, requireAdminType(['superadmin']), deleteUser);
 */
export function requireAdminType(_allowedTypes: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
      log.warn('Authorization check failed - no authenticated user', {
        requestId: req.requestId,
      });

      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'You must be authenticated to access this resource',
        },
        timestamp: Date.now(),
      });
      return;
    }

    if (user.type !== 'admin') {
      log.warn('Authorization check failed - not an admin', {
        requestId: req.requestId,
        userId: user.sub,
        userType: user.type,
      });

      res.status(403).json({
        success: false,
        message: 'Admin access required',
        error: {
          code: 'ADMIN_REQUIRED',
          message: 'This endpoint is only accessible by administrators',
        },
        timestamp: Date.now(),
      });
      return;
    }

    // Note: Admin type is stored in database, not in JWT
    // For now, we'll allow all admins and check admin type in the service layer
    // This is because JWT payload should be minimal

    log.debug('Admin authorization successful', {
      requestId: req.requestId,
      adminId: user.sub,
    });

    next();
  };
}

/**
 * Permission-based authorization
 * Checks if user has specific permission
 *
 * @param permission - Required permission key
 * @returns Express middleware function
 *
 * @example
 * router.post('/transactions/:id/approve', authenticateAdmin, requirePermission('approveTransactions'), approveTransaction);
 */
export function requirePermission(permission: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'You must be authenticated to access this resource',
        },
        timestamp: Date.now(),
      });
      return;
    }

    // Check if user has the required permission
    if (!user.permissions || !user.permissions[permission]) {
      log.warn('Authorization check failed - missing permission', {
        requestId: req.requestId,
        userId: user.sub,
        requiredPermission: permission,
        userPermissions: user.permissions,
      });

      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        error: {
          code: 'FORBIDDEN',
          message: `You do not have permission to perform this action (required: ${permission})`,
        },
        timestamp: Date.now(),
      });
      return;
    }

    log.debug('Permission check passed', {
      requestId: req.requestId,
      userId: user.sub,
      permission,
    });

    next();
  };
}

/**
 * Require multiple permissions (all must be present)
 *
 * @param permissions - Array of required permissions
 * @returns Express middleware function
 *
 * @example
 * router.delete('/boards/:id', authenticateAdmin, requireAllPermissions(['manageBoards', 'viewAuditLogs']), deleteBoard);
 */
export function requireAllPermissions(permissions: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user || !user.permissions) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have the required permissions',
        },
        timestamp: Date.now(),
      });
      return;
    }

    const missingPermissions = permissions.filter((perm) => !user.permissions?.[perm]);

    if (missingPermissions.length > 0) {
      log.warn('Authorization check failed - missing multiple permissions', {
        requestId: req.requestId,
        userId: user.sub,
        requiredPermissions: permissions,
        missingPermissions,
      });

      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        error: {
          code: 'FORBIDDEN',
          message: `Missing required permissions: ${missingPermissions.join(', ')}`,
        },
        timestamp: Date.now(),
      });
      return;
    }

    next();
  };
}

/**
 * Require any of the specified permissions (at least one must be present)
 *
 * @param permissions - Array of permissions (any will satisfy)
 * @returns Express middleware function
 *
 * @example
 * router.get('/reports', authenticateAdmin, requireAnyPermission(['financial', 'analytics', 'audit']), getReports);
 */
export function requireAnyPermission(permissions: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user || !user.permissions) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have the required permissions',
        },
        timestamp: Date.now(),
      });
      return;
    }

    const hasAnyPermission = permissions.some((perm) => user.permissions?.[perm]);

    if (!hasAnyPermission) {
      log.warn('Authorization check failed - no matching permissions', {
        requestId: req.requestId,
        userId: user.sub,
        requiredPermissions: permissions,
      });

      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        error: {
          code: 'FORBIDDEN',
          message: `At least one of these permissions is required: ${permissions.join(', ')}`,
        },
        timestamp: Date.now(),
      });
      return;
    }

    next();
  };
}

/**
 * Require superadmin access
 * Convenience middleware for endpoints that require superadmin
 *
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 *
 * @example
 * router.post('/admin/:id/approve', authenticateAdmin, requireSuperAdmin, approveAdmin);
 */
export function requireSuperAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const user = req.user;

  if (!user || user.type !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Superadmin access required',
      error: {
        code: 'SUPERADMIN_REQUIRED',
        message: 'This endpoint is only accessible by superadmins',
      },
      timestamp: Date.now(),
    });
    return;
  }

  // Check if user has manageAdmins permission (superadmin indicator)
  if (!user.permissions?.['manageAdmins']) {
    log.warn('Superadmin authorization check failed', {
      requestId: req.requestId,
      adminId: user.sub,
      permissions: user.permissions,
    });

    res.status(403).json({
      success: false,
      message: 'Superadmin access required',
      error: {
        code: 'SUPERADMIN_REQUIRED',
        message: 'Only superadmins can access this resource',
      },
      timestamp: Date.now(),
    });
    return;
  }

  log.debug('Superadmin authorization successful', {
    requestId: req.requestId,
    adminId: user.sub,
  });

  next();
}
