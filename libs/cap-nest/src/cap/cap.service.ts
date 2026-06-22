import { Injectable, Logger } from '@nestjs/common';
import {
  CapEngine,
  type CapLogger,
  type CapPublishOptions,
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
  maxRetries: 3,
  maxInboxRetries: 3,
  instanceId: 'cap-service-default',
  disabled: false,
};

export type { CapPublishOptions } from '@mikara89/cap-core';

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

  subscribe<T = unknown>(
    topic: string,
    group: string,
    handler: Handler<T>,
  ): void {
    this.engine.subscribe(topic, group, handler as Handler<JsonValue>);
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
