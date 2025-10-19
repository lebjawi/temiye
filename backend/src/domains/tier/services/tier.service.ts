import { Tier } from '../entities/Tier';
import { TierRepository } from '../repositories/tier.repository';
import { CreateTierDTO } from '../dtos/CreateTierDTO';
import { UpdateTierDTO } from '../dtos/UpdateTierDTO';
import { ConflictError } from '../../../shared/errors/ConflictError';
import { NotFoundError } from '../../../shared/errors/NotFoundError';
import { ValidationError } from '../../../shared/errors/ValidationError';

export class TierService {
  constructor(private tierRepository: TierRepository) {}

  async createTier(data: any): Promise<Tier> {
    const dto = new CreateTierDTO(data);
    dto.validate();

    const existingById = await this.tierRepository.findById(dto.id);
    if (existingById) {
      throw new ConflictError(`Tier with ID '${dto.id}' already exists`);
    }

    const existingByName = await this.tierRepository.findByName(dto.name);
    if (existingByName) {
      throw new ConflictError(`Tier with name '${dto.name}' already exists`);
    }

    const tier = Tier.create({ id: dto.id, ...dto.toEntity() });
    return this.tierRepository.create(tier.toFirestore(), dto.id);
  }

  async getTierById(id: string): Promise<Tier> {
    const tier = await this.tierRepository.findById(id);
    if (!tier) {
      throw new NotFoundError(`Tier with ID '${id}' not found`);
    }
    return tier;
  }

  async getAllTiers(): Promise<Tier[]> {
    return this.tierRepository.findAll();
  }

  async updateTier(id: string, data: any): Promise<Tier> {
    const existing = await this.tierRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Tier with ID '${id}' not found`);
    }

    const dto = new UpdateTierDTO(data);
    dto.validate();

    if (dto.name && dto.name !== existing.name) {
      const existingByName = await this.tierRepository.findByName(dto.name);
      if (existingByName && existingByName.id !== id) {
        throw new ConflictError(`Tier with name '${dto.name}' already exists`);
      }
    }

    const merged = new Tier({ ...existing, ...dto.toEntity() });
    merged.validate();

    return this.tierRepository.update(id, dto.toEntity());
  }

  async deleteTier(id: string): Promise<void> {
    const tier = await this.tierRepository.findById(id);
    if (!tier) {
      throw new NotFoundError(`Tier with ID '${id}' not found`);
    }

    if (tier.isPredefined()) {
      throw new ValidationError('Cannot delete predefined tiers (bronze, silver, gold, platinum, diamond)');
    }

    const userCount = await this.tierRepository.countUsersWithTier(id);
    if (userCount > 0) {
      throw new ConflictError(`Cannot delete tier '${id}'. ${userCount} user(s) have this tier.`);
    }

    await this.tierRepository.delete(id);
  }

  async tierExists(tierId: string): Promise<boolean> {
    const tier = await this.tierRepository.findById(tierId);
    return tier !== null;
  }

  async hasFeature(tierId: string, feature: string): Promise<boolean> {
    const tier = await this.getTierById(tierId);
    return tier.hasFeature(feature);
  }
}
