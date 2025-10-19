import { Router } from 'express';
import { RoleController } from './controllers/role.controller';
import { RoleService } from './services/role.service';
import { RoleRepository } from './repositories/role.repository';
import { getDb } from '../../shared/config/firebase.config';

/**
 * Role Routes
 *
 * Endpoints:
 * - GET /api/roles - Get all roles
 * - GET /api/roles/:id - Get role by ID
 * - POST /api/roles - Create new role
 * - PUT /api/roles/:id - Update role
 * - DELETE /api/roles/:id - Delete role
 * - GET /api/roles/level/:level - Get roles by level
 */

// Dependency Injection
const roleRepository = new RoleRepository(getDb());
const roleService = new RoleService(roleRepository);
const roleController = new RoleController(roleService);

// Router
const router = Router();

// Routes
router.get('/', (req, res, next) => roleController.getAllRoles(req, res, next));
router.get('/level/:level', (req, res, next) => roleController.getRolesByLevel(req, res, next));
router.get('/:id', (req, res, next) => roleController.getRoleById(req, res, next));
router.post('/', (req, res, next) => roleController.createRole(req, res, next));
router.put('/:id', (req, res, next) => roleController.updateRole(req, res, next));
router.delete('/:id', (req, res, next) => roleController.deleteRole(req, res, next));

export default router;
