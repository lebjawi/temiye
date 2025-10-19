import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';

export class UserController {
  constructor(private userService: UserService) {}

  /**
   * @swagger
   * /api/users/register:
   *   post:
   *     summary: Register new user
   *     description: Create new user account with phone + password. User starts in 'pending' status and requires admin approval.
   *     tags: [User]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - phone
   *               - name
   *               - password
   *             properties:
   *               phone:
   *                 type: string
   *                 example: "+22212345678"
   *                 description: Mauritanian phone number (+222 + 8 digits)
   *               name:
   *                 type: string
   *                 example: "Ahmed Mohamed"
   *                 description: User's full name (2-100 chars)
   *               password:
   *                 type: string
   *                 example: "securePassword123"
   *                 description: Password (8-128 chars, will be hashed)
   *     responses:
   *       201:
   *         description: User registered successfully (pending approval)
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/User'
   *       400:
   *         description: Validation error (invalid phone, weak password)
   *       409:
   *         description: Phone number already exists
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await this.userService.createUser(req.body);
      res.status(201).json({ success: true, data: user.toPublic() });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/users/login:
   *   post:
   *     summary: Login user
   *     description: Authenticate with phone + password. Returns JWT token (7-day expiry).
   *     tags: [User]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - phone
   *               - password
   *             properties:
   *               phone:
   *                 type: string
   *                 example: "+22212345678"
   *               password:
   *                 type: string
   *                 example: "securePassword123"
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     token:
   *                       type: string
   *                       description: JWT token (7-day expiry)
   *                     user:
   *                       $ref: '#/components/schemas/User'
   *       401:
   *         description: Invalid phone or password
   *       403:
   *         description: User banned or not approved
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.userService.loginUser(req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/users:
   *   get:
   *     summary: Get all users
   *     description: List all users with pagination (Admin only)
   *     tags: [User]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: number
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: number
   *           default: 20
   *     responses:
   *       200:
   *         description: Users retrieved
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
   *                     $ref: '#/components/schemas/User'
   */
  async getAllUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const users = await this.userService.getAllUsers(page, limit);
      res.status(200).json({ success: true, data: users.map(u => u.toPublic()) });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/users/{id}:
   *   get:
   *     summary: Get user by ID
   *     tags: [User]
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
   *         description: User retrieved
   *       404:
   *         description: User not found
   */
  async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await this.userService.getUserById(req.params.id);
      res.status(200).json({ success: true, data: user.toPublic() });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/users/{id}:
   *   put:
   *     summary: Update user profile
   *     description: Update user name and/or profile picture. Profile picture must be uploaded first via Storage API.
   *     tags: [User]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: User ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 example: "Ahmed Mohamed"
   *                 description: User's full name (2-100 chars)
   *               profilePictureRef:
   *                 type: string
   *                 example: "1vtwiujrD5zBbysS8nlj"
   *                 description: File ID from storage (category must be 'user-profile'). Set to empty string to remove.
   *     responses:
   *       200:
   *         description: User updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/User'
   *       400:
   *         description: Validation error (invalid file category, deleted file, etc.)
   *       404:
   *         description: User or file not found
   */
  async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await this.userService.updateUser(req.params.id, req.body);
      res.status(200).json({ success: true, data: user.toPublic() });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/users/{id}/approve:
   *   post:
   *     summary: Approve pending user
   *     description: Transition user from pending to active status (Superadmin only)
   *     tags: [User]
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
   *         description: User approved
   *       404:
   *         description: User not found
   *       409:
   *         description: Invalid state transition
   */
  async approveUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const approvedBy = req.user?.userId || 'admin';
      const user = await this.userService.approveUser(req.params.id, approvedBy);
      res.status(200).json({ success: true, data: user.toPublic() });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/users/{id}/ban:
   *   post:
   *     summary: Ban user
   *     description: Ban a user (Superadmin only)
   *     tags: [User]
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
   *         description: User banned
   *       404:
   *         description: User not found
   */
  async banUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await this.userService.banUser(req.params.id);
      res.status(200).json({ success: true, data: user.toPublic() });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/users/pending:
   *   get:
   *     summary: Get pending approvals
   *     description: List all users with pending status (Admin only)
   *     tags: [User]
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: Pending users retrieved
   */
  async getPendingApprovals(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await this.userService.getPendingApprovals();
      res.status(200).json({ success: true, data: users.map(u => u.toPublic()) });
    } catch (error) {
      next(error);
    }
  }
}
