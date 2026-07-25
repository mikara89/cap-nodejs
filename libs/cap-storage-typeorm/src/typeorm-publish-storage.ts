import type { EntityManager, SelectQueryBuilder } from 'typeorm';
import type {
  CapOperationContext,
  CapOutboxSnapshot,
  CapRequeueResult,
  CapabilityAwareStoragePort,
  CapPublishEvent,
  CapStorageCapabilities,
  ClaimUnpublishedOptions,
  DashboardListOptions,
  DashboardListResult,
  InitOptions,
  JsonValue,
  MarkPublishFailedOptions,
  PublishClaimOwnership,
  PublishStorageAdministrationPort,
  PublishStoragePort,
  RenewPublishClaimOptions,
} from '@mikara89/cap-core';
import { type DataSource } from 'typeorm';
import { createTypeOrmCapSchema } from './typeorm-cap-schema';
import {
  type TypeOrmStorageOptions,
  resolveTypeOrmStorageOptions,
} from './typeorm-storage-options';
import { getTypeOrmStorageCapabilities } from './typeorm-storage-capabilities';
import {
  column,
  deserializeJson,
  escapeIdentifier,
  fromDbDate,
  getTypeOrmDialect,
  serializeJson,
  supportsTypeOrmSkipLockedClaiming,
  toDbDate,
  toRequiredDbDate,
} from './typeorm-storage-utils';

interface PublishRow {
  id: string;
  topic: string;
  payload: string;
  headers: string | null;
  retry_count: number;
  status: CapPublishEvent<JsonValue>['status'];
  next_retry_at: string | null;
  last_error: string | null;
  locked_by: string | null;
  locked_until: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export class TypeOrmPublishStorage
  implements
    PublishStoragePort<EntityManager>,
    PublishStorageAdministrationPort<EntityManager>,
    CapabilityAwareStoragePort
{
  private readonly tableName: string;

  constructor(
    private readonly dataSource: DataSource,
    options: TypeOrmStorageOptions = {},
  ) {
    this.tableName = resolveTypeOrmStorageOptions(options).publishTableName;
  }

  async initialize(options?: InitOptions): Promise<void> {
    if (!(options && (options.autoInit || options.createSchema))) return;
    await createTypeOrmCapSchema(this.dataSource, {
      publishTableName: this.tableName,
    });
  }

  async savePublish<T extends JsonValue = JsonValue>(
    event: CapPublishEvent<T>,
    ctx?: CapOperationContext<EntityManager>,
  ): Promise<string> {
    const manager = ctx?.tx ?? this.dataSource.manager;
    await manager
      .createQueryBuilder()
      .insert()
      .into(this.tableName)
      .values(mapPublishToRow(event))
      .execute();
    return event.id;
  }

  /**
   * @deprecated Use savePublish(event, { tx }) instead.
   */
  async savePublishWithTx<T extends JsonValue = JsonValue>(
    event: CapPublishEvent<T>,
    tx: EntityManager,
  ): Promise<string> {
    return this.savePublish(event, { tx });
  }

  getCapabilities(): CapStorageCapabilities {
    return getTypeOrmStorageCapabilities(this.dataSource);
  }

  async claimUnpublished(
    options: ClaimUnpublishedOptions,
  ): Promise<CapPublishEvent<JsonValue>[]> {
    return this.dataSource.transaction(async (manager) => {
      const alias = 'cap_publish_row';
      let query = manager
        .createQueryBuilder()
        .select(`${alias}.*`)
        .from(this.tableName, alias)
        .where(claimableWhere(this.dataSource, alias), {
          failed: 'failed',
          now: toDbDate(options.now),
          pending: 'pending',
          processing: 'processing',
        })
        .orderBy(column(this.dataSource, alias, 'created_at'), 'ASC')
        .limit(options.limit);

      if (supportsTypeOrmSkipLockedClaiming(this.dataSource)) {
        query = query.setLock('pessimistic_write').setOnLocked('skip_locked');
      }

      const rows = await query.getRawMany<PublishRow>();
      if (rows.length === 0) return [];

      const ids = rows.map((row) => row.id);
      const lockedUntil = toRequiredDbDate(options.lockUntil);
      const updatedAt = toRequiredDbDate(options.now);

      await manager
        .createQueryBuilder()
        .update(this.tableName)
        .set({
          status: 'processing',
          locked_by: options.lockedBy,
          locked_until: lockedUntil,
          updated_at: updatedAt,
        })
        .where(`${escapeIdentifier(this.dataSource, 'id')} IN (:...ids)`, {
          ids,
        })
        .execute();

      return rows.map((row) =>
        mapPublishRow({
          ...row,
          status: 'processing',
          locked_by: options.lockedBy,
          locked_until: lockedUntil,
          updated_at: updatedAt,
        }),
      );
    });
  }

  async markPublished(
    id: string,
    publishedAt = new Date(),
    ownership: PublishClaimOwnership = {},
  ): Promise<boolean> {
    let query = this.dataSource.manager
      .createQueryBuilder()
      .update(this.tableName)
      .set({
        status: 'published',
        published_at: toDbDate(publishedAt),
        locked_by: null,
        locked_until: null,
        next_retry_at: null,
        updated_at: toRequiredDbDate(new Date()),
      })
      .where('id = :id', { id });
    if (ownership.expectedLockedBy !== undefined) {
      query = query
        .andWhere('status = :processing', { processing: 'processing' })
        .andWhere('locked_by = :expectedLockedBy', {
          expectedLockedBy: ownership.expectedLockedBy,
        });
    }
    const result = await query.execute();
    return Number(result.affected ?? 0) > 0;
  }

  async markPublishFailed(
    id: string,
    error: unknown,
    options: MarkPublishFailedOptions,
  ): Promise<boolean> {
    const retryCount = escapeIdentifier(this.dataSource, 'retry_count');
    // In generated SET order, MySQL applies retry_count before later expressions.
    const thresholdRetryCount = usesMySqlAssignmentSemantics(this.dataSource)
      ? retryCount
      : `${retryCount} + 1`;
    let query = this.dataSource.manager
      .createQueryBuilder()
      .update(this.tableName)
      .set({
        retry_count: () => `${retryCount} + 1`,
        status: () =>
          `CASE WHEN ${thresholdRetryCount} >= :maxRetries THEN 'dead_letter' ELSE 'failed' END`,
        next_retry_at: () =>
          `CASE WHEN ${thresholdRetryCount} >= :maxRetries THEN NULL ELSE :nextRetryAt END`,
        last_error: error instanceof Error ? error.message : String(error),
        locked_by: null,
        locked_until: null,
        updated_at: toRequiredDbDate(options.now),
      })
      .where('id = :id', {
        id,
        maxRetries: options.maxRetries,
        nextRetryAt: toDbDate(options.nextRetryAt),
      });
    if (options.expectedLockedBy !== undefined) {
      query = query
        .andWhere('status = :processing', { processing: 'processing' })
        .andWhere('locked_by = :expectedLockedBy', {
          expectedLockedBy: options.expectedLockedBy,
        });
    }
    const result = await query.execute();
    return Number(result.affected ?? 0) > 0;
  }

  async renewPublishClaim(options: RenewPublishClaimOptions): Promise<boolean> {
    const result = await this.dataSource.manager
      .createQueryBuilder()
      .update(this.tableName)
      .set({
        locked_until: toRequiredDbDate(options.lockUntil),
        updated_at: toRequiredDbDate(options.now),
      })
      .where('id = :id', { id: options.id })
      .andWhere('status = :status', { status: 'processing' })
      .andWhere('locked_by = :expectedLockedBy', {
        expectedLockedBy: options.expectedLockedBy,
      })
      .andWhere('locked_until > :now', { now: toDbDate(options.now) })
      .execute();
    return Number(result.affected ?? 0) > 0;
  }

  async releaseExpiredClaims(now: Date): Promise<void> {
    await this.dataSource.manager
      .createQueryBuilder()
      .update(this.tableName)
      .set({
        status: 'failed',
        locked_by: null,
        locked_until: null,
        updated_at: toRequiredDbDate(now),
      })
      .where('status = :status', { status: 'processing' })
      .andWhere('locked_until <= :now', { now: toDbDate(now) })
      .execute();
  }

  async findPublishById(
    id: string,
  ): Promise<CapPublishEvent<JsonValue> | undefined> {
    const row = await this.findPublishRowById(this.dataSource.manager, id);
    return row ? mapPublishRow(row) : undefined;
  }

  async requeuePublish(
    id: string,
    now = new Date(),
  ): Promise<CapRequeueResult<CapPublishEvent['status']>> {
    const result = await this.dataSource.manager
      .createQueryBuilder()
      .update(this.tableName)
      .set({
        status: 'failed',
        retry_count: 0,
        last_error: null,
        next_retry_at: toRequiredDbDate(now),
        locked_by: null,
        locked_until: null,
        published_at: null,
        updated_at: toRequiredDbDate(now),
      })
      .where('id = :id', { id })
      .andWhere('status IN (:...eligibleStatuses)', {
        eligibleStatuses: ['failed', 'dead_letter'],
      })
      .execute();
    if (Number(result.affected ?? 0) > 0) return { id, outcome: 'requeued' };

    const row = await this.findPublishRowById(this.dataSource.manager, id);
    return row
      ? { id, outcome: 'not_eligible', previousStatus: row.status }
      : { id, outcome: 'not_found' };
  }

  async getPublishSnapshot(): Promise<CapOutboxSnapshot> {
    const alias = 'cap_publish_snapshot';
    const rows = await this.dataSource.manager
      .createQueryBuilder()
      .select(column(this.dataSource, alias, 'status'), 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect(
        `MIN(${column(this.dataSource, alias, 'created_at')})`,
        'oldest_at',
      )
      .from(this.tableName, alias)
      .groupBy(column(this.dataSource, alias, 'status'))
      .getRawMany<SnapshotRow<CapPublishEvent['status']>>();
    return mapOutboxSnapshot(rows);
  }

  async listPublish(
    options: DashboardListOptions = {},
  ): Promise<DashboardListResult<CapPublishEvent<JsonValue>>> {
    const alias = 'cap_publish_row';
    const query = this.dataSource.manager
      .createQueryBuilder()
      .select(`${alias}.*`)
      .from(this.tableName, alias);
    applyPublishListFilters(query, this.dataSource, alias, options);

    const countRow = await query
      .clone()
      .select('COUNT(*)', 'total')
      .getRawOne<{ total: number | string }>();
    const rows = await query
      .clone()
      .orderBy(column(this.dataSource, alias, 'created_at'), 'DESC')
      .limit(options.limit ?? Number.MAX_SAFE_INTEGER)
      .offset(options.offset ?? 0)
      .getRawMany<PublishRow>();

    return {
      items: rows.map(mapPublishRow),
      total: Number(countRow?.total ?? 0),
    };
  }

  private async findPublishRowById(
    manager: EntityManager,
    id: string,
  ): Promise<PublishRow | undefined> {
    const alias = 'cap_publish_row';
    const rows = await manager
      .createQueryBuilder()
      .select(`${alias}.*`)
      .from(this.tableName, alias)
      .where(`${column(this.dataSource, alias, 'id')} = :id`, { id })
      .limit(1)
      .getRawMany<PublishRow>();
    return rows[0];
  }
}

interface SnapshotRow<TStatus extends string> {
  status: TStatus;
  count: number | string;
  oldest_at: string | null;
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
    if (row.status === 'pending') oldestPendingAt = fromDbDate(row.oldest_at);
    if (row.status === 'failed') oldestFailedAt = fromDbDate(row.oldest_at);
  }
  return { counts, oldestPendingAt, oldestFailedAt };
}

function usesMySqlAssignmentSemantics(dataSource: DataSource): boolean {
  const dialect = getTypeOrmDialect(dataSource);
  return dialect === 'mysql' || dialect === 'mariadb';
}

function claimableWhere(dataSource: DataSource, alias: string): string {
  const status = column(dataSource, alias, 'status');
  const nextRetryAt = column(dataSource, alias, 'next_retry_at');
  const lockedUntil = column(dataSource, alias, 'locked_until');

  return [
    `${status} = :pending`,
    `(${status} = :failed AND (${nextRetryAt} IS NULL OR ${nextRetryAt} <= :now))`,
    `(${status} = :processing AND ${lockedUntil} <= :now)`,
  ].join(' OR ');
}

function applyPublishListFilters(
  query: SelectQueryBuilder<Record<string, unknown>>,
  dataSource: DataSource,
  alias: string,
  options: DashboardListOptions,
): void {
  if (options.topic) {
    query.andWhere(`${column(dataSource, alias, 'topic')} = :topic`, {
      topic: options.topic,
    });
  }
  if (options.onlyUnpublished) {
    query.andWhere(`(${claimableWhere(dataSource, alias)})`, {
      failed: 'failed',
      now: toDbDate(new Date()),
      pending: 'pending',
      processing: 'processing',
    });
  }
}

function mapPublishToRow<T extends JsonValue>(
  event: CapPublishEvent<T>,
): PublishRow {
  const now = toRequiredDbDate(new Date());

  return {
    id: event.id,
    topic: event.topic,
    payload: serializeJson(event.payload) ?? 'null',
    headers: serializeJson(event.headers),
    retry_count: event.retryCount,
    status: event.status,
    next_retry_at: toDbDate(event.nextRetryAt),
    last_error: event.lastError ?? null,
    locked_by: event.lockedBy ?? null,
    locked_until: toDbDate(event.lockedUntil),
    published_at: toDbDate(event.publishedAt),
    created_at: toDbDate(event.occurredAt) ?? now,
    updated_at: now,
  };
}

function mapPublishRow(row: PublishRow): CapPublishEvent<JsonValue> {
  return {
    id: row.id,
    topic: row.topic,
    occurredAt: row.created_at,
    payload: deserializeJson(row.payload),
    headers:
      row.headers === null
        ? undefined
        : (deserializeJson(
            row.headers,
          ) as CapPublishEvent<JsonValue>['headers']),
    retryCount: Number(row.retry_count),
    status: row.status,
    nextRetryAt: fromDbDate(row.next_retry_at),
    lastError: row.last_error,
    lockedBy: row.locked_by,
    lockedUntil: fromDbDate(row.locked_until),
    publishedAt: fromDbDate(row.published_at),
  };
}
