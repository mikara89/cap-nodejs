import { type DataSource } from 'typeorm';
import type { SelectQueryBuilder } from 'typeorm';
import type {
  CapabilityAwareStoragePort,
  CapReceivedEvent,
  CapStorageCapabilities,
  DashboardListOptions,
  DashboardListResult,
  InitOptions,
  JsonValue,
  MarkReceivedFailedOptions,
  ReceivedStoragePort,
  TrySaveReceivedResult,
} from '@mikara89/cap-core';
import { createTypeOrmCapSchema } from './typeorm-cap-schema';
import {
  type TypeOrmStorageOptions,
  resolveTypeOrmStorageOptions,
} from './typeorm-storage-options';
import { getTypeOrmStorageCapabilities } from './typeorm-storage-capabilities';
import {
  column,
  deserializeJson,
  fromDbDate,
  isDuplicateKeyError,
  serializeJson,
  toDbDate,
  toRequiredDbDate,
} from './typeorm-storage-utils';

interface ReceivedRow {
  id: string;
  topic: string;
  group: string;
  message_id: string;
  dedupe_key: string;
  payload: string;
  headers: string | null;
  processed: boolean | number;
  retry_count: number;
  status: CapReceivedEvent<JsonValue>['status'];
  last_error: string | null;
  next_retry: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

export class TypeOrmReceivedStorage
  implements ReceivedStoragePort, CapabilityAwareStoragePort
{
  private readonly tableName: string;

  constructor(
    private readonly dataSource: DataSource,
    options: TypeOrmStorageOptions = {},
  ) {
    this.tableName = resolveTypeOrmStorageOptions(options).receivedTableName;
  }

  async initialize(options?: InitOptions): Promise<void> {
    if (!(options && (options.autoInit || options.createSchema))) return;
    await createTypeOrmCapSchema(this.dataSource, {
      receivedTableName: this.tableName,
    });
  }

  async trySaveReceived<T extends JsonValue = JsonValue>(
    event: CapReceivedEvent<T>,
  ): Promise<TrySaveReceivedResult<T>> {
    try {
      await this.dataSource.manager
        .createQueryBuilder()
        .insert()
        .into(this.tableName)
        .values(mapReceivedToRow(event))
        .execute();
      return { inserted: true, id: event.id, event };
    } catch (err) {
      if (!isDuplicateKeyError(err)) throw err;

      const existing = await this.findByDedupe(event.group, event.dedupeKey);
      if (!existing) throw err;

      return {
        inserted: false,
        id: existing.id,
        event: mapReceivedRow(existing) as CapReceivedEvent<T>,
      };
    }
  }

  getCapabilities(): CapStorageCapabilities {
    return getTypeOrmStorageCapabilities(this.dataSource);
  }

  async markProcessed(id: string, processedAt = new Date()): Promise<void> {
    await this.dataSource.manager
      .createQueryBuilder()
      .update(this.tableName)
      .set({
        status: 'processed',
        processed: true,
        processed_at: toDbDate(processedAt),
        next_retry: null,
        updated_at: toRequiredDbDate(processedAt),
      })
      .where('id = :id', { id })
      .execute();
  }

  async markReceivedFailed(
    id: string,
    error: unknown,
    options: MarkReceivedFailedOptions,
  ): Promise<void> {
    const row = await this.findReceivedRowById(id);
    if (!row) return;

    const retryCount = row.retry_count + 1;
    const status =
      retryCount >= options.maxRetries ? 'dead_letter' : ('failed' as const);

    await this.dataSource.manager
      .createQueryBuilder()
      .update(this.tableName)
      .set({
        retry_count: retryCount,
        status,
        next_retry:
          status === 'dead_letter' ? null : toDbDate(options.nextRetryAt),
        last_error: error instanceof Error ? error.message : String(error),
        updated_at: toRequiredDbDate(options.now),
      })
      .where('id = :id', { id })
      .execute();
  }

  async getRetryDue(
    limit: number,
    now = new Date(),
    pendingBefore?: Date,
  ): Promise<CapReceivedEvent<JsonValue>[]> {
    const alias = 'cap_received_row';
    const query = this.dataSource.manager
      .createQueryBuilder()
      .select(`${alias}.*`)
      .from(this.tableName, alias)
      .where(
        `${column(this.dataSource, alias, 'status')} = :failedStatus AND ${column(this.dataSource, alias, 'next_retry')} <= :now`,
        { failedStatus: 'failed', now: toDbDate(now) },
      );
    if (pendingBefore) {
      query.orWhere(
        `${column(this.dataSource, alias, 'status')} = :pendingStatus AND ${column(this.dataSource, alias, 'created_at')} <= :pendingBefore`,
        {
          pendingStatus: 'pending',
          pendingBefore: toDbDate(pendingBefore),
        },
      );
    }
    const rows = await query
      .orderBy(column(this.dataSource, alias, 'next_retry'), 'ASC')
      .addOrderBy(column(this.dataSource, alias, 'created_at'), 'ASC')
      .addOrderBy(column(this.dataSource, alias, 'id'), 'ASC')
      .limit(limit)
      .getRawMany<ReceivedRow>();

    return rows.map(mapReceivedRow);
  }

  async findReceivedById(
    id: string,
  ): Promise<CapReceivedEvent<JsonValue> | undefined> {
    const row = await this.findReceivedRowById(id);
    return row ? mapReceivedRow(row) : undefined;
  }

  async listReceived(
    options: DashboardListOptions = {},
  ): Promise<DashboardListResult<CapReceivedEvent<JsonValue>>> {
    const alias = 'cap_received_row';
    const query = this.dataSource.manager
      .createQueryBuilder()
      .select(`${alias}.*`)
      .from(this.tableName, alias);
    applyReceivedListFilters(query, this.dataSource, alias, options);

    const countRow = await query
      .clone()
      .select('COUNT(*)', 'total')
      .getRawOne<{ total: number | string }>();
    const rows = await query
      .clone()
      .orderBy(column(this.dataSource, alias, 'created_at'), 'DESC')
      .limit(options.limit ?? Number.MAX_SAFE_INTEGER)
      .offset(options.offset ?? 0)
      .getRawMany<ReceivedRow>();

    return {
      items: rows.map(mapReceivedRow),
      total: Number(countRow?.total ?? 0),
    };
  }

  private async findReceivedRowById(
    id: string,
  ): Promise<ReceivedRow | undefined> {
    const alias = 'cap_received_row';
    const rows = await this.dataSource.manager
      .createQueryBuilder()
      .select(`${alias}.*`)
      .from(this.tableName, alias)
      .where(`${column(this.dataSource, alias, 'id')} = :id`, { id })
      .limit(1)
      .getRawMany<ReceivedRow>();
    return rows[0];
  }

  private async findByDedupe(
    group: string,
    dedupeKey: string,
  ): Promise<ReceivedRow | undefined> {
    const alias = 'cap_received_row';
    const rows = await this.dataSource.manager
      .createQueryBuilder()
      .select(`${alias}.*`)
      .from(this.tableName, alias)
      .where(`${column(this.dataSource, alias, 'group')} = :group`, { group })
      .andWhere(
        `${column(this.dataSource, alias, 'dedupe_key')} = :dedupeKey`,
        {
          dedupeKey,
        },
      )
      .limit(1)
      .getRawMany<ReceivedRow>();
    return rows[0];
  }
}

function applyReceivedListFilters(
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
  if (options.due) {
    query
      .andWhere(`${column(dataSource, alias, 'status')} = :status`, {
        status: 'failed',
      })
      .andWhere(`${column(dataSource, alias, 'next_retry')} <= :now`, {
        now: toDbDate(new Date()),
      });
  }
}

function mapReceivedToRow<T extends JsonValue>(
  event: CapReceivedEvent<T>,
): ReceivedRow {
  const now = toRequiredDbDate(new Date());

  return {
    id: event.id,
    topic: event.topic,
    group: event.group,
    message_id: event.messageId,
    dedupe_key: event.dedupeKey,
    payload: serializeJson(event.payload) ?? 'null',
    headers: serializeJson(event.headers),
    processed: event.processed,
    retry_count: event.retryCount,
    status: event.status,
    last_error: event.lastError ?? null,
    next_retry: toDbDate(event.nextRetry),
    processed_at: toDbDate(event.processedAt),
    created_at: toDbDate(event.occurredAt) ?? now,
    updated_at: now,
  };
}

function mapReceivedRow(row: ReceivedRow): CapReceivedEvent<JsonValue> {
  return {
    id: row.id,
    topic: row.topic,
    occurredAt: row.created_at,
    group: row.group,
    messageId: row.message_id,
    dedupeKey: row.dedupe_key,
    payload: deserializeJson(row.payload),
    headers:
      row.headers === null
        ? undefined
        : (deserializeJson(
            row.headers,
          ) as CapReceivedEvent<JsonValue>['headers']),
    processed: Boolean(row.processed),
    retryCount: Number(row.retry_count),
    status: row.status,
    lastError: row.last_error,
    processedAt: fromDbDate(row.processed_at),
    nextRetry: fromDbDate(row.next_retry),
  };
}
