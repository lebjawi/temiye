import { Request, Response, NextFunction } from 'express';
import { PasswordResetService } from '../services/password-reset.service';

export class PasswordResetController {
  constructor(private passwordResetService: PasswordResetService) {}

  /**
   * @swagger
   * /api/password-reset/request:
   *   post:
   *     summary: Request password reset
   *     description: Generate and send 6-digit reset code to phone (15-minute expiry)
   *     tags: [Password Reset]
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
   *                 example: "+22212345678"
   *                 description: User's phone number
   *     responses:
   *       200:
   *         description: Reset code sent
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
   *                     message:
   *                       type: string
   *                       example: "Reset code sent to your phone"
   *       404:
   *         description: User not found
   */
  async requestReset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.passwordResetService.requestReset(req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/password-reset/verify:
   *   post:
   *     summary: Verify reset code
   *     description: Check if reset code is valid and not expired
   *     tags: [Password Reset]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - phone
   *               - code
   *             properties:
   *               phone:
   *                 type: string
   *                 example: "+22212345678"
   *               code:
   *                 type: string
   *                 example: "123456"
   *                 description: 6-digit reset code
   *     responses:
   *       200:
   *         description: Code verification result
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
   *                     valid:
   *                       type: boolean
   *                     message:
   *                       type: string
   */
  async verifyCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.passwordResetService.verifyCode(req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/password-reset/reset:
   *   post:
   *     summary: Reset password
   *     description: Reset password with verified code (code becomes invalid after use)
   *     tags: [Password Reset]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - phone
   *               - code
   *               - newPassword
   *             properties:
   *               phone:
   *                 type: string
   *                 example: "+22212345678"
   *               code:
   *                 type: string
   *                 example: "123456"
   *               newPassword:
   *                 type: string
   *                 example: "newSecurePassword123"
   *                 description: New password (8-128 chars)
   *     responses:
   *       200:
   *         description: Password reset successful
   *       400:
   *         description: Invalid or expired code
   *       404:
   *         description: User not found
   */
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.passwordResetService.resetPassword(req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
