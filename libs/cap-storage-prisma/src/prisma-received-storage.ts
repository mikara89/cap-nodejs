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
import type { PrismaCapClient, PrismaCapExecutor } from './prisma-cap-client';
import { initializePrismaCapStorage } from './prisma-cap-schema';
import { getPrismaStorageCapabilities } from './prisma-storage-capabilities';
import {
  type PrismaStorageOptions,
  type ResolvedPrismaStorageOptions,
  resolvePrismaStorageOptions,
} from './prisma-storage-options';
import {
  deserializePrismaJson,
  executePrismaSql,
  fromPrismaDbDate,
  PrismaSqlBuilder,
  prismaBoolean,
  prismaInsertSql,
  queryPrismaSql,
  quotePrismaIdentifier,
  serializePrismaJson,
  toPrismaDbDate,
  toRequiredPrismaDbDate,
} from './prisma-storage-utils';

interface ReceivedRow {
  id: string;
  topic: string;
  group: string;
  message_id: string;
  dedupe_key: string;
  payload: string;
  headers: string | null;
  processed: boolean | number | bigint;
  retry_count: number | bigint;
  status: CapReceivedEvent<JsonValue>['status'];
  last_error: string | null;
  next_retry: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

const receivedColumns = [
  'id',
  'topic',
  'group',
  'message_id',
  'dedupe_key',
  'payload',
  'headers',
  'processed',
  'retry_count',
  'status',
  'last_error',
  'next_retry',
  'processed_at',
  'created_at',
  'updated_at',
];

export class PrismaReceivedStorage
  implements ReceivedStoragePort, CapabilityAwareStoragePort
{
  private readonly options: ResolvedPrismaStorageOptions;

  constructor(
    private readonly client: PrismaCapClient,
    options: PrismaStorageOptions,
  ) {
    this.options = resolvePrismaStorageOptions(options);
  }

  async initialize(options?: InitOptions): Promise<void> {
    if (!(options && (options.autoInit || options.createSchema))) return;
    await initializePrismaCapStorage(this.client, this.options);
  }

  async trySaveReceived<T extends JsonValue = JsonValue>(
    event: CapReceivedEvent<T>,
  ): Promise<TrySaveReceivedResult<T>> {
    if (this.options.provider === 'mysql') {
      return this.client.$transaction(async (tx) => {
        await queryPrismaSql(tx, 'SELECT LAST_INSERT_ID(0)');
        return this.trySaveReceivedWithExecutor(event, tx, true);
      });
    }

    return this.trySaveReceivedWithExecutor(event, this.client, false);
  }

  private async trySaveReceivedWithExecutor<T extends JsonValue>(
    event: CapReceivedEvent<T>,
    executor: PrismaCapExecutor,
    readMySqlDuplicateFlag: boolean,
  ): Promise<TrySaveReceivedResult<T>> {
    const insert = prismaInsertSql(
      this.options.provider,
      this.options.receivedTableName,
      receivedColumns,
      mapReceivedToValues(event),
      'ignoreDedupe',
    );
    let affected = await executePrismaSql(executor, insert.sql, insert.values);
    if (readMySqlDuplicateFlag) {
      const rows = await queryPrismaSql<Array<{ duplicate: bigint | number }>>(
        executor,
        'SELECT LAST_INSERT_ID() AS duplicate',
      );
      affected = Number(rows[0]?.duplicate ?? 0) === 0 ? 1 : 0;
    }

    if (affected > 0) {
      return { inserted: true, id: event.id, event };
    }

    const existing = await this.findByDedupe(
      event.group,
      event.dedupeKey,
      executor,
    );
    if (!existing) {
      throw new Error(
        `Prisma received insert was ignored, but no row exists for group "${event.group}" and dedupe key "${event.dedupeKey}".`,
      );
    }

    return {
      inserted: false,
      id: existing.id,
      event: mapReceivedRow(existing) as CapReceivedEvent<T>,
    };
  }

  getCapabilities(): CapStorageCapabilities {
    return getPrismaStorageCapabilities(this.options.provider);
  }

  async markProcessed(id: string, processedAt = new Date()): Promise<void> {
    const builder = new PrismaSqlBuilder(this.options.provider);
    const processed = builder.parameter(toRequiredPrismaDbDate(processedAt));
    const updated = builder.parameter(toRequiredPrismaDbDate(processedAt));
    const eventId = builder.parameter(id);
    await executePrismaSql(
      this.client,
      `UPDATE ${this.quote(
        this.options.receivedTableName,
      )} SET ${this.quote('status')} = 'processed', ${this.quote(
        'processed',
      )} = 1, ${this.quote(
        'processed_at',
      )} = ${processed}, ${this.quote('next_retry')} = NULL, ${this.quote(
        'updated_at',
      )} = ${updated} WHERE ${this.quote('id')} = ${eventId}`,
      builder.values,
    );
  }

  async markReceivedFailed(
    id: string,
    error: unknown,
    options: MarkReceivedFailedOptions,
  ): Promise<void> {
    const row = await this.findReceivedRowById(id);
    if (!row) return;

    const retryCount = Number(row.retry_count) + 1;
    const status = retryCount >= options.maxRetries ? 'dead_letter' : 'failed';
    const builder = new PrismaSqlBuilder(this.options.provider);
    const retry = builder.parameter(retryCount);
    const nextRetry = builder.parameter(
      status === 'dead_letter' ? null : toPrismaDbDate(options.nextRetryAt),
    );
    const lastError = builder.parameter(
      error instanceof Error ? error.message : String(error),
    );
    const updated = builder.parameter(toRequiredPrismaDbDate(options.now));
    const eventId = builder.parameter(id);
    await executePrismaSql(
      this.client,
      `UPDATE ${this.quote(
        this.options.receivedTableName,
      )} SET ${this.quote('retry_count')} = ${retry}, ${this.quote(
        'status',
      )} = '${status}', ${this.quote(
        'next_retry',
      )} = ${nextRetry}, ${this.quote(
        'last_error',
      )} = ${lastError}, ${this.quote(
        'updated_at',
      )} = ${updated} WHERE ${this.quote('id')} = ${eventId}`,
      builder.values,
    );
  }

  async getRetryDue(
    limit: number,
    now = new Date(),
    pendingBefore?: Date,
  ): Promise<CapReceivedEvent<JsonValue>[]> {
    const builder = new PrismaSqlBuilder(this.options.provider);
    const due = builder.parameter(toRequiredPrismaDbDate(now));
    const pending = pendingBefore
      ? builder.parameter(toRequiredPrismaDbDate(pendingBefore))
      : undefined;
    const rowLimit = builder.parameter(limit);
    const rows = await queryPrismaSql<ReceivedRow[]>(
      this.client,
      `SELECT * FROM ${this.quote(
        this.options.receivedTableName,
      )} WHERE (${this.quote('status')} = 'failed' AND ${this.quote(
        'next_retry',
      )} <= ${due})${
        pending
          ? ` OR (${this.quote('status')} = 'pending' AND ${this.quote(
              'created_at',
            )} <= ${pending})`
          : ''
      } ORDER BY CASE WHEN ${this.quote('status')} = 'failed' THEN ${this.quote(
        'next_retry',
      )} ELSE ${this.quote('created_at')} END ASC, ${this.quote(
        'created_at',
      )} ASC, ${this.quote('id')} ASC LIMIT ${rowLimit}`,
      builder.values,
    );
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
    const filters = this.receivedListFilters(options);
    const table = this.quote(this.options.receivedTableName);
    const countRows = await queryPrismaSql<Array<{ total: bigint | number }>>(
      this.client,
      `SELECT COUNT(*) AS ${this.quote('total')} FROM ${table}${filters.where}`,
      filters.values,
    );

    const pagination = new PrismaSqlBuilder(
      this.options.provider,
      filters.values,
    );
    const limit = pagination.parameter(options.limit ?? 2_147_483_647);
    const offset = pagination.parameter(options.offset ?? 0);
    const rows = await queryPrismaSql<ReceivedRow[]>(
      this.client,
      `SELECT * FROM ${table}${filters.where} ORDER BY ${this.quote(
        'created_at',
      )} DESC LIMIT ${limit} OFFSET ${offset}`,
      pagination.values,
    );

    return {
      items: rows.map(mapReceivedRow),
      total: Number(countRows[0]?.total ?? 0),
    };
  }

  private async findReceivedRowById(
    id: string,
  ): Promise<ReceivedRow | undefined> {
    const builder = new PrismaSqlBuilder(this.options.provider);
    const eventId = builder.parameter(id);
    const rows = await queryPrismaSql<ReceivedRow[]>(
      this.client,
      `SELECT * FROM ${this.quote(
        this.options.receivedTableName,
      )} WHERE ${this.quote('id')} = ${eventId} LIMIT 1`,
      builder.values,
    );
    return rows[0];
  }

  private async findByDedupe(
    group: string,
    dedupeKey: string,
    executor: PrismaCapExecutor = this.client,
  ): Promise<ReceivedRow | undefined> {
    const builder = new PrismaSqlBuilder(this.options.provider);
    const eventGroup = builder.parameter(group);
    const key = builder.parameter(dedupeKey);
    const rows = await queryPrismaSql<ReceivedRow[]>(
      executor,
      `SELECT * FROM ${this.quote(
        this.options.receivedTableName,
      )} WHERE ${this.quote('group')} = ${eventGroup} AND ${this.quote(
        'dedupe_key',
      )} = ${key} LIMIT 1`,
      builder.values,
    );
    return rows[0];
  }

  private receivedListFilters(options: DashboardListOptions): {
    where: string;
    values: unknown[];
  } {
    const builder = new PrismaSqlBuilder(this.options.provider);
    const clauses: string[] = [];

    if (options.topic) {
      clauses.push(
        `${this.quote('topic')} = ${builder.parameter(options.topic)}`,
      );
    }
    if (options.due) {
      clauses.push(`${this.quote('status')} = 'failed'`);
      clauses.push(
        `${this.quote('next_retry')} <= ${builder.parameter(
          toRequiredPrismaDbDate(new Date()),
        )}`,
      );
    }

    return {
      where: clauses.length > 0 ? ` WHERE ${clauses.join(' AND ')}` : '',
      values: builder.values,
    };
  }

  private quote(identifier: string): string {
    return quotePrismaIdentifier(this.options.provider, identifier);
  }
}

function mapReceivedToValues<T extends JsonValue>(
  event: CapReceivedEvent<T>,
): unknown[] {
  const now = toRequiredPrismaDbDate(new Date());
  return [
    event.id,
    event.topic,
    event.group,
    event.messageId,
    event.dedupeKey,
    serializePrismaJson(event.payload) ?? 'null',
    serializePrismaJson(event.headers),
    prismaBoolean(event.processed),
    event.retryCount,
    event.status,
    event.lastError ?? null,
    toPrismaDbDate(event.nextRetry),
    toPrismaDbDate(event.processedAt),
    toPrismaDbDate(event.occurredAt) ?? now,
    now,
  ];
}

function mapReceivedRow(row: ReceivedRow): CapReceivedEvent<JsonValue> {
  return {
    id: row.id,
    topic: row.topic,
    occurredAt: row.created_at,
    group: row.group,
    messageId: row.message_id,
    dedupeKey: row.dedupe_key,
    payload: deserializePrismaJson(row.payload),
    headers:
      row.headers === null
        ? undefined
        : (deserializePrismaJson(
            row.headers,
          ) as CapReceivedEvent<JsonValue>['headers']),
    processed: Boolean(row.processed),
    retryCount: Number(row.retry_count),
    status: row.status,
    lastError: row.last_error,
    processedAt: fromPrismaDbDate(row.processed_at),
    nextRetry: fromPrismaDbDate(row.next_retry),
  };
}
