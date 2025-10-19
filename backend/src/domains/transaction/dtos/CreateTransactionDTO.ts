import { ValidationError } from '../../../shared/errors/ValidationError';
import { TransactionType } from '../entities/Transaction';

export class CreateTransactionDTO {
  userId: string;
  type: TransactionType;
  amount: number;
  description: string;
  reference?: string;
  notes?: string;

  constructor(data: any) {
    this.userId = data.userId;
    this.type = data.type;
    this.amount = data.amount;
    this.description = data.description;
    this.reference = data.reference;
    this.notes = data.notes;
  }

  validate(): void {
    if (!this.userId) {
      throw new ValidationError('User ID is required');
    }

    if (!this.type || !['contribution', 'expense', 'dividend', 'fine'].includes(this.type)) {
      throw new ValidationError('Invalid transaction type');
    }

    if (typeof this.amount !== 'number' || this.amount <= 0) {
      throw new ValidationError('Amount must be a positive number');
    }

    if (!this.description || this.description.length < 5 || this.description.length > 500) {
      throw new ValidationError('Description must be 5-500 characters');
    }
  }

  toEntity(createdBy: string): Record<string, any> {
    return {
      userId: this.userId,
      type: this.type,
      amount: this.amount,
      description: this.description,
      reference: this.reference || null,
      notes: this.notes || null,
      createdBy,
      createdAt: new Date()
    };
  }
}
