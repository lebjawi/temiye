import { ValidationError } from '../../../shared/errors/ValidationError';

/**
 * Transaction Entity - IMMUTABLE financial records
 *
 * Types: contribution | expense | dividend | fine
 * CRITICAL: Once created, cannot be modified (immutable by design)
 * Only soft delete allowed (superadmin only)
 */

export type TransactionType = 'contribution' | 'expense' | 'dividend' | 'fine';

export class Transaction {
  id!: string;
  userId!: string;
  type!: TransactionType;
  amount!: number;
  description!: string;
  reference?: string;
  createdBy!: string;
  createdAt!: Date;
  deletedAt?: Date;
  deletedBy?: string;
  deletionReason?: string;
  notes?: string;

  constructor(data: Partial<Transaction>) {
    Object.assign(this, data);
    this.createdAt = data.createdAt || new Date();
  }

  validate(): void {
    if (!this.userId) {
      throw new ValidationError('User ID is required');
    }

    if (!this.type || !['contribution', 'expense', 'dividend', 'fine'].includes(this.type)) {
      throw new ValidationError('Invalid transaction type');
    }

    if (!this.amount || this.amount <= 0) {
      throw new ValidationError('Amount must be greater than 0');
    }

    if (!this.description || this.description.length < 5 || this.description.length > 500) {
      throw new ValidationError('Description must be 5-500 characters');
    }

    if (this.notes && this.notes.length > 200) {
      throw new ValidationError('Notes must be max 200 characters');
    }
  }

  isActive(): boolean {
    return !this.deletedAt;
  }

  isDeleted(): boolean {
    return !!this.deletedAt;
  }

  isImmutable(): boolean {
    return true; // Always immutable
  }

  static create(data: Partial<Transaction>): Transaction {
    const transaction = new Transaction(data);
    transaction.validate();
    return transaction;
  }

  toFirestore(): Record<string, any> {
    return {
      userId: this.userId,
      type: this.type,
      amount: this.amount,
      description: this.description,
      reference: this.reference || null,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      deletedAt: this.deletedAt || null,
      deletedBy: this.deletedBy || null,
      deletionReason: this.deletionReason || null,
      notes: this.notes || null
    };
  }
}
