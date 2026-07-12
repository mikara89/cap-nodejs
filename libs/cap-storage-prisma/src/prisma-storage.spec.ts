import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Prisma } from '@prisma/client';
import type {
  CapPublishEvent,
  CapReceivedEvent,
  JsonValue,
} from '@mikara89/cap-core';
import {
  createPublishFixture,
  createReceivedFixture,
} from '@mikara89/cap-testing';
import { initializePrismaCapStorage } from './prisma-cap-schema';
import { getPrismaStorageCapabilities } from './prisma-storage-capabilities';
import { validatePrismaIdentifier } from './prisma-storage-options';
import type { PrismaPublishStorage } from './prisma-publish-storage';
import type { PrismaReceivedStorage } from './prisma-received-storage';
import type { PrismaTransactionManager } from './prisma-transaction-manager';
import { createPrismaTestStorage } from './testing/create-prisma-test-storage';

describe('Prisma storage', () => {
  let env: Awaited<ReturnType<typeof createPrismaTestStorage>>;
  let publishStorage: PrismaPublishStorage;
  let receivedStorage: PrismaReceivedStorage;
  let transactionManager: PrismaTransactionManager;

  beforeEach(async () => {
    env = await createPrismaTestStorage();
    publishStorage = env.publishStorage;
    receivedStorage = env.receivedStorage;
    transactionManager = env.transactionManager;
  });

  afterEach(async () => {
    await env.cleanup();
  });

  it('creates publish and received schema without Prisma models', async () => {
    const tables = await env.client.$queryRawUnsafe<Array<{ name: string }>>(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
    );
    expect(tables.map((row) => row.name)).toEqual(
      expect.arrayContaining(['cap_publish', 'cap_received']),
    );
  });

  it('persists savePublish(event, { tx }) inside interactive transaction', async () => {
    const event = publishEvent('tx-persist');

    await env.client.$transaction(async (tx: Prisma.TransactionClient) => {
      await publishStorage.savePublish(event, { tx });
    });

    await expect(
      publishStorage.findPublishById(event.id),
    ).resolves.toMatchObject({ id: event.id, status: 'pending' });
  });

  it('persists a CAP-style ctx transaction', async () => {
    const event = publishEvent('ctx-persist');

    await env.client.$transaction(async (tx: Prisma.TransactionClient) => {
      const ctx = { tx };
      await publishStorage.savePublish(event, ctx);
    });

    await expect(
      publishStorage.findPublishById(event.id),
    ).resolves.toMatchObject({ id: event.id });
  });

  it('rolls back outbox rows with the interactive transaction', async () => {
    const event = publishEvent('tx-rollback');

    await expect(
      env.client.$transaction(async (tx: Prisma.TransactionClient) => {
        await publishStorage.savePublish(event, { tx });
        throw new Error('rollback');
      }),
    ).rejects.toThrow('rollback');

    await expect(
      publishStorage.findPublishById(event.id),
    ).resolves.toBeUndefined();
  });

  it('savePublishWithTx delegates to transaction-aware savePublish', async () => {
    const event = publishEvent('legacy-tx');

    await env.client.$transaction(async (tx: Prisma.TransactionClient) => {
      await publishStorage.savePublishWithTx(event, tx);
    });

    await expect(
      publishStorage.findPublishById(event.id),
    ).resolves.toMatchObject({ id: event.id });
  });

  it('dedupes by group and dedupeKey but permits another group', async () => {
    const first = receivedEvent('dedupe', { dedupeKey: 'shared-key' });
    const duplicate = receivedEvent('duplicate', {
      dedupeKey: first.dedupeKey,
    });
    const otherGroup = receivedEvent('other-group', {
      group: 'other-group',
      dedupeKey: first.dedupeKey,
    });

    await expect(receivedStorage.trySaveReceived(first)).resolves.toMatchObject(
      {
        inserted: true,
        id: first.id,
      },
    );
    await expect(
      receivedStorage.trySaveReceived(duplicate),
    ).resolves.toMatchObject({ inserted: false, id: first.id });
    await expect(
      receivedStorage.trySaveReceived(otherGroup),
    ).resolves.toMatchObject({ inserted: true, id: otherGroup.id });
  });

  it('honors processedAt and the getRetryDue now argument', async () => {
    const processed = receivedEvent('processed');
    const processedAt = new Date('2026-06-27T10:00:00.000Z');
    const due = receivedEvent('due', {
      status: 'failed',
      retryCount: 1,
      nextRetry: new Date('2026-06-27T11:00:00.000Z'),
    });
    const future = receivedEvent('future', {
      status: 'failed',
      retryCount: 1,
      nextRetry: new Date('2026-06-27T12:00:00.000Z'),
    });

    await receivedStorage.trySaveReceived(processed);
    await receivedStorage.markProcessed(processed.id, processedAt);
    await receivedStorage.trySaveReceived(due);
    await receivedStorage.trySaveReceived(future);

    await expect(
      receivedStorage.findReceivedById(processed.id),
    ).resolves.toMatchObject({ processed: true, processedAt });
    await expect(
      receivedStorage.getRetryDue(10, new Date('2026-06-27T11:30:00.000Z')),
    ).resolves.toEqual([expect.objectContaining({ id: due.id })]);
  });

  it('reports conservative provider capabilities', () => {
    expect(getPrismaStorageCapabilities('sqlite')).toEqual({
      transactions: true,
      skipLockedClaiming: false,
      advisoryLocks: false,
      atomicInsertIgnore: true,
      nestedTransactions: false,
      isolationLevels: ['Serializable'],
      claimOwnershipFencing: true,
      claimLeaseRenewal: true,
    });
    expect(getPrismaStorageCapabilities('postgres')).toMatchObject({
      transactions: true,
      skipLockedClaiming: true,
      advisoryLocks: false,
      atomicInsertIgnore: true,
      nestedTransactions: false,
      claimOwnershipFencing: true,
      claimLeaseRenewal: true,
    });
    expect(getPrismaStorageCapabilities('mysql')).toMatchObject({
      skipLockedClaiming: true,
      atomicInsertIgnore: true,
      claimOwnershipFencing: true,
      claimLeaseRenewal: true,
    });
  });

  it('runs transaction manager callbacks after commit and rollback', async () => {
    const committed = jest.fn();
    const rolledBack = jest.fn();
    const event = publishEvent('manager-commit');

    await transactionManager.runInTransaction(
      { isolationLevel: 'Serializable', timeoutMs: 5_000 },
      async (ctx) => {
        expect(transactionManager.getCurrentContext()).toBe(ctx);
        transactionManager.afterCommit(committed);
        await publishStorage.savePublish(event, ctx);
      },
    );

    expect(committed).toHaveBeenCalledTimes(1);
    await expect(
      publishStorage.findPublishById(event.id),
    ).resolves.toBeDefined();

    await expect(
      transactionManager.runInTransaction({}, () => {
        transactionManager.afterRollback(rolledBack);
        return Promise.reject(new Error('manager rollback'));
      }),
    ).rejects.toThrow('manager rollback');
    expect(rolledBack).toHaveBeenCalledWith(expect.any(Error));
  });

  it('rejects unsupported transaction isolation levels', async () => {
    await expect(
      transactionManager.runInTransaction(
        { isolationLevel: 'ReadCommitted' },
        () => Promise.resolve(undefined),
      ),
    ).rejects.toThrow('does not support transaction isolation level');
  });

  it('validates identifiers before building SQL', () => {
    expect(() => validatePrismaIdentifier('cap_publish')).not.toThrow();
    expect(() => validatePrismaIdentifier('cap-publish')).toThrow(
      'Invalid Prisma storage identifier',
    );
    expect(() => validatePrismaIdentifier('cap_publish; DROP TABLE x')).toThrow(
      'Invalid Prisma storage identifier',
    );
  });

  it('keeps framework imports isolated from package root source', () => {
    const source = readSourceFiles(join(__dirname), new Set(['nest']));
    const frameworkImport = new RegExp(`\\bfrom ['"]${'ex'}${'press'}['"]`);
    expect(source).not.toMatch(/@nestjs\//);
    expect(source).not.toMatch(frameworkImport);
  });
});

describe('initializePrismaCapStorage', () => {
  it('supports custom table names and repeat initialization', async () => {
    const env = await createPrismaTestStorage();
    try {
      await initializePrismaCapStorage(env.capClient, {
        provider: 'sqlite',
        publishTableName: 'custom_publish',
        receivedTableName: 'custom_received',
      });
      await initializePrismaCapStorage(env.capClient, {
        provider: 'sqlite',
        publishTableName: 'custom_publish',
        receivedTableName: 'custom_received',
      });

      const tables = await env.client.$queryRawUnsafe<Array<{ name: string }>>(
        "SELECT name FROM sqlite_master WHERE type = 'table'",
      );
      expect(tables.map((row) => row.name)).toEqual(
        expect.arrayContaining(['custom_publish', 'custom_received']),
      );
    } finally {
      await env.cleanup();
    }
  });
});

function publishEvent(id: string): CapPublishEvent<JsonValue> {
  return createPublishFixture({
    id: `prisma-publish-${id}`,
    topic: 'prisma.publish',
    payload: { id },
    headers: { 'x-storage': 'prisma' },
  });
}

function receivedEvent(
  id: string,
  overrides: Partial<CapReceivedEvent<JsonValue>> = {},
): CapReceivedEvent<JsonValue> {
  return {
    ...createReceivedFixture({
      id: `prisma-received-${id}`,
      topic: 'prisma.received',
      group: 'prisma-group',
      messageId: `message-${id}`,
      payload: { id },
      headers: { 'x-storage': 'prisma' },
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
