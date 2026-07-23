import type { EntityManager, FilterQuery, MikroORM } from '@mikro-orm/core';
import type {
  CapabilityAwareStoragePort,
  CapLogger,
  CapReceivedEvent,
  CapStorageCapabilities,
  JsonValue,
  MarkReceivedFailedOptions,
  ReceivedStoragePort,
  TrySaveReceivedResult,
} from '@mikara89/cap-core';
import { CapReceivedEntity } from '../entities/cap-received.entity';
import { getMikroStorageCapabilities } from './mikro-storage-capabilities';

export class MikroReceivedStorage
  implements ReceivedStoragePort, CapabilityAwareStoragePort
{
  constructor(
    private readonly em: EntityManager,
    private readonly orm?: MikroORM,
    private readonly logger?: CapLogger,
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
      this.logger?.warn?.(
        'initialize() failed for MikroReceivedStorage',
        err as Error,
      );
    }
  }

  async trySaveReceived<T extends JsonValue = JsonValue>(
    event: CapReceivedEvent<T>,
  ): Promise<TrySaveReceivedResult<T>> {
    const existing = await this.em.findOne(CapReceivedEntity, {
      group: event.group,
      dedupeKey: event.dedupeKey,
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
      status: event.status ?? (event.processed ? 'processed' : 'pending'),
      lastError: event.lastError ?? null,
      nextRetry: event.nextRetry ?? undefined,
      processedAt: event.processedAt ?? null,
      createdAt: new Date(event.occurredAt),
      updatedAt: new Date(),
    });

    try {
      await this.em.persistAndFlush(entity);
      return { inserted: true, id: entity.id, event };
    } catch (err) {
      const duplicate = await this.em.findOne(CapReceivedEntity, {
        group: event.group,
        dedupeKey: event.dedupeKey,
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

  getCapabilities(): CapStorageCapabilities {
    return getMikroStorageCapabilities(this.em);
  }

  async markProcessed(id: string, processedAt = new Date()): Promise<void> {
    const entity = await this.em.findOne(CapReceivedEntity, { id });
    if (!entity) return;
    entity.status = 'processed';
    entity.processed = true;
    entity.processedAt = processedAt;
    entity.nextRetry = undefined;
    await this.em.flush();
  }

  async markReceivedFailed(
    id: string,
    error: unknown,
    options: MarkReceivedFailedOptions,
  ): Promise<void> {
    const entity = await this.em.findOne(CapReceivedEntity, { id });
    if (!entity) return;
    const retryCount = entity.retryCount + 1;
    entity.retryCount = retryCount;
    entity.status = retryCount >= options.maxRetries ? 'dead_letter' : 'failed';
    entity.nextRetry =
      entity.status === 'dead_letter' ? undefined : options.nextRetryAt;
    entity.lastError = error instanceof Error ? error.message : String(error);
    entity.updatedAt = options.now;
    await this.em.flush();
  }

  async getRetryDue(
    limit: number,
    now = new Date(),
    pendingBefore?: Date,
  ): Promise<CapReceivedEvent<JsonValue>[]> {
    const where: FilterQuery<CapReceivedEntity> = pendingBefore
      ? {
          $or: [
            { status: 'failed', nextRetry: { $lte: now } },
            { status: 'pending', createdAt: { $lte: pendingBefore } },
          ],
        }
      : { status: 'failed', nextRetry: { $lte: now } };
    const entities = await this.em.find(CapReceivedEntity, where, {
      limit,
      orderBy: { nextRetry: 'ASC', createdAt: 'ASC', id: 'ASC' },
    });

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
      where.status = 'failed';
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
    status: entity.status,
    lastError: entity.lastError ?? null,
    processed: entity.processed,
    processedAt: entity.processedAt ?? null,
    retryCount: entity.retryCount,
    nextRetry: entity.nextRetry ?? null,
  };
}
