import { ValidationError } from '../../../shared/errors/ValidationError';

/**
 * Tier Entity - Membership levels that grant feature access
 *
 * Tiers represent membership levels (bronze, silver, gold, platinum, diamond).
 * Each tier grants access to specific features.
 *
 * Mutability: Limited (cannot delete if users assigned, ID and level immutable)
 */

/**
 * Valid features in the system
 */
export const VALID_FEATURES = [
  'view_announcements',
  'vote_in_elections',
  'view_transactions',
  'participate_in_boards',
  'access_analytics',
  'leadership_perks',
  'priority_support',
  'exclusive_events'
] as const;

export type Feature = typeof VALID_FEATURES[number];

export class Tier {
  id!: string;
  name!: string;
  level!: number; // 1-5, higher = more features
  features!: string[];
  description?: string;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(data: Partial<Tier>) {
    Object.assign(this, data);
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Validate all business rules for Tier entity
   *
   * Rules:
   * - ID must be alphanumeric, lowercase, 3-20 chars
   * - Name must be 2-50 chars
   * - Level must be 1-5
   * - Features must be valid
   * - No duplicate features
   */
  validate(): void {
    // ID validation
    if (!this.id || typeof this.id !== 'string') {
      throw new ValidationError('Tier ID is required');
    }

    if (!/^[a-z0-9_-]{3,20}$/.test(this.id)) {
      throw new ValidationError(
        'Tier ID must be lowercase alphanumeric, 3-20 characters (can include _ and -)'
      );
    }

    // Name validation
    if (!this.name || typeof this.name !== 'string') {
      throw new ValidationError('Tier name is required');
    }

    if (this.name.length < 2 || this.name.length > 50) {
      throw new ValidationError('Tier name must be 2-50 characters');
    }

    // Level validation
    if (!this.isValidLevel()) {
      throw new ValidationError('Tier level must be between 1 and 5');
    }

    // Features validation
    if (!Array.isArray(this.features)) {
      throw new ValidationError('Features must be an array');
    }

    // Check for invalid features
    for (const feature of this.features) {
      if (!VALID_FEATURES.includes(feature as Feature)) {
        throw new ValidationError(`Invalid feature: ${feature}`);
      }
    }

    // Check for duplicate features
    if (new Set(this.features).size !== this.features.length) {
      throw new ValidationError('Duplicate features not allowed');
    }

    // Description validation (optional)
    if (this.description && this.description.length > 200) {
      throw new ValidationError('Description must be max 200 characters');
    }
  }

  /**
   * Check if level is valid (1-5)
   */
  isValidLevel(): boolean {
    return (
      typeof this.level === 'number' &&
      Number.isInteger(this.level) &&
      this.level >= 1 &&
      this.level <= 5
    );
  }

  /**
   * Check if tier has a specific feature
   */
  hasFeature(feature: string): boolean {
    return this.features.includes(feature);
  }

  /**
   * Get all features
   */
  getFeatures(): string[] {
    return [...this.features];
  }

  /**
   * Tier hierarchy comparisons
   */
  isHigherThan(otherTier: Tier): boolean {
    return this.level > otherTier.level;
  }

  isEqualTo(otherTier: Tier): boolean {
    return this.level === otherTier.level;
  }

  isLowerThan(otherTier: Tier): boolean {
    return this.level < otherTier.level;
  }

  /**
   * Check if this is a predefined tier
   */
  isPredefined(): boolean {
    return ['bronze', 'silver', 'gold', 'platinum', 'diamond'].includes(this.id);
  }

  /**
   * Static factory method to create and validate Tier
   */
  static create(data: Partial<Tier>): Tier {
    const tier = new Tier(data);
    tier.validate();
    return tier;
  }

  /**
   * Convert to plain object for Firestore storage
   */
  toFirestore(): Record<string, any> {
    return {
      name: this.name,
      level: this.level,
      features: this.features,
      description: this.description || null,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
