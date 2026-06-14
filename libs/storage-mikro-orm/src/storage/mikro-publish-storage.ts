import { Injectable, Logger, Optional } from '@nestjs/common';
import { EntityManager, FilterQuery, MikroORM } from '@mikro-orm/core';
import {
  CapPublishEvent,
  ClaimUnpublishedOptions,
  IPublishStorage,
  JsonValue,
  MarkPublishFailedOptions,
} from '@mikara89/cap-nest';
import { CapPublishEntity } from '../entities/cap-publish.entity';

type PublishEntityData = {
  id: string;
  topic: string;
  payload: JsonValue;
  headers: CapPublishEvent<JsonValue>['headers'];
  retryCount: number;
  status: CapPublishEvent<JsonValue>['status'];
  nextRetryAt: Date | null;
  lastError: string | null;
  lockedBy: string | null;
  lockedUntil: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

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
        'initialize() failed for MikroPublishStorage',
        err as Error,
      );
    }
  }

  async savePublish(event: CapPublishEvent<JsonValue>): Promise<string> {
    const entity = this.em.create(CapPublishEntity, mapPublishToEntity(event));
    await this.em.persistAndFlush(entity);
    return entity.id;
  }

  async savePublishWithTx(
    event: CapPublishEvent<JsonValue>,
    tx: unknown,
  ): Promise<string> {
    const em = (tx as EntityManager) ?? this.em;
    const entity = em.create(CapPublishEntity, mapPublishToEntity(event));
    await em.persistAndFlush(entity);
    return entity.id;
  }

  async claimUnpublished(
    options: ClaimUnpublishedOptions,
  ): Promise<CapPublishEvent<JsonValue>[]> {
    return this.em.transactional(async (em) => {
      const entities = await em.find(
        CapPublishEntity,
        claimableWhere(options.now),
        {
          limit: options.limit,
          orderBy: { createdAt: 'ASC' },
        },
      );

      for (const entity of entities) {
        entity.status = 'processing';
        entity.lockedBy = options.lockedBy;
        entity.lockedUntil = options.lockUntil;
        entity.updatedAt = options.now;
      }

      await em.flush();
      return entities.map(mapPublishEntity);
    });
  }

  async markPublished(id: string, publishedAt = new Date()): Promise<void> {
    const entity = await this.em.findOne(CapPublishEntity, { id });
    if (!entity) return;
    entity.status = 'published';
    entity.publishedAt = publishedAt;
    entity.lockedBy = null;
    entity.lockedUntil = null;
    entity.nextRetryAt = null;
    await this.em.flush();
  }

  async markPublishFailed(
    id: string,
    error: unknown,
    options: MarkPublishFailedOptions,
  ): Promise<void> {
    const entity = await this.em.findOne(CapPublishEntity, { id });
    if (!entity) return;

    const retryCount = entity.retryCount + 1;
    entity.retryCount = retryCount;
    entity.status = retryCount >= options.maxRetries ? 'dead_letter' : 'failed';
    entity.nextRetryAt =
      entity.status === 'dead_letter' ? null : options.nextRetryAt;
    entity.lastError = error instanceof Error ? error.message : String(error);
    entity.lockedBy = null;
    entity.lockedUntil = null;
    entity.updatedAt = options.now;
    await this.em.flush();
  }

  async releaseExpiredClaims(now: Date): Promise<void> {
    const entities = await this.em.find(CapPublishEntity, {
      status: 'processing',
      lockedUntil: { $lte: now },
    });

    for (const entity of entities) {
      entity.status = 'failed';
      entity.lockedBy = null;
      entity.lockedUntil = null;
      entity.updatedAt = now;
    }

    if (entities.length) await this.em.flush();
  }

  async findPublishById(
    id: string,
  ): Promise<CapPublishEvent<JsonValue> | undefined> {
    const entity = await this.em.findOne(CapPublishEntity, { id });
    return entity ? mapPublishEntity(entity) : undefined;
  }

  async listPublish(opts: {
    limit?: number;
    offset?: number;
    topic?: string;
    onlyUnpublished?: boolean;
  }): Promise<{ items: CapPublishEvent<JsonValue>[]; total: number }> {
    const where: FilterQuery<CapPublishEntity> = {};

    if (opts.topic) where.topic = opts.topic;
    if (opts.onlyUnpublished) {
      Object.assign(where, claimableWhere(new Date()));
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
}

function claimableWhere(now: Date): FilterQuery<CapPublishEntity> {
  return {
    $or: [
      { status: 'pending' },
      {
        status: 'failed',
        $or: [{ nextRetryAt: null }, { nextRetryAt: { $lte: now } }],
      },
      { status: 'processing', lockedUntil: { $lte: now } },
    ],
  };
}

function mapPublishToEntity(
  event: CapPublishEvent<JsonValue>,
): PublishEntityData {
  return {
    id: event.id,
    topic: event.topic,
    payload: event.payload,
    headers: event.headers,
    retryCount: event.retryCount,
    status: event.status,
    nextRetryAt: event.nextRetryAt ?? null,
    lastError: event.lastError ?? null,
    lockedBy: event.lockedBy ?? null,
    lockedUntil: event.lockedUntil ?? null,
    publishedAt: event.publishedAt ?? null,
    createdAt: new Date(event.occurredAt),
    updatedAt: new Date(),
  };
}

function mapPublishEntity(
  entity: CapPublishEntity,
): CapPublishEvent<JsonValue> {
  return {
    id: entity.id,
    topic: entity.topic,
    occurredAt: entity.createdAt.toISOString(),
    payload: entity.payload,
    headers: entity.headers,
    status: entity.status,
    retryCount: entity.retryCount,
    nextRetryAt: entity.nextRetryAt ?? null,
    lastError: entity.lastError ?? null,
    lockedBy: entity.lockedBy ?? null,
    lockedUntil: entity.lockedUntil ?? null,
    publishedAt: entity.publishedAt ?? null,
  };
}
