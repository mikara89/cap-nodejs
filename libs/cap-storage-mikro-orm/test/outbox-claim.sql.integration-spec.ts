import { MikroORM, type EntityManager } from '@mikro-orm/core';
import { type StartedTestContainer } from 'testcontainers';
import { randomUUID } from 'crypto';

import {
  CapPublishEntity,
  CapReceivedEntity,
} from '@mikara89/cap-storage-mikro-orm';
import { type CapPublishEvent } from '@mikara89/cap-core';
import { createReceivedFixture } from '@mikara89/cap-testing';
import { MikroPublishStorage } from '../src/storage/mikro-publish-storage';
import { MikroReceivedStorage } from '../src/storage/mikro-received-storage';

jest.mock('archiver', () => ({ __esModule: true, default: jest.fn() }), {
  virtual: true,
});
jest.setTimeout(120000);

type Deferred<T = void> = {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
};

function deferred<T = void>(): Deferred<T> {
  let resolve!: Deferred<T>['resolve'];
  let reject!: Deferred<T>['reject'];
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string,
  onTimeout?: () => void,
): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      onTimeout?.();
      reject(new Error(message));
    }, ms);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function startPostgres(): Promise<{
  container: StartedTestContainer;
  clientUrl: string;
}> {
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
    clientUrl: `postgresql://${username}:${password}@${container.getHost()}:${container.getMappedPort(5432)}/${database}`,
  };
}

async function startMySql(): Promise<{
  container: StartedTestContainer;
  clientUrl: string;
}> {
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
    clientUrl: `mysql://${username}:${password}@${container.getHost()}:${container.getMappedPort(3306)}/${database}`,
  };
}

function loadDriver(packageName: '@mikro-orm/postgresql' | '@mikro-orm/mysql') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const driverModule = require(packageName);
  if (packageName === '@mikro-orm/postgresql') {
    return (
      driverModule?.PostgreSqlDriver ?? driverModule?.default ?? driverModule
    );
  }
  return driverModule?.MySqlDriver ?? driverModule?.default ?? driverModule;
}

async function createOrm(
  clientUrl: string,
  driverPackage: '@mikro-orm/postgresql' | '@mikro-orm/mysql',
): Promise<MikroORM> {
  return await MikroORM.init({
    driver: loadDriver(driverPackage),
    clientUrl,
    entities: [CapPublishEntity, CapReceivedEntity],
    allowGlobalContext: true,
  });
}

function pauseAfterFirstFlush(em: EntityManager): {
  paused: Promise<void>;
  release: () => void;
  restore: () => void;
} {
  const paused = deferred();
  const release = deferred();
  const originalTransactional = (
    em as unknown as {
      transactional: EntityManager['transactional'];
    }
  ).transactional.bind(em);

  (
    em as unknown as {
      transactional: EntityManager['transactional'];
    }
  ).transactional = (async (cb: unknown, ...args: unknown[]) => {
    return await originalTransactional(
      async (txEm: EntityManager) => {
        const originalFlush = txEm.flush.bind(txEm);
        let hasPaused = false;

        txEm.flush = async () => {
          await originalFlush();
          if (!hasPaused) {
            hasPaused = true;
            paused.resolve();
            await release.promise;
          }
        };

        return await (cb as (em: EntityManager) => Promise<unknown>)(txEm);
      },
      ...(args as []),
    );
  }) as EntityManager['transactional'];

  return {
    paused: paused.promise,
    release: () => release.resolve(),
    restore: () => {
      (
        em as unknown as {
          transactional: EntityManager['transactional'];
        }
      ).transactional = originalTransactional;
    },
  };
}

function publishEvent(index: number, occurredAt: Date): CapPublishEvent {
  return {
    id: randomUUID(),
    topic: 'claim.concurrent',
    occurredAt: occurredAt.toISOString(),
    payload: { index },
    headers: { source: 'sql-claim-test' },
    retryCount: 0,
    status: 'pending',
  };
}

const providers = [
  {
    name: 'PostgreSQL',
    driverPackage: '@mikro-orm/postgresql' as const,
    start: startPostgres,
    expectedSecondClaimCount: 3,
    expectedPendingCount: 0,
  },
  {
    name: 'MySQL',
    driverPackage: '@mikro-orm/mysql' as const,
    start: startMySql,
    expectedSecondClaimCount: 0,
    expectedPendingCount: 3,
  },
];

describe.each(providers)(
  'MikroPublishStorage $name claim concurrency',
  (provider) => {
    let container: StartedTestContainer | undefined;
    let setupOrm: MikroORM | undefined;
    let workerOrmA: MikroORM | undefined;
    let workerOrmB: MikroORM | undefined;
    let verifyOrm: MikroORM | undefined;

    beforeAll(async () => {
      const started = await provider.start();
      container = started.container;
      setupOrm = await createOrm(started.clientUrl, provider.driverPackage);
      workerOrmA = await createOrm(started.clientUrl, provider.driverPackage);
      workerOrmB = await createOrm(started.clientUrl, provider.driverPackage);
      verifyOrm = await createOrm(started.clientUrl, provider.driverPackage);

      await setupOrm.getSchemaGenerator().createSchema();
    });

    afterAll(async () => {
      await verifyOrm?.close(true);
      await workerOrmB?.close(true);
      await workerOrmA?.close(true);
      await setupOrm?.close(true);
      await container?.stop();
    });

    it('selects due failed and stale pending inbox rows as one limited recovery batch', async () => {
      const storage = new MikroReceivedStorage(setupOrm!.em.fork());
      const now = new Date('2026-07-19T12:00:00.000Z');
      const pendingBefore = new Date('2026-07-19T11:56:00.000Z');
      const makeEvent = (
        overrides: Partial<ReturnType<typeof createReceivedFixture>> = {},
      ) => ({
        ...createReceivedFixture({
          id: randomUUID(),
          topic: 'mikro.recovery.integration',
          group: 'mikro-recovery',
          messageId: randomUUID(),
          dedupeKey: randomUUID(),
        }),
        ...overrides,
      });
      const due = makeEvent({
        status: 'failed',
        retryCount: 1,
        nextRetry: new Date('2026-07-19T11:55:00.000Z'),
      });
      const stale = makeEvent({ occurredAt: '2026-07-19T11:55:00.000Z' });
      const recent = makeEvent({ occurredAt: '2026-07-19T11:56:01.000Z' });
      const terminal = makeEvent({ status: 'dead_letter', retryCount: 3 });
      await Promise.all(
        [due, stale, recent, terminal].map((event) =>
          storage.trySaveReceived(event),
        ),
      );

      const recovered = await storage.getRetryDue(2, now, pendingBefore);

      expect(new Set(recovered.map((event) => event.id))).toEqual(
        new Set([due.id, stale.id]),
      );
    });

    it('does not let two workers claim the same outbox row while locks overlap', async () => {
      expect(setupOrm).toBeDefined();
      expect(workerOrmA).toBeDefined();
      expect(workerOrmB).toBeDefined();
      expect(verifyOrm).toBeDefined();

      const setupStorage = new MikroPublishStorage(setupOrm!.em.fork());
      const baseTime = Date.now();
      const seededEvents = await Promise.all(
        Array.from({ length: 8 }, async (_, index) => {
          const event = publishEvent(index, new Date(baseTime + index));
          await setupStorage.savePublish(event);
          return event;
        }),
      );

      const workerAEm = workerOrmA!.em.fork();
      const workerBEm = workerOrmB!.em.fork();
      const workerA = new MikroPublishStorage(workerAEm);
      const workerB = new MikroPublishStorage(workerBEm);
      const barrier = pauseAfterFirstFlush(workerAEm);
      const now = new Date(baseTime + 60_000);

      const claimA = workerA.claimUnpublished({
        limit: 5,
        lockedBy: 'worker-a',
        lockUntil: new Date(baseTime + 90_000),
        now,
      });

      await withTimeout(
        barrier.paused,
        5_000,
        'worker-a did not reach the lock-holding barrier',
        barrier.release,
      );

      const claimB = workerB.claimUnpublished({
        limit: 5,
        lockedBy: 'worker-b',
        lockUntil: new Date(baseTime + 120_000),
        now,
      });

      let claimedB: CapPublishEvent[];
      try {
        claimedB = await withTimeout(
          claimB,
          5_000,
          'worker-b blocked instead of skipping worker-a locked rows',
          barrier.release,
        );
      } finally {
        barrier.release();
      }

      const claimedA = await claimA;
      barrier.restore();

      const idsA = new Set(claimedA.map((event) => event.id));
      const idsB = new Set(claimedB.map((event) => event.id));
      const overlap = [...idsA].filter((id) => idsB.has(id));

      expect(claimedA).toHaveLength(5);
      expect(claimedB).toHaveLength(provider.expectedSecondClaimCount);
      expect(overlap).toEqual([]);
      expect(new Set([...idsA, ...idsB]).size).toBe(
        claimedA.length + claimedB.length,
      );

      verifyOrm!.em.clear();
      const rows = await verifyOrm!.em.find(CapPublishEntity, {
        id: { $in: seededEvents.map((event) => event.id) },
      });

      expect(rows).toHaveLength(seededEvents.length);
      expect(rows.filter((row) => row.status === 'pending')).toHaveLength(
        provider.expectedPendingCount,
      );
      expect(rows.filter((row) => row.lockedBy === 'worker-a')).toHaveLength(5);
      expect(rows.filter((row) => row.lockedBy === 'worker-b')).toHaveLength(
        provider.expectedSecondClaimCount,
      );
      expect(
        rows
          .filter((row) => row.status === 'processing')
          .every((row) => row.lockedUntil instanceof Date),
      ).toBe(true);
    });

    it('renews active leases and fences stale owners', async () => {
      await setupOrm!.em.nativeDelete(CapPublishEntity, {});
      const workerA = new MikroPublishStorage(workerOrmA!.em.fork());
      const workerB = new MikroPublishStorage(workerOrmB!.em.fork());
      const now = new Date('2026-07-12T10:00:00.000Z');
      const oldExpiry = new Date(now.getTime() + 1_000);
      const renewedExpiry = new Date(now.getTime() + 10_000);
      const reclaimed = publishEvent(200, now);
      await workerA.savePublish(reclaimed);

      await workerA.claimUnpublished({
        limit: 1,
        lockedBy: 'mikro-old-owner',
        lockUntil: oldExpiry,
        now,
      });
      await workerB.releaseExpiredClaims(new Date(oldExpiry.getTime() + 1));
      await workerB.claimUnpublished({
        limit: 1,
        lockedBy: 'mikro-new-owner',
        lockUntil: renewedExpiry,
        now: new Date(oldExpiry.getTime() + 1),
      });
      await expect(
        workerA.markPublished(reclaimed.id, new Date(), {
          expectedLockedBy: 'mikro-old-owner',
        }),
      ).resolves.toBe(false);
      await expect(
        workerA.markPublishFailed(reclaimed.id, 'stale', {
          maxRetries: 3,
          nextRetryAt: renewedExpiry,
          now,
          expectedLockedBy: 'mikro-old-owner',
        }),
      ).resolves.toBe(false);
      await expect(
        workerB.findPublishById(reclaimed.id),
      ).resolves.toMatchObject({
        status: 'processing',
        retryCount: 0,
        lockedBy: 'mikro-new-owner',
        lockedUntil: renewedExpiry,
      });
      await expect(
        workerB.markPublished(reclaimed.id, new Date(), {
          expectedLockedBy: 'mikro-new-owner',
        }),
      ).resolves.toBe(true);

      const renewed = publishEvent(201, new Date(now.getTime() + 1));
      await workerA.savePublish(renewed);
      await workerA.claimUnpublished({
        limit: 1,
        lockedBy: 'mikro-renewing-owner',
        lockUntil: oldExpiry,
        now,
      });
      await expect(
        workerA.renewPublishClaim({
          id: renewed.id,
          expectedLockedBy: 'mikro-renewing-owner',
          lockUntil: renewedExpiry,
          now: new Date(now.getTime() + 500),
        }),
      ).resolves.toBe(true);
      await workerB.releaseExpiredClaims(new Date(oldExpiry.getTime() + 1));
      await expect(
        workerB.claimUnpublished({
          limit: 1,
          lockedBy: 'mikro-contender',
          lockUntil: renewedExpiry,
          now: new Date(oldExpiry.getTime() + 1),
        }),
      ).resolves.toEqual([]);
      await expect(
        workerA.markPublished(renewed.id, new Date(), {
          expectedLockedBy: 'mikro-renewing-owner',
        }),
      ).resolves.toBe(true);
    });

    it('preserves the retry threshold across consecutive owned failures', async () => {
      await setupOrm!.em.nativeDelete(CapPublishEntity, {});
      const workerA = new MikroPublishStorage(workerOrmA!.em.fork());
      const workerB = new MikroPublishStorage(workerOrmB!.em.fork());
      const firstNow = new Date('2026-07-12T11:01:00.000Z');
      const firstRetryAt = new Date('2026-07-12T11:02:00.000Z');
      const event: CapPublishEvent = {
        ...publishEvent(300, new Date('2026-07-12T11:00:00.000Z')),
        status: 'processing',
        retryCount: 1,
        lockedBy: 'mikro-boundary-owner-1',
        lockedUntil: new Date('2026-07-12T11:05:00.000Z'),
      };
      await workerA.savePublish(event);

      await expect(
        workerA.markPublishFailed(event.id, 'second failure', {
          maxRetries: 3,
          nextRetryAt: firstRetryAt,
          now: firstNow,
          expectedLockedBy: 'mikro-boundary-owner-1',
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
        lockedBy: 'mikro-boundary-owner-2',
        lockUntil: new Date('2026-07-12T11:06:00.000Z'),
        now: secondNow,
      });
      expect(reclaimed?.id).toBe(event.id);
      await expect(
        workerB.markPublishFailed(event.id, 'third failure', {
          maxRetries: 3,
          nextRetryAt: new Date('2026-07-12T11:04:00.000Z'),
          now: secondNow,
          expectedLockedBy: 'mikro-boundary-owner-2',
        }),
      ).resolves.toBe(true);
      await expect(workerB.findPublishById(event.id)).resolves.toMatchObject({
        status: 'dead_letter',
        retryCount: 3,
        nextRetryAt: null,
      });
    });
  },
);
