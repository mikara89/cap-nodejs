import { Injectable, Inject, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';

import {
  IPublishStorage,
  IReceivedStorage,
  PUBLISH_STORAGE,
  RECEIVED_STORAGE,
  ITransactionalPublishStorage,
} from './abstractions/storage.interface';
import {
  IPublisher,
  ISubscriber,
  PUBLISHER,
  SUBSCRIBER,
  CapDeliveryMetadata,
} from './abstractions/transport.interface';
import { CapHeaders } from './models/cap-headers.type';
import { CapPublishEvent } from './models/cap-publish-event';
import { CapReceivedEvent } from './models/cap-received-event';
import { JsonValue } from './models/json-value.type';
import { expJitter } from './scheduler/backoff.util';

type Handler<T = unknown> = (payload: T, headers?: CapHeaders) => Promise<void>;

type HandlerMap = Map<string, Map<string, Handler<unknown>>>;

export interface CapPublishOptions {
  headers?: CapHeaders;
  tx?: unknown;
  immediate?: boolean;
}

@Injectable()
export class CapService {
  private readonly log = new Logger(CapService.name);
  private readonly handlers: HandlerMap = new Map();

  constructor(
    @Inject(PUBLISH_STORAGE) private readonly pubStore: IPublishStorage,
    @Inject(RECEIVED_STORAGE) private readonly recStore: IReceivedStorage,
    @Inject(PUBLISHER) private readonly publisher: IPublisher,
    @Inject(SUBSCRIBER) private readonly subscriber: ISubscriber,
  ) {}

  async publish<T = JsonValue>(
    topic: string,
    payload: T,
    options: CapPublishOptions = {},
  ): Promise<void> {
    const evt: CapPublishEvent<JsonValue> = {
      id: randomUUID(),
      topic,
      occurredAt: new Date().toISOString(),
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

    const isTransactional = (s: unknown): s is ITransactionalPublishStorage =>
      Boolean(s) &&
      typeof (s as ITransactionalPublishStorage).savePublishWithTx ===
        'function';

    const dbId =
      options.tx && isTransactional(this.pubStore)
        ? await this.pubStore.savePublishWithTx(evt, options.tx)
        : await this.pubStore.savePublish(evt);

    if (options.tx && options.immediate !== true) {
      this.log.debug(
        `tx provided; deferring broker emit until scheduler claims #${dbId} ${topic}`,
      );
      return;
    }

    if (options.immediate === true || !options.tx) {
      await this.emitPersistedEvent({ ...evt, id: dbId });
    }
  }

  subscribe<T = unknown>(
    topic: string,
    group: string,
    handler: Handler<T>,
  ): void {
    this.registerHandler(topic, group, handler as Handler<unknown>);

    this.subscriber
      .consume(topic, group, async (msg, headers, metadata) => {
        const saved = await this.persistReceived<T>(
          topic,
          group,
          msg as T,
          headers,
          metadata,
        );

        if (!saved.inserted) {
          this.log.debug(
            `duplicate delivery skipped #${saved.id} (${topic}|${group})`,
          );
          return;
        }

        await this.tryHandle<T>(saved.event as CapReceivedEvent<T>, handler);
      })
      .catch((err) =>
        this.log.error(`Subscriber attach failed (${topic}|${group})`, err),
      );
  }

  async retryReceived(rec: CapReceivedEvent): Promise<void> {
    const handler = this.handlers.get(rec.topic)?.get(rec.group);
    if (!handler) {
      this.log.warn(
        `No handler registered for ${rec.topic}|${rec.group}; skipping retry`,
      );
      return;
    }
    await this.tryHandle(rec, handler);
  }

  private async emitPersistedEvent(evt: CapPublishEvent<JsonValue>): Promise<void> {
    try {
      const headers = withCapMessageId(evt.headers, evt.id);
      await this.publisher.emit(evt.topic, evt.payload, headers, {
        messageId: evt.id,
      });
      await this.pubStore.markPublished(evt.id, new Date());
      this.log.debug(`published #${evt.id} ${evt.topic}`);
    } catch (err) {
      await this.pubStore.markPublishFailed(evt.id, err, {
        maxRetries: 3,
        nextRetryAt: new Date(Date.now() + expJitter(evt.retryCount)),
        now: new Date(),
      });
      this.log.error(`publish failed #${evt.id} (${evt.topic})`, err);
    }
  }

  private registerHandler(
    topic: string,
    group: string,
    handler: Handler<unknown>,
  ): void {
    if (!this.handlers.has(topic)) this.handlers.set(topic, new Map());
    this.handlers.get(topic)?.set(group, handler);
  }

  private async persistReceived<T>(
    topic: string,
    group: string,
    payload: T,
    headers?: CapHeaders,
    metadata?: CapDeliveryMetadata,
  ) {
    const unwrapped = unwrapMessage(payload, headers);
    const messageId =
      metadata?.messageId ??
      getHeaderString(unwrapped.headers, 'cap-message-id') ??
      randomUUID();
    const dedupeKey =
      metadata?.dedupeKey ?? `${topic}|${group}|${String(messageId)}`;

    const rec: CapReceivedEvent<JsonValue> = {
      id: randomUUID(),
      topic,
      group,
      messageId: String(messageId),
      dedupeKey,
      occurredAt: new Date().toISOString(),
      payload: unwrapped.payload,
      headers: unwrapped.headers,
      retryCount: 0,
      processed: false,
      nextRetry: null,
    };

    return this.recStore.trySaveReceived(rec);
  }

  private async tryHandle<T>(
    rec: CapReceivedEvent<T>,
    handler: Handler<T>,
  ): Promise<void> {
    try {
      await handler(rec.payload, rec.headers);
      await this.recStore.markProcessed(rec.id);
      this.log.debug(`processed #${rec.id} (${rec.topic}|${rec.group})`);
    } catch (err) {
      const nextDelay = expJitter(rec.retryCount);
      const nextTime = new Date(Date.now() + nextDelay);
      await this.recStore.scheduleRetry(rec.id, rec.retryCount + 1, nextTime);
      rec.retryCount += 1;
      rec.nextRetry = nextTime;

      this.log.error(
        `handler failed #${rec.id}; retry ${rec.retryCount} at ${nextTime.toISOString()}`,
        err,
      );
    }
  }
}

function withCapMessageId(
  headers: CapHeaders | undefined,
  messageId: string,
): CapHeaders {
  return { ...(headers ?? {}), 'cap-message-id': messageId };
}

function getHeaderString(
  headers: CapHeaders | undefined,
  key: string,
): string | undefined {
  const value = headers?.[key];
  return value === undefined ? undefined : String(value);
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
