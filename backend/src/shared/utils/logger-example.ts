/**
 * Logger Usage Examples
 *
 * This file demonstrates the enhanced logger capabilities.
 * Run this file to see the logger in action:
 *
 * npx ts-node src/shared/utils/logger-example.ts
 */

import { logger, createLogger, logHttpRequest, logSecurityEvent, logBusinessEvent } from './logger.util';

// ========================================
// 1. Basic Logging
// ========================================
console.log('\n📝 Basic Logging Examples:\n');

logger.info('Server started', { port: 3000, environment: 'development' });
logger.warn('Configuration missing', { key: 'DATABASE_URL' });
logger.error('Database connection failed', { error: 'Connection timeout' });
logger.debug('Cache hit', { key: 'user:123', ttl: 300 });

// ========================================
// 2. Scoped Loggers (Domain-Specific)
// ========================================
console.log('\n🎯 Scoped Logger Examples:\n');

const authLogger = createLogger('[AuthService]');
authLogger.info('User logged in', { userId: 123, method: 'phone' });
authLogger.warn('Failed login attempt', { phone: '+22212345678', attempts: 3 });
authLogger.error('Token validation failed', { token: 'abc...xyz', reason: 'expired' });

const userLogger = createLogger('[UserRepository]');
userLogger.debug('Querying users collection', { filters: { status: 'active' } });
userLogger.info('User created', { userId: 456, role: 'member' });

const dbLogger = createLogger('[Database]');
dbLogger.debug('Connection pool initialized', { size: 10, maxConnections: 20 });
dbLogger.warn('Slow query detected', { query: 'SELECT * FROM users', duration: '1250ms' });

// ========================================
// 3. Specialized Loggers
// ========================================
console.log('\n🔧 Specialized Logger Examples:\n');

// HTTP Request Logging
const mockReq = {
  method: 'POST',
  url: '/api/users/login',
  ip: '192.168.1.100',
  get: (_header: string) => 'Mozilla/5.0'
};
const mockRes = {
  statusCode: 200
};
logHttpRequest(mockReq as any, mockRes as any, 125);

// Security Event Logging
logSecurityEvent(
  'Suspicious login pattern detected',
  'high',
  {
    userId: 123,
    ipAddress: '192.168.1.100',
    failedAttempts: 5,
    timeWindow: '5 minutes'
  }
);

// Business Event Logging
logBusinessEvent('User tier upgraded', {
  userId: 456,
  fromTier: 'bronze',
  toTier: 'silver',
  reason: 'contribution_threshold_met'
});

// ========================================
// 4. Source Location Tracking
// ========================================
console.log('\n📍 Source Location Tracking (check console for file:line):\n');

function someFunction() {
  logger.info('This log will show the exact file and line number');
}

function anotherFunction() {
  const myLogger = createLogger('[MyComponent]');
  myLogger.info('This will also show source location with prefix');
}

someFunction();
anotherFunction();

// ========================================
// 5. Error Logging with Stack Traces
// ========================================
console.log('\n❌ Error Logging with Stack Traces:\n');

try {
  throw new Error('Something went wrong');
} catch (error: any) {
  logger.error('Caught exception', {
    error: error.message,
    stack: error.stack
  });
}

// ========================================
// 6. Nested Domain Loggers
// ========================================
console.log('\n🌳 Nested Domain Logger Examples:\n');

class AuthService {
  private logger = createLogger('[AuthService]');

  login(phone: string) {
    this.logger.info('Login attempt', { phone });
    this.logger.debug('Validating credentials');
    this.logger.info('Login successful', { phone });
  }

  logout(userId: number) {
    this.logger.info('User logged out', { userId });
  }
}

const authService = new AuthService();
authService.login('+22212345678');
authService.logout(123);

console.log('\n✅ All examples completed!\n');
console.log('💡 Tips:');
console.log('  - Check logs/ directory for file-based logs');
console.log('  - Source locations appear in gray at the end of each log');
console.log('  - Scoped loggers help identify which service/component logged the message');
console.log('  - All logs are automatically written to combined.log and error.log\n');
