/**
 * Event Repository
 *
 * Data access layer for event sourcing
 * Records all significant system events for audit trail
 */

import { Firestore } from '@google-cloud/firestore';
import { BaseRepository, BaseEntity } from './base.repository';
import { CommunityEvent } from '../types';
import { Collections } from '../config/database';

export type EventEntity = CommunityEvent & BaseEntity;

export class EventRepository extends BaseRepository<EventEntity> {
  private sequenceCounter = 0;

  constructor(db: Firestore) {
    super(db, Collections.COMMUNITY_EVENTS);
  }

  async findByAggregate(aggregateId: string, limit: number = 100): Promise<EventEntity[]> {
    return this.findMany(
      [['aggregateId', '==', aggregateId]],
      { limit, orderBy: 'sequenceNumber' }
    );
  }

  async findByEventType(eventType: string, limit: number = 100): Promise<EventEntity[]> {
    return this.findMany([['eventType', '==', eventType]], { limit, orderBy: 'occurredAt', orderDirection: 'desc' });
  }

  getNextSequenceNumber(): number {
    return ++this.sequenceCounter;
  }
}
