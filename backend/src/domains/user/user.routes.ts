import { Router } from 'express';
import { UserController } from './controllers/user.controller';
import { UserService } from './services/user.service';
import { UserRepository } from './repositories/user.repository';
import { StorageService } from '../storage/services/storage.service';
import { StorageRepository } from '../storage/repositories/storage.repository';
import { getDb } from '../../shared/config/firebase.config';

const userRepository = new UserRepository(getDb());
const storageRepository = new StorageRepository(getDb());
const storageService = new StorageService(storageRepository);
const userService = new UserService(userRepository, storageService);
const userController = new UserController(userService);

const router = Router();

// Public routes (no auth required)
router.post('/register', (req, res, next) => userController.register(req, res, next));
router.post('/login', (req, res, next) => userController.login(req, res, next));

// Protected routes (auth required) - temporarily disabled for testing
router.get('/', (req, res, next) => userController.getAllUsers(req, res, next));
router.get('/pending', (req, res, next) => userController.getPendingApprovals(req, res, next));
router.get('/:id', (req, res, next) => userController.getUserById(req, res, next));
router.put('/:id', (req, res, next) => userController.updateUser(req, res, next));
router.post('/:id/approve', (req, res, next) => userController.approveUser(req, res, next));
router.post('/:id/ban', (req, res, next) => userController.banUser(req, res, next));

export default router;
