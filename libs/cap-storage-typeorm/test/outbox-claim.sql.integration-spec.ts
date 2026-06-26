import { randomUUID } from 'node:crypto';
import { DataSource, type DataSourceOptions } from 'typeorm';
import { type StartedTestContainer } from 'testcontainers';
import { type CapPublishEvent } from '@mikara89/cap-core';
import { createReceivedFixture } from '@mikara89/cap-testing';
import { createTypeOrmCapSchema } from '../src/typeorm-cap-schema';
import { TypeOrmPublishStorage } from '../src/typeorm-publish-storage';
import { TypeOrmReceivedStorage } from '../src/typeorm-received-storage';

jest.mock('archiver', () => ({ __esModule: true, default: jest.fn() }));
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
  },
);
