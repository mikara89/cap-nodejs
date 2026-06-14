import { Injectable, Logger, Optional } from '@nestjs/common';
import { EntityManager, FilterQuery, MikroORM } from '@mikro-orm/core';
import { IReceivedStorage, CapReceivedEvent } from '@mikara89/cap-nest';
import { CapReceivedEntity } from '../entities/cap-received.entity';

/**
 * MikroORM implementation of IReceivedStorage.
 * Persists inbox events and manages retry scheduling.
 */
@Injectable()
export class MikroReceivedStorage implements IReceivedStorage {
  private readonly logger = new Logger(MikroReceivedStorage.name);
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
      // Prefer MikroORM instance schema generator when available
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

      this.logger.log(
        'Init requested but no schema generator available; skipping',
      );
    } catch (err) {
      this.logger.warn(
        'initialize() failed for MikroReceivedStorage',
        err as Error,
      );
    }
  }

  async saveReceived(event: CapReceivedEvent<unknown>): Promise<string> {
    const entity = this.em.create(CapReceivedEntity, {
      id: event.id,
      topic: event.topic,
      group: event.group,
      payload: event.payload,
      headers: event.headers,
      processed: event.processed || false,
      retryCount: event.retryCount || 0,
      nextRetry: event.nextRetry ?? undefined,
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

    return entities.map(mapReceivedEntity);
  }

  async findReceivedById(
    id: string,
  ): Promise<CapReceivedEvent<unknown> | undefined> {
    const entity = await this.em.findOne(CapReceivedEntity, { id });
    return entity ? mapReceivedEntity(entity) : undefined;
  }

  async listReceived(opts: {
    limit?: number;
    offset?: number;
    topic?: string;
    due?: boolean;
  }): Promise<{ items: CapReceivedEvent<unknown>[]; total: number }> {
    const where: FilterQuery<CapReceivedEntity> = {};

    if (opts.topic) {
      where.topic = opts.topic;
    }

    if (opts.due) {
      where.processed = false;
      where.nextRetry = { $lte: new Date() };
    }

    const [entities, total] = await this.em.findAndCount(
      CapReceivedEntity,
      where,
      {
        limit: opts.limit,
        offset: opts.offset,
        orderBy: { createdAt: 'DESC' },
      },
    );

    return { items: entities.map(mapReceivedEntity), total };
  }
}

function mapReceivedEntity(
  entity: CapReceivedEntity,
): CapReceivedEvent<unknown> {
  return {
    id: entity.id,
    topic: entity.topic,
    occurredAt: entity.createdAt.toISOString(),
    group: entity.group,
    payload: entity.payload,
    headers: entity.headers,
    processed: entity.processed,
    retryCount: entity.retryCount,
    nextRetry: entity.nextRetry ?? null,
  };
}
