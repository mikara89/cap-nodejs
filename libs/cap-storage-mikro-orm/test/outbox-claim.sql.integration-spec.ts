import { MikroORM, type EntityManager } from '@mikro-orm/core';
import { type StartedTestContainer } from 'testcontainers';
import { randomUUID } from 'crypto';

import {
  CapPublishEntity,
  CapReceivedEntity,
} from '@mikara89/cap-storage-mikro-orm';
import { type CapPublishEvent } from '@mikara89/cap-core';
import { MikroPublishStorage } from '../src/storage/mikro-publish-storage';

jest.mock('archiver', () => ({ __esModule: true, default: jest.fn() }));
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
  },
);
