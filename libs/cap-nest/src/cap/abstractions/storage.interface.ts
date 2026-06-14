import { type CapPublishEvent } from '../models/cap-publish-event';
import { type CapReceivedEvent } from '../models/cap-received-event';
import { type JsonValue } from '../models/json-value.type';
import type { InitOptions } from './initializer.interface';

/** IoC tokens - easier than string literals */
export const PUBLISH_STORAGE = Symbol('CAP_PUBLISH_STORAGE');
export const RECEIVED_STORAGE = Symbol('CAP_RECEIVED_STORAGE');

export interface ClaimUnpublishedOptions {
  limit: number;
  lockedBy: string;
  lockUntil: Date;
  now: Date;
}

export interface MarkPublishFailedOptions {
  maxRetries: number;
  nextRetryAt: Date;
  now: Date;
}

export interface TrySaveReceivedResult<T extends JsonValue = JsonValue> {
  inserted: boolean;
  id: string;
  event: CapReceivedEvent<T>;
}

/*------------------------------------------------------------------
 | Outbox - messages we PRODUCE
 *-----------------------------------------------------------------*/
export interface IPublishStorage {
  /** Insert a fresh outbox record and return its DB id */
  savePublish<T extends JsonValue = JsonValue>(
    evt: CapPublishEvent<T>,
  ): Promise<string>;

  /** Optional one-time initialization: create schema/tables if needed */
  initialize?(options?: InitOptions): Promise<void>;

  /** Atomically claim ready rows for one dispatcher instance. */
  claimUnpublished(
    options: ClaimUnpublishedOptions,
  ): Promise<Array<CapPublishEvent>>;

  /** Mark record as successfully emitted to the broker. */
  markPublished(id: string, publishedAt?: Date): Promise<void>;

  /** Mark record as retryable failed, or dead-letter when retry limit is exceeded. */
  markPublishFailed(
    id: string,
    error: unknown,
    options: MarkPublishFailedOptions,
  ): Promise<void>;

  /** Release processing rows whose lease has expired. */
  releaseExpiredClaims(now: Date): Promise<void>;

  /** Optional: find a published record by id (dashboard helpers) */
  findPublishById?(id: string): Promise<CapPublishEvent | undefined>;

  /** Optional: paginated listing for dashboards and admin UIs */
  listPublish?(opts: {
    limit?: number;
    offset?: number;
    topic?: string;
    onlyUnpublished?: boolean;
  }): Promise<{ items: Array<CapPublishEvent>; total?: number }>;
}

/*------------------------------------------------------------------
 | Optional transactional extension
 *-----------------------------------------------------------------*/
export interface ITransactionalPublishStorage extends IPublishStorage {
  savePublishWithTx<T extends JsonValue = JsonValue>(
    evt: CapPublishEvent<T>,
    tx: unknown,
  ): Promise<string>;
}

/*------------------------------------------------------------------
 | Inbox - messages we CONSUME
 *-----------------------------------------------------------------*/
export interface IReceivedStorage {
  /**
   * Persist a delivery if its dedupe identity has not been seen.
   * Duplicate deliveries return inserted=false and must not re-run handlers.
   */
  trySaveReceived<T extends JsonValue = JsonValue>(
    evt: CapReceivedEvent<T>,
  ): Promise<TrySaveReceivedResult<T>>;

  /** Optional one-time initialization: create schema/tables if needed */
  initialize?(options?: InitOptions): Promise<void>;

  /** Mark processed=true */
  markProcessed(id: string): Promise<void>;

  /**
   * Return records that are not yet processed and
   * whose nextRetry timestamp <= now. Scheduler uses this.
   */
  getRetryDue(limit: number): Promise<Array<CapReceivedEvent>>;

  /**
   * Schedule a retry for a given event.
   */
  scheduleRetry(id: string, retryCount: number, nextRetry: Date): Promise<void>;

  /** Optional: find a received record by id (dashboard helpers) */
  findReceivedById?(id: string): Promise<CapReceivedEvent | undefined>;

  /** Optional: paginated listing for dashboards and admin UIs */
  listReceived?(opts: {
    limit?: number;
    offset?: number;
    topic?: string;
    due?: boolean;
  }): Promise<{ items: Array<CapReceivedEvent>; total?: number }>;
}

export { CapReceivedEvent };
