import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { IReceivedStorage, CapReceivedEvent } from '@cap/cap-nest';
import { CapReceivedEntity } from '../entities/cap-received.entity';

/**
 * MikroORM implementation of IReceivedStorage.
 * Persists inbox events and manages retry scheduling.
 */
@Injectable()
export class MikroReceivedStorage implements IReceivedStorage {
  constructor(private readonly em: EntityManager) {}

  async saveReceived(event: CapReceivedEvent<unknown>): Promise<string> {
    const entity = this.em.create(CapReceivedEntity, {
      id: event.id,
      topic: event.topic,
      group: event.group,
      payload: event.payload as Record<string, unknown>,
      headers: event.headers,
      processed: event.processed || false,
      retryCount: event.retryCount || 0,
      nextRetry: event.nextRetry || undefined,
      createdAt: new Date(event.occurredAt),
      updatedAt: new Date(),
    });

    await this.em.persistAndFlush(entity);
    return entity.id;
  }

  async markProcessed(id: string): Promise<void> {
    const entity = await this.em.findOne(CapReceivedEntity, { id });
    if (entity) {
      entity.processed = true;
      await this.em.flush();
    }
  }

  async scheduleRetry(
    id: string,
    retryCount: number,
    nextRetry: Date,
  ): Promise<void> {
    const entity = await this.em.findOne(CapReceivedEntity, { id });
    if (entity) {
      entity.retryCount = retryCount;
      entity.nextRetry = nextRetry;
      await this.em.flush();
    }
  }

  async getRetryDue(limit: number): Promise<CapReceivedEvent[]> {
    const now = new Date();
    const entities = await this.em.find(
      CapReceivedEntity,
      {
        processed: false,
        nextRetry: { $lte: now },
      },
      {
        limit,
        orderBy: { nextRetry: 'ASC' },
      },
    );

    return entities.map((e) => ({
      id: e.id,
      topic: e.topic,
      occurredAt: e.createdAt.toISOString(),
      group: e.group,
      payload: e.payload,
      headers: e.headers,
      processed: e.processed,
      retryCount: e.retryCount,
      nextRetry: e.nextRetry || null,
    }));
  }
}
