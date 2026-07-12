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
  let readyDeferred = deferred<void>();
  let readyPromise: Promise<void> = readyDeferred.promise;

  const app: CapExpressApp = {
    engine,
    get ready() {
      return readyPromise;
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
      if (started) {
        return;
      }

      // Track this start attempt as the current readiness operation.
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
      readyPromise = thisStart;

      // Prevent unhandled rejections for callers that ignore `ready`.
      thisStart.catch((error: unknown) => {
        options.logger?.error?.('CAP Express start failed', error);
      });

      try {
        await thisStart;
      } catch {
        // Rejection already observed; swallow so start() itself doesn't
        // produce an unhandled rejection when called via `void app.start()`.
      } finally {
        if (startPromise === thisStart) {
          startPromise = undefined;
        }
      }
    },
    stop: async () => {
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
      // Close subscriber.
      await engine.close();
      started = false;
      initialized = false;

      // Reset readiness for the next start.
      readyDeferred = deferred<void>();
      readyPromise = readyDeferred.promise;
    },
    healthRouter: () => createCapHealthRouter(app),
    get schedulerRunning() {
      return started;
    },
    subscriptionLifecycle: () => engine.getSubscriptionLifecycle(),
  };

  if (options.autoStart) {
    // autoStart uses the same readiness tracking path.
    void app.start();
  }

  return app;
}

function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
} {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
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
