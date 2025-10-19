import { ValidationError } from '../../../shared/errors/ValidationError';
import { VALID_PERMISSIONS, Permission } from '../entities/Role';

/**
 * CreateRoleDTO - Validate and transform role creation request
 *
 * Purpose: Validate new role data before creation
 * Layer: Input boundary (DTO validation)
 */
export class CreateRoleDTO {
  id: string;
  name: string;
  level: number;
  permissions: string[];
  description?: string;

  constructor(data: any) {
    this.id = data.id;
    this.name = data.name;
    this.level = data.level;
    this.permissions = data.permissions || [];
    this.description = data.description;
  }

  /**
   * Validate DTO constraints (format validation only)
   *
   * Rules:
   * - id: Alphanumeric, lowercase, 3-20 chars
   * - name: 2-50 chars
   * - level: 1-5 integer
   * - permissions: Array of valid permission strings
   * - description: Optional, max 200 chars
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
    if (typeof this.level !== 'number' || !Number.isInteger(this.level)) {
      throw new ValidationError('Level must be an integer');
    }

    if (this.level < 1 || this.level > 5) {
      throw new ValidationError('Level must be between 1 and 5');
    }

    // Permissions validation
    if (!Array.isArray(this.permissions)) {
      throw new ValidationError('Permissions must be an array');
    }

    if (this.permissions.length === 0) {
      throw new ValidationError('At least one permission is required');
    }

    // Check for invalid permissions (unless wildcard)
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
   * Transform to Entity format
   */
  toEntity(): Record<string, any> {
    return {
      name: this.name,
      permissions: this.permissions,
      description: this.description || null,
      level: this.level,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}
