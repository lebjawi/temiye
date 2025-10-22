/**
 * Auth Validators
 *
 * Input validation rules for user authentication endpoints
 * Uses express-validator
 */

import { body } from 'express-validator';

/**
 * Mauritanian phone number format: +222XXXXXXXX
 * 222 is the country code, followed by 8 digits
 */
const MAURITANIA_PHONE_REGEX = /^\+222\d{8}$/;

/**
 * Password requirements:
 * - Minimum 8 characters
 * - At least one number
 * - At least one special character
 * - At least one uppercase letter
 * - At least one lowercase letter
 */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

/**
 * Validation rules for user registration
 */
export const registerValidation = [
  body('phone')
    .isString()
    .withMessage('Phone number must be a string')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(MAURITANIA_PHONE_REGEX)
    .withMessage('Phone number must be in format +222XXXXXXXX (Mauritanian number)'),

  body('nameAr')
    .isString()
    .withMessage('Arabic name must be a string')
    .notEmpty()
    .withMessage('Arabic name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Arabic name must be between 2 and 100 characters'),

  body('nameFr')
    .optional()
    .isString()
    .withMessage('French name must be a string')
    .isLength({ min: 2, max: 100 })
    .withMessage('French name must be between 2 and 100 characters'),

  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail(),

  body('password')
    .isString()
    .withMessage('Password must be a string')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(PASSWORD_REGEX)
    .withMessage(
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),

  body('deviceId')
    .isString()
    .withMessage('Device ID must be a string')
    .notEmpty()
    .withMessage('Device ID is required')
    .isLength({ min: 5, max: 100 })
    .withMessage('Device ID must be between 5 and 100 characters'),

  body('deviceName')
    .optional()
    .isString()
    .withMessage('Device name must be a string')
    .isLength({ max: 100 })
    .withMessage('Device name must be less than 100 characters'),
];

/**
 * Validation rules for user login
 */
export const loginValidation = [
  body('phone')
    .isString()
    .withMessage('Phone number must be a string')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(MAURITANIA_PHONE_REGEX)
    .withMessage('Phone number must be in format +222XXXXXXXX'),

  body('password')
    .isString()
    .withMessage('Password must be a string')
    .notEmpty()
    .withMessage('Password is required'),

  body('deviceId')
    .isString()
    .withMessage('Device ID must be a string')
    .notEmpty()
    .withMessage('Device ID is required'),
];

/**
 * Validation rules for change password
 */
export const changePasswordValidation = [
  body('oldPassword')
    .isString()
    .withMessage('Old password must be a string')
    .notEmpty()
    .withMessage('Old password is required'),

  body('newPassword')
    .isString()
    .withMessage('New password must be a string')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8, max: 128 })
    .withMessage('New password must be between 8 and 128 characters')
    .matches(PASSWORD_REGEX)
    .withMessage(
      'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
];

/**
 * Validation rules for forgot password
 */
export const forgotPasswordValidation = [
  body('phone')
    .isString()
    .withMessage('Phone number must be a string')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(MAURITANIA_PHONE_REGEX)
    .withMessage('Phone number must be in format +222XXXXXXXX'),
];

/**
 * Validation rules for reset password
 */
export const resetPasswordValidation = [
  body('phone')
    .isString()
    .withMessage('Phone number must be a string')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(MAURITANIA_PHONE_REGEX)
    .withMessage('Phone number must be in format +222XXXXXXXX'),

  body('resetCode')
    .isString()
    .withMessage('Reset code must be a string')
    .notEmpty()
    .withMessage('Reset code is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('Reset code must be 6 digits')
    .isNumeric()
    .withMessage('Reset code must be numeric'),

  body('newPassword')
    .isString()
    .withMessage('New password must be a string')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8, max: 128 })
    .withMessage('New password must be between 8 and 128 characters')
    .matches(PASSWORD_REGEX)
    .withMessage(
      'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
];
