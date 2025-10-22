/**
 * Board Repository
 *
 * Data access layer for community boards
 */

import { Firestore } from '@google-cloud/firestore';
import { BaseRepository, BaseEntity } from './base.repository';
import { Board } from '../types';
import { Collections } from '../config/database';

export type BoardEntity = Board & BaseEntity;

export class BoardRepository extends BaseRepository<BoardEntity> {
  constructor(db: Firestore) {
    super(db, Collections.BOARDS);
  }

  async findByStatus(
    status: 'active' | 'inactive' | 'archived',
    limit: number = 50
  ): Promise<BoardEntity[]> {
    return this.findMany([['status', '==', status]], { limit });
  }

  async findActiveBoards(): Promise<BoardEntity[]> {
    return this.findByStatus('active', 100);
  }
}
