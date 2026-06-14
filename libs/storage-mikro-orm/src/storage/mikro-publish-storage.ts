import { Injectable, Logger, Optional } from '@nestjs/common';
import { EntityManager, FilterQuery, MikroORM } from '@mikro-orm/core';
import { IPublishStorage, CapPublishEvent } from '@mikara89/cap-nest';
import { CapPublishEntity } from '../entities/cap-publish.entity';

/**
 * MikroORM implementation of IPublishStorage.
 * Persists outbox events to a relational database.
 */
@Injectable()
export class MikroPublishStorage implements IPublishStorage {
  private readonly logger = new Logger(MikroPublishStorage.name);
  constructor(
    private readonly em: EntityManager,
    @Optional() private readonly orm?: MikroORM,
  ) {}

  async initialize?(options?: {
    autoInit?: boolean;
    createSchema?: boolean;
  }): Promise<void> {
    if (!(options && (options.autoInit || options.createSchema)))
      return Promise.resolve();

    try {
      // Best-effort: prefer MikroORM instance's schema generator if available
      if (this.orm) {
        const schemaGen = (
          this.orm as unknown as {
            getSchemaGenerator?: () => { createSchema?: () => Promise<void> };
          }
        ).getSchemaGenerator?.();
        if (schemaGen?.createSchema) {
          this.logger.log(
            'Creating DB schema via MikroORM schema generator (orm)',
          );
          await schemaGen.createSchema();
          return;
        }
      }

      // Fallback: try to find a schema generator on the EntityManager
      const emWithSchema = this.em as unknown as {
        getSchemaGenerator?: () => { createSchema?: () => Promise<void> };
      };
      const getSchemaGenerator = emWithSchema.getSchemaGenerator;
      if (typeof getSchemaGenerator === 'function') {
        const schemaGen = getSchemaGenerator.call(this.em) as
          | { createSchema?: () => Promise<void> }
          | undefined;
        if (schemaGen?.createSchema) {
          this.logger.log(
            'Creating DB schema via MikroORM schema generator (em)',
          );
          await schemaGen.createSchema();
          return;
        }
      }

      // Fallback: nothing actionable to do here — migrations are recommended
      // for production schema management.
      this.logger.log(
        'Init requested but no schema generator available; skipping',
      );
    } catch (err) {
      this.logger.warn(
        'initialize() failed for MikroPublishStorage',
        err as Error,
      );
    }
  }

  async savePublish(event: CapPublishEvent<unknown>): Promise<string> {
    const entity = this.em.create(CapPublishEntity, {
      id: event.id,
      topic: event.topic,
      payload: event.payload,
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

    return entities.map(mapPublishEntity);
  }

  async findPublishById(
    id: string,
  ): Promise<CapPublishEvent<unknown> | undefined> {
    const entity = await this.em.findOne(CapPublishEntity, { id });
    return entity ? mapPublishEntity(entity) : undefined;
  }

  async listPublish(opts: {
    limit?: number;
    offset?: number;
    topic?: string;
    onlyUnpublished?: boolean;
  }): Promise<{ items: CapPublishEvent<unknown>[]; total: number }> {
    const where: FilterQuery<CapPublishEntity> = {};

    if (opts.topic) {
      where.topic = opts.topic;
    }

    if (opts.onlyUnpublished) {
      where.$or = [
        { status: null },
        { status: 'failed', retryCount: { $lt: 3 } },
      ];
    }

    const [entities, total] = await this.em.findAndCount(
      CapPublishEntity,
      where,
      {
        limit: opts.limit,
        offset: opts.offset,
        orderBy: { createdAt: 'DESC' },
      },
    );

    return { items: entities.map(mapPublishEntity), total };
  }

  async savePublishWithTx(
    event: CapPublishEvent<unknown>,
    tx: unknown,
  ): Promise<string> {
    const em = (tx as EntityManager) ?? this.em;

    const entity = em.create(CapPublishEntity, {
      id: event.id,
      topic: event.topic,
      payload: event.payload,
      headers: event.headers,
      retryCount: event.retryCount || 0,
      status: event.status,
      createdAt: new Date(event.occurredAt),
      updatedAt: new Date(),
    });

    await em.persistAndFlush(entity);
    return entity.id;
  }
}

function mapPublishEntity(entity: CapPublishEntity): CapPublishEvent<unknown> {
  return {
    id: entity.id,
    topic: entity.topic,
    occurredAt: entity.createdAt.toISOString(),
    payload: entity.payload,
    headers: entity.headers,
    status: entity.status,
    retryCount: entity.retryCount,
  };
}
