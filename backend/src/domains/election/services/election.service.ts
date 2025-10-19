import { Election } from '../entities/Election';
import { ElectionRepository } from '../repositories/election.repository';
import { CreateElectionDTO } from '../dtos/CreateElectionDTO';
import { UpdateElectionDTO } from '../dtos/UpdateElectionDTO';
import { NotFoundError } from '../../../shared/errors/NotFoundError';
import { ValidationError } from '../../../shared/errors/ValidationError';
import { StorageService } from '../../storage/services/storage.service';

export class ElectionService {
  constructor(
    private electionRepository: ElectionRepository,
    private storageService: StorageService
  ) {}

  /**
   * Handle file reference updates with reference counting
   */
  private async handleFileRefUpdate(
    oldFileRef: string | undefined,
    newFileRef: string | undefined,
    expectedCategory: string
  ): Promise<void> {
    // If removing file reference
    if (!newFileRef && oldFileRef) {
      try {
        await this.storageService.decrementReferenceCount(oldFileRef);
      } catch (error) {
        console.warn(`Failed to decrement old file: ${error}`);
      }
      return;
    }

    // If adding or changing file reference
    if (newFileRef) {
      const file = await this.storageService.getFileById(newFileRef);
      if (file.file.category !== expectedCategory) {
        throw new ValidationError(`Invalid file category. Expected '${expectedCategory}', got '${file.file.category}'`);
      }

      // Decrement old file if changing
      if (oldFileRef && oldFileRef !== newFileRef) {
        try {
          await this.storageService.decrementReferenceCount(oldFileRef);
        } catch (error) {
          console.warn(`Failed to decrement old file: ${error}`);
        }
      }

      // Increment new file
      await this.storageService.incrementReferenceCount(newFileRef);
    }
  }

  async createElection(data: any, createdBy: string): Promise<Election> {
    const dto = new CreateElectionDTO(data);
    dto.validate();
    const electionData = dto.toEntity(createdBy);
    const election = Election.create(electionData);

    // Handle image reference if provided
    if (data.imageRef) {
      await this.handleFileRefUpdate(undefined, data.imageRef, 'election-image');
      election.imageRef = data.imageRef;
    }

    return this.electionRepository.create(election.toFirestore());
  }

  async getElectionById(id: string): Promise<Election> {
    const election = await this.electionRepository.findById(id);
    if (!election) throw new NotFoundError('Election not found');
    return election;
  }

  async getAllElections(): Promise<Election[]> {
    return this.electionRepository.findAll();
  }

  async startVoting(id: string): Promise<Election> {
    const election = await this.getElectionById(id);
    election.transitionTo('voting');
    return this.electionRepository.update(id, { status: 'voting' });
  }

  async closeVoting(id: string): Promise<Election> {
    const election = await this.getElectionById(id);
    election.transitionTo('closed');
    return this.electionRepository.update(id, { status: 'closed', closedAt: new Date() });
  }

  async archiveElection(id: string): Promise<Election> {
    const election = await this.getElectionById(id);
    election.transitionTo('archived');
    return this.electionRepository.update(id, { status: 'archived' });
  }

  async updateElection(id: string, updates: any): Promise<Election> {
    const election = await this.getElectionById(id);
    if (election.status !== 'created') {
      throw new Error('Cannot update election after voting has started');
    }

    const dto = new UpdateElectionDTO(updates);
    dto.validate();

    // Handle image reference update
    if (dto.imageRef !== undefined) {
      await this.handleFileRefUpdate(election.imageRef, dto.imageRef || undefined, 'election-image');
    }

    return this.electionRepository.update(id, dto.toEntity());
  }

  async deleteElection(id: string): Promise<void> {
    const election = await this.getElectionById(id);
    if (election.status !== 'created') {
      throw new Error('Cannot delete election after voting has started');
    }

    // Decrement image reference count if exists
    if (election.imageRef) {
      try {
        await this.storageService.decrementReferenceCount(election.imageRef);
      } catch (error) {
        console.warn(`Failed to decrement image reference: ${error}`);
      }
    }

    await this.electionRepository.delete(id);
  }
}
