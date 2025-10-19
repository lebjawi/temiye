/**
 * Environment Variable Loader & Validator
 *
 * This file MUST be imported first in server.ts before any other imports
 * to ensure environment variables are loaded and validated before Firebase initialization
 */
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from backend/.env file
dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * Required environment variables
 */
const REQUIRED_ENV_VARS = [
  'PROJECT_ID',
  'PRIVATE_KEY',
  'CLIENT_EMAIL',
  'JWT_SECRET'
] as const;

/**
 * Optional environment variables with defaults
 */
const OPTIONAL_ENV_VARS = {
  PORT: '3000',
  NODE_ENV: 'development',
  JWT_EXPIRY_DAYS: '7',
  DEFAULT_PAGE_LIMIT: '20',
  MAX_PAGE_LIMIT: '100'
} as const;

/**
 * Validate required environment variables
 */
function validateEnvironment(): void {
  const missingVars: string[] = [];

  // Check required variables
  for (const varName of REQUIRED_ENV_VARS) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\nPlease check your .env file and ensure all required variables are set.');
    process.exit(1);
  }

  // Set defaults for optional variables
  for (const [key, defaultValue] of Object.entries(OPTIONAL_ENV_VARS)) {
    if (!process.env[key]) {
      process.env[key] = defaultValue;
      console.warn(`⚠️  ${key} not set, using default: ${defaultValue}`);
    }
  }

  // Validate JWT_SECRET strength
  const jwtSecret = process.env.JWT_SECRET!;
  if (jwtSecret.length < 32) {
    console.error('❌ JWT_SECRET must be at least 32 characters long');
    console.error(`   Current length: ${jwtSecret.length} characters`);
    process.exit(1);
  }

  // Validate PRIVATE_KEY format
  const privateKey = process.env.PRIVATE_KEY!;
  if (!privateKey.includes('BEGIN PRIVATE KEY') && !privateKey.includes('BEGIN RSA PRIVATE KEY')) {
    console.error('❌ PRIVATE_KEY appears to be invalid format');
    console.error('   Expected PEM format starting with "-----BEGIN PRIVATE KEY-----"');
    process.exit(1);
  }

  // Validate NODE_ENV
  const validEnvironments = ['development', 'production', 'staging', 'test'];
  const nodeEnv = process.env.NODE_ENV || 'development';
  if (!validEnvironments.includes(nodeEnv)) {
    console.warn(`⚠️  Invalid NODE_ENV: ${nodeEnv}. Must be one of: ${validEnvironments.join(', ')}`);
    console.warn('   Defaulting to "development"');
    process.env.NODE_ENV = 'development';
  }

  // Validate numeric environment variables
  const jwtExpiryDays = parseInt(process.env.JWT_EXPIRY_DAYS!, 10);
  if (isNaN(jwtExpiryDays) || jwtExpiryDays < 1 || jwtExpiryDays > 365) {
    console.warn('⚠️  JWT_EXPIRY_DAYS must be between 1 and 365. Using default: 7');
    process.env.JWT_EXPIRY_DAYS = '7';
  }

  const port = parseInt(process.env.PORT!, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    console.warn('⚠️  PORT must be between 1 and 65535. Using default: 3000');
    process.env.PORT = '3000';
  }

  console.log('✅ Environment validation passed');
  console.log(`   - PROJECT_ID: ${process.env.PROJECT_ID}`);
  console.log(`   - CLIENT_EMAIL: ${process.env.CLIENT_EMAIL}`);
  console.log(`   - NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`   - PORT: ${process.env.PORT}`);
  console.log(`   - JWT_EXPIRY_DAYS: ${process.env.JWT_EXPIRY_DAYS} days`);
}

// Run validation
validateEnvironment();
