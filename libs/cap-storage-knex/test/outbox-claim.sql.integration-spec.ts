import { randomUUID } from 'node:crypto';
import knexFactory, { type Knex } from 'knex';
import type { StartedTestContainer } from 'testcontainers';
import type { CapPublishEvent, CapReceivedEvent } from '@mikara89/cap-core';
import { createReceivedFixture } from '@mikara89/cap-testing';
import { KnexPublishStorage } from '../src/knex-publish-storage';
import { KnexReceivedStorage } from '../src/knex-received-storage';

jest.mock('archiver', () => ({ __esModule: true, default: jest.fn() }), {
  virtual: true,
});
jest.setTimeout(120000);

interface StartedDatabase {
  container: StartedTestContainer;
  config: Knex.Config;
}

interface ProviderFixture {
  name: string;
  start: () => Promise<StartedDatabase>;
}

async function startPostgres(): Promise<StartedDatabase> {
  const { GenericContainer, Wait } = await import('testcontainers');
  const username = 'test';
  const password = 'test';
  const database = 'test';
  const container = await new GenericContainer('postgres:16-alpine')
    .withEnvironment({
      POSTGRES_USER: username,
      POSTGRES_PASSWORD: password,
      POSTGRES_DB: database,
    })
    .withExposedPorts(5432)
    .withWaitStrategy(
      Wait.forLogMessage('database system is ready to accept connections', 2),
    )
    .start();

  return {
    container,
    config: {
      client: 'pg',
      connection: {
        host: container.getHost(),
        port: container.getMappedPort(5432),
        user: username,
        password,
        database,
      },
    },
  };
}

async function startMySql(): Promise<StartedDatabase> {
  const { GenericContainer, Wait } = await import('testcontainers');
  const username = 'test';
  const password = 'test';
  const database = 'test';
  const container = await new GenericContainer('mysql:8.4')
    .withEnvironment({
      MYSQL_ROOT_PASSWORD: 'root',
      MYSQL_USER: username,
      MYSQL_PASSWORD: password,
      MYSQL_DATABASE: database,
    })
    .withExposedPorts(3306)
    .withWaitStrategy(
      Wait.forSuccessfulCommand(
        `mysqladmin ping -h 127.0.0.1 -u${username} -p${password} --silent`,
      ),
    )
    .start();

  return {
    container,
    config: {
      client: 'mysql2',
      connection: {
        host: container.getHost(),
        port: container.getMappedPort(3306),
        user: username,
        password,
        database,
      },
    },
  };
}

const providers: ProviderFixture[] = [
  { name: 'PostgreSQL', start: startPostgres },
  { name: 'MySQL', start: startMySql },
];

describe.each(providers)('Knex storage $name integration', (provider) => {
  let database: StartedDatabase | undefined;
  let setupKnex: Knex | undefined;
  let workerKnex: Knex | undefined;
  let verifyKnex: Knex | undefined;

  beforeAll(async () => {
    database = await provider.start();
    setupKnex = knexFactory(database.config);
    workerKnex = knexFactory(database.config);
    verifyKnex = knexFactory(database.config);

    await new KnexPublishStorage(setupKnex).initialize({ createSchema: true });
  });

  beforeEach(async () => {
    await setupKnex!('cap_received').del();
    await setupKnex!('cap_publish').del();
  });

  afterAll(async () => {
    await verifyKnex?.destroy();
    await workerKnex?.destroy();
    await setupKnex?.destroy();
    await database?.container.stop();
  });

  it('initializes the outbox and inbox schema', async () => {
    await expect(setupKnex!.schema.hasTable('cap_publish')).resolves.toBe(true);
    await expect(setupKnex!.schema.hasTable('cap_received')).resolves.toBe(
      true,
    );

    await expect(
      new KnexReceivedStorage(setupKnex!).initialize({ createSchema: true }),
    ).resolves.toBeUndefined();
  });

  it('claims outbox rows concurrently without duplicate claims', async () => {
    const firstWorker = new KnexPublishStorage(setupKnex!);
    const secondWorker = new KnexPublishStorage(workerKnex!);
    const now = new Date();
    const events = await seedEvents(firstWorker, 8, now);

    const [firstClaim, secondClaim] = await Promise.all([
      firstWorker.claimUnpublished(claimOptions('knex-worker-1', now, 4)),
      secondWorker.claimUnpublished(claimOptions('knex-worker-2', now, 4)),
    ]);
    const concurrentIds = [...firstClaim, ...secondClaim].map(
      (event) => event.id,
    );

    expect(concurrentIds.length).toBeGreaterThanOrEqual(4);
    expect(new Set(concurrentIds).size).toBe(concurrentIds.length);

    const remainingClaim = await firstWorker.claimUnpublished(
      claimOptions('knex-drain-worker', now, 8),
    );
    const allClaimedIds = [
      ...concurrentIds,
      ...remainingClaim.map(({ id }) => id),
    ];

    expect(new Set(allClaimedIds).size).toBe(8);
    expect(allClaimedIds.sort()).toEqual(
      events.map((event) => event.id).sort(),
    );
  });

  it('reports capabilities that match tested dialect behavior', async () => {
    const setupStorage = new KnexPublishStorage(setupKnex!);
    const workerStorage = new KnexPublishStorage(workerKnex!);
    expect(setupStorage.getCapabilities()).toEqual({
      transactions: true,
      skipLockedClaiming: true,
      advisoryLocks: false,
      atomicInsertIgnore: false,
      nestedTransactions: false,
      isolationLevels: ['read committed', 'repeatable read', 'serializable'],
      claimOwnershipFencing: true,
      claimLeaseRenewal: true,
    });

    const now = new Date();
    const events = await seedEvents(setupStorage, 8, now);
    const lockedIds = events.slice(0, 5).map((event) => event.id);
    const release = deferred<void>();
    const locked = deferred<void>();
    const lockTransaction = setupKnex!.transaction(async (tx) => {
      await tx('cap_publish').whereIn('id', lockedIds).forUpdate();
      locked.resolve();
      await release.promise;
    });

    await locked.promise;
    try {
      const claimed = await workerStorage.claimUnpublished(
        claimOptions('knex-skip-locked-worker', now, 5),
      );

      expect(claimed).toHaveLength(3);
      expect(claimed.map((event) => event.id).sort()).toEqual(
        events
          .slice(5)
          .map((event) => event.id)
          .sort(),
      );
    } finally {
      release.resolve();
      await lockTransaction;
    }
  });

  it('renews active leases and fences stale owners', async () => {
    const workerA = new KnexPublishStorage(setupKnex!);
    const workerB = new KnexPublishStorage(workerKnex!);
    const now = new Date('2026-07-12T10:00:00.000Z');
    const oldExpiry = new Date(now.getTime() + 1_000);
    const renewedExpiry = new Date(now.getTime() + 10_000);
    const reclaimed = publishEvent(50, now);
    await workerA.savePublish(reclaimed);

    await workerA.claimUnpublished({
      limit: 1,
      lockedBy: 'knex-old-owner',
      lockUntil: oldExpiry,
      now,
    });
    await workerB.releaseExpiredClaims(new Date(oldExpiry.getTime() + 1));
    await workerB.claimUnpublished({
      limit: 1,
      lockedBy: 'knex-new-owner',
      lockUntil: renewedExpiry,
      now: new Date(oldExpiry.getTime() + 1),
    });
    await expect(
      workerA.markPublished(reclaimed.id, new Date(), {
        expectedLockedBy: 'knex-old-owner',
      }),
    ).resolves.toBe(false);
    await expect(
      workerA.markPublishFailed(reclaimed.id, 'stale', {
        maxRetries: 3,
        nextRetryAt: renewedExpiry,
        now,
        expectedLockedBy: 'knex-old-owner',
      }),
    ).resolves.toBe(false);
    await expect(workerB.findPublishById(reclaimed.id)).resolves.toMatchObject({
      status: 'processing',
      retryCount: 0,
      lockedBy: 'knex-new-owner',
      lockedUntil: renewedExpiry,
    });
    await expect(
      workerB.markPublished(reclaimed.id, new Date(), {
        expectedLockedBy: 'knex-new-owner',
      }),
    ).resolves.toBe(true);

    const renewed = publishEvent(51, new Date(now.getTime() + 1));
    await workerA.savePublish(renewed);
    await workerA.claimUnpublished({
      limit: 1,
      lockedBy: 'knex-renewing-owner',
      lockUntil: oldExpiry,
      now,
    });
    await expect(
      workerA.renewPublishClaim({
        id: renewed.id,
        expectedLockedBy: 'knex-renewing-owner',
        lockUntil: renewedExpiry,
        now: new Date(now.getTime() + 500),
      }),
    ).resolves.toBe(true);
    await workerB.releaseExpiredClaims(new Date(oldExpiry.getTime() + 1));
    await expect(
      workerB.claimUnpublished({
        limit: 1,
        lockedBy: 'knex-contender',
        lockUntil: renewedExpiry,
        now: new Date(oldExpiry.getTime() + 1),
      }),
    ).resolves.toEqual([]);
    await expect(
      workerA.markPublished(renewed.id, new Date(), {
        expectedLockedBy: 'knex-renewing-owner',
      }),
    ).resolves.toBe(true);
  });

  it('preserves the retry threshold across consecutive owned failures', async () => {
    const workerA = new KnexPublishStorage(setupKnex!);
    const workerB = new KnexPublishStorage(workerKnex!);
    const firstNow = new Date('2026-07-12T11:01:00.000Z');
    const firstRetryAt = new Date('2026-07-12T11:02:00.000Z');
    const event: CapPublishEvent = {
      ...publishEvent(60, new Date('2026-07-12T11:00:00.000Z')),
      status: 'processing',
      retryCount: 1,
      lockedBy: 'knex-boundary-owner-1',
      lockedUntil: new Date('2026-07-12T11:05:00.000Z'),
    };
    await workerA.savePublish(event);

    await expect(
      workerA.markPublishFailed(event.id, 'second failure', {
        maxRetries: 3,
        nextRetryAt: firstRetryAt,
        now: firstNow,
        expectedLockedBy: 'knex-boundary-owner-1',
      }),
    ).resolves.toBe(true);
    await expect(workerA.findPublishById(event.id)).resolves.toMatchObject({
      status: 'failed',
      retryCount: 2,
      nextRetryAt: firstRetryAt,
    });

    const secondNow = new Date('2026-07-12T11:03:00.000Z');
    const [reclaimed] = await workerB.claimUnpublished({
      limit: 1,
      lockedBy: 'knex-boundary-owner-2',
      lockUntil: new Date('2026-07-12T11:06:00.000Z'),
      now: secondNow,
    });
    expect(reclaimed?.id).toBe(event.id);
    await expect(
      workerB.markPublishFailed(event.id, 'third failure', {
        maxRetries: 3,
        nextRetryAt: new Date('2026-07-12T11:04:00.000Z'),
        now: secondNow,
        expectedLockedBy: 'knex-boundary-owner-2',
      }),
    ).resolves.toBe(true);
    await expect(workerB.findPublishById(event.id)).resolves.toMatchObject({
      status: 'dead_letter',
      retryCount: 3,
      nextRetryAt: null,
    });
  });

  it('atomically dedupes concurrent inbox inserts', async () => {
    const firstWorker = new KnexReceivedStorage(setupKnex!);
    const secondWorker = new KnexReceivedStorage(workerKnex!);
    const inbox = receivedEvent(provider.name, 'knex-shared-group');
    const duplicate = {
      ...inbox,
      id: randomUUID(),
      messageId: randomUUID(),
    };

    const results = await Promise.all([
      firstWorker.trySaveReceived(inbox),
      secondWorker.trySaveReceived(duplicate),
    ]);
    const inserted = results.find((result) => result.inserted);

    expect(results.filter((result) => result.inserted)).toHaveLength(1);
    expect(inserted).toBeDefined();
    expect(new Set(results.map((result) => result.id))).toEqual(
      new Set([inserted!.id]),
    );
    await expect(
      setupKnex!('cap_received').count({ count: '*' }),
    ).resolves.toEqual([{ count: provider.name === 'PostgreSQL' ? '1' : 1 }]);
  });

  it('allows the same dedupe key in different groups', async () => {
    const storage = new KnexReceivedStorage(setupKnex!);
    const first = receivedEvent(provider.name, 'knex-group-1');
    const second = {
      ...first,
      id: randomUUID(),
      group: 'knex-group-2',
      messageId: randomUUID(),
    };

    await expect(storage.trySaveReceived(first)).resolves.toMatchObject({
      inserted: true,
      id: first.id,
    });
    await expect(storage.trySaveReceived(second)).resolves.toMatchObject({
      inserted: true,
      id: second.id,
    });
  });

  it('publishes inside a committed transaction', async () => {
    const storage = new KnexPublishStorage(setupKnex!);
    const event = publishEvent(1, new Date());

    await setupKnex!.transaction(async (tx) => {
      await storage.savePublish(event, { tx });
    });

    await expect(storage.findPublishById(event.id)).resolves.toMatchObject({
      id: event.id,
      topic: event.topic,
    });
  });

  it('removes a transactional outbox row on rollback', async () => {
    const storage = new KnexPublishStorage(setupKnex!);
    const event = publishEvent(2, new Date());

    await expect(
      setupKnex!.transaction(async (tx) => {
        await storage.savePublish(event, { tx });
        throw new Error('rollback');
      }),
    ).rejects.toThrow('rollback');
    await expect(storage.findPublishById(event.id)).resolves.toBeUndefined();
  });

  it('releases expired claims so they can be claimed again', async () => {
    const storage = new KnexPublishStorage(setupKnex!);
    const now = new Date();
    const event: CapPublishEvent = {
      ...publishEvent(3, new Date(now.getTime() - 60_000)),
      status: 'processing',
      lockedBy: 'expired-worker',
      lockedUntil: new Date(now.getTime() - 1_000),
    };
    await storage.savePublish(event);

    await storage.releaseExpiredClaims(now);
    await expect(storage.findPublishById(event.id)).resolves.toMatchObject({
      status: 'failed',
      lockedBy: null,
      lockedUntil: null,
    });

    const claimed = await storage.claimUnpublished(
      claimOptions('replacement-worker', now, 1),
    );
    expect(claimed).toHaveLength(1);
    expect(claimed[0]).toMatchObject({
      id: event.id,
      status: 'processing',
      lockedBy: 'replacement-worker',
    });
  });
});

async function seedEvents(
  storage: KnexPublishStorage,
  count: number,
  occurredAt: Date,
): Promise<CapPublishEvent[]> {
  return Promise.all(
    Array.from({ length: count }, async (_, index) => {
      const event = publishEvent(index, new Date(occurredAt.getTime() + index));
      await storage.savePublish(event);
      return event;
    }),
  );
}

function claimOptions(lockedBy: string, now: Date, limit: number) {
  return {
    limit,
    lockedBy,
    lockUntil: new Date(now.getTime() + 60_000),
    now,
  };
}

function publishEvent(index: number, occurredAt: Date): CapPublishEvent {
  return {
    id: randomUUID(),
    topic: 'knex.claim.concurrent',
    occurredAt: occurredAt.toISOString(),
    payload: { index },
    headers: { source: 'knex-sql-claim-test' },
    retryCount: 0,
    status: 'pending',
  };
}

function receivedEvent(provider: string, group: string): CapReceivedEvent {
  return createReceivedFixture({
    id: randomUUID(),
    topic: 'knex.received.integration',
    group,
    messageId: randomUUID(),
    dedupeKey: randomUUID(),
    payload: { provider },
  });
}

function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value?: T) => void;
} {
  let resolveDeferred!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((resolve) => {
    resolveDeferred = resolve;
  });
  return {
    promise,
    resolve: (value?: T) => resolveDeferred(value as T),
  };
}
