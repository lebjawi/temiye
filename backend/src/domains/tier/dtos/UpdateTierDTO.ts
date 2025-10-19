import { ValidationError } from '../../../shared/errors/ValidationError';
import { VALID_FEATURES, Feature } from '../entities/Tier';

/**
 * UpdateTierDTO - Validate tier update request
 */
export class UpdateTierDTO {
  name?: string;
  features?: string[];
  description?: string;

  constructor(data: any) {
    if (data.name !== undefined) this.name = data.name;
    if (data.features !== undefined) this.features = data.features;
    if (data.description !== undefined) this.description = data.description;
  }

  validate(): void {
    if (this.name !== undefined && (this.name.length < 2 || this.name.length > 50)) {
      throw new ValidationError('Tier name must be 2-50 characters');
    }

    if (this.features !== undefined) {
      if (!Array.isArray(this.features)) {
        throw new ValidationError('Features must be an array');
      }

      for (const feature of this.features) {
        if (!VALID_FEATURES.includes(feature as Feature)) {
          throw new ValidationError(`Invalid feature: ${feature}`);
        }
      }

      if (new Set(this.features).size !== this.features.length) {
        throw new ValidationError('Duplicate features not allowed');
      }
    }

    if (this.name === undefined && this.features === undefined && this.description === undefined) {
      throw new ValidationError('At least one field must be provided for update');
    }
  }

  toEntity(): Partial<Record<string, any>> {
    const entity: Record<string, any> = { updatedAt: new Date() };
    if (this.name !== undefined) entity.name = this.name;
    if (this.features !== undefined) entity.features = this.features;
    if (this.description !== undefined) entity.description = this.description;
    return entity;
  }
}
