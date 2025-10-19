import * as jwt from 'jsonwebtoken';

/**
 * JWT Utility - Token generation and verification
 */

const JWT_SECRET = process.env.JWT_SECRET || 'tenmiye';
const JWT_EXPIRY_DAYS = parseInt(process.env.JWT_EXPIRY_DAYS || '7');

export interface JwtPayload {
  userId: string;
  phone: string;
  role: string;
  tier: string;
  status: string;
}

/**
 * Generate JWT token
 */
export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: `${JWT_EXPIRY_DAYS}d`
  });
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
