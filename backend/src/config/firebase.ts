/**
 * Firebase Admin SDK Configuration
 *
 * Initializes Firebase Admin SDK with service account credentials
 * Provides access to Firestore, Authentication, and Cloud Storage
 *
 * MINIMAL FIREBASE STACK:
 * ✅ Firestore - Database
 * ✅ Cloud Storage - File uploads
 * ✅ Firebase Auth - Admin Google sign-in ONLY
 * ✅ Service Account - Backend access
 * ❌ NO Cloud Functions
 * ❌ NO Cloud Run
 */

import admin from 'firebase-admin';
import { Firestore } from '@google-cloud/firestore';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Validate required environment variables
 */
function validateEnvVariables(): void {
  const required = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_STORAGE_BUCKET',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required Firebase environment variables: ${missing.join(', ')}\n` +
        'Please check your .env file and ensure all Firebase credentials are set.'
    );
  }
}

// Validate environment variables before initialization
validateEnvVariables();

/**
 * Initialize Firebase Admin SDK
 * Only initializes once (singleton pattern)
 */
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Replace escaped newlines in private key
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

/**
 * Firestore Database Instance
 * Main database for all application data
 */
export const db: Firestore = admin.firestore();

/**
 * Firebase Authentication Instance
 * Used ONLY for admin Google sign-in verification
 */
export const auth = admin.auth();

/**
 * Cloud Storage Instance
 * For file uploads (receipts, photos, documents)
 */
export const storage = admin.storage();

/**
 * Upload a file to Cloud Storage
 *
 * @param file - File buffer to upload
 * @param path - Destination path in storage bucket (e.g., 'receipts/transaction-123.jpg')
 * @param contentType - MIME type of the file (e.g., 'image/jpeg', 'application/pdf')
 * @returns Public URL of the uploaded file
 *
 * @example
 * const url = await uploadFile(
 *   fileBuffer,
 *   'receipts/transaction-123.jpg',
 *   'image/jpeg'
 * );
 */
export async function uploadFile(
  file: Buffer,
  path: string,
  contentType: string
): Promise<string> {
  const bucket = storage.bucket();
  const fileRef = bucket.file(path);

  await fileRef.save(file, {
    contentType,
    metadata: {
      cacheControl: 'public, max-age=31536000', // 1 year cache
    },
  });

  // Make file publicly accessible
  await fileRef.makePublic();

  // Return public URL
  return `https://storage.googleapis.com/${bucket.name}/${path}`;
}

/**
 * Delete a file from Cloud Storage
 *
 * @param path - Path to the file in storage bucket
 * @returns True if file was deleted, false if file didn't exist
 *
 * @example
 * await deleteFile('receipts/transaction-123.jpg');
 */
export async function deleteFile(path: string): Promise<boolean> {
  try {
    const bucket = storage.bucket();
    const fileRef = bucket.file(path);

    await fileRef.delete();
    return true;
  } catch (error: any) {
    // File doesn't exist
    if (error.code === 404) {
      return false;
    }
    throw error;
  }
}

/**
 * Check if a file exists in Cloud Storage
 *
 * @param path - Path to the file in storage bucket
 * @returns True if file exists, false otherwise
 *
 * @example
 * const exists = await fileExists('receipts/transaction-123.jpg');
 */
export async function fileExists(path: string): Promise<boolean> {
  try {
    const bucket = storage.bucket();
    const fileRef = bucket.file(path);
    const [exists] = await fileRef.exists();
    return exists;
  } catch (error) {
    return false;
  }
}

/**
 * Get download URL for a file (signed URL with expiration)
 * Use this for temporary access to files
 *
 * @param path - Path to the file in storage bucket
 * @param expiresInMinutes - How long the URL should be valid (default: 60 minutes)
 * @returns Signed URL for downloading the file
 *
 * @example
 * const url = await getDownloadUrl('receipts/transaction-123.jpg', 30);
 */
export async function getDownloadUrl(
  path: string,
  expiresInMinutes: number = 60
): Promise<string> {
  const bucket = storage.bucket();
  const fileRef = bucket.file(path);

  const [url] = await fileRef.getSignedUrl({
    action: 'read',
    expires: Date.now() + expiresInMinutes * 60 * 1000,
  });

  return url;
}

/**
 * Health check for Firebase services
 * Verifies connection to Firestore and Storage
 *
 * @returns Object with health status of each service
 */
export async function checkFirebaseHealth(): Promise<{
  firestore: boolean;
  storage: boolean;
  auth: boolean;
}> {
  const health = {
    firestore: false,
    storage: false,
    auth: false,
  };

  try {
    // Test Firestore connection
    await db.collection('_health_check').limit(1).get();
    health.firestore = true;
  } catch (error) {
    // Firestore connection failed
  }

  try {
    // Test Storage connection
    const bucket = storage.bucket();
    await bucket.exists();
    health.storage = true;
  } catch (error) {
    // Storage connection failed
  }

  try {
    // Test Auth connection (list users with limit 1)
    await auth.listUsers(1);
    health.auth = true;
  } catch (error) {
    // Auth connection failed
  }

  return health;
}

// Export Firebase Admin instance for advanced use cases
export default admin;
