import { Injectable, Logger } from '@nestjs/common';
import {
  CapEngine,
  DEFAULT_INBOX_FALLBACK_WINDOW_MS,
  type CapLogger,
  type CapOperationContext,
  type CapPublishOptions,
  type CapSubscriptionLifecycleSnapshot,
  type CapTransactionOptions,
} from '@mikara89/cap-core';

import {
  IPublishStorage,
  IReceivedStorage,
} from './abstractions/storage.interface';
import { IPublisher, ISubscriber } from './abstractions/transport.interface';
import { CapHeaders } from './models/cap-headers.type';
import { CapReceivedEvent } from './models/cap-received-event';
import { JsonValue } from './models/json-value.type';
import { ResolvedCapSchedulerOptions } from './cap.options';

type Handler<T = unknown> = (payload: T, headers?: CapHeaders) => Promise<void>;

const DEFAULT_SCHEDULER_OPTIONS: ResolvedCapSchedulerOptions = {
  batchSize: 200,
  leaseMs: 30_000,
  inboxFallbackWindowMs: DEFAULT_INBOX_FALLBACK_WINDOW_MS,
  maxRetries: 3,
  maxInboxRetries: 3,
  instanceId: 'cap-service-default',
  disabled: false,
};

export type {
  CapOperationContext,
  CapPublishOptions,
  CapSubscriptionLifecycleSnapshot,
  CapTransactionOptions,
} from '@mikara89/cap-core';

@Injectable()
export class CapService {
  private readonly engine: CapEngine;

  constructor(engine: CapEngine);
  constructor(
    pubStore: IPublishStorage,
    recStore: IReceivedStorage,
    publisher: IPublisher,
    subscriber: ISubscriber,
    schedulerOptions?: ResolvedCapSchedulerOptions,
  );
  constructor(
    engineOrPubStore: CapEngine | IPublishStorage,
    recStore?: IReceivedStorage,
    publisher?: IPublisher,
    subscriber?: ISubscriber,
    schedulerOptions: ResolvedCapSchedulerOptions = DEFAULT_SCHEDULER_OPTIONS,
  ) {
    if (engineOrPubStore instanceof CapEngine) {
      this.engine = engineOrPubStore;
      return;
    }

    if (!recStore || !publisher || !subscriber) {
      throw new Error(
        'CapService requires either a CapEngine or all storage/transport adapters',
      );
    }

    this.engine = new CapEngine({
      publishStorage: engineOrPubStore,
      receivedStorage: recStore,
      publisher,
      subscriber,
      scheduler: schedulerOptions,
      logger: createNestLogger(CapService.name),
    });
  }

  publish<T = JsonValue>(
    topic: string,
    payload: T,
    options: CapPublishOptions = {},
  ): Promise<void> {
    return this.engine.publish(topic, payload, options);
  }

  registerSubscription<T = unknown>(
    topic: string,
    group: string,
    handler: Handler<T>,
  ): void {
    this.engine.registerSubscription(
      topic,
      group,
      handler as Handler<JsonValue>,
    );
  }

  startSubscriptions(): Promise<void> {
    return this.engine.startSubscriptions();
  }

  stopSubscriptions(): Promise<void> {
    return this.engine.stopSubscriptions();
  }

  getSubscriptionLifecycle(): CapSubscriptionLifecycleSnapshot {
    return this.engine.getSubscriptionLifecycle();
  }

  subscribe<T = unknown>(
    topic: string,
    group: string,
    handler: Handler<T>,
  ): Promise<void> {
    return this.engine.subscribe(topic, group, handler as Handler<JsonValue>);
  }

  transaction<T>(
    fn: (ctx: CapOperationContext) => Promise<T>,
    options?: CapTransactionOptions,
  ): Promise<T> {
    return this.engine.transaction(fn, options);
  }

  retryReceived(rec: CapReceivedEvent): Promise<void> {
    return this.engine.retryReceived(rec);
  }

  dispatchOutboxBatch(): Promise<number> {
    return this.engine.dispatchOutboxBatch();
  }

  retryInboxBatch(): Promise<number> {
    return this.engine.retryInboxBatch();
  }

  close(): Promise<void> {
    return this.engine.close();
  }
}

export function createNestLogger(context: string): CapLogger {
  const logger = new Logger(context);
  return {
    debug(message: string): void {
      logger.debug(message);
    },
    info(message: string): void {
      logger.verbose(message);
    },
    warn(message: string): void {
      logger.warn(message);
    },
    error(message: string, error?: unknown): void {
      logger.error(message, error instanceof Error ? error.stack : error);
    },
  };
}
