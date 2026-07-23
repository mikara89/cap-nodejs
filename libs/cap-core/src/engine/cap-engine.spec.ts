import { CapEngine, type CapEngineOptions } from './cap-engine';
import { type CapHeaders } from '../models/cap-headers.type';
import { type CapOperationContext } from '../models/cap-operation-context';
import { type CapPublishEvent } from '../models/cap-publish-event';
import { type CapReceivedEvent } from '../models/cap-received-event';
import { type JsonValue } from '../models/json-value.type';
import {
  type ClaimUnpublishedOptions,
  type MarkPublishFailedOptions,
  type PublishClaimOwnership,
  type PublishStoragePort,
  type RenewPublishClaimOptions,
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
import { CAP_MESSAGE_ENVELOPE_KIND } from '../models/cap-message-envelope';
import {
  LegacyCapMessageEnvelopeRejectedError,
  MalformedCapMessageEnvelopeError,
  UnsupportedCapMessageEnvelopeVersionError,
  createCapMessageEnvelope,
} from '../utils/cap-message-envelope.util';

describe('CapEngine', () => {
  const scheduler = {
    batchSize: 200,
    leaseMs: 30_000,
    inboxFallbackWindowMs: 240_000,
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

  it('uses a unique diagnostic owner for each claim round', async () => {
    const engine = createEngine();

    await engine.dispatchOutboxBatch();
    await engine.dispatchOutboxBatch();

    expect(publishStorage.claimCalls).toHaveLength(2);
    expect(publishStorage.claimCalls[0]?.lockedBy).toMatch(
      /^test-instance:id-1$/,
    );
    expect(publishStorage.claimCalls[1]?.lockedBy).toMatch(
      /^test-instance:id-2$/,
    );
    expect(publishStorage.claimCalls[0]?.lockedBy).not.toBe(
      publishStorage.claimCalls[1]?.lockedBy,
    );
  });

  it('renews ownership before emitting a claimed event', async () => {
    const engine = createEngine();
    addPendingOutbox(publishStorage, 'renew-before-emit');

    await engine.dispatchOutboxBatch();

    expect(publishStorage.renewCalls).toHaveLength(1);
    expect(publishStorage.renewCalls[0]).toMatchObject({
      id: 'renew-before-emit',
      expectedLockedBy: 'test-instance:id-1',
    });
    expect(publisher.emitted).toHaveLength(1);
  });

  it('skips broker emission when ownership is lost before emit and continues the batch', async () => {
    const logger = { warn: jest.fn() };
    const engine = createEngine({ logger });
    addPendingOutbox(publishStorage, 'lost-before-emit');
    addPendingOutbox(publishStorage, 'still-owned');
    publishStorage.renewResults.push(false, true);

    await expect(engine.dispatchOutboxBatch()).resolves.toBe(2);

    expect(publisher.emitted.map((entry) => entry.metadata?.messageId)).toEqual(
      ['still-owned'],
    );
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining(
        'lost-before-emit (outbox.topic) skipped because claim test-instance:id-1 was lost before broker emission',
      ),
    );
  });

  it('renews a long active emit without overlapping and stops after success', async () => {
    jest.useFakeTimers();
    try {
      const engine = createEngine({ scheduler: { ...scheduler, leaseMs: 90 } });
      addPendingOutbox(publishStorage, 'long-emit');
      const emit = deferred<void>();
      const heartbeat = deferred<boolean>();
      publisher.pending = emit.promise;
      publishStorage.renewResults.push(true, heartbeat.promise);

      const dispatch = engine.dispatchOutboxBatch();
      await flushPromises();
      expect(publisher.emitted).toHaveLength(1);
      expect(publishStorage.renewCalls).toHaveLength(1);

      await jest.advanceTimersByTimeAsync(30);
      expect(publishStorage.renewCalls).toHaveLength(2);
      await jest.advanceTimersByTimeAsync(90);
      expect(publishStorage.renewCalls).toHaveLength(2);

      heartbeat.resolve(true);
      await flushPromises();
      emit.resolve();
      await dispatch;
      const renewalsAfterCompletion = publishStorage.renewCalls.length;
      await jest.advanceTimersByTimeAsync(300);
      expect(publishStorage.renewCalls).toHaveLength(renewalsAfterCompletion);
      expect(publishStorage.markPublishedCalls).toHaveLength(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it('stops heartbeat after publisher failure', async () => {
    jest.useFakeTimers();
    try {
      const engine = createEngine({ scheduler: { ...scheduler, leaseMs: 90 } });
      addPendingOutbox(publishStorage, 'failed-emit');
      const emit = deferred<void>();
      publisher.pending = emit.promise;
      const dispatch = engine.dispatchOutboxBatch();
      await flushPromises();
      await jest.advanceTimersByTimeAsync(30);
      emit.reject(new Error('broker failed'));
      await dispatch;
      const renewalsAfterFailure = publishStorage.renewCalls.length;
      await jest.advanceTimersByTimeAsync(300);

      expect(publishStorage.renewCalls).toHaveLength(renewalsAfterFailure);
      expect(publishStorage.markPublishFailedCalls).toHaveLength(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it('treats heartbeat renewal errors as ownership loss and skips completion', async () => {
    jest.useFakeTimers();
    try {
      const logger = { warn: jest.fn() };
      const engine = createEngine({
        logger,
        scheduler: { ...scheduler, leaseMs: 90 },
      });
      addPendingOutbox(publishStorage, 'renew-error');
      const emit = deferred<void>();
      publisher.pending = emit.promise;
      publishStorage.renewResults.push(true, new Error('renew failed'));

      const dispatch = engine.dispatchOutboxBatch();
      await flushPromises();
      await jest.advanceTimersByTimeAsync(30);
      emit.resolve();
      await dispatch;

      expect(publishStorage.markPublishedCalls).toHaveLength(0);
      expect(publishStorage.markPublishFailedCalls).toHaveLength(0);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('ownership is treated as lost'),
        expect.any(Error),
      );
    } finally {
      jest.useRealTimers();
    }
  });

  it('does not complete stale state when ownership is lost during emit', async () => {
    jest.useFakeTimers();
    try {
      const logger = { warn: jest.fn() };
      const engine = createEngine({
        logger,
        scheduler: { ...scheduler, leaseMs: 90 },
      });
      addPendingOutbox(publishStorage, 'lost-during-emit');
      const emit = deferred<void>();
      publisher.pending = emit.promise;
      publishStorage.renewResults.push(true, false);

      const dispatch = engine.dispatchOutboxBatch();
      await flushPromises();
      await jest.advanceTimersByTimeAsync(30);
      emit.resolve();
      await dispatch;

      expect(publishStorage.markPublishedCalls).toHaveLength(0);
      expect(publishStorage.markPublishFailedCalls).toHaveLength(0);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('at-least-once redelivery may occur'),
      );
    } finally {
      jest.useRealTimers();
    }
  });

  it('logs stale success and stale failure completion without fallback updates', async () => {
    const successLogger = { warn: jest.fn() };
    addPendingOutbox(publishStorage, 'stale-success');
    publishStorage.markPublishedResult = false;
    await createEngine({ logger: successLogger }).dispatchOutboxBatch();
    expect(successLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('database completion lost ownership'),
    );

    publishStorage = new InMemoryPublishStorage();
    publisher = new FakePublisher();
    publisher.error = new Error('broker failed');
    const failureLogger = { warn: jest.fn(), error: jest.fn() };
    addPendingOutbox(publishStorage, 'stale-failure');
    publishStorage.markPublishFailedResult = false;
    await createEngine({ logger: failureLogger }).dispatchOutboxBatch();
    expect(failureLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('failure state was not written'),
    );
  });

  it('subscribe persists received message, runs handler, and skips duplicate', async () => {
    const engine = createEngine();
    const handler = jest.fn();

    void engine.subscribe('topic-x', 'group-1', handler);
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

  it('preserves a business payload containing payload through inbox and handler', async () => {
    const engine = createEngine({
      messageEnvelope: { legacyUnversioned: 'reject' },
    });
    const handler = jest.fn();
    const businessPayload = {
      payload: { value: 123 },
      source: 'external-system',
      type: 'measurement',
    };

    await engine.subscribe('measurements', 'workers', handler);
    await subscriber.deliver(
      'measurements',
      'workers',
      businessPayload,
      undefined,
      { messageId: 'business-1' },
    );

    expect(handler).toHaveBeenCalledWith(businessPayload, undefined);
    expect(receivedStorage.saved[0].payload).toEqual(businessPayload);
  });

  it('decodes versioned envelopes and preserves native header precedence', async () => {
    const engine = createEngine();
    const handler = jest.fn();
    await engine.subscribe('orders', 'workers', handler);

    await subscriber.deliver(
      'orders',
      'workers',
      createCapMessageEnvelope(
        { orderId: 'o1' },
        {
          traceId: 'envelope-trace',
          source: 'envelope',
          'cap-message-id': 'envelope-id',
        },
      ),
      { traceId: 'native-trace', broker: 'rabbitmq' },
      { messageId: 'native-id', dedupeKey: 'native-dedupe-key' },
    );

    expect(handler).toHaveBeenCalledWith(
      { orderId: 'o1' },
      {
        traceId: 'native-trace',
        source: 'envelope',
        broker: 'rabbitmq',
        'cap-message-id': 'envelope-id',
      },
    );
    expect(receivedStorage.saved[0]).toMatchObject({
      payload: { orderId: 'o1' },
      messageId: 'native-id',
      dedupeKey: 'native-dedupe-key',
    });
  });

  it('uses envelope message identity without metadata and deduplicates delivery', async () => {
    const engine = createEngine();
    const handler = jest.fn();
    const envelope = createCapMessageEnvelope(
      { orderId: 'o1' },
      { 'cap-message-id': 'envelope-id' },
    );
    await engine.subscribe('orders', 'workers', handler);

    await subscriber.deliver('orders', 'workers', envelope);
    await subscriber.deliver('orders', 'workers', envelope);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(receivedStorage.saved).toHaveLength(2);
    expect(receivedStorage.saved[0]).toMatchObject({
      messageId: 'envelope-id',
      dedupeKey: 'orders|workers|envelope-id',
    });
  });

  it('rejects unsupported envelopes before inbox persistence or handling', async () => {
    const engine = createEngine();
    const handler = jest.fn();
    await engine.subscribe('orders', 'workers', handler);

    await expect(
      subscriber.deliver('orders', 'workers', {
        $cap: { kind: CAP_MESSAGE_ENVELOPE_KIND, version: 2 },
        payload: { secret: 'not-persisted' },
      }),
    ).rejects.toBeInstanceOf(UnsupportedCapMessageEnvelopeVersionError);

    expect(handler).not.toHaveBeenCalled();
    expect(receivedStorage.saved).toHaveLength(0);
  });

  it('rejects malformed explicit envelopes before inbox persistence or handling', async () => {
    const engine = createEngine();
    const handler = jest.fn();
    await engine.subscribe('orders', 'workers', handler);

    await expect(
      subscriber.deliver('orders', 'workers', {
        $cap: { kind: CAP_MESSAGE_ENVELOPE_KIND, version: 1 },
        headers: { traceId: 'missing-payload' },
      }),
    ).rejects.toBeInstanceOf(MalformedCapMessageEnvelopeError);

    expect(handler).not.toHaveBeenCalled();
    expect(receivedStorage.saved).toHaveLength(0);
  });

  it('warns once per engine while accepting strict legacy envelopes', async () => {
    const logger = { warn: jest.fn() };
    const engine = createEngine({ logger });
    const handler = jest.fn();
    await engine.subscribe('legacy', 'workers', handler);

    await subscriber.deliver(
      'legacy',
      'workers',
      { payload: { value: 1 } },
      undefined,
      { messageId: 'legacy-1' },
    );
    await subscriber.deliver(
      'legacy',
      'workers',
      { payload: { value: 2 }, headers: { source: 'legacy' } },
      undefined,
      { messageId: 'legacy-2' },
    );

    expect(handler).toHaveBeenNthCalledWith(1, { value: 1 }, undefined);
    expect(handler).toHaveBeenNthCalledWith(
      2,
      { value: 2 },
      { source: 'legacy' },
    );
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('createCapMessageEnvelope()'),
    );
  });

  it('accepts legacy envelopes without warning and keeps dedupe construction', async () => {
    const logger = { warn: jest.fn() };
    const engine = createEngine({
      logger,
      messageEnvelope: { legacyUnversioned: 'accept' },
    });
    const handler = jest.fn();
    await engine.subscribe('legacy', 'workers', handler);

    await subscriber.deliver('legacy', 'workers', {
      payload: { value: 1 },
      headers: { 'cap-message-id': 'legacy-header-id' },
    });

    expect(handler).toHaveBeenCalledWith(
      { value: 1 },
      { 'cap-message-id': 'legacy-header-id' },
    );
    expect(receivedStorage.saved[0]).toMatchObject({
      messageId: 'legacy-header-id',
      dedupeKey: 'legacy|workers|legacy-header-id',
    });
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('rejects strict legacy envelopes in reject mode', async () => {
    const engine = createEngine({
      messageEnvelope: { legacyUnversioned: 'reject' },
    });
    const handler = jest.fn();
    await engine.subscribe('legacy', 'workers', handler);

    await expect(
      subscriber.deliver('legacy', 'workers', { payload: { value: 1 } }),
    ).rejects.toBeInstanceOf(LegacyCapMessageEnvelopeRejectedError);

    expect(handler).not.toHaveBeenCalled();
    expect(receivedStorage.saved).toHaveLength(0);
  });

  it('retries with the decoded business payload', async () => {
    const engine = createEngine();
    const handler = jest
      .fn()
      .mockRejectedValueOnce(new Error('retry'))
      .mockResolvedValueOnce(undefined);
    await engine.subscribe('orders', 'workers', handler);

    await subscriber.deliver(
      'orders',
      'workers',
      createCapMessageEnvelope({ orderId: 'o1' }),
      undefined,
      { messageId: 'retry-1' },
    );
    const event = receivedStorage.saved[0];
    await engine.retryReceived(event);

    expect(handler).toHaveBeenNthCalledWith(1, { orderId: 'o1' }, undefined);
    expect(handler).toHaveBeenNthCalledWith(2, { orderId: 'o1' }, undefined);
  });

  it('passes one clock value and the default stale-pending cutoff to inbox recovery', async () => {
    const clock = jest.fn(() => new Date('2026-01-01T00:10:00.000Z'));
    const engine = createEngine({
      now: clock,
      scheduler: { ...scheduler, inboxFallbackWindowMs: undefined },
    });
    const getRetryDue = jest
      .spyOn(receivedStorage, 'getRetryDue')
      .mockResolvedValue([]);

    await expect(engine.retryInboxBatch()).resolves.toBe(0);

    expect(clock).toHaveBeenCalledTimes(1);
    expect(getRetryDue).toHaveBeenCalledWith(
      200,
      new Date('2026-01-01T00:10:00.000Z'),
      new Date('2026-01-01T00:06:00.000Z'),
    );
  });

  it('uses the configured stale-pending fallback window', async () => {
    const engine = createEngine({
      scheduler: { ...scheduler, inboxFallbackWindowMs: 0 },
    });
    const getRetryDue = jest
      .spyOn(receivedStorage, 'getRetryDue')
      .mockResolvedValue([]);

    await engine.retryInboxBatch();

    expect(getRetryDue).toHaveBeenCalledWith(
      200,
      new Date('2026-01-01T00:00:00.000Z'),
      new Date('2026-01-01T00:00:00.000Z'),
    );
  });

  it('rejects invalid inbox fallback windows', () => {
    expect(() =>
      createEngine({ scheduler: { ...scheduler, inboxFallbackWindowMs: -1 } }),
    ).toThrow(/inboxFallbackWindowMs/);
    expect(() =>
      createEngine({ scheduler: { ...scheduler, inboxFallbackWindowMs: NaN } }),
    ).toThrow(/inboxFallbackWindowMs/);
  });

  it('retries stale pending records through the registered handler and marks success processed', async () => {
    const engine = createEngine();
    const handler = jest.fn();
    engine.registerSubscription('stale', 'workers', handler);
    await engine.startSubscriptions();
    const record = receivedEvent('stale-success', 'stale', 'workers');
    receivedStorage.store.set(record.id, record);
    jest.spyOn(receivedStorage, 'getRetryDue').mockResolvedValue([record]);

    await expect(engine.retryInboxBatch()).resolves.toBe(1);

    expect(handler).toHaveBeenCalledWith(record.payload, record.headers);
    expect(receivedStorage.store.get(record.id)).toMatchObject({
      status: 'processed',
      processed: true,
    });
  });

  it('applies the existing failed and dead-letter lifecycle when stale pending recovery fails', async () => {
    const engine = createEngine({
      scheduler: { ...scheduler, maxInboxRetries: 2 },
    });
    engine.registerSubscription('stale-fail', 'workers', () => {
      throw new Error('retry failure');
    });
    await engine.startSubscriptions();
    const record = receivedEvent('stale-dead-letter', 'stale-fail', 'workers');
    receivedStorage.store.set(record.id, record);
    jest.spyOn(receivedStorage, 'getRetryDue').mockResolvedValue([record]);

    await engine.retryInboxBatch();

    expect(receivedStorage.store.get(record.id)).toMatchObject({
      status: 'failed',
      retryCount: 1,
    });

    await engine.retryReceived(record);

    expect(receivedStorage.store.get(record.id)).toMatchObject({
      status: 'dead_letter',
      retryCount: 2,
      nextRetry: null,
    });
  });

  it('does not query inbox recovery when scheduling is disabled', async () => {
    const engine = createEngine({
      scheduler: { ...scheduler, disabled: true },
    });
    const getRetryDue = jest.spyOn(receivedStorage, 'getRetryDue');

    await expect(engine.retryInboxBatch()).resolves.toBe(0);

    expect(getRetryDue).not.toHaveBeenCalled();
  });

  it('recovers a combined limited batch without invoking recent or terminal inbox rows', async () => {
    const engine = createEngine({
      scheduler: { ...scheduler, batchSize: 2 },
    });
    const handler = jest.fn();
    engine.registerSubscription('combined', 'workers', handler);
    await engine.startSubscriptions();

    const dueFailed = receivedEvent('due-failed', 'combined', 'workers');
    dueFailed.status = 'failed';
    dueFailed.retryCount = 1;
    dueFailed.nextRetry = new Date('2025-12-31T23:50:00.000Z');
    const stalePending = receivedEvent('stale-pending', 'combined', 'workers');
    const recentPending = receivedEvent(
      'recent-pending',
      'combined',
      'workers',
    );
    recentPending.occurredAt = '2026-01-01T00:00:00.001Z';
    const processed = receivedEvent('processed', 'combined', 'workers');
    processed.status = 'processed';
    processed.processed = true;
    const deadLetter = receivedEvent('dead-letter', 'combined', 'workers');
    deadLetter.status = 'dead_letter';
    deadLetter.retryCount = 2;
    for (const event of [
      dueFailed,
      stalePending,
      recentPending,
      processed,
      deadLetter,
    ]) {
      receivedStorage.store.set(event.id, event);
    }

    await expect(engine.retryInboxBatch()).resolves.toBe(2);

    expect(handler).toHaveBeenCalledTimes(2);
    expect(receivedStorage.store.get(dueFailed.id)?.status).toBe('processed');
    expect(receivedStorage.store.get(stalePending.id)?.status).toBe(
      'processed',
    );
    expect(receivedStorage.store.get(recentPending.id)?.status).toBe('pending');
    expect(receivedStorage.store.get(processed.id)?.status).toBe('processed');
    expect(receivedStorage.store.get(deadLetter.id)?.status).toBe(
      'dead_letter',
    );
  });

  it('subscribe marks received failed when handler throws', async () => {
    const engine = createEngine();
    void engine.subscribe('topic-r', 'group-r', () => {
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

function receivedEvent(
  id: string,
  topic: string,
  group: string,
): CapReceivedEvent<JsonValue> {
  return {
    id,
    topic,
    group,
    messageId: id,
    dedupeKey: `${topic}|${group}|${id}`,
    occurredAt: '2025-12-31T23:50:00.000Z',
    payload: { id },
    headers: { source: 'test' },
    retryCount: 0,
    status: 'pending',
    processed: false,
    lastError: null,
    processedAt: null,
    nextRetry: null,
  };
}

class FakePublisher implements PublisherPort {
  emitted: Array<{
    topic: string;
    payload: unknown;
    headers?: CapHeaders;
    metadata?: { messageId: string };
  }> = [];
  error?: Error;
  pending?: Promise<void>;

  emit(
    topic: string,
    payload: JsonValue,
    headers?: CapHeaders,
    metadata?: { messageId: string },
  ): Promise<void> {
    if (this.error) return Promise.reject(this.error);
    this.emitted.push({ topic, payload, headers, metadata });
    return this.pending ?? Promise.resolve();
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
  readonly claimCalls: ClaimUnpublishedOptions[] = [];
  readonly renewCalls: RenewPublishClaimOptions[] = [];
  readonly markPublishedCalls: Array<{
    id: string;
    ownership?: PublishClaimOwnership;
  }> = [];
  readonly markPublishFailedCalls: Array<{
    id: string;
    options: MarkPublishFailedOptions;
  }> = [];
  readonly renewResults: Array<boolean | Promise<boolean> | Error> = [];
  markPublishedResult: boolean | undefined;
  markPublishFailedResult: boolean | undefined;

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
    this.claimCalls.push(options);
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

  markPublished(
    id: string,
    publishedAt?: Date,
    ownership?: PublishClaimOwnership,
  ): Promise<boolean> {
    this.markPublishedCalls.push({ id, ownership });
    if (this.markPublishedResult === false) return Promise.resolve(false);
    const event = this.store.get(id);
    if (event && ownsEvent(event, ownership?.expectedLockedBy)) {
      event.status = 'published';
      event.publishedAt = publishedAt;
      event.lockedBy = null;
      event.lockedUntil = null;
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }

  markPublishFailed(
    id: string,
    error: unknown,
    options: MarkPublishFailedOptions,
  ): Promise<boolean> {
    this.markPublishFailedCalls.push({ id, options });
    if (this.markPublishFailedResult === false) return Promise.resolve(false);
    const event = this.store.get(id);
    if (event && ownsEvent(event, options.expectedLockedBy)) {
      event.retryCount += 1;
      event.status =
        event.retryCount >= options.maxRetries ? 'dead_letter' : 'failed';
      event.nextRetryAt =
        event.status === 'dead_letter' ? null : options.nextRetryAt;
      event.lastError = error instanceof Error ? error.message : String(error);
      event.lockedBy = null;
      event.lockedUntil = null;
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }

  async renewPublishClaim(options: RenewPublishClaimOptions): Promise<boolean> {
    this.renewCalls.push(options);
    const configured = this.renewResults.shift();
    if (configured instanceof Error) throw configured;
    if (configured !== undefined) return configured;
    const event = this.store.get(options.id);
    if (!event || !ownsEvent(event, options.expectedLockedBy)) return false;
    event.lockedUntil = options.lockUntil;
    return true;
  }

  releaseExpiredClaims(): Promise<void> {
    return Promise.resolve();
  }
}

function addPendingOutbox(storage: InMemoryPublishStorage, id: string): void {
  storage.store.set(id, {
    id,
    topic: 'outbox.topic',
    occurredAt: '2026-01-01T00:00:00.000Z',
    payload: {},
    retryCount: 0,
    status: 'pending',
  });
}

function ownsEvent(
  event: CapPublishEvent,
  expectedLockedBy: string | undefined,
): boolean {
  return (
    expectedLockedBy === undefined ||
    (event.status === 'processing' && event.lockedBy === expectedLockedBy)
  );
}

function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
} {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
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

  getRetryDue(
    limit: number,
    now = new Date(),
    pendingBefore?: Date,
  ): Promise<CapReceivedEvent[]> {
    return Promise.resolve(
      [...this.store.values()]
        .filter((event) => {
          if (event.status === 'failed') {
            return event.nextRetry
              ? event.nextRetry.getTime() <= now.getTime()
              : false;
          }
          if (event.status === 'pending' && pendingBefore !== undefined) {
            return (
              new Date(event.occurredAt).getTime() <= pendingBefore.getTime()
            );
          }
          return false;
        })
        .sort((left, right) => {
          const leftTime =
            left.nextRetry?.getTime() ?? new Date(left.occurredAt).getTime();
          const rightTime =
            right.nextRetry?.getTime() ?? new Date(right.occurredAt).getTime();
          if (leftTime !== rightTime) return leftTime - rightTime;
          return left.id.localeCompare(right.id);
        })
        .slice(0, limit),
    );
  }
}
