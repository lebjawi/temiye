import { Admin } from '../entities/Admin';
import { AdminRepository } from '../repositories/admin.repository';
import { CreateAdminDTO } from '../dtos/CreateAdminDTO';
import { ConflictError } from '../../../shared/errors/ConflictError';
import { NotFoundError } from '../../../shared/errors/NotFoundError';
import { ForbiddenError } from '../../../shared/errors/ForbiddenError';

export class AdminService {
  constructor(private adminRepository: AdminRepository) {}

  async createAdmin(data: any): Promise<Admin> {
    const dto = new CreateAdminDTO(data);
    dto.validate();

    // Check if email already exists
    const existingByEmail = await this.adminRepository.findByEmail(dto.email);
    if (existingByEmail) {
      throw new ConflictError('Email already exists');
    }

    // Check if Firebase UID already exists
    const existingByUid = await this.adminRepository.findByFirebaseUid(dto.firebaseUid);
    if (existingByUid) {
      throw new ConflictError('Firebase UID already exists');
    }

    const adminData = dto.toEntity();
    const admin = Admin.create(adminData);
    return this.adminRepository.create(admin.toFirestore());
  }

  async getAdminById(id: string): Promise<Admin> {
    const admin = await this.adminRepository.findById(id);
    if (!admin) {
      throw new NotFoundError('Admin not found');
    }
    return admin;
  }

  async getAllAdmins(): Promise<Admin[]> {
    return this.adminRepository.findAll();
  }

  async getPendingApprovals(): Promise<Admin[]> {
    return this.adminRepository.findPendingApprovals();
  }

  async approveAdmin(adminId: string, approvedBy: string, reason?: string): Promise<Admin> {
    const admin = await this.getAdminById(adminId);

    if (!admin.isPending()) {
      throw new ConflictError('Admin is not pending approval');
    }

    admin.transitionTo('approved');
    admin.approvedBy = approvedBy;
    admin.approvedAt = new Date();

    return this.adminRepository.update(adminId, {
      status: 'approved',
      approvedBy,
      approvedAt: new Date()
    });
  }

  async rejectAdmin(adminId: string, reason: string): Promise<Admin> {
    const admin = await this.getAdminById(adminId);

    if (!admin.isPending()) {
      throw new ConflictError('Admin is not pending approval');
    }

    if (!reason || reason.length < 5) {
      throw new ConflictError('Rejection reason is required (min 5 characters)');
    }

    admin.transitionTo('rejected');
    admin.rejectionReason = reason;

    return this.adminRepository.update(adminId, {
      status: 'rejected',
      rejectionReason: reason
    });
  }

  async canAdminLogin(firebaseUid: string): Promise<{ canLogin: boolean; admin?: Admin; message?: string }> {
    const admin = await this.adminRepository.findByFirebaseUid(firebaseUid);

    if (!admin) {
      return { canLogin: false, message: 'Admin not found' };
    }

    if (admin.isRejected()) {
      return { canLogin: false, admin, message: 'Admin access has been rejected' };
    }

    if (admin.isPending()) {
      return { canLogin: false, admin, message: 'Admin approval is pending' };
    }

    if (admin.isApproved()) {
      await this.adminRepository.updateLastLogin(admin.id);
      return { canLogin: true, admin };
    }

    return { canLogin: false, message: 'Invalid admin status' };
  }

  async findAdminByFirebaseUid(uid: string): Promise<Admin | null> {
    return this.adminRepository.findByFirebaseUid(uid);
  }

  async deleteAdmin(id: string): Promise<void> {
    const admin = await this.getAdminById(id);
    await this.adminRepository.delete(id);
  }
}
