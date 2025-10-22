/**
 * Database Configuration
 *
 * Firestore connection and health check utilities
 * Provides centralized database access and monitoring
 */

import { db } from './firebase';
import logger from './logger';

/**
 * Firestore Database Instance
 * Re-exported for convenience
 */
export { db };

/**
 * Check database connection health
 *
 * Performs a simple query to verify Firestore is accessible
 * This is useful for health check endpoints and startup validation
 *
 * @returns Promise<boolean> - True if connection is healthy, false otherwise
 *
 * @example
 * const isHealthy = await checkDatabaseHealth();
 * if (!isHealthy) {
 *   throw new Error('Database connection failed');
 * }
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    // Attempt a simple query to verify connection
    // We use a system collection that should always exist
    await db.collection('_health_check').limit(1).get();

    logger.info('Database health check passed', {
      filePath: 'src/config/database.ts',
    });

    return true;
  } catch (error) {
    logger.error('Database health check failed', error as Error, {
      filePath: 'src/config/database.ts',
    });

    return false;
  }
}

/**
 * Initialize database connection
 *
 * Verifies Firestore connection on application startup
 * Logs connection status and throws error if connection fails
 *
 * @throws Error if database connection cannot be established
 *
 * @example
 * await initializeDatabase();
 */
export async function initializeDatabase(): Promise<void> {
  logger.info('Initializing database connection...', {
    filePath: 'src/config/database.ts',
  });

  const isHealthy = await checkDatabaseHealth();

  if (!isHealthy) {
    throw new Error(
      'Failed to connect to Firestore. Please check your Firebase credentials and network connection.'
    );
  }

  logger.info('Database connection established successfully', {
    filePath: 'src/config/database.ts',
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

/**
 * Get database statistics
 *
 * Returns basic information about the database configuration
 * Useful for debugging and monitoring
 *
 * @returns Object with database configuration details
 */
export function getDatabaseInfo(): {
  projectId: string | undefined;
  connected: boolean;
  environment: string;
} {
  return {
    projectId: process.env.FIREBASE_PROJECT_ID,
    connected: db !== null && db !== undefined,
    environment: process.env.NODE_ENV || 'development',
  };
}

/**
 * Gracefully close database connection
 *
 * Note: Firestore Admin SDK doesn't require explicit connection closing,
 * but this function is provided for consistency and future-proofing
 *
 * @example
 * await closeDatabaseConnection();
 */
export async function closeDatabaseConnection(): Promise<void> {
  logger.info('Closing database connection...', {
    filePath: 'src/config/database.ts',
  });

  // Firestore Admin SDK handles connection pooling automatically
  // No explicit close needed, but we log for consistency
  logger.info('Database connection closed', {
    filePath: 'src/config/database.ts',
  });
}

/**
 * Firestore collection names
 * Centralized constants for all collection names to avoid typos
 */
export const Collections = {
  USERS: 'users',
  USER_AUTH: 'user_auth',
  ADMINS: 'admins',
  ROLES: 'roles',
  TIERS: 'tiers',
  BOARDS: 'boards',
  ACCOUNTS: 'accounts',
  TRANSACTIONS: 'transactions',
  ELECTIONS: 'elections',
  VOTES: 'votes',
  ELECTION_RESULTS: 'election_results',
  ANNOUNCEMENTS: 'announcements',
  PASSWORD_RESETS: 'password_resets',
  ADMIN_ACTIONS: 'admin_actions',
  COMMUNITY_EVENTS: 'community_events',
  SYSTEM_METRICS: 'system_metrics',
  SYNC_METADATA: 'sync_metadata',
  SYSTEM_CONFIG: 'system_config',
} as const;

/**
 * Type for collection names
 * Ensures type safety when referencing collections
 */
export type CollectionName = (typeof Collections)[keyof typeof Collections];

/**
 * Get collection reference by name
 *
 * Helper function to get strongly-typed collection references
 *
 * @param collectionName - Name of the collection
 * @returns Firestore CollectionReference
 *
 * @example
 * const usersRef = getCollection(Collections.USERS);
 * const users = await usersRef.limit(10).get();
 */
export function getCollection(collectionName: CollectionName) {
  return db.collection(collectionName);
}
