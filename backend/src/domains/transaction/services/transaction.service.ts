import { Transaction } from '../entities/Transaction';
import { TransactionRepository } from '../repositories/transaction.repository';
import { CreateTransactionDTO } from '../dtos/CreateTransactionDTO';
import { NotFoundError } from '../../../shared/errors/NotFoundError';
import { MethodNotAllowedError } from '../../../shared/errors/MethodNotAllowedError';

export class TransactionService {
  constructor(private transactionRepository: TransactionRepository) {}

  async createTransaction(data: any, createdBy: string): Promise<Transaction> {
    const dto = new CreateTransactionDTO(data);
    dto.validate();

    const transactionData = dto.toEntity(createdBy);
    const transaction = Transaction.create(transactionData);
    return this.transactionRepository.create(transaction.toFirestore());
  }

  async getTransactionById(id: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findById(id);
    if (!transaction) {
      throw new NotFoundError('Transaction not found');
    }
    return transaction;
  }

  async getAllTransactions(limit?: number): Promise<Transaction[]> {
    return this.transactionRepository.findAll(limit);
  }

  async getTransactionsByUser(userId: string): Promise<Transaction[]> {
    return this.transactionRepository.findByUserId(userId);
  }

  async getTransactionsByType(type: string): Promise<Transaction[]> {
    return this.transactionRepository.findByType(type);
  }

  async getActiveTransactions(): Promise<Transaction[]> {
    return this.transactionRepository.findActive();
  }

  // IMMUTABLE - Throw 405 for any update attempt
  async updateTransaction(_id: string, _updates: any): Promise<never> {
    throw new MethodNotAllowedError('Transactions are immutable and cannot be updated');
  }

  // Soft delete only (superadmin only)
  async deleteTransaction(id: string, deletedBy: string, reason: string): Promise<void> {
    await this.getTransactionById(id);

    if (!reason || reason.length < 5) {
      throw new NotFoundError('Deletion reason is required (min 5 characters)');
    }

    await this.transactionRepository.softDelete(id, deletedBy, reason);
  }
}
