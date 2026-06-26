import type { Knex } from 'knex';
import {
  type CapPublishEvent,
  type CapReceivedEvent,
  type JsonValue,
} from '@mikara89/cap-core';
import {
  createPublishFixture,
  createReceivedFixture,
} from '@mikara89/cap-testing';
import { type KnexPublishStorage } from './knex-publish-storage';
import { type KnexReceivedStorage } from './knex-received-storage';
import { createKnexCapSchema } from './knex-cap-schema';
import { getKnexStorageCapabilities } from './knex-storage-capabilities';
import { createKnexTestStorage } from './testing/create-knex-test-storage';

describe('Knex storage', () => {
  let knex: Knex;
  let publishStorage: KnexPublishStorage;
  let receivedStorage: KnexReceivedStorage;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    const env = await createKnexTestStorage();
    knex = env.knex;
    publishStorage = env.publishStorage;
    receivedStorage = env.receivedStorage;
    cleanup = env.cleanup;
  });

  afterEach(async () => {
    await cleanup();
  });

  it('creates publish and received schema', async () => {
    await expect(knex.schema.hasTable('cap_publish')).resolves.toBe(true);
    await expect(knex.schema.hasTable('cap_received')).resolves.toBe(true);
  });

  it('persists savePublish(event, { tx }) inside transaction', async () => {
    const event = publishEvent('tx-persist');

    await knex.transaction(async (tx) => {
      await publishStorage.savePublish(event, { tx });
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
      knex.transaction(async (tx) => {
        await publishStorage.savePublish(event, { tx });
        throw new Error('rollback');
      }),
    ).rejects.toThrow('rollback');

    await expect(
      publishStorage.findPublishById(event.id),
    ).resolves.toBeUndefined();
  });

  it('savePublishWithTx delegates to savePublish with ctx', async () => {
    const event = publishEvent('legacy-tx');

    await knex.transaction(async (tx) => {
      await publishStorage.savePublishWithTx(event, tx);
    });

    await expect(
      publishStorage.findPublishById(event.id),
    ).resolves.toMatchObject({
      id: event.id,
      status: 'pending',
    });
  });

  it('dedupes received records by group and dedupeKey', async () => {
    const event = receivedEvent('dedupe');
    const duplicate = receivedEvent('dedupe-duplicate', {
      id: 'knex-received-dedupe-duplicate',
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
    expect(getKnexStorageCapabilities(knex)).toEqual({
      transactions: true,
      skipLockedClaiming: false,
      advisoryLocks: false,
      atomicInsertIgnore: false,
      nestedTransactions: false,
      isolationLevels: [],
    });
  });
});

describe('createKnexCapSchema', () => {
  it('supports custom table names', async () => {
    const env = await createKnexTestStorage();
    try {
      await createKnexCapSchema(env.knex, {
        publishTableName: 'custom_publish',
        receivedTableName: 'custom_received',
      });

      await expect(env.knex.schema.hasTable('custom_publish')).resolves.toBe(
        true,
      );
      await expect(env.knex.schema.hasTable('custom_received')).resolves.toBe(
        true,
      );
    } finally {
      await env.cleanup();
    }
  });
});

function publishEvent(id: string): CapPublishEvent<JsonValue> {
  return createPublishFixture({
    id: `knex-publish-${id}`,
    topic: 'knex.publish',
    payload: { id },
    headers: { 'x-storage': 'knex' },
  });
}

function receivedEvent(
  id: string,
  overrides: Partial<CapReceivedEvent<JsonValue>> = {},
): CapReceivedEvent<JsonValue> {
  return {
    ...createReceivedFixture({
      id: `knex-received-${id}`,
      topic: 'knex.received',
      group: 'knex-group',
      messageId: `message-${id}`,
      payload: { id },
      headers: { 'x-storage': 'knex' },
    }),
    ...overrides,
  };
}
