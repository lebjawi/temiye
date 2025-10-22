/**
 * Account Repository
 *
 * Data access layer for financial accounts
 * Handles user contributions, board treasuries, and project funds
 *
 * CRITICAL: All balance updates must be done through transactions
 * Never update account balances directly - use TransactionService
 */

import { Firestore, Timestamp } from '@google-cloud/firestore';
import { BaseRepository, BaseEntity } from './base.repository';
import { Account } from '../types';
import { Collections } from '../config/database';
import { createLogger } from '../utils/logger.utils';

const log = createLogger(__filename);

/**
 * Account entity extended with BaseEntity
 */
export type AccountEntity = Account & BaseEntity;

/**
 * Account Repository Class
 */
export class AccountRepository extends BaseRepository<AccountEntity> {
  constructor(db: Firestore) {
    super(db, Collections.ACCOUNTS);
  }

  /**
   * Find account by owner
   *
   * @param ownerId - Owner ID (user, board, or project)
   * @param ownerType - Type of owner
   * @returns Account or null if not found
   */
  async findByOwner(
    ownerId: string,
    ownerType: 'user' | 'board' | 'project'
  ): Promise<AccountEntity | null> {
    log.debug('Finding account by owner', { ownerId, ownerType });

    const snapshot = await this.collection
      .where('ownerId', '==', ownerId)
      .where('ownerType', '==', ownerType)
      .limit(1)
      .get();

    if (snapshot.empty) {
      log.debug('Account not found by owner', { ownerId, ownerType });
      return null;
    }

    const doc = snapshot.docs[0]!;
    const account = { id: doc.id, ...doc.data() } as AccountEntity;

    log.debug('Account found by owner', {
      ownerId,
      ownerType,
      accountId: account.id,
    });

    return account;
  }

  /**
   * Find accounts by type
   *
   * @param type - Account type
   * @param limit - Maximum results
   * @returns Array of accounts
   */
  async findByType(
    type: 'user_contributions' | 'board_treasury' | 'project_fund' | 'general_fund',
    limit: number = 100
  ): Promise<AccountEntity[]> {
    log.debug('Finding accounts by type', { type, limit });

    const results = await this.findMany([['type', '==', type]], { limit });

    log.debug('Accounts found by type', { type, count: results.length });

    return results;
  }

  /**
   * Update account balance (INTERNAL USE ONLY - use through TransactionService)
   *
   * @param accountId - Account ID
   * @param newBalance - New balance
   * @param transactionId - Transaction ID causing the change
   * @returns Updated account
   */
  async updateBalance(
    accountId: string,
    newBalance: number,
    transactionId: string
  ): Promise<AccountEntity> {
    log.info('Updating account balance', {
      accountId,
      newBalance,
      transactionId,
    });

    const account = await this.findById(accountId);

    if (!account) {
      throw new Error(`Account not found: ${accountId}`);
    }

    const updatedAccount = await this.update(
      accountId,
      {
        balance: newBalance,
        lastTransactionId: transactionId,
        lastTransactionAt: Timestamp.now(),
      } as Partial<Omit<AccountEntity, 'id' | 'version' | 'createdAt' | 'updatedAt'>>,
      account.version
    );

    log.info('Account balance updated', {
      accountId,
      oldBalance: account.balance,
      newBalance,
      transactionId,
    });

    return updatedAccount;
  }

  /**
   * Freeze account (prevent transactions)
   *
   * @param accountId - Account ID
   * @param reason - Freeze reason
   * @returns Updated account
   */
  async freezeAccount(accountId: string, reason: string): Promise<AccountEntity> {
    log.info('Freezing account', { accountId, reason });

    const account = await this.findById(accountId);

    if (!account) {
      throw new Error(`Account not found: ${accountId}`);
    }

    return this.update(
      accountId,
      {
        isActive: false,
        frozenReason: reason,
      } as Partial<Omit<AccountEntity, 'id' | 'version' | 'createdAt' | 'updatedAt'>>,
      account.version
    );
  }

  /**
   * Unfreeze account
   *
   * @param accountId - Account ID
   * @returns Updated account
   */
  async unfreezeAccount(accountId: string): Promise<AccountEntity> {
    log.info('Unfreezing account', { accountId });

    const account = await this.findById(accountId);

    if (!account) {
      throw new Error(`Account not found: ${accountId}`);
    }

    return this.update(
      accountId,
      {
        isActive: true,
        frozenReason: undefined,
      } as Partial<Omit<AccountEntity, 'id' | 'version' | 'createdAt' | 'updatedAt'>>,
      account.version
    );
  }

  /**
   * Get total balance across all accounts
   *
   * @returns Total balance
   */
  async getTotalBalance(): Promise<number> {
    log.debug('Calculating total balance');

    const accounts = await this.findAll();
    const total = accounts.reduce((sum, account) => sum + account.balance, 0);

    log.debug('Total balance calculated', { total, accountCount: accounts.length });

    return total;
  }

  /**
   * Get balance by account type
   *
   * @returns Balance summary by type
   */
  async getBalanceByType(): Promise<Record<string, number>> {
    log.debug('Getting balance by account type');

    const accounts = await this.findAll();

    const balances: Record<string, number> = {
      user_contributions: 0,
      board_treasury: 0,
      project_fund: 0,
      general_fund: 0,
    };

    accounts.forEach((account) => {
      balances[account.type] = (balances[account.type] || 0) + account.balance;
    });

    log.debug('Balances by type calculated', balances);

    return balances;
  }
}
