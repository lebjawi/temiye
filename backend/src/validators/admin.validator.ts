/**
 * Admin Validators
 *
 * Input validation rules for admin-related endpoints
 * Uses express-validator for validation
 */

import { body, param } from 'express-validator';

/**
 * Validation rules for Google authentication
 */
export const googleAuthValidation = [
  body('idToken')
    .isString()
    .withMessage('ID token must be a string')
    .notEmpty()
    .withMessage('ID token is required')
    .isLength({ min: 10 })
    .withMessage('ID token appears to be invalid'),
];

/**
 * Validation rules for admin approval
 */
export const approveAdminValidation = [
  param('id').isString().notEmpty().withMessage('Admin ID is required'),
  body('adminType')
    .isString()
    .notEmpty()
    .withMessage('Admin type is required')
    .isIn(['superadmin', 'finance_admin', 'content_admin', 'community_manager'])
    .withMessage(
      'Admin type must be one of: superadmin, finance_admin, content_admin, community_manager'
    ),
];

/**
 * Validation rules for admin suspension
 */
export const suspendAdminValidation = [
  param('id').isString().notEmpty().withMessage('Admin ID is required'),
  body('reason')
    .isString()
    .notEmpty()
    .withMessage('Suspension reason is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Reason must be between 10 and 500 characters'),
];

/**
 * Validation rules for admin reactivation
 */
export const reactivateAdminValidation = [
  param('id').isString().notEmpty().withMessage('Admin ID is required'),
];

/**
 * Validation rules for updating admin permissions
 */
export const updatePermissionsValidation = [
  param('id').isString().notEmpty().withMessage('Admin ID is required'),
  body('permissions').isObject().withMessage('Permissions must be an object'),
  body('permissions.manageAdmins').isBoolean().optional(),
  body('permissions.manageUsers').isBoolean().optional(),
  body('permissions.manageRoles').isBoolean().optional(),
  body('permissions.manageTiers').isBoolean().optional(),
  body('permissions.manageBoards').isBoolean().optional(),
  body('permissions.approveTransactions').isBoolean().optional(),
  body('permissions.viewAllFinancials').isBoolean().optional(),
  body('permissions.manageElections').isBoolean().optional(),
  body('permissions.publishAnnouncements').isBoolean().optional(),
  body('permissions.viewAuditLogs').isBoolean().optional(),
  body('permissions.manageSystemSettings').isBoolean().optional(),
];
