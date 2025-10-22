/**
 * Logger Demo - Example Usage
 *
 * This file demonstrates how to use the logger utilities
 * Run with: ts-node -r tsconfig-paths/register src/example-logger-demo.ts
 */

import { createLogger } from './utils/logger.utils';

// Create logger for this file
const log = createLogger(__filename);

/**
 * Example function that demonstrates logging
 */
async function demonstrateLogging(): Promise<void> {
  console.log('\n🎯 Starting Logger Demo...\n');

  // 1. Info level logging
  log.info('Application started successfully', {
    port: 8080,
    environment: 'development',
  });

  // 2. Debug level logging (detailed diagnostics)
  log.debug('Checking user credentials', {
    phone: '+222123456789',
    attemptNumber: 1,
  });

  // 3. Warning level logging
  log.warn('Rate limit approaching threshold', {
    currentRequests: 95,
    maxRequests: 100,
    timeWindow: '15 minutes',
  });

  // 4. Error level logging (with Error object)
  try {
    throw new Error('Database connection timeout');
  } catch (error) {
    log.error('Failed to connect to database', error as Error, {
      retryAttempt: 3,
      maxRetries: 5,
    });
  }

  // 5. Info with request context (simulating API request)
  log.info('User logged in successfully', {
    requestId: 'req_1737557445123_abc123',
    userId: 'user_xyz789',
    deviceId: 'device_mobile_001',
    loginMethod: 'phone_password',
  });

  console.log('\n✅ Logger Demo Complete!');
  console.log('📁 Check logs in: backend/logs/combined-YYYY-MM-DD.log\n');
}

// Run the demo
demonstrateLogging().catch((error) => {
  console.error('Demo failed:', error);
  process.exit(1);
});
