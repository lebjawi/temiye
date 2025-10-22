/**
 * Shared Module - Main Barrel Export
 *
 * This file provides a single entry point for importing all shared functionality.
 *
 * Usage:
 * ```typescript
 * // Import the module
 * import { SharedModule } from '@shared';
 *
 * // Import models
 * import { User, Admin, Role, Tier } from '@shared';
 *
 * // Import utilities
 * import { OurLogs, LogOptions, LogStyle } from '@shared';
 * ```
 */

// Export the module
export * from './shared.module';

// Export all models
export * from './models';

// Export all utilities
export * from './utils';
