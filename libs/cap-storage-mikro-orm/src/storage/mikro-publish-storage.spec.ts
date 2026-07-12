import {
  IsolationLevel,
  LockMode,
  MikroORM,
  type EntityManager,
} from '@mikro-orm/core';
import { BetterSqliteDriver } from '@mikro-orm/better-sqlite';
import { MikroPublishStorage } from './mikro-publish-storage';
import { CapPublishEntity } from '../entities/cap-publish.entity';
import {
  CapEngine,
  type CapHeaders,
  type CapPublishEvent,
  type CapReceivedEvent,
  type JsonValue,
  type MarkReceivedFailedOptions,
  type PublisherPort,
  type ReceivedStoragePort,
  type SubscriberPort,
  type SubscribeMetadata,
  type TrySaveReceivedResult,
} from '@mikara89/cap-core';

describe('MikroPublishStorage', () => {
  let storage: MikroPublishStorage;
  let em: MockEntityManager;

  beforeEach(() => {
    const mockEm = createMockEntityManager();
    storage = new MikroPublishStorage(mockEm);
    em = mockEm;
  });

  it('savePublish without ctx uses default EntityManager', async () => {
    const event = publishEvent();

    await storage.savePublish(event);

    expect(em.persistAndFlush).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'test-id',
        topic: 'test-topic',
        payload: { foo: 'bar' },
        headers: { 'x-trace': '123' },
        retryCount: 0,
        status: 'pending',
      }),
    );
  });

  it('savePublish with ctx.tx uses provided transactional EntityManager', async () => {
    const txEm = createMockEntityManager();
    const event = publishEvent();

    const savedId = await storage.savePublish(event, { tx: txEm });

    expect(savedId).toBe('test-id');
    expect(txEm.create).toHaveBeenCalledWith(
      CapPublishEntity,
      expect.objectContaining({ id: 'test-id', topic: 'test-topic' }),
    );
    expect(txEm.persistAndFlush).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'test-id' }),
    );
    expect(em.persistAndFlush).not.toHaveBeenCalled();
  });

  it('savePublishWithTx delegates to savePublish with ctx', async () => {
    const txEm = createMockEntityManager();
    const event = publishEvent();
    const savePublish = jest.spyOn(storage, 'savePublish');

    await storage.savePublishWithTx(event, txEm);

    expect(savePublish).toHaveBeenCalledWith(event, { tx: txEm });
  });

  it('savePublishWithTx remains backward compatible', async () => {
    const txEm = createMockEntityManager();
    const event = publishEvent();

    const savedId = await storage.savePublishWithTx(event, txEm);

    expect(savedId).toBe('test-id');
    expect(txEm.persistAndFlush).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'test-id' }),
    );
    expect(em.persistAndFlush).not.toHaveBeenCalled();
  });

  it('CapEngine publish with tx defers broker emit by default', async () => {
    const txEm = createMockEntityManager();
    const publisher = new FakePublisher();
    const engine = createEngine(storage, publisher);

    await engine.publish('engine.tx', { ok: true }, { tx: txEm });

    expect(txEm.persistAndFlush).toHaveBeenCalled();
    expect(publisher.emitted).toHaveLength(0);
  });

  it('CapEngine publish with ctx.tx defers broker emit by default', async () => {
    const txEm = createMockEntityManager();
    const publisher = new FakePublisher();
    const engine = createEngine(storage, publisher);

    await engine.publish('engine.ctx', { ok: true }, { ctx: { tx: txEm } });

    expect(txEm.persistAndFlush).toHaveBeenCalled();
    expect(publisher.emitted).toHaveLength(0);
  });

  it('CapEngine publish with ctx.tx and immediate true attempts broker emit', async () => {
    const txEm = createMockEntityManager();
    const publisher = new FakePublisher();
    const engine = createEngine(storage, publisher);

    await engine.publish(
      'engine.ctx.immediate',
      { ok: true },
      {
        ctx: { tx: txEm },
        immediate: true,
      },
    );

    expect(txEm.persistAndFlush).toHaveBeenCalled();
    expect(publisher.emitted).toEqual([
      expect.objectContaining({
        topic: 'engine.ctx.immediate',
        payload: { ok: true },
        metadata: { messageId: 'test-id' },
      }),
    ]);
  });

  it('rolls back savePublish with ctx.tx inside a MikroORM transaction', async () => {
    const orm = await MikroORM.init({
      driver: BetterSqliteDriver,
      dbName: ':memory:',
      entities: [CapPublishEntity],
    });
    await orm.getSchemaGenerator().createSchema();
    const transactionalStorage = new MikroPublishStorage(orm.em.fork());
    const event = publishEvent({ id: 'rollback-id', topic: 'rollback-topic' });
    let savedId: string | undefined;

    try {
      await orm.em.transactional(async (tx) => {
        savedId = await transactionalStorage.savePublish(event, { tx });
        throw new Error('force rollback');
      });
    } catch {
      // Expected rollback.
    }

    try {
      expect(savedId).toBe('rollback-id');
      await expect(
        transactionalStorage.findPublishById('rollback-id'),
      ).resolves.toBeUndefined();
    } finally {
      await orm.close(true);
    }
  });

  it('claims ready events by marking them processing with a lease', async () => {
    const entity = publishEntity({ status: 'pending' });
    (em.find as jest.Mock).mockResolvedValue([entity]);

    const lockUntil = new Date(Date.now() + 30_000);
    const result = await storage.claimUnpublished({
      limit: 10,
      lockedBy: 'worker-1',
      lockUntil,
      now: new Date(),
    });

    expect(entity.status).toBe('processing');
    expect(entity.lockedBy).toBe('worker-1');
    expect(entity.lockedUntil).toBe(lockUntil);
    expect(em.flush).toHaveBeenCalled();
    expect(em.find).toHaveBeenCalledWith(
      CapPublishEntity,
      expect.any(Object),
      expect.objectContaining({
        lockMode: LockMode.PESSIMISTIC_PARTIAL_WRITE,
      }),
    );
    expect(result[0]).toMatchObject({ id: 'test-id', status: 'processing' });
  });

  it('does not request skip-locked claim mode for SQLite drivers', async () => {
    const entity = publishEntity({ status: 'pending' });
    (em.find as jest.Mock).mockResolvedValue([entity]);
    (
      em as unknown as {
        getDriver: () => {
          getPlatform: () => { constructor: { name: string } };
        };
      }
    ).getDriver = () => ({
      getPlatform: () => ({ constructor: { name: 'BetterSqlitePlatform' } }),
    });

    await storage.claimUnpublished({
      limit: 10,
      lockedBy: 'worker-1',
      lockUntil: new Date(Date.now() + 30_000),
      now: new Date(),
    });

    expect(em.find).toHaveBeenCalledWith(
      CapPublishEntity,
      expect.any(Object),
      expect.not.objectContaining({
        lockMode: LockMode.PESSIMISTIC_PARTIAL_WRITE,
      }),
    );
  });

  it('does not request skip-locked claim mode for SQL Server drivers', async () => {
    const entity = publishEntity({ status: 'pending' });
    (em.find as jest.Mock).mockResolvedValue([entity]);
    (
      em as unknown as {
        getDriver: () => {
          getPlatform: () => { constructor: { name: string } };
        };
      }
    ).getDriver = () => ({
      getPlatform: () => ({ constructor: { name: 'MsSqlPlatform' } }),
    });

    await storage.claimUnpublished({
      limit: 10,
      lockedBy: 'worker-1',
      lockUntil: new Date(Date.now() + 30_000),
      now: new Date(),
    });

    expect(em.find).toHaveBeenCalledWith(
      CapPublishEntity,
      expect.any(Object),
      expect.not.objectContaining({
        lockMode: LockMode.PESSIMISTIC_PARTIAL_WRITE,
      }),
    );
  });

  it('uses read committed isolation for MySQL claim transactions', async () => {
    const entity = publishEntity({ status: 'pending' });
    (em.find as jest.Mock).mockResolvedValue([entity]);
    (
      em as unknown as {
        getDriver: () => {
          getPlatform: () => { constructor: { name: string } };
        };
      }
    ).getDriver = () => ({
      getPlatform: () => ({ constructor: { name: 'MySqlPlatform' } }),
    });

    await storage.claimUnpublished({
      limit: 10,
      lockedBy: 'worker-1',
      lockUntil: new Date(Date.now() + 30_000),
      now: new Date(),
    });

    expect(em.transactional).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        isolationLevel: IsolationLevel.READ_COMMITTED,
      }),
    );
  });

  it('reports conservative capabilities for unknown drivers', () => {
    expect(storage.getCapabilities()).toEqual({
      transactions: true,
      skipLockedClaiming: false,
      advisoryLocks: false,
      atomicInsertIgnore: false,
      nestedTransactions: false,
      isolationLevels: [],
      claimOwnershipFencing: true,
      claimLeaseRenewal: true,
    });
  });

  it('reports SQLite as not safe for multi-instance claiming', () => {
    setPlatform(em, 'BetterSqlitePlatform');

    expect(storage.getCapabilities()).toMatchObject({
      transactions: true,
      skipLockedClaiming: false,
    });
  });

  it('reports PostgreSQL and MySQL as skip-locked claim capable', () => {
    setPlatform(em, 'PostgreSqlPlatform');
    expect(storage.getCapabilities().skipLockedClaiming).toBe(true);

    setPlatform(em, 'MySqlPlatform');
    expect(storage.getCapabilities().skipLockedClaiming).toBe(true);
  });

  it('marks published and clears lease fields', async () => {
    const publishedAt = new Date('2026-07-12T10:00:00.000Z');

    await expect(
      storage.markPublished('test-id', publishedAt, {
        expectedLockedBy: 'worker',
      }),
    ).resolves.toBe(true);

    expect(em.nativeUpdate).toHaveBeenCalledWith(
      CapPublishEntity,
      { id: 'test-id', status: 'processing', lockedBy: 'worker' },
      expect.objectContaining({
        status: 'published',
        publishedAt,
        lockedBy: null,
        lockedUntil: null,
      }),
    );
  });

  it('marks retryable publish failures', async () => {
    const nextRetryAt = new Date(Date.now() + 1000);
    await expect(
      storage.markPublishFailed('test-id', new Error('net'), {
        maxRetries: 3,
        nextRetryAt,
        now: new Date(),
        expectedLockedBy: 'worker',
      }),
    ).resolves.toBe(true);

    expect(em.nativeUpdate).toHaveBeenCalledWith(
      CapPublishEntity,
      { id: 'test-id', status: 'processing', lockedBy: 'worker' },
      expect.objectContaining({
        retryCount: expect.anything(),
        status: expect.anything(),
        nextRetryAt: expect.anything(),
        lastError: 'net',
        lockedBy: null,
        lockedUntil: null,
      }),
    );
  });

  it('dead-letters when max retries is reached', async () => {
    const result = await storage.markPublishFailed('test-id', 'boom', {
      maxRetries: 3,
      nextRetryAt: new Date(),
      now: new Date(),
    });

    expect(result).toBe(true);
    expect(em.nativeUpdate).toHaveBeenCalledWith(
      CapPublishEntity,
      { id: 'test-id' },
      expect.objectContaining({
        retryCount: expect.anything(),
        status: expect.anything(),
        nextRetryAt: expect.anything(),
        lastError: 'boom',
      }),
    );
  });

  it('releases expired claims', async () => {
    const now = new Date('2026-07-12T10:00:00.000Z');

    await storage.releaseExpiredClaims(now);

    expect(em.nativeUpdate).toHaveBeenCalledWith(
      CapPublishEntity,
      { status: 'processing', lockedUntil: { $lte: now } },
      { status: 'failed', lockedBy: null, lockedUntil: null, updatedAt: now },
    );
  });

  it('finds and lists publish events for dashboard helpers', async () => {
    const entity = publishEntity({ status: 'pending' });
    (em.findOne as jest.Mock).mockResolvedValue(entity);
    (em.findAndCount as jest.Mock).mockResolvedValue([[entity], 1]);

    await expect(storage.findPublishById('test-id')).resolves.toMatchObject({
      id: 'test-id',
      topic: 'test-topic',
    });

    const result = await storage.listPublish({
      limit: 10,
      offset: 0,
      topic: 'test-topic',
      onlyUnpublished: true,
    });

    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(em.findAndCount).toHaveBeenCalledWith(
      CapPublishEntity,
      expect.objectContaining({
        topic: 'test-topic',
        $or: expect.any(Array),
      }),
      expect.objectContaining({ limit: 10, offset: 0 }),
    );
  });
});

type MockEntityManager = EntityManager & {
  create: jest.Mock;
  persistAndFlush: jest.Mock;
  findOne: jest.Mock;
  find: jest.Mock;
  findAndCount: jest.Mock;
  nativeUpdate: jest.Mock;
  flush: jest.Mock;
  transactional: jest.Mock;
};

function createMockEntityManager(): MockEntityManager {
  const mockEm = {
    create: jest.fn((_, data) => ({ ...data, id: data.id })),
    persistAndFlush: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    nativeUpdate: jest.fn().mockResolvedValue(1),
    flush: jest.fn(),
    transactional: jest.fn((fn) => Promise.resolve(fn(mockEm))),
  };

  return mockEm;
}

function setPlatform(em: EntityManager, platformName: string): void {
  (
    em as unknown as {
      getDriver: () => {
        getPlatform: () => { constructor: { name: string } };
      };
    }
  ).getDriver = () => ({
    getPlatform: () => ({ constructor: { name: platformName } }),
  });
}

function createEngine(
  publishStorage: MikroPublishStorage,
  publisher: FakePublisher,
): CapEngine {
  return new CapEngine({
    publishStorage,
    receivedStorage: new FakeReceivedStorage(),
    publisher,
    subscriber: new FakeSubscriber(),
    scheduler: {
      batchSize: 10,
      leaseMs: 30_000,
      maxRetries: 3,
      maxInboxRetries: 3,
      instanceId: 'mikro-test',
      disabled: false,
    },
    idGenerator: () => 'test-id',
    now: () => new Date('2026-01-01T00:00:00.000Z'),
  });
}

function publishEvent(
  overrides: Partial<CapPublishEvent> = {},
): CapPublishEvent {
  return {
    id: 'test-id',
    topic: 'test-topic',
    occurredAt: new Date().toISOString(),
    payload: { foo: 'bar' },
    headers: { 'x-trace': '123' },
    retryCount: 0,
    status: 'pending',
    ...overrides,
  };
}

function publishEntity(
  overrides: Partial<CapPublishEntity> = {},
): CapPublishEntity {
  const entity = new CapPublishEntity();
  entity.id = 'test-id';
  entity.topic = 'test-topic';
  entity.payload = { foo: 'bar' };
  entity.headers = {};
  entity.retryCount = 0;
  entity.status = 'pending';
  entity.createdAt = new Date();
  Object.assign(entity, overrides);
  return entity;
}

class FakePublisher implements PublisherPort {
  emitted: Array<{
    topic: string;
    payload: JsonValue;
    headers?: CapHeaders;
    metadata?: { messageId: string };
  }> = [];

  emit(
    topic: string,
    payload: JsonValue,
    headers?: CapHeaders,
    metadata?: { messageId: string },
  ): Promise<void> {
    this.emitted.push({ topic, payload, headers, metadata });
    return Promise.resolve();
  }
}

class FakeSubscriber implements SubscriberPort {
  consume(
    _topic: string,
    _group: string,
    _handler: (
      payload: unknown,
      headers?: CapHeaders,
      metadata?: SubscribeMetadata,
    ) => Promise<void> | void,
  ): Promise<void> {
    return Promise.resolve();
  }
}

class FakeReceivedStorage implements ReceivedStoragePort {
  trySaveReceived<T extends JsonValue = JsonValue>(
    event: CapReceivedEvent<T>,
  ): Promise<TrySaveReceivedResult<T>> {
    return Promise.resolve({ inserted: true, id: event.id, event });
  }

  markProcessed(): Promise<void> {
    return Promise.resolve();
  }

  markReceivedFailed(
    _id: string,
    _error: unknown,
    _options: MarkReceivedFailedOptions,
  ): Promise<void> {
    return Promise.resolve();
  }

  getRetryDue(): Promise<CapReceivedEvent[]> {
    return Promise.resolve([]);
  }
}
