import { Injectable, Logger, Optional } from '@nestjs/common';
import { EntityManager, FilterQuery, MikroORM } from '@mikro-orm/core';
import {
  CapReceivedEvent,
  IReceivedStorage,
  JsonValue,
  TrySaveReceivedResult,
} from '@mikara89/cap-nest';
import { CapReceivedEntity } from '../entities/cap-received.entity';

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
    if (!(options && (options.autoInit || options.createSchema))) return;

    try {
      const schemaGen =
        this.orm?.getSchemaGenerator?.() ??
        (
          this.em as unknown as {
            getSchemaGenerator?: () => { createSchema?: () => Promise<void> };
          }
        ).getSchemaGenerator?.();

      if (schemaGen?.createSchema) {
        await schemaGen.createSchema();
      }
    } catch (err) {
      this.logger.warn(
        'initialize() failed for MikroReceivedStorage',
        err as Error,
      );
    }
  }

  async trySaveReceived<T extends JsonValue = JsonValue>(
    event: CapReceivedEvent<T>,
  ): Promise<TrySaveReceivedResult<T>> {
    const existing = await this.em.findOne(CapReceivedEntity, {
      topic: event.topic,
      group: event.group,
      messageId: event.messageId,
    });

    if (existing) {
      return {
        inserted: false,
        id: existing.id,
        event: mapReceivedEntity(existing) as CapReceivedEvent<T>,
      };
    }

    const entity = this.em.create(CapReceivedEntity, {
      id: event.id,
      topic: event.topic,
      group: event.group,
      messageId: event.messageId,
      dedupeKey: event.dedupeKey,
      payload: event.payload,
      headers: event.headers,
      processed: event.processed || false,
      retryCount: event.retryCount || 0,
      nextRetry: event.nextRetry ?? undefined,
      createdAt: new Date(event.occurredAt),
      updatedAt: new Date(),
    });

    try {
      await this.em.persistAndFlush(entity);
      return { inserted: true, id: entity.id, event };
    } catch (err) {
      const duplicate = await this.em.findOne(CapReceivedEntity, {
        topic: event.topic,
        group: event.group,
        messageId: event.messageId,
      });
      if (duplicate) {
        return {
          inserted: false,
          id: duplicate.id,
          event: mapReceivedEntity(duplicate) as CapReceivedEvent<T>,
        };
      }
      throw err;
    }
  }

  async markProcessed(id: string): Promise<void> {
    const entity = await this.em.findOne(CapReceivedEntity, { id });
    if (!entity) return;
    entity.processed = true;
    await this.em.flush();
  }

  async scheduleRetry(
    id: string,
    retryCount: number,
    nextRetry: Date,
  ): Promise<void> {
    const entity = await this.em.findOne(CapReceivedEntity, { id });
    if (!entity) return;
    entity.retryCount = retryCount;
    entity.nextRetry = nextRetry;
    await this.em.flush();
  }

  async getRetryDue(limit: number): Promise<CapReceivedEvent<JsonValue>[]> {
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
  ): Promise<CapReceivedEvent<JsonValue> | undefined> {
    const entity = await this.em.findOne(CapReceivedEntity, { id });
    return entity ? mapReceivedEntity(entity) : undefined;
  }

  async listReceived(opts: {
    limit?: number;
    offset?: number;
    topic?: string;
    due?: boolean;
  }): Promise<{ items: CapReceivedEvent<JsonValue>[]; total: number }> {
    const where: FilterQuery<CapReceivedEntity> = {};

    if (opts.topic) where.topic = opts.topic;
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
): CapReceivedEvent<JsonValue> {
  return {
    id: entity.id,
    topic: entity.topic,
    occurredAt: entity.createdAt.toISOString(),
    group: entity.group,
    messageId: entity.messageId,
    dedupeKey: entity.dedupeKey,
    payload: entity.payload,
    headers: entity.headers,
    processed: entity.processed,
    retryCount: entity.retryCount,
    nextRetry: entity.nextRetry ?? null,
  };
}
