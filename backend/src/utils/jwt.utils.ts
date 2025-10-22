/**
 * JWT Utilities
 *
 * Handles JWT token generation, verification, and refresh logic
 * Used for both user and admin authentication
 */

import jwt from 'jsonwebtoken';
import { createLogger } from './logger.utils';

const log = createLogger(__filename);

/**
 * JWT Payload interface
 * Defines the structure of data stored in JWT tokens
 */
export interface JwtPayload {
  sub: string; // Subject (user ID or admin ID)
  phone?: string; // User phone number (for users only)
  email?: string; // Admin email (for admins only)
  type: 'user' | 'admin'; // User type
  roleId?: string; // Role ID (for users)
  permissions?: Record<string, boolean>; // Admin permissions
  iat: number; // Issued at
  exp: number; // Expiration time
  deviceId?: string; // Device ID (for users)
}

/**
 * Get JWT secret from environment
 * Throws error if not configured
 */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  if (secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }

  return secret;
}

/**
 * Get JWT expiry time in seconds
 */
function getJwtExpiry(userType: 'user' | 'admin'): number {
  const hours = parseInt(process.env.JWT_EXPIRY_HOURS || '24', 10);

  // Users get longer tokens (7 days), admins get shorter (24 hours)
  if (userType === 'user') {
    return 7 * 24 * 60 * 60; // 7 days
  }

  return hours * 60 * 60; // Hours to seconds
}

/**
 * Generate JWT token
 *
 * @param userId - User or admin ID
 * @param userType - 'user' or 'admin'
 * @param additionalPayload - Additional data to include in token
 * @returns Object with token and expiry information
 *
 * @example
 * const { token, expiresIn } = generateToken('user_123', 'user', {
 *   phone: '+222123456789',
 *   roleId: 'role_member'
 * });
 */
export function generateToken(
  userId: string,
  userType: 'user' | 'admin',
  additionalPayload: Partial<Omit<JwtPayload, 'sub' | 'type' | 'iat' | 'exp'>> = {}
): { token: string; expiresIn: number } {
  const expiresIn = getJwtExpiry(userType);

  const payload: JwtPayload = {
    sub: userId,
    type: userType,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + expiresIn,
    ...additionalPayload,
  };

  const token = jwt.sign(payload, getJwtSecret());

  log.debug('JWT token generated', {
    userId,
    userType,
    expiresIn: `${expiresIn}s`,
  });

  return { token, expiresIn };
}

/**
 * Verify JWT token
 *
 * @param token - JWT token string
 * @returns Decoded JWT payload
 * @throws Error if token is invalid, expired, or malformed
 *
 * @example
 * try {
 *   const payload = verifyToken(token);
 *   console.log('User ID:', payload.sub);
 * } catch (error) {
 *   console.error('Invalid token');
 * }
 */
export function verifyToken(token: string): JwtPayload {
  try {
    const payload = jwt.verify(token, getJwtSecret()) as JwtPayload;

    log.debug('JWT token verified', {
      userId: payload.sub,
      userType: payload.type,
    });

    return payload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      log.warn('JWT token expired', {
        expiredAt: error.expiredAt,
      });
      throw new Error('Token has expired');
    }

    if (error instanceof jwt.JsonWebTokenError) {
      log.warn('Invalid JWT token', {
        error: error.message,
      });
      throw new Error('Invalid token');
    }

    log.error('JWT verification failed', error as Error);
    throw new Error('Token verification failed');
  }
}

/**
 * Decode JWT token without verification
 * Useful for extracting payload without validating signature
 *
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 *
 * @example
 * const payload = decodeToken(token);
 * if (payload) {
 *   console.log('Token expires at:', new Date(payload.exp * 1000));
 * }
 */
export function decodeToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.decode(token) as JwtPayload;
    return decoded;
  } catch (error) {
    log.warn('Failed to decode JWT token', { error: (error as Error).message });
    return null;
  }
}

/**
 * Check if token is expired
 *
 * @param token - JWT token string
 * @returns True if token is expired, false otherwise
 *
 * @example
 * if (isTokenExpired(token)) {
 *   console.log('Please login again');
 * }
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);

  if (!decoded || !decoded.exp) {
    return true;
  }

  const now = Math.floor(Date.now() / 1000);
  return decoded.exp < now;
}

/**
 * Get time until token expiration
 *
 * @param token - JWT token string
 * @returns Seconds until expiration, or 0 if expired/invalid
 *
 * @example
 * const secondsRemaining = getTokenTimeRemaining(token);
 * console.log(`Token expires in ${secondsRemaining} seconds`);
 */
export function getTokenTimeRemaining(token: string): number {
  const decoded = decodeToken(token);

  if (!decoded || !decoded.exp) {
    return 0;
  }

  const now = Math.floor(Date.now() / 1000);
  const remaining = decoded.exp - now;

  return remaining > 0 ? remaining : 0;
}

/**
 * Refresh token if it's close to expiration
 *
 * @param token - Current JWT token
 * @param thresholdSeconds - Refresh if less than this many seconds remaining (default: 1 hour)
 * @returns New token if refreshed, null if not needed
 *
 * @example
 * const newToken = refreshTokenIfNeeded(currentToken);
 * if (newToken) {
 *   // Update token in storage
 *   localStorage.setItem('token', newToken.token);
 * }
 */
export function refreshTokenIfNeeded(
  token: string,
  thresholdSeconds: number = 3600
): { token: string; expiresIn: number } | null {
  const remaining = getTokenTimeRemaining(token);

  if (remaining === 0 || remaining > thresholdSeconds) {
    return null;
  }

  const decoded = decodeToken(token);
  if (!decoded) {
    return null;
  }

  log.info('Refreshing JWT token', {
    userId: decoded.sub,
    userType: decoded.type,
    remainingSeconds: remaining,
  });

  // Generate new token with same payload (except iat/exp)
  const { sub, type, ...additionalPayload } = decoded;
  return generateToken(sub, type, additionalPayload);
}

/**
 * Extract token from Authorization header
 *
 * @param authHeader - Authorization header value (e.g., "Bearer token123")
 * @returns Token string or null if invalid format
 *
 * @example
 * const token = extractTokenFromHeader(req.headers.authorization);
 * if (token) {
 *   const payload = verifyToken(token);
 * }
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    log.warn('Invalid authorization header format', {
      format: authHeader.substring(0, 20) + '...',
    });
    return null;
  }

  return parts[1];
}
