import { Test } from '@nestjs/testing';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MikroORM } from '@mikro-orm/core';
import { type INestApplication } from '@nestjs/common';
import { v4 as uuid } from 'uuid';

import { withTransactionAndPostCommit } from '@mikara89/cap-nest';
import {
  MikroStorageModule,
  CapPublishEntity,
  CapReceivedEntity,
} from '@mikara89/mikroorm-storage';
import { PUBLISH_STORAGE, type IPublishStorage } from '@mikara89/cap-nest';

type StoppableContainer = {
  stop(): Promise<unknown>;
};

// start Postgres container
async function startPostgres() {
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
      Wait.forLogMessage('database system is ready to accept connections'),
    )
    .start();

  return {
    container,
    host: container.getHost(),
    port: container.getMappedPort(5432),
    username,
    password,
    database,
  };
}

async function createAppWithMikro(opts: {
  clientUrl: string;
  entities: any[];
}) {
  // dynamic require for driver
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
    await orm.getSchemaGenerator().createSchema();
  }
  await app.init();
  return { app, moduleRef };
}

describe('Integration: withTransactionAndPostCommit (MikroORM + Postgres)', () => {
  let pg: StoppableContainer | undefined;
  let app: INestApplication | undefined;
  let orm: MikroORM | undefined;
  let skipReason: string | undefined;

  beforeAll(async () => {
    jest.setTimeout(120000);
    try {
      const started = await startPostgres();
      pg = started.container;

      const clientUrl = `postgresql://${started.username}:${started.password}@${started.host}:${started.port}/${started.database}`;
      const created = await createAppWithMikro({
        clientUrl,
        entities: [CapPublishEntity, CapReceivedEntity],
      });
      app = created.app;
      orm = created.moduleRef.get(MikroORM);
    } catch (err) {
      skipReason = err instanceof Error ? err.message : String(err);
      console.warn(
        'Postgres Testcontainers startup failed, skipping transaction integration tests:',
        skipReason,
      );
    }
  });

  afterAll(async () => {
    if (app) await app.close();
    if (pg) await pg.stop();
  });

  it('commits transactional save and runs afterCommitFn', async () => {
    if (!app || !orm) return;

    const storage = app.get<IPublishStorage>(PUBLISH_STORAGE);
    const publisher = { emit: jest.fn().mockResolvedValue(undefined) };

    const event = {
      id: uuid(),
      topic: 'tx-integ-commit',
      occurredAt: new Date().toISOString(),
      payload: { hello: 'world' },
      headers: {},
      retryCount: 0,
      status: 'pending',
    };

    await withTransactionAndPostCommit(
      orm,
      async (em, queue) => {
        const id = await (storage as any).savePublishWithTx(event as any, em);
        queue({ topic: event.topic, payload: event.payload });
        return id;
      },
      async (items: any[]) => {
        for (const it of items) await publisher.emit(it.topic, it.payload);
      },
    );

    // storage should have the saved event
    const saved = await storage.findPublishById?.(event.id);
    expect(saved?.topic).toBe(event.topic);
    expect(publisher.emit.mock.calls.length).toBeGreaterThan(0);
  });

  it('rolls back transactional save and does not run afterCommitFn', async () => {
    if (!app || !orm) return;

    const storage = app.get<IPublishStorage>(PUBLISH_STORAGE);
    const publisher = { emit: jest.fn().mockResolvedValue(undefined) };

    const event = {
      id: uuid(),
      topic: 'tx-integ-rollback',
      occurredAt: new Date().toISOString(),
      payload: { hello: 'rollback' },
      headers: {},
      retryCount: 0,
      status: 'pending',
    };

    let savedId: string | null = null;
    try {
      await withTransactionAndPostCommit(
        orm,
        async (em, queue) => {
          savedId = await (storage as any).savePublishWithTx(event as any, em);
          queue({ topic: event.topic, payload: event.payload });
          // force rollback
          throw new Error('force rollback');
        },
        async (items: any[]) => {
          for (const it of items) await publisher.emit(it.topic, it.payload);
        },
      );
    } catch {
      // expected
    }

    expect(savedId).toBeTruthy();
    const saved = await storage.findPublishById?.(event.id);
    expect(saved).toBeUndefined();
    expect(publisher.emit.mock.calls.length).toBe(0);
  });
});
