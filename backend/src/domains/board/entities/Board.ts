import { ValidationError } from '../../../shared/errors/ValidationError';

/**
 * Board Entity - Organizational units with hierarchical structure
 *
 * Status: active | archived
 * Members have roles: chair | treasurer | secretary | member
 * Boards can have parent/child relationships
 */

export type BoardStatus = 'active' | 'archived';
export type BoardMemberRole = 'chair' | 'treasurer' | 'secretary' | 'member';

export interface BoardMember {
  userId: string;
  role: BoardMemberRole;
  joinedAt: Date;
}

export class Board {
  id!: string;
  name!: string;
  description!: string;
  parentBoardId?: string;
  logoRef?: string; // Reference to file in Storage domain
  status!: BoardStatus;
  members!: BoardMember[];
  createdAt!: Date;
  updatedAt!: Date;
  archivedAt?: Date;

  constructor(data: Partial<Board>) {
    Object.assign(this, data);
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.members = data.members || [];
    this.status = data.status || 'active';
  }

  validate(): void {
    if (!this.name || this.name.length < 2 || this.name.length > 100) {
      throw new ValidationError('Board name must be 2-100 characters');
    }

    if (this.description && this.description.length > 500) {
      throw new ValidationError('Description must be max 500 characters');
    }

    if (!this.status || !['active', 'archived'].includes(this.status)) {
      throw new ValidationError('Invalid status');
    }

    // Validate members
    this.members.forEach(member => {
      if (!['chair', 'treasurer', 'secretary', 'member'].includes(member.role)) {
        throw new ValidationError(`Invalid role: ${member.role}`);
      }
    });

    // Only one chair allowed
    const chairs = this.members.filter(m => m.role === 'chair');
    if (chairs.length > 1) {
      throw new ValidationError('Board can only have one chair');
    }
  }

  isActive(): boolean {
    return this.status === 'active';
  }

  isArchived(): boolean {
    return this.status === 'archived';
  }

  hasMember(userId: string): boolean {
    return this.members.some(m => m.userId === userId);
  }

  getMemberRole(userId: string): BoardMemberRole | null {
    const member = this.members.find(m => m.userId === userId);
    return member ? member.role : null;
  }

  addMember(userId: string, role: BoardMemberRole): void {
    if (this.hasMember(userId)) {
      throw new ValidationError('User is already a member of this board');
    }

    if (role === 'chair') {
      const hasChair = this.members.some(m => m.role === 'chair');
      if (hasChair) {
        throw new ValidationError('Board already has a chair');
      }
    }

    this.members.push({
      userId,
      role,
      joinedAt: new Date()
    });
    this.updatedAt = new Date();
  }

  removeMember(userId: string): void {
    const index = this.members.findIndex(m => m.userId === userId);
    if (index === -1) {
      throw new ValidationError('User is not a member of this board');
    }

    this.members.splice(index, 1);
    this.updatedAt = new Date();
  }

  changeMemberRole(userId: string, newRole: BoardMemberRole): void {
    const member = this.members.find(m => m.userId === userId);
    if (!member) {
      throw new ValidationError('User is not a member of this board');
    }

    if (newRole === 'chair') {
      const hasChair = this.members.some(m => m.role === 'chair' && m.userId !== userId);
      if (hasChair) {
        throw new ValidationError('Board already has a chair');
      }
    }

    member.role = newRole;
    this.updatedAt = new Date();
  }

  archive(_reason?: string): void {
    this.status = 'archived';
    this.archivedAt = new Date();
    this.updatedAt = new Date();
  }

  static create(data: Partial<Board>): Board {
    const board = new Board(data);
    board.validate();
    return board;
  }

  toFirestore(): Record<string, any> {
    return {
      name: this.name,
      description: this.description || '',
      parentBoardId: this.parentBoardId || null,
      logoRef: this.logoRef || null,
      status: this.status,
      members: this.members.map(m => ({
        userId: m.userId,
        role: m.role,
        joinedAt: m.joinedAt
      })),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      archivedAt: this.archivedAt || null
    };
  }
}
