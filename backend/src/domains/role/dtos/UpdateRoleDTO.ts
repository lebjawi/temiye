import { ValidationError } from '../../../shared/errors/ValidationError';
import { VALID_PERMISSIONS, Permission } from '../entities/Role';

/**
 * UpdateRoleDTO - Validate and transform role update request
 *
 * Purpose: Validate role updates
 * Constraints:
 * - Cannot change ID (immutable)
 * - Cannot change level (immutable, to prevent hierarchy breaking)
 * - Can update name, permissions, description
 */
export class UpdateRoleDTO {
  name?: string;
  permissions?: string[];
  description?: string;

  constructor(data: any) {
    if (data.name !== undefined) {
      this.name = data.name;
    }
    if (data.permissions !== undefined) {
      this.permissions = data.permissions;
    }
    if (data.description !== undefined) {
      this.description = data.description;
    }
  }

  /**
   * Validate DTO constraints
   */
  validate(): void {
    // Name validation (if provided)
    if (this.name !== undefined) {
      if (typeof this.name !== 'string' || this.name.length < 2 || this.name.length > 50) {
        throw new ValidationError('Role name must be 2-50 characters');
      }
    }

    // Permissions validation (if provided)
    if (this.permissions !== undefined) {
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
    }

    // Description validation (if provided)
    if (this.description !== undefined && this.description.length > 200) {
      throw new ValidationError('Description must be max 200 characters');
    }

    // Ensure at least one field is being updated
    if (this.name === undefined && this.permissions === undefined && this.description === undefined) {
      throw new ValidationError('At least one field must be provided for update');
    }
  }

  /**
   * Transform to Entity format (only changed fields)
   */
  toEntity(): Partial<Record<string, any>> {
    const entity: Record<string, any> = {
      updatedAt: new Date()
    };

    if (this.name !== undefined) entity.name = this.name;
    if (this.permissions !== undefined) entity.permissions = this.permissions;
    if (this.description !== undefined) entity.description = this.description;

    return entity;
  }
}
