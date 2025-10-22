/**
 * Transaction Repository
 *
 * Data access layer for financial transactions
 * Implements double-entry bookkeeping with ACID guarantees
 *
 * CRITICAL REQUIREMENTS:
 * - Every transaction must have debits and credits that balance
 * - Idempotency keys prevent duplicate transactions
 * - All operations are atomic (use Firestore transactions)
 * - Version control for concurrency
 *
 * Reference: "Designing Data-Intensive Applications" - Chapter 7: Transactions
 */

import { Firestore, Timestamp, DocumentReference } from '@google-cloud/firestore';
import { BaseRepository, BaseEntity } from './base.repository';
import { Transaction } from '../types';
import { Collections } from '../config/database';
import { createLogger } from '../utils/logger.utils';

const log = createLogger(__filename);

/**
 * Transaction entity extended with BaseEntity
 */
export type TransactionEntity = Transaction & BaseEntity;

/**
 * Transaction Repository Class
 */
export class TransactionRepository extends BaseRepository<TransactionEntity> {
  constructor(db: Firestore) {
    super(db, Collections.TRANSACTIONS);
  }

  /**
   * Find transaction by idempotency key
   *
   * Prevents duplicate transactions
   *
   * @param idempotencyKey - Unique key for transaction
   * @returns Transaction or null if not found
   */
  async findByIdempotencyKey(idempotencyKey: string): Promise<TransactionEntity | null> {
    log.debug('Finding transaction by idempotency key', { idempotencyKey });

    const snapshot = await this.collection
      .where('idempotencyKey', '==', idempotencyKey)
      .limit(1)
      .get();

    if (snapshot.empty) {
      log.debug('Transaction not found by idempotency key', { idempotencyKey });
      return null;
    }

    const doc = snapshot.docs[0]!;
    const transaction = { id: doc.id, ...doc.data() } as TransactionEntity;

    log.debug('Transaction found by idempotency key', {
      idempotencyKey,
      transactionId: transaction.id,
    });

    return transaction;
  }

  /**
   * Find transactions by user (created by)
   *
   * @param userId - User ID
   * @param limit - Maximum results
   * @returns Array of transactions
   */
  async findByUser(userId: string, limit: number = 50): Promise<TransactionEntity[]> {
    log.debug('Finding transactions by user', { userId, limit });

    const results = await this.findMany(
      [['createdById', '==', userId]],
      { limit, orderBy: 'createdAt', orderDirection: 'desc' }
    );

    log.debug('Transactions found by user', { userId, count: results.length });

    return results;
  }

  /**
   * Find transactions by status
   *
   * @param status - Transaction status
   * @param limit - Maximum results
   * @returns Array of transactions
   */
  async findByStatus(
    status: 'pending' | 'completed' | 'failed' | 'reversed',
    limit: number = 100
  ): Promise<TransactionEntity[]> {
    log.debug('Finding transactions by status', { status, limit });

    const results = await this.findMany(
      [['status', '==', status]],
      { limit, orderBy: 'createdAt', orderDirection: 'desc' }
    );

    log.debug('Transactions found by status', { status, count: results.length });

    return results;
  }

  /**
   * Find pending transactions requiring approval
   *
   * @param limit - Maximum results
   * @returns Array of pending transactions
   */
  async findPendingApprovals(limit: number = 50): Promise<TransactionEntity[]> {
    log.debug('Finding pending transaction approvals', { limit });

    return this.findByStatus('pending', limit);
  }

  /**
   * Update transaction status
   *
   * @param transactionId - Transaction ID
   * @param status - New status
   * @param additionalData - Additional fields to update
   * @returns Updated transaction
   */
  async updateStatus(
    transactionId: string,
    status: 'pending' | 'completed' | 'failed' | 'reversed',
    additionalData?: {
      failureReason?: string;
      approvedById?: string;
      approvedByNameAr?: string;
      approvedByRef?: DocumentReference;
      completedAt?: Timestamp;
      reversedAt?: Timestamp;
      reversedByRef?: DocumentReference;
    }
  ): Promise<TransactionEntity> {
    log.info('Updating transaction status', {
      transactionId,
      status,
    });

    const transaction = await this.findById(transactionId);

    if (!transaction) {
      throw new Error(`Transaction not found: ${transactionId}`);
    }

    return this.update(
      transactionId,
      {
        status,
        ...additionalData,
      } as Partial<Omit<TransactionEntity, 'id' | 'version' | 'createdAt' | 'updatedAt'>>,
      transaction.version
    );
  }

  /**
   * Find transactions by date range
   *
   * @param startDate - Start date
   * @param endDate - End date
   * @param limit - Maximum results
   * @returns Array of transactions
   */
  async findByDateRange(
    startDate: Timestamp,
    endDate: Timestamp,
    limit: number = 1000
  ): Promise<TransactionEntity[]> {
    log.debug('Finding transactions by date range', {
      startDate: startDate.toDate(),
      endDate: endDate.toDate(),
      limit,
    });

    const snapshot = await this.collection
      .where('createdAt', '>=', startDate)
      .where('createdAt', '<=', endDate)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const results = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as TransactionEntity[];

    log.debug('Transactions found by date range', { count: results.length });

    return results;
  }

  /**
   * Get transaction statistics
   *
   * @returns Transaction statistics
   */
  async getTransactionStats(): Promise<{
    total: number;
    pending: number;
    completed: number;
    failed: number;
    reversed: number;
    totalAmount: number;
    byType: Record<string, number>;
  }> {
    log.debug('Getting transaction statistics');

    const transactions = await this.findAll();

    const stats = {
      total: transactions.length,
      pending: transactions.filter((t) => t.status === 'pending').length,
      completed: transactions.filter((t) => t.status === 'completed').length,
      failed: transactions.filter((t) => t.status === 'failed').length,
      reversed: transactions.filter((t) => t.status === 'reversed').length,
      totalAmount: transactions
        .filter((t) => t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0),
      byType: {
        contribution: transactions.filter((t) => t.type === 'contribution').length,
        donation: transactions.filter((t) => t.type === 'donation').length,
        spending: transactions.filter((t) => t.type === 'spending').length,
        transfer: transactions.filter((t) => t.type === 'transfer').length,
      },
    };

    log.debug('Transaction statistics calculated', stats);

    return stats;
  }
}
