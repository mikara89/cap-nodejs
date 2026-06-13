import { Test } from '@nestjs/testing';
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from 'testcontainers';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MikroORM, Entity, PrimaryKey, Property } from '@mikro-orm/core';
import {
  MikroStorageModule,
  CapPublishEntity,
  CapReceivedEntity,
} from '@cap/mikroorm-storage';
import { PUBLISH_STORAGE, type IPublishStorage } from '@cap/cap-nest';
import { type INestApplication } from '@nestjs/common';
import { v4 as uuid } from 'uuid';

// Helper: start Postgres container and return connection info + container
async function startPostgres() {
  const container: StartedPostgreSqlContainer =
    await new PostgreSqlContainer().start();
  return {
    container,
    host: container.getHost(),
    port: container.getMappedPort(5432),
    username: container.getUsername(),
    password: container.getPassword(),
    database: container.getDatabase(),
  };
}

async function createAppWithMikro(opts: {
  clientUrl: string;
  entities: any[];
}) {
  // require driver package dynamically to avoid ESM/CJS import shape problems
  // the package exports differ across versions; try common shapes
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pgDriverModule = require('@mikro-orm/postgresql');
  const driver =
    pgDriverModule?.PostgreSqlDriver ??
    pgDriverModule?.default ??
    pgDriverModule;

  const moduleRef = await Test.createTestingModule({
    imports: [
      MikroOrmModule.forRoot({
        driver,
        clientUrl: opts.clientUrl,
        entities: opts.entities,
        synchronize: true,
        allowGlobalContext: true,
      } as any),
      MikroStorageModule,
    ],
  }).compile();

  const app = moduleRef.createNestApplication();

  const orm = moduleRef.get(MikroORM);
  if (orm && typeof orm.getSchemaGenerator === 'function') {
    // create schema for test entities
    // this may throw on some driver shapes; allow test to surface errors

    await orm.getSchemaGenerator().createSchema();
  }

  await app.init();
  return { app, moduleRef };
}

describe('Integration: storage-mikro-orm (Postgres via Testcontainers)', () => {
  let pgContainer: StartedPostgreSqlContainer;
  let app: INestApplication;

  // small test-domain entity used to simulate a domain change
  @Entity()
  class TestDomainEntity {
    @PrimaryKey()
    id!: string;

    @Property()
    name!: string;
  }

  beforeAll(async () => {
    jest.setTimeout(120000);
    const started = await startPostgres();
    pgContainer = started.container;

    const clientUrl = `postgresql://${started.username}:${started.password}@${started.host}:${started.port}/${started.database}`;
    const created = await createAppWithMikro({
      clientUrl,
      entities: [CapPublishEntity, CapReceivedEntity, TestDomainEntity],
    });
    app = created.app;
  });

  afterAll(async () => {
    if (app) await app.close();
    if (pgContainer) await pgContainer.stop();
  });

  it('saves and reads publish events via MikroPublishStorage', async () => {
    const storage = app.get<IPublishStorage>(PUBLISH_STORAGE);
    const event = {
      id: uuid(),
      topic: 'int-topic',
      occurredAt: new Date().toISOString(),
      payload: { hello: 'world' },
      headers: { test: '1' },
      retryCount: 0,
    };

    const savedId = await storage.savePublish(event);
    expect(savedId).toBeTruthy();

    const unpublished = await storage.getUnpublished(10);
    expect(unpublished.some((e) => e.id === savedId)).toBe(true);
  });

  it('transactional save commits when transaction succeeds', async () => {
    const storage = app.get<IPublishStorage>(PUBLISH_STORAGE);
    const orm = app.get(MikroORM);

    const event = {
      id: uuid(),
      topic: 'tx-topic-commit',
      occurredAt: new Date().toISOString(),
      payload: { foo: 'bar' },
      headers: {},
      retryCount: 0,
    };

    // run inside a MikroORM transaction and commit
    const savedId = await orm.em.transactional(async (em) => {
      return await (storage as any).savePublishWithTx(event as any, em);
    });

    expect(savedId).toBeTruthy();

    const unpublished = await storage.getUnpublished(10);
    expect(unpublished.some((e) => e.id === savedId)).toBe(true);
  });

  it('transactional save rolls back on error', async () => {
    const storage = app.get<IPublishStorage>(PUBLISH_STORAGE);
    const orm = app.get(MikroORM);

    const event = {
      id: uuid(),
      topic: 'tx-topic-rollback',
      occurredAt: new Date().toISOString(),
      payload: { should: 'rollback' },
      headers: {},
      retryCount: 0,
    };

    let savedId: string | null = null;
    try {
      await orm.em.transactional(async (em) => {
        savedId = await (storage as any).savePublishWithTx(event as any, em);
        // force rollback
        throw new Error('force rollback');
      });
    } catch {
      // expected
    }

    expect(savedId).toBeTruthy();
    const unpublished = await storage.getUnpublished(10);
    // record should NOT be present because transaction rolled back
    expect(unpublished.some((e) => e.id === savedId)).toBe(false);
  });

  it('transactional domain change + outbox commit', async () => {
    const storage = app.get<IPublishStorage>(PUBLISH_STORAGE);
    const orm = app.get(MikroORM);

    const domain = { id: uuid(), name: 'domain-commit' } as any;
    const event = {
      id: uuid(),
      topic: 'tx-domain-commit',
      occurredAt: new Date().toISOString(),
      payload: { ok: true },
      headers: {},
      retryCount: 0,
    };

    const saved = await orm.em.transactional(async (em) => {
      // persist a domain entity inside transaction
      await em.persistAndFlush(em.create(TestDomainEntity, domain));
      // persist outbox inside same transaction
      const id = await (storage as any).savePublishWithTx(event as any, em);
      return id;
    });

    expect(saved).toBeTruthy();

    // verify domain entity and outbox present after commit
    const repo = app.get(MikroORM).em.getRepository('TestDomainEntity' as any);
    const found = await repo.findOne({ id: domain.id });
    expect(found).toBeTruthy();

    const unpublished = await storage.getUnpublished(10);
    expect(unpublished.some((e) => e.id === saved)).toBe(true);
  });

  it('transactional domain change + outbox rollback', async () => {
    const storage = app.get<IPublishStorage>(PUBLISH_STORAGE);
    const orm = app.get(MikroORM);

    const domain = { id: uuid(), name: 'domain-rollback' } as any;
    const event = {
      id: uuid(),
      topic: 'tx-domain-rollback',
      occurredAt: new Date().toISOString(),
      payload: { ok: false },
      headers: {},
      retryCount: 0,
    };

    let savedId: string | null = null;
    try {
      await orm.em.transactional(async (em) => {
        await em.persistAndFlush(em.create(TestDomainEntity, domain));
        savedId = await (storage as any).savePublishWithTx(event as any, em);
        // trigger rollback
        throw new Error('trigger rollback');
      });
    } catch {
      // expected
    }

    expect(savedId).toBeTruthy();

    // domain entity should not exist
    const repo = app.get(MikroORM).em.getRepository('TestDomainEntity' as any);
    const found = await repo.findOne({ id: domain.id });
    expect(found).toBeNull();

    const unpublished = await storage.getUnpublished(10);
    expect(unpublished.some((e) => e.id === savedId)).toBe(false);
  });
});
