import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { LoginUserDTO } from '../dtos/LoginUserDTO';
import { LoginAdminDTO } from '../dtos/LoginAdminDTO';

export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * @swagger
   * /api/auth/login/user:
   *   post:
   *     summary: Login as community user
   *     description: Authenticate with phone number and password. Returns JWT token (7-day expiry).
   *     tags: [Auth]
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
   *                 description: Mauritanian phone number (+222 + 8 digits)
   *               password:
   *                 type: string
   *                 example: "securePassword123"
   *                 description: User password (8-128 characters)
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
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     token:
   *                       type: string
   *                       description: JWT token
   *                     user:
   *                       $ref: '#/components/schemas/User'
   *                     expiresAt:
   *                       type: string
   *                       format: date-time
   *       400:
   *         description: Validation error (invalid phone format, weak password)
   *       401:
   *         description: Invalid phone or password
   *       403:
   *         description: User banned, pending, or rejected
   */
  async loginUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = new LoginUserDTO(req.body);
      dto.validate();

      const result = await this.authService.authenticateUser(dto.phone, dto.password);
      res.status(200).json({ success: true, data: result.toJSON() });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/auth/login/admin:
   *   post:
   *     summary: Login as admin
   *     description: Authenticate with Firebase Google OAuth token. Returns JWT token (7-day expiry). Admin must be approved by superadmin.
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - firebaseToken
   *             properties:
   *               firebaseToken:
   *                 type: string
   *                 description: Firebase ID token from Google OAuth
   *                 example: "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
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
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     token:
   *                       type: string
   *                       description: JWT token
   *                     admin:
   *                       type: object
   *                       properties:
   *                         id:
   *                           type: string
   *                         email:
   *                           type: string
   *                         status:
   *                           type: string
   *                           enum: [pending, approved, rejected]
   *                     expiresAt:
   *                       type: string
   *                       format: date-time
   *       400:
   *         description: Validation error (invalid token format)
   *       401:
   *         description: Invalid Firebase token
   *       403:
   *         description: Admin pending approval or rejected
   */
  async loginAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = new LoginAdminDTO(req.body);
      dto.validate();

      const result = await this.authService.authenticateAdmin(dto.firebaseToken);
      res.status(200).json({ success: true, data: result.toJSON() });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/auth/refresh:
   *   post:
   *     summary: Refresh JWT token
   *     description: Get a new JWT token using the current valid token. Extends session by 7 days.
   *     tags: [Auth]
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: Token refreshed successfully
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
   *                     user:
   *                       $ref: '#/components/schemas/User'
   *                     expiresAt:
   *                       type: string
   *                       format: date-time
   *       401:
   *         description: Unauthorized (invalid or expired token)
   *       404:
   *         description: User not found
   */
  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const isAdmin = req.user?.role === 'admin';

      if (!userId) {
        throw new Error('User ID not found in token');
      }

      const result = await this.authService.refreshToken(userId, isAdmin);
      res.status(200).json({ success: true, data: result.toJSON() });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/auth/me:
   *   get:
   *     summary: Get current authenticated user
   *     description: Returns the currently authenticated user or admin based on JWT token.
   *     tags: [Auth]
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: Current user retrieved
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   oneOf:
   *                     - $ref: '#/components/schemas/User'
   *                     - type: object
   *                       description: Admin object
   *       401:
   *         description: Unauthorized (no token or invalid token)
   */
  async getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // User/admin data already injected by middleware
      const userData = req.user;
      res.status(200).json({ success: true, data: userData });
    } catch (error) {
      next(error);
    }
  }
}
