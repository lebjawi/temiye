/**
 * Event Service
 *
 * Business logic for event sourcing
 * Records system events for audit trail
 */

import { Timestamp, DocumentReference } from '@google-cloud/firestore';
import { EventRepository, EventEntity } from '../repositories/event.repository';
import { createLogger } from '../utils/logger.utils';

const log = createLogger(__filename);

export interface RecordEventInput {
  eventType: string;
  aggregateId: string;
  aggregateType: 'user' | 'board' | 'transaction' | 'announcement' | 'election' | 'admin' | 'system';
  payload: Record<string, unknown>;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  actorId: string;
  actorNameAr?: string;
  actorType: 'user' | 'admin' | 'system';
  actorRef: DocumentReference;
}

export class EventService {
  constructor(private eventRepo: EventRepository) {}

  async recordEvent(input: RecordEventInput): Promise<EventEntity> {
    log.info('Recording event', {
      eventType: input.eventType,
      aggregateId: input.aggregateId,
    });

    const eventId = `event_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const event = await this.eventRepo.create(eventId, {
      eventType: input.eventType,
      aggregateId: input.aggregateId,
      aggregateType: input.aggregateType,
      payload: input.payload,
      beforeState: input.beforeState,
      afterState: input.afterState,
      actorRef: input.actorRef,
      actorId: input.actorId,
      actorNameAr: input.actorNameAr,
      actorType: input.actorType,
      occurredAt: Timestamp.now(),
      sequenceNumber: this.eventRepo.getNextSequenceNumber(),
    } as Omit<EventEntity, 'id' | 'version' | 'createdAt' | 'updatedAt'>);

    return event;
  }

  async getEventsByAggregate(aggregateId: string): Promise<EventEntity[]> {
    return this.eventRepo.findByAggregate(aggregateId);
  }
}
