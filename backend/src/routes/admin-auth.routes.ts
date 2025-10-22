/**
 * Admin Authentication Routes
 *
 * Routes for admin Google OAuth authentication and account management
 * Base path: /api/admin/auth
 */

import { Router } from 'express';
import { AdminAuthController } from '../controllers/admin-auth.controller';
import { authenticateAdmin } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { body } from 'express-validator';
import { asyncHandler } from '../middleware/error-handler';

const router = Router();
const controller = new AdminAuthController();

/**
 * @openapi
 * /api/admin/auth/google:
 *   post:
 *     summary: Admin Google OAuth login
 *     description: |
 *       Authenticates admin using Google OAuth.
 *       Frontend sends Firebase ID token, backend verifies and returns JWT.
 *
 *       **Flow:**
 *       1. Frontend: User clicks "Sign in with Google"
 *       2. Frontend: Firebase Auth handles Google OAuth
 *       3. Frontend: Gets Firebase ID token
 *       4. Frontend: POST to this endpoint with idToken
 *       5. Backend: Verifies token, creates/updates admin
 *       6. Backend: Returns JWT token
 *
 *       **Approval Workflow:**
 *       - New admins are created with status 'pending'
 *       - Super admin must approve before access is granted
 *       - Approved admins get JWT token and can use the system
 *     tags:
 *       - Admin Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Firebase ID token from Google authentication
 *                 example: "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
 *     responses:
 *       200:
 *         description: Login successful (admin approved)
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
 *                   example: "Admin authenticated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: JWT token for API authentication
 *                     expiresIn:
 *                       type: number
 *                       description: Token expiry time in seconds
 *                       example: 86400
 *                     admin:
 *                       $ref: '#/components/schemas/Admin'
 *       403:
 *         description: Admin pending approval or suspended
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/google',
  body('idToken').isString().notEmpty().withMessage('Google ID token is required'),
  validate,
  asyncHandler(controller.loginWithGoogle.bind(controller))
);

/**
 * @openapi
 * /api/admin/auth/me:
 *   get:
 *     summary: Get current authenticated admin
 *     description: Returns the profile of the currently authenticated admin
 *     tags:
 *       - Admin Authentication
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Admin profile retrieved successfully
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
 *                     admin:
 *                       $ref: '#/components/schemas/Admin'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/me', authenticateAdmin, asyncHandler(controller.getCurrentAdmin.bind(controller)));

/**
 * @openapi
 * /api/admin/auth/logout:
 *   post:
 *     summary: Admin logout
 *     description: Logout current admin (frontend should delete token)
 *     tags:
 *       - Admin Authentication
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
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
 *                   example: "Logged out successfully"
 */
router.post('/logout', authenticateAdmin, asyncHandler(controller.logout.bind(controller)));

export default router;
