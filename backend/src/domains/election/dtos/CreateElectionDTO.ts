import { ValidationError } from '../../../shared/errors/ValidationError';

export class CreateElectionDTO {
  boardId: string;
  title: string;
  description: string;
  ballotType: string;
  candidates: string[];
  startDate: Date;
  endDate: Date;

  constructor(data: any) {
    this.boardId = data.boardId;
    this.title = data.title;
    this.description = data.description;
    this.ballotType = data.ballotType;
    this.candidates = data.candidates;
    this.startDate = new Date(data.startDate);
    this.endDate = new Date(data.endDate);
  }

  validate(): void {
    if (!this.boardId) throw new ValidationError('Board ID is required');
    if (!this.title || this.title.length < 3) throw new ValidationError('Title must be at least 3 characters');
    if (!this.candidates || this.candidates.length < 2) throw new ValidationError('At least 2 candidates required');
    if (this.endDate <= this.startDate) throw new ValidationError('End date must be after start date');
  }

  toEntity(createdBy: string): Record<string, any> {
    return {
      boardId: this.boardId,
      title: this.title,
      description: this.description,
      ballotType: this.ballotType,
      candidates: this.candidates.map((name, idx) => ({ id: `cand-${idx + 1}`, name })),
      status: 'created',
      startDate: this.startDate,
      endDate: this.endDate,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}
