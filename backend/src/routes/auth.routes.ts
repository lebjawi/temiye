/**
 * Auth Routes
 *
 * Routes for user authentication (phone + password)
 * Base path: /api/auth
 */

import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateUser } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { authRateLimiter, sensitiveRateLimiter } from '../middleware/rate-limit';
import { asyncHandler } from '../middleware/error-handler';
import {
  registerValidation,
  loginValidation,
  changePasswordValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
} from '../validators/auth.validator';

const router = Router();
const controller = new AuthController();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register new user
 *     description: |
 *       Register a new user with phone number and password.
 *
 *       **Security:**
 *       - Password is hashed with bcrypt (12 rounds)
 *       - Password NEVER stored in Firestore users collection
 *       - Stored in separate user_auth collection
 *       - New users start with 'pending' status
 *       - Admin approval may be required
 *     tags:
 *       - User Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - nameAr
 *               - password
 *               - deviceId
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "+222123456789"
 *                 description: Mauritanian phone number
 *               nameAr:
 *                 type: string
 *                 example: "أحمد محمد"
 *                 description: Name in Arabic
 *               nameFr:
 *                 type: string
 *                 example: "Ahmed Mohamed"
 *                 description: Name in French (optional)
 *               email:
 *                 type: string
 *                 example: "ahmed@example.com"
 *                 description: Email address (optional)
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "SecurePass123!"
 *                 description: Password (min 8 chars, with number and special char)
 *               deviceId:
 *                 type: string
 *                 example: "device_abc123"
 *                 description: Unique device identifier
 *               deviceName:
 *                 type: string
 *                 example: "iPhone 12"
 *                 description: Device name (optional)
 *     responses:
 *       201:
 *         description: User registered successfully
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                     expiresIn:
 *                       type: number
 *                       example: 604800
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/register',
  authRateLimiter, // 5 attempts per 15 minutes
  registerValidation,
  validate,
  asyncHandler(controller.register.bind(controller))
);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     description: |
 *       Login with phone number and password.
 *
 *       **Security:**
 *       - Account locked after 5 failed attempts
 *       - 30-minute lockout period
 *       - Failed attempts reset on successful login
 *     tags:
 *       - User Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - password
 *               - deviceId
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "+222123456789"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "SecurePass123!"
 *               deviceId:
 *                 type: string
 *                 example: "device_abc123"
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
 *                     expiresIn:
 *                       type: number
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials or account locked
 */
router.post(
  '/login',
  authRateLimiter, // 5 attempts per 15 minutes
  loginValidation,
  validate,
  asyncHandler(controller.login.bind(controller))
);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Get current user
 *     description: Returns the profile of the currently authenticated user
 *     tags:
 *       - User Authentication
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved
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
 *                     user:
 *                       $ref: '#/components/schemas/User'
 */
router.get('/me', authenticateUser, asyncHandler(controller.getCurrentUser.bind(controller)));

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: User logout
 *     description: Logout current user (frontend should delete token)
 *     tags:
 *       - User Authentication
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout', authenticateUser, asyncHandler(controller.logout.bind(controller)));

/**
 * @openapi
 * /api/auth/change-password:
 *   post:
 *     summary: Change password
 *     description: Change user password (requires old password)
 *     tags:
 *       - User Authentication
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password changed successfully
 */
router.post(
  '/change-password',
  authenticateUser,
  sensitiveRateLimiter, // 10 attempts per hour
  changePasswordValidation,
  validate,
  asyncHandler(controller.changePassword.bind(controller))
);

/**
 * @openapi
 * /api/auth/forgot-password:
 *   post:
 *     summary: Forgot password
 *     description: Request password reset code via SMS
 *     tags:
 *       - User Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "+222123456789"
 *     responses:
 *       200:
 *         description: Reset code sent (if user exists)
 */
router.post(
  '/forgot-password',
  sensitiveRateLimiter, // 10 attempts per hour
  forgotPasswordValidation,
  validate,
  asyncHandler(controller.forgotPassword.bind(controller))
);

/**
 * @openapi
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password with code
 *     description: Reset password using code from SMS
 *     tags:
 *       - User Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - resetCode
 *               - newPassword
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "+222123456789"
 *               resetCode:
 *                 type: string
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password reset successfully
 */
router.post(
  '/reset-password',
  sensitiveRateLimiter, // 10 attempts per hour
  resetPasswordValidation,
  validate,
  asyncHandler(controller.resetPassword.bind(controller))
);

export default router;
