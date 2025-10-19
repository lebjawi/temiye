import { Role } from '../entities/Role';
import { RoleRepository } from '../repositories/role.repository';
import { CreateRoleDTO } from '../dtos/CreateRoleDTO';
import { UpdateRoleDTO } from '../dtos/UpdateRoleDTO';
import { ConflictError } from '../../../shared/errors/ConflictError';
import { NotFoundError } from '../../../shared/errors/NotFoundError';
import { ValidationError } from '../../../shared/errors/ValidationError';

/**
 * RoleService - Business logic for Role domain
 *
 * Responsibility: Orchestrate repository calls, implement business rules
 */
export class RoleService {
  constructor(private roleRepository: RoleRepository) {}

  /**
   * Create new role
   */
  async createRole(data: any): Promise<Role> {
    // Validate DTO
    const dto = new CreateRoleDTO(data);
    dto.validate();

    // Check if ID already exists
    const existingById = await this.roleRepository.findById(dto.id);
    if (existingById) {
      throw new ConflictError(`Role with ID '${dto.id}' already exists`);
    }

    // Check if name already exists
    const existingByName = await this.roleRepository.findByName(dto.name);
    if (existingByName) {
      throw new ConflictError(`Role with name '${dto.name}' already exists`);
    }

    // Create entity and validate
    const role = Role.create({
      id: dto.id,
      ...dto.toEntity()
    });

    // Save to Firestore
    return this.roleRepository.create(role.toFirestore(), dto.id);
  }

  /**
   * Get role by ID
   */
  async getRoleById(id: string): Promise<Role> {
    const role = await this.roleRepository.findById(id);

    if (!role) {
      throw new NotFoundError(`Role with ID '${id}' not found`);
    }

    return role;
  }

  /**
   * Get all roles (ordered by hierarchy)
   */
  async getAllRoles(): Promise<Role[]> {
    return this.roleRepository.findAll();
  }

  /**
   * Update role
   */
  async updateRole(id: string, data: any): Promise<Role> {
    // Check if role exists
    const existing = await this.roleRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Role with ID '${id}' not found`);
    }

    // Validate DTO
    const dto = new UpdateRoleDTO(data);
    dto.validate();

    // If name is being changed, check uniqueness
    if (dto.name && dto.name !== existing.name) {
      const existingByName = await this.roleRepository.findByName(dto.name);
      if (existingByName && existingByName.id !== id) {
        throw new ConflictError(`Role with name '${dto.name}' already exists`);
      }
    }

    // Merge updates with existing role and validate
    const merged = new Role({
      ...existing,
      ...dto.toEntity()
    });
    merged.validate();

    // Update in Firestore
    return this.roleRepository.update(id, dto.toEntity());
  }

  /**
   * Delete role (with protection)
   */
  async deleteRole(id: string): Promise<void> {
    // Check if role exists
    const role = await this.roleRepository.findById(id);
    if (!role) {
      throw new NotFoundError(`Role with ID '${id}' not found`);
    }

    // Check if role is predefined (optional protection)
    if (role.isPredefined()) {
      throw new ValidationError('Cannot delete predefined roles (member, board, admin, superadmin)');
    }

    // Check if any users are assigned this role
    const userCount = await this.roleRepository.countUsersWithRole(id);
    if (userCount > 0) {
      throw new ConflictError(
        `Cannot delete role '${id}'. ${userCount} user(s) are assigned to this role.`
      );
    }

    // Safe to delete
    await this.roleRepository.delete(id);
  }

  /**
   * Get roles by level
   */
  async getRolesByLevel(level: number): Promise<Role[]> {
    if (level < 1 || level > 5) {
      throw new ValidationError('Level must be between 1 and 5');
    }

    return this.roleRepository.findByLevel(level);
  }

  /**
   * Check if role has specific permission
   */
  async hasPermission(roleId: string, permission: string): Promise<boolean> {
    const role = await this.getRoleById(roleId);
    return role.hasPermission(permission);
  }

  /**
   * Check if role exists (validation helper)
   */
  async roleExists(roleId: string): Promise<boolean> {
    const role = await this.roleRepository.findById(roleId);
    return role !== null;
  }

  /**
   * Compare role hierarchy
   */
  async isRoleHigherThan(roleAId: string, roleBId: string): Promise<boolean> {
    const [roleA, roleB] = await Promise.all([
      this.getRoleById(roleAId),
      this.getRoleById(roleBId)
    ]);

    return roleA.isHigherThan(roleB);
  }
}
