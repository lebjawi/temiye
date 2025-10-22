/**
 * Transaction Controller
 *
 * Handles HTTP requests for financial transactions
 * Implements double-entry bookkeeping with ACID guarantees
 *
 * THIN CONTROLLER: Just handles request/response
 * Business logic is in TransactionService
 */

import { Response } from 'express';
import { TransactionService, CreateTransactionInput } from '../services/transaction.service';
import { TransactionRepository } from '../repositories/transaction.repository';
import { AccountRepository } from '../repositories/account.repository';
import { db } from '../config/database';
import { createLogger } from '../utils/logger.utils';
import { AuthenticatedRequest } from '../middleware/authenticate';
import { badRequest, forbidden, notFound } from '../middleware/error-handler';

const log = createLogger(__filename);

/**
 * Transaction Controller Class
 */
export class TransactionController {
  private transactionService: TransactionService;

  constructor() {
    const transactionRepo = new TransactionRepository(db);
    const accountRepo = new AccountRepository(db);
    this.transactionService = new TransactionService(transactionRepo, accountRepo);
  }

  /**
   * Create new transaction
   *
   * POST /api/transactions
   *
   * @param req - Authenticated request
   * @param res - Express response
   */
  async createTransaction(req: AuthenticatedRequest, res: Response): Promise<void> {
    const requestId = req.requestId || 'unknown';

    log.info('Create transaction request', { requestId });

    try {
      if (!req.user) {
        throw forbidden('Authentication required');
      }

      const input = req.body as Partial<CreateTransactionInput>;

      if (!input.type || !input.amount || !input.debits || !input.credits || !input.method) {
        throw badRequest('Missing required fields: type, amount, debits, credits, method');
      }

      // Get user document reference
      const createdByRef = db.collection('users').doc(req.user.sub);

      const createdByNameAr = input.createdByNameAr || 'Unknown';

      const transactionInput: CreateTransactionInput = {
        ...input,
        createdById: req.user.sub,
        createdByNameAr,
        createdByRef,
      } as CreateTransactionInput;

      const transaction = await this.transactionService.createTransaction(transactionInput);

      log.info('Transaction created successfully', {
        requestId,
        transactionId: transaction.id,
        amount: transaction.amount,
      });

      res.status(201).json({
        success: true,
        message: 'Transaction created successfully. Awaiting approval.',
        data: { transaction },
        timestamp: Date.now(),
      });
    } catch (error) {
      log.error('Create transaction failed', error as Error, { requestId });
      throw error;
    }
  }

  /**
   * Get transaction by ID
   *
   * GET /api/transactions/:id
   *
   * @param req - Authenticated request
   * @param res - Express response
   */
  async getTransaction(req: AuthenticatedRequest, res: Response): Promise<void> {
    const requestId = req.requestId || 'unknown';
    const { id } = req.params;

    if (!id) throw badRequest('Transaction ID is required');

    log.info('Get transaction request', { requestId, transactionId: id });

    try {
      const transaction = await this.transactionService.getTransactionById(id);

      if (!transaction) {
        throw notFound(`Transaction not found: ${id}`);
      }

      log.info('Transaction retrieved', { requestId, transactionId: id });

      res.status(200).json({
        success: true,
        data: { transaction },
        timestamp: Date.now(),
      });
    } catch (error) {
      log.error('Get transaction failed', error as Error, { requestId });
      throw error;
    }
  }

  /**
   * List user transactions
   *
   * GET /api/transactions
   *
   * @param req - Authenticated request
   * @param res - Express response
   */
  async listTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
    const requestId = req.requestId || 'unknown';

    log.info('List transactions request', { requestId });

    try {
      if (!req.user) {
        throw forbidden('Authentication required');
      }

      const limit = parseInt((req.query['limit'] as string) || '50', 10);
      const userId = req.user.sub;

      const transactions = await this.transactionService.listUserTransactions(userId, limit);

      log.info('Transactions listed', {
        requestId,
        userId,
        count: transactions.length,
      });

      res.status(200).json({
        success: true,
        data: {
          transactions,
          count: transactions.length,
        },
        timestamp: Date.now(),
      });
    } catch (error) {
      log.error('List transactions failed', error as Error, { requestId });
      throw error;
    }
  }

  /**
   * Approve transaction (admin only)
   *
   * POST /api/transactions/:id/approve
   *
   * @param req - Authenticated request
   * @param res - Express response
   */
  async approveTransaction(req: AuthenticatedRequest, res: Response): Promise<void> {
    const requestId = req.requestId || 'unknown';
    const { id } = req.params;

    if (!id) throw badRequest('Transaction ID is required');

    log.info('Approve transaction request', { requestId, transactionId: id });

    try {
      if (!req.user || req.user.type !== 'admin') {
        throw forbidden('Admin access required');
      }

      const adminId = req.user.sub;
      const adminEmail = req.user.email || 'Unknown Admin';
      const adminRef = db.collection('admins').doc(adminId);

      const transaction = await this.transactionService.approveTransaction(
        id,
        adminId,
        adminEmail,
        adminRef
      );

      log.info('Transaction approved successfully', {
        requestId,
        transactionId: id,
        adminId,
      });

      res.status(200).json({
        success: true,
        message: 'Transaction approved and completed successfully',
        data: { transaction },
        timestamp: Date.now(),
      });
    } catch (error) {
      log.error('Approve transaction failed', error as Error, { requestId });
      throw error;
    }
  }

  /**
   * Reject transaction (admin only)
   *
   * POST /api/transactions/:id/reject
   *
   * @param req - Authenticated request
   * @param res - Express response
   */
  async rejectTransaction(req: AuthenticatedRequest, res: Response): Promise<void> {
    const requestId = req.requestId || 'unknown';
    const { id } = req.params;

    if (!id) throw badRequest('Transaction ID is required');

    log.info('Reject transaction request', { requestId, transactionId: id });

    try {
      if (!req.user || req.user.type !== 'admin') {
        throw forbidden('Admin access required');
      }

      const { reason } = req.body as { reason?: string };

      if (!reason) {
        throw badRequest('Rejection reason is required');
      }

      const transaction = await this.transactionService.rejectTransaction(id, reason);

      log.info('Transaction rejected', {
        requestId,
        transactionId: id,
        reason,
      });

      res.status(200).json({
        success: true,
        message: 'Transaction rejected',
        data: { transaction },
        timestamp: Date.now(),
      });
    } catch (error) {
      log.error('Reject transaction failed', error as Error, { requestId });
      throw error;
    }
  }

  /**
   * List pending approvals (admin only)
   *
   * GET /api/transactions/pending
   *
   * @param req - Authenticated request
   * @param res - Express response
   */
  async listPendingApprovals(req: AuthenticatedRequest, res: Response): Promise<void> {
    const requestId = req.requestId || 'unknown';

    log.info('List pending approvals request', { requestId });

    try {
      if (!req.user || req.user.type !== 'admin') {
        throw forbidden('Admin access required');
      }

      const limit = parseInt((req.query['limit'] as string) || '50', 10);

      const transactions = await this.transactionService.listPendingApprovals(limit);

      log.info('Pending approvals listed', {
        requestId,
        count: transactions.length,
      });

      res.status(200).json({
        success: true,
        data: {
          transactions,
          count: transactions.length,
        },
        timestamp: Date.now(),
      });
    } catch (error) {
      log.error('List pending approvals failed', error as Error, { requestId });
      throw error;
    }
  }
}
