import { Request, Response, NextFunction } from 'express';
import { TransactionService } from '../services/transaction.service';

export class TransactionController {
  constructor(private transactionService: TransactionService) {}

  /**
   * @swagger
   * /api/transactions:
   *   post:
   *     summary: Create transaction (IMMUTABLE)
   *     description: Create financial transaction (cannot be modified once created)
   *     tags: [Transaction]
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - userId
   *               - type
   *               - amount
   *               - description
   *             properties:
   *               userId:
   *                 type: string
   *               type:
   *                 type: string
   *                 enum: [contribution, expense, dividend, fine]
   *               amount:
   *                 type: number
   *               description:
   *                 type: string
   *               reference:
   *                 type: string
   *               notes:
   *                 type: string
   *     responses:
   *       201:
   *         description: Transaction created
   */
  async createTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const createdBy = req.user?.userId || 'admin';
      const transaction = await this.transactionService.createTransaction(req.body, createdBy);
      res.status(201).json({ success: true, data: transaction });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/transactions:
   *   get:
   *     summary: Get all transactions
   *     tags: [Transaction]
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: Transactions retrieved
   */
  async getAllTransactions(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const transactions = await this.transactionService.getAllTransactions();
      res.status(200).json({ success: true, data: transactions });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/transactions/{id}:
   *   get:
   *     summary: Get transaction by ID
   *     tags: [Transaction]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Transaction retrieved
   */
  async getTransactionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const transaction = await this.transactionService.getTransactionById(req.params.id);
      res.status(200).json({ success: true, data: transaction });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/transactions/{id}:
   *   put:
   *     summary: UPDATE NOT ALLOWED (405)
   *     description: Transactions are immutable - returns 405 Method Not Allowed
   *     tags: [Transaction]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       405:
   *         description: Method Not Allowed - Transactions are immutable
   */
  async updateTransaction(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
      await this.transactionService.updateTransaction(req.params.id, req.body);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/transactions/{id}:
   *   delete:
   *     summary: Soft delete transaction (Superadmin only)
   *     tags: [Transaction]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - reason
   *             properties:
   *               reason:
   *                 type: string
   *     responses:
   *       200:
   *         description: Transaction deleted (soft delete)
   */
  async deleteTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deletedBy = req.user?.userId || 'admin';
      await this.transactionService.deleteTransaction(req.params.id, deletedBy, req.body.reason);
      res.status(200).json({ success: true, message: 'Transaction deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
