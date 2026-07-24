import type { Knex } from 'knex';
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
import { createKnexCapSchema } from './knex-cap-schema';
import {
  type KnexStorageOptions,
  resolveKnexStorageOptions,
} from './knex-storage-options';
import { getKnexStorageCapabilities } from './knex-storage-capabilities';
import {
  deserializeJson,
  fromDbDate,
  getKnexClientName,
  serializeJson,
  supportsSkipLockedClaiming,
  toDbDate,
  toRequiredDbDate,
} from './knex-storage-utils';

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

export class KnexPublishStorage
  implements
    PublishStoragePort<Knex.Transaction>,
    PublishStorageAdministrationPort<Knex.Transaction>,
    CapabilityAwareStoragePort
{
  private readonly tableName: string;

  constructor(
    private readonly knex: Knex,
    options: KnexStorageOptions = {},
  ) {
    this.tableName = resolveKnexStorageOptions(options).publishTableName;
  }

  async initialize(options?: InitOptions): Promise<void> {
    if (!(options && (options.autoInit || options.createSchema))) return;
    await createKnexCapSchema(this.knex, { publishTableName: this.tableName });
  }

  async savePublish<T extends JsonValue = JsonValue>(
    event: CapPublishEvent<T>,
    ctx?: CapOperationContext<Knex.Transaction>,
  ): Promise<string> {
    const db = ctx?.tx ?? this.knex;
    await db<PublishRow>(this.tableName).insert(mapPublishToRow(event));
    return event.id;
  }

  /**
   * @deprecated Use savePublish(event, { tx }) instead.
   */
  async savePublishWithTx<T extends JsonValue = JsonValue>(
    event: CapPublishEvent<T>,
    tx: Knex.Transaction,
  ): Promise<string> {
    return this.savePublish(event, { tx });
  }

  getCapabilities(): CapStorageCapabilities {
    return getKnexStorageCapabilities(this.knex);
  }

  async claimUnpublished(
    options: ClaimUnpublishedOptions,
  ): Promise<CapPublishEvent<JsonValue>[]> {
    return this.knex.transaction(async (tx) => {
      let query = tx<PublishRow>(this.tableName)
        .where((builder) => applyClaimableWhere(builder, options.now))
        .orderBy('created_at', 'asc')
        .limit(options.limit);

      if (supportsSkipLockedClaiming(this.knex)) {
        query = query.forUpdate().skipLocked();
      }

      const rows = await query;
      if (rows.length === 0) return [];

      const ids = rows.map((row) => row.id);
      const lockedUntil = toRequiredDbDate(options.lockUntil);
      const updatedAt = toRequiredDbDate(options.now);

      await tx<PublishRow>(this.tableName)
        .whereIn('id', ids)
        .update({
          status: 'processing',
          locked_by: options.lockedBy,
          locked_until: lockedUntil,
          updated_at: updatedAt,
        } as Record<string, unknown>);

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
    const now = toRequiredDbDate(new Date());
    const query = this.knex<PublishRow>(this.tableName).where({ id });
    applyOwnershipWhere(query, ownership.expectedLockedBy);
    const affected = await query.update({
      status: 'published',
      published_at: toDbDate(publishedAt),
      locked_by: null,
      locked_until: null,
      next_retry_at: null,
      updated_at: now,
    } as Record<string, unknown>);
    return Number(affected) > 0;
  }

  async markPublishFailed(
    id: string,
    error: unknown,
    options: MarkPublishFailedOptions,
  ): Promise<boolean> {
    const query = this.knex<PublishRow>(this.tableName).where({ id });
    applyOwnershipWhere(query, options.expectedLockedBy);
    // In generated SET order, MySQL applies retry_count before later expressions.
    const retryThreshold = usesMySqlAssignmentSemantics(this.knex)
      ? '?? >= ?'
      : '?? + 1 >= ?';
    const affected = await query.update({
      retry_count: this.knex.raw('?? + 1', ['retry_count']),
      status: this.knex.raw(`CASE WHEN ${retryThreshold} THEN ? ELSE ? END`, [
        'retry_count',
        options.maxRetries,
        'dead_letter',
        'failed',
      ]),
      next_retry_at: this.knex.raw(
        `CASE WHEN ${retryThreshold} THEN NULL ELSE ? END`,
        ['retry_count', options.maxRetries, toDbDate(options.nextRetryAt)],
      ),
      last_error: error instanceof Error ? error.message : String(error),
      locked_by: null,
      locked_until: null,
      updated_at: toRequiredDbDate(options.now),
    } as Record<string, unknown>);
    return Number(affected) > 0;
  }

  async renewPublishClaim(options: RenewPublishClaimOptions): Promise<boolean> {
    const affected = await this.knex<PublishRow>(this.tableName)
      .where({
        id: options.id,
        status: 'processing',
        locked_by: options.expectedLockedBy,
      })
      .where('locked_until', '>', toDbDate(options.now))
      .update({
        locked_until: toRequiredDbDate(options.lockUntil),
        updated_at: toRequiredDbDate(options.now),
      } as Record<string, unknown>);
    return Number(affected) > 0;
  }

  async releaseExpiredClaims(now: Date): Promise<void> {
    await this.knex<PublishRow>(this.tableName)
      .where({ status: 'processing' })
      .where('locked_until', '<=', toDbDate(now))
      .update({
        status: 'failed',
        locked_by: null,
        locked_until: null,
        updated_at: toRequiredDbDate(now),
      } as Record<string, unknown>);
  }

  async findPublishById(
    id: string,
  ): Promise<CapPublishEvent<JsonValue> | undefined> {
    const row = await this.knex<PublishRow>(this.tableName)
      .where({ id })
      .first();
    return row ? mapPublishRow(row) : undefined;
  }

  async requeuePublish(
    id: string,
    now = new Date(),
  ): Promise<CapRequeueResult<CapPublishEvent['status']>> {
    const affected = await this.knex<PublishRow>(this.tableName)
      .where({ id })
      .whereIn('status', ['failed', 'dead_letter'])
      .update({
        status: 'failed',
        retry_count: 0,
        last_error: null,
        next_retry_at: toRequiredDbDate(now),
        locked_by: null,
        locked_until: null,
        published_at: null,
        updated_at: toRequiredDbDate(now),
      } as Record<string, unknown>);
    if (Number(affected) > 0) return { id, outcome: 'requeued' };

    const row = await this.knex<PublishRow>(this.tableName)
      .where({ id })
      .first();
    return row
      ? { id, outcome: 'not_eligible', previousStatus: row.status }
      : { id, outcome: 'not_found' };
  }

  async getPublishSnapshot(): Promise<CapOutboxSnapshot> {
    const rows = await this.knex<PublishRow, SnapshotRow[]>(this.tableName)
      .select('status')
      .count({ count: '*' })
      .min({ oldest_at: 'created_at' })
      .groupBy('status');
    return mapOutboxSnapshot(rows);
  }

  async listPublish(
    options: DashboardListOptions = {},
  ): Promise<DashboardListResult<CapPublishEvent<JsonValue>>> {
    const query = this.knex<PublishRow>(this.tableName);
    applyPublishListFilters(query, options);

    const countQuery = query
      .clone()
      .clearSelect()
      .clearOrder()
      .count({ total: '*' });
    const [{ total }] = await countQuery;
    const rows = await query
      .clone()
      .orderBy('created_at', 'desc')
      .limit(options.limit ?? Number.MAX_SAFE_INTEGER)
      .offset(options.offset ?? 0);

    return {
      items: rows.map(mapPublishRow),
      total: Number(total),
    };
  }
}

interface SnapshotRow {
  status: CapPublishEvent['status'];
  count?: number | string;
  oldest_at?: string | null;
}

function mapOutboxSnapshot(rows: SnapshotRow[]): CapOutboxSnapshot {
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
    counts[row.status] = Number(row.count ?? 0);
    if (row.status === 'pending') {
      oldestPendingAt = fromDbDate(row.oldest_at ?? null);
    }
    if (row.status === 'failed') {
      oldestFailedAt = fromDbDate(row.oldest_at ?? null);
    }
  }
  return { counts, oldestPendingAt, oldestFailedAt };
}

function usesMySqlAssignmentSemantics(knex: Knex): boolean {
  const clientName = getKnexClientName(knex);
  return clientName.includes('mysql') || clientName.includes('maria');
}

function applyOwnershipWhere(
  query: Knex.QueryBuilder<PublishRow>,
  expectedLockedBy: string | undefined,
): void {
  if (expectedLockedBy === undefined) return;
  query.andWhere({ status: 'processing', locked_by: expectedLockedBy });
}

function applyClaimableWhere(
  builder: Knex.QueryBuilder<PublishRow>,
  now: Date,
): void {
  const nowValue = toDbDate(now);

  builder
    .where({ status: 'pending' })
    .orWhere((failed) => {
      failed.where({ status: 'failed' }).andWhere((retry) => {
        retry
          .whereNull('next_retry_at')
          .orWhere('next_retry_at', '<=', nowValue);
      });
    })
    .orWhere((processing) => {
      processing
        .where({ status: 'processing' })
        .andWhere('locked_until', '<=', nowValue);
    });
}

function applyPublishListFilters(
  query: Knex.QueryBuilder<PublishRow>,
  options: DashboardListOptions,
): void {
  if (options.topic) query.where({ topic: options.topic });
  if (options.onlyUnpublished) {
    query.andWhere((builder) => applyClaimableWhere(builder, new Date()));
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
    retryCount: row.retry_count,
    status: row.status,
    nextRetryAt: fromDbDate(row.next_retry_at),
    lastError: row.last_error,
    lockedBy: row.locked_by,
    lockedUntil: fromDbDate(row.locked_until),
    publishedAt: fromDbDate(row.published_at),
  };
}
