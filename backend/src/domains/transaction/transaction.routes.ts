import { Router } from 'express';
import { TransactionController } from './controllers/transaction.controller';
import { TransactionService } from './services/transaction.service';
import { TransactionRepository } from './repositories/transaction.repository';
import { getDb } from '../../shared/config/firebase.config';

const router = Router();

// Initialize dependencies
const transactionRepository = new TransactionRepository(getDb());
const transactionService = new TransactionService(transactionRepository);
const transactionController = new TransactionController(transactionService);

// Transaction routes
router.post('/', (req, res, next) => transactionController.createTransaction(req, res, next));
router.get('/', (req, res, next) => transactionController.getAllTransactions(req, res, next));
router.get('/:id', (req, res, next) => transactionController.getTransactionById(req, res, next));

// UPDATE returns 405 - Transactions are immutable
router.put('/:id', (req, res, next) => transactionController.updateTransaction(req, res, next));

// Soft delete (superadmin only)
router.delete('/:id', (req, res, next) => transactionController.deleteTransaction(req, res, next));

export default router;
