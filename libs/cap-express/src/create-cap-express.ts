import type { Router } from 'express';
import {
  CapEngine,
  CapScheduler,
  type CapEngineOptions,
  type CapHeaders,
  type CapLogger,
  type CapPublishOptions,
  type CapSchedulerOptions,
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
}

export interface CapExpressApp {
  engine: CapEngine;
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

  const app: CapExpressApp = {
    engine,
    publish: (topic, payload, publishOptions) =>
      engine.publish(topic, payload, publishOptions),
    subscribe: async (topic, group, handler) => {
      engine.subscribe(topic, group, handler);
      await Promise.resolve();
    },
    start: async () => {
      if (!started) {
        scheduler.start();
        started = true;
      }
      await Promise.resolve();
    },
    stop: async () => {
      await scheduler.stop();
      await engine.close();
      started = false;
    },
    healthRouter: () => createCapHealthRouter(app),
    get schedulerRunning() {
      return started;
    },
  };

  if (options.autoStart) {
    void app.start();
  }

  return app;
}
