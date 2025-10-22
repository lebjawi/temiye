/**
 * Tier Repository
 */

import { Firestore } from '@google-cloud/firestore';
import { BaseRepository, BaseEntity } from './base.repository';
import { Tier } from '../types';
import { Collections } from '../config/database';

export type TierEntity = Tier & BaseEntity;

export class TierRepository extends BaseRepository<TierEntity> {
  constructor(db: Firestore) {
    super(db, Collections.TIERS);
  }

  async findActiveTiers(): Promise<TierEntity[]> {
    return this.findMany([['isActive', '==', true]], { orderBy: 'displayOrder' });
  }
}
