/**
 * Role Repository
 */

import { Firestore } from '@google-cloud/firestore';
import { BaseRepository, BaseEntity } from './base.repository';
import { Role } from '../types';
import { Collections } from '../config/database';

export type RoleEntity = Role & BaseEntity;

export class RoleRepository extends BaseRepository<RoleEntity> {
  constructor(db: Firestore) {
    super(db, Collections.ROLES);
  }

  async findActiveRoles(): Promise<RoleEntity[]> {
    return this.findMany([['isActive', '==', true]], { orderBy: 'priority' });
  }
}
