import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { IPublishStorage, CapPublishEvent } from '@cap/cap-nest';
import { CapPublishEntity } from '../entities/cap-publish.entity';

/**
 * MikroORM implementation of IPublishStorage.
 * Persists outbox events to a relational database.
 */
@Injectable()
export class MikroPublishStorage implements IPublishStorage {
  constructor(private readonly em: EntityManager) {}

  async savePublish(event: CapPublishEvent<unknown>): Promise<string> {
    const entity = this.em.create(CapPublishEntity, {
      id: event.id,
      topic: event.topic,
      payload: event.payload as Record<string, unknown>,
      headers: event.headers,
      retryCount: event.retryCount || 0,
      status: event.status,
      createdAt: new Date(event.occurredAt),
      updatedAt: new Date(),
    });

    await this.em.persistAndFlush(entity);
    return entity.id;
  }

  async markPublished(id: string): Promise<void> {
    const entity = await this.em.findOne(CapPublishEntity, { id });
    if (entity) {
      entity.status = 'published';
      await this.em.flush();
    }
  }

  async getUnpublished(limit: number): Promise<CapPublishEvent<unknown>[]> {
    const entities = await this.em.find(
      CapPublishEntity,
      {
        $or: [{ status: null }, { status: 'failed', retryCount: { $lt: 3 } }],
      },
      {
        limit,
        orderBy: { createdAt: 'ASC' },
      },
    );

    return entities.map((e) => ({
      id: e.id,
      topic: e.topic,
      occurredAt: e.createdAt.toISOString(),
      payload: e.payload,
      headers: e.headers,
      status: e.status,
      retryCount: e.retryCount,
    }));
  }
}
