import type { Router } from 'express';
import {
  CapEngine,
  CapScheduler,
  type CapEngineOptions,
  type CapHeaders,
  type CapLogger,
  type CapPublishOptions,
  type CapSchedulerOptions,
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
  start(): Promise<void>;
  stop(): Promise<void>;
  healthRouter(): Router;
  readonly schedulerRunning: boolean;
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
  let readyPromise: Promise<void> = Promise.resolve();

  const app: CapExpressApp = {
    engine,
    get ready() {
      return readyPromise;
    },
    publish: (topic, payload, publishOptions) =>
      engine.publish(topic, payload, publishOptions),
    subscribe: async (topic, group, handler) => {
      engine.subscribe(topic, group, handler);
      await Promise.resolve();
    },
    start: async () => {
      if (started) {
        return;
      }

      startPromise ??= (async () => {
        if (!initialized) {
          await initializeAdapters(options);
          initialized = true;
        }
        scheduler.start();
        started = true;
      })();

      try {
        await startPromise;
      } finally {
        startPromise = undefined;
      }
    },
    stop: async () => {
      if (startPromise) {
        await startPromise;
      }
      await scheduler.stop();
      await engine.close();
      started = false;
      initialized = false;
    },
    healthRouter: () => createCapHealthRouter(app),
    get schedulerRunning() {
      return started;
    },
  };

  if (options.autoStart) {
    readyPromise = app.start();
    readyPromise.catch((error: unknown) => {
      options.logger?.error?.('CAP Express autoStart failed', error);
    });
  }

  return app;
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
