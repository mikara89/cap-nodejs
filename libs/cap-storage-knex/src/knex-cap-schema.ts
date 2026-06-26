import type { Knex } from 'knex';
import {
  type KnexStorageTableOptions,
  resolveKnexStorageOptions,
} from './knex-storage-options';

export type CreateKnexCapSchemaOptions = KnexStorageTableOptions;

export async function createKnexCapSchema(
  knex: Knex,
  options: CreateKnexCapSchemaOptions = {},
): Promise<void> {
  const tables = resolveKnexStorageOptions(options);

  if (!(await knex.schema.hasTable(tables.publishTableName))) {
    await knex.schema.createTable(tables.publishTableName, (table) => {
      table.string('id', 128).primary();
      table.string('topic', 255).notNullable();
      table.text('payload').notNullable();
      table.text('headers').nullable();
      table.integer('retry_count').notNullable().defaultTo(0);
      table.string('status', 32).notNullable();
      table.string('next_retry_at', 64).nullable();
      table.text('last_error').nullable();
      table.string('locked_by', 255).nullable();
      table.string('locked_until', 64).nullable();
      table.string('published_at', 64).nullable();
      table.string('created_at', 64).notNullable();
      table.string('updated_at', 64).notNullable();
      table.index(['status', 'next_retry_at']);
      table.index(['status', 'locked_until']);
      table.index(['topic']);
    });
  }

  if (!(await knex.schema.hasTable(tables.receivedTableName))) {
    await knex.schema.createTable(tables.receivedTableName, (table) => {
      table.string('id', 128).primary();
      table.string('topic', 255).notNullable();
      table.string('group', 255).notNullable();
      table.string('message_id', 255).notNullable();
      table.string('dedupe_key', 512).notNullable();
      table.text('payload').notNullable();
      table.text('headers').nullable();
      table.boolean('processed').notNullable().defaultTo(false);
      table.integer('retry_count').notNullable().defaultTo(0);
      table.string('status', 32).notNullable();
      table.text('last_error').nullable();
      table.string('next_retry', 64).nullable();
      table.string('processed_at', 64).nullable();
      table.string('created_at', 64).notNullable();
      table.string('updated_at', 64).notNullable();
      table.unique(['group', 'dedupe_key']);
      table.index(['status', 'next_retry']);
      table.index(['topic', 'group']);
    });
  }
}
