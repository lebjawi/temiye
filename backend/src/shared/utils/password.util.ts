import * as bcrypt from 'bcrypt';

/**
 * Password Utility - bcrypt hashing and verification
 *
 * Handles secure password hashing with bcrypt (10 rounds)
 */

const SALT_ROUNDS = 10;

/**
 * Hash a plain text password
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * Verify a plain text password against a hash
 */
export async function verifyPassword(plainPassword: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hash);
}
