import { type DataSource, Table, TableIndex, TableUnique } from 'typeorm';
import {
  type TypeOrmStorageTableOptions,
  resolveTypeOrmStorageOptions,
} from './typeorm-storage-options';

export type CreateTypeOrmCapSchemaOptions = TypeOrmStorageTableOptions;

export async function createTypeOrmCapSchema(
  dataSource: DataSource,
  options: CreateTypeOrmCapSchemaOptions = {},
): Promise<void> {
  const tables = resolveTypeOrmStorageOptions(options);
  const queryRunner = dataSource.createQueryRunner();

  try {
    await queryRunner.connect();

    if (!(await queryRunner.hasTable(tables.publishTableName))) {
      await queryRunner.createTable(
        new Table({
          name: tables.publishTableName,
          columns: [
            { name: 'id', type: 'varchar', length: '128', isPrimary: true },
            {
              name: 'topic',
              type: 'varchar',
              length: '255',
              isNullable: false,
            },
            { name: 'payload', type: 'text', isNullable: false },
            { name: 'headers', type: 'text', isNullable: true },
            {
              name: 'retry_count',
              type: 'integer',
              isNullable: false,
              default: 0,
            },
            {
              name: 'status',
              type: 'varchar',
              length: '32',
              isNullable: false,
            },
            {
              name: 'next_retry_at',
              type: 'varchar',
              length: '64',
              isNullable: true,
            },
            { name: 'last_error', type: 'text', isNullable: true },
            {
              name: 'locked_by',
              type: 'varchar',
              length: '255',
              isNullable: true,
            },
            {
              name: 'locked_until',
              type: 'varchar',
              length: '64',
              isNullable: true,
            },
            {
              name: 'published_at',
              type: 'varchar',
              length: '64',
              isNullable: true,
            },
            {
              name: 'created_at',
              type: 'varchar',
              length: '64',
              isNullable: false,
            },
            {
              name: 'updated_at',
              type: 'varchar',
              length: '64',
              isNullable: false,
            },
          ],
          indices: [
            new TableIndex({
              name: `${tables.publishTableName}_status_next_retry_idx`,
              columnNames: ['status', 'next_retry_at'],
            }),
            new TableIndex({
              name: `${tables.publishTableName}_status_locked_until_idx`,
              columnNames: ['status', 'locked_until'],
            }),
            new TableIndex({
              name: `${tables.publishTableName}_topic_idx`,
              columnNames: ['topic'],
            }),
          ],
        }),
      );
    }

    if (!(await queryRunner.hasTable(tables.receivedTableName))) {
      await queryRunner.createTable(
        new Table({
          name: tables.receivedTableName,
          columns: [
            { name: 'id', type: 'varchar', length: '128', isPrimary: true },
            {
              name: 'topic',
              type: 'varchar',
              length: '255',
              isNullable: false,
            },
            {
              name: 'group',
              type: 'varchar',
              length: '255',
              isNullable: false,
            },
            {
              name: 'message_id',
              type: 'varchar',
              length: '255',
              isNullable: false,
            },
            {
              name: 'dedupe_key',
              type: 'varchar',
              length: '512',
              isNullable: false,
            },
            { name: 'payload', type: 'text', isNullable: false },
            { name: 'headers', type: 'text', isNullable: true },
            {
              name: 'processed',
              type: 'boolean',
              isNullable: false,
              default: false,
            },
            {
              name: 'retry_count',
              type: 'integer',
              isNullable: false,
              default: 0,
            },
            {
              name: 'status',
              type: 'varchar',
              length: '32',
              isNullable: false,
            },
            { name: 'last_error', type: 'text', isNullable: true },
            {
              name: 'next_retry',
              type: 'varchar',
              length: '64',
              isNullable: true,
            },
            {
              name: 'processed_at',
              type: 'varchar',
              length: '64',
              isNullable: true,
            },
            {
              name: 'created_at',
              type: 'varchar',
              length: '64',
              isNullable: false,
            },
            {
              name: 'updated_at',
              type: 'varchar',
              length: '64',
              isNullable: false,
            },
          ],
          uniques: [
            new TableUnique({
              name: `${tables.receivedTableName}_group_dedupe_key_uq`,
              columnNames: ['group', 'dedupe_key'],
            }),
          ],
          indices: [
            new TableIndex({
              name: `${tables.receivedTableName}_status_next_retry_idx`,
              columnNames: ['status', 'next_retry'],
            }),
            new TableIndex({
              name: `${tables.receivedTableName}_topic_group_idx`,
              columnNames: ['topic', 'group'],
            }),
          ],
        }),
      );
    }
  } finally {
    await queryRunner.release();
  }
}
