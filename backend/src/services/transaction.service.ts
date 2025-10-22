/**
 * Transaction Service
 *
 * CRITICAL: Implements double-entry bookkeeping with ACID guarantees
 * Every transaction has debits and credits that must balance
 * All operations are atomic using Firestore transactions
 *
 * Reference: "Designing Data-Intensive Applications" - Chapter 7
 *
 * Double-Entry Bookkeeping Rules:
 * 1. Every transaction must have at least one debit and one credit
 * 2. Total debits must equal total credits
 * 3. Account balances are updated atomically
 * 4. Failed transactions can be rolled back
 */

import { Timestamp, DocumentReference } from '@google-cloud/firestore';
import { TransactionRepository, TransactionEntity } from '../repositories/transaction.repository';
import { AccountRepository, AccountEntity } from '../repositories/account.repository';
import { createLogger } from '../utils/logger.utils';
import { db, Collections } from '../config/database';
import { generateSecureToken } from '../utils/crypto.utils';

const log = createLogger(__filename);

/**
 * Create transaction input
 */
export interface CreateTransactionInput {
  type: 'contribution' | 'donation' | 'spending' | 'transfer';
  amount: number;
  debits: Array<{ accountId: string }>;
  credits: Array<{ accountId: string }>;
  month?: string;
  category?: string;
  memo?: string;
  method: 'cash' | 'bank_transfer' | 'mobile_money' | 'other';
  methodDetails?: string;
  createdById: string;
  createdByNameAr: string;
  createdByRef: DocumentReference;
  receivedById?: string;
  receivedByNameAr?: string;
  receivedByRef?: DocumentReference;
  receiptFile?: Buffer;
  receiptFileName?: string;
}

/**
 * Transaction Service Class
 */
export class TransactionService {
  constructor(
    private transactionRepo: TransactionRepository,
    private accountRepo: AccountRepository
  ) {}

  /**
   * Validate transaction balancing (double-entry requirement)
   *
   * @param debits - Debit entries
   * @param credits - Credit entries
   * @param amount - Total transaction amount
   * @throws Error if transaction doesn't balance
   */
  private validateDoubleEntry(
    debits: Array<{ amount: number }>,
    credits: Array<{ amount: number }>,
    amount: number
  ): void {
    const totalDebits = debits.reduce((sum, d) => sum + d.amount, 0);
    const totalCredits = credits.reduce((sum, c) => sum + c.amount, 0);

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      // Allow 1 cent rounding tolerance
      throw new Error(
        `Transaction doesn't balance: debits (${totalDebits}) != credits (${totalCredits})`
      );
    }

    if (Math.abs(totalDebits - amount) > 0.01) {
      throw new Error(
        `Transaction amount (${amount}) doesn't match debits (${totalDebits})`
      );
    }

    log.debug('Double-entry validation passed', {
      debits: totalDebits,
      credits: totalCredits,
      amount,
    });
  }

  /**
   * Create transaction with ACID guarantees
   *
   * Uses Firestore transactions to ensure atomicity
   * Updates all account balances atomically
   *
   * @param input - Transaction data
   * @param idempotencyKey - Optional idempotency key (auto-generated if not provided)
   * @returns Created transaction
   */
  async createTransaction(
    input: CreateTransactionInput,
    idempotencyKey?: string
  ): Promise<TransactionEntity> {
    const key = idempotencyKey || generateSecureToken(16);

    log.info('Creating transaction', {
      type: input.type,
      amount: input.amount,
      idempotencyKey: key,
    });

    // Check for duplicate transaction (idempotency)
    const existing = await this.transactionRepo.findByIdempotencyKey(key);

    if (existing) {
      log.warn('Duplicate transaction detected (idempotency)', {
        idempotencyKey: key,
        existingTransactionId: existing.id,
      });
      return existing;
    }

    // Prepare debit/credit entries with account details
    const debitsWithDetails = await Promise.all(
      input.debits.map(async (debit) => {
        const account = await this.accountRepo.findById(debit.accountId);
        if (!account) {
          throw new Error(`Debit account not found: ${debit.accountId}`);
        }
        return {
          accountId: account.id,
          accountType: account.type,
          ownerNameAr: account.ownerNameAr,
          amount: input.amount / input.debits.length, // Split evenly if multiple
        };
      })
    );

    const creditsWithDetails = await Promise.all(
      input.credits.map(async (credit) => {
        const account = await this.accountRepo.findById(credit.accountId);
        if (!account) {
          throw new Error(`Credit account not found: ${credit.accountId}`);
        }
        return {
          accountId: account.id,
          accountType: account.type,
          ownerNameAr: account.ownerNameAr,
          amount: input.amount / input.credits.length, // Split evenly if multiple
        };
      })
    );

    // Validate double-entry bookkeeping
    this.validateDoubleEntry(debitsWithDetails, creditsWithDetails, input.amount);

    // Create transaction ID
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Create transaction record
    const transactionData: Omit<TransactionEntity, 'id' | 'version' | 'createdAt' | 'updatedAt'> = {
      idempotencyKey: key,
      type: input.type,
      debits: debitsWithDetails,
      credits: creditsWithDetails,
      amount: input.amount,
      currency: 'MRU',
      month: input.month,
      category: input.category,
      memo: input.memo,
      method: input.method,
      methodDetails: input.methodDetails,
      status: 'pending', // Requires approval
      createdByRef: input.createdByRef,
      createdById: input.createdById,
      createdByNameAr: input.createdByNameAr,
      receivedByRef: input.receivedByRef,
      receivedById: input.receivedById,
      receivedByNameAr: input.receivedByNameAr,
    };

    const transaction = await this.transactionRepo.create(transactionId, transactionData);

    log.info('Transaction created (pending approval)', {
      transactionId: transaction.id,
      type: transaction.type,
      amount: transaction.amount,
    });

    return transaction;
  }

  /**
   * Approve and execute transaction
   *
   * Updates account balances atomically using Firestore transaction
   * Implements ACID guarantees
   *
   * @param transactionId - Transaction ID
   * @param approvedById - Admin ID
   * @param approvedByNameAr - Admin name
   * @param approvedByRef - Admin document reference
   * @returns Completed transaction
   */
  async approveTransaction(
    transactionId: string,
    approvedById: string,
    approvedByNameAr: string,
    approvedByRef: DocumentReference
  ): Promise<TransactionEntity> {
    log.info('Approving transaction', { transactionId, approvedById });

    const transaction = await this.transactionRepo.findById(transactionId);

    if (!transaction) {
      throw new Error(`Transaction not found: ${transactionId}`);
    }

    if (transaction.status !== 'pending') {
      throw new Error(`Transaction is not pending: ${transaction.status}`);
    }

    // Execute transaction atomically
    const completedTransaction = await db.runTransaction(async (firestoreTransaction) => {
      // Update all debit accounts (decrease balance)
      for (const debit of transaction.debits) {
        const accountRef = db.collection(Collections.ACCOUNTS).doc(debit.accountId);
        const accountDoc = await firestoreTransaction.get(accountRef);

        if (!accountDoc.exists) {
          throw new Error(`Debit account not found: ${debit.accountId}`);
        }

        const account = accountDoc.data() as AccountEntity;

        if (!account.isActive) {
          throw new Error(`Debit account is frozen: ${debit.accountId}`);
        }

        if (account.balance < debit.amount) {
          throw new Error(
            `Insufficient funds in account ${debit.accountId}: balance ${account.balance}, required ${debit.amount}`
          );
        }

        const newBalance = account.balance - debit.amount;

        firestoreTransaction.update(accountRef, {
          balance: newBalance,
          lastTransactionId: transactionId,
          lastTransactionAt: Timestamp.now(),
          version: account.version + 1,
          updatedAt: Timestamp.now(),
        });

        log.debug('Debit account updated', {
          accountId: debit.accountId,
          oldBalance: account.balance,
          newBalance,
          amount: debit.amount,
        });
      }

      // Update all credit accounts (increase balance)
      for (const credit of transaction.credits) {
        const accountRef = db.collection(Collections.ACCOUNTS).doc(credit.accountId);
        const accountDoc = await firestoreTransaction.get(accountRef);

        if (!accountDoc.exists) {
          throw new Error(`Credit account not found: ${credit.accountId}`);
        }

        const account = accountDoc.data() as AccountEntity;

        if (!account.isActive) {
          throw new Error(`Credit account is frozen: ${credit.accountId}`);
        }

        const newBalance = account.balance + credit.amount;

        firestoreTransaction.update(accountRef, {
          balance: newBalance,
          lastTransactionId: transactionId,
          lastTransactionAt: Timestamp.now(),
          version: account.version + 1,
          updatedAt: Timestamp.now(),
        });

        log.debug('Credit account updated', {
          accountId: credit.accountId,
          oldBalance: account.balance,
          newBalance,
          amount: credit.amount,
        });
      }

      // Update transaction status
      const transactionRef = db.collection(Collections.TRANSACTIONS).doc(transactionId);

      firestoreTransaction.update(transactionRef, {
        status: 'completed',
        approvedById,
        approvedByNameAr,
        approvedByRef,
        completedAt: Timestamp.now(),
        version: transaction.version + 1,
        updatedAt: Timestamp.now(),
      });

      return {
        ...transaction,
        status: 'completed' as const,
        approvedById,
        approvedByNameAr,
        approvedByRef,
        completedAt: Timestamp.now(),
        version: transaction.version + 1,
        updatedAt: Timestamp.now(),
      };
    });

    log.info('Transaction approved and completed', {
      transactionId,
      amount: completedTransaction.amount,
    });

    return completedTransaction;
  }

  /**
   * Reject transaction
   *
   * @param transactionId - Transaction ID
   * @param reason - Rejection reason
   * @returns Failed transaction
   */
  async rejectTransaction(transactionId: string, reason: string): Promise<TransactionEntity> {
    log.info('Rejecting transaction', { transactionId, reason });

    return this.transactionRepo.updateStatus(transactionId, 'failed', {
      failureReason: reason,
    });
  }

  /**
   * Get transaction by ID
   *
   * @param transactionId - Transaction ID
   * @returns Transaction or null
   */
  async getTransactionById(transactionId: string): Promise<TransactionEntity | null> {
    return this.transactionRepo.findById(transactionId);
  }

  /**
   * List user transactions
   *
   * @param userId - User ID
   * @param limit - Maximum results
   * @returns Array of transactions
   */
  async listUserTransactions(userId: string, limit: number = 50): Promise<TransactionEntity[]> {
    return this.transactionRepo.findByUser(userId, limit);
  }

  /**
   * List pending approvals
   *
   * @param limit - Maximum results
   * @returns Array of pending transactions
   */
  async listPendingApprovals(limit: number = 50): Promise<TransactionEntity[]> {
    return this.transactionRepo.findPendingApprovals(limit);
  }
}
