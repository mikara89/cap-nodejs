import { randomUUID } from 'node:crypto';
import { DataSource, type DataSourceOptions } from 'typeorm';
import { type StartedTestContainer } from 'testcontainers';
import { type CapPublishEvent } from '@mikara89/cap-core';
import { createReceivedFixture } from '@mikara89/cap-testing';
import { createTypeOrmCapSchema } from '../src/typeorm-cap-schema';
import { TypeOrmPublishStorage } from '../src/typeorm-publish-storage';
import { TypeOrmReceivedStorage } from '../src/typeorm-received-storage';

jest.mock('archiver', () => ({ __esModule: true, default: jest.fn() }), {
  virtual: true,
});
jest.setTimeout(120000);

async function startPostgres(): Promise<{
  container: StartedTestContainer;
  options: DataSourceOptions;
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
    options: {
      type: 'postgres',
      host: container.getHost(),
      port: container.getMappedPort(5432),
      username,
      password,
      database,
      entities: [],
      synchronize: false,
    },
  };
}

async function startMySql(): Promise<{
  container: StartedTestContainer;
  options: DataSourceOptions;
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
    options: {
      type: 'mysql',
      host: container.getHost(),
      port: container.getMappedPort(3306),
      username,
      password,
      database,
      entities: [],
      synchronize: false,
    },
  };
}

async function createDataSource(
  options: DataSourceOptions,
): Promise<DataSource> {
  const dataSource = new DataSource(options);
  await dataSource.initialize();
  return dataSource;
}

function publishEvent(index: number, occurredAt: Date): CapPublishEvent {
  return {
    id: randomUUID(),
    topic: 'typeorm.claim.concurrent',
    occurredAt: occurredAt.toISOString(),
    payload: { index },
    headers: { source: 'typeorm-sql-claim-test' },
    retryCount: 0,
    status: 'pending',
  };
}

const providers = [
  {
    name: 'PostgreSQL',
    start: startPostgres,
  },
  {
    name: 'MySQL',
    start: startMySql,
  },
];

describe.each(providers)(
  'TypeOrmPublishStorage $name claim concurrency',
  (provider) => {
    let container: StartedTestContainer | undefined;
    let setupDataSource: DataSource | undefined;
    let workerDataSource: DataSource | undefined;
    let verifyDataSource: DataSource | undefined;

    beforeAll(async () => {
      const started = await provider.start();
      container = started.container;
      setupDataSource = await createDataSource(started.options);
      workerDataSource = await createDataSource(started.options);
      verifyDataSource = await createDataSource(started.options);

      await createTypeOrmCapSchema(setupDataSource);
    });

    afterAll(async () => {
      await verifyDataSource?.destroy();
      await workerDataSource?.destroy();
      await setupDataSource?.destroy();
      await container?.stop();
    });

    it('skips rows locked by another transaction while claiming outbox work', async () => {
      expect(setupDataSource).toBeDefined();
      expect(workerDataSource).toBeDefined();
      expect(verifyDataSource).toBeDefined();

      const setupStorage = new TypeOrmPublishStorage(setupDataSource!);
      const workerStorage = new TypeOrmPublishStorage(workerDataSource!);
      const baseTime = Date.now();
      const seededEvents = await Promise.all(
        Array.from({ length: 8 }, async (_, index) => {
          const event = publishEvent(index, new Date(baseTime + index));
          await setupStorage.savePublish(event);
          return event;
        }),
      );

      const lockedIds = seededEvents.slice(0, 5).map((event) => event.id);
      const queryRunner = setupDataSource!.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        await queryRunner.manager
          .createQueryBuilder()
          .select('cap_publish_row.id')
          .from('cap_publish', 'cap_publish_row')
          .where('cap_publish_row.id IN (:...lockedIds)', { lockedIds })
          .orderBy('cap_publish_row.created_at', 'ASC')
          .setLock('pessimistic_write')
          .getRawMany();

        const claimed = await workerStorage.claimUnpublished({
          limit: 5,
          lockedBy: 'typeorm-worker',
          lockUntil: new Date(baseTime + 120_000),
          now: new Date(baseTime + 60_000),
        });

        expect(claimed).toHaveLength(3);
        expect(claimed.map((event) => event.id).sort()).toEqual(
          seededEvents
            .slice(5)
            .map((event) => event.id)
            .sort(),
        );
      } finally {
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
      }

      const rows = await verifyDataSource!.manager
        .createQueryBuilder()
        .select('cap_publish_row.*')
        .from('cap_publish', 'cap_publish_row')
        .where('cap_publish_row.id IN (:...ids)', {
          ids: seededEvents.map((event) => event.id),
        })
        .getRawMany<{ id: string; status: string; locked_by: string | null }>();

      expect(rows.filter((row) => row.status === 'pending')).toHaveLength(5);
      expect(
        rows.filter((row) => row.locked_by === 'typeorm-worker'),
      ).toHaveLength(3);
    });

    it('dedupes inbox rows and rolls back transactional outbox writes', async () => {
      expect(setupDataSource).toBeDefined();

      const publishStorage = new TypeOrmPublishStorage(setupDataSource!);
      const receivedStorage = new TypeOrmReceivedStorage(setupDataSource!);
      const inbox = createReceivedFixture({
        id: randomUUID(),
        topic: 'typeorm.received.integration',
        group: 'typeorm-sql-group',
        messageId: randomUUID(),
        dedupeKey: randomUUID(),
        payload: { provider: provider.name },
      });
      const duplicate = {
        ...inbox,
        id: randomUUID(),
        messageId: randomUUID(),
      };

      await expect(
        receivedStorage.trySaveReceived(inbox),
      ).resolves.toMatchObject({
        inserted: true,
        id: inbox.id,
      });
      await expect(
        receivedStorage.trySaveReceived(duplicate),
      ).resolves.toMatchObject({
        inserted: false,
        id: inbox.id,
      });

      const event = publishEvent(100, new Date());
      await expect(
        setupDataSource!.transaction(async (manager) => {
          await publishStorage.savePublish(event, { tx: manager });
          throw new Error('rollback');
        }),
      ).rejects.toThrow('rollback');

      await expect(
        publishStorage.findPublishById(event.id),
      ).resolves.toBeUndefined();
    });

    it('selects due failed and stale pending inbox rows as one limited recovery batch', async () => {
      const storage = new TypeOrmReceivedStorage(setupDataSource!);
      await setupDataSource!.query('DELETE FROM cap_received');
      const now = new Date('2026-07-19T12:00:00.000Z');
      const pendingBefore = new Date('2026-07-19T11:56:00.000Z');
      const due = {
        ...createReceivedFixture({
          id: randomUUID(),
          topic: 'typeorm.recovery.integration',
          group: 'typeorm-recovery',
          messageId: randomUUID(),
          dedupeKey: randomUUID(),
        }),
        status: 'failed' as const,
        retryCount: 1,
        nextRetry: new Date('2026-07-19T11:55:00.000Z'),
      };
      const stale = createReceivedFixture({
        id: randomUUID(),
        topic: 'typeorm.recovery.integration',
        group: 'typeorm-recovery',
        messageId: randomUUID(),
        dedupeKey: randomUUID(),
        occurredAt: '2026-07-19T11:55:00.000Z',
      });
      const recent = createReceivedFixture({
        id: randomUUID(),
        topic: 'typeorm.recovery.integration',
        group: 'typeorm-recovery',
        messageId: randomUUID(),
        dedupeKey: randomUUID(),
        occurredAt: '2026-07-19T11:56:01.000Z',
      });
      const terminal = {
        ...createReceivedFixture({
          id: randomUUID(),
          topic: 'typeorm.recovery.integration',
          group: 'typeorm-recovery',
          messageId: randomUUID(),
          dedupeKey: randomUUID(),
        }),
        status: 'dead_letter' as const,
        retryCount: 3,
      };
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

    it('requeues durable failed/dead-letter rows and aggregates operational snapshots', async () => {
      await setupDataSource!.query('DELETE FROM cap_publish');
      await setupDataSource!.query('DELETE FROM cap_received');
      const publishStorage = new TypeOrmPublishStorage(setupDataSource!);
      const receivedStorage = new TypeOrmReceivedStorage(setupDataSource!);
      const now = new Date('2026-07-20T12:00:00.000Z');
      const inbox = createReceivedFixture({
        id: randomUUID(),
        messageId: randomUUID(),
        dedupeKey: randomUUID(),
        status: 'dead_letter',
        retryCount: 3,
        occurredAt: '2026-07-20T10:00:00.000Z',
      });
      const terminalInbox = createReceivedFixture({
        id: randomUUID(),
        messageId: randomUUID(),
        dedupeKey: randomUUID(),
        status: 'processed',
        processed: true,
      });
      const outbox = {
        ...publishEvent(300, new Date('2026-07-20T09:00:00.000Z')),
        status: 'dead_letter' as const,
        retryCount: 3,
      };
      const published = {
        ...publishEvent(301, new Date()),
        status: 'published' as const,
      };
      await Promise.all([
        receivedStorage.trySaveReceived(inbox),
        receivedStorage.trySaveReceived(terminalInbox),
        publishStorage.savePublish(outbox),
        publishStorage.savePublish(published),
      ]);

      await expect(
        receivedStorage.requeueReceived(inbox.id, now),
      ).resolves.toMatchObject({ outcome: 'requeued' });
      await expect(
        publishStorage.requeuePublish(outbox.id, now),
      ).resolves.toMatchObject({ outcome: 'requeued' });
      await expect(
        receivedStorage.requeueReceived(terminalInbox.id, now),
      ).resolves.toMatchObject({ outcome: 'not_eligible' });
      await expect(
        publishStorage.requeuePublish(published.id, now),
      ).resolves.toMatchObject({ outcome: 'not_eligible' });
      await expect(receivedStorage.getRetryDue(10, now)).resolves.toEqual(
        expect.arrayContaining([expect.objectContaining({ id: inbox.id })]),
      );
      await expect(
        receivedStorage.getReceivedSnapshot(),
      ).resolves.toMatchObject({
        counts: { failed: 1, processed: 1 },
        oldestFailedAt: new Date('2026-07-20T10:00:00.000Z'),
      });
      await expect(publishStorage.getPublishSnapshot()).resolves.toMatchObject({
        counts: { failed: 1, published: 1 },
        oldestFailedAt: new Date('2026-07-20T09:00:00.000Z'),
      });
      await expect(
        publishStorage.claimUnpublished({
          limit: 10,
          now,
          lockedBy: 'admin-check',
          lockUntil: new Date(now.getTime() + 60_000),
        }),
      ).resolves.toEqual(
        expect.arrayContaining([expect.objectContaining({ id: outbox.id })]),
      );
    });

    it('renews active leases and fences stale owners', async () => {
      await setupDataSource!.query('DELETE FROM cap_publish');
      const workerA = new TypeOrmPublishStorage(setupDataSource!);
      const workerB = new TypeOrmPublishStorage(workerDataSource!);
      const now = new Date('2026-07-12T10:00:00.000Z');
      const oldExpiry = new Date(now.getTime() + 1_000);
      const renewedExpiry = new Date(now.getTime() + 10_000);
      const reclaimed = publishEvent(200, now);
      await workerA.savePublish(reclaimed);

      await workerA.claimUnpublished({
        limit: 1,
        lockedBy: 'typeorm-old-owner',
        lockUntil: oldExpiry,
        now,
      });
      await workerB.releaseExpiredClaims(new Date(oldExpiry.getTime() + 1));
      await workerB.claimUnpublished({
        limit: 1,
        lockedBy: 'typeorm-new-owner',
        lockUntil: renewedExpiry,
        now: new Date(oldExpiry.getTime() + 1),
      });
      await expect(
        workerA.markPublished(reclaimed.id, new Date(), {
          expectedLockedBy: 'typeorm-old-owner',
        }),
      ).resolves.toBe(false);
      await expect(
        workerA.markPublishFailed(reclaimed.id, 'stale', {
          maxRetries: 3,
          nextRetryAt: renewedExpiry,
          now,
          expectedLockedBy: 'typeorm-old-owner',
        }),
      ).resolves.toBe(false);
      await expect(
        workerB.findPublishById(reclaimed.id),
      ).resolves.toMatchObject({
        status: 'processing',
        retryCount: 0,
        lockedBy: 'typeorm-new-owner',
        lockedUntil: renewedExpiry,
      });
      await expect(
        workerB.markPublished(reclaimed.id, new Date(), {
          expectedLockedBy: 'typeorm-new-owner',
        }),
      ).resolves.toBe(true);

      const renewed = publishEvent(201, new Date(now.getTime() + 1));
      await workerA.savePublish(renewed);
      await workerA.claimUnpublished({
        limit: 1,
        lockedBy: 'typeorm-renewing-owner',
        lockUntil: oldExpiry,
        now,
      });
      await expect(
        workerA.renewPublishClaim({
          id: renewed.id,
          expectedLockedBy: 'typeorm-renewing-owner',
          lockUntil: renewedExpiry,
          now: new Date(now.getTime() + 500),
        }),
      ).resolves.toBe(true);
      await workerB.releaseExpiredClaims(new Date(oldExpiry.getTime() + 1));
      await expect(
        workerB.claimUnpublished({
          limit: 1,
          lockedBy: 'typeorm-contender',
          lockUntil: renewedExpiry,
          now: new Date(oldExpiry.getTime() + 1),
        }),
      ).resolves.toEqual([]);
      await expect(
        workerA.markPublished(renewed.id, new Date(), {
          expectedLockedBy: 'typeorm-renewing-owner',
        }),
      ).resolves.toBe(true);
    });

    it('preserves the retry threshold across consecutive owned failures', async () => {
      await setupDataSource!.query('DELETE FROM cap_publish');
      const workerA = new TypeOrmPublishStorage(setupDataSource!);
      const workerB = new TypeOrmPublishStorage(workerDataSource!);
      const firstNow = new Date('2026-07-12T11:01:00.000Z');
      const firstRetryAt = new Date('2026-07-12T11:02:00.000Z');
      const event: CapPublishEvent = {
        ...publishEvent(300, new Date('2026-07-12T11:00:00.000Z')),
        status: 'processing',
        retryCount: 1,
        lockedBy: 'typeorm-boundary-owner-1',
        lockedUntil: new Date('2026-07-12T11:05:00.000Z'),
      };
      await workerA.savePublish(event);

      await expect(
        workerA.markPublishFailed(event.id, 'second failure', {
          maxRetries: 3,
          nextRetryAt: firstRetryAt,
          now: firstNow,
          expectedLockedBy: 'typeorm-boundary-owner-1',
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
        lockedBy: 'typeorm-boundary-owner-2',
        lockUntil: new Date('2026-07-12T11:06:00.000Z'),
        now: secondNow,
      });
      expect(reclaimed?.id).toBe(event.id);
      await expect(
        workerB.markPublishFailed(event.id, 'third failure', {
          maxRetries: 3,
          nextRetryAt: new Date('2026-07-12T11:04:00.000Z'),
          now: secondNow,
          expectedLockedBy: 'typeorm-boundary-owner-2',
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
