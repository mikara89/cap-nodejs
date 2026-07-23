import type { Knex } from 'knex';
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
import { createKnexCapSchema } from './knex-cap-schema';
import {
  type KnexStorageOptions,
  resolveKnexStorageOptions,
} from './knex-storage-options';
import { getKnexStorageCapabilities } from './knex-storage-capabilities';
import {
  deserializeJson,
  fromDbDate,
  isDuplicateKeyError,
  serializeJson,
  toDbDate,
  toRequiredDbDate,
} from './knex-storage-utils';

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

export class KnexReceivedStorage
  implements ReceivedStoragePort, CapabilityAwareStoragePort
{
  private readonly tableName: string;

  constructor(
    private readonly knex: Knex,
    options: KnexStorageOptions = {},
  ) {
    this.tableName = resolveKnexStorageOptions(options).receivedTableName;
  }

  async initialize(options?: InitOptions): Promise<void> {
    if (!(options && (options.autoInit || options.createSchema))) return;
    await createKnexCapSchema(this.knex, { receivedTableName: this.tableName });
  }

  async trySaveReceived<T extends JsonValue = JsonValue>(
    event: CapReceivedEvent<T>,
  ): Promise<TrySaveReceivedResult<T>> {
    try {
      await this.knex<ReceivedRow>(this.tableName).insert(
        mapReceivedToRow(event),
      );
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
    return getKnexStorageCapabilities(this.knex);
  }

  async markProcessed(id: string, processedAt = new Date()): Promise<void> {
    await this.knex<ReceivedRow>(this.tableName)
      .where({ id })
      .update({
        status: 'processed',
        processed: true,
        processed_at: toDbDate(processedAt),
        next_retry: null,
        updated_at: toRequiredDbDate(processedAt),
      } as Record<string, unknown>);
  }

  async markReceivedFailed(
    id: string,
    error: unknown,
    options: MarkReceivedFailedOptions,
  ): Promise<void> {
    const row = await this.knex<ReceivedRow>(this.tableName)
      .where({ id })
      .first();
    if (!row) return;

    const retryCount = row.retry_count + 1;
    const status =
      retryCount >= options.maxRetries ? 'dead_letter' : ('failed' as const);

    await this.knex<ReceivedRow>(this.tableName)
      .where({ id })
      .update({
        retry_count: retryCount,
        status,
        next_retry:
          status === 'dead_letter' ? null : toDbDate(options.nextRetryAt),
        last_error: error instanceof Error ? error.message : String(error),
        updated_at: toRequiredDbDate(options.now),
      } as Record<string, unknown>);
  }

  async getRetryDue(
    limit: number,
    now = new Date(),
    pendingBefore?: Date,
  ): Promise<CapReceivedEvent<JsonValue>[]> {
    const query = this.knex<ReceivedRow>(this.tableName).where((builder) => {
      builder
        .where({ status: 'failed' })
        .where('next_retry', '<=', toDbDate(now));
      if (pendingBefore) {
        builder.orWhere((pending) => {
          pending
            .where({ status: 'pending' })
            .where('created_at', '<=', toDbDate(pendingBefore));
        });
      }
    });
    const rows = await query
      .orderBy('next_retry', 'asc')
      .orderBy('created_at', 'asc')
      .orderBy('id', 'asc')
      .limit(limit);

    return rows.map(mapReceivedRow);
  }

  async findReceivedById(
    id: string,
  ): Promise<CapReceivedEvent<JsonValue> | undefined> {
    const row = await this.knex<ReceivedRow>(this.tableName)
      .where({ id })
      .first();
    return row ? mapReceivedRow(row) : undefined;
  }

  async listReceived(
    options: DashboardListOptions = {},
  ): Promise<DashboardListResult<CapReceivedEvent<JsonValue>>> {
    const query = this.knex<ReceivedRow>(this.tableName);
    applyReceivedListFilters(query, options);

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
      items: rows.map(mapReceivedRow),
      total: Number(total),
    };
  }

  private findByDedupe(
    group: string,
    dedupeKey: string,
  ): Promise<ReceivedRow | undefined> {
    return this.knex<ReceivedRow>(this.tableName)
      .where({ group, dedupe_key: dedupeKey })
      .first();
  }
}

function applyReceivedListFilters(
  query: Knex.QueryBuilder<ReceivedRow>,
  options: DashboardListOptions,
): void {
  if (options.topic) query.where({ topic: options.topic });
  if (options.due) {
    query
      .andWhere({ status: 'failed' })
      .andWhere('next_retry', '<=', toDbDate(new Date()));
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
    retryCount: row.retry_count,
    status: row.status,
    lastError: row.last_error,
    processedAt: fromDbDate(row.processed_at),
    nextRetry: fromDbDate(row.next_retry),
  };
}
