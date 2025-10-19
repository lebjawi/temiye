import * as admin from 'firebase-admin';
import { User } from '../../user/entities/User';
import { Admin } from '../../admin/entities/Admin';
import { UserRepository } from '../../user/repositories/user.repository';
import { AdminRepository } from '../../admin/repositories/admin.repository';
import { UnauthorizedError } from '../../../shared/errors/UnauthorizedError';
import { ForbiddenError } from '../../../shared/errors/ForbiddenError';
import { NotFoundError } from '../../../shared/errors/NotFoundError';
import { verifyPassword } from '../../../shared/utils/password.util';
import { generateToken, JwtPayload } from '../../../shared/utils/jwt.util';
import { AuthResponseDTO } from '../dtos/AuthResponseDTO';

export class AuthService {
  constructor(
    private userRepository: UserRepository,
    private adminRepository: AdminRepository
  ) {}

  /**
   * Authenticate community user with phone + password
   * Returns JWT token and user data
   */
  async authenticateUser(phone: string, password: string): Promise<AuthResponseDTO> {
    // Find user by phone
    const user = await this.userRepository.findByPhone(phone);
    if (!user) {
      // Don't reveal if user exists
      throw new UnauthorizedError('Invalid phone or password');
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid phone or password');
    }

    // Validate user status
    this.validateUserStatus(user);

    // Update last login timestamp
    await this.userRepository.updateLastLogin(user.id);

    // Generate JWT token
    const payload: JwtPayload = {
      userId: user.id,
      phone: user.phone,
      role: user.role,
      tier: user.tier,
      status: user.status
    };
    const token = generateToken(payload);

    return new AuthResponseDTO({
      token,
      user: user.toPublic(),
      expiresInDays: parseInt(process.env.JWT_EXPIRY_DAYS || '7')
    });
  }

  /**
   * Authenticate admin with Firebase Google OAuth token
   * Verifies Firebase token and checks admin approval status
   */
  async authenticateAdmin(firebaseToken: string): Promise<AuthResponseDTO> {
    // Verify Firebase token
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(firebaseToken);
    } catch (error: any) {
      throw new UnauthorizedError('Invalid Firebase token');
    }

    const firebaseUid = decodedToken.uid;
    const email = decodedToken.email;

    if (!email) {
      throw new UnauthorizedError('Email not found in Firebase token');
    }

    // Find or create admin record
    let adminUser = await this.adminRepository.findByFirebaseUid(firebaseUid);

    // If admin doesn't exist, create pending admin
    if (!adminUser) {
      const newAdmin = Admin.create({
        firebaseUid,
        email,
        status: 'pending'
      });

      adminUser = await this.adminRepository.create(newAdmin.toFirestore());

      throw new ForbiddenError(
        'Admin account created but requires approval. Please contact a superadmin.'
      );
    }

    // Validate admin status
    this.validateAdminStatus(adminUser);

    // Update last login timestamp
    await this.adminRepository.updateLastLogin(adminUser.id);

    // Generate JWT token (admins also use JWT for consistency)
    const payload: JwtPayload = {
      userId: adminUser.id,
      phone: email, // Use email as "phone" for admins
      role: 'admin',
      tier: 'admin',
      status: adminUser.status
    };
    const token = generateToken(payload);

    return new AuthResponseDTO({
      token,
      admin: adminUser.toPublic(),
      expiresInDays: parseInt(process.env.JWT_EXPIRY_DAYS || '7')
    });
  }

  /**
   * Validate user can login (not pending/banned/rejected)
   */
  private validateUserStatus(user: User): void {
    if (user.status === 'banned') {
      throw new ForbiddenError('Your account has been banned');
    }

    if (user.status === 'pending') {
      throw new ForbiddenError('Your account is pending approval');
    }

    if (user.status === 'rejected') {
      throw new ForbiddenError('Your account registration was rejected');
    }

    if (user.status !== 'active') {
      throw new ForbiddenError('Your account is not active');
    }
  }

  /**
   * Validate admin can login (approved status only)
   */
  private validateAdminStatus(admin: Admin): void {
    if (admin.status === 'rejected') {
      throw new ForbiddenError('Your admin access has been rejected');
    }

    if (admin.status === 'pending') {
      throw new ForbiddenError('Your admin account is pending approval');
    }

    if (admin.status !== 'approved') {
      throw new ForbiddenError('Your admin account is not approved');
    }
  }

  /**
   * Refresh JWT token (validates existing token and issues new one)
   */
  async refreshToken(userId: string, isAdmin: boolean = false): Promise<AuthResponseDTO> {
    if (isAdmin) {
      const adminUser = await this.adminRepository.findById(userId);
      if (!adminUser) {
        throw new NotFoundError('Admin not found');
      }

      this.validateAdminStatus(adminUser);

      const payload: JwtPayload = {
        userId: adminUser.id,
        phone: adminUser.email,
        role: 'admin',
        tier: 'admin',
        status: adminUser.status
      };

      const token = generateToken(payload);

      return new AuthResponseDTO({
        token,
        admin: adminUser.toPublic(),
        expiresInDays: parseInt(process.env.JWT_EXPIRY_DAYS || '7')
      });
    } else {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      this.validateUserStatus(user);

      const payload: JwtPayload = {
        userId: user.id,
        phone: user.phone,
        role: user.role,
        tier: user.tier,
        status: user.status
      };

      const token = generateToken(payload);

      return new AuthResponseDTO({
        token,
        user: user.toPublic(),
        expiresInDays: parseInt(process.env.JWT_EXPIRY_DAYS || '7')
      });
    }
  }
}
