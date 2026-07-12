import type { Router } from 'express';
import {
  CapEngine,
  CapScheduler,
  type CapEngineOptions,
  type CapHeaders,
  type CapLogger,
  type CapOperationContext,
  type CapPublishOptions,
  type CapSchedulerOptions,
  type CapSubscriptionLifecycleSnapshot,
  type CapTransactionOptions,
  type InitOptions,
  type JsonValue,
  type PublishStoragePort,
  type PublisherPort,
  type ReceivedStoragePort,
  type SubscriberPort,
} from '@mikara89/cap-core';
import { createCapHealthRouter } from './cap-health-router';

export interface CapExpressSchedulerOptions extends CapSchedulerOptions {
  outboxIntervalMs?: number;
  inboxRetryIntervalMs?: number;
}

export interface CreateCapExpressOptions {
  publishStorage: PublishStoragePort;
  receivedStorage: ReceivedStoragePort;
  publisher: PublisherPort;
  subscriber: SubscriberPort;
  scheduler?: CapExpressSchedulerOptions;
  logger?: CapLogger;
  instanceId?: string;
  now?: CapEngineOptions['now'];
  idGenerator?: CapEngineOptions['idGenerator'];
  transactionManager?: CapEngineOptions['transactionManager'];
  transactionContext?: CapEngineOptions['transactionContext'];
  autoStart?: boolean;
  init?: InitOptions;
}

export interface CapExpressApp {
  engine: CapEngine;
  readonly ready: Promise<void>;
  publish<T extends JsonValue = JsonValue>(
    topic: string,
    payload: T,
    options?: CapPublishOptions,
  ): Promise<void>;
  subscribe<T = unknown>(
    topic: string,
    group: string,
    handler: (payload: T, headers?: CapHeaders) => Promise<void>,
  ): Promise<void>;
  transaction<T>(
    fn: (ctx: CapOperationContext) => Promise<T>,
    options?: CapTransactionOptions,
  ): Promise<T>;
  start(): Promise<void>;
  stop(): Promise<void>;
  healthRouter(): Router;
  readonly schedulerRunning: boolean;
  readonly subscriptionLifecycle: () => CapSubscriptionLifecycleSnapshot;
}

const DEFAULT_OUTBOX_INTERVAL_MS = 5_000;
const DEFAULT_INBOX_RETRY_INTERVAL_MS = 10_000;

export function createCapExpress(
  options: CreateCapExpressOptions,
): CapExpressApp {
  const engine = new CapEngine({
    publishStorage: options.publishStorage,
    receivedStorage: options.receivedStorage,
    publisher: options.publisher,
    subscriber: options.subscriber,
    scheduler: options.scheduler,
    logger: options.logger,
    instanceId: options.instanceId,
    now: options.now,
    idGenerator: options.idGenerator,
    transactionManager: options.transactionManager,
    transactionContext: options.transactionContext,
  });
  const scheduler = new CapScheduler(
    engine,
    {
      outboxIntervalMs:
        options.scheduler?.outboxIntervalMs ?? DEFAULT_OUTBOX_INTERVAL_MS,
      inboxRetryIntervalMs:
        options.scheduler?.inboxRetryIntervalMs ??
        DEFAULT_INBOX_RETRY_INTERVAL_MS,
      disabled: options.scheduler?.disabled,
    },
    options.logger,
  );
  let started = false;
  let initialized = false;
  let startPromise: Promise<void> | undefined;
  let stopPromise: Promise<void> | undefined;
  let readiness = createReadinessDeferred();

  const app: CapExpressApp = {
    engine,
    get ready() {
      return readiness.promise;
    },
    publish: (topic, payload, publishOptions) =>
      engine.publish(topic, payload, publishOptions),
    subscribe: async (topic, group, handler) => {
      if (!started) {
        // Pre-start: deferred registration only, no broker I/O.
        engine.registerSubscription(topic, group, handler);
        return;
      }
      // Post-start: dynamic immediate subscription.
      await engine.subscribe(topic, group, handler);
    },
    transaction: (fn, transactionOptions) =>
      engine.transaction(fn, transactionOptions),
    start: async () => {
      if (stopPromise) {
        return stopPromise.then(() => app.start());
      }
      if (started) {
        return;
      }
      if (startPromise) {
        return startPromise;
      }

      // A failed startup settled the previous cycle. Retrying starts a new
      // readiness cycle; the initial and post-stop cycles are already pending.
      if (readiness.settled) {
        readiness = createReadinessDeferred();
      }
      const thisReadiness = readiness;

      // Build the startup operation and share it with concurrent callers.
      const thisStart = (async () => {
        // 1. Initialize adapters.
        if (!initialized) {
          await initializeAdapters(options);
          initialized = true;
        }
        // 2. Attach all registered subscriptions.
        await engine.startSubscriptions();
        // 3. Start the scheduler.
        scheduler.start();
        started = true;
      })();

      startPromise = thisStart;
      void thisStart.then(
        () => thisReadiness.resolve(),
        (error: unknown) => thisReadiness.reject(error),
      );

      // Safety catch — prevents unhandled rejections for callers
      // that ignore `ready` or call start() via `void`.
      thisStart.catch((error: unknown) => {
        options.logger?.error?.('CAP Express start failed', error);
      });

      try {
        await thisStart;
      } finally {
        if (startPromise === thisStart) {
          startPromise = undefined;
        }
      }
    },
    stop: async () => {
      if (stopPromise) {
        return stopPromise;
      }

      const thisStop = (async () => {
        // Await any in-progress start.
        if (startPromise) {
          try {
            await startPromise;
          } catch {
            // Start failed — still need to clean up.
          }
        }
        // Stop scheduler first.
        await scheduler.stop();
        started = false;

        // Once scheduler work is stopped, readiness belongs to the next
        // lifecycle cycle. Reject it if consumer shutdown cannot complete.
        if (readiness.settled) {
          readiness = createReadinessDeferred();
        }
        const nextReadiness = readiness;

        // Close subscriber.
        try {
          await engine.close();
        } catch (error) {
          nextReadiness.reject(error);
          throw error;
        }
        initialized = false;
      })();

      stopPromise = thisStop;
      try {
        await thisStop;
      } finally {
        if (stopPromise === thisStop) {
          stopPromise = undefined;
        }
      }
    },
    healthRouter: () => createCapHealthRouter(app),
    get schedulerRunning() {
      return started;
    },
    subscriptionLifecycle: () => engine.getSubscriptionLifecycle(),
  };

  if (options.autoStart) {
    // autoStart uses the same readiness tracking path but must internally
    // observe the rejection so it never produces an unhandled rejection.
    app.start().catch(() => {
      // Already logged by the internal observer in start().
    });
  }

  return app;
}

interface ReadinessDeferred {
  promise: Promise<void>;
  readonly settled: boolean;
  resolve(): void;
  reject(error: unknown): void;
}

function createReadinessDeferred(): ReadinessDeferred {
  let resolvePromise!: () => void;
  let rejectPromise!: (error: unknown) => void;
  let settled = false;
  const promise = new Promise<void>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });

  // `ready` is optional to observe. Mark its rejection handled internally
  // while preserving the original promise and rejection for consumers.
  void promise.catch(() => undefined);

  return {
    promise,
    get settled() {
      return settled;
    },
    resolve() {
      if (settled) return;
      settled = true;
      resolvePromise();
    },
    reject(error: unknown) {
      if (settled) return;
      settled = true;
      rejectPromise(error);
    },
  };
}

async function initializeAdapters(
  options: CreateCapExpressOptions,
): Promise<void> {
  if (!options.init) return;

  const adapters: Array<{
    initialize?: (options?: InitOptions) => Promise<void>;
  }> = [
    options.publishStorage,
    options.receivedStorage,
    options.publisher,
    options.subscriber,
  ];

  await Promise.all(
    adapters.map(async (adapter) => {
      if (typeof adapter?.initialize === 'function') {
        await adapter.initialize(options.init);
      }
    }),
  );
}
