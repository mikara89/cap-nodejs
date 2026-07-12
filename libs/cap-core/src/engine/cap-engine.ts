import { randomUUID } from 'crypto';

import {
  getCapMessageId,
  withCapMessageId,
} from '../utils/cap-message-id.util';
import { createDedupeKey } from '../utils/dedupe-key.util';
import { normalizeError } from '../utils/error.util';
import { resolveOperationContext } from '../utils/operation-context.util';
import { runWithActiveLeaseHeartbeat } from '../utils/active-lease-heartbeat.util';
import { expJitter } from './backoff';
import { noopLogger } from './noop-logger';
import { type CapHeaders } from '../models/cap-headers.type';
import { type CapOperationContext } from '../models/cap-operation-context';
import { type CapPublishEvent } from '../models/cap-publish-event';
import { type CapReceivedEvent } from '../models/cap-received-event';
import {
  type CapPublishOptions,
  type CapSchedulerOptions,
} from '../models/cap-options';
import { type JsonValue } from '../models/json-value.type';
import { type CapLogger } from '../ports/logger.port';
import {
  isLegacyTransactionalPublishStorage,
  type PublishStoragePort,
} from '../ports/publish-storage.port';
import { type PublisherPort } from '../ports/publisher.port';
import {
  type ReceivedStoragePort,
  type MarkReceivedFailedOptions,
  type TrySaveReceivedResult,
} from '../ports/received-storage.port';
import {
  type SubscribeMetadata,
  type SubscriberPort,
} from '../ports/subscriber.port';
import {
  type CapTransactionManagerPort,
  type CapTransactionOptions,
} from '../ports/transaction-manager.port';
import { type CapTransactionContext } from '../transactions/cap-transaction-context';

type Handler<T = unknown> = (payload: T, headers?: CapHeaders) => Promise<void>;

// ---------------------------------------------------------------------------
// Subscription lifecycle types
// ---------------------------------------------------------------------------

export type CapSubscriptionLifecycleState =
  | 'idle'
  | 'starting'
  | 'ready'
  | 'failed'
  | 'stopping'
  | 'stopped';

export interface CapSubscriptionLifecycleSnapshot {
  readonly state: CapSubscriptionLifecycleState;
  readonly registeredCount: number;
  readonly attachedCount: number;
  failure?: {
    topic?: string;
    group?: string;
    message: string;
  };
}

interface RegisteredSubscription {
  readonly key: string;
  readonly topic: string;
  readonly group: string;
  readonly handler: Handler<JsonValue>;
  attached: boolean;
}

function subscriptionKey(topic: string, group: string): string {
  return `${topic}|${group}`;
}

// ---------------------------------------------------------------------------

export interface ResolvedCapEngineSchedulerOptions {
  batchSize: number;
  leaseMs: number;
  maxRetries: number;
  maxInboxRetries: number;
  instanceId: string;
  disabled: boolean;
}

export interface CapEngineOptions {
  publishStorage: PublishStoragePort;
  receivedStorage: ReceivedStoragePort;
  publisher: PublisherPort;
  subscriber: SubscriberPort;
  scheduler?: CapSchedulerOptions;
  logger?: CapLogger;
  instanceId?: string;
  now?: () => Date;
  idGenerator?: () => string;
  transactionManager?: CapTransactionManagerPort;
  transactionContext?: CapTransactionContext;
}

const TRANSACTION_MANAGER_NOT_CONFIGURED =
  'CAP transaction manager is not configured. Pass an explicit ctx/tx to publish(), or configure a CapTransactionManagerPort.';
const SUBSCRIPTION_SHUTDOWN_INCOMPLETE =
  'CAP subscription shutdown is incomplete. Retry stopSubscriptions() before starting or attaching subscriptions.';

const DEFAULT_SCHEDULER_OPTIONS: ResolvedCapEngineSchedulerOptions = {
  batchSize: 200,
  leaseMs: 30_000,
  maxRetries: 3,
  maxInboxRetries: 3,
  instanceId: 'cap-engine-default',
  disabled: false,
};

export class CapEngine {
  private readonly publishStorage: PublishStoragePort;
  private readonly receivedStorage: ReceivedStoragePort;
  private readonly publisher: PublisherPort;
  private readonly subscriber: SubscriberPort;
  private readonly schedulerOptions: ResolvedCapEngineSchedulerOptions;
  private readonly logger: CapLogger;
  private readonly now: () => Date;
  private readonly idGenerator: () => string;
  private readonly transactionManager?: CapTransactionManagerPort;
  private readonly transactionContext?: CapTransactionContext;

  // -- subscription lifecycle --
  private readonly subscriptions = new Map<string, RegisteredSubscription>();
  private lifecycle: CapSubscriptionLifecycleState = 'idle';
  private lifecycleFailure?: CapSubscriptionLifecycleSnapshot['failure'];

  private startPromise: Promise<void> | undefined;
  private stopPromise: Promise<void> | undefined;
  private stopRequested = false;
  private shutdownIncomplete = false;

  constructor(options: CapEngineOptions) {
    this.publishStorage = options.publishStorage;
    this.receivedStorage = options.receivedStorage;
    this.publisher = options.publisher;
    this.subscriber = options.subscriber;
    this.schedulerOptions = resolveSchedulerOptions(options);
    this.logger = options.logger ?? noopLogger;
    this.now = options.now ?? (() => new Date());
    this.idGenerator = options.idGenerator ?? randomUUID;
    this.transactionManager = options.transactionManager;
    this.transactionContext = options.transactionContext;
  }

  async publish<T = JsonValue>(
    topic: string,
    payload: T,
    options: CapPublishOptions = {},
  ): Promise<void> {
    const evt: CapPublishEvent<JsonValue> = {
      id: this.idGenerator(),
      topic,
      occurredAt: this.now().toISOString(),
      payload: payload as JsonValue,
      headers: options.headers,
      retryCount: 0,
      status: 'pending',
      nextRetryAt: null,
      lastError: null,
      lockedBy: null,
      lockedUntil: null,
      publishedAt: null,
    };

    const ctx = this.resolvePublishOperationContext(options);
    const hasTx = hasOperationTransaction(ctx);
    const dbId = await this.savePublishEvent(evt, ctx);

    if (hasTx && options.immediate !== true) {
      this.logger.debug?.(
        `operation context tx provided; deferring broker emit until scheduler claims #${dbId} ${topic}`,
      );
      return;
    }

    if (options.immediate === true || !hasTx) {
      await this.emitPersistedEvent({ ...evt, id: dbId });
    }
  }

  transaction<T>(
    fn: (ctx: CapOperationContext) => Promise<T>,
    options: CapTransactionOptions = {},
  ): Promise<T> {
    if (!this.transactionManager) {
      throw new Error(TRANSACTION_MANAGER_NOT_CONFIGURED);
    }

    return this.transactionManager.runInTransaction(options, fn);
  }

  // -----------------------------------------------------------------------
  // Registration (deferred, no broker I/O)
  // -----------------------------------------------------------------------

  /**
   * Register a subscription handler without performing any broker I/O.
   * Throws if the same `(topic, group)` pair is already registered.
   * Rejects if lifecycle is `starting` or `stopping`.
   */
  registerSubscription<T = unknown>(
    topic: string,
    group: string,
    handler: Handler<T>,
  ): void {
    this.assertTopicValid(topic);
    this.assertGroupValid(group);
    this.assertRegistrable();

    const key = subscriptionKey(topic, group);
    if (this.subscriptions.has(key)) {
      throw new Error(
        `Duplicate subscription registration for (${topic}|${group}): another CAP handler is already registered`,
      );
    }

    this.subscriptions.set(key, {
      key,
      topic,
      group,
      handler: (payload, headers) => handler(payload as T, headers),
      attached: false,
    });
  }

  // -----------------------------------------------------------------------
  // Startup (awaited attachment)
  // -----------------------------------------------------------------------

  /**
   * Attach all registered-but-unattached subscriptions by calling
   * `subscriber.consume()` for each.  Safe to call with zero registrations.
   * Idempotent after a successful startup.
   * Returns the same in-flight promise to concurrent callers.
   *
   * If a stop was requested while starting, the startup will abort after
   * the current attachment and the stop will proceed.
   * Rejects while a previous subscriber shutdown remains incomplete; retry
   * `stopSubscriptions()` successfully before starting again.
   */
  startSubscriptions(): Promise<void> {
    if (this.lifecycle === 'ready') return Promise.resolve();

    // If a stop is in progress, await it first so we begin a fresh
    // startup rather than returning a stale pre-stop promise.
    if (this.lifecycle === 'stopping' && this.stopPromise) {
      return this.stopPromise.then(
        () => this.startSubscriptions(),
        () => this.startSubscriptions(),
      );
    }

    if (this.shutdownIncomplete) {
      return Promise.reject(new Error(SUBSCRIPTION_SHUTDOWN_INCOMPLETE));
    }

    if (this.startPromise) return this.startPromise;

    this.stopRequested = false;
    this.startPromise = this.doStartSubscriptions().finally(() => {
      this.startPromise = undefined;
    });
    return this.startPromise;
  }

  private async doStartSubscriptions(): Promise<void> {
    // If a stop is already in progress, wait for it then restart.
    if (this.lifecycle === 'stopping') {
      if (this.stopPromise) {
        try {
          await this.stopPromise;
        } catch {
          // Stop failed — attempt startup anyway.
        }
      }
    }

    this.lifecycle = 'starting';
    this.lifecycleFailure = undefined;

    const unattached = [...this.subscriptions.values()].filter(
      (s) => !s.attached,
    );

    if (unattached.length === 0) {
      this.lifecycle = 'ready';
      return;
    }

    // Attach sequentially for deterministic failure reporting.
    for (const sub of unattached) {
      // If stop was requested during startup, abort before the next attach.
      if (this.stopRequested) {
        // Leave unattached descriptors as-is; stop will close any
        // already-attached consumers.
        return;
      }

      try {
        await this.attachSubscription(sub);
        sub.attached = true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Subscriber attachment failed';
        this.lifecycleFailure = { topic: sub.topic, group: sub.group, message };
        this.lifecycle = 'failed';
        this.logger.error?.(
          `Subscriber attach failed (${sub.topic}|${sub.group}): ${message}`,
          err,
        );
        throw new Error(
          `Subscription startup failed for (${sub.topic}|${sub.group}): ${message}`,
          { cause: err },
        );
      }
    }

    // Double-check stop wasn't requested during the last attachment.
    if (this.stopRequested) {
      return;
    }

    this.lifecycle = 'ready';
  }

  // -----------------------------------------------------------------------
  // Stop (graceful, serialized with start)
  // -----------------------------------------------------------------------

  /**
   * Close all consumers through `subscriber.close()` and mark all
   * registrations unattached.  Idempotent; safe after a failed start.
   * Returns the same in-flight promise to concurrent callers.
   *
   * If called during an in-progress startup, it records a stop request,
   * awaits the startup, and then proceeds.  The final lifecycle is
   * guaranteed to be `stopped` (or `failed` if close itself fails).
   * A failed close preserves attachment state and may be retried safely.
   */
  stopSubscriptions(): Promise<void> {
    if (this.lifecycle === 'stopped') return Promise.resolve();
    if (this.stopPromise) return this.stopPromise;

    // Signal any in-progress startup to abort.
    this.stopRequested = true;

    this.stopPromise = this.doStopSubscriptions().finally(() => {
      this.stopPromise = undefined;
      this.stopRequested = false;
    });
    return this.stopPromise;
  }

  private async doStopSubscriptions(): Promise<void> {
    // Await any in-progress startup before closing.
    if (this.startPromise) {
      try {
        await this.startPromise;
      } catch {
        // Startup failed — still need to close any attached consumers.
      }
    }

    this.lifecycle = 'stopping';

    try {
      if (this.subscriber.close) {
        await this.subscriber.close();
      }
    } catch (err) {
      this.logger.error?.('Subscriber close failed', err);
      const message =
        err instanceof Error ? err.message : 'Subscriber close failed';
      this.lifecycleFailure = { message };
      this.shutdownIncomplete = true;
      this.lifecycle = 'failed';
      throw err;
    }

    for (const sub of this.subscriptions.values()) {
      sub.attached = false;
    }

    this.shutdownIncomplete = false;
    this.lifecycleFailure = undefined;
    this.lifecycle = 'stopped';
  }

  // -----------------------------------------------------------------------
  // Immediate subscribe (register + attach, backward-compatible)
  // -----------------------------------------------------------------------

  /**
   * Register a handler and immediately attach it to the broker.
   *
   * - Rejects duplicates, invalid args, and lifecycle-transition blockers
   *   through the returned promise.
   * - Resolves when `subscriber.consume()` resolves.
   * - Rejects when attachment fails.
   *
   * An internal rejection observer prevents unhandled rejections for
   * callers that ignore the returned promise, covering all failure paths
   * (validation, lifecycle, and broker attachment).
   *
   * After successful attachment, if every registered descriptor is now
   * attached, lifecycle transitions to `ready`.
   */
  subscribe<T = unknown>(
    topic: string,
    group: string,
    handler: Handler<T>,
  ): Promise<void> {
    return this.observeSubscriptionPromise(
      this.doSubscribe(topic, group, handler),
      topic,
      group,
    );
  }

  private async doSubscribe<T>(
    topic: string,
    group: string,
    handler: Handler<T>,
  ): Promise<void> {
    this.assertNotDuplicate(topic, group);
    this.assertTopicValid(topic);
    this.assertGroupValid(group);

    if (this.shutdownIncomplete) {
      throw new Error(SUBSCRIPTION_SHUTDOWN_INCOMPLETE);
    }

    // If already starting/stopping, reject so callers don't inject during
    // a lifecycle transition.
    if (this.lifecycle === 'starting' || this.lifecycle === 'stopping') {
      throw new Error(
        `Cannot subscribe (${topic}|${group}) while lifecycle is '${this.lifecycle}'`,
      );
    }

    const key = subscriptionKey(topic, group);
    const sub: RegisteredSubscription = {
      key,
      topic,
      group,
      handler: (payload, headers) => handler(payload as T, headers),
      attached: false,
    };
    this.subscriptions.set(key, sub);

    try {
      await this.attachSubscription(sub);
      sub.attached = true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Subscriber attachment failed';
      this.lifecycleFailure = { topic, group, message };
      this.lifecycle = 'failed';
      throw err;
    }

    // After successful attachment, if all registered descriptors are now
    // attached and we aren't in a transitional state, become ready.
    const transitional =
      this.lifecycle === ('starting' as CapSubscriptionLifecycleState) ||
      this.lifecycle === ('stopping' as CapSubscriptionLifecycleState);
    if (!transitional) {
      const allAttached = [...this.subscriptions.values()].every(
        (s) => s.attached,
      );
      if (allAttached) {
        this.lifecycle = 'ready';
        this.lifecycleFailure = undefined;
      }
    }
  }

  /**
   * Attach an internal rejection observer to prevent unhandled rejections
   * for callers that ignore the returned promise.  Preserves the original
   * rejection for callers who await it.
   */
  private observeSubscriptionPromise(
    promise: Promise<void>,
    topic: string,
    group: string,
  ): Promise<void> {
    promise.catch((err: unknown) => {
      this.logger.error?.(`Subscriber attach failed (${topic}|${group})`, err);
    });
    return promise;
  }

  // -----------------------------------------------------------------------
  // Lifecycle diagnostics
  // -----------------------------------------------------------------------

  /**
   * Return a read-only snapshot of the subscription lifecycle.
   * The returned object is a shallow copy — mutating it does not affect
   * engine internals.
   */
  getSubscriptionLifecycle(): CapSubscriptionLifecycleSnapshot {
    const attachedCount = [...this.subscriptions.values()].filter(
      (s) => s.attached,
    ).length;
    const snapshot: CapSubscriptionLifecycleSnapshot = {
      state: this.lifecycle,
      registeredCount: this.subscriptions.size,
      attachedCount,
    };
    if (this.lifecycleFailure) {
      snapshot.failure = { ...this.lifecycleFailure };
    }
    return snapshot;
  }

  // -----------------------------------------------------------------------
  // Retry (inbox)
  // -----------------------------------------------------------------------

  async retryReceived(rec: CapReceivedEvent): Promise<void> {
    const key = subscriptionKey(rec.topic, rec.group);
    const sub = this.subscriptions.get(key);
    if (!sub) {
      this.logger.warn?.(
        `No handler registered for ${rec.topic}|${rec.group}; skipping retry`,
      );
      return;
    }
    await this.tryHandle(rec, sub.handler);
  }

  // -----------------------------------------------------------------------
  // Close (delegates to subscription stop)
  // -----------------------------------------------------------------------

  async close(): Promise<void> {
    await this.stopSubscriptions();
  }

  // -----------------------------------------------------------------------
  // Scheduler batch operations
  // -----------------------------------------------------------------------

  async dispatchOutboxBatch(): Promise<number> {
    if (this.schedulerOptions.disabled) return 0;

    const now = this.now();
    await this.publishStorage.releaseExpiredClaims(now);

    const claimOwner = `${this.schedulerOptions.instanceId}:${this.idGenerator()}`;
    const batch = await this.publishStorage.claimUnpublished({
      limit: this.schedulerOptions.batchSize,
      lockedBy: claimOwner,
      lockUntil: new Date(now.getTime() + this.schedulerOptions.leaseMs),
      now,
    });

    if (batch.length) {
      this.logger.info?.(`Outbox flush - attempting ${batch.length} msg(s)`);
    }

    for (const evt of batch) {
      if (evt.lockedBy !== claimOwner) {
        this.logger.warn?.(
          `outbox #${evt.id} (${evt.topic}) skipped because claimed owner ${String(evt.lockedBy)} did not match expected owner ${claimOwner}`,
        );
        continue;
      }
      await this.emitClaimedOutboxEvent(evt, claimOwner);
    }

    return batch.length;
  }

  async retryInboxBatch(): Promise<number> {
    if (this.schedulerOptions.disabled) return 0;

    const batch = await this.receivedStorage.getRetryDue(
      this.schedulerOptions.batchSize,
      this.now(),
    );
    if (!batch.length) return 0;

    this.logger.info?.(`Inbox retry - ${batch.length} message(s)`);

    for (const rec of batch) {
      await this.retryReceived(rec);
    }

    return batch.length;
  }

  private async savePublishEvent<TTx>(
    event: CapPublishEvent<JsonValue>,
    ctx?: CapOperationContext<TTx>,
  ): Promise<string> {
    if (
      hasOperationTransaction(ctx) &&
      isLegacyTransactionalPublishStorage<TTx>(this.publishStorage)
    ) {
      return this.publishStorage.savePublishWithTx(event, ctx.tx);
    }

    return this.publishStorage.savePublish(event, ctx);
  }

  private resolvePublishOperationContext<TTx>(
    options?: CapPublishOptions<TTx>,
  ): CapOperationContext<TTx> | undefined {
    const explicit = resolveOperationContext(options);
    if (explicit) return explicit;

    return this.resolveAmbientOperationContext() as
      | CapOperationContext<TTx>
      | undefined;
  }

  private resolveAmbientOperationContext():
    | CapOperationContext<unknown>
    | undefined {
    return (
      this.transactionManager?.getCurrentContext?.() ??
      this.transactionContext?.current()
    );
  }

  private async emitPersistedEvent(
    evt: CapPublishEvent<JsonValue>,
    source: 'publish' | 'outbox' = 'publish',
  ): Promise<void> {
    try {
      const headers = withCapMessageId(evt.headers, evt.id);
      await this.publisher.emit(evt.topic, evt.payload, headers, {
        messageId: evt.id,
      });
      await this.publishStorage.markPublished(evt.id, this.now());
      this.logger.debug?.(
        source === 'outbox'
          ? `published outbox #${evt.id}`
          : `published #${evt.id} ${evt.topic}`,
      );
    } catch (err) {
      await this.publishStorage.markPublishFailed(evt.id, err, {
        maxRetries: this.schedulerOptions.maxRetries,
        nextRetryAt: new Date(this.now().getTime() + expJitter(evt.retryCount)),
        now: this.now(),
      });
      this.logger.error?.(
        source === 'outbox'
          ? `outbox #${evt.id} emit failed (${evt.topic}): ${normalizeError(err)}`
          : `publish failed #${evt.id} (${evt.topic})`,
        err,
      );
    }
  }

  private async emitClaimedOutboxEvent(
    evt: CapPublishEvent<JsonValue>,
    expectedLockedBy: string,
  ): Promise<void> {
    const initiallyRenewed = await this.renewClaim(
      evt,
      expectedLockedBy,
      'before broker emission',
    );
    if (!initiallyRenewed) return;

    const cadenceMs = Math.max(
      1,
      Math.floor(this.schedulerOptions.leaseMs / 3),
    );
    const emitResult = await runWithActiveLeaseHeartbeat(
      async () => {
        const headers = withCapMessageId(evt.headers, evt.id);
        await this.publisher.emit(evt.topic, evt.payload, headers, {
          messageId: evt.id,
        });
      },
      {
        cadenceMs,
        renew: this.publishStorage.renewPublishClaim
          ? () =>
              this.renewClaim(
                evt,
                expectedLockedBy,
                'while broker emission was in flight',
              )
          : undefined,
      },
    );

    if (emitResult.ownershipLost) {
      this.logger.warn?.(
        `outbox #${evt.id} (${evt.topic}) broker emission settled after claim ${expectedLockedBy} was lost; database completion was skipped and at-least-once redelivery may occur`,
      );
      return;
    }

    if (emitResult.status === 'rejected') {
      const emitError = emitResult.reason;
      const failed = await this.publishStorage.markPublishFailed(
        evt.id,
        emitError,
        {
          maxRetries: this.schedulerOptions.maxRetries,
          nextRetryAt: new Date(
            this.now().getTime() + expJitter(evt.retryCount),
          ),
          now: this.now(),
          expectedLockedBy,
        },
      );
      if (failed === false) {
        this.logger.warn?.(
          `outbox #${evt.id} (${evt.topic}) publisher failed after claim ${expectedLockedBy} was lost; failure state was not written`,
        );
      }
      this.logger.error?.(
        `outbox #${evt.id} emit failed (${evt.topic}): ${normalizeError(emitError)}`,
        emitError,
      );
      return;
    }

    const completed = await this.publishStorage.markPublished(
      evt.id,
      this.now(),
      { expectedLockedBy },
    );
    if (completed === false) {
      this.logger.warn?.(
        `outbox #${evt.id} (${evt.topic}) was published by claim ${expectedLockedBy}, but database completion lost ownership; at-least-once redelivery may occur`,
      );
      return;
    }
    this.logger.debug?.(`published outbox #${evt.id}`);
  }

  private async renewClaim(
    evt: CapPublishEvent<JsonValue>,
    expectedLockedBy: string,
    phase: string,
  ): Promise<boolean> {
    if (!this.publishStorage.renewPublishClaim) return true;
    const now = this.now();
    try {
      const renewed = await this.publishStorage.renewPublishClaim({
        id: evt.id,
        expectedLockedBy,
        now,
        lockUntil: new Date(now.getTime() + this.schedulerOptions.leaseMs),
      });
      if (!renewed) {
        this.logger.warn?.(
          `outbox #${evt.id} (${evt.topic}) skipped because claim ${expectedLockedBy} was lost ${phase}`,
        );
      }
      return renewed;
    } catch (err) {
      this.logger.warn?.(
        `outbox #${evt.id} (${evt.topic}) claim ${expectedLockedBy} renewal failed ${phase}; ownership is treated as lost`,
        err,
      );
      return false;
    }
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  private async attachSubscription(sub: RegisteredSubscription): Promise<void> {
    // Register handler BEFORE calling consume — some transports/test doubles
    // may deliver synchronously while consume() is still resolving.
    await this.subscriber.consume(
      sub.topic,
      sub.group,
      async (
        msg: unknown,
        headers?: CapHeaders,
        metadata?: SubscribeMetadata,
      ) => {
        const saved = await this.persistReceived(
          sub.topic,
          sub.group,
          msg as JsonValue,
          headers,
          metadata,
        );

        if (!saved.inserted) {
          this.logger.debug?.(
            `duplicate delivery skipped #${saved.id} (${sub.topic}|${sub.group})`,
          );
          return;
        }

        await this.tryHandle(saved.event, sub.handler);
      },
    );
  }

  private assertTopicValid(topic: string): void {
    if (!topic || typeof topic !== 'string') {
      throw new Error('CAP subscription topic must be a non-empty string');
    }
  }

  private assertGroupValid(group: string): void {
    if (typeof group !== 'string') {
      throw new Error('CAP subscription group must be a string');
    }
  }

  private assertRegistrable(): void {
    if (this.lifecycle === 'starting') {
      throw new Error(
        "Cannot register subscriptions while lifecycle is 'starting'. Wait for startup to complete.",
      );
    }
    if (this.lifecycle === 'stopping') {
      throw new Error(
        "Cannot register subscriptions while lifecycle is 'stopping'.",
      );
    }
    if (this.lifecycle === 'ready') {
      throw new Error(
        "Cannot use registerSubscription() while lifecycle is 'ready'. Use subscribe() for dynamic subscriptions.",
      );
    }
  }

  private assertNotDuplicate(topic: string, group: string): void {
    const key = subscriptionKey(topic, group);
    if (this.subscriptions.has(key)) {
      throw new Error(
        `Duplicate subscription for (${topic}|${group}): another CAP handler is already registered`,
      );
    }
  }

  private async persistReceived<T>(
    topic: string,
    group: string,
    payload: T,
    headers?: CapHeaders,
    metadata?: SubscribeMetadata,
  ): Promise<TrySaveReceivedResult<JsonValue>> {
    const unwrapped = unwrapMessage(payload, headers);
    const messageId =
      metadata?.messageId ??
      getCapMessageId(unwrapped.headers) ??
      this.idGenerator();
    const dedupeKey =
      metadata?.dedupeKey ??
      createDedupeKey({ topic, group, messageId: String(messageId) });

    const rec: CapReceivedEvent<JsonValue> = {
      id: this.idGenerator(),
      topic,
      group,
      messageId: String(messageId),
      dedupeKey,
      occurredAt: this.now().toISOString(),
      payload: unwrapped.payload,
      headers: unwrapped.headers,
      retryCount: 0,
      status: 'pending',
      processed: false,
      lastError: null,
      processedAt: null,
      nextRetry: null,
    };

    return this.receivedStorage.trySaveReceived(rec);
  }

  private async tryHandle<T>(
    rec: CapReceivedEvent<T>,
    handler: Handler<T>,
  ): Promise<void> {
    try {
      await handler(rec.payload, rec.headers);
      await this.receivedStorage.markProcessed(rec.id);
      rec.status = 'processed';
      rec.processed = true;
      rec.processedAt = this.now();
      rec.nextRetry = null;
      this.logger.debug?.(`processed #${rec.id} (${rec.topic}|${rec.group})`);
    } catch (err) {
      const nextRetryCount = rec.retryCount + 1;
      const nextDelay = expJitter(rec.retryCount);
      const nextTime = new Date(this.now().getTime() + nextDelay);
      const failureOptions: MarkReceivedFailedOptions = {
        maxRetries: this.schedulerOptions.maxInboxRetries,
        nextRetryAt: nextTime,
        now: this.now(),
      };
      await this.receivedStorage.markReceivedFailed(
        rec.id,
        err,
        failureOptions,
      );
      rec.retryCount = nextRetryCount;
      rec.status =
        rec.retryCount >= failureOptions.maxRetries ? 'dead_letter' : 'failed';
      rec.nextRetry = rec.status === 'dead_letter' ? null : nextTime;
      rec.lastError = normalizeError(err);

      this.logger.error?.(
        `handler failed #${rec.id}; retry ${rec.retryCount} at ${nextTime.toISOString()}`,
        err,
      );
    }
  }
}

function resolveSchedulerOptions(
  options: CapEngineOptions,
): ResolvedCapEngineSchedulerOptions {
  const scheduler = options.scheduler ?? {};
  return {
    batchSize: scheduler.batchSize ?? DEFAULT_SCHEDULER_OPTIONS.batchSize,
    leaseMs: scheduler.leaseMs ?? DEFAULT_SCHEDULER_OPTIONS.leaseMs,
    maxRetries: scheduler.maxRetries ?? DEFAULT_SCHEDULER_OPTIONS.maxRetries,
    maxInboxRetries:
      scheduler.maxInboxRetries ??
      scheduler.maxRetries ??
      DEFAULT_SCHEDULER_OPTIONS.maxInboxRetries,
    instanceId:
      options.instanceId ??
      scheduler.instanceId ??
      DEFAULT_SCHEDULER_OPTIONS.instanceId,
    disabled: scheduler.disabled ?? DEFAULT_SCHEDULER_OPTIONS.disabled,
  };
}

function hasOperationTransaction<TTx>(
  ctx?: CapOperationContext<TTx>,
): ctx is CapOperationContext<TTx> & { tx: TTx } {
  return ctx !== undefined && 'tx' in ctx && ctx.tx !== undefined;
}

function unwrapMessage<T>(
  payload: T,
  explicitHeaders?: CapHeaders,
): { payload: JsonValue; headers?: CapHeaders } {
  if (explicitHeaders) {
    return { payload: payload as JsonValue, headers: explicitHeaders };
  }

  if (
    payload &&
    typeof payload === 'object' &&
    !Array.isArray(payload) &&
    'payload' in payload
  ) {
    const wrapped = payload as { payload: JsonValue; headers?: CapHeaders };
    return { payload: wrapped.payload, headers: wrapped.headers };
  }

  return { payload: payload as JsonValue };
}
