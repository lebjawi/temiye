import { Router } from 'express';
import { PasswordResetController } from './controllers/password-reset.controller';
import { PasswordResetService } from './services/password-reset.service';
import { PasswordResetRepository } from './repositories/password-reset.repository';
import { UserRepository } from '../user/repositories/user.repository';
import { getDb } from '../../shared/config/firebase.config';

const router = Router();

// Initialize dependencies
const passwordResetRepository = new PasswordResetRepository(getDb());
const userRepository = new UserRepository(getDb());
const passwordResetService = new PasswordResetService(passwordResetRepository, userRepository);
const passwordResetController = new PasswordResetController(passwordResetService);

// Password reset routes (all public)
router.post('/request', (req, res, next) => passwordResetController.requestReset(req, res, next));
router.post('/verify', (req, res, next) => passwordResetController.verifyCode(req, res, next));
router.post('/reset', (req, res, next) => passwordResetController.resetPassword(req, res, next));

export default router;
