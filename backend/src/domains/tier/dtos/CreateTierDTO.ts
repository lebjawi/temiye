import { ValidationError } from '../../../shared/errors/ValidationError';
import { VALID_FEATURES, Feature } from '../entities/Tier';

/**
 * CreateTierDTO - Validate and transform tier creation request
 */
export class CreateTierDTO {
  id: string;
  name: string;
  level: number;
  features: string[];
  description?: string;

  constructor(data: any) {
    this.id = data.id;
    this.name = data.name;
    this.level = data.level;
    this.features = data.features || [];
    this.description = data.description;
  }

  validate(): void {
    if (!this.id || !/^[a-z0-9_-]{3,20}$/.test(this.id)) {
      throw new ValidationError('Tier ID must be lowercase alphanumeric, 3-20 characters');
    }

    if (!this.name || this.name.length < 2 || this.name.length > 50) {
      throw new ValidationError('Tier name must be 2-50 characters');
    }

    if (typeof this.level !== 'number' || this.level < 1 || this.level > 5) {
      throw new ValidationError('Level must be between 1 and 5');
    }

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

  toEntity(): Record<string, any> {
    return {
      name: this.name,
      level: this.level,
      features: this.features,
      description: this.description || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}
