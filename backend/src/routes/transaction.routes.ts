/**
 * Transaction Routes
 *
 * Routes for financial transaction management
 * Base path: /api/transactions
 *
 * Implements double-entry bookkeeping with ACID guarantees
 */

import { Router } from 'express';
import { TransactionController } from '../controllers/transaction.controller';
import { authenticate, authenticateAdmin } from '../middleware/authenticate';
import { requirePermission } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/error-handler';
import { body, param, query } from 'express-validator';

const router = Router();
const controller = new TransactionController();

/**
 * @openapi
 * /api/transactions:
 *   post:
 *     summary: Create new transaction
 *     description: |
 *       Create a financial transaction with double-entry bookkeeping.
 *
 *       **Double-Entry Rules:**
 *       - Every transaction must have debits and credits
 *       - Total debits must equal total credits
 *       - All account balances updated atomically
 *
 *       **Transaction Types:**
 *       - contribution: User pays monthly contribution
 *       - donation: One-time donation
 *       - spending: Board/project spending
 *       - transfer: Transfer between accounts
 *
 *       **Status Workflow:**
 *       1. Created as 'pending'
 *       2. Admin reviews and approves/rejects
 *       3. On approval: Balances updated atomically
 *       4. Status changes to 'completed'
 *     tags:
 *       - Transactions
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - amount
 *               - debits
 *               - credits
 *               - method
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [contribution, donation, spending, transfer]
 *               amount:
 *                 type: number
 *                 minimum: 0
 *                 example: 1000
 *               debits:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     accountId:
 *                       type: string
 *               credits:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     accountId:
 *                       type: string
 *               method:
 *                 type: string
 *                 enum: [cash, bank_transfer, mobile_money, other]
 *               memo:
 *                 type: string
 *               category:
 *                 type: string
 *               month:
 *                 type: string
 *                 example: "2025-01"
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *       400:
 *         description: Validation error
 */
router.post(
  '/',
  authenticate,
  [
    body('type')
      .isIn(['contribution', 'donation', 'spending', 'transfer'])
      .withMessage('Invalid transaction type'),
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('debits').isArray({ min: 1 }).withMessage('At least one debit account required'),
    body('credits').isArray({ min: 1 }).withMessage('At least one credit account required'),
    body('method')
      .isIn(['cash', 'bank_transfer', 'mobile_money', 'other'])
      .withMessage('Invalid payment method'),
  ],
  validate,
  asyncHandler(controller.createTransaction.bind(controller))
);

/**
 * @openapi
 * /api/transactions/{id}:
 *   get:
 *     summary: Get transaction by ID
 *     tags:
 *       - Transactions
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
 *       404:
 *         description: Transaction not found
 */
router.get(
  '/:id',
  authenticate,
  param('id').isString().notEmpty(),
  validate,
  asyncHandler(controller.getTransaction.bind(controller))
);

/**
 * @openapi
 * /api/transactions:
 *   get:
 *     summary: List user transactions
 *     tags:
 *       - Transactions
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Transactions listed
 */
router.get(
  '/',
  authenticate,
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validate,
  asyncHandler(controller.listTransactions.bind(controller))
);

/**
 * @openapi
 * /api/transactions/pending:
 *   get:
 *     summary: List pending transaction approvals (admin only)
 *     tags:
 *       - Transactions
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Pending transactions listed
 */
router.get(
  '/pending',
  authenticateAdmin,
  requirePermission('approveTransactions'),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validate,
  asyncHandler(controller.listPendingApprovals.bind(controller))
);

/**
 * @openapi
 * /api/transactions/{id}/approve:
 *   post:
 *     summary: Approve transaction (admin only)
 *     description: |
 *       Approve pending transaction and execute account balance updates.
 *
 *       **ACID Guarantees:**
 *       - All account updates are atomic
 *       - If any update fails, entire transaction rolls back
 *       - Account balances always accurate
 *     tags:
 *       - Transactions
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
 *         description: Transaction approved
 *       403:
 *         description: Insufficient permissions
 */
router.post(
  '/:id/approve',
  authenticateAdmin,
  requirePermission('approveTransactions'),
  param('id').isString().notEmpty(),
  validate,
  asyncHandler(controller.approveTransaction.bind(controller))
);

/**
 * @openapi
 * /api/transactions/{id}/reject:
 *   post:
 *     summary: Reject transaction (admin only)
 *     tags:
 *       - Transactions
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
 *         description: Transaction rejected
 */
router.post(
  '/:id/reject',
  authenticateAdmin,
  requirePermission('approveTransactions'),
  [param('id').isString().notEmpty(), body('reason').isString().notEmpty()],
  validate,
  asyncHandler(controller.rejectTransaction.bind(controller))
);

export default router;
