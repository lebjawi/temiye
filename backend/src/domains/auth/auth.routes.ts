import { Router } from 'express';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { UserRepository } from '../user/repositories/user.repository';
import { AdminRepository } from '../admin/repositories/admin.repository';
import { getDb } from '../../shared/config/firebase.config';
import { authenticate } from './middleware/auth.middleware';

/**
 * Auth Routes
 *
 * Endpoints:
 * - POST /api/auth/login/user - Login as community user (phone + password)
 * - POST /api/auth/login/admin - Login as admin (Firebase OAuth)
 * - POST /api/auth/refresh - Refresh JWT token (requires auth)
 * - GET /api/auth/me - Get current user (requires auth)
 */

// Dependency Injection
const db = getDb();
const userRepository = new UserRepository(db);
const adminRepository = new AdminRepository(db);
const authService = new AuthService(userRepository, adminRepository);
const authController = new AuthController(authService);

// Router
const router = Router();

// Public routes (no auth required)
router.post('/login/user', (req, res, next) => authController.loginUser(req, res, next));
router.post('/login/admin', (req, res, next) => authController.loginAdmin(req, res, next));

// Protected routes (auth required)
router.post('/refresh', authenticate, (req, res, next) => authController.refreshToken(req, res, next));
router.get('/me', authenticate, (req, res, next) => authController.getCurrentUser(req, res, next));

export default router;
