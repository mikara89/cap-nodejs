import {
  IsolationLevel,
  LockMode,
  raw,
  type EntityManager,
  type FilterQuery,
  type MikroORM,
} from '@mikro-orm/core';
import type {
  CapOperationContext,
  CapabilityAwareStoragePort,
  CapLogger,
  CapOutboxSnapshot,
  CapPublishEvent,
  CapRequeueResult,
  CapStorageCapabilities,
  ClaimUnpublishedOptions,
  JsonValue,
  MarkPublishFailedOptions,
  PublishClaimOwnership,
  PublishStorageAdministrationPort,
  PublishStoragePort,
  RenewPublishClaimOptions,
} from '@mikara89/cap-core';
import { CapPublishEntity } from '../entities/cap-publish.entity';
import {
  getMikroPlatformName,
  getMikroStorageCapabilities,
  supportsSkipLockedClaiming,
} from './mikro-storage-capabilities';

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

export class MikroPublishStorage
  implements
    PublishStoragePort<EntityManager>,
    PublishStorageAdministrationPort<EntityManager>,
    CapabilityAwareStoragePort
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
        'initialize() failed for MikroPublishStorage',
        err as Error,
      );
    }
  }

  async savePublish(
    event: CapPublishEvent<JsonValue>,
    ctx?: CapOperationContext<EntityManager>,
  ): Promise<string> {
    const em = ctx?.tx ?? this.em;
    const entity = em.create(CapPublishEntity, mapPublishToEntity(event));
    await em.persistAndFlush(entity);
    return entity.id;
  }

  /**
   * @deprecated Use savePublish(event, { tx }) instead.
   */
  async savePublishWithTx(
    event: CapPublishEvent<JsonValue>,
    tx: EntityManager,
  ): Promise<string> {
    return this.savePublish(event, { tx });
  }

  getCapabilities(): CapStorageCapabilities {
    return getMikroStorageCapabilities(this.em);
  }

  async claimUnpublished(
    options: ClaimUnpublishedOptions,
  ): Promise<CapPublishEvent<JsonValue>[]> {
    return this.em.transactional(async (em) => {
      const entities = await em.find(
        CapPublishEntity,
        claimableWhere(options.now),
        claimFindOptions(em, options.limit),
      );

      for (const entity of entities) {
        entity.status = 'processing';
        entity.lockedBy = options.lockedBy;
        entity.lockedUntil = options.lockUntil;
        entity.updatedAt = options.now;
      }

      await em.flush();
      return entities.map(mapPublishEntity);
    }, claimTransactionOptions(this.em));
  }

  async markPublished(
    id: string,
    publishedAt = new Date(),
    ownership: PublishClaimOwnership = {},
  ): Promise<boolean> {
    const where = ownershipWhere(id, ownership.expectedLockedBy);
    const affected = await this.em.nativeUpdate(CapPublishEntity, where, {
      status: 'published',
      publishedAt,
      lockedBy: null,
      lockedUntil: null,
      nextRetryAt: null,
      updatedAt: new Date(),
    });
    return affected > 0;
  }

  async markPublishFailed(
    id: string,
    error: unknown,
    options: MarkPublishFailedOptions,
  ): Promise<boolean> {
    const where = ownershipWhere(id, options.expectedLockedBy);
    // In generated SET order, MySQL applies retry_count before later expressions.
    const thresholdRetryCount = usesMySqlAssignmentSemantics(this.em)
      ? 'retry_count'
      : 'retry_count + 1';
    const affected = await this.em.nativeUpdate(CapPublishEntity, where, {
      retryCount: raw('retry_count + 1'),
      status: raw(`case when ${thresholdRetryCount} >= ? then ? else ? end`, [
        options.maxRetries,
        'dead_letter',
        'failed',
      ]),
      nextRetryAt: raw(
        `case when ${thresholdRetryCount} >= ? then null else coalesce(?, next_retry_at) end`,
        [options.maxRetries, options.nextRetryAt],
      ),
      lastError: error instanceof Error ? error.message : String(error),
      lockedBy: null,
      lockedUntil: null,
      updatedAt: options.now,
    });
    return affected > 0;
  }

  async renewPublishClaim(options: RenewPublishClaimOptions): Promise<boolean> {
    const affected = await this.em.nativeUpdate(
      CapPublishEntity,
      {
        id: options.id,
        status: 'processing',
        lockedBy: options.expectedLockedBy,
        lockedUntil: { $gt: options.now },
      },
      { lockedUntil: options.lockUntil, updatedAt: options.now },
    );
    return affected > 0;
  }

  async releaseExpiredClaims(now: Date): Promise<void> {
    await this.em.nativeUpdate(
      CapPublishEntity,
      { status: 'processing', lockedUntil: { $lte: now } },
      { status: 'failed', lockedBy: null, lockedUntil: null, updatedAt: now },
    );
  }

  async findPublishById(
    id: string,
  ): Promise<CapPublishEvent<JsonValue> | undefined> {
    const entity = await this.em.findOne(
      CapPublishEntity,
      { id },
      { refresh: true },
    );
    return entity ? mapPublishEntity(entity) : undefined;
  }

  async requeuePublish(
    id: string,
    now = new Date(),
  ): Promise<CapRequeueResult<CapPublishEvent['status']>> {
    const affected = await this.em.nativeUpdate(
      CapPublishEntity,
      { id, status: { $in: ['failed', 'dead_letter'] } },
      {
        status: 'failed',
        retryCount: 0,
        lastError: null,
        nextRetryAt: now,
        lockedBy: null,
        lockedUntil: null,
        publishedAt: null,
        updatedAt: now,
      },
    );
    if (affected > 0) return { id, outcome: 'requeued' };

    const entity = await this.em.findOne(
      CapPublishEntity,
      { id },
      { refresh: true },
    );
    return entity
      ? { id, outcome: 'not_eligible', previousStatus: entity.status }
      : { id, outcome: 'not_found' };
  }

  async getPublishSnapshot(): Promise<CapOutboxSnapshot> {
    const rows = (await this.em
      .getConnection()
      .execute(
        'SELECT status, COUNT(*) AS count, MIN(created_at) AS oldest_at FROM cap_publish GROUP BY status',
        [],
        'all',
      )) as SnapshotRow<CapPublishEvent['status']>[];
    return mapOutboxSnapshot(rows);
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

interface SnapshotRow<TStatus extends string> {
  status: TStatus;
  count: number | string;
  oldest_at: Date | string | null;
}

function mapOutboxSnapshot(
  rows: SnapshotRow<CapPublishEvent['status']>[],
): CapOutboxSnapshot {
  const counts: CapOutboxSnapshot['counts'] = {
    pending: 0,
    processing: 0,
    published: 0,
    failed: 0,
    dead_letter: 0,
  };
  let oldestPendingAt: Date | null = null;
  let oldestFailedAt: Date | null = null;
  for (const row of rows) {
    counts[row.status] = Number(row.count);
    const oldest = row.oldest_at ? new Date(row.oldest_at) : null;
    if (row.status === 'pending') oldestPendingAt = oldest;
    if (row.status === 'failed') oldestFailedAt = oldest;
  }
  return { counts, oldestPendingAt, oldestFailedAt };
}

function usesMySqlAssignmentSemantics(em: EntityManager): boolean {
  const platformName = getMikroPlatformName(em);
  return Boolean(
    platformName &&
    (platformName.includes('mysql') || platformName.includes('maria')),
  );
}

function ownershipWhere(
  id: string,
  expectedLockedBy: string | undefined,
): FilterQuery<CapPublishEntity> {
  if (expectedLockedBy === undefined) return { id };
  return { id, status: 'processing', lockedBy: expectedLockedBy };
}

function claimFindOptions(
  em: EntityManager,
  limit: number,
):
  | {
      limit: number;
      orderBy: { createdAt: 'ASC' };
    }
  | {
      limit: number;
      orderBy: { createdAt: 'ASC' };
      lockMode: LockMode.PESSIMISTIC_PARTIAL_WRITE;
    } {
  const options = {
    limit,
    orderBy: { createdAt: 'ASC' as const },
  };

  if (!supportsSkipLocked(em)) return options;

  return {
    ...options,
    lockMode: LockMode.PESSIMISTIC_PARTIAL_WRITE,
  };
}

function supportsSkipLocked(em: EntityManager): boolean {
  const platformName = getPlatformName(em);
  if (!platformName) return true;
  return supportsSkipLockedClaiming(em);
}

function claimTransactionOptions(
  em: EntityManager,
): { isolationLevel: IsolationLevel } | undefined {
  const platformName = getPlatformName(em);
  if (platformName?.includes('mysql')) {
    return { isolationLevel: IsolationLevel.READ_COMMITTED };
  }

  return undefined;
}

function getPlatformName(em: EntityManager): string | undefined {
  return getMikroPlatformName(em);
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
