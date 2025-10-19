import { ValidationError } from '../../../shared/errors/ValidationError';
import { InvalidStateError } from '../../../shared/errors/InvalidStateError';

export type ElectionStatus = 'created' | 'voting' | 'closed' | 'archived';
export type BallotType = 'single-choice' | 'multi-choice' | 'ranking';

export interface Candidate {
  id: string;
  name: string;
}

export class Election {
  id!: string;
  boardId!: string;
  title!: string;
  description!: string;
  ballotType!: BallotType;
  candidates!: Candidate[];
  imageRef?: string; // Reference to file in Storage domain
  status!: ElectionStatus;
  startDate!: Date;
  endDate!: Date;
  closedAt?: Date;
  createdBy!: string;
  createdAt!: Date;
  updatedAt!: Date;

  private static readonly STATE_TRANSITIONS: Record<ElectionStatus, ElectionStatus[]> = {
    created: ['voting'],
    voting: ['closed'],
    closed: ['archived'],
    archived: []
  };

  constructor(data: Partial<Election>) {
    Object.assign(this, data);
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.status = data.status || 'created';
  }

  validate(): void {
    if (!this.title || this.title.length < 3 || this.title.length > 100) {
      throw new ValidationError('Title must be 3-100 characters');
    }
    if (!this.candidates || this.candidates.length < 2) {
      throw new ValidationError('At least 2 candidates required');
    }
    if (this.endDate <= this.startDate) {
      throw new ValidationError('End date must be after start date');
    }
  }

  isVotingOpen(): boolean {
    const now = new Date();
    return this.status === 'voting' && now >= this.startDate && now <= this.endDate;
  }

  canTransitionTo(newStatus: ElectionStatus): boolean {
    return Election.STATE_TRANSITIONS[this.status].includes(newStatus);
  }

  transitionTo(newStatus: ElectionStatus): void {
    if (!this.canTransitionTo(newStatus)) {
      throw new InvalidStateError(`Invalid state transition: ${this.status} → ${newStatus}`);
    }
    this.status = newStatus;
    this.updatedAt = new Date();
  }

  static create(data: Partial<Election>): Election {
    const election = new Election(data);
    election.validate();
    return election;
  }

  toFirestore(): Record<string, any> {
    return {
      boardId: this.boardId,
      title: this.title,
      description: this.description,
      ballotType: this.ballotType,
      candidates: this.candidates,
      imageRef: this.imageRef || null,
      status: this.status,
      startDate: this.startDate,
      endDate: this.endDate,
      closedAt: this.closedAt || null,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
