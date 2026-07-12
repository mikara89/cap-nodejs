import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DataSource, type EntityManager } from 'typeorm';
import {
  type CapPublishEvent,
  type CapReceivedEvent,
  type JsonValue,
} from '@mikara89/cap-core';
import {
  createPublishFixture,
  createReceivedFixture,
} from '@mikara89/cap-testing';
import { createTypeOrmCapSchema } from './typeorm-cap-schema';
import { getTypeOrmStorageCapabilities } from './typeorm-storage-capabilities';
import { type TypeOrmPublishStorage } from './typeorm-publish-storage';
import { type TypeOrmReceivedStorage } from './typeorm-received-storage';
import { createTypeOrmTestStorage } from './testing/create-typeorm-test-storage';

describe('TypeORM storage', () => {
  let dataSource: DataSource;
  let publishStorage: TypeOrmPublishStorage;
  let receivedStorage: TypeOrmReceivedStorage;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    const env = await createTypeOrmTestStorage();
    dataSource = env.dataSource;
    publishStorage = env.publishStorage;
    receivedStorage = env.receivedStorage;
    cleanup = env.cleanup;
  });

  afterEach(async () => {
    await cleanup();
  });

  it('creates publish and received schema', async () => {
    const queryRunner = dataSource.createQueryRunner();
    try {
      await expect(queryRunner.hasTable('cap_publish')).resolves.toBe(true);
      await expect(queryRunner.hasTable('cap_received')).resolves.toBe(true);
    } finally {
      await queryRunner.release();
    }
  });

  it('persists savePublish(event, { tx }) inside transaction', async () => {
    const event = publishEvent('tx-persist');

    await dataSource.transaction(async (manager) => {
      await publishStorage.savePublish(event, { tx: manager });
    });

    await expect(
      publishStorage.findPublishById(event.id),
    ).resolves.toMatchObject({
      id: event.id,
      status: 'pending',
    });
  });

  it('persists savePublish(event, { ctx: { tx } }) inside transaction through CAP-style ctx', async () => {
    const event = publishEvent('ctx-tx-persist');

    await dataSource.transaction(async (manager) => {
      const ctx = { tx: manager };
      await publishStorage.savePublish(event, ctx);
    });

    await expect(
      publishStorage.findPublishById(event.id),
    ).resolves.toMatchObject({
      id: event.id,
      status: 'pending',
    });
  });

  it('rolls back outbox rows when transaction rolls back', async () => {
    const event = publishEvent('tx-rollback');

    await expect(
      dataSource.transaction(async (manager) => {
        await publishStorage.savePublish(event, { tx: manager });
        throw new Error('rollback');
      }),
    ).rejects.toThrow('rollback');

    await expect(
      publishStorage.findPublishById(event.id),
    ).resolves.toBeUndefined();
  });

  it('savePublishWithTx delegates to savePublish with ctx', async () => {
    const event = publishEvent('legacy-tx');

    await dataSource.transaction(async (manager) => {
      await publishStorage.savePublishWithTx(event, manager);
    });

    await expect(
      publishStorage.findPublishById(event.id),
    ).resolves.toMatchObject({
      id: event.id,
      status: 'pending',
    });
  });

  it('uses EntityManager as the transaction context type', async () => {
    await dataSource.transaction(async (manager: EntityManager) => {
      const event = publishEvent('entity-manager-tx');
      await publishStorage.savePublish(event, { tx: manager });
    });
  });

  it('dedupes received records by group and dedupeKey', async () => {
    const event = receivedEvent('dedupe');
    const duplicate = receivedEvent('dedupe-duplicate', {
      id: 'typeorm-received-dedupe-duplicate',
      messageId: 'message-dedupe-duplicate',
      dedupeKey: event.dedupeKey,
    });

    await expect(receivedStorage.trySaveReceived(event)).resolves.toMatchObject(
      {
        inserted: true,
        id: event.id,
      },
    );
    await expect(
      receivedStorage.trySaveReceived(duplicate),
    ).resolves.toMatchObject({
      inserted: false,
      id: event.id,
    });
  });

  it('allows the same received dedupeKey in different groups', async () => {
    const first = receivedEvent('shared-key-a', {
      group: 'group-a',
      dedupeKey: 'shared-key',
    });
    const second = receivedEvent('shared-key-b', {
      group: 'group-b',
      dedupeKey: 'shared-key',
    });

    await expect(receivedStorage.trySaveReceived(first)).resolves.toMatchObject(
      {
        inserted: true,
        id: first.id,
      },
    );
    await expect(
      receivedStorage.trySaveReceived(second),
    ).resolves.toMatchObject({
      inserted: true,
      id: second.id,
    });
  });

  it('markProcessed honors supplied processedAt', async () => {
    const event = receivedEvent('processed-at');
    const processedAt = new Date('2026-06-16T01:00:00.000Z');

    await receivedStorage.trySaveReceived(event);
    await receivedStorage.markProcessed(event.id, processedAt);

    await expect(
      receivedStorage.findReceivedById(event.id),
    ).resolves.toMatchObject({
      processed: true,
      processedAt,
      status: 'processed',
    });
  });

  it('getRetryDue honors supplied now', async () => {
    const due = receivedEvent('retry-due', {
      status: 'failed',
      retryCount: 1,
      nextRetry: new Date('2026-06-16T01:00:00.000Z'),
    });
    const future = receivedEvent('retry-future', {
      status: 'failed',
      retryCount: 1,
      nextRetry: new Date('2026-06-16T02:00:00.000Z'),
    });

    await receivedStorage.trySaveReceived(due);
    await receivedStorage.trySaveReceived(future);

    const retryDue = await receivedStorage.getRetryDue(
      10,
      new Date('2026-06-16T01:30:00.000Z'),
    );

    expect(retryDue.map((event) => event.id)).toEqual([due.id]);
  });

  it('reports conservative SQLite capabilities', () => {
    expect(getTypeOrmStorageCapabilities(dataSource)).toEqual({
      transactions: true,
      skipLockedClaiming: false,
      advisoryLocks: false,
      atomicInsertIgnore: false,
      nestedTransactions: false,
      isolationLevels: [],
      claimOwnershipFencing: true,
      claimLeaseRenewal: true,
    });
  });

  it('keeps framework imports isolated from package root source', () => {
    const source = readSourceFiles(join(__dirname), new Set(['nest']));
    const frameworkImportPattern = new RegExp(
      `\\bfrom ['"]${'ex'}${'press'}['"]`,
    );

    expect(source).not.toMatch(/@nestjs\//);
    expect(source).not.toMatch(frameworkImportPattern);
  });
});

describe('createTypeOrmCapSchema', () => {
  it('supports custom table names', async () => {
    const dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [],
      synchronize: false,
    });
    await dataSource.initialize();

    try {
      await createTypeOrmCapSchema(dataSource, {
        publishTableName: 'custom_publish',
        receivedTableName: 'custom_received',
      });

      const queryRunner = dataSource.createQueryRunner();
      try {
        await expect(queryRunner.hasTable('custom_publish')).resolves.toBe(
          true,
        );
        await expect(queryRunner.hasTable('custom_received')).resolves.toBe(
          true,
        );
      } finally {
        await queryRunner.release();
      }
    } finally {
      await dataSource.destroy();
    }
  });
});

function publishEvent(id: string): CapPublishEvent<JsonValue> {
  return createPublishFixture({
    id: `typeorm-publish-${id}`,
    topic: 'typeorm.publish',
    payload: { id },
    headers: { 'x-storage': 'typeorm' },
  });
}

function receivedEvent(
  id: string,
  overrides: Partial<CapReceivedEvent<JsonValue>> = {},
): CapReceivedEvent<JsonValue> {
  return {
    ...createReceivedFixture({
      id: `typeorm-received-${id}`,
      topic: 'typeorm.received',
      group: 'typeorm-group',
      messageId: `message-${id}`,
      payload: { id },
      headers: { 'x-storage': 'typeorm' },
    }),
    ...overrides,
  };
}

function readSourceFiles(
  dir: string,
  excludedDirectories = new Set<string>(),
): string {
  return readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        return excludedDirectories.has(entry.name)
          ? []
          : readSourceFiles(path, excludedDirectories);
      }
      if (!entry.isFile() || !entry.name.endsWith('.ts')) return [];
      if (entry.name.endsWith('.spec.ts')) return [];
      return readFileSync(path, 'utf8');
    })
    .join('\n');
}
