import { Test } from '@nestjs/testing';
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from 'testcontainers';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MikroORM } from '@mikro-orm/core';
import {
  MikroStorageModule,
  CapPublishEntity,
  CapReceivedEntity,
} from '@cap/storage-mikro-orm';
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

  beforeAll(async () => {
    jest.setTimeout(120000);
    const started = await startPostgres();
    pgContainer = started.container;

    const clientUrl = `postgresql://${started.username}:${started.password}@${started.host}:${started.port}/${started.database}`;
    const created = await createAppWithMikro({
      clientUrl,
      entities: [CapPublishEntity, CapReceivedEntity],
    });
    app = created.app;
  });

  afterAll(async () => {
    if (app) await app.close();
    if (pgContainer) await pgContainer.stop();
  });

  it('saves and reads publish events via MikroPublishStorage', async () => {
    const storage = app.get<IPublishStorage>(PUBLISH_STORAGE as any);
    const event = {
      id: uuid(),
      topic: 'int-topic',
      occurredAt: new Date().toISOString(),
      payload: { hello: 'world' },
      headers: { test: '1' },
      retryCount: 0,
    };

    const savedId = await storage.savePublish(event as any);
    expect(savedId).toBeTruthy();

    const unpublished = await storage.getUnpublished(10);
    expect(unpublished.some((e) => e.id === savedId)).toBe(true);
  });
});
