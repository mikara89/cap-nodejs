import { randomUUID } from 'node:crypto';
import type { StartedTestContainer } from 'testcontainers';
import type { CapPublishEvent } from '@mikara89/cap-core';
import { createReceivedFixture } from '@mikara89/cap-testing';
import { PrismaClient as MySqlPrismaClient } from '../prisma/generated/mysql';
import { PrismaClient as PostgreSqlPrismaClient } from '../prisma/generated/postgresql';
import type { PrismaCapClient } from '../src/prisma-cap-client';
import { initializePrismaCapStorage } from '../src/prisma-cap-schema';
import { PrismaPublishStorage } from '../src/prisma-publish-storage';
import { PrismaReceivedStorage } from '../src/prisma-received-storage';
import type { PrismaStorageProvider } from '../src/prisma-storage-options';

jest.mock('archiver', () => ({ __esModule: true, default: jest.fn() }), {
  virtual: true,
});
jest.setTimeout(180000);

interface IntegrationClient extends PrismaCapClient {
  $connect(): Promise<void>;
  $disconnect(): Promise<void>;
}

interface StartedDatabase {
  container: StartedTestContainer;
  url: string;
}

interface ProviderFixture {
  name: string;
  provider: PrismaStorageProvider;
  start: () => Promise<StartedDatabase>;
  createClient: (url: string) => IntegrationClient;
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
    url: `postgresql://${username}:${password}@${container.getHost()}:${container.getMappedPort(
      5432,
    )}/${database}?schema=public`,
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
    url: `mysql://${username}:${password}@${container.getHost()}:${container.getMappedPort(
      3306,
    )}/${database}`,
  };
}

const providers: ProviderFixture[] = [
  {
    name: 'PostgreSQL',
    provider: 'postgresql',
    start: startPostgres,
    createClient: (url) =>
      new PostgreSqlPrismaClient({
        datasourceUrl: url,
      }),
  },
  {
    name: 'MySQL',
    provider: 'mysql',
    start: startMySql,
    createClient: (url) =>
      new MySqlPrismaClient({
        datasourceUrl: url,
      }),
  },
];

describe.each(providers)(
  'PrismaPublishStorage $name claim concurrency',
  (fixture) => {
    let database: StartedDatabase | undefined;
    let setupClient: IntegrationClient | undefined;
    let workerClient: IntegrationClient | undefined;
    let verifyClient: IntegrationClient | undefined;

    beforeAll(async () => {
      database = await fixture.start();
      setupClient = fixture.createClient(database.url);
      workerClient = fixture.createClient(database.url);
      verifyClient = fixture.createClient(database.url);
      await Promise.all([
        setupClient.$connect(),
        workerClient.$connect(),
        verifyClient.$connect(),
      ]);
      await initializePrismaCapStorage(setupClient, {
        provider: fixture.provider,
      });
    });

    afterAll(async () => {
      await verifyClient?.$disconnect();
      await workerClient?.$disconnect();
      await setupClient?.$disconnect();
      await database?.container.stop();
    });

    it('skips externally locked rows while claiming outbox work', async () => {
      expect(setupClient).toBeDefined();
      expect(workerClient).toBeDefined();
      expect(verifyClient).toBeDefined();

      const setupStorage = new PrismaPublishStorage(setupClient!, {
        provider: fixture.provider,
      });
      const workerStorage = new PrismaPublishStorage(workerClient!, {
        provider: fixture.provider,
      });
      const baseTime = Date.now();
      const events = await Promise.all(
        Array.from({ length: 8 }, async (_, index) => {
          const event = publishEvent(index, new Date(baseTime + index));
          await setupStorage.savePublish(event);
          return event;
        }),
      );
      const lockedIds = events.slice(0, 5).map((event) => event.id);
      const locked = deferred<void>();
      const release = deferred<void>();
      const lockTransaction = setupClient!.$transaction(
        async (tx) => {
          for (const id of lockedIds) {
            const placeholder = fixture.provider === 'postgresql' ? '$1' : '?';
            await tx.$queryRawUnsafe(
              `SELECT id FROM cap_publish WHERE id = ${placeholder} FOR UPDATE`,
              id,
            );
          }
          locked.resolve();
          await release.promise;
        },
        { timeout: 30_000 },
      );

      await locked.promise;
      try {
        const claimed = await workerStorage.claimUnpublished({
          limit: 5,
          lockedBy: 'prisma-worker',
          lockUntil: new Date(baseTime + 120_000),
          now: new Date(baseTime + 60_000),
        });

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

      const rows = await verifyClient!.$queryRawUnsafe<
        Array<{ status: string; locked_by: string | null }>
      >('SELECT status, locked_by FROM cap_publish');
      expect(rows.filter((row) => row.status === 'pending')).toHaveLength(5);
      expect(
        rows.filter((row) => row.locked_by === 'prisma-worker'),
      ).toHaveLength(3);
    });

    it('atomically dedupes inbox rows and rolls back outbox writes', async () => {
      expect(setupClient).toBeDefined();
      const publishStorage = new PrismaPublishStorage(setupClient!, {
        provider: fixture.provider,
      });
      const receivedStorage = new PrismaReceivedStorage(setupClient!, {
        provider: fixture.provider,
      });
      const inbox = createReceivedFixture({
        id: randomUUID(),
        topic: 'prisma.received.integration',
        group: 'prisma-sql-group',
        messageId: randomUUID(),
        dedupeKey: randomUUID(),
        payload: { provider: fixture.name },
      });
      const duplicate = {
        ...inbox,
        id: randomUUID(),
        messageId: randomUUID(),
      };

      const results = await Promise.all([
        receivedStorage.trySaveReceived(inbox),
        receivedStorage.trySaveReceived(duplicate),
      ]);
      expect(results.filter((result) => result.inserted)).toHaveLength(1);
      const inserted = results.find((result) => result.inserted);
      expect(inserted).toBeDefined();
      expect(new Set(results.map((result) => result.id))).toEqual(
        new Set([inserted!.id]),
      );

      const event = publishEvent(100, new Date());
      await expect(
        setupClient!.$transaction(async (tx) => {
          await publishStorage.savePublish(event, { tx });
          throw new Error('rollback');
        }),
      ).rejects.toThrow('rollback');
      await expect(
        publishStorage.findPublishById(event.id),
      ).resolves.toBeUndefined();
    });

    it('renews active leases and fences stale owners', async () => {
      await setupClient!.$executeRawUnsafe('DELETE FROM cap_publish');
      const workerA = new PrismaPublishStorage(setupClient!, {
        provider: fixture.provider,
      });
      const workerB = new PrismaPublishStorage(workerClient!, {
        provider: fixture.provider,
      });
      const now = new Date('2026-07-12T10:00:00.000Z');
      const oldExpiry = new Date(now.getTime() + 1_000);
      const renewedExpiry = new Date(now.getTime() + 10_000);
      const reclaimed = publishEvent(200, now);
      await workerA.savePublish(reclaimed);

      await workerA.claimUnpublished({
        limit: 1,
        lockedBy: 'prisma-old-owner',
        lockUntil: oldExpiry,
        now,
      });
      await workerB.releaseExpiredClaims(new Date(oldExpiry.getTime() + 1));
      await workerB.claimUnpublished({
        limit: 1,
        lockedBy: 'prisma-new-owner',
        lockUntil: renewedExpiry,
        now: new Date(oldExpiry.getTime() + 1),
      });
      await expect(
        workerA.markPublished(reclaimed.id, new Date(), {
          expectedLockedBy: 'prisma-old-owner',
        }),
      ).resolves.toBe(false);
      await expect(
        workerA.markPublishFailed(reclaimed.id, 'stale', {
          maxRetries: 3,
          nextRetryAt: renewedExpiry,
          now,
          expectedLockedBy: 'prisma-old-owner',
        }),
      ).resolves.toBe(false);
      await expect(
        workerB.findPublishById(reclaimed.id),
      ).resolves.toMatchObject({
        status: 'processing',
        retryCount: 0,
        lockedBy: 'prisma-new-owner',
        lockedUntil: renewedExpiry,
      });
      await expect(
        workerB.markPublished(reclaimed.id, new Date(), {
          expectedLockedBy: 'prisma-new-owner',
        }),
      ).resolves.toBe(true);

      const renewed = publishEvent(201, new Date(now.getTime() + 1));
      await workerA.savePublish(renewed);
      await workerA.claimUnpublished({
        limit: 1,
        lockedBy: 'prisma-renewing-owner',
        lockUntil: oldExpiry,
        now,
      });
      await expect(
        workerA.renewPublishClaim({
          id: renewed.id,
          expectedLockedBy: 'prisma-renewing-owner',
          lockUntil: renewedExpiry,
          now: new Date(now.getTime() + 500),
        }),
      ).resolves.toBe(true);
      await workerB.releaseExpiredClaims(new Date(oldExpiry.getTime() + 1));
      await expect(
        workerB.claimUnpublished({
          limit: 1,
          lockedBy: 'prisma-contender',
          lockUntil: renewedExpiry,
          now: new Date(oldExpiry.getTime() + 1),
        }),
      ).resolves.toEqual([]);
      await expect(
        workerA.markPublished(renewed.id, new Date(), {
          expectedLockedBy: 'prisma-renewing-owner',
        }),
      ).resolves.toBe(true);
    });
  },
);

function publishEvent(index: number, occurredAt: Date): CapPublishEvent {
  return {
    id: randomUUID(),
    topic: 'prisma.claim.concurrent',
    occurredAt: occurredAt.toISOString(),
    payload: { index },
    headers: { source: 'prisma-sql-claim-test' },
    retryCount: 0,
    status: 'pending',
  };
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
