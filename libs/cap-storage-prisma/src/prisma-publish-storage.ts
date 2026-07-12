import type { Prisma } from '@prisma/client';
import type {
  CapOperationContext,
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
  PublishStoragePort,
  RenewPublishClaimOptions,
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
  prismaInsertSql,
  qualifiedPrismaColumn,
  queryPrismaSql,
  quotePrismaIdentifier,
  serializePrismaJson,
  toPrismaDbDate,
  toRequiredPrismaDbDate,
} from './prisma-storage-utils';

interface PublishRow {
  id: string;
  topic: string;
  payload: string;
  headers: string | null;
  retry_count: number | bigint;
  status: CapPublishEvent<JsonValue>['status'];
  next_retry_at: string | null;
  last_error: string | null;
  locked_by: string | null;
  locked_until: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

const publishColumns = [
  'id',
  'topic',
  'payload',
  'headers',
  'retry_count',
  'status',
  'next_retry_at',
  'last_error',
  'locked_by',
  'locked_until',
  'published_at',
  'created_at',
  'updated_at',
];

export class PrismaPublishStorage
  implements
    PublishStoragePort<Prisma.TransactionClient>,
    CapabilityAwareStoragePort
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

  async savePublish<T extends JsonValue = JsonValue>(
    event: CapPublishEvent<T>,
    ctx?: CapOperationContext<Prisma.TransactionClient>,
  ): Promise<string> {
    const executor: PrismaCapExecutor = ctx?.tx ?? this.client;
    const insert = prismaInsertSql(
      this.options.provider,
      this.options.publishTableName,
      publishColumns,
      mapPublishToValues(event),
    );
    await executePrismaSql(executor, insert.sql, insert.values);
    return event.id;
  }

  /**
   * @deprecated Use savePublish(event, { tx }) instead.
   */
  async savePublishWithTx<T extends JsonValue = JsonValue>(
    event: CapPublishEvent<T>,
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    return this.savePublish(event, { tx });
  }

  getCapabilities(): CapStorageCapabilities {
    return getPrismaStorageCapabilities(this.options.provider);
  }

  async claimUnpublished(
    options: ClaimUnpublishedOptions,
  ): Promise<CapPublishEvent<JsonValue>[]> {
    return this.client.$transaction(async (tx) => {
      const builder = new PrismaSqlBuilder(this.options.provider);
      const alias = 'cap_publish_row';
      const status = this.column(alias, 'status');
      const nextRetryAt = this.column(alias, 'next_retry_at');
      const lockedUntil = this.column(alias, 'locked_until');
      const where = [
        `${status} = ${builder.parameter('pending')}`,
        `(${status} = ${builder.parameter(
          'failed',
        )} AND (${nextRetryAt} IS NULL OR ${nextRetryAt} <= ${builder.parameter(
          toRequiredPrismaDbDate(options.now),
        )}))`,
        `(${status} = ${builder.parameter(
          'processing',
        )} AND ${lockedUntil} <= ${builder.parameter(
          toRequiredPrismaDbDate(options.now),
        )})`,
      ].join(' OR ');
      const limit = builder.parameter(options.limit);
      const lockClause =
        this.options.provider === 'sqlite' ? '' : ' FOR UPDATE SKIP LOCKED';
      const sql = `SELECT ${this.quote(alias)}.* FROM ${this.quote(
        this.options.publishTableName,
      )} AS ${this.quote(alias)} WHERE ${where} ORDER BY ${this.column(
        alias,
        'created_at',
      )} ASC LIMIT ${limit}${lockClause}`;
      const rows = await queryPrismaSql<PublishRow[]>(tx, sql, builder.values);
      if (rows.length === 0) return [];

      const update = new PrismaSqlBuilder(this.options.provider);
      const lockedBy = update.parameter(options.lockedBy);
      const lockUntil = update.parameter(
        toRequiredPrismaDbDate(options.lockUntil),
      );
      const updatedAt = update.parameter(toRequiredPrismaDbDate(options.now));
      const ids = rows.map((row) => update.parameter(row.id)).join(', ');
      await executePrismaSql(
        tx,
        `UPDATE ${this.quote(
          this.options.publishTableName,
        )} SET ${this.quote('status')} = 'processing', ${this.quote(
          'locked_by',
        )} = ${lockedBy}, ${this.quote(
          'locked_until',
        )} = ${lockUntil}, ${this.quote(
          'updated_at',
        )} = ${updatedAt} WHERE ${this.quote('id')} IN (${ids})`,
        update.values,
      );

      return rows.map((row) =>
        mapPublishRow({
          ...row,
          status: 'processing',
          locked_by: options.lockedBy,
          locked_until: toRequiredPrismaDbDate(options.lockUntil),
          updated_at: toRequiredPrismaDbDate(options.now),
        }),
      );
    });
  }

  async markPublished(
    id: string,
    publishedAt = new Date(),
    ownership: PublishClaimOwnership = {},
  ): Promise<boolean> {
    const builder = new PrismaSqlBuilder(this.options.provider);
    const published = builder.parameter(toRequiredPrismaDbDate(publishedAt));
    const updated = builder.parameter(toRequiredPrismaDbDate(new Date()));
    const eventId = builder.parameter(id);
    const ownershipWhere =
      ownership.expectedLockedBy === undefined
        ? ''
        : ` AND ${this.quote('status')} = ${builder.parameter(
            'processing',
          )} AND ${this.quote('locked_by')} = ${builder.parameter(
            ownership.expectedLockedBy,
          )}`;
    const affected = await executePrismaSql(
      this.client,
      `UPDATE ${this.quote(
        this.options.publishTableName,
      )} SET ${this.quote('status')} = 'published', ${this.quote(
        'published_at',
      )} = ${published}, ${this.quote('locked_by')} = NULL, ${this.quote(
        'locked_until',
      )} = NULL, ${this.quote('next_retry_at')} = NULL, ${this.quote(
        'updated_at',
      )} = ${updated} WHERE ${this.quote('id')} = ${eventId}${ownershipWhere}`,
      builder.values,
    );
    return affected > 0;
  }

  async markPublishFailed(
    id: string,
    error: unknown,
    options: MarkPublishFailedOptions,
  ): Promise<boolean> {
    const builder = new PrismaSqlBuilder(this.options.provider);
    const retryCount = this.quote('retry_count');
    const maxRetriesForStatus = builder.parameter(options.maxRetries);
    const deadLetter = builder.parameter('dead_letter');
    const failed = builder.parameter('failed');
    const maxRetriesForRetry = builder.parameter(options.maxRetries);
    const nextRetry = builder.parameter(toPrismaDbDate(options.nextRetryAt));
    const lastError = builder.parameter(
      error instanceof Error ? error.message : String(error),
    );
    const updated = builder.parameter(toRequiredPrismaDbDate(options.now));
    const eventId = builder.parameter(id);
    const ownershipWhere =
      options.expectedLockedBy === undefined
        ? ''
        : ` AND ${this.quote('status')} = ${builder.parameter(
            'processing',
          )} AND ${this.quote('locked_by')} = ${builder.parameter(
            options.expectedLockedBy,
          )}`;
    const affected = await executePrismaSql(
      this.client,
      `UPDATE ${this.quote(
        this.options.publishTableName,
      )} SET ${retryCount} = ${retryCount} + 1, ${this.quote(
        'status',
      )} = CASE WHEN ${retryCount} + 1 >= ${maxRetriesForStatus} THEN ${deadLetter} ELSE ${failed} END, ${this.quote(
        'next_retry_at',
      )} = CASE WHEN ${retryCount} + 1 >= ${maxRetriesForRetry} THEN NULL ELSE ${nextRetry} END, ${this.quote(
        'last_error',
      )} = ${lastError}, ${this.quote('locked_by')} = NULL, ${this.quote(
        'locked_until',
      )} = NULL, ${this.quote(
        'updated_at',
      )} = ${updated} WHERE ${this.quote('id')} = ${eventId}${ownershipWhere}`,
      builder.values,
    );
    return affected > 0;
  }

  async renewPublishClaim(options: RenewPublishClaimOptions): Promise<boolean> {
    const builder = new PrismaSqlBuilder(this.options.provider);
    const lockUntil = builder.parameter(
      toRequiredPrismaDbDate(options.lockUntil),
    );
    const updatedAt = builder.parameter(toRequiredPrismaDbDate(options.now));
    const id = builder.parameter(options.id);
    const processing = builder.parameter('processing');
    const owner = builder.parameter(options.expectedLockedBy);
    const now = builder.parameter(toRequiredPrismaDbDate(options.now));
    const affected = await executePrismaSql(
      this.client,
      `UPDATE ${this.quote(
        this.options.publishTableName,
      )} SET ${this.quote('locked_until')} = ${lockUntil}, ${this.quote(
        'updated_at',
      )} = ${updatedAt} WHERE ${this.quote('id')} = ${id} AND ${this.quote(
        'status',
      )} = ${processing} AND ${this.quote(
        'locked_by',
      )} = ${owner} AND ${this.quote('locked_until')} > ${now}`,
      builder.values,
    );
    return affected > 0;
  }

  async releaseExpiredClaims(now: Date): Promise<void> {
    const builder = new PrismaSqlBuilder(this.options.provider);
    const updated = builder.parameter(toRequiredPrismaDbDate(now));
    const expires = builder.parameter(toRequiredPrismaDbDate(now));
    await executePrismaSql(
      this.client,
      `UPDATE ${this.quote(
        this.options.publishTableName,
      )} SET ${this.quote('status')} = 'failed', ${this.quote(
        'locked_by',
      )} = NULL, ${this.quote('locked_until')} = NULL, ${this.quote(
        'updated_at',
      )} = ${updated} WHERE ${this.quote(
        'status',
      )} = 'processing' AND ${this.quote('locked_until')} <= ${expires}`,
      builder.values,
    );
  }

  async findPublishById(
    id: string,
  ): Promise<CapPublishEvent<JsonValue> | undefined> {
    const row = await this.findPublishRowById(this.client, id);
    return row ? mapPublishRow(row) : undefined;
  }

  async listPublish(
    options: DashboardListOptions = {},
  ): Promise<DashboardListResult<CapPublishEvent<JsonValue>>> {
    const filters = this.publishListFilters(options);
    const table = this.quote(this.options.publishTableName);
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
    const rows = await queryPrismaSql<PublishRow[]>(
      this.client,
      `SELECT * FROM ${table}${filters.where} ORDER BY ${this.quote(
        'created_at',
      )} DESC LIMIT ${limit} OFFSET ${offset}`,
      pagination.values,
    );

    return {
      items: rows.map(mapPublishRow),
      total: Number(countRows[0]?.total ?? 0),
    };
  }

  private async findPublishRowById(
    executor: PrismaCapExecutor,
    id: string,
  ): Promise<PublishRow | undefined> {
    const builder = new PrismaSqlBuilder(this.options.provider);
    const eventId = builder.parameter(id);
    const rows = await queryPrismaSql<PublishRow[]>(
      executor,
      `SELECT * FROM ${this.quote(
        this.options.publishTableName,
      )} WHERE ${this.quote('id')} = ${eventId} LIMIT 1`,
      builder.values,
    );
    return rows[0];
  }

  private publishListFilters(options: DashboardListOptions): {
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
    if (options.onlyUnpublished) {
      const now = toRequiredPrismaDbDate(new Date());
      clauses.push(
        `(${this.quote('status')} = ${builder.parameter(
          'pending',
        )} OR (${this.quote('status')} = ${builder.parameter(
          'failed',
        )} AND (${this.quote('next_retry_at')} IS NULL OR ${this.quote(
          'next_retry_at',
        )} <= ${builder.parameter(now)})) OR (${this.quote(
          'status',
        )} = ${builder.parameter('processing')} AND ${this.quote(
          'locked_until',
        )} <= ${builder.parameter(now)}))`,
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

  private column(alias: string, column: string): string {
    return qualifiedPrismaColumn(this.options.provider, alias, column);
  }
}

function mapPublishToValues<T extends JsonValue>(
  event: CapPublishEvent<T>,
): unknown[] {
  const now = toRequiredPrismaDbDate(new Date());
  return [
    event.id,
    event.topic,
    serializePrismaJson(event.payload) ?? 'null',
    serializePrismaJson(event.headers),
    event.retryCount,
    event.status,
    toPrismaDbDate(event.nextRetryAt),
    event.lastError ?? null,
    event.lockedBy ?? null,
    toPrismaDbDate(event.lockedUntil),
    toPrismaDbDate(event.publishedAt),
    toPrismaDbDate(event.occurredAt) ?? now,
    now,
  ];
}

function mapPublishRow(row: PublishRow): CapPublishEvent<JsonValue> {
  return {
    id: row.id,
    topic: row.topic,
    occurredAt: row.created_at,
    payload: deserializePrismaJson(row.payload),
    headers:
      row.headers === null
        ? undefined
        : (deserializePrismaJson(
            row.headers,
          ) as CapPublishEvent<JsonValue>['headers']),
    retryCount: Number(row.retry_count),
    status: row.status,
    nextRetryAt: fromPrismaDbDate(row.next_retry_at),
    lastError: row.last_error,
    lockedBy: row.locked_by,
    lockedUntil: fromPrismaDbDate(row.locked_until),
    publishedAt: fromPrismaDbDate(row.published_at),
  };
}
