import { PasswordResetToken } from '../entities/PasswordResetToken';
import { PasswordResetRepository } from '../repositories/password-reset.repository';
import { UserRepository } from '../../user/repositories/user.repository';
import { RequestResetDTO } from '../dtos/RequestResetDTO';
import { VerifyResetDTO } from '../dtos/VerifyResetDTO';
import { ResetPasswordDTO } from '../dtos/ResetPasswordDTO';
import { NotFoundError } from '../../../shared/errors/NotFoundError';
import { ValidationError } from '../../../shared/errors/ValidationError';
import { hashPassword } from '../../../shared/utils/password.util';

export class PasswordResetService {
  constructor(
    private passwordResetRepository: PasswordResetRepository,
    private userRepository: UserRepository
  ) {}

  async requestReset(data: any): Promise<{ message: string; code?: string }> {
    const dto = new RequestResetDTO(data);
    dto.validate();

    // Check if user exists
    const user = await this.userRepository.findByPhone(dto.phone);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Generate reset token
    const token = PasswordResetToken.create(dto.phone, 15);
    await this.passwordResetRepository.create(token.toFirestore());

    // TODO: Send code via SMS/WhatsApp (not implemented yet)
    console.log(`Password reset code for ${dto.phone}: ${token.code}`);

    return {
      message: 'Reset code sent to your phone',
      code: token.code // TODO: Remove in production, only for testing
    };
  }

  async verifyCode(data: any): Promise<{ valid: boolean; message: string }> {
    const dto = new VerifyResetDTO(data);
    dto.validate();

    const token = await this.passwordResetRepository.findValid(dto.phone, dto.code);

    if (!token) {
      return { valid: false, message: 'Invalid or expired reset code' };
    }

    return { valid: true, message: 'Reset code verified successfully' };
  }

  async resetPassword(data: any): Promise<{ message: string }> {
    const dto = new ResetPasswordDTO(data);
    dto.validate();

    // Verify token is still valid
    const token = await this.passwordResetRepository.findValid(dto.phone, dto.code);
    if (!token) {
      throw new ValidationError('Invalid or expired reset code');
    }

    // Find user
    const user = await this.userRepository.findByPhone(dto.phone);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Hash new password
    const passwordHash = await hashPassword(dto.newPassword);

    // Update user password
    await this.userRepository.update(user.id, {
      passwordHash,
      updatedAt: new Date()
    });

    // Mark token as used
    await this.passwordResetRepository.markAsUsed(token.id);

    return { message: 'Password reset successfully' };
  }

  async deleteExpiredTokens(): Promise<number> {
    return this.passwordResetRepository.deleteExpired();
  }
}
