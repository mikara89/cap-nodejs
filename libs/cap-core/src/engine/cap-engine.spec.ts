import { CapEngine, type CapEngineOptions } from './cap-engine';
import { type CapHeaders } from '../models/cap-headers.type';
import { type CapOperationContext } from '../models/cap-operation-context';
import { type CapPublishEvent } from '../models/cap-publish-event';
import { type CapReceivedEvent } from '../models/cap-received-event';
import { type JsonValue } from '../models/json-value.type';
import {
  type ClaimUnpublishedOptions,
  type MarkPublishFailedOptions,
  type PublishStoragePort,
  type TransactionalPublishStoragePort,
} from '../ports/publish-storage.port';
import {
  type MarkReceivedFailedOptions,
  type ReceivedStoragePort,
  type TrySaveReceivedResult,
} from '../ports/received-storage.port';
import { type PublisherPort } from '../ports/publisher.port';
import {
  type SubscribeMetadata,
  type SubscriberPort,
} from '../ports/subscriber.port';
import {
  type CapTransactionManagerPort,
  type CapTransactionOptions,
} from '../ports/transaction-manager.port';
import { CapTransactionContext } from '../transactions/cap-transaction-context';

describe('CapEngine', () => {
  const scheduler = {
    batchSize: 200,
    leaseMs: 30_000,
    maxRetries: 7,
    maxInboxRetries: 2,
    instanceId: 'test-instance',
    disabled: false,
  };

  let publishStorage: InMemoryPublishStorage;
  let receivedStorage: InMemoryReceivedStorage;
  let publisher: FakePublisher;
  let subscriber: FakeSubscriber;
  let id = 0;

  const createEngine = (options: Partial<CapEngineOptions> = {}): CapEngine =>
    new CapEngine({
      publishStorage,
      receivedStorage,
      publisher,
      subscriber,
      scheduler,
      idGenerator: () => `id-${++id}`,
      now: () => new Date('2026-01-01T00:00:00.000Z'),
      ...options,
    });

  beforeEach(() => {
    id = 0;
    publishStorage = new InMemoryPublishStorage();
    receivedStorage = new InMemoryReceivedStorage();
    publisher = new FakePublisher();
    subscriber = new FakeSubscriber();
  });

  it('publish saves outbox without ctx and immediate success marks published', async () => {
    const engine = createEngine();

    await engine.publish('t1', { a: 1 }, { headers: { traceId: 'abc' } });

    expect(publishStorage.saved).toHaveLength(1);
    expect(publishStorage.ctx).toBeUndefined();
    expect(publisher.emitted[0]).toMatchObject({
      topic: 't1',
      payload: { a: 1 },
      headers: { traceId: 'abc', 'cap-message-id': 'id-1' },
      metadata: { messageId: 'id-1' },
    });
    expect(publishStorage.store.get('id-1')?.status).toBe('published');
  });

  it('publish immediate failure marks failed and does not rethrow', async () => {
    const engine = createEngine();
    publisher.error = new Error('boom');

    await expect(engine.publish('t2', { b: 2 })).resolves.toBeUndefined();

    const event = publishStorage.store.get('id-1');
    expect(event?.status).toBe('failed');
    expect(event?.retryCount).toBe(1);
    expect(event?.lastError).toBe('boom');
  });

  it('publish with tx still works through backward-compatible options.tx', async () => {
    const engine = createEngine();
    const tx = { tx: true };

    await engine.publish('t-tx', { tx: true }, { tx });

    expect(publishStorage.tx).toBe(tx);
    expect(publishStorage.ctx).toBeUndefined();
    expect(publisher.emitted).toHaveLength(0);
    expect(publishStorage.store.get('id-1')?.status).toBe('pending');
  });

  it('publish treats a defined falsy tx as a transaction context', async () => {
    const engine = createEngine();

    await engine.publish('t-falsy-tx', { ok: true }, { tx: 0 });

    expect(publishStorage.tx).toBe(0);
    expect(publisher.emitted).toHaveLength(0);
    expect(publishStorage.store.get('id-1')?.status).toBe('pending');
  });

  it('publish with ctx works and defers broker emit by default', async () => {
    const engine = createEngine();
    const ctx = { tx: { tx: 'ctx' }, metadata: { source: 'test' } };

    await engine.publish('t-ctx', { ctx: true }, { ctx });

    expect(publishStorage.tx).toBe(ctx.tx);
    expect(publisher.emitted).toHaveLength(0);
    expect(publishStorage.store.get('id-1')?.status).toBe('pending');
  });

  it('options.ctx wins over options.tx', async () => {
    const engine = createEngine();
    const tx = { tx: 'legacy' };
    const ctx = { tx: { tx: 'ctx' } };

    await engine.publish('t-precedence', { ok: true }, { tx, ctx });

    expect(publishStorage.tx).toBe(ctx.tx);
    expect(publishStorage.tx).not.toBe(tx);
    expect(publisher.emitted).toHaveLength(0);
  });

  it('publish uses ambient transaction manager context when no explicit ctx or tx exists', async () => {
    const ambientCtx = { tx: { tx: 'manager' } };
    const transactionManager = new FakeTransactionManager(ambientCtx);
    const engine = createEngine({ transactionManager });

    await engine.publish('t-manager-ambient', { ok: true });

    expect(transactionManager.getCurrentContextCalls).toBe(1);
    expect(publishStorage.tx).toBe(ambientCtx.tx);
    expect(publisher.emitted).toHaveLength(0);
    expect(publishStorage.store.get('id-1')?.status).toBe('pending');
  });

  it('publish uses ambient AsyncLocalStorage context when no explicit ctx or tx exists', async () => {
    const transactionContext = new CapTransactionContext();
    const ambientCtx = { tx: { tx: 'als' } };
    const engine = createEngine({ transactionContext });

    await transactionContext.run(ambientCtx, async () => {
      await engine.publish('t-als-ambient', { ok: true });
    });

    expect(publishStorage.tx).toBe(ambientCtx.tx);
    expect(publisher.emitted).toHaveLength(0);
    expect(publishStorage.store.get('id-1')?.status).toBe('pending');
  });

  it('explicit tx wins over ambient context', async () => {
    const ambientCtx = { tx: { tx: 'ambient' } };
    const explicitTx = { tx: 'explicit' };
    const transactionManager = new FakeTransactionManager(ambientCtx);
    const engine = createEngine({ transactionManager });

    await engine.publish('t-explicit-tx', { ok: true }, { tx: explicitTx });

    expect(transactionManager.getCurrentContextCalls).toBe(0);
    expect(publishStorage.tx).toBe(explicitTx);
    expect(publishStorage.tx).not.toBe(ambientCtx.tx);
    expect(publisher.emitted).toHaveLength(0);
  });

  it('publish with tx and immediate true attempts broker emit', async () => {
    const engine = createEngine();
    const tx = { tx: true };

    await engine.publish(
      't-tx-immediate',
      { ok: true },
      { tx, immediate: true },
    );

    expect(publishStorage.tx).toBe(tx);
    expect(publisher.emitted).toHaveLength(1);
    expect(publishStorage.store.get('id-1')?.status).toBe('published');
  });

  it('ambient tx with immediate true attempts broker emit', async () => {
    const ambientCtx = { tx: { tx: 'ambient-immediate' } };
    const transactionManager = new FakeTransactionManager(ambientCtx);
    const engine = createEngine({ transactionManager });

    await engine.publish(
      't-ambient-immediate',
      { ok: true },
      { immediate: true },
    );

    expect(publishStorage.tx).toBe(ambientCtx.tx);
    expect(publisher.emitted).toHaveLength(1);
    expect(publishStorage.store.get('id-1')?.status).toBe('published');
  });

  it('transaction calls configured transactionManager.runInTransaction', async () => {
    const ctx = { tx: { tx: 'run' } };
    const transactionManager = new FakeTransactionManager(ctx);
    const engine = createEngine({ transactionManager });
    const options = { isolationLevel: 'serializable' };

    await expect(
      engine.transaction(async (transactionCtx) => {
        await Promise.resolve();
        expect(transactionCtx).toBe(ctx);
        return 'ok';
      }, options),
    ).resolves.toBe('ok');

    expect(transactionManager.runInTransactionCalls).toEqual([options]);
  });

  it('transaction throws clear error when no transaction manager is configured', () => {
    const engine = createEngine();

    expect(() => engine.transaction(() => Promise.resolve(undefined))).toThrow(
      'CAP transaction manager is not configured. Pass an explicit ctx/tx to publish(), or configure a CapTransactionManagerPort.',
    );
  });

  it('legacy savePublishWithTx is used when implemented and ctx.tx exists', async () => {
    const engine = createEngine();
    const ctx = { tx: { tx: true } };

    await engine.publish('t-legacy', { ok: true }, { ctx });

    expect(publishStorage.savePublishWithTxCalls).toBe(1);
    expect(publishStorage.savePublishCalls).toBe(1);
    expect(publishStorage.tx).toBe(ctx.tx);
    expect(publishStorage.ctx).toBeUndefined();
  });

  it('new savePublish event ctx path is used when legacy method is absent', async () => {
    const nonLegacyPublishStorage = new NonLegacyPublishStorage();
    const engine = new CapEngine({
      publishStorage: nonLegacyPublishStorage,
      receivedStorage,
      publisher,
      subscriber,
      scheduler,
      idGenerator: () => `id-${++id}`,
      now: () => new Date('2026-01-01T00:00:00.000Z'),
    });
    const ctx = { tx: { tx: true } };

    await engine.publish('t-new-path', { ok: true }, { ctx });

    expect(nonLegacyPublishStorage.ctx).toBe(ctx);
    expect(publisher.emitted).toHaveLength(0);
    expect(nonLegacyPublishStorage.store.get('id-1')?.status).toBe('pending');
  });

  it('immediate broker failure with ctx is still persisted and not rethrown', async () => {
    const engine = createEngine();
    publisher.error = new Error('ctx boom');

    await expect(
      engine.publish(
        't-ctx-immediate-fail',
        { ok: true },
        { ctx: { tx: { tx: true } }, immediate: true },
      ),
    ).resolves.toBeUndefined();

    const event = publishStorage.store.get('id-1');
    expect(event?.status).toBe('failed');
    expect(event?.retryCount).toBe(1);
    expect(event?.lastError).toBe('ctx boom');
  });

  it('dispatchOutboxBatch claims and publishes ready records', async () => {
    const engine = createEngine();
    publishStorage.store.set('outbox-1', {
      id: 'outbox-1',
      topic: 'outbox.topic',
      occurredAt: '2026-01-01T00:00:00.000Z',
      payload: {},
      headers: { traceId: 'outbox' },
      retryCount: 0,
      status: 'pending',
    });

    await expect(engine.dispatchOutboxBatch()).resolves.toBe(1);

    expect(publisher.emitted[0]).toMatchObject({
      topic: 'outbox.topic',
      headers: { traceId: 'outbox', 'cap-message-id': 'outbox-1' },
      metadata: { messageId: 'outbox-1' },
    });
    expect(publishStorage.store.get('outbox-1')?.status).toBe('published');
  });

  it('subscribe persists received message, runs handler, and skips duplicate', async () => {
    const engine = createEngine();
    const handler = jest.fn();

    engine.subscribe('topic-x', 'group-1', handler);
    await subscriber.deliver(
      'topic-x',
      'group-1',
      { foo: 'bar' },
      { traceId: 'sub' },
      { messageId: 'msg-1' },
    );
    await subscriber.deliver('topic-x', 'group-1', { foo: 'bar' }, undefined, {
      messageId: 'msg-1',
    });

    expect(receivedStorage.saved).toHaveLength(2);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ foo: 'bar' }, { traceId: 'sub' });
    expect(receivedStorage.store.get('id-1')?.status).toBe('processed');
  });

  it('subscribe marks received failed when handler throws', async () => {
    const engine = createEngine();
    engine.subscribe('topic-r', 'group-r', () => {
      throw new Error('handler fail');
    });

    await subscriber.deliver('topic-r', 'group-r', {}, undefined, {
      messageId: 'msg-r',
    });

    const event = receivedStorage.store.get('id-1');
    expect(event?.status).toBe('failed');
    expect(event?.retryCount).toBe(1);
    expect(event?.lastError).toBe('handler fail');
  });
});

class FakePublisher implements PublisherPort {
  emitted: Array<{
    topic: string;
    payload: unknown;
    headers?: CapHeaders;
    metadata?: { messageId: string };
  }> = [];
  error?: Error;

  emit(
    topic: string,
    payload: JsonValue,
    headers?: CapHeaders,
    metadata?: { messageId: string },
  ): Promise<void> {
    if (this.error) return Promise.reject(this.error);
    this.emitted.push({ topic, payload, headers, metadata });
    return Promise.resolve();
  }
}

class FakeSubscriber implements SubscriberPort {
  private readonly listeners = new Map<
    string,
    Set<
      (
        payload: unknown,
        headers?: CapHeaders,
        metadata?: SubscribeMetadata,
      ) => Promise<void> | void
    >
  >();

  consume(
    topic: string,
    group: string,
    handler: (
      payload: unknown,
      headers?: CapHeaders,
      metadata?: SubscribeMetadata,
    ) => Promise<void> | void,
  ): Promise<void> {
    const key = `${topic}|${group}`;
    if (!this.listeners.has(key)) this.listeners.set(key, new Set());
    this.listeners.get(key)?.add(handler);
    return Promise.resolve();
  }

  async deliver(
    topic: string,
    group: string,
    payload: unknown,
    headers?: CapHeaders,
    metadata?: SubscribeMetadata,
  ): Promise<void> {
    const handlers = this.listeners.get(`${topic}|${group}`) ?? [];
    for (const handler of handlers) {
      await handler(payload, headers, metadata);
    }
  }
}

class FakeTransactionManager implements CapTransactionManagerPort {
  readonly runInTransactionCalls: CapTransactionOptions[] = [];
  getCurrentContextCalls = 0;

  constructor(private readonly ctx?: CapOperationContext) {}

  runInTransaction<T>(
    options: CapTransactionOptions,
    fn: (ctx: CapOperationContext) => Promise<T>,
  ): Promise<T> {
    this.runInTransactionCalls.push(options);
    return fn(this.ctx ?? { tx: { tx: 'fake' } });
  }

  getCurrentContext(): CapOperationContext | undefined {
    this.getCurrentContextCalls += 1;
    return this.ctx;
  }
}

class InMemoryPublishStorage implements TransactionalPublishStoragePort {
  readonly store = new Map<string, CapPublishEvent<JsonValue>>();
  readonly saved: CapPublishEvent<JsonValue>[] = [];
  savePublishCalls = 0;
  savePublishWithTxCalls = 0;
  ctx?: CapOperationContext;
  tx?: unknown;

  savePublish<T extends JsonValue = JsonValue>(
    event: CapPublishEvent<T>,
    ctx?: CapOperationContext,
  ): Promise<string> {
    this.savePublishCalls += 1;
    this.ctx = ctx;
    this.saved.push(event);
    this.store.set(event.id, event);
    return Promise.resolve(event.id);
  }

  savePublishWithTx<T extends JsonValue = JsonValue>(
    event: CapPublishEvent<T>,
    tx: unknown,
  ): Promise<string> {
    this.savePublishWithTxCalls += 1;
    this.tx = tx;
    return this.savePublish(event);
  }

  claimUnpublished(
    options: ClaimUnpublishedOptions,
  ): Promise<CapPublishEvent[]> {
    const claimed: CapPublishEvent[] = [];
    for (const event of this.store.values()) {
      if (claimed.length >= options.limit) break;
      if (event.status !== 'pending') continue;
      event.status = 'processing';
      event.lockedBy = options.lockedBy;
      event.lockedUntil = options.lockUntil;
      claimed.push({ ...event });
    }
    return Promise.resolve(claimed);
  }

  markPublished(id: string, publishedAt?: Date): Promise<void> {
    const event = this.store.get(id);
    if (event) {
      event.status = 'published';
      event.publishedAt = publishedAt;
      event.lockedBy = null;
      event.lockedUntil = null;
    }
    return Promise.resolve();
  }

  markPublishFailed(
    id: string,
    error: unknown,
    options: MarkPublishFailedOptions,
  ): Promise<void> {
    const event = this.store.get(id);
    if (event) {
      event.retryCount += 1;
      event.status =
        event.retryCount >= options.maxRetries ? 'dead_letter' : 'failed';
      event.nextRetryAt =
        event.status === 'dead_letter' ? null : options.nextRetryAt;
      event.lastError = error instanceof Error ? error.message : String(error);
      event.lockedBy = null;
      event.lockedUntil = null;
    }
    return Promise.resolve();
  }

  releaseExpiredClaims(): Promise<void> {
    return Promise.resolve();
  }
}

class NonLegacyPublishStorage implements PublishStoragePort {
  readonly store = new Map<string, CapPublishEvent<JsonValue>>();
  ctx?: CapOperationContext;

  savePublish<T extends JsonValue = JsonValue>(
    event: CapPublishEvent<T>,
    ctx?: CapOperationContext,
  ): Promise<string> {
    this.ctx = ctx;
    this.store.set(event.id, event);
    return Promise.resolve(event.id);
  }

  claimUnpublished(
    options: ClaimUnpublishedOptions,
  ): Promise<CapPublishEvent[]> {
    const claimed: CapPublishEvent[] = [];
    for (const event of this.store.values()) {
      if (claimed.length >= options.limit) break;
      if (event.status !== 'pending') continue;
      event.status = 'processing';
      event.lockedBy = options.lockedBy;
      event.lockedUntil = options.lockUntil;
      claimed.push({ ...event });
    }
    return Promise.resolve(claimed);
  }

  markPublished(id: string, publishedAt?: Date): Promise<void> {
    const event = this.store.get(id);
    if (event) {
      event.status = 'published';
      event.publishedAt = publishedAt;
      event.lockedBy = null;
      event.lockedUntil = null;
    }
    return Promise.resolve();
  }

  markPublishFailed(
    id: string,
    error: unknown,
    options: MarkPublishFailedOptions,
  ): Promise<void> {
    const event = this.store.get(id);
    if (event) {
      event.retryCount += 1;
      event.status =
        event.retryCount >= options.maxRetries ? 'dead_letter' : 'failed';
      event.nextRetryAt =
        event.status === 'dead_letter' ? null : options.nextRetryAt;
      event.lastError = error instanceof Error ? error.message : String(error);
      event.lockedBy = null;
      event.lockedUntil = null;
    }
    return Promise.resolve();
  }

  releaseExpiredClaims(): Promise<void> {
    return Promise.resolve();
  }
}

class InMemoryReceivedStorage implements ReceivedStoragePort {
  readonly store = new Map<string, CapReceivedEvent<JsonValue>>();
  readonly saved: CapReceivedEvent<JsonValue>[] = [];
  private readonly dedupe = new Map<string, string>();

  trySaveReceived<T extends JsonValue = JsonValue>(
    event: CapReceivedEvent<T>,
  ): Promise<TrySaveReceivedResult<T>> {
    this.saved.push(event);
    const identity = `${event.group}|${event.dedupeKey}`;
    const existingId = this.dedupe.get(identity);
    if (existingId) {
      return Promise.resolve({
        inserted: false,
        id: existingId,
        event: this.store.get(existingId) as CapReceivedEvent<T>,
      });
    }

    this.store.set(event.id, event);
    this.dedupe.set(identity, event.id);
    return Promise.resolve({ inserted: true, id: event.id, event });
  }

  markProcessed(id: string): Promise<void> {
    const event = this.store.get(id);
    if (event) {
      event.status = 'processed';
      event.processed = true;
      event.processedAt = new Date('2026-01-01T00:00:00.000Z');
      event.nextRetry = null;
    }
    return Promise.resolve();
  }

  markReceivedFailed(
    id: string,
    error: unknown,
    options: MarkReceivedFailedOptions,
  ): Promise<void> {
    const event = this.store.get(id);
    if (event) {
      event.retryCount += 1;
      event.status =
        event.retryCount >= options.maxRetries ? 'dead_letter' : 'failed';
      event.nextRetry =
        event.status === 'dead_letter' ? null : options.nextRetryAt;
      event.lastError = error instanceof Error ? error.message : String(error);
    }
    return Promise.resolve();
  }

  getRetryDue(): Promise<CapReceivedEvent[]> {
    return Promise.resolve([]);
  }
}
