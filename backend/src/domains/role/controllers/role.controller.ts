import { Request, Response, NextFunction } from 'express';
import { RoleService } from '../services/role.service';

/**
 * RoleController - HTTP request handling for Role domain
 *
 * Responsibility: Parse requests, call service, format responses
 */
export class RoleController {
  constructor(private roleService: RoleService) {}

  /**
   * @swagger
   * /api/roles:
   *   get:
   *     summary: Get all roles
   *     description: Retrieve all roles ordered by hierarchy (superadmin first)
   *     tags: [Role]
   *     responses:
   *       200:
   *         description: Roles retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Role'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async getAllRoles(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roles = await this.roleService.getAllRoles();
      res.status(200).json({ success: true, data: roles });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/roles/{id}:
   *   get:
   *     summary: Get role by ID
   *     description: Retrieve a specific role by its ID
   *     tags: [Role]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Role ID (e.g., member, board, admin, superadmin)
   *     responses:
   *       200:
   *         description: Role retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/Role'
   *       404:
   *         description: Role not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async getRoleById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const role = await this.roleService.getRoleById(req.params.id);
      res.status(200).json({ success: true, data: role });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/roles:
   *   post:
   *     summary: Create new role
   *     description: Create a new role with permissions. Admin only.
   *     tags: [Role]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - id
   *               - name
   *               - level
   *               - permissions
   *             properties:
   *               id:
   *                 type: string
   *                 example: "moderator"
   *                 description: Unique role ID (lowercase, alphanumeric, 3-20 chars)
   *               name:
   *                 type: string
   *                 example: "Moderator"
   *                 description: Display name (2-50 chars)
   *               level:
   *                 type: number
   *                 example: 2
   *                 description: Hierarchy level (1-5, higher = more power)
   *               permissions:
   *                 type: array
   *                 items:
   *                   type: string
   *                 example: ["vote", "view_announcements", "approve_users"]
   *                 description: Array of permission strings
   *               description:
   *                 type: string
   *                 example: "Moderator with approval permissions"
   *                 description: Optional role description (max 200 chars)
   *     responses:
   *       201:
   *         description: Role created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/Role'
   *       400:
   *         description: Validation error (invalid format, level, permissions)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       409:
   *         description: Conflict (ID or name already exists)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async createRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const role = await this.roleService.createRole(req.body);
      res.status(201).json({ success: true, data: role });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/roles/{id}:
   *   put:
   *     summary: Update role
   *     description: Update role name, permissions, or description. Cannot change ID or level. Admin only.
   *     tags: [Role]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Role ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 example: "Updated Name"
   *               permissions:
   *                 type: array
   *                 items:
   *                   type: string
   *                 example: ["vote", "approve_users", "manage_board"]
   *               description:
   *                 type: string
   *                 example: "Updated description"
   *     responses:
   *       200:
   *         description: Role updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/Role'
   *       400:
   *         description: Validation error
   *       404:
   *         description: Role not found
   *       409:
   *         description: Name already exists
   */
  async updateRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const role = await this.roleService.updateRole(req.params.id, req.body);
      res.status(200).json({ success: true, data: role });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/roles/{id}:
   *   delete:
   *     summary: Delete role
   *     description: Delete a role. Cannot delete if users are assigned to this role. Cannot delete predefined roles. Admin only.
   *     tags: [Role]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Role ID
   *     responses:
   *       200:
   *         description: Role deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Role deleted successfully"
   *       400:
   *         description: Cannot delete predefined role
   *       404:
   *         description: Role not found
   *       409:
   *         description: Role has users assigned (cannot delete)
   */
  async deleteRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.roleService.deleteRole(req.params.id);
      res.status(200).json({ success: true, message: 'Role deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/roles/level/{level}:
   *   get:
   *     summary: Get roles by hierarchy level
   *     description: Retrieve all roles at a specific hierarchy level (1-5)
   *     tags: [Role]
   *     parameters:
   *       - in: path
   *         name: level
   *         required: true
   *         schema:
   *           type: number
   *         description: Hierarchy level (1-5)
   *     responses:
   *       200:
   *         description: Roles retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Role'
   *       400:
   *         description: Invalid level (must be 1-5)
   */
  async getRolesByLevel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const level = parseInt(req.params.level);
      const roles = await this.roleService.getRolesByLevel(level);
      res.status(200).json({ success: true, data: roles });
    } catch (error) {
      next(error);
    }
  }
}
