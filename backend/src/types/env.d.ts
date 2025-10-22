/**
 * Environment Variables Type Definitions
 *
 * Extends NodeJS ProcessEnv interface to include all environment variables
 * used in the application. This provides type safety and autocomplete.
 */

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Node Configuration
      NODE_ENV: 'development' | 'production' | 'test';
      PORT: string;

      // Firebase Configuration
      FIREBASE_PROJECT_ID: string;
      FIREBASE_PRIVATE_KEY: string;
      FIREBASE_CLIENT_EMAIL: string;
      FIREBASE_STORAGE_BUCKET: string;

      // JWT Configuration
      JWT_SECRET: string;
      JWT_EXPIRY_HOURS: string;

      // Security Settings
      BCRYPT_ROUNDS: string;
      MAX_LOGIN_ATTEMPTS: string;
      ACCOUNT_LOCKOUT_MINUTES: string;

      // Rate Limiting
      RATE_LIMIT_WINDOW_MS: string;
      RATE_LIMIT_MAX_REQUESTS: string;

      // CORS Configuration
      ALLOWED_ORIGINS: string;

      // Logging Configuration
      LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';
      LOG_FILE_ENABLED: string;
      LOG_CONSOLE_ENABLED: string;

      // Optional: SMS Provider (future)
      SMS_PROVIDER?: string;
      SMS_API_KEY?: string;
      SMS_API_SECRET?: string;

      // Optional: Email Service (future)
      EMAIL_PROVIDER?: string;
      EMAIL_API_KEY?: string;
      EMAIL_FROM?: string;
    }
  }
}

export {};
