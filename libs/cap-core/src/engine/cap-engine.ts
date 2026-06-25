import { randomUUID } from 'crypto';

import {
  getCapMessageId,
  withCapMessageId,
} from '../utils/cap-message-id.util';
import { createDedupeKey } from '../utils/dedupe-key.util';
import { normalizeError } from '../utils/error.util';
import { resolveOperationContext } from '../utils/operation-context.util';
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
type HandlerMap = Map<string, Map<string, Handler<JsonValue>>>;

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
  private readonly handlers: HandlerMap = new Map();

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

  subscribe<T = unknown>(
    topic: string,
    group: string,
    handler: Handler<T>,
  ): void {
    this.registerHandler(topic, group, (payload, headers) =>
      handler(payload as T, headers),
    );

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
          this.logger.debug?.(
            `duplicate delivery skipped #${saved.id} (${topic}|${group})`,
          );
          return;
        }

        await this.tryHandle<T>(saved.event as CapReceivedEvent<T>, handler);
      })
      .catch((err: unknown) =>
        this.logger.error?.(
          `Subscriber attach failed (${topic}|${group})`,
          err,
        ),
      );
  }

  async retryReceived(rec: CapReceivedEvent): Promise<void> {
    const handler = this.handlers.get(rec.topic)?.get(rec.group);
    if (!handler) {
      this.logger.warn?.(
        `No handler registered for ${rec.topic}|${rec.group}; skipping retry`,
      );
      return;
    }
    await this.tryHandle(rec, handler);
  }

  async dispatchOutboxBatch(): Promise<number> {
    if (this.schedulerOptions.disabled) return 0;

    const now = this.now();
    await this.publishStorage.releaseExpiredClaims(now);

    const batch = await this.publishStorage.claimUnpublished({
      limit: this.schedulerOptions.batchSize,
      lockedBy: this.schedulerOptions.instanceId,
      lockUntil: new Date(now.getTime() + this.schedulerOptions.leaseMs),
      now,
    });

    if (batch.length) {
      this.logger.info?.(`Outbox flush - attempting ${batch.length} msg(s)`);
    }

    for (const evt of batch) {
      await this.emitPersistedEvent(evt, 'outbox');
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

  async close(): Promise<void> {
    await this.subscriber.close?.();
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

  private registerHandler(
    topic: string,
    group: string,
    handler: Handler<JsonValue>,
  ): void {
    if (!this.handlers.has(topic)) this.handlers.set(topic, new Map());
    this.handlers.get(topic)?.set(group, handler);
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
