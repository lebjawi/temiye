import { Router } from 'express';
import { AdminController } from './controllers/admin.controller';
import { AdminService } from './services/admin.service';
import { AdminRepository } from './repositories/admin.repository';
import { getDb } from '../../shared/config/firebase.config';

const router = Router();

// Initialize dependencies
const adminRepository = new AdminRepository(getDb());
const adminService = new AdminService(adminRepository);
const adminController = new AdminController(adminService);

// Admin routes
router.post('/', (req, res, next) => adminController.createAdmin(req, res, next));
router.get('/', (req, res, next) => adminController.getAllAdmins(req, res, next));
router.get('/pending', (req, res, next) => adminController.getPendingApprovals(req, res, next));
router.get('/:id', (req, res, next) => adminController.getAdminById(req, res, next));
router.post('/:id/approve', (req, res, next) => adminController.approveAdmin(req, res, next));
router.post('/:id/reject', (req, res, next) => adminController.rejectAdmin(req, res, next));
router.delete('/:id', (req, res, next) => adminController.deleteAdmin(req, res, next));

export default router;
