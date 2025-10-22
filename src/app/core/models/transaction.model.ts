export type TransactionType = 'contribution' | 'expense' | 'dividend' | 'fine';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  description: string;
  reference?: string;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  deletedAt?: Date;
  deletedBy?: string;
  deletionReason?: string;
}

export interface CreateTransactionDto {
  userId: string;
  type: TransactionType;
  amount: number;
  description: string;
  reference?: string;
  notes?: string;
}

export interface DeleteTransactionDto {
  reason: string;
}
