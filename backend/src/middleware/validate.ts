/**
 * Validation Middleware
 *
 * Handles request validation using express-validator
 * Provides consistent error formatting for validation failures
 */

import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError as ExpressValidationError } from 'express-validator';
import { createLogger } from '../utils/logger.utils';
import { AuthenticatedRequest } from './authenticate';

const log = createLogger(__filename);

/**
 * Validation middleware
 * Checks validation results from express-validator rules
 * Returns 422 with formatted errors if validation fails
 *
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 *
 * @example
 * import { body } from 'express-validator';
 * import { validate } from '@middleware/validate';
 *
 * router.post('/register',
 *   body('phone').isMobilePhone('any'),
 *   body('password').isLength({ min: 8 }),
 *   validate,
 *   register
 * );
 */
export function validate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    next();
    return;
  }

  const errorArray = errors.array();

  log.warn('Validation failed', {
    requestId: req.requestId,
    url: req.url,
    method: req.method,
    errors: errorArray,
  });

  // Format errors for response
  const formattedErrors = errorArray.map((error: ExpressValidationError) => ({
    field: 'path' in error ? error.path : 'unknown',
    message: error.msg,
    value: 'value' in error ? error.value : undefined,
  }));

  res.status(422).json({
    success: false,
    message: 'Validation failed',
    error: {
      code: 'VALIDATION_ERROR',
      message: 'One or more fields failed validation',
      details: formattedErrors,
    },
    timestamp: Date.now(),
  });
}

/**
 * Validation error formatter
 * Converts express-validator errors to consistent format
 *
 * @param errors - Array of validation errors
 * @returns Formatted error object
 */
export function formatValidationErrors(errors: ExpressValidationError[]): {
  field: string;
  message: string;
  value?: unknown;
}[] {
  return errors.map((error) => ({
    field: 'path' in error ? error.path : 'unknown',
    message: error.msg,
    value: 'value' in error ? error.value : undefined,
  }));
}

/**
 * Check if request has validation errors
 *
 * @param req - Express request
 * @returns True if validation errors exist
 */
export function hasValidationErrors(req: Request): boolean {
  const errors = validationResult(req);
  return !errors.isEmpty();
}

/**
 * Get validation errors from request
 *
 * @param req - Express request
 * @returns Array of formatted validation errors
 */
export function getValidationErrors(req: Request): {
  field: string;
  message: string;
  value?: unknown;
}[] {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return [];
  }

  return formatValidationErrors(errors.array());
}
