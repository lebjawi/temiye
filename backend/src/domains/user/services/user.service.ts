import { User } from '../entities/User';
import { UserRepository } from '../repositories/user.repository';
import { CreateUserDTO } from '../dtos/CreateUserDTO';
import { LoginUserDTO } from '../dtos/LoginUserDTO';
import { UpdateUserDTO } from '../dtos/UpdateUserDTO';
import { ConflictError } from '../../../shared/errors/ConflictError';
import { NotFoundError } from '../../../shared/errors/NotFoundError';
import { UnauthorizedError } from '../../../shared/errors/UnauthorizedError';
import { ForbiddenError } from '../../../shared/errors/ForbiddenError';
import { ValidationError } from '../../../shared/errors/ValidationError';
import { verifyPassword } from '../../../shared/utils/password.util';
import { generateToken } from '../../../shared/utils/jwt.util';
import { StorageService } from '../../storage/services/storage.service';

export class UserService {
  constructor(
    private userRepository: UserRepository,
    private storageService: StorageService
  ) {}

  async createUser(data: any): Promise<User> {
    const dto = new CreateUserDTO(data);
    dto.validate();

    const existing = await this.userRepository.findByPhone(dto.phone);
    if (existing) {
      throw new ConflictError('Phone number already exists');
    }

    const userData = await dto.toEntity();
    const user = User.create(userData);
    return this.userRepository.create(user.toFirestore());
  }

  async loginUser(data: any): Promise<{ token: string; user: any }> {
    const dto = new LoginUserDTO(data);
    dto.validate();

    const user = await this.userRepository.findByPhone(dto.phone);
    if (!user) {
      throw new UnauthorizedError('Invalid phone or password');
    }

    const isValid = await verifyPassword(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid phone or password');
    }

    if (user.status === 'banned') {
      throw new ForbiddenError('User is banned');
    }

    if (user.status === 'pending') {
      throw new ForbiddenError('User not approved yet');
    }

    if (user.status !== 'active') {
      throw new ForbiddenError('User account is not active');
    }

    await this.userRepository.updateLastLogin(user.id);

    const token = generateToken({
      userId: user.id,
      phone: user.phone,
      role: user.role,
      tier: user.tier,
      status: user.status
    });

    return { token, user: user.toPublic() };
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  async getAllUsers(page: number = 1, limit: number = 20): Promise<User[]> {
    const offset = (page - 1) * limit;
    return this.userRepository.findAll(limit, offset);
  }

  async getPendingApprovals(): Promise<User[]> {
    return this.userRepository.findByStatus('pending');
  }

  async updateUser(id: string, data: any): Promise<User> {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('User not found');
    }

    const dto = new UpdateUserDTO(data);
    dto.validate();

    // Handle profile picture reference counting
    if (dto.profilePictureRef !== undefined) {
      const newProfilePictureRef = dto.profilePictureRef === '' ? null : dto.profilePictureRef;
      await this.handleProfilePictureUpdate(existing.profilePictureRef, newProfilePictureRef);
    }

    const merged = new User({ ...existing, ...dto.toEntity() });
    merged.validate();

    return this.userRepository.update(id, dto.toEntity());
  }

  /**
   * Handle profile picture reference counting
   *
   * @param oldFileId - Current profile picture file ID (or undefined/null)
   * @param newFileId - New profile picture file ID (or null to remove)
   */
  private async handleProfilePictureUpdate(
    oldFileId: string | undefined,
    newFileId: string | null
  ): Promise<void> {
    // Validate new file exists and is correct category if provided
    if (newFileId) {
      const { file } = await this.storageService.getFileById(newFileId);

      if (file.category !== 'user-profile') {
        throw new ValidationError(
          `Invalid file category. Expected 'user-profile', got '${file.category}'`
        );
      }

      if (file.deleted) {
        throw new ValidationError('Cannot reference a deleted file');
      }
    }

    // Decrement old file reference if changing
    if (oldFileId && oldFileId !== newFileId) {
      try {
        await this.storageService.decrementReferenceCount(oldFileId);
      } catch (error) {
        // Log error but don't fail update if old file doesn't exist
        console.warn(`Failed to decrement reference count for old profile picture ${oldFileId}:`, error);
      }
    }

    // Increment new file reference if provided and different from old
    if (newFileId && newFileId !== oldFileId) {
      await this.storageService.incrementReferenceCount(newFileId);
    }
  }

  async approveUser(id: string, approvedBy: string): Promise<User> {
    const user = await this.getUserById(id);

    user.transitionTo('active');
    user.approvedBy = approvedBy;
    user.approvedAt = new Date();

    return this.userRepository.update(id, {
      status: 'active',
      approvedBy,
      approvedAt: new Date(),
      updatedAt: new Date()
    });
  }

  async banUser(id: string): Promise<User> {
    const user = await this.getUserById(id);
    user.transitionTo('banned');

    return this.userRepository.update(id, {
      status: 'banned',
      updatedAt: new Date()
    });
  }
}
