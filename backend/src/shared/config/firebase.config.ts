import * as admin from 'firebase-admin';
import { Firestore } from 'firebase-admin/firestore';

/**
 * Firebase Admin SDK Configuration
 *
 * Initializes Firebase Admin SDK for Firestore access
 *
 * Note: Environment variables are loaded by server.ts before this module is imported
 */
export class FirebaseService {
  private static instance: FirebaseService;
  private db: Firestore;

  private constructor() {
    // Initialize Firebase Admin SDK with service account from env vars
    if (!admin.apps.length) {
      // Validate required environment variables
      if (!process.env.PROJECT_ID) {
        throw new Error('PROJECT_ID environment variable is required');
      }
      if (!process.env.PRIVATE_KEY) {
        throw new Error('PRIVATE_KEY environment variable is required');
      }
      if (!process.env.CLIENT_EMAIL) {
        throw new Error('CLIENT_EMAIL environment variable is required');
      }

      const serviceAccount = {
        type: process.env.TYPE || 'service_account',
        project_id: process.env.PROJECT_ID,
        private_key_id: process.env.PRIVATE_KEY_ID,
        private_key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.CLIENT_EMAIL,
        client_id: process.env.CLIENT_ID,
        auth_uri: process.env.AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
        token_uri: process.env.TOKEN_URI || 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
        universe_domain: process.env.UNIVERSE_DOMAIN || 'googleapis.com'
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        storageBucket: `${process.env.PROJECT_ID}.firebasestorage.app`
      });
    }

    this.db = admin.firestore();

    // Configure Firestore settings
    this.db.settings({
      ignoreUndefinedProperties: true
    });
  }

  /**
   * Get singleton instance of FirebaseService
   */
  public static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  /**
   * Get Firestore instance
   */
  public getFirestore(): Firestore {
    return this.db;
  }
}

/**
 * Lazy-initialized singleton getter
 * This ensures environment variables are loaded before Firebase initialization
 */
export const getFirebaseService = (): FirebaseService => {
  return FirebaseService.getInstance();
};

/**
 * Lazy-initialized Firestore getter
 */
export const getDb = (): Firestore => {
  return getFirebaseService().getFirestore();
};

/**
 * Firestore Collection Names
 *
 * Centralized collection name constants for all domains
 * Use these constants instead of hardcoded strings to avoid typos
 */
export const COLLECTIONS = {
  // Configuration
  CONFIG: 'config',
  ROLES: 'roles',
  TIERS: 'tiers',

  // Identity & Auth
  USERS: 'users',
  ADMINS: 'admins',
  PASSWORD_RESET_TOKENS: 'password_reset_tokens',

  // Core Features
  BOARDS: 'boards',
  TRANSACTIONS: 'transactions',
  ANNOUNCEMENTS: 'announcements',

  // Voting
  ELECTIONS: 'elections',
  VOTES: 'votes',

  // Storage
  FILES: 'files',

  // Blog
  BLOGS: 'blogs',

  // Audit
  AUDIT_LOGS: 'audit_logs'
} as const;

/**
 * Special Document IDs
 */
export const DOCUMENT_IDS = {
  SETTINGS: 'settings' // config/settings document
} as const;
