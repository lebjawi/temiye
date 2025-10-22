/**
 * Server Entry Point
 *
 * Starts the Express server
 * Handles graceful shutdown
 * Validates database connection
 */

import * as dotenv from 'dotenv';
import app from './app';
import { initializeDatabase } from './config/database';
import { checkFirebaseHealth } from './config/firebase';
import { createLogger } from './utils/logger.utils';

// Load environment variables first
dotenv.config();

const log = createLogger(__filename);

/**
 * Get port from environment
 */
const PORT = parseInt(process.env.PORT || '8080', 10);

/**
 * Start server
 */
async function startServer(): Promise<void> {
  try {
    log.info('🚀 Starting Tenmiye Backend Server...');

    // ========================================
    // Validate Environment
    // ========================================

    log.info('Validating environment configuration...');

    const requiredEnvVars = [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_PRIVATE_KEY',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_STORAGE_BUCKET',
      'JWT_SECRET',
    ];

    const missing = requiredEnvVars.filter((key) => !process.env[key]);

    if (missing.length > 0) {
      log.error('Missing required environment variables', undefined, {
        missing,
      });
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    log.info('✓ Environment validation passed');

    // ========================================
    // Initialize Database
    // ========================================

    log.info('Initializing database connection...');
    await initializeDatabase();
    log.info('✓ Database connection established');

    // ========================================
    // Check Firebase Services
    // ========================================

    log.info('Checking Firebase services health...');
    const firebaseHealth = await checkFirebaseHealth();

    if (!firebaseHealth.firestore) {
      throw new Error('Firestore connection failed');
    }

    log.info('✓ Firebase services healthy', firebaseHealth);

    // ========================================
    // Start HTTP Server
    // ========================================

    const server = app.listen(PORT, () => {
      log.info('🎉 Server started successfully!');
      log.info(`📍 Server running at: http://localhost:${PORT}`);
      log.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      log.info(`💚 Health Check: http://localhost:${PORT}/api/health`);
      log.info(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
      log.info(`🗄️  Firebase Project: ${process.env.FIREBASE_PROJECT_ID}`);
      log.info('');
      log.info('Ready to accept requests! 🚀');
    });

    // ========================================
    // Graceful Shutdown Handlers
    // ========================================

    const gracefulShutdown = async (signal: string): Promise<void> => {
      log.info(`${signal} received. Starting graceful shutdown...`);

      server.close(() => {
        log.info('HTTP server closed');

        // Close database connections if needed
        log.info('Cleaning up resources...');

        log.info('Graceful shutdown completed');
        process.exit(0);
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        log.error('Graceful shutdown timeout. Forcing exit.', undefined);
        process.exit(1);
      }, 30000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error: Error) => {
      log.error('Uncaught Exception - shutting down', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason: unknown) => {
      log.error('Unhandled Rejection - shutting down', reason as Error);
      gracefulShutdown('UNHANDLED_REJECTION');
    });
  } catch (error) {
    log.error('Failed to start server', error as Error);
    process.exit(1);
  }
}

// Start the server
startServer();
