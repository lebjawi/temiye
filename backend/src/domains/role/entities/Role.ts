import { ValidationError } from '../../../shared/errors/ValidationError';

/**
 * Role Entity - Permission sets that define user capabilities
 *
 * Roles control what actions users can perform. Predefined roles:
 * - member (level 1): Basic permissions
 * - board (level 3): Board management
 * - admin (level 4): Most admin operations
 * - superadmin (level 5): All permissions
 *
 * Mutability: Limited (cannot delete if users assigned, ID and level immutable)
 */

/**
 * Valid permissions in the system
 */
export const VALID_PERMISSIONS = [
  'vote',
  'view_announcements',
  'view_transactions',
  'view_elections',
  'approve_users',
  'manage_board',
  'manage_roles',
  'manage_users',
  'view_analytics',
  'manage_elections',
  'manage_transactions',
  'manage_announcements',
  '*' // Wildcard: all permissions (superadmin only)
] as const;

export type Permission = typeof VALID_PERMISSIONS[number];

export class Role {
  id!: string;
  name!: string;
  permissions!: string[];
  description?: string;
  level!: number; // 1-5, higher = more power
  createdAt!: Date;
  updatedAt!: Date;

  constructor(data: Partial<Role>) {
    Object.assign(this, data);
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Validate all business rules for Role entity
   *
   * Rules:
   * - ID must be alphanumeric, lowercase, 3-20 chars
   * - Name must be 2-50 chars
   * - Level must be 1-5
   * - Permissions must be valid
   * - No duplicate permissions
   */
  validate(): void {
    // ID validation
    if (!this.id || typeof this.id !== 'string') {
      throw new ValidationError('Role ID is required');
    }

    if (!/^[a-z0-9_-]{3,20}$/.test(this.id)) {
      throw new ValidationError(
        'Role ID must be lowercase alphanumeric, 3-20 characters (can include _ and -)'
      );
    }

    // Name validation
    if (!this.name || typeof this.name !== 'string') {
      throw new ValidationError('Role name is required');
    }

    if (this.name.length < 2 || this.name.length > 50) {
      throw new ValidationError('Role name must be 2-50 characters');
    }

    // Level validation
    if (!this.isValidLevel()) {
      throw new ValidationError('Role level must be between 1 and 5');
    }

    // Permissions validation
    if (!Array.isArray(this.permissions) || this.permissions.length === 0) {
      throw new ValidationError('Permissions must be a non-empty array');
    }

    // Check for invalid permissions (unless superadmin with *)
    if (!this.permissions.includes('*')) {
      for (const perm of this.permissions) {
        if (!VALID_PERMISSIONS.includes(perm as Permission)) {
          throw new ValidationError(`Invalid permission: ${perm}`);
        }
      }
    }

    // Check for duplicate permissions
    if (new Set(this.permissions).size !== this.permissions.length) {
      throw new ValidationError('Duplicate permissions not allowed');
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
   * Check if role has a specific permission
   */
  hasPermission(permission: string): boolean {
    // Superadmin has all permissions
    if (this.permissions.includes('*')) {
      return true;
    }
    return this.permissions.includes(permission);
  }

  /**
   * Shorthand permission checks
   */
  canApproveUsers(): boolean {
    return this.hasPermission('approve_users');
  }

  canManageBoard(): boolean {
    return this.hasPermission('manage_board');
  }

  canManageRoles(): boolean {
    return this.hasPermission('manage_roles');
  }

  canViewAnalytics(): boolean {
    return this.hasPermission('view_analytics');
  }

  /**
   * Role hierarchy comparisons
   */
  isHigherThan(otherRole: Role): boolean {
    return this.level > otherRole.level;
  }

  isEqualTo(otherRole: Role): boolean {
    return this.level === otherRole.level;
  }

  isLowerThan(otherRole: Role): boolean {
    return this.level < otherRole.level;
  }

  /**
   * Check if this is a predefined role
   */
  isPredefined(): boolean {
    return ['member', 'board', 'admin', 'superadmin'].includes(this.id);
  }

  /**
   * Static factory method to create and validate Role
   */
  static create(data: Partial<Role>): Role {
    const role = new Role(data);
    role.validate();
    return role;
  }

  /**
   * Convert to plain object for Firestore storage
   */
  toFirestore(): Record<string, any> {
    return {
      name: this.name,
      permissions: this.permissions,
      description: this.description || null,
      level: this.level,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
