import type { PrismaCapExecutor } from './prisma-cap-client';
import {
  type PrismaStorageOptions,
  type ResolvedPrismaStorageOptions,
  resolvePrismaStorageOptions,
} from './prisma-storage-options';
import {
  executePrismaSql,
  queryPrismaSql,
  quotePrismaIdentifier,
} from './prisma-storage-utils';

export type InitializePrismaCapStorageOptions = PrismaStorageOptions;

export async function initializePrismaCapStorage(
  client: PrismaCapExecutor,
  options: InitializePrismaCapStorageOptions,
): Promise<void> {
  const resolved = resolvePrismaStorageOptions(options);
  await executePrismaSql(client, publishTableSql(resolved));
  await executePrismaSql(client, receivedTableSql(resolved));
  await createIndexes(client, resolved);
}

export const createPrismaCapSchema = initializePrismaCapStorage;

function publishTableSql(options: ResolvedPrismaStorageOptions): string {
  const q = (identifier: string): string =>
    quotePrismaIdentifier(options.provider, identifier);

  return `CREATE TABLE IF NOT EXISTS ${q(options.publishTableName)} (
    ${q('id')} VARCHAR(128) PRIMARY KEY,
    ${q('topic')} VARCHAR(255) NOT NULL,
    ${q('payload')} TEXT NOT NULL,
    ${q('headers')} TEXT NULL,
    ${q('retry_count')} INTEGER NOT NULL DEFAULT 0,
    ${q('status')} VARCHAR(32) NOT NULL,
    ${q('next_retry_at')} VARCHAR(64) NULL,
    ${q('last_error')} TEXT NULL,
    ${q('locked_by')} VARCHAR(255) NULL,
    ${q('locked_until')} VARCHAR(64) NULL,
    ${q('published_at')} VARCHAR(64) NULL,
    ${q('created_at')} VARCHAR(64) NOT NULL,
    ${q('updated_at')} VARCHAR(64) NOT NULL
  )`;
}

function receivedTableSql(options: ResolvedPrismaStorageOptions): string {
  const q = (identifier: string): string =>
    quotePrismaIdentifier(options.provider, identifier);

  return `CREATE TABLE IF NOT EXISTS ${q(options.receivedTableName)} (
    ${q('id')} VARCHAR(128) PRIMARY KEY,
    ${q('topic')} VARCHAR(255) NOT NULL,
    ${q('group')} VARCHAR(255) NOT NULL,
    ${q('message_id')} VARCHAR(255) NOT NULL,
    ${q('dedupe_key')} VARCHAR(512) NOT NULL,
    ${q('payload')} TEXT NOT NULL,
    ${q('headers')} TEXT NULL,
    ${q('processed')} INTEGER NOT NULL DEFAULT 0,
    ${q('retry_count')} INTEGER NOT NULL DEFAULT 0,
    ${q('status')} VARCHAR(32) NOT NULL,
    ${q('last_error')} TEXT NULL,
    ${q('next_retry')} VARCHAR(64) NULL,
    ${q('processed_at')} VARCHAR(64) NULL,
    ${q('created_at')} VARCHAR(64) NOT NULL,
    ${q('updated_at')} VARCHAR(64) NOT NULL,
    UNIQUE (${q('group')}, ${q('dedupe_key')})
  )`;
}

async function createIndexes(
  client: PrismaCapExecutor,
  options: ResolvedPrismaStorageOptions,
): Promise<void> {
  const indexes: Array<{
    name: string;
    table: string;
    columns: string[];
  }> = [
    {
      name: `${options.publishTableName}_status_retry_idx`,
      table: options.publishTableName,
      columns: ['status', 'next_retry_at'],
    },
    {
      name: `${options.publishTableName}_status_lock_idx`,
      table: options.publishTableName,
      columns: ['status', 'locked_until'],
    },
    {
      name: `${options.publishTableName}_topic_idx`,
      table: options.publishTableName,
      columns: ['topic'],
    },
    {
      name: `${options.receivedTableName}_status_retry_idx`,
      table: options.receivedTableName,
      columns: ['status', 'next_retry'],
    },
    {
      name: `${options.receivedTableName}_topic_group_idx`,
      table: options.receivedTableName,
      columns: ['topic', 'group'],
    },
  ];

  for (const index of indexes) {
    if (options.provider === 'mysql') {
      if (await mysqlIndexExists(client, index.table, index.name)) continue;
    }

    const q = (identifier: string): string =>
      quotePrismaIdentifier(options.provider, identifier);
    const ifNotExists = options.provider === 'mysql' ? '' : ' IF NOT EXISTS';
    const sql = `CREATE INDEX${ifNotExists} ${q(index.name)} ON ${q(
      index.table,
    )} (${index.columns.map(q).join(', ')})`;
    await executePrismaSql(client, sql);
  }
}

async function mysqlIndexExists(
  client: PrismaCapExecutor,
  tableName: string,
  indexName: string,
): Promise<boolean> {
  const rows = await queryPrismaSql<Array<{ count: bigint | number | string }>>(
    client,
    'SELECT COUNT(*) AS count FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?',
    [tableName, indexName],
  );
  return Number(rows[0]?.count ?? 0) > 0;
}
