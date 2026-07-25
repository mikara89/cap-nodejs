import { CapEngine, type CapEngineOptions } from './cap-engine';
import { type CapMessagingDiagnosticEvent } from '../models/cap-messaging-diagnostic';
import { type CapPublishEvent } from '../models/cap-publish-event';
import { type CapReceivedEvent } from '../models/cap-received-event';
import { type CapLogger } from '../ports/logger.port';
import { type CapMessagingDiagnosticsPort } from '../ports/messaging-diagnostics.port';
import { FakePublisher } from '../testing/fake-publisher';
import { FakeSubscriber } from '../testing/fake-subscriber';
import { InMemoryPublishStorage } from '../testing/in-memory-publish-storage';
import { InMemoryReceivedStorage } from '../testing/in-memory-received-storage';

describe('CapEngine messaging diagnostics', () => {
  const now = new Date('2026-07-25T10:00:00.000Z');
  let publishStorage: InMemoryPublishStorage;
  let receivedStorage: InMemoryReceivedStorage;
  let publisher: FakePublisher;
  let subscriber: FakeSubscriber;
  let events: CapMessagingDiagnosticEvent[];
  let diagnostics: CapMessagingDiagnosticsPort;
  let logger: CapLogger;
  let warn: jest.Mock;
  let id = 0;

  const createEngine = (options: Partial<CapEngineOptions> = {}): CapEngine =>
    new CapEngine({
      publishStorage,
      receivedStorage,
      publisher,
      subscriber,
      diagnostics,
      logger,
      now: () => now,
      idGenerator: () => `diagnostic-${++id}`,
      scheduler: {
        batchSize: 10,
        instanceId: 'diagnostic-test',
        maxRetries: 2,
        maxInboxRetries: 2,
      },
      ...options,
    });

  beforeEach(() => {
    id = 0;
    publishStorage = new InMemoryPublishStorage();
    receivedStorage = new InMemoryReceivedStorage();
    publisher = new FakePublisher();
    subscriber = new FakeSubscriber();
    events = [];
    diagnostics = {
      emit(event): void {
        events.push(event);
      },
    };
    warn = jest.fn();
    logger = { warn, error: jest.fn() };
  });

  it('is optional and publishes normally with no diagnostics sink', async () => {
    const engine = createEngine({ diagnostics: undefined });

    await engine.publish('orders.created', { orderId: 'private' });

    expect(publishStorage.store.get('diagnostic-1')?.status).toBe('published');
  });

  it('emits a payload-free, header-free immutable-view outbox published event', async () => {
    diagnostics = {
      emit(event) {
        events.push({ ...event });
        (event as { topic: string }).topic = 'mutated-by-sink';
      },
    };
    const engine = createEngine();

    await engine.publish(
      'orders.created',
      { customer: 'not-for-diagnostics' },
      { headers: { authorization: 'secret' } },
    );

    expect(events).toEqual([
      {
        type: 'outbox.published',
        direction: 'outbox',
        id: 'diagnostic-1',
        topic: 'orders.created',
        retryCount: 0,
        at: now.toISOString(),
      },
    ]);
    expect(Object.keys(events[0] ?? {})).not.toEqual(
      expect.arrayContaining(['payload', 'headers']),
    );
    expect(publishStorage.store.get('diagnostic-1')).toMatchObject({
      topic: 'orders.created',
      payload: { customer: 'not-for-diagnostics' },
      headers: { authorization: 'secret' },
    });
  });

  it('emits inbox processed only after durable processing succeeds', async () => {
    const engine = createEngine();
    const markProcessed = jest
      .spyOn(receivedStorage, 'markProcessed')
      .mockImplementation((id, processedAt) => {
        expect(events).toEqual([]);
        return InMemoryReceivedStorage.prototype.markProcessed.call(
          receivedStorage,
          id,
          processedAt,
        );
      });
    await engine.subscribe('orders.created', 'billing', () =>
      Promise.resolve(),
    );

    await subscriber.deliver(
      'orders.created',
      'billing',
      { customer: 'not-for-diagnostics' },
      { authorization: 'secret' },
      { messageId: 'broker-1' },
    );

    expect(markProcessed).toHaveBeenCalledWith('diagnostic-1', now);
    expect(events).toEqual([
      expect.objectContaining({
        type: 'inbox.processed',
        id: 'diagnostic-1',
        topic: 'orders.created',
        group: 'billing',
        messageId: 'broker-1',
        retryCount: 0,
        at: now.toISOString(),
      }),
    ]);
    expect(events[0]).not.toHaveProperty('payload');
    expect(events[0]).not.toHaveProperty('headers');
  });

  it('does not emit processed when durable processing fails', async () => {
    const engine = createEngine();
    jest
      .spyOn(receivedStorage, 'markProcessed')
      .mockRejectedValue(new Error('write failed'));
    await engine.subscribe('orders.created', 'billing', () =>
      Promise.resolve(),
    );

    await subscriber.deliver('orders.created', 'billing', {});

    expect(events.some((event) => event.type === 'inbox.processed')).toBe(
      false,
    );
  });

  it('emits retryable and terminal inbox failures after persistence', async () => {
    const retryable = createEngine();
    await retryable.subscribe('orders.created', 'billing', () =>
      Promise.reject(new Error('subscriber failed')),
    );
    await subscriber.deliver('orders.created', 'billing', {});

    expect(events).toEqual([
      expect.objectContaining({
        type: 'inbox.failed',
        retryCount: 1,
        nextRetryAt: expect.any(String),
        error: 'subscriber failed',
        at: now.toISOString(),
      }),
    ]);

    events = [];
    const terminal = createEngine({
      scheduler: { maxInboxRetries: 1, instanceId: 'diagnostic-test' },
    });
    await terminal.subscribe('payments.created', 'billing', () =>
      Promise.reject(new Error('terminal')),
    );
    await subscriber.deliver('payments.created', 'billing', {});

    expect(events).toEqual([
      expect.objectContaining({
        type: 'inbox.dead_lettered',
        retryCount: 1,
        nextRetryAt: null,
        error: 'terminal',
      }),
    ]);
  });

  it('does not emit an inbox failure when failure persistence rejects', async () => {
    const engine = createEngine();
    jest
      .spyOn(receivedStorage, 'markReceivedFailed')
      .mockRejectedValue(new Error('write failed'));
    await engine.subscribe('orders.created', 'billing', () =>
      Promise.reject(new Error('subscriber failed')),
    );

    await expect(
      subscriber.deliver('orders.created', 'billing', {}),
    ).rejects.toThrow('write failed');
    expect(events).toEqual([]);
  });

  it('emits retry diagnostics for due failed and stale pending rows, but not without a handler', async () => {
    const engine = createEngine();
    receivedStorage.store.set(
      'failed',
      inboxEvent('failed', 'orders.created', 'billing', 'failed', 1),
    );
    receivedStorage.store.set(
      'stale',
      inboxEvent('stale', 'orders.created', 'billing', 'pending', 0),
    );
    await engine.retryInboxBatch();
    expect(events).toEqual([]);

    await engine.subscribe('orders.created', 'billing', () =>
      Promise.resolve(),
    );
    await engine.retryInboxBatch();

    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'inbox.retried', reason: 'failed' }),
        expect.objectContaining({
          type: 'inbox.retried',
          reason: 'stale_pending',
        }),
      ]),
    );
  });

  it('does not emit retry diagnostics while scheduling is disabled', async () => {
    const engine = createEngine({
      scheduler: { disabled: true, instanceId: 'diagnostic-test' },
    });
    receivedStorage.store.set(
      'failed',
      inboxEvent('failed', 'orders.created', 'billing', 'failed', 1),
    );

    await engine.retryInboxBatch();

    expect(events).toEqual([]);
  });

  it('emits outbox retry only for a claimed record with a prior retry', async () => {
    const engine = createEngine();
    publishStorage.store.set('retry', outboxEvent('retry', 'failed', 1));
    publishStorage.store.set('initial', outboxEvent('initial', 'pending', 0));

    await engine.dispatchOutboxBatch();

    expect(events.filter((event) => event.type === 'outbox.retried')).toEqual([
      expect.objectContaining({ id: 'retry', retryCount: 1 }),
    ]);
  });

  it('does not emit published when ownership completion is lost', async () => {
    const engine = createEngine();
    publishStorage.store.set('lost', outboxEvent('lost', 'pending', 0));
    jest.spyOn(publishStorage, 'markPublished').mockResolvedValue(false);

    await engine.dispatchOutboxBatch();

    expect(events.some((event) => event.type === 'outbox.published')).toBe(
      false,
    );
  });

  it('emits retryable and terminal outbox failures after durable failure updates', async () => {
    publisher.error = new Error('broker failed');
    await createEngine().publish('orders.created', {});
    expect(events).toEqual([
      expect.objectContaining({
        type: 'outbox.failed',
        retryCount: 1,
        nextRetryAt: expect.any(String),
        error: 'broker failed',
      }),
    ]);

    events = [];
    publisher.error = new Error('terminal broker failed');
    await createEngine({
      scheduler: { maxRetries: 1, instanceId: 'diagnostic-test' },
    }).publish('payments.created', {});
    expect(events).toEqual([
      expect.objectContaining({
        type: 'outbox.dead_lettered',
        retryCount: 1,
        nextRetryAt: null,
        error: 'terminal broker failed',
      }),
    ]);
  });

  it('does not emit an outbox failure when claim-fenced persistence is lost', async () => {
    const engine = createEngine();
    publisher.error = new Error('broker failed');
    publishStorage.store.set('lost', outboxEvent('lost', 'pending', 0));
    jest.spyOn(publishStorage, 'markPublishFailed').mockResolvedValue(false);

    await engine.dispatchOutboxBatch();

    expect(events).toEqual([]);
  });

  it('emits manual requeue diagnostics only for successful requeues', async () => {
    const engine = createEngine();
    receivedStorage.store.set(
      'inbox',
      inboxEvent('inbox', 'orders.created', 'billing', 'dead_letter', 2),
    );
    publishStorage.store.set('outbox', outboxEvent('outbox', 'dead_letter', 2));

    await expect(engine.requeueInbox('inbox')).resolves.toMatchObject({
      outcome: 'requeued',
    });
    await expect(engine.requeueOutbox('outbox')).resolves.toMatchObject({
      outcome: 'requeued',
    });
    await engine.requeueInbox('missing');
    publishStorage.store.set(
      'published',
      outboxEvent('published', 'published', 0),
    );
    await engine.requeueOutbox('published');
    await flushPromises();

    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'inbox.manually_requeued',
          id: 'inbox',
          retryCount: 0,
          previousStatus: 'dead_letter',
          at: now.toISOString(),
        }),
        expect.objectContaining({
          type: 'outbox.manually_requeued',
          id: 'outbox',
          retryCount: 0,
          previousStatus: 'dead_letter',
          at: now.toISOString(),
        }),
      ]),
    );
    expect(events).toHaveLength(2);
  });

  it('captures manual requeue metadata before the guarded transition', async () => {
    const engine = createEngine();
    receivedStorage.store.set(
      'inbox',
      inboxEvent('inbox', 'orders.created', 'billing', 'dead_letter', 2),
    );
    publishStorage.store.set('outbox', outboxEvent('outbox', 'dead_letter', 2));
    const inboxLookup = deferred<CapReceivedEvent | undefined>();
    const outboxLookup = deferred<CapPublishEvent | undefined>();
    const requeueInbox = jest.spyOn(receivedStorage, 'requeueReceived');
    const requeueOutbox = jest.spyOn(publishStorage, 'requeuePublish');
    jest
      .spyOn(receivedStorage, 'findReceivedById')
      .mockReturnValue(inboxLookup.promise);
    jest
      .spyOn(publishStorage, 'findPublishById')
      .mockReturnValue(outboxLookup.promise);

    const inboxResult = engine.requeueInbox('inbox');
    const outboxResult = engine.requeueOutbox('outbox');
    await flushPromises();
    expect(requeueInbox).not.toHaveBeenCalled();
    expect(requeueOutbox).not.toHaveBeenCalled();

    inboxLookup.resolve({
      ...inboxEvent('inbox', 'orders.created', 'billing', 'dead_letter', 2),
    });
    outboxLookup.resolve(outboxEvent('outbox', 'dead_letter', 2));
    await Promise.all([inboxResult, outboxResult]);

    receivedStorage.store.get('inbox')!.status = 'processed';
    receivedStorage.store.get('inbox')!.retryCount = 9;
    publishStorage.store.get('outbox')!.status = 'published';
    publishStorage.store.get('outbox')!.retryCount = 9;

    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'inbox.manually_requeued',
          id: 'inbox',
          topic: 'orders.created',
          group: 'billing',
          messageId: 'inbox-message',
          retryCount: 0,
          previousStatus: 'dead_letter',
          at: now.toISOString(),
        }),
        expect.objectContaining({
          type: 'outbox.manually_requeued',
          id: 'outbox',
          topic: 'orders.created',
          retryCount: 0,
          previousStatus: 'dead_letter',
          at: now.toISOString(),
        }),
      ]),
    );
  });

  it('swallows synchronous and rejected asynchronous sink failures without changing outcomes', async () => {
    diagnostics = {
      emit: jest
        .fn()
        .mockImplementationOnce(() => {
          throw new Error('sync sink failed');
        })
        .mockImplementationOnce(() =>
          Promise.reject(new Error('async sink failed')),
        ),
    };
    const engine = createEngine();

    await engine.publish('orders.created', {});
    await engine.publish('payments.created', {});
    await flushPromises();

    expect(publishStorage.store.get('diagnostic-1')?.status).toBe('published');
    expect(publishStorage.store.get('diagnostic-2')?.status).toBe('published');
    expect(warn).toHaveBeenCalledWith(
      'CAP messaging diagnostics emission failed',
      expect.any(Error),
    );
  });

  it('does not await a slow diagnostics sink on publish or manual requeue', async () => {
    const slow = deferred<void>();
    diagnostics = { emit: () => slow.promise };
    const engine = createEngine();
    receivedStorage.store.set(
      'inbox',
      inboxEvent('inbox', 'orders.created', 'billing', 'dead_letter', 2),
    );

    await expect(engine.publish('orders.created', {})).resolves.toBeUndefined();
    await expect(engine.requeueInbox('inbox')).resolves.toMatchObject({
      outcome: 'requeued',
    });
    expect(publishStorage.store.get('diagnostic-1')?.status).toBe('published');
    expect(receivedStorage.store.get('inbox')?.status).toBe('failed');
    slow.resolve();
  });

  it('does not let diagnostics failure change manual requeue results or failure transitions', async () => {
    diagnostics = { emit: () => Promise.reject(new Error('sink failed')) };
    const engine = createEngine();
    receivedStorage.store.set(
      'inbox',
      inboxEvent('inbox', 'orders.created', 'billing', 'dead_letter', 2),
    );

    await expect(engine.requeueInbox('inbox')).resolves.toEqual({
      id: 'inbox',
      outcome: 'requeued',
      previousStatus: 'dead_letter',
    });
    await flushPromises();
    expect(receivedStorage.store.get('inbox')).toMatchObject({
      status: 'failed',
      retryCount: 0,
    });
  });
});

function inboxEvent(
  id: string,
  topic: string,
  group: string,
  status: CapReceivedEvent['status'],
  retryCount: number,
): CapReceivedEvent {
  return {
    id,
    topic,
    group,
    messageId: `${id}-message`,
    dedupeKey: `${group}|${id}`,
    occurredAt: '2026-07-25T00:00:00.000Z',
    payload: {},
    retryCount,
    status,
    processed: false,
    lastError: null,
    processedAt: null,
    nextRetry:
      status === 'failed' ? new Date('2026-07-25T09:00:00.000Z') : null,
  };
}

function outboxEvent(
  id: string,
  status: CapPublishEvent['status'],
  retryCount: number,
): CapPublishEvent {
  return {
    id,
    topic: 'orders.created',
    occurredAt: '2026-07-25T00:00:00.000Z',
    payload: {},
    retryCount,
    status,
    lastError: null,
    nextRetryAt:
      status === 'failed' ? new Date('2026-07-25T09:00:00.000Z') : null,
    lockedBy: null,
    lockedUntil: null,
    publishedAt: null,
  };
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
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
