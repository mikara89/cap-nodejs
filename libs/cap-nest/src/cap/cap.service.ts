import { Injectable, Inject, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';

import {
  IPublishStorage,
  IReceivedStorage,
  PUBLISH_STORAGE,
  RECEIVED_STORAGE,
  ITransactionalPublishStorage,
} from './abstractions/storage.interface';
import { ITransactionalPublisher } from './abstractions/transport.interface';

import {
  IPublisher,
  ISubscriber,
  PUBLISHER,
  SUBSCRIBER,
} from './abstractions/transport.interface';

import { CapHeaders } from './models/cap-headers.type';
import { CapPublishEvent } from './models/cap-publish-event';
import { CapReceivedEvent } from './models/cap-received-event';

import { expJitter } from './scheduler/backoff.util';

/* ------------------------------------------------------------------ */
/* Local helper types                                                 */
/* ------------------------------------------------------------------ */
type Handler<T = unknown> = (payload: T) => Promise<void>;

type HandlerMap = Map<
  string /*topic*/,
  Map<string /*group*/, Handler<unknown>>
>;

/* ================================================================== */
/*                        CapService (core)                           */
/* ================================================================== */
@Injectable()
export class CapService {
  private readonly log = new Logger(CapService.name);

  /** in-process registry for inbox retries */
  private readonly handlers: HandlerMap = new Map();

  /* -------------------------------------------------------------- */
  /*  ctor – inject abstract storage & transport                    */
  /* -------------------------------------------------------------- */
  constructor(
    /* durable storage */
    @Inject(PUBLISH_STORAGE) private readonly pubStore: IPublishStorage,
    @Inject(RECEIVED_STORAGE) private readonly recStore: IReceivedStorage,

    /* message bus */
    @Inject(PUBLISHER) private readonly publisher: IPublisher,
    @Inject(SUBSCRIBER) private readonly subscriber: ISubscriber,
  ) { }

  /* ==============================================================
   *  PUBLIC – PUBLISH
   * ============================================================ */
  async publish<T>(
    topic: string,
    payload: T,
    headers?: CapHeaders,
    tx?: unknown,
  ): Promise<void> {
    const evt: CapPublishEvent<T> = {
      id: randomUUID(),
      topic,
      occurredAt: new Date().toISOString(),
      payload,
      headers,
      retryCount: 0,
    };

    // If a transaction/context is provided and the storage adapter
    // implements the transactional API, prefer saving inside the
    // provided tx. This lets adapters opt-in to transactional writes
    // without breaking backwards compatibility.
    const isTransactional = (s: unknown): s is ITransactionalPublishStorage => {
      return (
        Boolean(s) &&
        typeof (s as ITransactionalPublishStorage).savePublishWithTx ===
        'function'
      );
    };

    let dbId: string;
    if (tx && isTransactional(this.pubStore)) {
      dbId = await this.pubStore.savePublishWithTx(evt, tx);
    } else {
      dbId = await this.pubStore.savePublish(evt);
    }

    try {
      const isTransactionalPublisher = (p: unknown): p is ITransactionalPublisher => {
        return Boolean(p) && typeof (p as ITransactionalPublisher).emitWithTx === 'function';
      };

      if (tx && isTransactionalPublisher(this.publisher)) {
        await (this.publisher as ITransactionalPublisher).emitWithTx(
          topic,
          payload,
          tx,
        );
      } else {
        await this.publisher.emit(topic, payload, tx);
      }
      await this.pubStore.markPublished(dbId);
      this.log.debug(`✓ published #${dbId} ${topic}`);
    } catch (err) {
      // leave unpublished; scheduler will retry
      this.log.error(`✗ publish failed #${dbId} (${topic})`, err);
    }
  }

  /* ==============================================================
   *  PUBLIC – SUBSCRIBE  (called by CapSubscriberScanner)
   * ============================================================ */
  subscribe<T>(topic: string, group: string, handler: Handler<T>): void {
    this.registerHandler(topic, group, handler as Handler<unknown>);

    this.subscriber
      .consume(topic, group, async (msg) => {
        const rec = await this.persistReceived<T>(topic, group, msg as T);
        await this.tryHandle<T>(rec, handler);
      })
      .catch((err) =>
        this.log.error(`Subscriber attach failed (${topic}|${group})`, err),
      );
  }

  /* ==============================================================
   *  CALLED BY SCHEDULER  – re-executes failed handlers
   * ============================================================ */
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

  /* ==============================================================
   *  Internal helpers
   * ============================================================ */

  private registerHandler(
    topic: string,
    group: string,
    handler: Handler<unknown>,
  ): void {
    if (!this.handlers.has(topic)) this.handlers.set(topic, new Map());
    const groupHandlers = this.handlers.get(topic);
    if (!groupHandlers) {
      throw new Error('CapService: registerHandler - groupHandlers missing');
    }

    groupHandlers.set(group, handler);
  }

  /** write inbox row to storage */
  private async persistReceived<T>(
    topic: string,
    group: string,
    payload: T,
  ): Promise<CapReceivedEvent<T>> {
    const rec: CapReceivedEvent<T> = {
      id: randomUUID(),
      topic,
      group,
      occurredAt: new Date().toISOString(),
      payload,
      headers: undefined,
      retryCount: 0,
      processed: false,
      nextRetry: null,
    };
    await this.recStore.saveReceived(rec);
    return rec;
  }

  /** attempt handler – on fail, schedule next retry */
  private async tryHandle<T>(
    rec: CapReceivedEvent<T>,
    handler: Handler<T>,
  ): Promise<void> {
    try {
      await handler(rec.payload);
      await this.recStore.markProcessed(rec.id);
      this.log.debug(`✓ processed #${rec.id} (${rec.topic}|${rec.group})`);
    } catch (err) {
      const nextDelay = expJitter(rec.retryCount);
      const nextTime = new Date(Date.now() + nextDelay);

      await this.recStore.scheduleRetry(rec.id, rec.retryCount + 1, nextTime);

      this.log.error(
        `✗ handler failed #${rec.id}; retry ${rec.retryCount + 1} at ${nextTime.toISOString()}`,
        err,
      );
    }
  }
}
