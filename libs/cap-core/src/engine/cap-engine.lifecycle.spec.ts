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
  type RenewPublishClaimOptions,
  type TransactionalPublishStoragePort,
} from '../ports/publish-storage.port';
import {
  type MarkReceivedFailedOptions,
  type ReceivedStoragePort,
  type TrySaveReceivedResult,
} from '../ports/received-storage.port';
import { type PublisherPort } from '../ports/publisher.port';
import { type CapHandler, type SubscriberPort } from '../ports/subscriber.port';

describe('CapEngine subscription lifecycle', () => {
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
  let subscriber: LifecycleFakeSubscriber;
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
    subscriber = new LifecycleFakeSubscriber();
  });

  // -----------------------------------------------------------------------
  // Registration tests
  // -----------------------------------------------------------------------

  it('registerSubscription performs no consume() call', () => {
    const engine = createEngine();
    const handler = jest.fn();

    engine.registerSubscription('orders.created', 'billing', handler);

    expect(subscriber.consumeCalls).toHaveLength(0);
    const snap = engine.getSubscriptionLifecycle();
    expect(snap.registeredCount).toBe(1);
    expect(snap.attachedCount).toBe(0);
    expect(snap.state).toBe('idle');
  });

  it('startSubscriptions attaches every registration', async () => {
    const engine = createEngine();
    const h1 = jest.fn();
    const h2 = jest.fn();

    engine.registerSubscription('t1', 'g1', h1);
    engine.registerSubscription('t2', 'g2', h2);

    await engine.startSubscriptions();

    expect(subscriber.consumeCalls).toEqual([
      ['t1', 'g1'],
      ['t2', 'g2'],
    ]);
    const snap = engine.getSubscriptionLifecycle();
    expect(snap.state).toBe('ready');
    expect(snap.registeredCount).toBe(2);
    expect(snap.attachedCount).toBe(2);
  });

  it('startSubscriptions with zero registrations succeeds', async () => {
    const engine = createEngine();

    await engine.startSubscriptions();

    expect(subscriber.consumeCalls).toHaveLength(0);
    expect(engine.getSubscriptionLifecycle().state).toBe('ready');
  });

  it('concurrent startSubscriptions do not duplicate attachments', async () => {
    const engine = createEngine();
    engine.registerSubscription('t', 'g', jest.fn());

    // Defer the first consume so concurrent callers race.
    const { promise, resolve } = deferred<void>();
    subscriber.nextConsumePromise = promise;

    const p1 = engine.startSubscriptions();
    const p2 = engine.startSubscriptions();
    const p3 = engine.startSubscriptions();

    resolve();
    await Promise.all([p1, p2, p3]);

    expect(subscriber.consumeCalls).toHaveLength(1);
    expect(engine.getSubscriptionLifecycle().state).toBe('ready');
  });

  it('repeated successful startSubscriptions is idempotent', async () => {
    const engine = createEngine();
    engine.registerSubscription('t', 'g', jest.fn());

    await engine.startSubscriptions();
    await engine.startSubscriptions();
    await engine.startSubscriptions();

    expect(subscriber.consumeCalls).toHaveLength(1);
    expect(engine.getSubscriptionLifecycle().state).toBe('ready');
  });

  // -----------------------------------------------------------------------
  // Duplicate detection
  // -----------------------------------------------------------------------

  it('duplicate registerSubscription throws', () => {
    const engine = createEngine();
    engine.registerSubscription('t', 'g', jest.fn());

    expect(() => engine.registerSubscription('t', 'g', jest.fn())).toThrow(
      /another CAP handler is already registered/,
    );
  });

  it('same topic with different groups is allowed', () => {
    const engine = createEngine();
    engine.registerSubscription('t', 'g1', jest.fn());
    engine.registerSubscription('t', 'g2', jest.fn());

    expect(engine.getSubscriptionLifecycle().registeredCount).toBe(2);
  });

  it('same group with different topics is allowed', () => {
    const engine = createEngine();
    engine.registerSubscription('t1', 'g', jest.fn());
    engine.registerSubscription('t2', 'g', jest.fn());

    expect(engine.getSubscriptionLifecycle().registeredCount).toBe(2);
  });

  // -----------------------------------------------------------------------
  // Attachment failure
  // -----------------------------------------------------------------------

  it('attachment rejection propagates from startSubscriptions', async () => {
    const engine = createEngine();
    engine.registerSubscription('t', 'g', jest.fn());
    subscriber.nextConsumeError = new Error('connect refused');

    await expect(engine.startSubscriptions()).rejects.toThrow(
      /Subscription startup failed/,
    );
    expect(engine.getSubscriptionLifecycle().state).toBe('failed');
  });

  it('failing topic and group are recorded', async () => {
    const engine = createEngine();
    engine.registerSubscription('t1', 'g1', jest.fn());
    engine.registerSubscription('t2', 'g2', jest.fn());
    subscriber.nextConsumeError = new Error('connect refused');

    await expect(engine.startSubscriptions()).rejects.toThrow();

    const snap = engine.getSubscriptionLifecycle();
    expect(snap.failure).toBeDefined();
    expect(snap.failure!.topic).toBe('t1');
    expect(snap.failure!.group).toBe('g1');
    expect(snap.failure!.message).toBe('connect refused');
  });

  it('partial failure preserves attached state', async () => {
    const engine = createEngine();
    engine.registerSubscription('t1', 'g1', jest.fn());
    engine.registerSubscription('t2', 'g2', jest.fn());

    // First consume succeeds, second fails.
    let callCount = 0;
    const origConsume = subscriber.consume.bind(subscriber);
    subscriber.consume = (
      topic: string,
      group: string,
      _handler: CapHandler,
    ): Promise<void> => {
      callCount++;
      subscriber.consumeCalls.push([topic, group]);
      if (callCount === 2) {
        return Promise.reject(new Error('broker gone'));
      }
      return Promise.resolve();
    };

    await expect(engine.startSubscriptions()).rejects.toThrow();

    const snap = engine.getSubscriptionLifecycle();
    expect(snap.state).toBe('failed');
    expect(snap.registeredCount).toBe(2);
    expect(snap.attachedCount).toBe(1);
    expect(snap.failure!.topic).toBe('t2');

    subscriber.consume = origConsume;
  });

  it('retry after failure attaches only missing subscriptions', async () => {
    const engine = createEngine();
    engine.registerSubscription('t1', 'g1', jest.fn());
    engine.registerSubscription('t2', 'g2', jest.fn());

    // First call fails, second succeeds.
    const consumeCalls: string[] = [];
    subscriber.consume = (
      topic: string,
      group: string,
      _handler: CapHandler,
    ): Promise<void> => {
      consumeCalls.push(`${topic}|${group}`);
      subscriber.consumeCalls.push([topic, group]);
      if (consumeCalls.length === 1) {
        return Promise.reject(new Error('first fails'));
      }
      return Promise.resolve();
    };

    await expect(engine.startSubscriptions()).rejects.toThrow();

    // Retry — only t1|g1 should be re-attached.
    await engine.startSubscriptions();

    const t1calls = consumeCalls.filter((c) => c === 't1|g1').length;
    const t2calls = consumeCalls.filter((c) => c === 't2|g2').length;
    expect(t1calls).toBe(2);
    expect(t2calls).toBe(1);

    const snap = engine.getSubscriptionLifecycle();
    expect(snap.state).toBe('ready');
    expect(snap.attachedCount).toBe(2);
  });

  // -----------------------------------------------------------------------
  // Immediate subscribe (backward-compatible)
  // -----------------------------------------------------------------------

  it('immediate subscribe() resolves after attachment', async () => {
    const engine = createEngine();
    const handler = jest.fn();

    await engine.subscribe('t', 'g', handler);

    expect(subscriber.consumeCalls).toEqual([['t', 'g']]);
  });

  it('immediate subscribe() rejects after failure', async () => {
    const engine = createEngine();
    subscriber.nextConsumeError = new Error('connect refused');

    await expect(engine.subscribe('t', 'g', jest.fn())).rejects.toThrow(
      'connect refused',
    );
  });

  it('ignored immediate subscribe rejection does not cause unhandled rejection', async () => {
    const logger = { error: jest.fn() };
    const engine = new CapEngine({
      publishStorage,
      receivedStorage,
      publisher,
      subscriber,
      scheduler,
      idGenerator: () => `id-${++id}`,
      now: () => new Date('2026-01-01T00:00:00.000Z'),
      logger,
    });

    subscriber.nextConsumeError = new Error('silent fail');

    // Call subscribe but do NOT await it — simulate legacy caller.
    void engine.subscribe('t', 'g', jest.fn());

    // Wait for microtasks.
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Subscriber attach failed'),
      expect.any(Error),
    );
  });

  it('duplicate immediate subscribe rejects', async () => {
    const engine = createEngine();
    await engine.subscribe('t', 'g', jest.fn());

    await expect(engine.subscribe('t', 'g', jest.fn())).rejects.toThrow(
      /another CAP handler is already registered/,
    );
  });

  // -----------------------------------------------------------------------
  // Dynamic subscription after readiness
  // -----------------------------------------------------------------------

  it('dynamic subscribe after startSubscriptions attaches once', async () => {
    const engine = createEngine();
    engine.registerSubscription('t1', 'g1', jest.fn());
    await engine.startSubscriptions();

    await engine.subscribe('t2', 'g2', jest.fn());

    const consumedTopics = subscriber.consumeCalls.map(([t]) => t);
    expect(consumedTopics).toEqual(['t1', 't2']);
    const snap = engine.getSubscriptionLifecycle();
    expect(snap.registeredCount).toBe(2);
    expect(snap.attachedCount).toBe(2);
  });

  it('dynamic failure changes readiness', async () => {
    const engine = createEngine();
    engine.registerSubscription('t1', 'g1', jest.fn());
    await engine.startSubscriptions();

    subscriber.nextConsumeError = new Error('dynamic fail');

    await expect(engine.subscribe('t2', 'g2', jest.fn())).rejects.toThrow(
      'dynamic fail',
    );

    const snap = engine.getSubscriptionLifecycle();
    expect(snap.state).toBe('failed');
    expect(snap.attachedCount).toBe(1);
  });

  // -----------------------------------------------------------------------
  // Stop / close
  // -----------------------------------------------------------------------

  it('stopSubscriptions calls subscriber.close', async () => {
    const engine = createEngine();
    engine.registerSubscription('t', 'g', jest.fn());
    await engine.startSubscriptions();

    subscriber.closeCalled = false;
    await engine.stopSubscriptions();

    expect(subscriber.closeCalled).toBe(true);
    expect(engine.getSubscriptionLifecycle().state).toBe('stopped');
    expect(engine.getSubscriptionLifecycle().attachedCount).toBe(0);
  });

  it('concurrent stop calls close once', async () => {
    const engine = createEngine();
    engine.registerSubscription('t', 'g', jest.fn());
    await engine.startSubscriptions();

    subscriber.closeCallCount = 0;
    const p1 = engine.stopSubscriptions();
    const p2 = engine.stopSubscriptions();

    await Promise.all([p1, p2]);

    expect(subscriber.closeCallCount).toBe(1);
  });

  it('restart after stop reattaches subscriptions', async () => {
    const engine = createEngine();
    engine.registerSubscription('t', 'g', jest.fn());
    await engine.startSubscriptions();
    await engine.stopSubscriptions();
    subscriber.consumeCalls = [];

    await engine.startSubscriptions();

    expect(subscriber.consumeCalls).toHaveLength(1);
    expect(engine.getSubscriptionLifecycle().state).toBe('ready');
  });

  it('close delegates to stopSubscriptions', async () => {
    const engine = createEngine();
    engine.registerSubscription('t', 'g', jest.fn());
    await engine.startSubscriptions();

    subscriber.closeCalled = false;
    await engine.close();

    expect(subscriber.closeCalled).toBe(true);
    expect(engine.getSubscriptionLifecycle().state).toBe('stopped');
  });

  it('stop is safe after failed start', async () => {
    const engine = createEngine();
    engine.registerSubscription('t', 'g', jest.fn());
    subscriber.nextConsumeError = new Error('fail');

    await expect(engine.startSubscriptions()).rejects.toThrow();
    await expect(engine.stopSubscriptions()).resolves.toBeUndefined();
  });

  // -----------------------------------------------------------------------
  // Serialized start / stop
  // -----------------------------------------------------------------------

  it('stop during in-progress start awaits start then closes', async () => {
    const engine = createEngine();
    engine.registerSubscription('t', 'g', jest.fn());

    // Defer the consume so start is still in progress when stop is called.
    const { promise: consumeBlocker, resolve: releaseConsume } =
      deferred<void>();
    subscriber.nextConsumePromise = consumeBlocker;

    const startDone = jest.fn();
    const startPromise = engine.startSubscriptions().then(() => startDone());

    // Let start enter the consume call.
    await Promise.resolve();
    await Promise.resolve();

    // Now call stop while start is still in-progress.
    const stopPromise = engine.stopSubscriptions();

    // Release the consume — start should complete (but stop was requested).
    releaseConsume();
    await Promise.all([startPromise, stopPromise]);

    // Verify: close was called exactly once, lifecycle is stopped.
    expect(subscriber.closeCalled).toBe(true);
    expect(subscriber.closeCallCount).toBe(1);

    const snap = engine.getSubscriptionLifecycle();
    expect(snap.state).toBe('stopped');
    expect(snap.attachedCount).toBe(0);
  });

  it('stop during start where consume fails still closes cleanly', async () => {
    const engine = createEngine();
    engine.registerSubscription('t1', 'g1', jest.fn());

    // Defer the consume and have it fail.
    const { promise: consumeBlocker, resolve: releaseConsume } =
      deferred<void>();
    subscriber.nextConsumePromise = consumeBlocker;
    subscriber.nextConsumeError = new Error('connect refused');

    const startPromise = engine.startSubscriptions();
    await Promise.resolve();
    await Promise.resolve();

    const stopPromise = engine.stopSubscriptions();

    releaseConsume();
    await Promise.all([expect(startPromise).rejects.toThrow(), stopPromise]);

    // close should still have been attempted.
    expect(subscriber.closeCalled).toBe(true);
    const snap = engine.getSubscriptionLifecycle();
    expect(snap.state).toBe('stopped');
  });

  // -----------------------------------------------------------------------
  // Immediate subscribe produces truthful lifecycle state
  // -----------------------------------------------------------------------

  it('successful direct subscribe transitions idle → ready', async () => {
    const engine = createEngine();

    await engine.subscribe('t', 'g', jest.fn());

    const snap = engine.getSubscriptionLifecycle();
    expect(snap.state).toBe('ready');
    expect(snap.registeredCount).toBe(1);
    expect(snap.attachedCount).toBe(1);
  });

  it('direct subscribe after stopped transitions to ready', async () => {
    const engine = createEngine();
    await engine.stopSubscriptions();

    // Subscribe directly from stopped — no other registrations exist.
    await engine.subscribe('t2', 'g2', jest.fn());

    const snap = engine.getSubscriptionLifecycle();
    expect(snap.state).toBe('ready');
    expect(snap.registeredCount).toBe(1);
    expect(snap.attachedCount).toBe(1);
  });

  it('successful dynamic subscribe recovers from failed to ready', async () => {
    const engine = createEngine();
    engine.registerSubscription('t1', 'g1', jest.fn());
    await engine.startSubscriptions();

    // Dynamic subscription fails — descriptor is registered but unattached.
    subscriber.nextConsumeError = new Error('dynamic fail');
    await expect(engine.subscribe('t2', 'g2', jest.fn())).rejects.toThrow();
    expect(engine.getSubscriptionLifecycle().state).toBe('failed');

    // Retry via startSubscriptions — the unattached descriptor is picked up.
    await engine.startSubscriptions();

    const snap = engine.getSubscriptionLifecycle();
    expect(snap.state).toBe('ready');
    expect(snap.registeredCount).toBe(2);
    expect(snap.attachedCount).toBe(2);
  });

  it('direct subscribe with multiple registrations reports ready when all attached', async () => {
    const engine = createEngine();
    engine.registerSubscription('t1', 'g1', jest.fn());

    // t1 is registered but unattached; t2 is subscribed directly.
    await engine.subscribe('t2', 'g2', jest.fn());

    // Not all are attached yet — lifecycle should not be ready.
    const snapBefore = engine.getSubscriptionLifecycle();
    expect(snapBefore.state).not.toBe('ready');
    expect(snapBefore.registeredCount).toBe(2);
    expect(snapBefore.attachedCount).toBe(1);
  });

  // -----------------------------------------------------------------------
  // Unified rejection observer
  // -----------------------------------------------------------------------

  it('subscribe validation error is observed and does not produce unhandled rejection', async () => {
    const logger = { error: jest.fn() };
    const engine = new CapEngine({
      publishStorage,
      receivedStorage,
      publisher,
      subscriber,
      scheduler,
      idGenerator: () => `id-${++id}`,
      now: () => new Date('2026-01-01T00:00:00.000Z'),
      logger,
    });

    await engine.subscribe('t', 'g', jest.fn());

    // Duplicate — should be observed by the rejection observer.
    const dupPromise = engine.subscribe('t', 'g', jest.fn());

    await Promise.resolve();
    await Promise.resolve();

    // The logger should have recorded the error.
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Subscriber attach failed'),
      expect.any(Error),
    );

    // The promise itself should still reject for callers who await.
    await expect(dupPromise).rejects.toThrow(/already registered/);
  });

  // -----------------------------------------------------------------------
  // Inbox retry with new descriptor map
  // -----------------------------------------------------------------------

  it('inbox retry resolves the correct handler via descriptor map', async () => {
    const engine = createEngine();
    const handler = jest.fn();
    engine.registerSubscription('rt', 'rg', handler);
    await engine.startSubscriptions();

    const rec: CapReceivedEvent = {
      id: 'rec-1',
      topic: 'rt',
      group: 'rg',
      messageId: 'msg-rt',
      dedupeKey: 'rt|rg|msg-rt',
      occurredAt: '2026-01-01T00:00:00.000Z',
      payload: { test: true },
      retryCount: 0,
      status: 'pending',
      processed: false,
      lastError: null,
      processedAt: null,
      nextRetry: null,
    };

    receivedStorage.store.set('rec-1', rec);
    await engine.retryReceived(rec);

    expect(handler).toHaveBeenCalledWith({ test: true }, undefined);
  });

  // -----------------------------------------------------------------------
  // Lifecycle snapshots are immutable
  // -----------------------------------------------------------------------

  it('lifecycle snapshot cannot mutate engine internals', () => {
    const engine = createEngine();
    engine.registerSubscription('t', 'g', jest.fn());

    const snap = engine.getSubscriptionLifecycle();
    // Attempt mutation through type assertion.
    const mutable = snap as unknown as Record<string, unknown>;
    mutable.state = 'ready';
    mutable.registeredCount = 99;

    const snap2 = engine.getSubscriptionLifecycle();
    expect(snap2.state).toBe('idle');
    expect(snap2.registeredCount).toBe(1);
  });

  // -----------------------------------------------------------------------
  // registerSubscription rejects after readiness
  // -----------------------------------------------------------------------

  it('registerSubscription rejects when lifecycle is ready', async () => {
    const engine = createEngine();
    engine.registerSubscription('t1', 'g1', jest.fn());
    await engine.startSubscriptions();

    expect(() => engine.registerSubscription('t2', 'g2', jest.fn())).toThrow(
      /Cannot use registerSubscription.*ready/,
    );
  });

  // -----------------------------------------------------------------------
  // Validation
  // -----------------------------------------------------------------------

  it('registerSubscription rejects empty topic', () => {
    const engine = createEngine();
    expect(() => engine.registerSubscription('', 'g', jest.fn())).toThrow(
      /non-empty string/,
    );
  });
});

// ---------------------------------------------------------------------------
// Test doubles
// ---------------------------------------------------------------------------

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

class LifecycleFakeSubscriber implements SubscriberPort {
  readonly handlers = new Map<string, CapHandler>();
  consumeCalls: Array<[string, string]> = [];
  nextConsumePromise?: Promise<void>;
  nextConsumeError?: Error;
  closeCalled = false;
  closeCallCount = 0;
  closeError?: Error;

  async consume(
    topic: string,
    group: string,
    handler: CapHandler,
  ): Promise<void> {
    this.consumeCalls.push([topic, group]);
    this.handlers.set(`${topic}|${group}`, handler);

    if (this.nextConsumePromise) {
      await this.nextConsumePromise;
    }

    if (this.nextConsumeError) {
      const err = this.nextConsumeError;
      this.nextConsumeError = undefined;
      throw err;
    }
  }

  async close(): Promise<void> {
    this.closeCalled = true;
    this.closeCallCount++;
    if (this.closeError) {
      throw this.closeError;
    }
    await Promise.resolve();
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
