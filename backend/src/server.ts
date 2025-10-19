// IMPORTANT: This MUST be the first import to load environment variables
import './env';
import { createApp } from './app';
import { logger } from './shared/utils/logger.util';
import * as admin from 'firebase-admin';
import * as http from 'http';

/**
 * Server Startup with Graceful Shutdown
 *
 * Starts the Express server on specified port
 * and handles graceful shutdown on SIGTERM/SIGINT
 */

const PORT = process.env.PORT || 3000;
const SHUTDOWN_TIMEOUT = 10000; // 10 seconds

const app = createApp();
let server: http.Server;

/**
 * Graceful shutdown handler
 * Ensures all connections are closed cleanly before exiting
 */
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  console.log(`\n⚠️  ${signal} received. Shutting down gracefully...`);

  if (server) {
    // Stop accepting new connections
    server.close(async (error) => {
      if (error) {
        logger.error('Error during server close', { error: error.message });
        console.error('❌ Error during server close:', error.message);
      } else {
        logger.info('HTTP server closed successfully');
        console.log('✅ HTTP server closed');
      }

      try {
        // Close Firebase connections
        await admin.app().delete();
        logger.info('Firebase connections closed');
        console.log('✅ Firebase connections closed');

        logger.info('Graceful shutdown completed');
        console.log('✅ Graceful shutdown completed\n');
        process.exit(0);
      } catch (firebaseError: any) {
        logger.error('Error closing Firebase', { error: firebaseError.message });
        console.error('❌ Error closing Firebase:', firebaseError.message);
        process.exit(1);
      }
    });

    // Force close after timeout
    setTimeout(() => {
      logger.error(`Shutdown timeout (${SHUTDOWN_TIMEOUT}ms) exceeded. Forcing shutdown.`);
      console.error(`❌ Shutdown timeout exceeded. Forcing shutdown.`);
      process.exit(1);
    }, SHUTDOWN_TIMEOUT);
  } else {
    logger.warn('Server not running, exiting immediately');
    process.exit(0);
  }
}

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Promise Rejection', { reason: reason?.message || reason });
  console.error('❌ Unhandled Promise Rejection:', reason);
  process.exit(1);
});

// Start server
server = app.listen(PORT, () => {
  logger.info('Server started', { port: PORT, environment: process.env.NODE_ENV });

  console.log('🚀 Tenmiye API Server started');
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`🔒 Rate limiting: ENABLED`);
  console.log(`📝 Logging: ENABLED (logs/combined.log)`);
  console.log('');
  console.log('Available endpoint groups:');
  console.log('  📊 Constants:     /api/constants');
  console.log('  👤 Users:         /api/users');
  console.log('  👥 Roles:         /api/roles');
  console.log('  🏆 Tiers:         /api/tiers');
  console.log('  🔑 Admins:        /api/admins');
  console.log('  🔐 Password:      /api/password-reset');
  console.log('  🏛️  Boards:        /api/boards');
  console.log('  💰 Transactions:  /api/transactions');
  console.log('  📢 Announcements: /api/announcements');
  console.log('  🗳️  Elections:     /api/elections');
  console.log('  ✅ Votes:         /api/votes');
  console.log('  📁 Storage:       /api/storage');
  console.log('  📝 Blogs:         /api/blogs');
  console.log('');
  console.log('Protection:');
  console.log('  ⚡ Auth endpoints: 5 requests/15min per IP');
  console.log('  🔑 Password reset: 3 requests/hour per IP');
  console.log('  📤 File uploads: 20 uploads/15min per IP');
  console.log('  📊 General API: 100 requests/15min per IP');
  console.log('');
  console.log('💡 Press Ctrl+C for graceful shutdown');
  console.log('');
});
