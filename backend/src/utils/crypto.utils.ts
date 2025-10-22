/**
 * Crypto Utilities
 *
 * Handles password hashing, verification, and secure token generation
 * Uses bcrypt for password hashing (12 rounds as per security requirements)
 *
 * CRITICAL: Passwords are NEVER stored in Firestore
 * They are hashed and stored in a separate secure collection (user_auth)
 */

import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { createLogger } from './logger.utils';

const log = createLogger(__filename);

/**
 * Get bcrypt rounds from environment
 * Default: 12 rounds (good balance of security and performance)
 */
function getBcryptRounds(): number {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);

  if (rounds < 10) {
    log.warn('Bcrypt rounds too low, using minimum of 10', { configured: rounds });
    return 10;
  }

  if (rounds > 15) {
    log.warn('Bcrypt rounds very high, may cause performance issues', { configured: rounds });
  }

  return rounds;
}

/**
 * Hash a password using bcrypt
 *
 * @param password - Plain text password
 * @returns Hashed password string
 *
 * @example
 * const hashedPassword = await hashPassword('MySecurePass123!');
 * // Store hashedPassword in user_auth collection (NOT in users collection)
 */
export async function hashPassword(password: string): Promise<string> {
  const rounds = getBcryptRounds();

  log.debug('Hashing password', { rounds });

  const salt = await bcrypt.genSalt(rounds);
  const hashedPassword = await bcrypt.hash(password, salt);

  log.debug('Password hashed successfully');

  return hashedPassword;
}

/**
 * Verify password against hash
 *
 * @param password - Plain text password to verify
 * @param hashedPassword - Bcrypt hash to compare against
 * @returns True if password matches, false otherwise
 *
 * @example
 * const isValid = await verifyPassword(userInput, storedHash);
 * if (isValid) {
 *   // Password correct, allow login
 * }
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);

    if (isMatch) {
      log.debug('Password verification successful');
    } else {
      log.debug('Password verification failed - incorrect password');
    }

    return isMatch;
  } catch (error) {
    log.error('Password verification error', error as Error);
    return false;
  }
}

/**
 * Generate secure random token
 *
 * @param length - Length of token in bytes (default: 32)
 * @returns Hex-encoded random token
 *
 * @example
 * const resetToken = generateSecureToken(32);
 * // Use for password reset, email verification, etc.
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate secure random code (numeric)
 *
 * @param digits - Number of digits (default: 6)
 * @returns Numeric code as string
 *
 * @example
 * const code = generateSecureCode(6);
 * // Returns: "482719" (6-digit code for SMS verification)
 */
export function generateSecureCode(digits: number = 6): string {
  const max = Math.pow(10, digits);
  const code = crypto.randomInt(0, max).toString().padStart(digits, '0');

  log.debug('Secure code generated', { digits });

  return code;
}

/**
 * Hash data with SHA-256
 *
 * @param data - Data to hash (string or buffer)
 * @returns SHA-256 hash in hexadecimal
 *
 * @example
 * const fileHash = hashSha256(fileBuffer);
 * // Store hash to verify file integrity later
 */
export function hashSha256(data: string | Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Validate password strength
 *
 * @param password - Password to validate
 * @returns Object with validation result and error messages
 *
 * @example
 * const validation = validatePasswordStrength('weak');
 * if (!validation.isValid) {
 *   console.log(validation.errors);
 * }
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Minimum length
  const minLength = parseInt(process.env.PASSWORD_MIN_LENGTH || '8', 10);
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }

  // Maximum length (prevent DoS)
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }

  // Require number
  if (process.env.PASSWORD_REQUIRE_NUMBER !== 'false' && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Require special character
  if (
    process.env.PASSWORD_REQUIRE_SPECIAL_CHAR !== 'false' &&
    !/[!@#$%^&*(),.?":{}|<>]/.test(password)
  ) {
    errors.push('Password must contain at least one special character');
  }

  // Require uppercase
  if (process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false' && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Require lowercase
  if (process.env.PASSWORD_REQUIRE_LOWERCASE !== 'false' && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Check if password was previously used
 *
 * @param password - Plain text password
 * @param passwordHistory - Array of previously used hashed passwords
 * @returns True if password was used before, false otherwise
 *
 * @example
 * const wasUsed = await isPasswordInHistory(newPassword, user.passwordHistory);
 * if (wasUsed) {
 *   throw new Error('Cannot reuse previous passwords');
 * }
 */
export async function isPasswordInHistory(
  password: string,
  passwordHistory: string[]
): Promise<boolean> {
  for (const oldHash of passwordHistory) {
    const matches = await bcrypt.compare(password, oldHash);
    if (matches) {
      log.debug('Password found in history');
      return true;
    }
  }

  return false;
}
