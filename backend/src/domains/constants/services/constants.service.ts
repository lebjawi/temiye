import { Constants } from '../entities/Constants';
import { ConstantsRepository } from '../repositories/constants.repository';
import { UpdateConstantsDTO } from '../dtos/UpdateConstantsDTO';
import { constantsCache } from '../cache/constants.cache';

/**
 * ConstantsService - Business logic for Constants domain
 *
 * Responsibility: Orchestrate repository calls, implement business rules, manage cache
 */
export class ConstantsService {
  private readonly CACHE_KEY = 'system_constants';

  constructor(private constantsRepository: ConstantsRepository) {}

  /**
   * Get system constants (with caching)
   */
  async getConstants(): Promise<Constants> {
    // Try cache first
    const cached = constantsCache.get(this.CACHE_KEY);
    if (cached) {
      return cached;
    }

    // Cache miss - fetch from Firestore
    const constants = await this.constantsRepository.getConstants();

    // Validate entity
    constants.validate();

    // Update cache
    constantsCache.set(this.CACHE_KEY, constants);

    return constants;
  }

  /**
   * Update system constants (invalidate cache)
   */
  async updateConstants(data: any, updatedBy: string): Promise<Constants> {
    // Validate DTO
    const dto = new UpdateConstantsDTO({ ...data, updatedBy });
    dto.validate();

    // Get current constants for validation
    const current = await this.constantsRepository.getConstants();

    // Merge updates with current values
    const merged = new Constants({
      ...current,
      ...dto.toEntity()
    });

    // Validate merged entity (business rules)
    merged.validate();

    // Update in Firestore
    const updated = await this.constantsRepository.updateConstants(dto.toEntity());

    // Invalidate cache
    constantsCache.invalidate(this.CACHE_KEY);

    return updated;
  }

  /**
   * Initialize system constants (only for first-time setup)
   */
  async initializeConstants(data: {
    votingDurationDays: number;
    minCandidates: number;
    maxCandidates: number;
    maxBoardDepth: number;
    maxBoardMembers: number;
    minContribution: number;
    maxContribution: number;
    minExpense: number;
    maxExpense: number;
    passwordResetExpiryMinutes: number;
    jwtExpiryDays: number;
    paginationDefaultLimit: number;
    paginationMaxLimit: number;
  }): Promise<Constants> {
    // Create entity
    const constants = Constants.create({
      ...data,
      updatedAt: new Date(),
      updatedBy: 'system'
    });

    // Initialize in Firestore
    const created = await this.constantsRepository.initializeConstants(
      constants.toFirestore()
    );

    // Set cache
    constantsCache.set(this.CACHE_KEY, created);

    return created;
  }

  /**
   * Named getter methods for specific constants
   */

  async getMinContribution(): Promise<number> {
    const constants = await this.getConstants();
    return constants.getMinContribution();
  }

  async getMaxContribution(): Promise<number> {
    const constants = await this.getConstants();
    return constants.getMaxContribution();
  }

  async getMinExpense(): Promise<number> {
    const constants = await this.getConstants();
    return constants.getMinExpense();
  }

  async getMaxExpense(): Promise<number> {
    const constants = await this.getConstants();
    return constants.getMaxExpense();
  }

  async getVotingDuration(): Promise<number> {
    const constants = await this.getConstants();
    return constants.getVotingDuration();
  }

  async getPasswordResetExpiry(): Promise<number> {
    const constants = await this.getConstants();
    return constants.getPasswordResetExpiry();
  }

  async getJwtExpiry(): Promise<number> {
    const constants = await this.getConstants();
    return constants.getJwtExpiry();
  }
}
